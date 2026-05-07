import { IncomingMessage, ServerResponse } from "http";
import { RequestStore } from "./request-store";

export function createDuplicateRequestsHandler(
  store: ReturnType<typeof import("./request-store").createRequestStore>
) {
  return async function handleDuplicateRequest(
    req: IncomingMessage,
    res: ServerResponse
  ): Promise<void> {
    const urlParts = req.url?.split("/") ?? [];
    const id = urlParts[urlParts.length - 2];

    if (!id) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Missing request id" }));
      return;
    }

    const original = store.get(id);

    if (!original) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: `Request ${id} not found` }));
      return;
    }

    const duplicated = store.add({
      method: original.method,
      url: original.url,
      headers: { ...original.headers },
      body: original.body,
      timestamp: new Date().toISOString(),
      status: null,
      duration: null,
      tags: [...(original.tags ?? [])],
      note: original.note ? `[Duplicate of ${id}] ${original.note}` : `[Duplicate of ${id}]`,
      bookmarked: false,
      archived: false,
    });

    res.writeHead(201, { "Content-Type": "application/json" });
    res.end(JSON.stringify(duplicated));
  };
}
