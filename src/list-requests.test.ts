import { createListRequestsHandler } from "./list-requests";
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
    writeHead(code: number) {
      statusCode = code;
    },
    end(data?: unknown) {
      body = String(data ?? "");
    },
  };
  return { res, get statusCode() { return statusCode; }, get body() { return body; } };
}

describe("createListRequestsHandler", () => {
  it("returns 405 for non-GET requests", () => {
    const store = createRequestStore();
    const handler = createListRequestsHandler(store);
    const req = makeMockReq("POST", "/__hookdeck/requests");
    const { res, statusCode } = makeMockRes();
    handler(req as IncomingMessage, res as ServerResponse);
    expect(statusCode).toBe(405);
  });

  it("returns empty list when no requests stored", () => {
    const store = createRequestStore();
    const handler = createListRequestsHandler(store);
    const req = makeMockReq("GET", "/__hookdeck/requests");
    const { res, statusCode, body } = makeMockRes();
    handler(req as IncomingMessage, res as ServerResponse);
    expect(statusCode).toBe(200);
    const parsed = JSON.parse(body);
    expect(parsed.requests).toEqual([]);
    expect(parsed.total).toBe(0);
  });

  it("returns summaries of stored requests", () => {
    const store = createRequestStore();
    store.save({
      id: "abc123",
      method: "POST",
      url: "/webhook",
      headers: {},
      body: "{}",
      timestamp: 1000,
      statusCode: 200,
    });
    const handler = createListRequestsHandler(store);
    const req = makeMockReq("GET", "/__hookdeck/requests");
    const { res, statusCode, body } = makeMockRes();
    handler(req as IncomingMessage, res as ServerResponse);
    expect(statusCode).toBe(200);
    const parsed = JSON.parse(body);
    expect(parsed.requests).toHaveLength(1);
    expect(parsed.requests[0].id).toBe("abc123");
    expect(parsed.requests[0].method).toBe("POST");
  });
});
