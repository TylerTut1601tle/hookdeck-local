import { describe, it, expect, beforeEach } from "vitest";
import { IncomingMessage, ServerResponse } from "http";
import { computeRateLimit, createRateLimitRequestsHandler } from "./rate-limit-requests";
import { createRequestStore } from "./request-store";

function makeStore(entries: { timestamp: string }[] = []) {
  const store = createRequestStore();
  for (const e of entries) {
    store.add({ id: Math.random().toString(36).slice(2), method: "POST", url: "/hook", headers: {}, body: "", timestamp: e.timestamp, response: null } as any);
  }
  return store;
}

function makeMockRes() {
  const res = { statusCode: 0, headers: {} as Record<string, string>, body: "" } as any;
  res.writeHead = (code: number, headers: Record<string, string>) => {
    res.statusCode = code;
    res.headers = { ...res.headers, ...headers };
  };
  res.end = (data: string) => { res.body = data; };
  return res as ServerResponse;
}

function makeMockReq() {
  return {} as IncomingMessage;
}

describe("computeRateLimit", () => {
  it("returns allowed=true when under limit", () => {
    const now = Date.now();
    const requests = [{ timestamp: new Date(now - 1000).toISOString() }] as any;
    const result = computeRateLimit(requests, 60000, 10);
    expect(result.allowed).toBe(true);
    expect(result.count).toBe(1);
    expect(result.remaining).toBe(9);
  });

  it("returns allowed=false when at limit", () => {
    const now = Date.now();
    const requests = Array.from({ length: 5 }, (_, i) => ({
      timestamp: new Date(now - i * 100).toISOString(),
    })) as any;
    const result = computeRateLimit(requests, 60000, 5);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("ignores requests outside the window", () => {
    const now = Date.now();
    const requests = [
      { timestamp: new Date(now - 120000).toISOString() },
      { timestamp: new Date(now - 500).toISOString() },
    ] as any;
    const result = computeRateLimit(requests, 60000, 5);
    expect(result.count).toBe(1);
  });
});

describe("createRateLimitRequestsHandler", () => {
  it("returns rate limit info with 200", () => {
    const store = makeStore([{ timestamp: new Date().toISOString() }]);
    const handler = createRateLimitRequestsHandler(store, { windowMs: 60000, maxRequests: 10 });
    const res = makeMockRes();
    handler(makeMockReq(), res);
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.maxRequests).toBe(10);
    expect(body.windowMs).toBe(60000);
    expect(typeof body.remaining).toBe("number");
  });

  it("returns 400 for invalid options", () => {
    const store = makeStore();
    const handler = createRateLimitRequestsHandler(store, { windowMs: 0, maxRequests: 10 });
    const res = makeMockRes();
    handler(makeMockReq(), res);
    expect(res.statusCode).toBe(400);
  });
});
