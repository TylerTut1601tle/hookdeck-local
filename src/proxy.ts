import http from "http";
import https from "https";
import { URL } from "url";
import { IncomingMessage, ServerResponse } from "http";
import { createRequestStore } from "./request-store";
import { createLogger } from "./logger";

export interface ProxyOptions {
  targetUrl: string;
  port: number;
  store: ReturnType<typeof createRequestStore>;
  logger: ReturnType<typeof createLogger>;
}

export function forwardRequest(
  req: IncomingMessage,
  body: Buffer,
  targetUrl: string
): Promise<{ statusCode: number; headers: http.IncomingHttpHeaders; body: Buffer }> {
  return new Promise((resolve, reject) => {
    const target = new URL(targetUrl);
    const options: http.RequestOptions = {
      hostname: target.hostname,
      port: target.port || (target.protocol === "https:" ? 443 : 80),
      path: target.pathname + (target.search || ""),
      method: req.method,
      headers: { ...req.headers, host: target.hostname },
    };

    const transport = target.protocol === "https:" ? https : http;
    const proxyReq = transport.request(options, (proxyRes) => {
      const chunks: Buffer[] = [];
      proxyRes.on("data", (chunk) => chunks.push(chunk));
      proxyRes.on("end", () => {
        resolve({
          statusCode: proxyRes.statusCode ?? 200,
          headers: proxyRes.headers,
          body: Buffer.concat(chunks),
        });
      });
    });

    proxyReq.on("error", reject);
    proxyReq.write(body);
    proxyReq.end();
  });
}

export function createProxyHandler(options: ProxyOptions) {
  const { targetUrl, store, logger } = options;

  return async function handler(req: IncomingMessage, res: ServerResponse) {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", async () => {
      const body = Buffer.concat(chunks);
      const requestId = store.save({
        method: req.method ?? "GET",
        url: req.url ?? "/",
        headers: req.headers as Record<string, string>,
        body: body.toString(),
        timestamp: Date.now(),
      });

      logger.info(`[${requestId}] ${req.method} ${req.url} -> ${targetUrl}`);

      try {
        const response = await forwardRequest(req, body, targetUrl + (req.url ?? "/"));
        store.saveResponse(requestId, {
          statusCode: response.statusCode,
          headers: response.headers as Record<string, string>,
          body: response.body.toString(),
        });
        logger.info(`[${requestId}] Response: ${response.statusCode}`);
        res.writeHead(response.statusCode, response.headers);
        res.end(response.body);
      } catch (err) {
        logger.error(`[${requestId}] Forward failed: ${(err as Error).message}`);
        res.writeHead(502);
        res.end("Bad Gateway");
      }
    });
  };
}
