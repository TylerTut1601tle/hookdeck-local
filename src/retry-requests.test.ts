import { createRetryRequestsHandler } from "./retry-requests";
import { createRequestStore } from "./request-store";
import { IncomingMessage, ServerResponse } from "http";

jest.mock("./replay", () => ({
  replayRequest: jest.fn(),
}));

import { replayRequest } from "./replay";
const mockReplay = replayRequest as jest.MockedFunction<typeof replayRequest>;

function makeStore() {
  const store = createRequestStore();
  store.add({ id: "abc", method: "POST", path: "/hook", headers: {}, body: "{}", timestamp: Date.now(), statusCode: 200 });
  return store;
}

function makeMockReq(url: string): IncomingMessage {
  return { url, headers: {} } as IncomingMessage;
}

function makeMockRes(): { res: ServerResponse; status: () => number | undefined; body: () => string } {
  let statusCode: number | undefined;
  let body = "";
  const res = {
    writeHead: (code: number) => { statusCode = code; },
    end: (data: string) => { body = data; },
  } as unknown as ServerResponse;
  return { res, status: () => statusCode, body: () => body };
}

describe("createRetryRequestsHandler", () => {
  beforeEach(() => mockReplay.mockReset());

  it("returns 400 when no ids provided", async () => {
    const store = makeStore();
    const handler = createRetryRequestsHandler(store, "http://localhost:3000");
    const { res, status } = makeMockRes();
    await handler(makeMockReq("/_hookdeck/retry"), res);
    expect(status()).toBe(400);
  });

  it("returns 207 when one id not found", async () => {
    const store = makeStore();
    const handler = createRetryRequestsHandler(store, "http://localhost:3000");
    const { res, status, body } = makeMockRes();
    await handler(makeMockReq("/_hookdeck/retry?id=missing"), res);
    expect(status()).toBe(207);
    const parsed = JSON.parse(body());
    expect(parsed.results[0].error).toBe("Not found");
  });

  it("returns 200 when replay succeeds", async () => {
    mockReplay.mockResolvedValue(200);
    const store = makeStore();
    const handler = createRetryRequestsHandler(store, "http://localhost:3000");
    const { res, status, body } = makeMockRes();
    await handler(makeMockReq("/_hookdeck/retry?id=abc"), res);
    expect(status()).toBe(200);
    const parsed = JSON.parse(body());
    expect(parsed.results[0].success).toBe(true);
  });

  it("handles replay errors gracefully", async () => {
    mockReplay.mockRejectedValue(new Error("connection refused"));
    const store = makeStore();
    const handler = createRetryRequestsHandler(store, "http://localhost:3000");
    const { res, status, body } = makeMockRes();
    await handler(makeMockReq("/_hookdeck/retry?id=abc"), res);
    expect(status()).toBe(207);
    const parsed = JSON.parse(body());
    expect(parsed.results[0].error).toBe("connection refused");
  });
});
