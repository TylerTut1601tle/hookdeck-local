import { createPinRoute } from "./pin-route";
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

function makeMockReq(
  method: string,
  url: string
): Partial<IncomingMessage> {
  return { method, url };
}

function makeMockRes(): Partial<ServerResponse> & {
  _status: number;
  _body: string;
} {
  const res: any = { _status: 0, _body: "" };
  res.writeHead = (status: number) => {
    res._status = status;
  };
  res.end = (body: string) => {
    res._body = body;
  };
  return res;
}

describe("createPinRoute", () => {
  it("returns false for non-matching route", () => {
    const store = makeStore();
    const route = createPinRoute(store);
    const req = makeMockReq("GET", "/other");
    const res = makeMockRes();
    const handled = route(req as any, res as any);
    expect(handled).toBe(false);
  });

  it("returns false for GET on pin route", () => {
    const store = makeStore();
    const route = createPinRoute(store);
    const req = makeMockReq("GET", "/__hookdeck/pin?id=abc");
    const res = makeMockRes();
    const handled = route(req as any, res as any);
    expect(handled).toBe(false);
  });

  it("handles POST /__hookdeck/pin and returns true", () => {
    const store = makeStore({ abc: { id: "abc", pinned: false } });
    const route = createPinRoute(store);
    const req = makeMockReq("POST", "/__hookdeck/pin?id=abc");
    const res = makeMockRes();
    const handled = route(req as any, res as any);
    expect(handled).toBe(true);
    expect(res._status).toBe(200);
  });

  it("handles missing id and returns true with 400", () => {
    const store = makeStore();
    const route = createPinRoute(store);
    const req = makeMockReq("POST", "/__hookdeck/pin");
    const res = makeMockRes();
    const handled = route(req as any, res as any);
    expect(handled).toBe(true);
    expect(res._status).toBe(400);
  });
});
