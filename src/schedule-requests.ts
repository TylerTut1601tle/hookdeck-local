import { IncomingMessage, ServerResponse } from "http";
import { RequestStore } from "./request-store";
import { replayRequest } from "./replay";

export interface ScheduledReplay {
  requestId: string;
  delayMs: number;
  scheduledAt: number;
  timerId: ReturnType<typeof setTimeout>;
}

const scheduled = new Map<string, ScheduledReplay>();

export function createScheduleRequestsHandler(
  store: RequestStore,
  targetUrl: string
) {
  return async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    const url = new URL(req.url ?? "/", "http://localhost");
    const requestId = url.searchParams.get("id");
    const delayMs = parseInt(url.searchParams.get("delay") ?? "0", 10);

    if (!requestId) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Missing required query param: id" }));
      return;
    }

    if (isNaN(delayMs) || delayMs < 0) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid delay value" }));
      return;
    }

    const stored = store.get(requestId);
    if (!stored) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Request not found" }));
      return;
    }

    if (scheduled.has(requestId)) {
      clearTimeout(scheduled.get(requestId)!.timerId);
    }

    const timerId = setTimeout(async () => {
      scheduled.delete(requestId);
      await replayRequest(stored, targetUrl);
    }, delayMs);

    const entry: ScheduledReplay = {
      requestId,
      delayMs,
      scheduledAt: Date.now(),
      timerId,
    };

    scheduled.set(requestId, entry);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        requestId,
        delayMs,
        scheduledAt: entry.scheduledAt,
        message: `Replay scheduled in ${delayMs}ms`,
      })
    );
  };
}

export function cancelScheduled(requestId: string): boolean {
  const entry = scheduled.get(requestId);
  if (!entry) return false;
  clearTimeout(entry.timerId);
  scheduled.delete(requestId);
  return true;
}

export function listScheduled(): Omit<ScheduledReplay, "timerId">[] {
  return Array.from(scheduled.values()).map(({ requestId, delayMs, scheduledAt }) => ({
    requestId,
    delayMs,
    scheduledAt,
  }));
}
