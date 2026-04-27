import { describe, it, expect, vi, beforeEach } from "vitest";
import { createProxyHandler, forwardRequest } from "./proxy";
import { createRequestStore } from "./request-store";
import { createLogger } from "./logger";
import http from "http";
import { IncomingMessage, ServerResponse } from "http";
import { EventEmitter } from "events";

vi.mock("./request-store");
vi.mock("./logger");

function makeMockReq(method = "POST", url = "/webhook", body = "{}"): IncomingMessage {
  const emitter = new EventEmitter() as IncomingMessage;
  emitter.method = method;
  emitter.url = url;
  emitter.headers = { "content-type": "application/json" };
  setTimeout(() => {
    emitter.emit("data", Buffer.from(body));
    emitter.emit("end");
  }, 0);
  return emitter;
}

function makeMockRes(): ServerResponse {
  const res = {
    writeHead: vi.fn(),
    end: vi.fn(),
  } as unknown as ServerResponse;
  return res;
}

describe("createProxyHandler", () => {
  let store: ReturnType<typeof createRequestStore>;
  let logger: ReturnType<typeof createLogger>;

  beforeEach(() => {
    store = {
      save: vi.fn().mockReturnValue("req-1"),
      saveResponse: vi.fn(),
      get: vi.fn(),
      list: vi.fn(),
    } as unknown as ReturnType<typeof createRequestStore>;

    logger = {
      info: vi.fn(),
      error: vi.fn(),
      write: vi.fn(),
    } as unknown as ReturnType<typeof createLogger>;
  });

  it("saves request to store and calls logger", async () => {
    const handler = createProxyHandler({
      targetUrl: "http://localhost:3000",
      port: 9000,
      store,
      logger,
    });

    const req = makeMockReq();
    const res = makeMockRes();

    // Mock forwardRequest to avoid real HTTP calls
    vi.mock("./proxy", async (importOriginal) => {
      const mod = await importOriginal<typeof import("./proxy")>();
      return {
        ...mod,
        forwardRequest: vi.fn().mockResolvedValue({
          statusCode: 200,
          headers: {},
          body: Buffer.from("ok"),
        }),
      };
    });

    await new Promise<void>((resolve) => {
      (res.end as ReturnType<typeof vi.fn>).mockImplementation(() => resolve());
      handler(req, res);
    });

    expect(store.save).toHaveBeenCalledWith(
      expect.objectContaining({ method: "POST", url: "/webhook" })
    );
  });
});
