import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { IncomingMessage, ServerResponse } from "http";
import { createScheduleRoute } from "./schedule-route";
import { createRequestStore } from "./request-store";
import { cancelScheduled } from "./schedule-requests";

function makeStore() {
  const store = createRequestStore();
  store.add({
    id: "req-abc",
    method: "POST",
    path: "/hook",
    headers: {},
    body: "{}",
    timestamp: Date.now(),
  });
  return store;
}

function makeMockReq(url: string, method = "GET"): Partial<IncomingMessage> {
  return { url, method };
}

function makeMockRes(): Partial<ServerResponse> & { statusCode: number; body: string } {
  const res = { statusCode: 200, body: "", headers: {} as Record<string, string> };
  res.writeHead = (code: number, headers?: Record<string, string>) => {
    res.statusCode = code;
    Object.assign(res.headers, headers ?? {});
  };
  res.end = (data?: string) => { res.body = data ?? ""; };
  return res as any;
}

describe("createScheduleRoute", () => {
  let store: ReturnType<typeof makeStore>;

  beforeEach(() => { store = makeStore(); });
  afterEach(() => { cancelScheduled("req-abc"); });

  it("returns false for unrelated routes", async () => {
    const route = createScheduleRoute(store, "http://localhost:3000");
    const req = makeMockReq("/webhook", "POST");
    const res = makeMockRes();
    const handled = await route(req as IncomingMessage, res as ServerResponse);
    expect(handled).toBe(false);
  });

  it("GET /__schedule returns list", async () => {
    const route = createScheduleRoute(store, "http://localhost:3000");
    const req = makeMockReq("/__schedule", "GET");
    const res = makeMockRes();
    const handled = await route(req as IncomingMessage, res as ServerResponse);
    expect(handled).toBe(true);
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(Array.isArray(body.scheduled)).toBe(true);
  });

  it("POST /__schedule schedules a replay", async () => {
    const route = createScheduleRoute(store, "http://localhost:3000");
    const req = makeMockReq("/__schedule?id=req-abc&delay=9000", "POST");
    const res = makeMockRes();
    const handled = await route(req as IncomingMessage, res as ServerResponse);
    expect(handled).toBe(true);
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).requestId).toBe("req-abc");
  });

  it("DELETE /__schedule cancels a scheduled replay", async () => {
    const route = createScheduleRoute(store, "http://localhost:3000");
    await route(
      makeMockReq("/__schedule?id=req-abc&delay=9000", "POST") as IncomingMessage,
      makeMockRes() as ServerResponse
    );
    const res = makeMockRes();
    const handled = await route(
      makeMockReq("/__schedule?id=req-abc", "DELETE") as IncomingMessage,
      res as ServerResponse
    );
    expect(handled).toBe(true);
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).cancelled).toBe(true);
  });

  it("DELETE /__schedule returns 404 for unknown id", async () => {
    const route = createScheduleRoute(store, "http://localhost:3000");
    const res = makeMockRes();
    await route(
      makeMockReq("/__schedule?id=no-such", "DELETE") as IncomingMessage,
      res as ServerResponse
    );
    expect(res.statusCode).toBe(404);
  });
});
