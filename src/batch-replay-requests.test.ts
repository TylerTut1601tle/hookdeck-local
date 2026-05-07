import { createBatchReplayRequestsHandler } from "./batch-replay-requests";
import { createRequestStore } from "./request-store";
import { EventEmitter } from "events";

const TARGET_URL = "http://localhost:3000";

function makeStore() {
  const store = createRequestStore();
  store.add({
    id: "req-1",
    method: "POST",
    url: "/webhook",
    headers: { "content-type": "application/json" },
    body: '{"event":"test"}',
    timestamp: Date.now(),
  });
  store.add({
    id: "req-2",
    method: "GET",
    url: "/ping",
    headers: {},
    body: "",
    timestamp: Date.now(),
  });
  return store;
}

function makeMockReq(body: string) {
  const emitter = new EventEmitter() as any;
  emitter.method = "POST";
  emitter.url = "/__hookdeck/batch-replay";
  emitter.headers = { "content-type": "application/json" };
  process.nextTick(() => {
    emitter.emit("data", Buffer.from(body));
    emitter.emit("end");
  });
  return emitter;
}

function makeMockRes() {
  const res: any = {
    statusCode: 0,
    headers: {} as Record<string, string>,
    body: "",
    writeHead(code: number, headers: Record<string, string>) {
      this.statusCode = code;
      this.headers = headers;
    },
    end(data: string) {
      this.body = data;
    },
  };
  return res;
}

jest.mock("./replay", () => ({
  replayRequest: jest.fn(),
}));

import { replayRequest } from "./replay";
const mockReplay = replayRequest as jest.MockedFunction<typeof replayRequest>;

describe("createBatchReplayRequestsHandler", () => {
  beforeEach(() => jest.clearAllMocks());

  it("replays multiple requests and returns results", async () => {
    const store = makeStore();
    const handler = createBatchReplayRequestsHandler(store, TARGET_URL);
    mockReplay.mockResolvedValue({ statusCode: 200 } as any);

    const req = makeMockReq(JSON.stringify({ ids: ["req-1", "req-2"] }));
    const res = makeMockRes();

    await new Promise<void>((resolve) => {
      res.end = (data: string) => { res.body = data; resolve(); };
      handler(req, res);
    });

    expect(res.statusCode).toBe(200);
    const parsed = JSON.parse(res.body);
    expect(parsed.total).toBe(2);
    expect(parsed.succeeded).toBe(2);
    expect(parsed.failed).toBe(0);
  });

  it("returns error for unknown request ids", async () => {
    const store = makeStore();
    const handler = createBatchReplayRequestsHandler(store, TARGET_URL);

    const req = makeMockReq(JSON.stringify({ ids: ["unknown-id"] }));
    const res = makeMockRes();

    await new Promise<void>((resolve) => {
      res.end = (data: string) => { res.body = data; resolve(); };
      handler(req, res);
    });

    const parsed = JSON.parse(res.body);
    expect(parsed.total).toBe(1);
    expect(parsed.failed).toBe(1);
    expect(parsed.results[0].error).toBe("Request not found");
  });

  it("returns 400 for missing ids", async () => {
    const store = makeStore();
    const handler = createBatchReplayRequestsHandler(store, TARGET_URL);

    const req = makeMockReq(JSON.stringify({ ids: [] }));
    const res = makeMockRes();

    await new Promise<void>((resolve) => {
      res.end = (data: string) => { res.body = data; resolve(); };
      handler(req, res);
    });

    expect(res.statusCode).toBe(400);
  });

  it("returns 400 for invalid JSON", async () => {
    const store = makeStore();
    const handler = createBatchReplayRequestsHandler(store, TARGET_URL);

    const req = makeMockReq("not-json");
    const res = makeMockRes();

    await new Promise<void>((resolve) => {
      res.end = (data: string) => { res.body = data; resolve(); };
      handler(req, res);
    });

    expect(res.statusCode).toBe(400);
    const parsed = JSON.parse(res.body);
    expect(parsed.error).toBe("Invalid JSON body");
  });
});
