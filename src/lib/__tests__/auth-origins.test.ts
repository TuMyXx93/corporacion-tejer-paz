import { describe, expect, it } from 'vitest';
import {
  normalizeOrigin,
  resolveAuthBaseUrl,
  resolveTrustedOrigins,
} from '@/lib/auth/origins';

describe('Auth Origin & Vercel Preview Resolution', () => {
  it('falls back to http://localhost:3000 in local development', () => {
    const env = { NODE_ENV: 'development' } as unknown as NodeJS.ProcessEnv;
    expect(resolveAuthBaseUrl(env)).toBe('http://localhost:3000');
    expect(resolveTrustedOrigins(env)).toEqual(['http://localhost:3000']);
  });

  it('prefers Vercel Preview branch/deployment URLs over production BETTER_AUTH_URL during previews', () => {
    const env = {
      NODE_ENV: 'production',
      VERCEL_ENV: 'preview',
      VERCEL_BRANCH_URL: 'corporacion-tejer-paz-git-dev-tumyxx93.vercel.app',
      VERCEL_URL: 'corporacion-tejer-paz-abc123.vercel.app',
      VERCEL_PROJECT_PRODUCTION_URL: 'corporacion-tejer-paz.vercel.app',
      BETTER_AUTH_URL: 'https://corporacion-tejer-paz.vercel.app',
      NEXT_PUBLIC_APP_URL: 'https://corporacion-tejer-paz.vercel.app/es',
    } as unknown as NodeJS.ProcessEnv;

    expect(resolveAuthBaseUrl(env)).toBe(
      'https://corporacion-tejer-paz-git-dev-tumyxx93.vercel.app'
    );

    const trusted = resolveTrustedOrigins(env);
    expect(trusted).toContain(
      'https://corporacion-tejer-paz-git-dev-tumyxx93.vercel.app'
    );
    expect(trusted).toContain('https://corporacion-tejer-paz-abc123.vercel.app');
    expect(trusted).toContain('https://corporacion-tejer-paz.vercel.app');
    expect(trusted).not.toContain('http://localhost:3000');
  });

  it('falls back from VERCEL_BRANCH_URL to VERCEL_URL on preview when branch URL is absent', () => {
    const env = {
      NODE_ENV: 'production',
      VERCEL_ENV: 'preview',
      VERCEL_URL: 'corporacion-tejer-paz-ephemeral.vercel.app',
    } as unknown as NodeJS.ProcessEnv;

    expect(resolveAuthBaseUrl(env)).toBe(
      'https://corporacion-tejer-paz-ephemeral.vercel.app'
    );
  });

  it('uses BETTER_AUTH_URL or VERCEL_PROJECT_PRODUCTION_URL in production and excludes localhost', () => {
    const env = {
      NODE_ENV: 'production',
      VERCEL_ENV: 'production',
      VERCEL_PROJECT_PRODUCTION_URL: 'corporacion-tejer-paz.vercel.app',
    } as unknown as NodeJS.ProcessEnv;

    expect(resolveAuthBaseUrl(env)).toBe('https://corporacion-tejer-paz.vercel.app');
    expect(resolveTrustedOrigins(env)).toEqual([
      'https://corporacion-tejer-paz.vercel.app',
    ]);
  });

  it('rejects malformed, empty, or non-http origins safely', () => {
    expect(normalizeOrigin('')).toBeNull();
    expect(normalizeOrigin('   ')).toBeNull();
    expect(normalizeOrigin('not-a-url')).toBeNull();
    expect(normalizeOrigin('ftp://files.example.org')).toBeNull();
    expect(normalizeOrigin('bad host.vercel.app', true)).toBeNull();
    expect(normalizeOrigin('javascript:alert(1)', true)).toBeNull();
    expect(normalizeOrigin('https://tejerpaz.org/admin')).toBe('https://tejerpaz.org');
  });
});
