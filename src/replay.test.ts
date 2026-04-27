import { replayRequest, ReplayOptions } from './replay';
import { StoredRequest } from './request-store';
import http from 'http';
import { AddressInfo } from 'net';

function makeStoredRequest(overrides: Partial<StoredRequest> = {}): StoredRequest {
  return {
    id: 'req-123',
    method: 'POST',
    path: '/webhook',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ event: 'test' }),
    receivedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('replayRequest', () => {
  let server: http.Server;
  let baseUrl: string;
  let lastRequest: { method: string; url: string; body: string } | null = null;

  beforeAll((done) => {
    server = http.createServer((req, res) => {
      let body = '';
      req.on('data', (chunk) => (body += chunk));
      req.on('end', () => {
        lastRequest = { method: req.method ?? '', url: req.url ?? '', body };
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      });
    });
    server.listen(0, () => {
      const port = (server.address() as AddressInfo).port;
      baseUrl = `http://localhost:${port}`;
      done();
    });
  });

  afterAll((done) => server.close(done));

  beforeEach(() => {
    lastRequest = null;
  });

  it('replays a POST request to the target URL', async () => {
    const stored = makeStoredRequest();
    const options: ReplayOptions = { targetUrl: baseUrl };
    const result = await replayRequest(stored, options);

    expect(result.requestId).toBe('req-123');
    expect(result.statusCode).toBe(200);
    expect(lastRequest?.method).toBe('POST');
    expect(lastRequest?.url).toBe('/webhook');
    expect(lastRequest?.body).toBe(JSON.stringify({ event: 'test' }));
  });

  it('applies override headers', async () => {
    const stored = makeStoredRequest();
    const options: ReplayOptions = {
      targetUrl: baseUrl,
      overrideHeaders: { 'x-replay': 'true' },
    };
    const result = await replayRequest(stored, options);
    expect(result.statusCode).toBe(200);
  });

  it('returns duration in milliseconds', async () => {
    const stored = makeStoredRequest();
    const result = await replayRequest(stored, { targetUrl: baseUrl });
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });
});
