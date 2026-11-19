export type StorageProviderName = 'vercel-blob' | 'r2';

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
] as const;

export const MAX_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB via direct client upload

export function getActiveStorageProvider(): StorageProviderName {
  return process.env.STORAGE_PROVIDER === 'r2' ? 'r2' : 'vercel-blob';
}

export function isStorageConfigured(): boolean {
  const provider = getActiveStorageProvider();
  if (provider === 'r2') {
    return Boolean(
      process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME
    );
  }
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

export function sanitizeUploadFilename(rawName: string): string {
  const clean = rawName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/-+\./g, '.')
    .replace(/^-|-$/g, '');
  return clean || 'imagen-tejer-paz.jpg';
}
