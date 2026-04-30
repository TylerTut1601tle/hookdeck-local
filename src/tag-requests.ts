import { IncomingMessage, ServerResponse } from "http";
import { RequestStore } from "./request-store";

export function createTagRequestsHandler(store: RequestStore) {
  return function tagRequestsHandler(
    req: IncomingMessage,
    res: ServerResponse
  ): void {
    const url = new URL(req.url ?? "/", "http://localhost");
    const id = url.searchParams.get("id");

    if (!id) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Missing required query param: id" }));
      return;
    }

    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => {
      let tags: string[];
      try {
        const parsed = JSON.parse(body);
        if (!Array.isArray(parsed.tags)) {
          throw new Error("tags must be an array");
        }
        tags = parsed.tags.map(String);
      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid body: expected { tags: string[] }" }));
        return;
      }

      const entry = store.get(id);
      if (!entry) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: `Request not found: ${id}` }));
        return;
      }

      const updated = { ...entry, tags };
      store.update(id, updated);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ id, tags }));
    });
  };
}
