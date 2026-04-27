import { IncomingMessage, ServerResponse } from "http";
import { RequestStore } from "./request-store";
import { Config } from "./config";

export interface StatusInfo {
  status: "ok";
  version: string;
  target: string;
  requestCount: number;
  uptime: number;
}

const startTime = Date.now();

export function createStatusHandler(
  store: RequestStore,
  config: Config
): (req: IncomingMessage, res: ServerResponse) => void {
  return (_req: IncomingMessage, res: ServerResponse): void => {
    const requests = store.getAll();
    const info: StatusInfo = {
      status: "ok",
      version: "1.0.0",
      target: config.target,
      requestCount: requests.length,
      uptime: Math.floor((Date.now() - startTime) / 1000),
    };

    const body = JSON.stringify(info);
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(body),
    });
    res.end(body);
  };
}

export function createStatusRoute(
  store: RequestStore,
  config: Config
): { path: string; handler: (req: IncomingMessage, res: ServerResponse) => void } {
  return {
    path: "/__status",
    handler: createStatusHandler(store, config),
  };
}
