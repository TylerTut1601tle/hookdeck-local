import { IncomingMessage, ServerResponse } from "http";
import { createRequestStore } from "./request-store";
import { createClearRequestsHandler } from "./clear-requests";

type RequestStore = ReturnType<typeof createRequestStore>;

const CLEAR_PATH = "/__hookdeck/requests";

export function createClearRoute(
  store: RequestStore
): (req: IncomingMessage, res: ServerResponse) => boolean {
  const handler = createClearRequestsHandler(store);

  return function clearRoute(
    req: IncomingMessage,
    res: ServerResponse
  ): boolean {
    if (req.method === "DELETE" && req.url === CLEAR_PATH) {
      handler(req, res);
      return true;
    }
    return false;
  };
}
