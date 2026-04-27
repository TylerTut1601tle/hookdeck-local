import { IncomingMessage, ServerResponse } from 'http';
import { createReplayHandler, ReplayHandlerDeps } from './replay-handler';

/**
 * Mounts replay-related routes onto an existing request handler chain.
 * Returns a composed handler that intercepts /replay/* and /requests paths,
 * delegating everything else to the provided fallthrough handler.
 */
export function createReplayRoute(
  deps: ReplayHandlerDeps,
  fallthrough: (req: IncomingMessage, res: ServerResponse) => void
) {
  const handleReplay = createReplayHandler(deps);

  return async function routeHandler(
    req: IncomingMessage,
    res: ServerResponse
  ): Promise<void> {
    const url = req.url ?? '';

    // GET /requests — list stored requests
    if (req.method === 'GET' && url === '/requests') {
      const all = deps.store.list();
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(all));
      return;
    }

    // GET /requests/:id — get single stored request
    const getMatch = url.match(/^\/requests\/([^/?]+)$/);
    if (req.method === 'GET' && getMatch) {
      const item = deps.store.get(getMatch[1]);
      if (!item) {
        res.writeHead(404, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
        return;
      }
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(item));
      return;
    }

    // POST /replay/:id — replay a stored request
    if (req.method === 'POST' && url.startsWith('/replay/')) {
      await handleReplay(req, res);
      return;
    }

    fallthrough(req, res);
  };
}
