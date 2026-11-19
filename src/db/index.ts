import { neon } from '@neondatabase/serverless';
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from './schema';

export type Database = NeonHttpDatabase<typeof schema>;

let cachedDb: Database | null = null;

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function getDb(): Database | null {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return null;
  if (!cachedDb) {
    const sql = neon(url);
    cachedDb = drizzle(sql, { schema });
  }
  return cachedDb;
}

export function requireDb(): Database {
  const db = getDb();
  if (!db) {
    throw new Error(
      'DATABASE_URL no está configurada. Define DATABASE_URL en .env.local o en Vercel.'
    );
  }
  return db;
}
