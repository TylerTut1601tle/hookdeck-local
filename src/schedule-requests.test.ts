import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import { IncomingMessage, ServerResponse } from "http";
import { createScheduleRequestsHandler, cancelScheduled, listScheduled } from "./schedule-requests";
import { createRequestStore } from "./request-store";

function makeStore() {
  const store = createRequestStore();
  store.add({
    id: "req-1",
    method: "POST",
    path: "/webhook",
    headers: { "content-type": "application/json" },
    body: '{"event":"test"}',
    timestamp: Date.now(),
  });
  return store;
}

function makeMockReq(url: string): Partial<IncomingMessage> {
  return { url, method: "POST" };
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

describe("createScheduleRequestsHandler", () => {
  let store: ReturnType<typeof makeStore>;

  beforeEach(() => {
    store = makeStore();
  });

  afterEach(() => {
    cancelScheduled("req-1");
  });

  it("returns 400 when id is missing", async () => {
    const handler = createScheduleRequestsHandler(store, "http://localhost:3000");
    const req = makeMockReq("/schedule?delay=1000");
    const res = makeMockRes();
    await handler(req as IncomingMessage, res as ServerResponse);
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error).toMatch(/id/);
  });

  it("returns 400 when delay is invalid", async () => {
    const handler = createScheduleRequestsHandler(store, "http://localhost:3000");
    const req = makeMockReq("/schedule?id=req-1&delay=abc");
    const res = makeMockRes();
    await handler(req as IncomingMessage, res as ServerResponse);
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error).toMatch(/delay/);
  });

  it("returns 404 when request not found", async () => {
    const handler = createScheduleRequestsHandler(store, "http://localhost:3000");
    const req = makeMockReq("/schedule?id=missing&delay=1000");
    const res = makeMockRes();
    await handler(req as IncomingMessage, res as ServerResponse);
    expect(res.statusCode).toBe(404);
  });

  it("schedules a replay and returns 200", async () => {
    const handler = createScheduleRequestsHandler(store, "http://localhost:3000");
    const req = makeMockReq("/schedule?id=req-1&delay=5000");
    const res = makeMockRes();
    await handler(req as IncomingMessage, res as ServerResponse);
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.requestId).toBe("req-1");
    expect(body.delayMs).toBe(5000);
    expect(listScheduled().some((s) => s.requestId === "req-1")).toBe(true);
  });

  it("cancelScheduled removes a scheduled entry", async () => {
    const handler = createScheduleRequestsHandler(store, "http://localhost:3000");
    const req = makeMockReq("/schedule?id=req-1&delay=9999");
    const res = makeMockRes();
    await handler(req as IncomingMessage, res as ServerResponse);
    expect(cancelScheduled("req-1")).toBe(true);
    expect(listScheduled().some((s) => s.requestId === "req-1")).toBe(false);
  });

  it("cancelScheduled returns false for unknown id", () => {
    expect(cancelScheduled("no-such-id")).toBe(false);
  });
});
