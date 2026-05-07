import { IncomingMessage, ServerResponse } from "http";
import { RequestStore } from "./request-store";

export function createCompareRequestsHandler(store: RequestStore) {
  return (req: IncomingMessage, res: ServerResponse): void => {
    const url = new URL(req.url || "/", "http://localhost");
    const idA = url.searchParams.get("a");
    const idB = url.searchParams.get("b");

    if (!idA || !idB) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Query params 'a' and 'b' are required" }));
      return;
    }

    const all = store.getAll();
    const reqA = all.find((r) => r.id === idA);
    const reqB = all.find((r) => r.id === idB);

    if (!reqA) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: `Request '${idA}' not found` }));
      return;
    }

    if (!reqB) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: `Request '${idB}' not found` }));
      return;
    }

    const diff = {
      a: { id: reqA.id, method: reqA.method, url: reqA.url, headers: reqA.headers, body: reqA.body },
      b: { id: reqB.id, method: reqB.method, url: reqB.url, headers: reqB.headers, body: reqB.body },
      differences: {
        method: reqA.method !== reqB.method,
        url: reqA.url !== reqB.url,
        body: reqA.body !== reqB.body,
        headers: Object.keys({ ...reqA.headers, ...reqB.headers }).filter(
          (k) => reqA.headers[k] !== reqB.headers[k]
        ),
      },
    };

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(diff));
  };
}
