import { describe, it, expect, beforeEach, mock } from "bun:test";
import { computeRateLimit, createRateLimitRequestsHandler } from "./rate-limit-requests";
import { createRequestStore } from "./request-store";
import { IncomingMessage, ServerResponse } from "http";

function makeStore() {
  return createRequestStore();
}

function makeMockRes(): ServerResponse {
  const chunks: string[] = [];
  return {
    writeHead: mock(() => {}),
    end: mock((body: string) => chunks.push(body)),
    _chunks: chunks,
  } as unknown as ServerResponse;
}

function makeMockReq(url: string): IncomingMessage {
  return { method: "GET", url } as IncomingMessage;
}

describe("computeRateLimit", () => {
  it("returns zeros for empty store", () => {
    const store = makeStore();
    const result = computeRateLimit(store.getAll(), 60);
    expect(result.total).toBe(0);
    expect(result.rate_per_second).toBe(0);
    expect(result.rate_per_minute).toBe(0);
    expect(result.breakdown).toEqual({});
  });

  it("counts requests within the window", () => {
    const store = makeStore();
    const now = Date.now();
    store.add({ id: "1", method: "POST", url: "/hook", headers: {}, body: "", timestamp: now - 10000, status: 200, duration: 50, tags: [], note: "", bookmarked: false, archived: false, pinned: false });
    store.add({ id: "2", method: "POST", url: "/hook", headers: {}, body: "", timestamp: now - 20000, status: 200, duration: 50, tags: [], note: "", bookmarked: false, archived: false, pinned: false });
    store.add({ id: "3", method: "GET", url: "/ping", headers: {}, body: "", timestamp: now - 5000, status: 200, duration: 10, tags: [], note: "", bookmarked: false, archived: false, pinned: false });
    const result = computeRateLimit(store.getAll(), 60);
    expect(result.total).toBe(3);
    expect(result.breakdown["POST /hook"]).toBe(2);
    expect(result.breakdown["GET /ping"]).toBe(1);
  });

  it("excludes requests outside the window", () => {
    const store = makeStore();
    const now = Date.now();
    store.add({ id: "1", method: "POST", url: "/hook", headers: {}, body: "", timestamp: now - 120000, status: 200, duration: 50, tags: [], note: "", bookmarked: false, archived: false, pinned: false });
    store.add({ id: "2", method: "POST", url: "/hook", headers: {}, body: "", timestamp: now - 10000, status: 200, duration: 50, tags: [], note: "", bookmarked: false, archived: false, pinned: false });
    const result = computeRateLimit(store.getAll(), 60);
    expect(result.total).toBe(1);
  });
});

describe("createRateLimitRequestsHandler", () => {
  it("responds with 200 and JSON", () => {
    const store = makeStore();
    const handler = createRateLimitRequestsHandler(store);
    const req = makeMockReq("/__hookdeck/rate-limit");
    const res = makeMockRes();
    handler(req, res);
    expect((res.writeHead as ReturnType<typeof mock>).mock.calls[0][0]).toBe(200);
  });

  it("respects window query param", () => {
    const store = makeStore();
    const handler = createRateLimitRequestsHandler(store);
    const req = makeMockReq("/__hookdeck/rate-limit?window=300");
    const res = makeMockRes();
    handler(req, res);
    const body = JSON.parse((res as any)._chunks[0]);
    expect(body.window).toBe(300);
  });

  it("uses default window of 60 when not specified", () => {
    const store = makeStore();
    const handler = createRateLimitRequestsHandler(store);
    const req = makeMockReq("/__hookdeck/rate-limit");
    const res = makeMockRes();
    handler(req, res);
    const body = JSON.parse((res as any)._chunks[0]);
    expect(body.window).toBe(60);
  });
});
