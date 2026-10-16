// Persistence in localStorage. Storage can be missing or throw (private mode, blocked
// site data), so every access is guarded and the game falls back to an in-memory store.

import { createState, migrate } from '../game/state.js';

export const SAVE_KEY = 'reliq.save';

function memoryStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: (k) => { m.delete(k); },
  };
}

export function defaultStorage() {
  try {
    const s = globalThis.localStorage;
    const probe = '__reliq_probe__';
    s.setItem(probe, '1');
    s.removeItem(probe);
    return s;
  } catch {
    return memoryStorage();
  }
}

export class Store {
  constructor(storage = defaultStorage()) {
    this.storage = storage;
  }

  // Always returns a usable state. Unreadable saves are kept aside, never silently lost.
  load(now) {
    let raw = null;
    try { raw = this.storage.getItem(SAVE_KEY); } catch { return createState(now); }
    if (!raw) return createState(now);
    try {
      const state = migrate(JSON.parse(raw), now);
      if (state) return state;
    } catch { /* fall through to backup */ }
    try { this.storage.setItem(`${SAVE_KEY}.unreadable`, raw); } catch { /* ignore */ }
    return createState(now);
  }

  save(state) {
    try {
      this.storage.setItem(SAVE_KEY, JSON.stringify(state));
      return true;
    } catch {
      return false;
    }
  }

  clear() {
    try { this.storage.removeItem(SAVE_KEY); } catch { /* ignore */ }
  }
}

// Asks the browser not to evict our data under storage pressure (best effort).
export async function requestPersistence() {
  try {
    if (navigator.storage?.persisted && (await navigator.storage.persisted())) return true;
    if (navigator.storage?.persist) return await navigator.storage.persist();
  } catch { /* unsupported */ }
  return false;
}
