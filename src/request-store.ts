import { randomUUID } from 'crypto';
import { RequestLog } from './logger';

export interface RequestStore {
  add(entry: Omit<RequestLog, 'id' | 'timestamp'>): RequestLog;
  update(id: string, patch: Partial<RequestLog>): RequestLog | undefined;
  get(id: string): RequestLog | undefined;
  list(limit?: number): RequestLog[];
  clear(): void;
}

export function createRequestStore(maxEntries = 200): RequestStore {
  const store = new Map<string, RequestLog>();
  const order: string[] = [];

  return {
    add(entry) {
      const id = randomUUID();
      const timestamp = new Date().toISOString();
      const log: RequestLog = { id, timestamp, ...entry };
      store.set(id, log);
      order.push(id);
      if (order.length > maxEntries) {
        const oldest = order.shift()!;
        store.delete(oldest);
      }
      return log;
    },

    update(id, patch) {
      const existing = store.get(id);
      if (!existing) return undefined;
      const updated = { ...existing, ...patch, id };
      store.set(id, updated);
      return updated;
    },

    get(id) {
      return store.get(id);
    },

    list(limit = 50) {
      const ids = order.slice(-limit).reverse();
      return ids.map((id) => store.get(id)!).filter(Boolean);
    },

    clear() {
      store.clear();
      order.length = 0;
    },
  };
}
