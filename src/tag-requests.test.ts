import { createTagRequestsHandler } from "./tag-requests";
import { EventEmitter } from "events";

function makeStore(entries: Record<string, any> = {}) {
  const data = { ...entries };
  return {
    get: (id: string) => data[id] ?? null,
    update: (id: string, val: any) => { data[id] = val; },
    all: () => Object.values(data),
    _data: data,
  };
}

function makeMockReq(url: string, body: string) {
  const emitter = new EventEmitter() as any;
  emitter.url = url;
  emitter.method = "PATCH";
  setTimeout(() => {
    emitter.emit("data", body);
    emitter.emit("end");
  }, 0);
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

test("returns 400 if id is missing", (done) => {
  const store = makeStore();
  const handler = createTagRequestsHandler(store as any);
  const req = makeMockReq("/tag", JSON.stringify({ tags: ["foo"] }));
  const res = makeMockRes();
  handler(req, res);
  setTimeout(() => {
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error).toMatch(/id/);
    done();
  }, 20);
});

test("returns 404 if request not found", (done) => {
  const store = makeStore();
  const handler = createTagRequestsHandler(store as any);
  const req = makeMockReq("/tag?id=missing", JSON.stringify({ tags: ["foo"] }));
  const res = makeMockRes();
  handler(req, res);
  setTimeout(() => {
    expect(res.statusCode).toBe(404);
    done();
  }, 20);
});

test("returns 400 if body is invalid", (done) => {
  const store = makeStore({ abc: { id: "abc", tags: [] } });
  const handler = createTagRequestsHandler(store as any);
  const req = makeMockReq("/tag?id=abc", "not json");
  const res = makeMockRes();
  handler(req, res);
  setTimeout(() => {
    expect(res.statusCode).toBe(400);
    done();
  }, 20);
});

test("updates tags on a known request", (done) => {
  const store = makeStore({ abc: { id: "abc", tags: [] } });
  const handler = createTagRequestsHandler(store as any);
  const req = makeMockReq("/tag?id=abc", JSON.stringify({ tags: ["important", "retry"] }));
  const res = makeMockRes();
  handler(req, res);
  setTimeout(() => {
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.tags).toEqual(["important", "retry"]);
    expect(store._data["abc"].tags).toEqual(["important", "retry"]);
    done();
  }, 20);
});
