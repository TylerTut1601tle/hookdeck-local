import { IncomingMessage, ServerResponse } from "http";
import { RequestStore } from "./request-store";
import { createStatsRequestsHandler } from "./stats-requests";

export function createStatsRoute(store: RequestStore) {
  const handler = createStatsRequestsHandler(store);

  return function statsRoute(req: IncomingMessage, res: ServerResponse, next: () => void): void {
    if (req.method === "GET" && req.url === "/__hookdeck/stats") {
      handler(req, res);
      return;
    }
    next();
  };
}
