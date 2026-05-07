import { createArchiveRequestsHandler } from "./archive-requests";
import { IncomingMessage, ServerResponse } from "http";

function makeStore(items: any[] = []) {
  const data = items.map((i) => ({ ...i }));
  return {
    getAll: () => data,
    getById: (id: string) => data.find((r) => r.id === id) ?? null,
    update: (id: string, patch: any) => {
      const r = data.find((r) => r.id === id);
      if (r) Object.assign(r, patch);
    },
  } as any;
}

function makeMockReq(url: string): IncomingMessage {
  return { url, method: "POST" } as IncomingMessage;
}

function makeMockRes() {
  const res: any = {};
  res.chunks = [] as string[];
  res.statusCode = 200;
  res.headers = {} as Record<string, string>;
  res.writeHead = (code: number, headers?: any) => {
    res.statusCode = code;
    Object.assign(res.headers, headers ?? {});
  };
  res.end = (body: string) => {
    res.body = body;
  };
  return res as ServerResponse & { statusCode: number; body: string };
}

describe("createArchiveRequestsHandler", () => {
  it("returns 400 when no id or all param", () => {
    const store = makeStore();
    const handler = createArchiveRequestsHandler(store);
    const req = makeMockReq("/archive");
    const res = makeMockRes();
    handler(req, res);
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body)).toHaveProperty("error");
  });

  it("archives a single request by id", () => {
    const store = makeStore([{ id: "abc", archived: false }]);
    const handler = createArchiveRequestsHandler(store);
    const req = makeMockReq("/archive?id=abc");
    const res = makeMockRes();
    handler(req, res);
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.archived).toBe(1);
    expect(body.id).toBe("abc");
    expect(store.getById("abc").archived).toBe(true);
  });

  it("returns 404 for unknown id", () => {
    const store = makeStore([]);
    const handler = createArchiveRequestsHandler(store);
    const req = makeMockReq("/archive?id=missing");
    const res = makeMockRes();
    handler(req, res);
    expect(res.statusCode).toBe(404);
  });

  it("archives all requests when all=true", () => {
    const store = makeStore([
      { id: "1", archived: false },
      { id: "2", archived: false },
      { id: "3", archived: true },
    ]);
    const handler = createArchiveRequestsHandler(store);
    const req = makeMockReq("/archive?all=true");
    const res = makeMockRes();
    handler(req, res);
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.archived).toBe(2);
  });
});
