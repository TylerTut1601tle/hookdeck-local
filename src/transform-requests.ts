import { IncomingMessage, ServerResponse } from "http";
import { RequestStore } from "./request-store";

export interface TransformOperation {
  field: "body" | "headers" | "url";
  action: "set" | "delete" | "rename";
  key: string;
  value?: string;
}

export function applyTransform(
  request: Record<string, unknown>,
  ops: TransformOperation[]
): Record<string, unknown> {
  const result = structuredClone(request) as Record<string, unknown>;

  for (const op of ops) {
    const target = result[op.field] as Record<string, unknown> | undefined;
    if (!target || typeof target !== "object") continue;

    if (op.action === "set") {
      target[op.key] = op.value ?? "";
    } else if (op.action === "delete") {
      delete target[op.key];
    } else if (op.action === "rename" && op.value) {
      target[op.value] = target[op.key];
      delete target[op.key];
    }
  }

  return result;
}

export function createTransformRequestsHandler(store: RequestStore) {
  return (req: IncomingMessage, res: ServerResponse): void => {
    const url = new URL(req.url ?? "/", "http://localhost");
    const id = url.searchParams.get("id");

    if (!id) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Missing required query param: id" }));
      return;
    }

    const stored = store.get(id);
    if (!stored) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: `Request not found: ${id}` }));
      return;
    }

    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      let ops: TransformOperation[];
      try {
        ops = JSON.parse(body);
        if (!Array.isArray(ops)) throw new Error("Expected array");
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON body: expected array of operations" }));
        return;
      }

      const transformed = applyTransform(stored as Record<string, unknown>, ops);
      const saved = store.save({ ...(transformed as typeof stored), id: `${id}-transformed` });

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(saved));
    });
  };
}
