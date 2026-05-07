import { IncomingMessage, ServerResponse } from "http";
import { RequestStore } from "./request-store";
import { createCompareRequestsHandler } from "./compare-requests";

export function createCompareRoute(
  store: RequestStore
): (req: IncomingMessage, res: ServerResponse) => boolean {
  const handler = createCompareRequestsHandler(store);

  return (req: IncomingMessage, res: ServerResponse): boolean => {
    const url = req.url || "";
    if (req.method === "GET" && url.startsWith("/__hookdeck/compare")) {
      handler(req, res);
      return true;
    }
    return false;
  };
}
