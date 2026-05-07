import { IncomingMessage, ServerResponse } from "http";
import { RequestStore } from "./request-store";
import { replayRequest } from "./replay";

export interface BatchReplayResult {
  id: string;
  success: boolean;
  statusCode?: number;
  error?: string;
}

export interface BatchReplayResponse {
  total: number;
  succeeded: number;
  failed: number;
  results: BatchReplayResult[];
}

export function createBatchReplayRequestsHandler(
  store: RequestStore,
  targetUrl: string
) {
  return async function batchReplayRequestsHandler(
    req: IncomingMessage,
    res: ServerResponse
  ): Promise<void> {
    let body = "";
    req.on("data", (chunk: Buffer) => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      let ids: string[];

      try {
        const parsed = JSON.parse(body);
        if (!Array.isArray(parsed.ids) || parsed.ids.length === 0) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "ids must be a non-empty array" }));
          return;
        }
        ids = parsed.ids;
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON body" }));
        return;
      }

      const results: BatchReplayResult[] = await Promise.all(
        ids.map(async (id): Promise<BatchReplayResult> => {
          const stored = store.get(id);
          if (!stored) {
            return { id, success: false, error: "Request not found" };
          }
          try {
            const replayRes = await replayRequest(stored, targetUrl);
            return { id, success: true, statusCode: replayRes.statusCode };
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Unknown error";
            return { id, success: false, error: message };
          }
        })
      );

      const succeeded = results.filter((r) => r.success).length;
      const failed = results.length - succeeded;

      const response: BatchReplayResponse = {
        total: results.length,
        succeeded,
        failed,
        results,
      };

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(response));
    });
  };
}
