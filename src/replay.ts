import { StoredRequest } from './request-store';
import { IncomingHttpHeaders } from 'http';
import https from 'https';
import http from 'http';

export interface ReplayResult {
  requestId: string;
  statusCode: number;
  body: string;
  headers: IncomingHttpHeaders;
  durationMs: number;
}

export interface ReplayOptions {
  targetUrl: string;
  overrideHeaders?: Record<string, string>;
}

export function replayRequest(
  stored: StoredRequest,
  options: ReplayOptions
): Promise<ReplayResult> {
  return new Promise((resolve, reject) => {
    const url = new URL(stored.path, options.targetUrl);
    const isHttps = url.protocol === 'https:';
    const transport = isHttps ? https : http;

    const headers = {
      ...stored.headers,
      ...options.overrideHeaders,
    };

    // Remove host header so it's set correctly for the target
    delete headers['host'];

    const reqOptions = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + (url.search || ''),
      method: stored.method,
      headers,
    };

    const start = Date.now();

    const req = transport.request(reqOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        resolve({
          requestId: stored.id,
          statusCode: res.statusCode ?? 0,
          body,
          headers: res.headers,
          durationMs: Date.now() - start,
        });
      });
      res.on('error', reject);
    });

    req.on('error', (err) => {
      reject(new Error(`Replay request failed for ${stored.id}: ${err.message}`));
    });

    if (stored.body) {
      req.write(stored.body);
    }

    req.end();
  });
}
