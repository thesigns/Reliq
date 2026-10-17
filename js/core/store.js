// Persistence in localStorage. Storage can be missing or throw (private mode, blocked
// site data), so every access is guarded and the game falls back to an in-memory store.

import { createState, migrate, SAVE_VERSION } from '../game/state.js';

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
  // steps: upgrade steps other than the game's, for tests (see migrate()).
  constructor(storage = defaultStorage(), steps = undefined) {
    this.storage = storage;
    this.steps = steps;
  }

  // Always returns a usable state. Unreadable saves are kept aside, never silently lost, and
  // an older save that was upgraded is kept as it was under reliq.save.v<version>.
  load(now) {
    let raw = null;
    try { raw = this.storage.getItem(SAVE_KEY); } catch { return createState(now); }
    if (!raw) return createState(now);
    try {
      const saved = JSON.parse(raw);
      const state = migrate(saved, now, this.steps);
      if (state) {
        if (saved.v !== SAVE_VERSION) {
          try { this.storage.setItem(`${SAVE_KEY}.v${saved.v}`, raw); } catch { /* ignore */ }
        }
        return state;
      }
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
