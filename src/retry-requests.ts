import { IncomingMessage, ServerResponse } from "http";
import { RequestStore } from "./request-store";
import { replayRequest } from "./replay";

export interface RetryResult {
  id: string;
  success: boolean;
  statusCode?: number;
  error?: string;
}

export function createRetryRequestsHandler(
  store: RequestStore,
  targetUrl: string
) {
  return async function retryRequestsHandler(
    req: IncomingMessage,
    res: ServerResponse
  ): Promise<void> {
    const url = new URL(req.url ?? "/", "http://localhost");
    const ids = url.searchParams.getAll("id");

    if (ids.length === 0) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "At least one id query param is required" }));
      return;
    }

    const results: RetryResult[] = [];

    for (const id of ids) {
      const stored = store.get(id);
      if (!stored) {
        results.push({ id, success: false, error: "Not found" });
        continue;
      }
      try {
        const statusCode = await replayRequest(stored, targetUrl);
        results.push({ id, success: statusCode < 500, statusCode });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        results.push({ id, success: false, error: message });
      }
    }

    const allSucceeded = results.every((r) => r.success);
    res.writeHead(allSucceeded ? 200 : 207, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ results }));
  };
}
