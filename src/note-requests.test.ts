import { createNoteRequestsHandler } from "./note-requests";
import { EventEmitter } from "events";

function makeStore(initial: Record<string, any> = {}) {
  const data: Record<string, any> = { ...initial };
  return {
    get: (id: string) => data[id] ?? null,
    update: (id: string, entry: any) => { data[id] = entry; },
    all: () => Object.values(data),
    _data: data,
  };
}

function makeMockReq(url: string, body: string) {
  const emitter = new EventEmitter() as any;
  emitter.url = url;
  emitter.method = "PATCH";
  setTimeout(() => {
    emitter.emit("data", Buffer.from(body));
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

describe("createNoteRequestsHandler", () => {
  it("adds a note to an existing request", (done) => {
    const store = makeStore({ "abc": { id: "abc", method: "POST", url: "/hook" } }) as any;
    const handler = createNoteRequestsHandler(store);
    const req = makeMockReq("/requests/abc/note/abc", JSON.stringify({ note: "important" }));
    const res = makeMockRes();
    handler(req, res);
    setTimeout(() => {
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.note).toBe("important");
      expect(store._data["abc"].note).toBe("important");
      done();
    }, 20);
  });

  it("returns 404 when request id not found", (done) => {
    const store = makeStore() as any;
    const handler = createNoteRequestsHandler(store);
    const req = makeMockReq("/requests/missing/note/missing", JSON.stringify({ note: "hi" }));
    const res = makeMockRes();
    handler(req, res);
    setTimeout(() => {
      expect(res.statusCode).toBe(404);
      done();
    }, 20);
  });

  it("returns 400 for invalid JSON body", (done) => {
    const store = makeStore({ "xyz": { id: "xyz" } }) as any;
    const handler = createNoteRequestsHandler(store);
    const req = makeMockReq("/requests/xyz/note/xyz", "not-json");
    const res = makeMockRes();
    handler(req, res);
    setTimeout(() => {
      expect(res.statusCode).toBe(400);
      done();
    }, 20);
  });

  it("returns 400 when note field is missing", (done) => {
    const store = makeStore({ "xyz": { id: "xyz" } }) as any;
    const handler = createNoteRequestsHandler(store);
    const req = makeMockReq("/requests/xyz/note/xyz", JSON.stringify({ other: "val" }));
    const res = makeMockRes();
    handler(req, res);
    setTimeout(() => {
      expect(res.statusCode).toBe(400);
      done();
    }, 20);
  });
});
