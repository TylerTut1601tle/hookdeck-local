import { IncomingMessage, ServerResponse } from "http";
import { createSearchRequestsHandler } from "./search-requests";

function makeMockReq(url: string): Partial<IncomingMessage> {
  return { url, headers: { host: "localhost:9000" } };
}

function makeMockRes(): {
  res: Partial<ServerResponse>;
  getBody: () => string;
  getStatus: () => number;
} {
  let body = "";
  let statusCode = 0;
  const res: Partial<ServerResponse> = {
    writeHead(code: number) {
      statusCode = code;
      return this as ServerResponse;
    },
    end(data: unknown) {
      body = data as string;
      return this as ServerResponse;
    },
  };
  return { res, getBody: () => body, getStatus: () => statusCode };
}

function makeStore(requests: object[]) {
  return { getAll: () => requests } as ReturnType<
    typeof import("./request-store").createRequestStore
  >;
}

const sampleRequests = [
  { id: "1", method: "GET", url: "/api/users", responseStatus: 200, timestamp: "2024-01-01T10:00:00.000Z" },
  { id: "2", method: "POST", url: "/api/orders", responseStatus: 201, timestamp: "2024-01-01T11:00:00.000Z" },
  { id: "3", method: "GET", url: "/api/products", responseStatus: 404, timestamp: "2024-01-01T12:00:00.000Z" },
];

test("returns all requests when no filters applied", () => {
  const store = makeStore(sampleRequests);
  const handler = createSearchRequestsHandler(store);
  const req = makeMockReq("/search");
  const { res, getBody, getStatus } = makeMockRes();
  handler(req as IncomingMessage, res as ServerResponse);
  expect(getStatus()).toBe(200);
  const body = JSON.parse(getBody());
  expect(body.count).toBe(3);
});

test("filters by method", () => {
  const store = makeStore(sampleRequests);
  const handler = createSearchRequestsHandler(store);
  const req = makeMockReq("/search?method=GET");
  const { res, getBody } = makeMockRes();
  handler(req as IncomingMessage, res as ServerResponse);
  const body = JSON.parse(getBody());
  expect(body.count).toBe(2);
  expect(body.results.every((r: { method: string }) => r.method === "GET")).toBe(true);
});

test("filters by path substring", () => {
  const store = makeStore(sampleRequests);
  const handler = createSearchRequestsHandler(store);
  const req = makeMockReq("/search?path=/api/users");
  const { res, getBody } = makeMockRes();
  handler(req as IncomingMessage, res as ServerResponse);
  const body = JSON.parse(getBody());
  expect(body.count).toBe(1);
  expect(body.results[0].id).toBe("1");
});

test("filters by status code", () => {
  const store = makeStore(sampleRequests);
  const handler = createSearchRequestsHandler(store);
  const req = makeMockReq("/search?status=404");
  const { res, getBody } = makeMockRes();
  handler(req as IncomingMessage, res as ServerResponse);
  const body = JSON.parse(getBody());
  expect(body.count).toBe(1);
  expect(body.results[0].responseStatus).toBe(404);
});

test("respects limit parameter", () => {
  const store = makeStore(sampleRequests);
  const handler = createSearchRequestsHandler(store);
  const req = makeMockReq("/search?limit=2");
  const { res, getBody } = makeMockRes();
  handler(req as IncomingMessage, res as ServerResponse);
  const body = JSON.parse(getBody());
  expect(body.count).toBe(2);
});
