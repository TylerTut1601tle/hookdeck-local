import { IncomingMessage, ServerResponse } from "http";
import { RequestStore } from "./request-store";

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
}

export interface RateLimitResult {
  allowed: boolean;
  count: number;
  remaining: number;
  resetAt: number;
}

export function computeRateLimit(
  requests: ReturnType<RequestStore["list"]>,
  windowMs: number,
  maxRequests: number
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;
  const recent = requests.filter((r) => new Date(r.timestamp).getTime() >= windowStart);
  const count = recent.length;
  const remaining = Math.max(0, maxRequests - count);
  const oldest = recent.length > 0
    ? new Date(recent[0].timestamp).getTime()
    : now;
  const resetAt = oldest + windowMs;

  return {
    allowed: count < maxRequests,
    count,
    remaining,
    resetAt,
  };
}

export function createRateLimitRequestsHandler(
  store: RequestStore,
  options: RateLimitOptions
) {
  return function rateLimitRequestsHandler(
    req: IncomingMessage,
    res: ServerResponse
  ): void {
    const { windowMs, maxRequests } = options;

    if (!windowMs || windowMs <= 0 || !maxRequests || maxRequests <= 0) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid rate limit options" }));
      return;
    }

    const requests = store.list();
    const result = computeRateLimit(requests, windowMs, maxRequests);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        windowMs,
        maxRequests,
        ...result,
      })
    );
  };
}
