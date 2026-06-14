interface RateLimitStore {
  count: number;
  resetTime: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
}

export function createRateLimiter(options: {
  windowMs: number;
  maxRequests: number;
}) {
  const { windowMs, maxRequests } = options;
  const store = new Map<string, RateLimitStore>();
  let nextCleanup = Date.now() + Math.min(windowMs, 60_000);

  const cleanupExpiredRecords = (now: number) => {
    if (now < nextCleanup) return;

    for (const [key, record] of store.entries()) {
      if (now > record.resetTime) {
        store.delete(key);
      }
    }

    nextCleanup = now + Math.min(windowMs, 60_000);
  };

  return function checkRateLimit(identifier: string): RateLimitResult {
    const now = Date.now();
    cleanupExpiredRecords(now);

    const record = store.get(identifier);

    if (!record || now > record.resetTime) {
      const newRecord: RateLimitStore = {
        count: 1,
        resetTime: now + windowMs,
      };
      store.set(identifier, newRecord);
      return {
        success: true,
        limit: maxRequests,
        remaining: maxRequests - 1,
        resetTime: newRecord.resetTime,
      };
    }

    if (record.count >= maxRequests) {
      return {
        success: false,
        limit: maxRequests,
        remaining: 0,
        resetTime: record.resetTime,
      };
    }

    record.count++;
    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - record.count,
      resetTime: record.resetTime,
    };
  };
}

export function getClientIdentifier(request: Request): string {
  const firstHeaderValue = (value: string | null) => (
    value?.split(",").map((part) => part.trim()).find(Boolean) ?? null
  );

  const cfConnectingIp = firstHeaderValue(request.headers.get("cf-connecting-ip"));
  if (cfConnectingIp) {
    return `ip:${cfConnectingIp}`;
  }

  const realIp = firstHeaderValue(request.headers.get("x-real-ip"));
  if (realIp) {
    return `ip:${realIp}`;
  }

  const forwardedFor = request.headers.get('x-forwarded-for');
  const forwardedIp = firstHeaderValue(forwardedFor);
  if (forwardedIp) {
    return `ip:${forwardedIp}`;
  }

  return 'unknown';
}

export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const retryAfterSeconds = Math.max(1, Math.ceil((result.resetTime - Date.now()) / 1000));

  return {
    "Retry-After": retryAfterSeconds.toString(),
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": new Date(result.resetTime).toISOString(),
  };
}
