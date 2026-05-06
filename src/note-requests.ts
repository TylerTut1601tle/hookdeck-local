import { IncomingMessage, ServerResponse } from "http";
import { RequestStore } from "./request-store";

export function createNoteRequestsHandler(
  store: RequestStore
): (req: IncomingMessage, res: ServerResponse) => void {
  return (req, res) => {
    const urlParts = req.url?.split("/") ?? [];
    const id = urlParts[urlParts.length - 1];

    if (!id) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Missing request id" }));
      return;
    }

    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      let parsed: { note?: string };
      try {
        parsed = JSON.parse(body);
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON body" }));
        return;
      }

      if (typeof parsed.note !== "string") {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "note must be a string" }));
        return;
      }

      const entry = store.get(id);
      if (!entry) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Request not found" }));
        return;
      }

      const updated = { ...entry, note: parsed.note };
      store.update(id, updated);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(updated));
    });
  };
}
