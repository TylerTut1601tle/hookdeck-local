import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createServer } from "./server";

vi.mock("./config", () => ({
  loadConfig: vi.fn().mockReturnValue({
    port: 19999,
    targetUrl: "http://localhost:3000",
    logLevel: "info",
  }),
}));

vi.mock("./request-store", () => ({
  createRequestStore: vi.fn().mockReturnValue({
    save: vi.fn().mockReturnValue("req-1"),
    saveResponse: vi.fn(),
    get: vi.fn(),
    list: vi.fn(),
  }),
}));

vi.mock("./logger", () => ({
  createLogger: vi.fn().mockReturnValue({
    info: vi.fn(),
    error: vi.fn(),
    write: vi.fn(),
  }),
}));

vi.mock("./proxy", () => ({
  createProxyHandler: vi.fn().mockReturnValue((_req: unknown, res: { writeHead: Function; end: Function }) => {
    res.writeHead(200);
    res.end("ok");
  }),
}));

describe("createServer", () => {
  let instance: ReturnType<typeof createServer>;

  beforeEach(() => {
    instance = createServer();
  });

  afterEach(async () => {
    await instance.stop().catch(() => {});
  });

  it("returns a server instance with start and stop", () => {
    expect(instance).toHaveProperty("start");
    expect(instance).toHaveProperty("stop");
    expect(instance).toHaveProperty("server");
  });

  it("starts and listens on configured port", async () => {
    await instance.start();
    expect(instance.server.listening).toBe(true);
  });

  it("stops the server cleanly", async () => {
    await instance.start();
    await instance.stop();
    expect(instance.server.listening).toBe(false);
  });
});
