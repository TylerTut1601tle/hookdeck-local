import { IncomingMessage, ServerResponse } from "http";
import { RequestStore } from "./request-store";
import { createScheduleRequestsHandler, cancelScheduled, listScheduled } from "./schedule-requests";

export function createScheduleRoute(
  store: RequestStore,
  targetUrl: string
): (req: IncomingMessage, res: ServerResponse) => Promise<boolean> {
  const scheduleHandler = createScheduleRequestsHandler(store, targetUrl);

  return async (req: IncomingMessage, res: ServerResponse): Promise<boolean> => {
    const url = new URL(req.url ?? "/", "http://localhost");

    if (url.pathname === "/__schedule" && req.method === "POST") {
      await scheduleHandler(req, res);
      return true;
    }

    if (url.pathname === "/__schedule" && req.method === "GET") {
      const entries = listScheduled();
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ scheduled: entries, count: entries.length }));
      return true;
    }

    if (url.pathname === "/__schedule" && req.method === "DELETE") {
      const requestId = url.searchParams.get("id");
      if (!requestId) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Missing required query param: id" }));
        return true;
      }
      const removed = cancelScheduled(requestId);
      if (!removed) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Scheduled entry not found" }));
        return true;
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ cancelled: true, requestId }));
      return true;
    }

    return false;
  };
}
