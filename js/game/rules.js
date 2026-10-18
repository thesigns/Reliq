// All gameplay numbers from docs/reliq-gdd.md live here.

const HOUR = 3600e3;
const DAY = 24 * HOUR;

export const RULES = {
  vaultRadius: 100,          // m
  searchRadius: 100,         // m, nominal metaball radius
  searchTtlMs: 6 * HOUR,     // searched areas vanish after 6 h
  maxSpeedKmh: 10,           // average over the speed window
  speedWindowMs: 20e3,
  minHistoryMs: 15e3,        // need this much GPS history before speed is trusted
  maxAccuracyM: 50,
  depositMaxAccuracyM: 100,  // storing finds at the vault: GPS indoors, at home, is often poorer
  loot: { junk: 0.65, coin: 0.35 },
  coinRarity: { common: 0.75, uncommon: 0.20, rare: 0.04, legendary: 0.01 },
  missionTtlMs: 10 * DAY,    // from starting a mission to opening its gate
  gateRadius: 100,           // m: the gate opens only this close to the tomb
  keyLength: 3,              // symbols in a tomb key, all different; one stage each
  // Examining an artifact in the vault: turned with a finger, it gives up its details one at
  // a time, and each takes a fresh look at enough of its sides (js/game/examine.js).
  examine: {
    details: 3,
    sides: 24,               // view directions spread evenly round the model
    dwellMs: 500,            // a side counts once it has faced the player this long in all
    maxTurnRate: 6,          // rad/s: turning faster than this is spinning, not looking
    share: [0.3, 0.6, 0.85], // of the sides, to find the first, second and third detail
  },
};

// What the fence pays for one coin, by rarity.
export const FENCE_PRICES = { common: 1, uncommon: 5, rare: 20, legendary: 100 };

// The eight symbols on every ring of a tomb gate. Names: i18n symbols.<id>.
export const SYMBOLS = ['fish', 'spider', 'fly', 'turtle', 'bird', 'man', 'cat', 'snake'];

// Mission tiers (docs/lista-misji.md), easiest first. Every mission of a tier shares the
// number of searches each stage takes (the last of them pays out the symbol or the tomb)
// and the price the fence asks for its artifact once the mission is lost. Names: i18n tiers.<id>.
export const TIERS = [
  { id: 'wood', symbolSearches: 2, tombSearches: 4, price: 25 },
  { id: 'copper', symbolSearches: 3, tombSearches: 6, price: 40 },
  { id: 'bronze', symbolSearches: 4, tombSearches: 8, price: 50 },
  { id: 'iron', symbolSearches: 5, tombSearches: 11, price: 65 },
  { id: 'silver', symbolSearches: 7, tombSearches: 13, price: 85 },
  { id: 'gold', symbolSearches: 9, tombSearches: 18, price: 110 },
  { id: 'platinum', symbolSearches: 12, tombSearches: 24, price: 150 },
  { id: 'diamond', symbolSearches: 16, tombSearches: 32, price: 200 },
];

// The missions in the game so far, one per artifact (docs/lista-misji.md lists the ones
// still to be modelled). The order they are offered in is the game's: tier by tier, and
// shuffled within a tier (Game.nextMission).
export const MISSIONS = [
  { artifact: 'comb', tier: 'wood' },
  { artifact: 'clog', tier: 'wood' },
  { artifact: 'abacus', tier: 'wood' },
  { artifact: 'cup', tier: 'copper' },
  { artifact: 'lamp', tier: 'copper' },
  { artifact: 'bell', tier: 'copper' },
  { artifact: 'helmet', tier: 'bronze' },
  { artifact: 'lur', tier: 'bronze' },
  { artifact: 'skydisc', tier: 'bronze' },
  { artifact: 'vase', tier: 'iron' },
  { artifact: 'chalice', tier: 'iron' },
  { artifact: 'key', tier: 'iron' },
  { artifact: 'horn', tier: 'silver' },
  { artifact: 'watch', tier: 'silver' },
  { artifact: 'inkwell', tier: 'silver' },
  { artifact: 'crown', tier: 'gold' },
  { artifact: 'scarab', tier: 'gold' },
  { artifact: 'orb', tier: 'gold' },
  { artifact: 'sextant', tier: 'platinum' },
  { artifact: 'hourglass', tier: 'platinum' },
  { artifact: 'nightingale', tier: 'platinum' },
  { artifact: 'egg', tier: 'diamond' },
  { artifact: 'diamond', tier: 'diamond' },
  { artifact: 'sabre', tier: 'diamond' },
];

export const tierDef = (id) => TIERS.find((t) => t.id === id) ?? null;

// Everything about the mission for an artifact: { artifact, tier, rank (0 = easiest tier),
// symbolSearches, tombSearches, price }, or null if there is no such mission.
export function missionDef(artifact) {
  const m = MISSIONS.find((x) => x.artifact === artifact);
  if (!m) return null;
  const { id, ...numbers } = tierDef(m.tier);
  return { artifact, tier: id, rank: TIERS.findIndex((t) => t.id === id), ...numbers };
}
