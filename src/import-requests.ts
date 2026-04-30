import { IncomingMessage, ServerResponse } from "http";
import { createRequestStore } from "./request-store";

type RequestStore = ReturnType<typeof createRequestStore>;

interface ImportedRequest {
  id: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string;
  timestamp: string;
  status?: number;
}

export function createImportRequestsHandler(store: RequestStore) {
  return function importRequestsHandler(
    req: IncomingMessage,
    res: ServerResponse
  ): void {
    let raw = "";

    req.on("data", (chunk: Buffer) => {
      raw += chunk.toString();
    });

    req.on("end", () => {
      let parsed: unknown;

      try {
        parsed = JSON.parse(raw);
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON body" }));
        return;
      }

      if (!Array.isArray(parsed)) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Body must be a JSON array" }));
        return;
      }

      const requests = parsed as ImportedRequest[];
      let imported = 0;
      const errors: string[] = [];

      for (const entry of requests) {
        if (!entry.id || !entry.method || !entry.url) {
          errors.push(`Skipped entry missing required fields: ${JSON.stringify(entry)}`);
          continue;
        }
        store.save({
          id: entry.id,
          method: entry.method,
          url: entry.url,
          headers: entry.headers ?? {},
          body: entry.body ?? "",
          timestamp: entry.timestamp ?? new Date().toISOString(),
          status: entry.status,
        });
        imported++;
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ imported, errors }));
    });

    req.on("error", () => {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Failed to read request body" }));
    });
  };
}
