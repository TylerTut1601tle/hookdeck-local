import { IncomingMessage, ServerResponse } from "http";
import { RequestStore } from "./request-store";

/**
 * Filter criteria for querying stored requests.
 */
export interface FilterCriteria {
  method?: string;
  status?: number;
  tag?: string;
  bookmarked?: boolean;
  hasNote?: boolean;
  from?: string; // ISO date string
  to?: string;   // ISO date string
  path?: string; // substring match on URL path
}

/**
 * Parse filter criteria from query string parameters.
 */
export function parseFilterCriteria(query: Record<string, string | string[] | undefined>): FilterCriteria {
  const criteria: FilterCriteria = {};

  if (query.method && typeof query.method === "string") {
    criteria.method = query.method.toUpperCase();
  }

  if (query.status && typeof query.status === "string") {
    const parsed = parseInt(query.status, 10);
    if (!isNaN(parsed)) criteria.status = parsed;
  }

  if (query.tag && typeof query.tag === "string") {
    criteria.tag = query.tag;
  }

  if (query.bookmarked !== undefined) {
    criteria.bookmarked = query.bookmarked === "true" || query.bookmarked === "1";
  }

  if (query.hasNote !== undefined) {
    criteria.hasNote = query.hasNote === "true" || query.hasNote === "1";
  }

  if (query.from && typeof query.from === "string") {
    criteria.from = query.from;
  }

  if (query.to && typeof query.to === "string") {
    criteria.to = query.to;
  }

  if (query.path && typeof query.path === "string") {
    criteria.path = query.path;
  }

  return criteria;
}

/**
 * Apply filter criteria to a list of stored requests.
 */
export function applyFilter(requests: any[], criteria: FilterCriteria): any[] {
  return requests.filter((req) => {
    if (criteria.method && req.method !== criteria.method) return false;

    if (criteria.status !== undefined && req.status !== criteria.status) return false;

    if (criteria.tag && (!Array.isArray(req.tags) || !req.tags.includes(criteria.tag))) return false;

    if (criteria.bookmarked !== undefined && Boolean(req.bookmarked) !== criteria.bookmarked) return false;

    if (criteria.hasNote !== undefined) {
      const notePresent = typeof req.note === "string" && req.note.trim().length > 0;
      if (notePresent !== criteria.hasNote) return false;
    }

    if (criteria.from) {
      const from = new Date(criteria.from).getTime();
      const ts = new Date(req.timestamp).getTime();
      if (isNaN(from) || ts < from) return false;
    }

    if (criteria.to) {
      const to = new Date(criteria.to).getTime();
      const ts = new Date(req.timestamp).getTime();
      if (isNaN(to) || ts > to) return false;
    }

    if (criteria.path && !req.url?.includes(criteria.path)) return false;

    return true;
  });
}

/**
 * Create an HTTP handler that returns filtered requests from the store.
 */
export function createFilterRequestsHandler(store: RequestStore) {
  return (req: IncomingMessage, res: ServerResponse): void => {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
    const query: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      query[key] = value;
    });

    const criteria = parseFilterCriteria(query);
    const all = store.getAll();
    const filtered = applyFilter(all, criteria);

    const body = JSON.stringify({ total: filtered.length, requests: filtered });
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(body),
    });
    res.end(body);
  };
}
