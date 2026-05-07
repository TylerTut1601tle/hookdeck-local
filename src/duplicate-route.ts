import { IncomingMessage, ServerResponse } from "http";
import { createDuplicateRequestsHandler } from "./duplicate-requests";
import { createRequestStore } from "./request-store";

export function createDuplicateRoute(
  store: ReturnType<typeof createRequestStore>
) {
  const handler = createDuplicateRequestsHandler(store);

  return function duplicateRoute(
    req: IncomingMessage,
    res: ServerResponse,
    next: () => void
  ): void {
    const match = req.url?.match(/^\/requests\/([^/]+)\/duplicate$/);
    if (req.method === "POST" && match) {
      handler(req, res);
    } else {
      next();
    }
  };
}
