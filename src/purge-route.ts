import { IncomingMessage, ServerResponse } from "http";
import { RequestStore } from "./request-store";
import { createPurgeHandler } from "./purge-requests";

const PURGE_PATH = "/__hookdeck/purge";

/**
 * Creates a route handler that intercepts DELETE requests to the purge endpoint.
 * Returns a function that returns `true` if the request was handled, `false` otherwise.
 *
 * @param store - The request store to purge
 * @returns A middleware-style function that handles purge requests
 */
export function createPurgeRoute(
  store: RequestStore
): (req: IncomingMessage, res: ServerResponse) => boolean {
  const handler = createPurgeHandler(store);

  return function purgeRoute(
    req: IncomingMessage,
    res: ServerResponse
  ): boolean {
    if (req.method === "DELETE" && req.url === PURGE_PATH) {
      handler(req, res);
      return true;
    }
    return false;
  };
}
