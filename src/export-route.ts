import { IncomingMessage, ServerResponse } from "http";
import { RequestStore } from "./request-store";
import { createExportRequestsHandler } from "./export-requests";

export function createExportRoute(
  store: RequestStore
): (req: IncomingMessage, res: ServerResponse) => boolean {
  const handler = createExportRequestsHandler(store);

  return function exportRoute(
    req: IncomingMessage,
    res: ServerResponse
  ): boolean {
    const pathname = new URL(
      req.url ?? "/",
      `http://${req.headers.host}`
    ).pathname;

    if (req.method === "GET" && pathname === "/__hookdeck/export") {
      handler(req, res);
      return true;
    }

    return false;
  };
}
