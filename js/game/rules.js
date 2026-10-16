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

// Missions in order (docs/lista-misji.md). Distances are in a straight line from the
// stage's start; price is what the fence asks for the artifact once the mission is lost.
export const MISSIONS = [
  { n: 1, artifact: 'cup', symbolDistance: 400, tombDistance: 800, price: 40 },
  { n: 2, artifact: 'vase', symbolDistance: 450, tombDistance: 900, price: 60 },
  { n: 3, artifact: 'chalice', symbolDistance: 500, tombDistance: 1000, price: 80 },
];

export const missionDef = (n) => MISSIONS.find((m) => m.n === n) ?? null;
