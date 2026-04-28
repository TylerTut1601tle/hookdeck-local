import { IncomingMessage, ServerResponse } from "http";
import { RequestStore } from "./request-store";

export interface RequestStats {
  total: number;
  byMethod: Record<string, number>;
  byStatus: Record<string, number>;
  byPath: Record<string, number>;
  averageResponseTime: number | null;
}

export function computeStats(requests: ReturnType<RequestStore["list"]>): RequestStats {
  const byMethod: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  const byPath: Record<string, number> = {};
  let totalTime = 0;
  let countWithTime = 0;

  for (const req of requests) {
    const method = req.method.toUpperCase();
    byMethod[method] = (byMethod[method] ?? 0) + 1;

    if (req.status != null) {
      const statusKey = String(req.status);
      byStatus[statusKey] = (byStatus[statusKey] ?? 0) + 1;
    }

    const pathKey = req.path ?? "/";
    byPath[pathKey] = (byPath[pathKey] ?? 0) + 1;

    if (typeof req.duration === "number") {
      totalTime += req.duration;
      countWithTime++;
    }
  }

  return {
    total: requests.length,
    byMethod,
    byStatus,
    byPath,
    averageResponseTime: countWithTime > 0 ? Math.round(totalTime / countWithTime) : null,
  };
}

export function createStatsRequestsHandler(store: RequestStore) {
  return function statsHandler(_req: IncomingMessage, res: ServerResponse): void {
    const requests = store.list();
    const stats = computeStats(requests);
    const body = JSON.stringify(stats);
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(body),
    });
    res.end(body);
  };
}
