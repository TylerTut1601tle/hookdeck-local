import { createWriteStream, WriteStream } from 'fs';
import { join } from 'path';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface RequestLog {
  id: string;
  timestamp: string;
  method: string;
  path: string;
  headers: Record<string, string>;
  body: string;
  statusCode?: number;
  duration?: number;
}

export interface Logger {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  debug(message: string): void;
  logRequest(entry: RequestLog): void;
  close(): void;
}

function formatLine(level: LogLevel, message: string): string {
  const ts = new Date().toISOString();
  return `[${ts}] [${level.toUpperCase()}] ${message}`;
}

export function createLogger(logDir?: string, verbose = false): Logger {
  let fileStream: WriteStream | null = null;

  if (logDir) {
    const logPath = join(logDir, `hookdeck-${Date.now()}.log`);
    fileStream = createWriteStream(logPath, { flags: 'a' });
  }

  function write(level: LogLevel, message: string): void {
    const line = formatLine(level, message);
    if (level !== 'debug' || verbose) {
      console.log(line);
    }
    if (fileStream) {
      fileStream.write(line + '\n');
    }
  }

  return {
    info: (msg) => write('info', msg),
    warn: (msg) => write('warn', msg),
    error: (msg) => write('error', msg),
    debug: (msg) => write('debug', msg),
    logRequest(entry: RequestLog): void {
      const summary = `${entry.method} ${entry.path} → ${entry.statusCode ?? 'pending'} (${entry.duration ?? '?'}ms)`;
      write('info', `[REQUEST:${entry.id}] ${summary}`);
      if (verbose && fileStream) {
        fileStream.write(JSON.stringify(entry) + '\n');
      }
    },
    close(): void {
      if (fileStream) {
        fileStream.end();
        fileStream = null;
      }
    },
  };
}
