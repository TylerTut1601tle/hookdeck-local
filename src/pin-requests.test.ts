import { createPinRequestsHandler } from "./pin-requests";
import { IncomingMessage, ServerResponse } from "http";

function makeStore(requests: Record<string, any> = {}) {
  const data: Record<string, any> = { ...requests };
  return {
    getById: (id: string) => data[id] ?? null,
    update: (id: string, fields: Record<string, any>) => {
      if (!data[id]) return null;
      data[id] = { ...data[id], ...fields };
      return data[id];
    },
  } as any;
}

function makeMockReq(url: string): Partial<IncomingMessage> {
  return { url };
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
  res.end = (body: string) => {
    res._body = body;
  };
  return res;
}

describe("createPinRequestsHandler", () => {
  it("returns 400 if id is missing", () => {
    const store = makeStore();
    const handler = createPinRequestsHandler(store);
    const req = makeMockReq("/pin");
    const res = makeMockRes();
    handler(req as any, res as any);
    expect(res._status).toBe(400);
    expect(JSON.parse(res._body)).toMatchObject({ error: expect.any(String) });
  });

  it("returns 404 if request not found", () => {
    const store = makeStore();
    const handler = createPinRequestsHandler(store);
    const req = makeMockReq("/pin?id=missing");
    const res = makeMockRes();
    handler(req as any, res as any);
    expect(res._status).toBe(404);
    expect(JSON.parse(res._body)).toMatchObject({ error: expect.any(String) });
  });

  it("pins an unpinned request", () => {
    const store = makeStore({ abc: { id: "abc", pinned: false } });
    const handler = createPinRequestsHandler(store);
    const req = makeMockReq("/pin?id=abc");
    const res = makeMockRes();
    handler(req as any, res as any);
    expect(res._status).toBe(200);
    const body = JSON.parse(res._body);
    expect(body.pinned).toBe(true);
    expect(body.message).toBe("Request pinned");
  });

  it("unpins a pinned request", () => {
    const store = makeStore({ abc: { id: "abc", pinned: true } });
    const handler = createPinRequestsHandler(store);
    const req = makeMockReq("/pin?id=abc");
    const res = makeMockRes();
    handler(req as any, res as any);
    expect(res._status).toBe(200);
    const body = JSON.parse(res._body);
    expect(body.pinned).toBe(false);
    expect(body.message).toBe("Request unpinned");
  });
});
