import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getDb } from '@/db';
import { contactMessages } from '@/db/schema';
import { contactSchema, escapeHtmlText, sanitizeHeaderText } from '@/lib/contact/schema';
import { checkRateLimit } from '@/lib/security/rateLimiter';

const MAX_BODY_BYTES = 16_384;

async function readBoundedJson(request: Request): Promise<unknown> {
  const contentLength = request.headers.get('content-length');
  if (contentLength && Number(contentLength) > MAX_BODY_BYTES) {
    throw new Error('PAYLOAD_TOO_LARGE');
  }

  const reader = request.body?.getReader();
  if (!reader) {
    return {};
  }

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > MAX_BODY_BYTES) {
      await reader.cancel();
      throw new Error('PAYLOAD_TOO_LARGE');
    }
    chunks.push(value);
  }

  const combined = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }

  const text = new TextDecoder().decode(combined);
  return JSON.parse(text);
}

function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'unknown';
  }
  return request.headers.get('x-real-ip')?.trim() || 'unknown';
}

export async function POST(request: Request) {
  const requestId = randomUUID();

  let rawBody: unknown;
  try {
    rawBody = await readBoundedJson(request);
  } catch (err) {
    if (err instanceof Error && err.message === 'PAYLOAD_TOO_LARGE') {
      return NextResponse.json(
        { error: 'El mensaje excede el tamaño permitido.' },
        { status: 413 }
      );
    }
    return NextResponse.json({ error: 'Solicitud JSON inválida.' }, { status: 400 });
  }

  const rate = checkRateLimit(getClientIp(request));
  if (!rate.allowed) {
    const retryAfterSec = Math.max(1, Math.ceil((rate.resetAt - Date.now()) / 1000));
    return NextResponse.json(
      { error: 'Demasiados intentos. Por favor intenta nuevamente en un minuto.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfterSec),
          'X-RateLimit-Limit': String(rate.limit),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  const parsed = contactSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Por favor revisa los campos del formulario.',
        details: parsed.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // Honeypot triggered: fake 200 without persisting or emailing
  if (data.website && data.website.trim().length > 0) {
    console.info(JSON.stringify({ event: 'contact_honeypot_blocked', requestId }));
    return NextResponse.json({ ok: true, requestId }, { status: 200 });
  }

  let savedToDb = false;
  let emailSent = false;

  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const toEmail = process.env.CONTACT_TO_EMAIL?.trim();
  const fromEmail = process.env.CONTACT_FROM_EMAIL?.trim() || 'onboarding@resend.dev';

  if (resendApiKey && toEmail) {
    try {
      const resend = new Resend(resendApiKey);
      const safeFullName = escapeHtmlText(`${data.firstName} ${data.lastName}`);
      const safeEmail = escapeHtmlText(data.email);
      const safeSubject = escapeHtmlText(data.subject);
      const safeMessage = escapeHtmlText(data.message).replace(/\n/g, '<br />');

      const { error } = await resend.emails.send({
        from: `Corporación Tejer Paz <${fromEmail}>`,
        to: [toEmail],
        replyTo: data.email,
        subject: `[Web Tejer Paz] ${sanitizeHeaderText(data.subject)}`,
        html: `
          <div style="font-family: Arial, sans-serif; color: #4D3F32; line-height: 1.6;">
            <h2 style="margin: 0 0 12px;">Nuevo mensaje desde el sitio web</h2>
            <p><strong>Nombre:</strong> ${safeFullName}</p>
            <p><strong>Correo:</strong> ${safeEmail}</p>
            <p><strong>Asunto:</strong> ${safeSubject}</p>
            <hr style="border: none; border-top: 1px solid #C8C1B8; margin: 16px 0;" />
            <p>${safeMessage}</p>
          </div>
        `,
      });

      if (error) {
        console.error(
          JSON.stringify({ event: 'contact_resend_failed', requestId, code: error.name })
        );
      } else {
        emailSent = true;
      }
    } catch {
      console.error(JSON.stringify({ event: 'contact_resend_exception', requestId }));
    }
  }

  const db = getDb();
  if (db) {
    try {
      await db.insert(contactMessages).values({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        subject: data.subject,
        message: data.message,
        status: 'new',
        emailSent,
      });
      savedToDb = true;
    } catch {
      console.error(JSON.stringify({ event: 'contact_db_error', requestId }));
    }
  }

  if (!savedToDb && !emailSent) {
    return NextResponse.json(
      {
        error:
          'El servicio de mensajería no está disponible en este momento. Puedes escribirnos directamente al correo oficial.',
      },
      { status: 503 }
    );
  }

  console.info(
    JSON.stringify({
      event: 'contact_received',
      requestId,
      savedToDb,
      emailSent,
    })
  );

  return NextResponse.json(
    {
      ok: true,
      requestId,
      message: 'Gracias por escribirnos. Hemos recibido tu mensaje correctamente.',
    },
    { status: 200 }
  );
}
