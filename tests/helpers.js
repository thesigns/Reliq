import { LocalFrame } from '../js/core/geo.js';
import { Game } from '../js/game/game.js';
import { createState } from '../js/game/state.js';

export const VAULT = { lat: 52.2297, lon: 21.0122 };
export const HOUR = 3600e3;
export const T0 = Date.UTC(2026, 9, 15, 9, 0, 0);
export const frame = new LocalFrame(VAULT.lat, VAULT.lon);
export const READY = { ready: true, speedKmh: 4 };

// GPS fix at local metres (x east, y north) from the vault.
export function fixAt(x, y, acc = 8) {
  const g = frame.toGeo(x, y);
  return { lat: g.lat, lon: g.lon, acc };
}

// Feeds a fixed sequence of numbers to the game; throws if it runs out.
export function seq(...values) {
  let i = 0;
  return () => {
    if (i >= values.length) throw new Error('rng sequence exhausted');
    return values[i++];
  };
}

export function newGame({ rng = () => 0.1, withVault = true } = {}) {
  const state = createState(T0);
  if (withVault) state.vault = { ...VAULT, t: T0 };
  let changes = 0;
  const game = new Game(state, { rng, onChange: () => { changes++; } });
  return { game, state, changes: () => changes };
}
