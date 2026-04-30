import { IncomingMessage, ServerResponse } from "http";
import { createRequestStore } from "./request-store";
import { createImportRequestsHandler } from "./import-requests";

type RequestStore = ReturnType<typeof createRequestStore>;

export function createImportRoute(store: RequestStore) {
  const handler = createImportRequestsHandler(store);

  return function importRoute(
    req: IncomingMessage,
    res: ServerResponse
  ): boolean {
    if (req.method === "POST" && req.url === "/__hookdeck/import") {
      handler(req, res);
      return true;
    }
    return false;
  };
}
