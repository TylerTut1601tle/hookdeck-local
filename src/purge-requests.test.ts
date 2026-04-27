import { createPurgeHandler } from "./purge-requests";
import { IncomingMessage, ServerResponse } from "http";

function makeMockReq(method: string, url: string): Partial<IncomingMessage> {
  return { method, url };
}

function makeMockRes(): Partial<ServerResponse> & {
  _status: number;
  _body: string;
  _headers: Record<string, string>;
} {
  const res = {
    _status: 0,
    _body: "",
    _headers: {} as Record<string, string>,
    writeHead(status: number, headers?: Record<string, string>) {
      res._status = status;
      if (headers) Object.assign(res._headers, headers);
    },
    end(body: string) {
      res._body = body;
    },
  };
  return res;
}

describe("createPurgeHandler", () => {
  function makeStore(overrides = {}) {
    return {
      purgeAll: jest.fn().mockReturnValue(5),
      purgeOlderThan: jest.fn().mockReturnValue(3),
      ...overrides,
    } as any;
  }

  it("purges all requests when no query param", () => {
    const store = makeStore();
    const handler = createPurgeHandler(store);
    const req = makeMockReq("DELETE", "/__hookdeck/purge");
    const res = makeMockRes();
    handler(req as any, res as any);
    expect(store.purgeAll).toHaveBeenCalled();
    expect(res._status).toBe(200);
    expect(JSON.parse(res._body)).toEqual({ purged: 5 });
  });

  it("purges requests older than given seconds", () => {
    const store = makeStore();
    const handler = createPurgeHandler(store);
    const req = makeMockReq("DELETE", "/__hookdeck/purge?olderThan=60");
    const res = makeMockRes();
    handler(req as any, res as any);
    expect(store.purgeOlderThan).toHaveBeenCalled();
    expect(res._status).toBe(200);
    expect(JSON.parse(res._body)).toEqual({ purged: 3 });
  });

  it("returns 400 for invalid olderThan param", () => {
    const store = makeStore();
    const handler = createPurgeHandler(store);
    const req = makeMockReq("DELETE", "/__hookdeck/purge?olderThan=abc");
    const res = makeMockRes();
    handler(req as any, res as any);
    expect(res._status).toBe(400);
    expect(JSON.parse(res._body)).toHaveProperty("error");
  });
});
