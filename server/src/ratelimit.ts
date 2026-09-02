/**
 * Rate limiter — simple per-IP sliding window (in-memory).
 * Threshold: RATE_LIMIT_RPM env var (default 30 req/min — floor to accommodate a 15-question quiz).
 * Returns 429 + retryable:true on breach (contract §4).
 * 
 * O-6 note: Andy's monthly cost cap will determine the final number.
 * This default (30/min) is the agreed floor — won't throttle a single legitimate player.
 */

interface Window {
  count: number;
  resetAt: number;
}

const windows = new Map<string, Window>();
const WINDOW_MS = 60_000; // 1 minute

export function getRateLimit(): number {
  const env = process.env.RATE_LIMIT_RPM;
  const parsed = env ? parseInt(env, 10) : NaN;
  return isNaN(parsed) || parsed < 1 ? 30 : parsed;
}

export function checkRateLimit(ip: string): { allowed: boolean; retryAfterMs: number } {
  const limit = getRateLimit();
  const now = Date.now();

  let win = windows.get(ip);
  if (!win || now >= win.resetAt) {
    win = { count: 0, resetAt: now + WINDOW_MS };
    windows.set(ip, win);
  }

  win.count++;

  if (win.count > limit) {
    return { allowed: false, retryAfterMs: win.resetAt - now };
  }

  return { allowed: true, retryAfterMs: 0 };
}

// Housekeeping: prune stale windows every 5 minutes to prevent unbounded growth
setInterval(() => {
  const now = Date.now();
  for (const [ip, win] of windows.entries()) {
    if (now >= win.resetAt) windows.delete(ip);
  }
}, 5 * 60_000).unref();
