import { createExportRequestsHandler } from "./export-requests";
import { createRequestStore } from "./request-store";

function makeMockReq(url: string): any {
  return {
    url,
    headers: { host: "localhost:9000" },
  };
}

function makeMockRes(): any {
  const res: any = {
    _status: 0,
    _headers: {} as Record<string, string>,
    _body: "",
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

function makeStore(entries: any[] = []) {
  const store = createRequestStore(10);
  for (const e of entries) store.add(e);
  return store;
}

const SAMPLE = {
  id: "abc123",
  method: "POST",
  url: "/hook",
  headers: {},
  body: "{}",
  status: 200,
  timestamp: "2024-01-01T00:00:00.000Z",
};

test("exports json by default", () => {
  const store = makeStore([SAMPLE]);
  const handler = createExportRequestsHandler(store);
  const req = makeMockReq("/export");
  const res = makeMockRes();
  handler(req, res);
  expect(res._status).toBe(200);
  expect(res._headers["Content-Type"]).toBe("application/json");
  const parsed = JSON.parse(res._body);
  expect(parsed).toHaveLength(1);
  expect(parsed[0].id).toBe("abc123");
});

test("exports ndjson when format=ndjson", () => {
  const store = makeStore([SAMPLE]);
  const handler = createExportRequestsHandler(store);
  const req = makeMockReq("/export?format=ndjson");
  const res = makeMockRes();
  handler(req, res);
  expect(res._status).toBe(200);
  expect(res._headers["Content-Type"]).toBe("application/x-ndjson");
  const lines = res._body.split("\n").filter(Boolean);
  expect(lines).toHaveLength(1);
  expect(JSON.parse(lines[0]).id).toBe("abc123");
});

test("exports csv when format=csv", () => {
  const store = makeStore([SAMPLE]);
  const handler = createExportRequestsHandler(store);
  const req = makeMockReq("/export?format=csv");
  const res = makeMockRes();
  handler(req, res);
  expect(res._status).toBe(200);
  expect(res._headers["Content-Type"]).toBe("text/csv");
  const lines = res._body.split("\n");
  expect(lines[0]).toBe("id,method,url,status,timestamp");
  expect(lines[1]).toContain("abc123");
  expect(lines[1]).toContain("POST");
});

test("exports empty json array when store is empty", () => {
  const store = makeStore();
  const handler = createExportRequestsHandler(store);
  const req = makeMockReq("/export");
  const res = makeMockRes();
  handler(req, res);
  expect(JSON.parse(res._body)).toEqual([]);
});
