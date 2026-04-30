import { createImportRoute } from "./import-route";
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

function makeMockReq(method: string, url: string, body = "[]") {
  const emitter = new EventEmitter() as IncomingMessage;
  (emitter as any).method = method;
  (emitter as any).url = url;
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
    writeHead(code: number) { this.statusCode = code; },
    end(data?: string) { this.body = data ?? ""; },
  };
  return res as unknown as ServerResponse;
}

describe("createImportRoute", () => {
  it("handles POST /__hookdeck/import and returns true", (done) => {
    const store = makeStore();
    const route = createImportRoute(store);
    const req = makeMockReq("POST", "/__hookdeck/import", JSON.stringify([
      { id: "r1", method: "GET", url: "/test", headers: {}, body: "", timestamp: "2024-01-01T00:00:00.000Z" },
    ]));
    const res = makeMockRes();

    const matched = route(req, res);
    expect(matched).toBe(true);

    setTimeout(() => {
      expect((res as any).statusCode).toBe(200);
      const parsed = JSON.parse((res as any).body);
      expect(parsed.imported).toBe(1);
      done();
    }, 20);
  });

  it("returns false for non-matching routes", () => {
    const store = makeStore();
    const route = createImportRoute(store);
    const req = makeMockReq("GET", "/__hookdeck/import");
    const res = makeMockRes();

    const matched = route(req, res);
    expect(matched).toBe(false);
  });

  it("returns false for POST to different path", () => {
    const store = makeStore();
    const route = createImportRoute(store);
    const req = makeMockReq("POST", "/other");
    const res = makeMockRes();

    const matched = route(req, res);
    expect(matched).toBe(false);
  });
});
