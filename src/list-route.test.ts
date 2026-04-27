import { createListRoute } from "./list-route";
import { createRequestStore } from "./request-store";
import { IncomingMessage, ServerResponse } from "http";

function makeMockReq(
  method: string,
  url: string
): Partial<IncomingMessage> {
  return { method, url, headers: { host: "localhost:9000" } };
}

function makeMockRes(): {
  res: Partial<ServerResponse>;
  statusCode: number | null;
  body: string;
} {
  let statusCode: number | null = null;
  let body = "";
  const res: Partial<ServerResponse> = {
    writeHead(code: number) { statusCode = code; },
    end(data?: unknown) { body = String(data ?? ""); },
  };
  return { res, get statusCode() { return statusCode; }, get body() { return body; } };
}

describe("createListRoute", () => {
  it("returns false for non-matching paths", () => {
    const store = createRequestStore();
    const route = createListRoute(store);
    const req = makeMockReq("GET", "/webhook");
    const { res } = makeMockRes();
    const handled = route(req as IncomingMessage, res as ServerResponse);
    expect(handled).toBe(false);
  });

  it("returns true and handles /__hookdeck/requests", () => {
    const store = createRequestStore();
    const route = createListRoute(store);
    const req = makeMockReq("GET", "/__hookdeck/requests");
    const { res, statusCode, body } = makeMockRes();
    const handled = route(req as IncomingMessage, res as ServerResponse);
    expect(handled).toBe(true);
    expect(statusCode).toBe(200);
    const parsed = JSON.parse(body);
    expect(parsed.requests).toEqual([]);
  });

  it("handles path with query string", () => {
    const store = createRequestStore();
    const route = createListRoute(store);
    const req = makeMockReq("GET", "/__hookdeck/requests?limit=5");
    const { res, statusCode } = makeMockRes();
    const handled = route(req as IncomingMessage, res as ServerResponse);
    expect(handled).toBe(true);
    expect(statusCode).toBe(200);
  });

  it("does not match partial paths", () => {
    const store = createRequestStore();
    const route = createListRoute(store);
    const req = makeMockReq("GET", "/__hookdeck/requests/extra");
    const { res } = makeMockRes();
    const handled = route(req as IncomingMessage, res as ServerResponse);
    expect(handled).toBe(false);
  });
});
