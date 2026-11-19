import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isAppRole, roleHasPermission } from '@/lib/auth/permissions';
import { contactSchema, escapeHtmlText, sanitizeHeaderText } from '@/lib/contact/schema';
import { checkRateLimit, resetRateLimitStore } from '@/lib/security/rateLimiter';
import {
  getActiveStorageProvider,
  inferAssetTypeFromMime,
  inferMimeFromPathname,
  isStorageConfigured,
  sanitizeUploadFilename,
} from '@/lib/storage';

describe('RBAC Matrix (superadmin vs admin)', () => {
  it('recognizes only valid institutional roles', () => {
    expect(isAppRole('superadmin')).toBe(true);
    expect(isAppRole('admin')).toBe(true);
    expect(isAppRole('guest')).toBe(false);
    expect(isAppRole(undefined)).toBe(false);
  });

  it('allows admin to manage content, areas, media, and inbox, but blocks users, audit, and global settings writes', () => {
    expect(roleHasPermission('admin', 'section', 'update')).toBe(true);
    expect(roleHasPermission('admin', 'area', 'create')).toBe(true);
    expect(roleHasPermission('admin', 'area', 'delete')).toBe(true);
    expect(roleHasPermission('admin', 'project', 'create')).toBe(true);
    expect(roleHasPermission('admin', 'media', 'create')).toBe(true);
    expect(roleHasPermission('admin', 'message', 'update')).toBe(true);
    expect(roleHasPermission('admin', 'message', 'delete')).toBe(true);
    expect(roleHasPermission('admin', 'settings', 'read')).toBe(true);

    expect(roleHasPermission('admin', 'settings', 'update')).toBe(false);
    expect(roleHasPermission('admin', 'user', 'list')).toBe(false);
    expect(roleHasPermission('admin', 'user', 'create')).toBe(false);
    expect(roleHasPermission('admin', 'user', 'set-password')).toBe(false);
    expect(roleHasPermission('admin', 'audit', 'read')).toBe(false);
  });

  it('grants superadmin full permissions including user management, passwords, and global settings', () => {
    expect(roleHasPermission('superadmin', 'settings', 'update')).toBe(true);
    expect(roleHasPermission('superadmin', 'area', 'delete')).toBe(true);
    expect(roleHasPermission('superadmin', 'user', 'list')).toBe(true);
    expect(roleHasPermission('superadmin', 'user', 'create')).toBe(true);
    expect(roleHasPermission('superadmin', 'user', 'set-role')).toBe(true);
    expect(roleHasPermission('superadmin', 'user', 'set-password')).toBe(true);
    expect(roleHasPermission('superadmin', 'user', 'delete')).toBe(true);
    expect(roleHasPermission('superadmin', 'audit', 'read')).toBe(true);
  });
});

describe('Contact Schema & Sanitization', () => {
  it('validates a complete Spanish contact payload', () => {
    const res = contactSchema.safeParse({
      firstName: 'María',
      lastName: 'Gómez',
      email: 'maria@example.org',
      subject: 'Alianza territorial',
      message: 'Nos gustaría articular un taller juvenil en el suroccidente.',
    });
    expect(res.success).toBe(true);
  });

  it('rejects incomplete or invalid email payloads', () => {
    const res = contactSchema.safeParse({
      firstName: 'A',
      lastName: 'B',
      email: 'no-es-correo',
      subject: 'Hi',
      message: 'corto',
    });
    expect(res.success).toBe(false);
  });

  it('escapes HTML tags and strips CRLF header injection', () => {
    expect(escapeHtmlText('<script>alert(1)</script>')).not.toContain('<script>');
    expect(sanitizeHeaderText('Asunto\r\nBcc: evil@test.com')).toBe(
      'Asunto Bcc: evil@test.com'
    );
  });
});

describe('Rate Limiter & Storage Helpers', () => {
  beforeEach(() => {
    resetRateLimitStore();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('blocks requests exceeding the sliding window limit', () => {
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit('127.0.0.1').allowed).toBe(true);
    }
    const sixth = checkRateLimit('127.0.0.1');
    expect(sixth.allowed).toBe(false);
    expect(sixth.remaining).toBe(0);
  });

  it('normalizes uploaded filenames to safe kebab-case and handles empty inputs', () => {
    expect(sanitizeUploadFilename('Foto Diálogo #1 (Misión).JPG')).toBe(
      'foto-dialogo-1-mision.jpg'
    );
    expect(sanitizeUploadFilename('!!!###')).toBe('imagen-tejer-paz.jpg');
  });

  it('detects storage provider and configuration state for Vercel Blob and R2', () => {
    vi.stubEnv('STORAGE_PROVIDER', '');
    vi.stubEnv('BLOB_READ_WRITE_TOKEN', '');
    expect(getActiveStorageProvider()).toBe('vercel-blob');
    expect(isStorageConfigured()).toBe(false);

    vi.stubEnv('BLOB_READ_WRITE_TOKEN', 'vercel_blob_rw_test');
    expect(isStorageConfigured()).toBe(true);

    vi.stubEnv('STORAGE_PROVIDER', 'r2');
    vi.stubEnv('R2_ACCOUNT_ID', '');
    expect(getActiveStorageProvider()).toBe('r2');
    expect(isStorageConfigured()).toBe(false);

    vi.stubEnv('R2_ACCOUNT_ID', 'acc-123');
    vi.stubEnv('R2_ACCESS_KEY_ID', 'key-123');
    vi.stubEnv('R2_SECRET_ACCESS_KEY', 'secret-123');
    vi.stubEnv('R2_BUCKET_NAME', 'tejer-paz-media');
    expect(isStorageConfigured()).toBe(true);

    expect(inferAssetTypeFromMime('application/pdf')).toBe('pdf');
    expect(inferAssetTypeFromMime('video/mp4')).toBe('video');
    expect(inferAssetTypeFromMime('image/webp')).toBe('image');

    expect(inferMimeFromPathname('media/logo.png')).toBe('image/png');
    expect(inferMimeFromPathname('media/foto.webp')).toBe('image/webp');
    expect(inferMimeFromPathname('media/foto.avif')).toBe('image/avif');
    expect(inferMimeFromPathname('media/cartilla.pdf')).toBe('application/pdf');
    expect(inferMimeFromPathname('media/foto.jpg')).toBe('image/jpeg');
  });
});
