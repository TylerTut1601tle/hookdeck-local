import { IncomingMessage, ServerResponse } from "http";
import { RequestStore } from "./request-store";
import { createBookmarkRequestsHandler } from "./bookmark-requests";

export function createBookmarkRoute(
  store: RequestStore
): (req: IncomingMessage, res: ServerResponse) => boolean {
  const handler = createBookmarkRequestsHandler(store);

  return function bookmarkRoute(
    req: IncomingMessage,
    res: ServerResponse
  ): boolean {
    const url = req.url || "";
    const isMatch =
      url.startsWith("/bookmark") &&
      (req.method === "POST" || req.method === "DELETE");

    if (!isMatch) return false;

    handler(req, res);
    return true;
  };
}
