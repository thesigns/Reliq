// Save-game shape, defaults and validation. Positions are stored as lat/lon;
// gameplay converts them into the vault's local metric frame.

import { SYMBOLS, RULES, missionDef } from './rules.js';
import { ARTIFACTS } from './items.js';

// v3: missions replace bought tomb maps. Older saves are not migrated (the game had not
// been played outside yet): they are set aside and the game starts over.
export const SAVE_VERSION = 3;

export function createState(now) {
  return {
    v: SAVE_VERSION,
    createdAt: now,
    vault: null,          // { lat, lon, t }
    searches: [],         // [{ lat, lon, t }] — expired ones are pruned
    coins: {},            // { [coinId]: count } — in the vault; only counts above zero
    satchel: { coins: {}, artifacts: [] },  // finds carried until the player is back at the vault
    money: 0,             // from selling coins to the fence
    mission: null,        // { n, t, key: [symbol ×3], shards: [symbol], stageAt } — stageAt: when the current stage opens
    tombs: [],            // [{ n, lat, lon, t, opened, artifact }] — closed only for the active mission
    artifacts: [],        // [{ id, n, t, from: 'tomb' | 'fence' }] — the shelf
    lost: [],             // [{ n, t }] — failed or abandoned missions; the fence sells them from t + 7 days
    trail: [],            // [{ lat, lon, t, gap? }] — decorative route, last 6 h; gap starts a new stretch
    settings: { ...DEFAULT_SETTINGS },
  };
}

// quality: 'full' | 'saver' (lower resolution and frame rate to save battery)
export const DEFAULT_SETTINGS = { lang: null, sound: true, haptics: true, keepAwake: true, quality: 'full' };

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const isPoint = (p) => p && isNum(p.lat) && isNum(p.lon) && isNum(p.t);
const isArtifact = (a) => a && ARTIFACTS.includes(a.id) && Number.isInteger(a.n) && isNum(a.t) && (a.from === 'tomb' || a.from === 'fence');
const isKey = (k) => Array.isArray(k) && k.length === RULES.keyLength && new Set(k).size === k.length && k.every((s) => SYMBOLS.includes(s));

// Returns a valid state built from untrusted saved data, or null if it cannot be used.
export function migrate(raw, now) {
  if (!raw || typeof raw !== 'object' || raw.v !== SAVE_VERSION) return null;
  const s = createState(isNum(raw.createdAt) ? raw.createdAt : now);
  if (isPoint(raw.vault)) s.vault = { lat: raw.vault.lat, lon: raw.vault.lon, t: raw.vault.t };
  if (Array.isArray(raw.searches)) s.searches = raw.searches.filter(isPoint).map(({ lat, lon, t }) => ({ lat, lon, t }));
  if (raw.coins && typeof raw.coins === 'object') {
    for (const [id, n] of Object.entries(raw.coins)) if (Number.isInteger(n) && n > 0) s.coins[id] = n;
  }
  if (Number.isInteger(raw.money) && raw.money > 0) s.money = raw.money;
  const bag = raw.satchel;
  if (bag && typeof bag === 'object') {
    if (bag.coins && typeof bag.coins === 'object') {
      for (const [id, n] of Object.entries(bag.coins)) if (Number.isInteger(n) && n > 0) s.satchel.coins[id] = n;
    }
    if (Array.isArray(bag.artifacts)) s.satchel.artifacts = bag.artifacts.filter(isArtifact).map(({ id, n, t, from }) => ({ id, n, t, from }));
  }

  const m = raw.mission;
  if (m && missionDef(m.n) && isNum(m.t) && isNum(m.stageAt) && isKey(m.key)) {
    const shards = Array.isArray(m.shards) ? [...new Set(m.shards.filter((x) => m.key.includes(x)))] : [];
    s.mission = { n: m.n, t: m.t, key: [...m.key], shards, stageAt: m.stageAt };
  }

  if (Array.isArray(raw.tombs)) {
    for (const tb of raw.tombs) {
      if (!isPoint(tb) || !Number.isInteger(tb.n) || typeof tb.opened !== 'boolean' || !ARTIFACTS.includes(tb.artifact)) continue;
      // A closed tomb belongs to the active mission; any other could never be opened.
      if (!tb.opened && s.mission?.n !== tb.n) continue;
      s.tombs.push({ n: tb.n, lat: tb.lat, lon: tb.lon, t: tb.t, opened: tb.opened, artifact: tb.artifact });
    }
  }
  if (Array.isArray(raw.artifacts)) s.artifacts = raw.artifacts.filter(isArtifact).map(({ id, n, t, from }) => ({ id, n, t, from }));
  if (Array.isArray(raw.lost)) {
    for (const l of raw.lost) if (l && missionDef(l.n) && isNum(l.t)) s.lost.push({ n: l.n, t: l.t });
  }

  if (Array.isArray(raw.trail)) s.trail = raw.trail.filter(isPoint).map(({ lat, lon, t, gap }) => (gap === true ? { lat, lon, t, gap } : { lat, lon, t }));
  if (raw.settings && typeof raw.settings === 'object') {
    if (raw.settings.lang === 'pl' || raw.settings.lang === 'en') s.settings.lang = raw.settings.lang;
    for (const k of ['sound', 'haptics', 'keepAwake']) {
      if (typeof raw.settings[k] === 'boolean') s.settings[k] = raw.settings[k];
    }
    if (raw.settings.quality === 'full' || raw.settings.quality === 'saver') s.settings.quality = raw.settings.quality;
  }
  return s;
}
