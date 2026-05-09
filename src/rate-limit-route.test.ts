import { describe, it, expect, beforeEach, mock } from "bun:test";
import { createRateLimitRoute } from "./rate-limit-route";
import { createRequestStore } from "./request-store";
import { IncomingMessage, ServerResponse } from "http";

function makeStore() {
  return createRequestStore();
}

function makeMockReq(method: string, url: string): IncomingMessage {
  return { method, url } as IncomingMessage;
}

function makeMockRes(): ServerResponse {
  return {
    writeHead: mock(() => {}),
    end: mock(() => {}),
  } as unknown as ServerResponse;
}

describe("createRateLimitRoute", () => {
  let store: ReturnType<typeof createRequestStore>;

  beforeEach(() => {
    store = makeStore();
  });

  it("handles GET /__hookdeck/rate-limit", () => {
    const route = createRateLimitRoute(store);
    const req = makeMockReq("GET", "/__hookdeck/rate-limit");
    const res = makeMockRes();
    const handled = route(req, res);
    expect(handled).toBe(true);
  });

  it("handles GET /__hookdeck/rate-limit with query params", () => {
    const route = createRateLimitRoute(store);
    const req = makeMockReq("GET", "/__hookdeck/rate-limit?window=60");
    const res = makeMockRes();
    const handled = route(req, res);
    expect(handled).toBe(true);
  });

  it("does not handle POST requests", () => {
    const route = createRateLimitRoute(store);
    const req = makeMockReq("POST", "/__hookdeck/rate-limit");
    const res = makeMockRes();
    const handled = route(req, res);
    expect(handled).toBe(false);
  });

  it("does not handle unrelated routes", () => {
    const route = createRateLimitRoute(store);
    const req = makeMockReq("GET", "/some-other-path");
    const res = makeMockRes();
    const handled = route(req, res);
    expect(handled).toBe(false);
  });

  it("calls handler and writes response for valid route", () => {
    const now = Date.now();
    store.add({
      id: "req-1",
      method: "POST",
      url: "/webhook",
      headers: {},
      body: "{}",
      timestamp: now - 5000,
      status: 200,
      duration: 120,
      tags: [],
      note: "",
      bookmarked: false,
      archived: false,
      pinned: false,
    });
    const route = createRateLimitRoute(store);
    const req = makeMockReq("GET", "/__hookdeck/rate-limit");
    const res = makeMockRes();
    route(req, res);
    expect((res.writeHead as ReturnType<typeof mock>).mock.calls.length).toBeGreaterThan(0);
  });
});
