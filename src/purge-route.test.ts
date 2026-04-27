import { createPurgeRoute } from "./purge-route";
import { IncomingMessage, ServerResponse } from "http";

function makeMockReq(method: string, url: string): Partial<IncomingMessage> {
  return { method, url };
}

function makeMockRes(): Partial<ServerResponse> & {
  _status: number;
  _body: string;
} {
  const res = {
    _status: 0,
    _body: "",
    writeHead(status: number) {
      res._status = status;
    },
    end(body: string) {
      res._body = body;
    },
  };
  return res;
}

describe("createPurgeRoute", () => {
  function makeStore() {
    return {
      purgeAll: jest.fn().mockReturnValue(2),
      purgeOlderThan: jest.fn().mockReturnValue(1),
    } as any;
  }

  it("matches DELETE /__hookdeck/purge and returns true", () => {
    const store = makeStore();
    const route = createPurgeRoute(store);
    const req = makeMockReq("DELETE", "/__hookdeck/purge");
    const res = makeMockRes();
    const matched = route(req as any, res as any);
    expect(matched).toBe(true);
    expect(store.purgeAll).toHaveBeenCalled();
  });

  it("does not match GET /__hookdeck/purge", () => {
    const store = makeStore();
    const route = createPurgeRoute(store);
    const req = makeMockReq("GET", "/__hookdeck/purge");
    const res = makeMockRes();
    const matched = route(req as any, res as any);
    expect(matched).toBe(false);
    expect(store.purgeAll).not.toHaveBeenCalled();
  });

  it("does not match DELETE on a different path", () => {
    const store = makeStore();
    const route = createPurgeRoute(store);
    const req = makeMockReq("DELETE", "/__hookdeck/requests");
    const res = makeMockRes();
    const matched = route(req as any, res as any);
    expect(matched).toBe(false);
  });
});
