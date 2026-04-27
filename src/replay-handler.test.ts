import { createReplayHandler } from './replay-handler';
import { createRequestStore } from './request-store';
import { createLogger } from './logger';
import { IncomingMessage, ServerResponse } from 'http';

function makeMockRes() {
  const res = {
    statusCode: 0,
    headers: {} as Record<string, string>,
    body: '',
    writeHead: jest.fn(function (this: typeof res, code: number) {
      this.statusCode = code;
    }),
    end: jest.fn(function (this: typeof res, data: string) {
      this.body = data;
    }),
  };
  return res as unknown as ServerResponse & { statusCode: number; body: string };
}

describe('createReplayHandler', () => {
  const store = createRequestStore();
  const logger = createLogger({ level: 'silent' } as never);

  const stored = {
    id: 'abc',
    method: 'GET',
    path: '/ping',
    headers: {},
    body: '',
    receivedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    store.clear?.();
  });

  it('returns 400 when id is missing from URL', async () => {
    const handler = createReplayHandler({ store, targetUrl: 'http://localhost:3000', logger });
    const req = { url: '/replay/' } as IncomingMessage;
    const res = makeMockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(400);
  });

  it('returns 404 when request id not found', async () => {
    const handler = createReplayHandler({ store, targetUrl: 'http://localhost:3000', logger });
    const req = { url: '/replay/missing-id' } as IncomingMessage;
    const res = makeMockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(404);
  });

  it('returns 502 when replay fails', async () => {
    store.add(stored);
    const handler = createReplayHandler({
      store,
      targetUrl: 'http://localhost:1', // unreachable port
      logger,
    });
    const req = { url: '/replay/abc' } as IncomingMessage;
    const res = makeMockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(502);
  });
});
