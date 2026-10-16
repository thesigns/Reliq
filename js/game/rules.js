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
  tombSeparation: 200,       // m between tombs
  loot: { junk: 0.65, coin: 0.35 },
  coinRarity: { common: 0.75, uncommon: 0.20, rare: 0.04, legendary: 0.01 },
  missionTtlMs: 7 * DAY,     // from starting a mission to opening its gate
  fenceDelayMs: 7 * DAY,     // a lost artifact turns up at the fence this long after
  gateRadius: 100,           // m: the gate opens only this close to the tomb
  keyLength: 3,              // symbols in a tomb key, all different; one walk each
};

// What the fence pays for one coin, by rarity.
export const FENCE_PRICES = { common: 1, uncommon: 5, rare: 20, legendary: 100 };

// The eight symbols on every ring of a tomb gate. Names: i18n symbols.<id>.
export const SYMBOLS = ['fish', 'spider', 'fly', 'turtle', 'bird', 'man', 'cat', 'snake'];

// Mission tiers (docs/lista-misji.md), easiest first. Every mission of a tier shares its
// walks, in a straight line from the stage's start, and the price the fence asks for its
// artifact once the mission is lost. Names: i18n tiers.<id>.
export const TIERS = [
  { id: 'wood', symbolDistance: 200, tombDistance: 400, price: 20 },
  { id: 'copper', symbolDistance: 300, tombDistance: 600, price: 30 },
  { id: 'bronze', symbolDistance: 500, tombDistance: 1000, price: 50 },
  { id: 'iron', symbolDistance: 800, tombDistance: 1600, price: 80 },
  { id: 'silver', symbolDistance: 1200, tombDistance: 2400, price: 120 },
  { id: 'gold', symbolDistance: 1700, tombDistance: 3400, price: 170 },
  { id: 'platinum', symbolDistance: 2300, tombDistance: 4600, price: 230 },
  { id: 'diamond', symbolDistance: 3000, tombDistance: 6000, price: 300 },
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
];

export const tierDef = (id) => TIERS.find((t) => t.id === id) ?? null;

// Everything about the mission for an artifact: { artifact, tier, rank (0 = easiest tier),
// symbolDistance, tombDistance, price }, or null if there is no such mission.
export function missionDef(artifact) {
  const m = MISSIONS.find((x) => x.artifact === artifact);
  if (!m) return null;
  const { id, ...numbers } = tierDef(m.tier);
  return { artifact, tier: id, rank: TIERS.findIndex((t) => t.id === id), ...numbers };
}
