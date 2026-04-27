import { IncomingMessage, ServerResponse } from "http";
import { RequestStore } from "./request-store";

export function createPurgeHandler(
  store: RequestStore
): (req: IncomingMessage, res: ServerResponse) => void {
  return function purgeHandler(
    req: IncomingMessage,
    res: ServerResponse
  ): void {
    const url = new URL(req.url ?? "/", "http://localhost");
    const olderThanParam = url.searchParams.get("olderThan");

    let purgedCount: number;

    if (olderThanParam) {
      const olderThan = parseInt(olderThanParam, 10);
      if (isNaN(olderThan) || olderThan <= 0) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "olderThan must be a positive integer (seconds)" }));
        return;
      }
      const cutoff = Date.now() - olderThan * 1000;
      purgedCount = store.purgeOlderThan(cutoff);
    } else {
      purgedCount = store.purgeAll();
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ purged: purgedCount }));
  };
}
