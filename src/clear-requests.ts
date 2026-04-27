import { IncomingMessage, ServerResponse } from "http";
import { createRequestStore } from "./request-store";

type RequestStore = ReturnType<typeof createRequestStore>;

export function createClearRequestsHandler(store: RequestStore) {
  return function clearRequestsHandler(
    req: IncomingMessage,
    res: ServerResponse
  ): void {
    if (req.method !== "DELETE") {
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Method Not Allowed" }));
      return;
    }

    const count = store.size();
    store.clear();

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ cleared: count, message: `Cleared ${count} request(s)` }));
  };
}
