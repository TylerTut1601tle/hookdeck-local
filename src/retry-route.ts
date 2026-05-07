import { IncomingMessage, ServerResponse } from "http";
import { RequestStore } from "./request-store";
import { createRetryRequestsHandler } from "./retry-requests";

export function createRetryRoute(
  store: RequestStore,
  targetUrl: string
): (req: IncomingMessage, res: ServerResponse) => Promise<boolean> {
  const handler = createRetryRequestsHandler(store, targetUrl);

  return async function retryRoute(
    req: IncomingMessage,
    res: ServerResponse
  ): Promise<boolean> {
    const url = req.url ?? "/";
    const isRetryPath = url.startsWith("/_hookdeck/retry");
    const isPost = req.method === "POST";
    const isGet = req.method === "GET";

    if (!isRetryPath || (!isPost && !isGet)) {
      return false;
    }

    await handler(req, res);
    return true;
  };
}
