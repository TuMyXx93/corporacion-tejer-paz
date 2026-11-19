export function normalizeOrigin(raw?: string, assumeHttps = false): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;

  let candidate = trimmed;
  if (!/^https?:\/\//i.test(candidate)) {
    if (!assumeHttps || candidate.includes('://') || /\s/.test(candidate)) {
      return null;
    }
    if (!candidate.includes('.') && !candidate.startsWith('localhost')) {
      return null;
    }
    candidate = `https://${candidate}`;
  }

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return parsed.origin === 'null' ? null : parsed.origin;
  } catch {
    return null;
  }
}

export function resolveAuthBaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  if (env.VERCEL_ENV === 'preview') {
    return (
      normalizeOrigin(env.VERCEL_BRANCH_URL, true) ??
      normalizeOrigin(env.VERCEL_URL, true) ??
      normalizeOrigin(env.BETTER_AUTH_URL) ??
      normalizeOrigin(env.NEXT_PUBLIC_APP_URL) ??
      'http://localhost:3000'
    );
  }

  return (
    normalizeOrigin(env.BETTER_AUTH_URL) ??
    normalizeOrigin(env.VERCEL_PROJECT_PRODUCTION_URL, true) ??
    normalizeOrigin(env.NEXT_PUBLIC_APP_URL) ??
    'http://localhost:3000'
  );
}

export function resolveTrustedOrigins(env: NodeJS.ProcessEnv = process.env): string[] {
  const candidates: Array<string | null> = [
    resolveAuthBaseUrl(env),
    normalizeOrigin(env.BETTER_AUTH_URL),
    normalizeOrigin(env.NEXT_PUBLIC_APP_URL),
    normalizeOrigin(env.VERCEL_URL, true),
    normalizeOrigin(env.VERCEL_BRANCH_URL, true),
    normalizeOrigin(env.VERCEL_PROJECT_PRODUCTION_URL, true),
    env.NODE_ENV !== 'production' ? 'http://localhost:3000' : null,
  ];

  const unique = new Set<string>();
  for (const origin of candidates) {
    if (origin) unique.add(origin);
  }
  return [...unique];
}
