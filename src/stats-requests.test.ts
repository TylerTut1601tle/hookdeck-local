import { describe, it, expect, vi } from "vitest";
import { IncomingMessage, ServerResponse } from "http";
import { computeStats, createStatsRequestsHandler } from "./stats-requests";
import { RequestStore } from "./request-store";

function makeStore(requests: any[]): RequestStore {
  return { list: () => requests } as unknown as RequestStore;
}

function makeMockRes() {
  const res = {
    writeHead: vi.fn(),
    end: vi.fn(),
  } as unknown as ServerResponse;
  return res;
}

describe("computeStats", () => {
  it("returns zeros for empty list", () => {
    const stats = computeStats([]);
    expect(stats.total).toBe(0);
    expect(stats.byMethod).toEqual({});
    expect(stats.byStatus).toEqual({});
    expect(stats.byPath).toEqual({});
    expect(stats.averageResponseTime).toBeNull();
  });

  it("counts methods correctly", () => {
    const requests = [
      { method: "GET", path: "/a", status: 200, duration: 100 },
      { method: "POST", path: "/b", status: 201, duration: 200 },
      { method: "get", path: "/a", status: 200, duration: 150 },
    ];
    const stats = computeStats(requests);
    expect(stats.byMethod["GET"]).toBe(2);
    expect(stats.byMethod["POST"]).toBe(1);
  });

  it("counts statuses correctly", () => {
    const requests = [
      { method: "GET", path: "/a", status: 200, duration: 50 },
      { method: "GET", path: "/b", status: 404, duration: 30 },
      { method: "GET", path: "/c", status: 200, duration: 70 },
    ];
    const stats = computeStats(requests);
    expect(stats.byStatus["200"]).toBe(2);
    expect(stats.byStatus["404"]).toBe(1);
  });

  it("computes average response time", () => {
    const requests = [
      { method: "GET", path: "/a", status: 200, duration: 100 },
      { method: "GET", path: "/b", status: 200, duration: 200 },
    ];
    const stats = computeStats(requests);
    expect(stats.averageResponseTime).toBe(150);
  });

  it("handles missing duration", () => {
    const requests = [
      { method: "GET", path: "/a", status: 200 },
    ];
    const stats = computeStats(requests);
    expect(stats.averageResponseTime).toBeNull();
  });
});

describe("createStatsRequestsHandler", () => {
  it("responds with JSON stats", () => {
    const store = makeStore([
      { method: "GET", path: "/test", status: 200, duration: 80 },
    ]);
    const handler = createStatsRequestsHandler(store);
    const res = makeMockRes();
    handler({} as IncomingMessage, res);
    expect(res.writeHead).toHaveBeenCalledWith(200, expect.objectContaining({ "Content-Type": "application/json" }));
    const body = (res.end as ReturnType<typeof vi.fn>).mock.calls[0][0];
    const parsed = JSON.parse(body);
    expect(parsed.total).toBe(1);
    expect(parsed.byMethod["GET"]).toBe(1);
  });
});
