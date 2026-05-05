import http from "http";
import { loadConfig } from "./config";
import { createRequestStore } from "./request-store";
import { createLogger } from "./logger";
import { createProxyHandler } from "./proxy";

export interface ServerInstance {
  start(): Promise<void>;
  stop(): Promise<void>;
  server: http.Server;
}

export function createServer(configPath?: string): ServerInstance {
  const config = loadConfig(configPath);
  const store = createRequestStore();
  const logger = createLogger({ level: config.logLevel ?? "info" });

  const handler = createProxyHandler({
    targetUrl: config.targetUrl,
    port: config.port,
    store,
    logger,
  });

  const server = http.createServer(handler);

  return {
    server,
    start(): Promise<void> {
      return new Promise((resolve, reject) => {
        server.on("error", (err) => {
          logger.error(`Failed to start server: ${err.message}`);
          reject(err);
        });
        server.listen(config.port, () => {
          logger.info(`hookdeck-local listening on port ${config.port}`);
          logger.info(`Forwarding to: ${config.targetUrl}`);
          resolve();
        });
      });
    },
    stop(): Promise<void> {
      return new Promise((resolve, reject) => {
        server.close((err) => {
          if (err) return reject(err);
          logger.info("hookdeck-local stopped");
          resolve();
        });
      });
    },
  };
}
