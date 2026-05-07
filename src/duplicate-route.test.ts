import { createDuplicateRoute } from "./duplicate-route";
import { createRequestStore } from "./request-store";
import { IncomingMessage, ServerResponse } from "http";

function makeStore() {
  return createRequestStore();
}

function makeMockReq(
  url: string,
  method = "POST"
): Partial<IncomingMessage> {
  return { url, method };
}

function makeMockRes(): Partial<ServerResponse> & {
  _status: number;
  _body: string;
} {
  const res: any = { _status: 0, _body: "" };
  res.writeHead = (status: number) => { res._status = status; };
  res.end = (body: string) => { res._body = body; };
  return res;
}

describe("createDuplicateRoute", () => {
  it("calls next for non-matching routes", () => {
    const store = makeStore();
    const route = createDuplicateRoute(store);
    const req = makeMockReq("/requests", "GET");
    const res = makeMockRes();
    const next = jest.fn();
    route(req as IncomingMessage, res as ServerResponse, next);
    expect(next).toHaveBeenCalled();
  });

  it("calls next for GET on duplicate path", () => {
    const store = makeStore();
    const route = createDuplicateRoute(store);
    const req = makeMockReq("/requests/abc123/duplicate", "GET");
    const res = makeMockRes();
    const next = jest.fn();
    route(req as IncomingMessage, res as ServerResponse, next);
    expect(next).toHaveBeenCalled();
  });

  it("handles POST to /requests/:id/duplicate", () => {
    const store = makeStore();
    const entry = store.add({
      method: "GET",
      url: "/ping",
      headers: {},
      body: "",
      timestamp: new Date().toISOString(),
      status: null,
      duration: null,
      tags: [],
      note: "",
      bookmarked: false,
      archived: false,
    });
    const route = createDuplicateRoute(store);
    const req = makeMockReq(`/requests/${entry.id}/duplicate`, "POST");
    const res = makeMockRes();
    const next = jest.fn();
    route(req as IncomingMessage, res as ServerResponse, next);
    expect(next).not.toHaveBeenCalled();
  });
});
