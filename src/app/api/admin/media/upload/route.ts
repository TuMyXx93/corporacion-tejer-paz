import { NextResponse } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { desc } from 'drizzle-orm';
import { requireDb } from '@/db';
import { mediaAssets } from '@/db/schema';
import { recordAuditLog, requireApiPermission } from '@/lib/auth/guards';
import {
  ALLOWED_UPLOAD_MIME_TYPES,
  MAX_UPLOAD_BYTES,
  getActiveStorageProvider,
  inferAssetTypeFromMime,
  isStorageConfigured,
} from '@/lib/storage';

export async function GET() {
  const guard = await requireApiPermission('media', 'read');
  if (!guard.ok) return guard.response;

  const db = requireDb();
  const rows = await db
    .select()
    .from(mediaAssets)
    .orderBy(desc(mediaAssets.createdAt))
    .limit(200);

  return NextResponse.json({
    provider: getActiveStorageProvider(),
    configured: isStorageConfigured(),
    assets: rows,
  });
}

export async function POST(request: Request) {
  const provider = getActiveStorageProvider();
  if (provider !== 'vercel-blob') {
    return NextResponse.json(
      {
        error:
          'STORAGE_PROVIDER=r2 requiere el adaptador de presigned URLs de Cloudflare R2.',
      },
      { status: 501 }
    );
  }

  if (!isStorageConfigured()) {
    return NextResponse.json(
      {
        error:
          'BLOB_READ_WRITE_TOKEN no está configurado. Añádelo en Vercel Storage o .env.local.',
      },
      { status: 503 }
    );
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async pathname => {
        const guard = await requireApiPermission('media', 'create');
        if (!guard.ok) {
          throw new Error('UNAUTHORIZED');
        }
        return {
          allowedContentTypes: [...ALLOWED_UPLOAD_MIME_TYPES],
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({
            actorId: guard.actor.id,
            actorRole: guard.actor.role,
            pathname,
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        try {
          const parsed = tokenPayload
            ? (JSON.parse(tokenPayload) as {
                actorId?: string;
                actorRole?: string;
              })
            : {};
          const filename = blob.pathname.split('/').pop() || blob.pathname;
          const db = requireDb();
          await db
            .insert(mediaAssets)
            .values({
              url: blob.url,
              pathname: blob.pathname,
              filename,
              title: filename.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '),
              alt: '',
              mimeType: blob.contentType,
              sizeBytes: 0,
              assetType: inferAssetTypeFromMime(blob.contentType),
              storageProvider: 'vercel-blob',
              uploadedByUserId: parsed.actorId ?? null,
            })
            .onConflictDoNothing();

          if (parsed.actorId && parsed.actorRole) {
            await recordAuditLog({
              actor: {
                id: parsed.actorId,
                name: 'admin',
                email: '',
                role: parsed.actorRole === 'superadmin' ? 'superadmin' : 'admin',
              },
              action: 'media.upload',
              resourceType: 'media_assets',
              resourceId: blob.pathname,
              summary: `Subida directa a Vercel Blob: ${blob.pathname}`,
            });
          }
        } catch (err) {
          console.error('[media_upload_completed_error]', err);
        }
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'No se pudo procesar la subida multimedia.' },
      { status: 400 }
    );
  }
}
