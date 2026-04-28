import { IncomingMessage, ServerResponse } from "http";
import { RequestStore } from "./request-store";

export function createExportRequestsHandler(store: RequestStore) {
  return function exportRequestsHandler(
    req: IncomingMessage,
    res: ServerResponse
  ): void {
    const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
    const format = url.searchParams.get("format") ?? "json";
    const requests = store.getAll();

    if (format === "ndjson") {
      const ndjson = requests
        .map((r) => JSON.stringify(r))
        .join("\n");
      res.writeHead(200, {
        "Content-Type": "application/x-ndjson",
        "Content-Disposition": 'attachment; filename="requests.ndjson"',
      });
      res.end(ndjson);
      return;
    }

    if (format === "csv") {
      const header = "id,method,url,status,timestamp";
      const rows = requests.map((r) =>
        [
          r.id,
          r.method,
          `"${r.url}"`,
          r.status ?? "",
          r.timestamp,
        ].join(",")
      );
      const csv = [header, ...rows].join("\n");
      res.writeHead(200, {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="requests.csv"',
      });
      res.end(csv);
      return;
    }

    // default: json
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="requests.json"',
    });
    res.end(JSON.stringify(requests, null, 2));
  };
}
