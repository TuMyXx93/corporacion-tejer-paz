import { NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { desc, eq } from 'drizzle-orm';
import { requireDb } from '@/db';
import { mediaAssets } from '@/db/schema';
import { recordAuditLog, requireApiPermission } from '@/lib/auth/guards';
import { registerMediaAssetSchema, updateMediaAssetSchema } from '@/lib/cms/schemas';
import { parseVideoEmbed } from '@/lib/media/embeds';
import {
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
  const guard = await requireApiPermission('media', 'create');
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => null);
  const parsed = registerMediaAssetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos de archivo multimedia inválidos.', details: parsed.error.issues },
      { status: 400 }
    );
  }

  const d = parsed.data;
  let canonicalUrl = d.url;
  let pathname = d.pathname;
  let filename = d.filename;
  let assetType = d.assetType;

  if (d.assetType === 'video') {
    const embed = parseVideoEmbed(d.url);
    if (!embed) {
      return NextResponse.json(
        { error: 'Enlace de video inválido: utiliza YouTube o Vimeo con https://.' },
        { status: 400 }
      );
    }
    canonicalUrl = embed.canonicalUrl;
    pathname = `video/${embed.provider}/${embed.videoId || 'external'}`;
    filename = d.title || `${embed.providerLabel} Video`;
  } else {
    assetType = inferAssetTypeFromMime(d.mimeType);
  }

  const db = requireDb();
  const [saved] = await db
    .insert(mediaAssets)
    .values({
      url: canonicalUrl,
      pathname,
      filename,
      title: d.title,
      alt: d.alt,
      mimeType: d.mimeType,
      sizeBytes: d.sizeBytes,
      assetType,
      storageProvider: d.storageProvider,
      uploadedByUserId: guard.actor.id,
    })
    .onConflictDoUpdate({
      target: mediaAssets.url,
      set: {
        title: d.title || filename,
        alt: d.alt,
        sizeBytes: d.sizeBytes > 0 ? d.sizeBytes : undefined,
      },
    })
    .returning();

  await recordAuditLog({
    actor: guard.actor,
    action: 'media.register',
    resourceType: 'media_assets',
    resourceId: String(saved.id),
    summary: `Recurso multimedia registrado (${assetType}): ${saved.filename}`,
  });

  return NextResponse.json({ ok: true, asset: saved }, { status: 201 });
}

export async function PATCH(request: Request) {
  const guard = await requireApiPermission('media', 'update');
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => null);
  const parsed = updateMediaAssetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Metadatos multimedia inválidos.', details: parsed.error.issues },
      { status: 400 }
    );
  }

  const db = requireDb();
  const [updated] = await db
    .update(mediaAssets)
    .set({
      title: parsed.data.title,
      alt: parsed.data.alt,
    })
    .where(eq(mediaAssets.id, parsed.data.id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: 'Recurso no encontrado.' }, { status: 404 });
  }

  await recordAuditLog({
    actor: guard.actor,
    action: 'media.update',
    resourceType: 'media_assets',
    resourceId: String(updated.id),
    summary: `Metadatos actualizados: ${updated.filename}`,
  });

  return NextResponse.json({ ok: true, asset: updated });
}

export async function DELETE(request: Request) {
  const guard = await requireApiPermission('media', 'delete');
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get('id'));
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'ID inválido.' }, { status: 400 });
  }

  const db = requireDb();
  const [asset] = await db
    .select()
    .from(mediaAssets)
    .where(eq(mediaAssets.id, id))
    .limit(1);

  if (!asset) {
    return NextResponse.json({ error: 'Recurso no encontrado.' }, { status: 404 });
  }

  if (asset.storageProvider === 'vercel-blob' && isStorageConfigured()) {
    try {
      await del(asset.url);
    } catch (err) {
      console.warn('[media_delete_blob_warning]', err);
    }
  }

  await db.delete(mediaAssets).where(eq(mediaAssets.id, id));

  await recordAuditLog({
    actor: guard.actor,
    action: 'media.delete',
    resourceType: 'media_assets',
    resourceId: String(id),
    summary: `Recurso multimedia eliminado: ${asset.filename}`,
  });

  return NextResponse.json({ ok: true });
}
