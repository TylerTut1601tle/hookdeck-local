import { createClearRequestsHandler } from "./clear-requests";
import { createRequestStore } from "./request-store";
import { IncomingMessage, ServerResponse } from "http";

function makeMockReq(method = "DELETE"): Partial<IncomingMessage> {
  return { method };
}

function makeMockRes(): {
  res: Partial<ServerResponse>;
  statusCode: number | undefined;
  body: string;
} {
  let statusCode: number | undefined;
  let headers: Record<string, string> = {};
  let body = "";
  const res: Partial<ServerResponse> = {
    writeHead(code: number, hdrs?: any) {
      statusCode = code;
      if (hdrs) Object.assign(headers, hdrs);
    },
    end(chunk?: any) {
      if (chunk) body = chunk.toString();
    },
  };
  return { res, get statusCode() { return statusCode; }, get body() { return body; } };
}

describe("createClearRequestsHandler", () => {
  it("clears all requests and returns count", () => {
    const store = createRequestStore();
    store.add({ id: "1", method: "POST", path: "/hook", headers: {}, body: "a", timestamp: Date.now() });
    store.add({ id: "2", method: "POST", path: "/hook", headers: {}, body: "b", timestamp: Date.now() });
    const handler = createClearRequestsHandler(store);
    const mock = makeMockRes();
    handler(makeMockReq() as IncomingMessage, mock.res as ServerResponse);
    expect(mock.statusCode).toBe(200);
    const parsed = JSON.parse(mock.body);
    expect(parsed.cleared).toBe(2);
    expect(store.size()).toBe(0);
  });

  it("returns 0 when store is already empty", () => {
    const store = createRequestStore();
    const handler = createClearRequestsHandler(store);
    const mock = makeMockRes();
    handler(makeMockReq() as IncomingMessage, mock.res as ServerResponse);
    expect(mock.statusCode).toBe(200);
    const parsed = JSON.parse(mock.body);
    expect(parsed.cleared).toBe(0);
  });

  it("returns 405 for non-DELETE methods", () => {
    const store = createRequestStore();
    const handler = createClearRequestsHandler(store);
    const mock = makeMockRes();
    handler(makeMockReq("GET") as IncomingMessage, mock.res as ServerResponse);
    expect(mock.statusCode).toBe(405);
    const parsed = JSON.parse(mock.body);
    expect(parsed.error).toBe("Method Not Allowed");
  });
});
