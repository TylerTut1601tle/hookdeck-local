import { IncomingMessage, ServerResponse } from "http";
import { RequestStore } from "./request-store";

export interface StoredRequestSummary {
  id: string;
  method: string;
  url: string;
  timestamp: number;
  statusCode: number | null;
}

export function createListRequestsHandler(store: RequestStore) {
  return function listRequestsHandler(
    req: IncomingMessage,
    res: ServerResponse
  ): void {
    if (req.method !== "GET") {
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Method Not Allowed" }));
      return;
    }

    const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
    const limitParam = url.searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 20;

    const all = store.getAll();
    const limited = all.slice(-Math.min(limit, 100));

    const summaries: StoredRequestSummary[] = limited.map((entry) => ({
      id: entry.id,
      method: entry.method,
      url: entry.url,
      timestamp: entry.timestamp,
      statusCode: entry.statusCode ?? null,
    }));

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ requests: summaries, total: all.length }));
  };
}
