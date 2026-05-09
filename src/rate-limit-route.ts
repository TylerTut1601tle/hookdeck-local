import { IncomingMessage, ServerResponse } from "http";
import { RequestStore } from "./request-store";
import { createRateLimitRequestsHandler } from "./rate-limit-requests";

export function createRateLimitRoute(
  store: RequestStore
): (req: IncomingMessage, res: ServerResponse) => boolean {
  const handler = createRateLimitRequestsHandler(store);

  return function rateLimitRoute(
    req: IncomingMessage,
    res: ServerResponse
  ): boolean {
    if (req.method === "GET" && req.url?.startsWith("/__hookdeck/rate-limit")) {
      handler(req, res);
      return true;
    }
    return false;
  };
}
