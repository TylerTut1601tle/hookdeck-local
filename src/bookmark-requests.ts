import { IncomingMessage, ServerResponse } from "http";
import { RequestStore } from "./request-store";

export function createBookmarkRequestsHandler(store: RequestStore) {
  return function bookmarkRequestsHandler(
    req: IncomingMessage,
    res: ServerResponse
  ): void {
    const url = new URL(req.url || "/", `http://${req.headers.host}`);
    const id = url.searchParams.get("id");

    if (!id) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Missing required query param: id" }));
      return;
    }

    const request = store.getById(id);

    if (!request) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: `Request not found: ${id}` }));
      return;
    }

    const isBookmarked = request.bookmarked === true;

    if (req.method === "DELETE") {
      store.update(id, { bookmarked: false });
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ id, bookmarked: false }));
      return;
    }

    if (isBookmarked) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ id, bookmarked: true, message: "Already bookmarked" }));
      return;
    }

    store.update(id, { bookmarked: true });
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ id, bookmarked: true }));
  };
}
