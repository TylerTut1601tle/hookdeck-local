import { IncomingMessage, ServerResponse } from "http";
import { RequestStore } from "./request-store";
import { createPinRequestsHandler } from "./pin-requests";

export function createPinRoute(
  store: RequestStore
): (req: IncomingMessage, res: ServerResponse) => boolean {
  const handler = createPinRequestsHandler(store);

  return function pinRoute(
    req: IncomingMessage,
    res: ServerResponse
  ): boolean {
    const url = req.url || "";
    const method = req.method || "";

    if (method === "POST" && url.startsWith("/__hookdeck/pin")) {
      handler(req, res);
      return true;
    }

    return false;
  };
}
