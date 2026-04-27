import { IncomingMessage, ServerResponse } from "http";
import { createRequestStore } from "./request-store";

type RequestStore = ReturnType<typeof createRequestStore>;

export function createSearchRequestsHandler(store: RequestStore) {
  return function searchRequestsHandler(
    req: IncomingMessage,
    res: ServerResponse
  ): void {
    const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
    const method = url.searchParams.get("method")?.toUpperCase();
    const path = url.searchParams.get("path");
    const status = url.searchParams.get("status");
    const since = url.searchParams.get("since");
    const limit = parseInt(url.searchParams.get("limit") ?? "50", 10);

    let results = store.getAll();

    if (method) {
      results = results.filter((r) => r.method.toUpperCase() === method);
    }

    if (path) {
      results = results.filter((r) => r.url.includes(path));
    }

    if (status) {
      const statusCode = parseInt(status, 10);
      results = results.filter((r) => r.responseStatus === statusCode);
    }

    if (since) {
      const sinceDate = new Date(since).getTime();
      if (!isNaN(sinceDate)) {
        results = results.filter(
          (r) => new Date(r.timestamp).getTime() >= sinceDate
        );
      }
    }

    results = results.slice(0, Math.min(limit, 200));

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        count: results.length,
        results,
      })
    );
  };
}
