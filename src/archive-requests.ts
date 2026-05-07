import { IncomingMessage, ServerResponse } from "http";
import { RequestStore } from "./request-store";

export function createArchiveRequestsHandler(
  store: RequestStore
) {
  return function archiveRequestsHandler(
    req: IncomingMessage,
    res: ServerResponse
  ): void {
    const url = new URL(req.url ?? "/", "http://localhost");
    const id = url.searchParams.get("id");
    const all = url.searchParams.get("all") === "true";

    if (!id && !all) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Missing 'id' or 'all' parameter" }));
      return;
    }

    if (all) {
      const requests = store.getAll();
      let count = 0;
      for (const r of requests) {
        if (!r.archived) {
          store.update(r.id, { archived: true });
          count++;
        }
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ archived: count }));
      return;
    }

    const existing = store.getById(id!);
    if (!existing) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: `Request '${id}' not found` }));
      return;
    }

    store.update(id!, { archived: true });
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ archived: 1, id }));
  };
}
