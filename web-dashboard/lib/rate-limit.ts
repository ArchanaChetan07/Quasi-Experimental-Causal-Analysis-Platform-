import "server-only";

/**
 * Simple in-memory sliding-window rate limiter, keyed by client IP.
 *
 * This is intentionally lightweight and dependency-free so the app has no
 * external state requirement for local dev / small deployments. It is NOT
 * safe across multiple server instances (each instance has its own counter),
 * because it doesn't share state. For a real multi-instance production
 * deployment, swap this for a shared store (Redis via `@upstash/ratelimit`,
 * or an API-gateway-level limiter) — the call site (see
 * app/api/results/route.ts) is already isolated behind this one function,
 * so that's a one-file change.
 */

interface Bucket {
  count: number;
  windowStart: number;
}

const buckets = new Map<string, Bucket>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 120;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(
  key: string,
  { windowMs = WINDOW_MS, max = MAX_REQUESTS_PER_WINDOW } = {},
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.windowStart >= windowMs) {
    buckets.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: max - 1, resetAt: now + windowMs };
  }

  bucket.count += 1;
  const allowed = bucket.count <= max;
  return { allowed, remaining: Math.max(0, max - bucket.count), resetAt: bucket.windowStart + windowMs };
}

/** Periodically evict stale buckets so this doesn't leak memory long-run. */
export function startRateLimitCleanup(intervalMs = 5 * 60_000) {
  const interval = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets.entries()) {
      if (now - bucket.windowStart > WINDOW_MS * 2) buckets.delete(key);
    }
  }, intervalMs);
  interval.unref?.();
  return interval;
}

export function getClientKey(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() ?? "unknown";
}
