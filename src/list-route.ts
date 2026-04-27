import { IncomingMessage, ServerResponse } from "http";
import { RequestStore } from "./request-store";
import { createListRequestsHandler } from "./list-requests";

const LIST_PATH_PATTERN = /^\/__hookdeck\/requests(\?.*)?$/;

export function createListRoute(
  store: RequestStore
): (req: IncomingMessage, res: ServerResponse) => boolean {
  const listHandler = createListRequestsHandler(store);

  return function listRoute(
    req: IncomingMessage,
    res: ServerResponse
  ): boolean {
    const url = req.url ?? "";
    if (!LIST_PATH_PATTERN.test(url)) {
      return false;
    }
    listHandler(req, res);
    return true;
  };
}
