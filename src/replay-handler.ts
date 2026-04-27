import { IncomingMessage, ServerResponse } from 'http';
import { RequestStore } from './request-store';
import { replayRequest } from './replay';
import { Logger } from './logger';

export interface ReplayHandlerDeps {
  store: RequestStore;
  targetUrl: string;
  logger: Logger;
}

export function createReplayHandler(deps: ReplayHandlerDeps) {
  const { store, targetUrl, logger } = deps;

  return async function handleReplay(
    req: IncomingMessage,
    res: ServerResponse
  ): Promise<void> {
    // Expect path: /replay/:id
    const match = (req.url ?? '').match(/^\/replay\/([^/?]+)/);
    if (!match) {
      res.writeHead(400, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing request id' }));
      return;
    }

    const id = match[1];
    const stored = store.get(id);

    if (!stored) {
      res.writeHead(404, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: `Request ${id} not found` }));
      return;
    }

    try {
      logger.info(`Replaying request ${id} ${stored.method} ${stored.path}`);
      const result = await replayRequest(stored, { targetUrl });
      logger.info(
        `Replay ${id} completed: ${result.statusCode} in ${result.durationMs}ms`
      );

      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(
        JSON.stringify({
          requestId: result.requestId,
          statusCode: result.statusCode,
          durationMs: result.durationMs,
          body: result.body,
        })
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error(`Replay ${id} failed: ${message}`);
      res.writeHead(502, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: message }));
    }
  };
}
