import { createCompareRequestsHandler } from "./compare-requests";
import { createRequestStore } from "./request-store";
import { IncomingMessage, ServerResponse } from "http";

function makeStore() {
  const store = createRequestStore();
  store.add({ id: "aaa", method: "POST", url: "/hook", headers: { "content-type": "application/json", "x-custom": "foo" }, body: '{"a":1}', timestamp: Date.now() });
  store.add({ id: "bbb", method: "POST", url: "/hook", headers: { "content-type": "application/json", "x-custom": "bar" }, body: '{"a":2}', timestamp: Date.now() });
  return store;
}

function makeMockReq(url: string): Partial<IncomingMessage> {
  return { url, method: "GET" };
}

function makeMockRes(): { res: Partial<ServerResponse>; status: () => number; body: () => string } {
  let statusCode = 200;
  let body = "";
  const res: Partial<ServerResponse> = {
    writeHead(code: number) { statusCode = code; return this as ServerResponse; },
    end(data?: string) { body = data || ""; return this as ServerResponse; },
  };
  return { res, status: () => statusCode, body: () => body };
}

test("returns 400 when params missing", () => {
  const store = makeStore();
  const handler = createCompareRequestsHandler(store);
  const req = makeMockReq("/compare");
  const { res, status, body } = makeMockRes();
  handler(req as IncomingMessage, res as ServerResponse);
  expect(status()).toBe(400);
  expect(JSON.parse(body()).error).toMatch(/required/);
});

test("returns 404 when id A not found", () => {
  const store = makeStore();
  const handler = createCompareRequestsHandler(store);
  const req = makeMockReq("/compare?a=zzz&b=bbb");
  const { res, status } = makeMockRes();
  handler(req as IncomingMessage, res as ServerResponse);
  expect(status()).toBe(404);
});

test("returns 404 when id B not found", () => {
  const store = makeStore();
  const handler = createCompareRequestsHandler(store);
  const req = makeMockReq("/compare?a=aaa&b=zzz");
  const { res, status } = makeMockRes();
  handler(req as IncomingMessage, res as ServerResponse);
  expect(status()).toBe(404);
});

test("returns diff with changed headers and body", () => {
  const store = makeStore();
  const handler = createCompareRequestsHandler(store);
  const req = makeMockReq("/compare?a=aaa&b=bbb");
  const { res, status, body } = makeMockRes();
  handler(req as IncomingMessage, res as ServerResponse);
  expect(status()).toBe(200);
  const diff = JSON.parse(body());
  expect(diff.differences.body).toBe(true);
  expect(diff.differences.headers).toContain("x-custom");
  expect(diff.differences.method).toBe(false);
  expect(diff.differences.url).toBe(false);
});
