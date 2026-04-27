import { IncomingMessage, ServerResponse } from "http";
import { RequestStore } from "./request-store";
import { createPurgeHandler } from "./purge-requests";

export function createPurgeRoute(
  store: RequestStore
): (req: IncomingMessage, res: ServerResponse) => boolean {
  const handler = createPurgeHandler(store);

  return function purgeRoute(
    req: IncomingMessage,
    res: ServerResponse
  ): boolean {
    if (req.method === "DELETE" && req.url === "/__hookdeck/purge") {
      handler(req, res);
      return true;
    }
    return false;
  };
}
