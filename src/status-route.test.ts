import { createStatusHandler } from "./status-route";
import { createRequestStore, RequestStore } from "./request-store";
import { Config } from "./config";
import { IncomingMessage, ServerResponse } from "http";

function makeMockRes() {
  const res = {
    statusCode: 0,
    headers: {} as Record<string, string | number>,
    body: "",
    writeHead(code: number, headers?: Record<string, string | number>) {
      this.statusCode = code;
      if (headers) Object.assign(this.headers, headers);
    },
    end(data?: string) {
      if (data) this.body = data;
    },
  };
  return res as unknown as ServerResponse & { statusCode: number; body: string; headers: Record<string, string | number> };
}

const mockConfig: Config = {
  port: 3000,
  target: "http://localhost:8080",
  logFile: null,
};

describe("createStatusHandler", () => {
  let store: RequestStore;

  beforeEach(() => {
    store = createRequestStore();
  });

  it("responds with 200 status code", () => {
    const handler = createStatusHandler(store, mockConfig);
    const res = makeMockRes();
    handler({} as IncomingMessage, res);
    expect(res.statusCode).toBe(200);
  });

  it("returns JSON with status ok", () => {
    const handler = createStatusHandler(store, mockConfig);
    const res = makeMockRes();
    handler({} as IncomingMessage, res);
    const parsed = JSON.parse(res.body);
    expect(parsed.status).toBe("ok");
  });

  it("includes target from config", () => {
    const handler = createStatusHandler(store, mockConfig);
    const res = makeMockRes();
    handler({} as IncomingMessage, res);
    const parsed = JSON.parse(res.body);
    expect(parsed.target).toBe("http://localhost:8080");
  });

  it("returns correct requestCount", () => {
    store.add({ id: "1", method: "GET", url: "/test", headers: {}, body: "", timestamp: Date.now(), response: null });
    store.add({ id: "2", method: "POST", url: "/other", headers: {}, body: "{}", timestamp: Date.now(), response: null });
    const handler = createStatusHandler(store, mockConfig);
    const res = makeMockRes();
    handler({} as IncomingMessage, res);
    const parsed = JSON.parse(res.body);
    expect(parsed.requestCount).toBe(2);
  });

  it("sets Content-Type header to application/json", () => {
    const handler = createStatusHandler(store, mockConfig);
    const res = makeMockRes();
    handler({} as IncomingMessage, res);
    expect(res.headers["Content-Type"]).toBe("application/json");
  });

  it("includes uptime as a non-negative number", () => {
    const handler = createStatusHandler(store, mockConfig);
    const res = makeMockRes();
    handler({} as IncomingMessage, res);
    const parsed = JSON.parse(res.body);
    expect(typeof parsed.uptime).toBe("number");
    expect(parsed.uptime).toBeGreaterThanOrEqual(0);
  });
});
