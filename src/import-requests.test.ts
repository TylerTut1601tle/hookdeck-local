import { createImportRequestsHandler } from "./import-requests";
import { IncomingMessage, ServerResponse } from "http";
import { EventEmitter } from "events";

function makeStore() {
  const saved: unknown[] = [];
  return {
    save: (entry: unknown) => saved.push(entry),
    all: () => saved,
    get: (_id: string) => undefined,
    remove: (_id: string) => false,
    clear: () => { saved.length = 0; },
    size: () => saved.length,
  } as any;
}

function makeMockReq(body: string): IncomingMessage {
  const emitter = new EventEmitter() as IncomingMessage;
  process.nextTick(() => {
    emitter.emit("data", Buffer.from(body));
    emitter.emit("end");
  });
  return emitter;
}

function makeMockRes(): ServerResponse {
  const res = {
    statusCode: 0,
    body: "",
    headers: {} as Record<string, string>,
    writeHead(code: number, headers?: Record<string, string>) {
      this.statusCode = code;
      if (headers) Object.assign(this.headers, headers);
    },
    end(data?: string) {
      this.body = data ?? "";
    },
  };
  return res as unknown as ServerResponse;
}

describe("createImportRequestsHandler", () => {
  it("imports valid requests and returns count", (done) => {
    const store = makeStore();
    const handler = createImportRequestsHandler(store);
    const body = JSON.stringify([
      { id: "abc", method: "POST", url: "/hook", headers: {}, body: "hello", timestamp: "2024-01-01T00:00:00.000Z" },
    ]);
    const req = makeMockReq(body);
    const res = makeMockRes();

    handler(req, res);

    setTimeout(() => {
      expect((res as any).statusCode).toBe(200);
      const parsed = JSON.parse((res as any).body);
      expect(parsed.imported).toBe(1);
      expect(parsed.errors).toHaveLength(0);
      expect(store.size()).toBe(1);
      done();
    }, 20);
  });

  it("returns 400 for invalid JSON", (done) => {
    const store = makeStore();
    const handler = createImportRequestsHandler(store);
    const req = makeMockReq("not json");
    const res = makeMockRes();

    handler(req, res);

    setTimeout(() => {
      expect((res as any).statusCode).toBe(400);
      const parsed = JSON.parse((res as any).body);
      expect(parsed.error).toMatch(/Invalid JSON/);
      done();
    }, 20);
  });

  it("returns 400 when body is not an array", (done) => {
    const store = makeStore();
    const handler = createImportRequestsHandler(store);
    const req = makeMockReq(JSON.stringify({ id: "x" }));
    const res = makeMockRes();

    handler(req, res);

    setTimeout(() => {
      expect((res as any).statusCode).toBe(400);
      const parsed = JSON.parse((res as any).body);
      expect(parsed.error).toMatch(/array/);
      done();
    }, 20);
  });

  it("skips entries missing required fields and reports errors", (done) => {
    const store = makeStore();
    const handler = createImportRequestsHandler(store);
    const body = JSON.stringify([
      { id: "abc", method: "GET", url: "/ok", headers: {}, body: "", timestamp: "2024-01-01T00:00:00.000Z" },
      { headers: {} },
    ]);
    const req = makeMockReq(body);
    const res = makeMockRes();

    handler(req, res);

    setTimeout(() => {
      expect((res as any).statusCode).toBe(200);
      const parsed = JSON.parse((res as any).body);
      expect(parsed.imported).toBe(1);
      expect(parsed.errors).toHaveLength(1);
      done();
    }, 20);
  });
});
