import { IncomingMessage, ServerResponse } from "http";
import { RequestStore } from "./request-store";
import { createTagRequestsHandler } from "./tag-requests";

export function createTagRoute(
  store: RequestStore
): (req: IncomingMessage, res: ServerResponse) => boolean {
  const handler = createTagRequestsHandler(store);

  return function tagRoute(
    req: IncomingMessage,
    res: ServerResponse
  ): boolean {
    const url = new URL(req.url ?? "/", "http://localhost");
    if (url.pathname === "/__hookdeck/tag" && req.method === "PATCH") {
      handler(req, res);
      return true;
    }
    return false;
  };
}
