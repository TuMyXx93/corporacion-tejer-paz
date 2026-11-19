import { existsSync } from 'node:fs';
import {
  migrateLocalImagesToBlob,
  syncBlobStoreToDatabase,
} from '../lib/storage/blob-sync';

for (const envFile of ['.env.local', '.env']) {
  if (existsSync(envFile)) {
    process.loadEnvFile(envFile);
  }
}

async function main() {
  console.log('1. Sincronizando blobs existentes desde Vercel Blob hacia PostgreSQL...');
  const syncResult = await syncBlobStoreToDatabase();
  console.log(
    `   Sincronizados: ${syncResult.syncedCount}, tamaños actualizados: ${syncResult.updatedSizeCount}`
  );

  console.log('2. Migrando imágenes locales de public/images/ hacia Vercel Blob...');
  const migrateResult = await migrateLocalImagesToBlob();
  console.log(
    `   Subidas nuevas: ${migrateResult.uploadedCount}, reutilizadas: ${migrateResult.reusedCount}, referencias actualizadas en BD: ${migrateResult.updatedReferences}`
  );

  console.log('Migración multimedia completada.');
}

main().catch(err => {
  console.error('Error en media:migrate-blob:', err);
  process.exit(1);
});
