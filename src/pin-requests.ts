import { IncomingMessage, ServerResponse } from "http";
import { RequestStore } from "./request-store";

export function createPinRequestsHandler(store: RequestStore) {
  return function pinRequestsHandler(
    req: IncomingMessage,
    res: ServerResponse
  ): void {
    const url = new URL(req.url || "/", "http://localhost");
    const id = url.searchParams.get("id");

    if (!id) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Missing required query parameter: id" }));
      return;
    }

    const request = store.getById(id);

    if (!request) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: `Request not found: ${id}` }));
      return;
    }

    const isPinned = request.pinned === true;
    const updated = store.update(id, { pinned: !isPinned });

    if (!updated) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Failed to update request" }));
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        id,
        pinned: !isPinned,
        message: !isPinned ? "Request pinned" : "Request unpinned",
      })
    );
  };
}
