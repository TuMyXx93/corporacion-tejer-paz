import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetRateLimitStore } from '@/lib/security/rateLimiter';

const { mockGetDb, mockDbInsertValues, mockResendSend } = vi.hoisted(() => ({
  mockGetDb: vi.fn(),
  mockDbInsertValues: vi.fn(),
  mockResendSend: vi.fn(),
}));

vi.mock('@/db', () => ({
  getDb: mockGetDb,
}));

vi.mock('@/db/schema', () => ({
  contactMessages: { name: 'contact_messages' },
}));

vi.mock('resend', () => ({
  Resend: class MockResend {
    emails = {
      send: mockResendSend,
    };
  },
}));

import { POST } from '@/app/api/contact/route';

function makeValidBody(overrides: Record<string, unknown> = {}) {
  return {
    firstName: 'Camila',
    lastName: 'Paz',
    email: 'camila@comunidad.org',
    subject: 'Consulta sobre talleres juveniles',
    message: 'Queremos coordinar un diálogo comunitario en el territorio.',
    ...overrides,
  };
}

function makeJsonRequest(
  body: unknown,
  headers: Record<string, string> = { 'x-forwarded-for': '198.51.100.10' }
): Request {
  return new Request('http://localhost:3000/api/contact', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

describe('POST /api/contact', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRateLimitStore();
    mockGetDb.mockReturnValue(null);
    vi.stubEnv('RESEND_API_KEY', '');
    vi.stubEnv('CONTACT_TO_EMAIL', '');
    vi.stubEnv('CONTACT_FROM_EMAIL', '');
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('returns 413 when content-length exceeds 16 KiB', async () => {
    const req = new Request('http://localhost:3000/api/contact', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'content-length': '20000',
      },
      body: JSON.stringify(makeValidBody()),
    });
    const res = await POST(req);
    expect(res.status).toBe(413);
  });

  it('returns 413 when streamed body exceeds 16 KiB without content-length', async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(17_000).fill(97));
        controller.close();
      },
    });
    const req = new Request('http://localhost:3000/api/contact', {
      method: 'POST',
      body: stream,
      duplex: 'half',
    } as RequestInit);

    const res = await POST(req);
    expect(res.status).toBe(413);
  });

  it('returns 400 on malformed JSON', async () => {
    const res = await POST(makeJsonRequest('{broken-json'));
    expect(res.status).toBe(400);
  });

  it('returns 400 with field details when Zod validation fails', async () => {
    const res = await POST(makeJsonRequest({ firstName: 'A', email: 'bad' }));
    expect(res.status).toBe(400);
    const json = (await res.json()) as { details?: Array<{ field: string }> };
    expect(Array.isArray(json.details)).toBe(true);
    expect(json.details!.length).toBeGreaterThan(0);
  });

  it('enforces rate limit (429) after 5 requests from the same IP', async () => {
    mockGetDb.mockReturnValue({
      insert: () => ({ values: mockDbInsertValues.mockResolvedValue(undefined) }),
    });

    for (let i = 0; i < 5; i++) {
      const okRes = await POST(
        makeJsonRequest(makeValidBody(), { 'x-real-ip': '203.0.113.5' })
      );
      expect(okRes.status).toBe(200);
    }

    const blocked = await POST(
      makeJsonRequest(makeValidBody(), { 'x-real-ip': '203.0.113.5' })
    );
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get('Retry-After')).toBeTruthy();
    expect(blocked.headers.get('X-RateLimit-Remaining')).toBe('0');
  });

  it('returns silent 200 when honeypot field is filled without calling Resend or DB', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test_123');
    vi.stubEnv('CONTACT_TO_EMAIL', 'inbox@tejerpaz.org');
    mockGetDb.mockReturnValue({
      insert: () => ({ values: mockDbInsertValues }),
    });

    const res = await POST(
      makeJsonRequest(makeValidBody({ website: 'https://spam-bot.invalid' }))
    );
    expect(res.status).toBe(200);
    expect(mockResendSend).not.toHaveBeenCalled();
    expect(mockDbInsertValues).not.toHaveBeenCalled();
  });

  it('returns 503 when neither DB nor Resend can process the message', async () => {
    const res = await POST(makeJsonRequest(makeValidBody()));
    expect(res.status).toBe(503);
  });

  it('sends sanitized HTML via Resend and persists in DB when both are configured', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test_123');
    vi.stubEnv('CONTACT_TO_EMAIL', 'correoprueba1993@gmail.com');
    vi.stubEnv('CONTACT_FROM_EMAIL', 'onboarding@resend.dev');
    mockResendSend.mockResolvedValueOnce({ data: { id: 'email-1' }, error: null });
    mockGetDb.mockReturnValue({
      insert: () => ({ values: mockDbInsertValues.mockResolvedValueOnce(undefined) }),
    });

    const res = await POST(
      makeJsonRequest(
        makeValidBody({
          subject: 'Taller\r\nBcc: attacker@evil.test',
          message: 'Mensaje con <script>alert(1)</script> contenido real.',
        })
      )
    );

    expect(res.status).toBe(200);
    expect(mockResendSend).toHaveBeenCalledTimes(1);
    const sendPayload = mockResendSend.mock.calls[0][0] as {
      subject: string;
      html: string;
    };
    expect(sendPayload.subject).not.toContain('\r');
    expect(sendPayload.subject).not.toContain('\n');
    expect(sendPayload.html).not.toContain('<script>');
    expect(mockDbInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({ emailSent: true, status: 'new' })
    );
  });

  it('still returns 200 if Resend fails or throws as long as DB saves the message', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test_123');
    vi.stubEnv('CONTACT_TO_EMAIL', 'correoprueba1993@gmail.com');
    mockResendSend.mockResolvedValueOnce({
      data: null,
      error: { name: 'validation_error', message: 'sandbox only' },
    });
    mockGetDb.mockReturnValue({
      insert: () => ({ values: mockDbInsertValues.mockResolvedValueOnce(undefined) }),
    });

    const resError = await POST(makeJsonRequest(makeValidBody()));
    expect(resError.status).toBe(200);
    expect(mockDbInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({ emailSent: false })
    );

    mockResendSend.mockRejectedValueOnce(new Error('network timeout'));
    mockDbInsertValues.mockResolvedValueOnce(undefined);
    const resThrow = await POST(
      makeJsonRequest(makeValidBody(), { 'x-forwarded-for': '198.51.100.25' })
    );
    expect(resThrow.status).toBe(200);
  });
});
