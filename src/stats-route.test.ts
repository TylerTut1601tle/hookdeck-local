import { describe, it, expect, vi } from "vitest";
import { IncomingMessage, ServerResponse } from "http";
import { createStatsRoute } from "./stats-route";
import { RequestStore } from "./request-store";

function makeStore(requests: any[] = []): RequestStore {
  return { list: () => requests } as unknown as RequestStore;
}

function makeMockReq(method: string, url: string): IncomingMessage {
  return { method, url } as IncomingMessage;
}

function makeMockRes() {
  return {
    writeHead: vi.fn(),
    end: vi.fn(),
  } as unknown as ServerResponse;
}

describe("createStatsRoute", () => {
  it("handles GET /__hookdeck/stats", () => {
    const store = makeStore([{ method: "POST", path: "/hook", status: 200, duration: 42 }]);
    const route = createStatsRoute(store);
    const req = makeMockReq("GET", "/__hookdeck/stats");
    const res = makeMockRes();
    const next = vi.fn();
    route(req, res, next);
    expect(res.writeHead).toHaveBeenCalledWith(200, expect.any(Object));
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next for non-matching routes", () => {
    const store = makeStore();
    const route = createStatsRoute(store);
    const req = makeMockReq("GET", "/other");
    const res = makeMockRes();
    const next = vi.fn();
    route(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.writeHead).not.toHaveBeenCalled();
  });

  it("calls next for POST to stats route", () => {
    const store = makeStore();
    const route = createStatsRoute(store);
    const req = makeMockReq("POST", "/__hookdeck/stats");
    const res = makeMockRes();
    const next = vi.fn();
    route(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("returns stats body as valid JSON", () => {
    const store = makeStore([
      { method: "GET", path: "/a", status: 200, duration: 10 },
      { method: "GET", path: "/a", status: 200, duration: 20 },
    ]);
    const route = createStatsRoute(store);
    const req = makeMockReq("GET", "/__hookdeck/stats");
    const res = makeMockRes();
    const next = vi.fn();
    route(req, res, next);
    const body = (res.end as ReturnType<typeof vi.fn>).mock.calls[0][0];
    const parsed = JSON.parse(body);
    expect(parsed.total).toBe(2);
    expect(parsed.averageResponseTime).toBe(15);
  });
});
