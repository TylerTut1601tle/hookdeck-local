import { IncomingMessage, ServerResponse } from "http";
import { RequestStore } from "./request-store";
import { createTransformRequestsHandler } from "./transform-requests";

/**
 * POST /__transform?id=<requestId>
 * Body: JSON array of TransformOperation
 *
 * Creates a new stored request derived from an existing one with the
 * specified field-level transformations applied (set / delete / rename).
 * Returns the newly saved request.
 */
export function createTransformRoute(
  store: RequestStore
): (req: IncomingMessage, res: ServerResponse) => boolean {
  const handler = createTransformRequestsHandler(store);

  return (req: IncomingMessage, res: ServerResponse): boolean => {
    const path = (req.url ?? "/").split("?")[0];
    if (req.method === "POST" && path === "/__transform") {
      handler(req, res);
      return true;
    }
    return false;
  };
}
