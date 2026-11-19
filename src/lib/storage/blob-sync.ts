import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { list, put } from '@vercel/blob';
import { eq } from 'drizzle-orm';
import {
  DEFAULT_ACTION_AREAS,
  DEFAULT_PAGE_SECTIONS,
  DEFAULT_PROJECTS,
  DEFAULT_SITE_SETTINGS,
} from '@/data/default-content';
import { requireDb } from '@/db';
import {
  actionAreas,
  mediaAssets,
  pageSections,
  projects,
  siteSettings,
} from '@/db/schema';
import {
  inferAssetTypeFromMime,
  inferMimeFromPathname,
  isStorageConfigured,
} from '@/lib/storage';

const INITIAL_BLOB_PREFIX = 'media/initial/';

const KNOWN_LOCAL_IMAGE_METADATA: Record<string, { title: string; alt: string }> =
  (() => {
    const map: Record<string, { title: string; alt: string }> = {};
    map[DEFAULT_SITE_SETTINGS.logoUrl] = {
      title: 'Logotipo Oficial Corporación Tejer Paz',
      alt: DEFAULT_SITE_SETTINGS.logoAlt,
    };
    for (const section of Object.values(DEFAULT_PAGE_SECTIONS)) {
      if (section.imageUrl && section.imageAlt) {
        map[section.imageUrl] = {
          title: section.title,
          alt: section.imageAlt,
        };
      }
    }
    for (const area of DEFAULT_ACTION_AREAS) {
      map[area.imageUrl] = {
        title: area.title,
        alt: area.imageAlt,
      };
    }
    for (const project of DEFAULT_PROJECTS) {
      map[project.imageUrl] = {
        title: `${project.numberLabel} · ${project.title}`,
        alt: project.imageAlt,
      };
    }
    return map;
  })();

function deriveReadableTitle(filename: string): string {
  const base = filename
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .trim();
  if (!base) return 'Recurso multimedia';
  return base.charAt(0).toUpperCase() + base.slice(1);
}

async function listAllStoreBlobs() {
  const allBlobs: Array<{
    url: string;
    pathname: string;
    size: number;
  }> = [];

  let cursor: string | undefined;
  let hasMore = true;

  while (hasMore) {
    const result = await list({ limit: 500, cursor });
    for (const blob of result.blobs) {
      allBlobs.push({
        url: blob.url,
        pathname: blob.pathname,
        size: blob.size,
      });
    }
    cursor = result.cursor;
    hasMore = Boolean(result.hasMore && result.cursor);
  }

  return allBlobs;
}

export async function syncBlobStoreToDatabase(): Promise<{
  syncedCount: number;
  updatedSizeCount: number;
}> {
  if (!isStorageConfigured()) {
    return { syncedCount: 0, updatedSizeCount: 0 };
  }

  const db = requireDb();
  const blobs = await listAllStoreBlobs();
  const existingRows = await db
    .select({
      id: mediaAssets.id,
      url: mediaAssets.url,
      sizeBytes: mediaAssets.sizeBytes,
    })
    .from(mediaAssets);

  const existingByUrl = new Map(existingRows.map(r => [r.url, r]));
  let syncedCount = 0;
  let updatedSizeCount = 0;

  for (const blob of blobs) {
    const mimeType = inferMimeFromPathname(blob.pathname);
    const filename = blob.pathname.split('/').pop() || blob.pathname;
    const localKey = `/images/${filename}`;
    const knownMeta = KNOWN_LOCAL_IMAGE_METADATA[localKey];
    const title = knownMeta?.title || deriveReadableTitle(filename);
    const alt = knownMeta?.alt || '';

    const existing = existingByUrl.get(blob.url);
    if (!existing) {
      await db
        .insert(mediaAssets)
        .values({
          url: blob.url,
          pathname: blob.pathname,
          filename,
          title,
          alt,
          mimeType,
          sizeBytes: blob.size,
          assetType: inferAssetTypeFromMime(mimeType),
          storageProvider: 'vercel-blob',
        })
        .onConflictDoNothing();
      syncedCount += 1;
    } else if (existing.sizeBytes === 0 && blob.size > 0) {
      await db
        .update(mediaAssets)
        .set({ sizeBytes: blob.size })
        .where(eq(mediaAssets.id, existing.id));
      updatedSizeCount += 1;
    }
  }

  return { syncedCount, updatedSizeCount };
}

export async function migrateLocalImagesToBlob(): Promise<{
  uploadedCount: number;
  reusedCount: number;
  updatedReferences: number;
  urlMap: Record<string, string>;
}> {
  if (!isStorageConfigured()) {
    throw new Error('BLOB_READ_WRITE_TOKEN no configurado para migrar imágenes.');
  }

  const db = requireDb();
  const publicImagesDir = path.join(process.cwd(), 'public', 'images');
  if (!existsSync(publicImagesDir)) {
    return { uploadedCount: 0, reusedCount: 0, updatedReferences: 0, urlMap: {} };
  }

  const entries = await readdir(publicImagesDir, { withFileTypes: true });
  const imageFiles = entries
    .filter(e => e.isFile() && /\.(png|jpe?g|webp|avif)$/i.test(e.name))
    .map(e => e.name)
    .sort();

  const blobs = await listAllStoreBlobs();
  const blobByPathname = new Map(blobs.map(b => [b.pathname, b]));

  const urlMap: Record<string, string> = {};
  let uploadedCount = 0;
  let reusedCount = 0;

  for (const filename of imageFiles) {
    const localPath = `/images/${filename}`;
    const targetBlobPathname = `${INITIAL_BLOB_PREFIX}${filename}`;
    const mimeType = inferMimeFromPathname(filename);
    const knownMeta = KNOWN_LOCAL_IMAGE_METADATA[localPath];

    let blobUrl = blobByPathname.get(targetBlobPathname)?.url;
    let sizeBytes = blobByPathname.get(targetBlobPathname)?.size ?? 0;

    if (!blobUrl) {
      const fileBuffer = await readFile(path.join(publicImagesDir, filename));
      sizeBytes = fileBuffer.byteLength;
      const uploaded = await put(targetBlobPathname, fileBuffer, {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: mimeType,
      });
      blobUrl = uploaded.url;
      uploadedCount += 1;
    } else {
      reusedCount += 1;
    }

    urlMap[localPath] = blobUrl;

    await db
      .insert(mediaAssets)
      .values({
        url: blobUrl,
        pathname: targetBlobPathname,
        filename,
        title: knownMeta?.title || deriveReadableTitle(filename),
        alt: knownMeta?.alt || '',
        mimeType,
        sizeBytes,
        assetType: 'image',
        storageProvider: 'vercel-blob',
      })
      .onConflictDoNothing();
  }

  let updatedReferences = 0;

  const [settingsRows, sectionRows, areaRows, projectRows] = await Promise.all([
    db.select().from(siteSettings).where(eq(siteSettings.id, 'default')).limit(1),
    db.select().from(pageSections),
    db.select().from(actionAreas),
    db.select().from(projects),
  ]);

  const currentSettings = settingsRows[0];
  if (currentSettings && urlMap[currentSettings.logoUrl]) {
    await db
      .update(siteSettings)
      .set({ logoUrl: urlMap[currentSettings.logoUrl], updatedAt: new Date() })
      .where(eq(siteSettings.id, 'default'));
    updatedReferences += 1;
  }

  for (const row of sectionRows) {
    if (row.imageUrl && urlMap[row.imageUrl]) {
      await db
        .update(pageSections)
        .set({ imageUrl: urlMap[row.imageUrl], updatedAt: new Date() })
        .where(eq(pageSections.key, row.key));
      updatedReferences += 1;
    }
  }

  for (const row of areaRows) {
    if (urlMap[row.imageUrl]) {
      await db
        .update(actionAreas)
        .set({ imageUrl: urlMap[row.imageUrl], updatedAt: new Date() })
        .where(eq(actionAreas.id, row.id));
      updatedReferences += 1;
    }
  }

  for (const row of projectRows) {
    if (urlMap[row.imageUrl]) {
      await db
        .update(projects)
        .set({ imageUrl: urlMap[row.imageUrl], updatedAt: new Date() })
        .where(eq(projects.id, row.id));
      updatedReferences += 1;
    }
  }

  return { uploadedCount, reusedCount, updatedReferences, urlMap };
}
