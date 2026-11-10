/**
 * In-memory rate limiting and brute force protection service.
 * Follows AGENTS.md rules: no external Redis/infrastructure required for MVP.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface AttemptTracker {
  attempts: number;
  firstAttemptAt: number;
  lockedUntil: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
const attemptStore = new Map<string, AttemptTracker>();

// Eviction threshold: periodic cleanup if store grows
const MAX_STORE_SIZE = 10_000;

function cleanupStores() {
  const now = Date.now();
  if (rateLimitStore.size > MAX_STORE_SIZE) {
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetAt <= now) {
        rateLimitStore.delete(key);
      }
    }
  }
  if (attemptStore.size > MAX_STORE_SIZE) {
    for (const [key, tracker] of attemptStore.entries()) {
      if (tracker.lockedUntil <= now && now - tracker.firstAttemptAt > 60 * 60 * 1000) {
        attemptStore.delete(key);
      }
    }
  }
}

/**
 * Extracts the real client IP address from request headers.
 */
export function extractClientIp(request?: Request): string {
  if (!request) return "unknown-ip";
  const xForwardedFor = request.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    const firstIp = xForwardedFor.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }
  const xRealIp = request.headers.get("x-real-ip")?.trim();
  if (xRealIp) return xRealIp;
  return "unknown-ip";
}

/**
 * Checks general rate limit for an action/IP (token bucket / fixed window).
 */
export function checkRateLimit(
  key: string,
  options: { maxRequests: number; windowMs: number }
): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  cleanupStores();
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + options.windowMs });
    return {
      allowed: true,
      remaining: options.maxRequests - 1,
      retryAfterSeconds: Math.ceil(options.windowMs / 1000),
    };
  }

  if (entry.count >= options.maxRequests) {
    const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  entry.count += 1;
  const remaining = Math.max(0, options.maxRequests - entry.count);
  const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
  return {
    allowed: true,
    remaining,
    retryAfterSeconds,
  };
}

/**
 * Checks if a specific key is currently locked due to previous failed attempts.
 */
export function getLockStatus(key: string): { locked: boolean; retryAfterSeconds: number } {
  const tracker = attemptStore.get(key);
  if (!tracker) {
    return { locked: false, retryAfterSeconds: 0 };
  }

  const now = Date.now();
  if (tracker.lockedUntil > now) {
    const retryAfterSeconds = Math.ceil((tracker.lockedUntil - now) / 1000);
    return { locked: true, retryAfterSeconds };
  }

  return { locked: false, retryAfterSeconds: 0 };
}

/**
 * Records a failed attempt (e.g. incorrect OTP or password) and locks if threshold is reached.
 */
export function recordFailedAttempt(
  key: string,
  options: { maxAttempts: number; windowMs: number; lockDurationMs: number }
): { locked: boolean; attempts: number; remainingAttempts: number; retryAfterSeconds: number } {
  cleanupStores();
  const now = Date.now();
  let tracker = attemptStore.get(key);

  if (!tracker || (now - tracker.firstAttemptAt > options.windowMs && tracker.lockedUntil <= now)) {
    tracker = {
      attempts: 1,
      firstAttemptAt: now,
      lockedUntil: 0,
    };
    attemptStore.set(key, tracker);
    return {
      locked: false,
      attempts: 1,
      remainingAttempts: options.maxAttempts - 1,
      retryAfterSeconds: 0,
    };
  }

  tracker.attempts += 1;

  if (tracker.attempts >= options.maxAttempts) {
    tracker.lockedUntil = now + options.lockDurationMs;
    const retryAfterSeconds = Math.ceil(options.lockDurationMs / 1000);
    return {
      locked: true,
      attempts: tracker.attempts,
      remainingAttempts: 0,
      retryAfterSeconds,
    };
  }

  return {
    locked: false,
    attempts: tracker.attempts,
    remainingAttempts: Math.max(0, options.maxAttempts - tracker.attempts),
    retryAfterSeconds: 0,
  };
}

/**
 * Clears failed attempts upon successful authentication or OTP verification.
 */
export function clearFailedAttempts(key: string): void {
  attemptStore.delete(key);
}

