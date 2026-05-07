import { createRetryRoute } from "./retry-route";
import { createRequestStore } from "./request-store";
import { IncomingMessage, ServerResponse } from "http";

jest.mock("./replay", () => ({
  replayRequest: jest.fn().mockResolvedValue(200),
}));

function makeStore() {
  const store = createRequestStore();
  store.add({ id: "abc", method: "POST", path: "/hook", headers: {}, body: "{}", timestamp: Date.now(), statusCode: 200 });
  return store;
}

function makeMockReq(method: string, url: string): IncomingMessage {
  return { method, url, headers: {} } as IncomingMessage;
}

function makeMockRes(): { res: ServerResponse; status: () => number | undefined } {
  let statusCode: number | undefined;
  const res = {
    writeHead: (code: number) => { statusCode = code; },
    end: jest.fn(),
  } as unknown as ServerResponse;
  return { res, status: () => statusCode };
}

describe("createRetryRoute", () => {
  it("returns false for non-retry paths", async () => {
    const route = createRetryRoute(makeStore(), "http://localhost:3000");
    const { res } = makeMockRes();
    const handled = await route(makeMockReq("GET", "/other"), res);
    expect(handled).toBe(false);
  });

  it("returns false for wrong method", async () => {
    const route = createRetryRoute(makeStore(), "http://localhost:3000");
    const { res } = makeMockRes();
    const handled = await route(makeMockReq("DELETE", "/_hookdeck/retry?id=abc"), res);
    expect(handled).toBe(false);
  });

  it("handles GET requests to retry path", async () => {
    const route = createRetryRoute(makeStore(), "http://localhost:3000");
    const { res } = makeMockRes();
    const handled = await route(makeMockReq("GET", "/_hookdeck/retry?id=abc"), res);
    expect(handled).toBe(true);
  });

  it("handles POST requests to retry path", async () => {
    const route = createRetryRoute(makeStore(), "http://localhost:3000");
    const { res } = makeMockRes();
    const handled = await route(makeMockReq("POST", "/_hookdeck/retry?id=abc"), res);
    expect(handled).toBe(true);
  });
});
