import { createRequestStore } from './request-store';

const baseEntry = () => ({
  method: 'POST',
  path: '/webhook',
  headers: { 'content-type': 'application/json' },
  body: '{"event":"test"}',
});

describe('createRequestStore', () => {
  it('adds an entry and returns it with id and timestamp', () => {
    const store = createRequestStore();
    const entry = store.add(baseEntry());
    expect(entry.id).toBeDefined();
    expect(entry.timestamp).toBeDefined();
    expect(entry.method).toBe('POST');
  });

  it('retrieves an entry by id', () => {
    const store = createRequestStore();
    const added = store.add(baseEntry());
    expect(store.get(added.id)).toEqual(added);
  });

  it('updates an existing entry', () => {
    const store = createRequestStore();
    const added = store.add(baseEntry());
    const updated = store.update(added.id, { statusCode: 200, duration: 42 });
    expect(updated?.statusCode).toBe(200);
    expect(updated?.duration).toBe(42);
  });

  it('returns undefined when updating non-existent id', () => {
    const store = createRequestStore();
    expect(store.update('missing-id', { statusCode: 404 })).toBeUndefined();
  });

  it('lists entries in reverse chronological order', () => {
    const store = createRequestStore();
    const a = store.add({ ...baseEntry(), path: '/a' });
    const b = store.add({ ...baseEntry(), path: '/b' });
    const list = store.list();
    expect(list[0].id).toBe(b.id);
    expect(list[1].id).toBe(a.id);
  });

  it('respects maxEntries limit', () => {
    const store = createRequestStore(3);
    store.add(baseEntry());
    store.add(baseEntry());
    store.add(baseEntry());
    const fourth = store.add(baseEntry());
    const list = store.list(10);
    expect(list.length).toBe(3);
    expect(list[0].id).toBe(fourth.id);
  });

  it('clears all entries', () => {
    const store = createRequestStore();
    store.add(baseEntry());
    store.clear();
    expect(store.list()).toHaveLength(0);
  });
});
