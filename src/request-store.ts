export interface StoredRequest {
  id: string;
  method: string;
  url: string;
  headers: Record<string, string | string[]>;
  body: string;
  timestamp: number;
  response?: {
    status: number;
    headers: Record<string, string | string[]>;
    body: string;
  };
}

export interface RequestStore {
  add(request: StoredRequest): void;
  get(id: string): StoredRequest | undefined;
  list(): StoredRequest[];
  clear(): void;
  purgeAll(): number;
  purgeOlderThan(cutoffMs: number): number;
}

export function createRequestStore(): RequestStore {
  const requests: Map<string, StoredRequest> = new Map();

  return {
    add(request: StoredRequest): void {
      requests.set(request.id, request);
    },

    get(id: string): StoredRequest | undefined {
      return requests.get(id);
    },

    list(): StoredRequest[] {
      return Array.from(requests.values()).sort(
        (a, b) => b.timestamp - a.timestamp
      );
    },

    clear(): void {
      requests.clear();
    },

    purgeAll(): number {
      const count = requests.size;
      requests.clear();
      return count;
    },

    purgeOlderThan(cutoffMs: number): number {
      let count = 0;
      for (const [id, req] of requests.entries()) {
        if (req.timestamp < cutoffMs) {
          requests.delete(id);
          count++;
        }
      }
      return count;
    },
  };
}
