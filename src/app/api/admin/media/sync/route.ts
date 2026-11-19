import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { desc } from 'drizzle-orm';
import { requireDb } from '@/db';
import { mediaAssets } from '@/db/schema';
import { recordAuditLog, requireApiPermission } from '@/lib/auth/guards';
import { SITE_CONTENT_CACHE_TAG } from '@/lib/content/queries';
import { isStorageConfigured } from '@/lib/storage';
import {
  migrateLocalImagesToBlob,
  syncBlobStoreToDatabase,
} from '@/lib/storage/blob-sync';

export async function POST(request: Request) {
  const guard = await requireApiPermission('media', 'create');
  if (!guard.ok) return guard.response;

  if (!isStorageConfigured()) {
    return NextResponse.json(
      {
        error:
          'BLOB_READ_WRITE_TOKEN no está configurado. Configúralo para sincronizar Vercel Blob.',
      },
      { status: 503 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    migrateLocal?: boolean;
  };

  try {
    const syncResult = await syncBlobStoreToDatabase();
    let migrated = {
      uploadedCount: 0,
      reusedCount: 0,
      updatedReferences: 0,
    };

    if (body.migrateLocal) {
      const migrateResult = await migrateLocalImagesToBlob();
      migrated = {
        uploadedCount: migrateResult.uploadedCount,
        reusedCount: migrateResult.reusedCount,
        updatedReferences: migrateResult.updatedReferences,
      };
      revalidateTag(SITE_CONTENT_CACHE_TAG, 'max');
      revalidatePath('/');
      revalidatePath('/proyectos');
    }

    const db = requireDb();
    const assets = await db
      .select()
      .from(mediaAssets)
      .orderBy(desc(mediaAssets.createdAt))
      .limit(200);

    await recordAuditLog({
      actor: guard.actor,
      action: body.migrateLocal ? 'media.migrate' : 'media.sync',
      resourceType: 'media_assets',
      resourceId: 'vercel-blob',
      summary: `Sincronización Vercel Blob (+${syncResult.syncedCount} nuevos, ${migrated.uploadedCount} migrados)`,
    });

    return NextResponse.json({
      ok: true,
      syncedCount: syncResult.syncedCount,
      updatedSizeCount: syncResult.updatedSizeCount,
      uploadedCount: migrated.uploadedCount,
      reusedCount: migrated.reusedCount,
      updatedReferences: migrated.updatedReferences,
      assets,
    });
  } catch (err) {
    console.error('[media_sync_error]', err);
    return NextResponse.json(
      { error: 'No se pudo completar la sincronización con Vercel Blob.' },
      { status: 500 }
    );
  }
}
