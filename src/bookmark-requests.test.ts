import { describe, it, expect, beforeEach, mock } from "bun:test";
import { createBookmarkRequestsHandler } from "./bookmark-requests";
import { IncomingMessage, ServerResponse } from "http";

function makeStore(overrides: Record<string, any> = {}) {
  return {
    getById: mock(() => null),
    update: mock(() => {}),
    ...overrides,
  } as any;
}

function makeMockReq(url: string, method = "POST"): IncomingMessage {
  return {
    url,
    method,
    headers: { host: "localhost:9000" },
  } as unknown as IncomingMessage;
}

function makeMockRes(): ServerResponse & { _status: number; _body: string } {
  const res: any = {
    _status: 0,
    _body: "",
    _headers: {} as Record<string, string>,
    writeHead(status: number, headers: Record<string, string>) {
      this._status = status;
      this._headers = headers;
    },
    end(body: string) {
      this._body = body;
    },
  };
  return res;
}

describe("createBookmarkRequestsHandler", () => {
  it("returns 400 when id is missing", () => {
    const store = makeStore();
    const handler = createBookmarkRequestsHandler(store);
    const req = makeMockReq("/bookmark");
    const res = makeMockRes();
    handler(req, res);
    expect(res._status).toBe(400);
    expect(JSON.parse(res._body)).toMatchObject({ error: /id/ });
  });

  it("returns 404 when request not found", () => {
    const store = makeStore({ getById: mock(() => null) });
    const handler = createBookmarkRequestsHandler(store);
    const req = makeMockReq("/bookmark?id=abc123");
    const res = makeMockRes();
    handler(req, res);
    expect(res._status).toBe(404);
    expect(JSON.parse(res._body)).toMatchObject({ error: /abc123/ });
  });

  it("bookmarks a request that is not yet bookmarked", () => {
    const store = makeStore({ getById: mock(() => ({ id: "abc", bookmarked: false })) });
    const handler = createBookmarkRequestsHandler(store);
    const req = makeMockReq("/bookmark?id=abc");
    const res = makeMockRes();
    handler(req, res);
    expect(res._status).toBe(200);
    expect(store.update).toHaveBeenCalledWith("abc", { bookmarked: true });
    expect(JSON.parse(res._body)).toMatchObject({ id: "abc", bookmarked: true });
  });

  it("returns already bookmarked message when already bookmarked", () => {
    const store = makeStore({ getById: mock(() => ({ id: "abc", bookmarked: true })) });
    const handler = createBookmarkRequestsHandler(store);
    const req = makeMockReq("/bookmark?id=abc");
    const res = makeMockRes();
    handler(req, res);
    expect(res._status).toBe(200);
    expect(JSON.parse(res._body)).toMatchObject({ message: /Already/ });
    expect(store.update).not.toHaveBeenCalled();
  });

  it("removes bookmark on DELETE", () => {
    const store = makeStore({ getById: mock(() => ({ id: "abc", bookmarked: true })) });
    const handler = createBookmarkRequestsHandler(store);
    const req = makeMockReq("/bookmark?id=abc", "DELETE");
    const res = makeMockRes();
    handler(req, res);
    expect(res._status).toBe(200);
    expect(store.update).toHaveBeenCalledWith("abc", { bookmarked: false });
    expect(JSON.parse(res._body)).toMatchObject({ id: "abc", bookmarked: false });
  });
});
