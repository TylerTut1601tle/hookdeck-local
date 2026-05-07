import { createDuplicateRequestsHandler } from "./duplicate-requests";
import { createRequestStore } from "./request-store";
import { IncomingMessage, ServerResponse } from "http";

function makeStore() {
  return createRequestStore();
}

function makeMockReq(url: string): Partial<IncomingMessage> {
  return { url, method: "POST" };
}

function makeMockRes(): Partial<ServerResponse> & {
  _status: number;
  _body: string;
  _headers: Record<string, string>;
} {
  const res: any = { _status: 0, _body: "", _headers: {} };
  res.writeHead = (status: number, headers?: Record<string, string>) => {
    res._status = status;
    if (headers) res._headers = { ...res._headers, ...headers };
  };
  res.end = (body: string) => { res._body = body; };
  return res;
}

describe("createDuplicateRequestsHandler", () => {
  it("returns 404 when request id not found", async () => {
    const store = makeStore();
    const handler = createDuplicateRequestsHandler(store);
    const req = makeMockReq("/requests/nonexistent/duplicate");
    const res = makeMockRes();
    await handler(req as IncomingMessage, res as ServerResponse);
    expect(res._status).toBe(404);
    expect(JSON.parse(res._body)).toHaveProperty("error");
  });

  it("returns 400 when id is missing", async () => {
    const store = makeStore();
    const handler = createDuplicateRequestsHandler(store);
    const req = makeMockReq("/");
    const res = makeMockRes();
    await handler(req as IncomingMessage, res as ServerResponse);
    expect(res._status).toBe(400);
  });

  it("duplicates an existing request and returns 201", async () => {
    const store = makeStore();
    const original = store.add({
      method: "POST",
      url: "/webhook",
      headers: { "content-type": "application/json" },
      body: '{"event":"test"}',
      timestamp: new Date().toISOString(),
      status: 200,
      duration: 45,
      tags: ["test"],
      note: "original note",
      bookmarked: true,
      archived: false,
    });
    const handler = createDuplicateRequestsHandler(store);
    const req = makeMockReq(`/requests/${original.id}/duplicate`);
    const res = makeMockRes();
    await handler(req as IncomingMessage, res as ServerResponse);
    expect(res._status).toBe(201);
    const body = JSON.parse(res._body);
    expect(body.id).not.toBe(original.id);
    expect(body.method).toBe(original.method);
    expect(body.url).toBe(original.url);
    expect(body.note).toContain(`[Duplicate of ${original.id}]`);
    expect(body.bookmarked).toBe(false);
    expect(body.tags).toEqual(["test"]);
  });
});
