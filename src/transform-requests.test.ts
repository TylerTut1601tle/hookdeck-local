import { describe, it, expect, beforeEach } from "vitest";
import { IncomingMessage, ServerResponse } from "http";
import { createTransformRequestsHandler, applyTransform, TransformOperation } from "./transform-requests";
import { createRequestStore } from "./request-store";

function makeStore() {
  const store = createRequestStore();
  store.save({ id: "req-1", url: "/hook", method: "POST", headers: { "x-foo": "bar" }, body: { key: "value" } } as never);
  return store;
}

function makeMockReq(body: unknown, id = "req-1"): IncomingMessage {
  const listeners: Record<string, Array<(chunk?: unknown) => void>> = {};
  const mock = {
    url: `/__transform?id=${id}`,
    method: "POST",
    on: (event: string, cb: (chunk?: unknown) => void) => {
      listeners[event] = listeners[event] ?? [];
      listeners[event].push(cb);
    },
    emit: (event: string, data?: unknown) => listeners[event]?.forEach((cb) => cb(data)),
  };
  setTimeout(() => {
    mock.emit("data", JSON.stringify(body));
    mock.emit("end");
  }, 0);
  return mock as unknown as IncomingMessage;
}

function makeMockRes() {
  const res = { statusCode: 0, headers: {} as Record<string, string>, body: "" };
  return {
    writeHead: (code: number, headers?: Record<string, string>) => { res.statusCode = code; Object.assign(res.headers, headers); },
    end: (data: string) => { res.body = data; },
    _res: res,
  } as unknown as ServerResponse & { _res: typeof res };
}

describe("applyTransform", () => {
  it("sets a header field", () => {
    const ops: TransformOperation[] = [{ field: "headers", action: "set", key: "x-custom", value: "hello" }];
    const result = applyTransform({ headers: { "x-foo": "bar" } }, ops);
    expect((result.headers as Record<string, string>)["x-custom"]).toBe("hello");
  });

  it("deletes a header field", () => {
    const ops: TransformOperation[] = [{ field: "headers", action: "delete", key: "x-foo" }];
    const result = applyTransform({ headers: { "x-foo": "bar" } }, ops);
    expect((result.headers as Record<string, string>)["x-foo"]).toBeUndefined();
  });

  it("renames a header field", () => {
    const ops: TransformOperation[] = [{ field: "headers", action: "rename", key: "x-foo", value: "x-bar" }];
    const result = applyTransform({ headers: { "x-foo": "bar" } }, ops);
    expect((result.headers as Record<string, string>)["x-bar"]).toBe("bar");
    expect((result.headers as Record<string, string>)["x-foo"]).toBeUndefined();
  });
});

describe("createTransformRequestsHandler", () => {
  it("returns 400 if id is missing", async () => {
    const store = makeStore();
    const handler = createTransformRequestsHandler(store);
    const req = { url: "/__transform", method: "POST", on: () => {} } as unknown as IncomingMessage;
    const res = makeMockRes();
    handler(req, res);
    expect((res as unknown as { _res: { statusCode: number } })._res.statusCode).toBe(400);
  });

  it("returns 404 if request not found", async () => {
    const store = makeStore();
    const handler = createTransformRequestsHandler(store);
    const req = makeMockReq([], "missing");
    const res = makeMockRes();
    handler(req, res);
    await new Promise((r) => setTimeout(r, 10));
    expect((res as unknown as { _res: { statusCode: number } })._res.statusCode).toBe(404);
  });

  it("applies transform and saves new request", async () => {
    const store = makeStore();
    const handler = createTransformRequestsHandler(store);
    const ops: TransformOperation[] = [{ field: "headers", action: "set", key: "x-injected", value: "yes" }];
    const req = makeMockReq(ops);
    const res = makeMockRes();
    handler(req, res);
    await new Promise((r) => setTimeout(r, 10));
    const r = res as unknown as { _res: { statusCode: number; body: string } };
    expect(r._res.statusCode).toBe(200);
    const saved = JSON.parse(r._res.body);
    expect(saved.headers["x-injected"]).toBe("yes");
  });
});
