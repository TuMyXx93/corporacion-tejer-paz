export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: number;
}

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 5;

const memoryStore = new Map<string, number[]>();

export function checkRateLimit(
  identifier: string,
  limit = MAX_REQUESTS,
  windowMs = WINDOW_MS
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;
  const timestamps = (memoryStore.get(identifier) ?? []).filter(ts => ts > windowStart);

  if (timestamps.length >= limit) {
    const oldest = timestamps[0] ?? now;
    return {
      allowed: false,
      remaining: 0,
      limit,
      resetAt: oldest + windowMs,
    };
  }

  timestamps.push(now);
  memoryStore.set(identifier, timestamps);

  return {
    allowed: true,
    remaining: Math.max(0, limit - timestamps.length),
    limit,
    resetAt: timestamps[0] + windowMs,
  };
}

export function resetRateLimitStore(): void {
  memoryStore.clear();
}
