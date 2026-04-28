import { createExportRoute } from "./export-route";
import { createRequestStore } from "./request-store";

function makeMockReq(method: string, url: string): any {
  return {
    method,
    url,
    headers: { host: "localhost:9000" },
  };
}

function makeMockRes(): any {
  return {
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
}

function makeStore() {
  return createRequestStore(10);
}

test("returns true and handles GET /__hookdeck/export", () => {
  const store = makeStore();
  const route = createExportRoute(store);
  const req = makeMockReq("GET", "/__hookdeck/export");
  const res = makeMockRes();
  const handled = route(req, res);
  expect(handled).toBe(true);
  expect(res._status).toBe(200);
});

test("returns true for GET /__hookdeck/export?format=csv", () => {
  const store = makeStore();
  const route = createExportRoute(store);
  const req = makeMockReq("GET", "/__hookdeck/export?format=csv");
  const res = makeMockRes();
  const handled = route(req, res);
  expect(handled).toBe(true);
  expect(res._headers["Content-Type"]).toBe("text/csv");
});

test("returns false for non-matching path", () => {
  const store = makeStore();
  const route = createExportRoute(store);
  const req = makeMockReq("GET", "/other");
  const res = makeMockRes();
  const handled = route(req, res);
  expect(handled).toBe(false);
  expect(res._status).toBe(0);
});

test("returns false for POST to export path", () => {
  const store = makeStore();
  const route = createExportRoute(store);
  const req = makeMockReq("POST", "/__hookdeck/export");
  const res = makeMockRes();
  const handled = route(req, res);
  expect(handled).toBe(false);
});
