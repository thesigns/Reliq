// Save-game shape, defaults and validation. Positions are stored as lat/lon;
// gameplay converts them into the vault's local metric frame.

import { SYMBOLS, RULES, missionDef } from './rules.js';
import { ARTIFACTS } from './items.js';

// v4: missions by tier, named by their artifact and numbered in the order played.
export const SAVE_VERSION = 4;

// The oldest save this game can still read. Older ones (from before the first release) are
// set aside and the game starts over. Raise it only to drop old saves on purpose.
export const OLDEST_SAVE_VERSION = 4;

// Upgrade steps for the raw saved JSON, before it is validated: MIGRATIONS[v] turns a v save
// into a v + 1 one. When the save shape changes, raise SAVE_VERSION and add the step from
// the old version, e.g.
//   4: (raw) => ({ ...raw, pets: [] }),
// A step may assume only what the version it reads wrote; validation fills in the rest.
export const MIGRATIONS = {};

// The raw save brought up to `target`, or null if it is too old, from a newer game, or a
// step is missing. The input is not changed.
export function upgrade(raw, migrations = MIGRATIONS, target = SAVE_VERSION, oldest = OLDEST_SAVE_VERSION) {
  if (!raw || typeof raw !== 'object' || !Number.isInteger(raw.v)) return null;
  if (raw.v < oldest || raw.v > target) return null;
  let save = structuredClone(raw);
  for (let v = raw.v; v < target; v++) {
    const step = migrations[v];
    if (!step) return null;
    save = { ...step(save), v: v + 1 };
  }
  return save;
}

export function createState(now) {
  return {
    v: SAVE_VERSION,
    createdAt: now,
    vault: null,          // { lat, lon, t }
    seed: 0,              // shuffles the missions within a tier; drawn when the vault is placed
    searches: [],         // [{ lat, lon, t }] — expired ones are pruned
    coins: {},            // { [coinId]: count } — in the vault; only counts above zero
    satchel: { coins: {}, artifacts: [] },  // finds carried until the player is back at the vault
    money: 0,             // from selling coins to the fence
    mission: null,        // { n, artifact, t, key: [symbol ×3], shards: [symbol], stageAt } — n: the order played; stageAt: when the current stage opens
    tombs: [],            // [{ n, lat, lon, t, opened, artifact }] — closed only for the active mission
    artifacts: [],        // [{ id, n, t, from: 'tomb' | 'fence' }] — in the vault
    lost: [],             // [{ n, artifact, t }] — failed or abandoned missions; the fence sells the artifact from t + 7 days
    settings: { ...DEFAULT_SETTINGS },
  };
}

// quality: 'full' | 'saver' (lower resolution and frame rate to save battery)
export const DEFAULT_SETTINGS = { lang: null, sound: true, haptics: true, keepAwake: true, quality: 'full' };

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const isPoint = (p) => p && isNum(p.lat) && isNum(p.lon) && isNum(p.t);
const isArtifact = (a) => a && ARTIFACTS.includes(a.id) && Number.isInteger(a.n) && isNum(a.t) && (a.from === 'tomb' || a.from === 'fence');
const isKey = (k) => Array.isArray(k) && k.length === RULES.keyLength && new Set(k).size === k.length && k.every((s) => SYMBOLS.includes(s));

// Returns a valid state built from untrusted saved data, upgraded from an older version if
// need be, or null if it cannot be used. steps: { migrations, oldest }, for tests.
export function migrate(saved, now, { migrations = MIGRATIONS, oldest = OLDEST_SAVE_VERSION } = {}) {
  const raw = upgrade(saved, migrations, SAVE_VERSION, oldest);
  if (!raw) return null;
  const s = createState(isNum(raw.createdAt) ? raw.createdAt : now);
  if (isPoint(raw.vault)) s.vault = { lat: raw.vault.lat, lon: raw.vault.lon, t: raw.vault.t };
  if (Number.isInteger(raw.seed) && raw.seed >= 0) s.seed = raw.seed;
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
  if (m && Number.isInteger(m.n) && missionDef(m.artifact) && isNum(m.t) && isNum(m.stageAt) && isKey(m.key)) {
    const shards = Array.isArray(m.shards) ? [...new Set(m.shards.filter((x) => m.key.includes(x)))] : [];
    s.mission = { n: m.n, artifact: m.artifact, t: m.t, key: [...m.key], shards, stageAt: m.stageAt };
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
    for (const l of raw.lost) if (l && Number.isInteger(l.n) && missionDef(l.artifact) && isNum(l.t)) s.lost.push({ n: l.n, artifact: l.artifact, t: l.t });
  }

  if (raw.settings && typeof raw.settings === 'object') {
    if (raw.settings.lang === 'pl' || raw.settings.lang === 'en') s.settings.lang = raw.settings.lang;
    for (const k of ['sound', 'haptics', 'keepAwake']) {
      if (typeof raw.settings[k] === 'boolean') s.settings[k] = raw.settings[k];
    }
    if (raw.settings.quality === 'full' || raw.settings.quality === 'saver') s.settings.quality = raw.settings.quality;
  }
  return s;
}
