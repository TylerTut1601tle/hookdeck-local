import { IncomingMessage, ServerResponse } from "http";
import { RequestStore } from "./request-store";
import { createArchiveRequestsHandler } from "./archive-requests";

export function createArchiveRoute(
  store: RequestStore
): (req: IncomingMessage, res: ServerResponse) => boolean {
  const handler = createArchiveRequestsHandler(store);

  return function archiveRoute(
    req: IncomingMessage,
    res: ServerResponse
  ): boolean {
    const url = req.url ?? "/";
    const pathname = url.split("?")[0];

    if (pathname === "/__hookdeck/archive" && req.method === "POST") {
      handler(req, res);
      return true;
    }

    return false;
  };
}
