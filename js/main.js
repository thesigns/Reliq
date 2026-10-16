// Reliq — app bootstrap: wires the save game, location, map, HUD and screens together.

import { LocalFrame } from './core/geo.js';
import { clock } from './core/clock.js';
import { Store, requestPersistence } from './core/store.js';
import { keepScreenOn, screenLockHeld } from './core/wakelock.js';
import { RULES, SYMBOLS, missionDef } from './game/rules.js';
import { kernel } from './game/field.js';
import { Game } from './game/game.js';
import { JUNK, ARTIFACTS, COINS } from './game/items.js';
import { LocationTracker } from './gps/location.js';
import { PositionFilter } from './gps/filter.js';
import { GpsSimulator } from './gps/simulator.js';
import { GeolocationSource } from './gps/geolocation.js';
import { Compass } from './gps/compass.js';
import { Camera } from './render/camera.js';
import { MapRenderer } from './render/map-renderer.js';
import { regionLabels } from './render/regions.js';
import { coinThumbnail, artifactThumbnail } from './render/artifact-thumbs.js';
import { sealSVG } from './render/icons.js';
import { Hud, pickGrid } from './ui/hud.js';
import { MapTooltip, EdgePointer, LabelLayer } from './ui/map-ui.js';
import { ScaleBar } from './ui/scale-bar.js';
import { Reveal } from './ui/reveal.js';
import { MODELS } from './render/models/index.js';
import { MissionNotebook, missionBrief } from './ui/notebook.js';
import { GateScreen } from './ui/gate.js';
import { Journal } from './ui/journal.js';
import { GameMenu } from './ui/menu.js';
import { DepositScreen } from './ui/deposit.js';
import { SatchelButton, SatchelView } from './ui/satchel.js';
import { shardSketch } from './ui/gate-art.js';
import { Onboarding } from './ui/onboarding.js';
import { Toast } from './ui/toast.js';
import { Particles } from './ui/particles.js';
import { notebookSVG, closeGlyph, gearSVG } from './ui/art.js';
import { sfx } from './ui/audio.js';
import { haptics } from './ui/haptics.js';
import { applyI18n, onLangChange, setLang, getLang, t, formatDistance, formatDuration, formatDate, formatRoman } from './i18n/i18n.js';
import { seedDemoWorld, DEMO_VAULT, DEMO_PLAYER } from './demo.js';
import { VERSION } from './version.js';

const $ = (id) => document.getElementById(id);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const HOUR = 3600e3;

// ---- Developer mode (localhost or ?debug): debug panel, simulator, time warp ----
const DEV_CLOCK_KEY = 'reliq.dev.clockOffset';
const DEV_GPS_KEY = 'reliq.dev.gps';
const DEV_SEED_KEY = 'reliq.dev.seed';
const DEV_FLAG_KEY = 'reliq.dev.debug';
const DEV_SIM_KEY = 'reliq.dev.simPos'; // where the simulator stood, so a reload resumes there
const devGet = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const devSet = (k, v) => { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { /* ignore */ } };

const params = new URLSearchParams(location.search);
if (params.has('debug')) devSet(DEV_FLAG_KEY, params.get('debug') === '0' ? null : '1');
const LOCALHOST = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
const DEV = LOCALHOST || devGet(DEV_FLAG_KEY) === '1';

// Simulator on localhost, real GPS elsewhere; ?gps=sim|real overrides and is remembered.
function gpsMode() {
  const q = params.get('gps');
  if (q === 'sim' || q === 'real') { devSet(DEV_GPS_KEY, q); return q; }
  const saved = devGet(DEV_GPS_KEY);
  if (DEV && (saved === 'sim' || saved === 'real')) return saved;
  return LOCALHOST ? 'sim' : 'real';
}
const MODE = gpsMode();

// ---- Save game ----
clock.offset = DEV ? Number(devGet(DEV_CLOCK_KEY)) || 0 : 0;
const store = new Store();
const state = store.load(clock.now());
// Debug panel: "Demo world" / "Demo world here" ask for a seeded world on the next start.
const seedRequest = devGet(DEV_SEED_KEY);
if (seedRequest && !state.vault) {
  let vault = DEMO_VAULT;
  try {
    const here = JSON.parse(seedRequest);
    if (here && Number.isFinite(here.lat)) vault = new LocalFrame(here.lat, here.lon).toGeo(-DEMO_PLAYER.x, -DEMO_PLAYER.y);
  } catch { /* default spot */ }
  seedDemoWorld(state, clock.now(), vault);
}
devSet(DEV_SEED_KEY, null);
if (state.settings.lang) setLang(state.settings.lang);

let saveTimer = 0;
let resetting = false;   // a reset is reloading the page: nothing may save over it
function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveNow, 400);
}
function saveNow() {
  clearTimeout(saveTimer);
  if (resetting) return;
  store.save(state);
  if (DEV) devSet(DEV_CLOCK_KEY, String(clock.offset));
}
addEventListener('pagehide', saveNow);

function resetGame() {
  resetting = true;
  clearTimeout(saveTimer);
  store.clear();
  devSet(DEV_CLOCK_KEY, null);
  devSet(DEV_SIM_KEY, null);
  location.reload();
}

const game = new Game(state, { onChange: scheduleSave });
// The active mission at the last check; a mission that vanished into state.lost ran out.
let missionSeen = state.mission?.n ?? null;

// 'place': no vault yet, the medallion sets one up. 'play': searching.
let mode = state.vault ? 'play' : 'place';

// ---- Coordinates ----
// Everything is drawn in metres around the vault. Before there is one, a provisional
// frame is used: the first GPS fix (real GPS) or the demo spot (simulator).
let frame = new LocalFrame(state.vault?.lat ?? DEMO_VAULT.lat, state.vault?.lon ?? DEMO_VAULT.lon);
let worldOff = frame.worldOffset();
let frameFromFix = !!state.vault || MODE === 'sim';

// ---- Location: source -> history (speed) + filter (position) ----
const tracker = new LocationTracker();
const filter = new PositionFilter();
const compass = new Compass();
let lastSample = null;

// Speed is measured on the filtered track: a single multipath jump of 50 m in raw fixes
// would otherwise read as running and block searching.
function onSample(s) {
  if (!frameFromFix) {
    frameFromFix = true;
    setFrame(s.lat, s.lon);
  }
  lastSample = s;
  const p = frame.toLocal(s.lat, s.lon);
  filter.update(p.x, p.y, s.acc, s.t);
  const e = filter.estimate(s.t);
  tracker.push({ ...frame.toGeo(e.x, e.y), acc: s.acc, t: s.t });
}

let sim = null;
let source;
if (MODE === 'sim') {
  let last = null;
  try { last = state.vault && JSON.parse(devGet(DEV_SIM_KEY)); } catch { /* start at the demo spot */ }
  sim = new GpsSimulator(frame, last ? frame.toLocal(last.lat, last.lon) : (state.vault ? DEMO_PLAYER : { x: 0, y: 0 }), onSample);
  sim.onTeleport = primeSimHistory;
  source = sim;
  primeSimHistory();
} else {
  source = new GeolocationSource(onSample);
}

// Simulator only: pretend the receiver has been running at the current spot for a while,
// so the game is ready at once and a teleport is not mistaken for speeding.
function primeSimHistory() {
  tracker.reset();
  filter.reset();
  const now = clock.now();
  for (let i = 20; i >= 1; i--) {
    const g = frame.toGeo(sim.x, sim.y);
    onSample({ lat: g.lat, lon: g.lon, acc: sim.accuracy, t: now - i * 1000, speed: 0, course: null });
  }
}

// Moves every local-metre quantity into a new frame (provisional -> first fix -> vault).
function setFrame(lat, lon) {
  const old = frame;
  frame = new LocalFrame(lat, lon);
  worldOff = frame.worldOffset();
  const move = (p) => { const g = old.toGeo(p.x, p.y); return frame.toLocal(g.lat, g.lon); };
  if (sim) {
    const p = move(sim);
    sim.frame = frame;
    sim.x = p.x;
    sim.y = p.y;
    sim.target = null;
  }
  const c = move(cam);
  cam.x = c.x;
  cam.y = c.y;
  const est0 = filter.estimate(clock.now());
  filter.reset();
  if (est0 && lastSample) {
    const p = move(est0);
    filter.update(p.x, p.y, lastSample.acc, clock.now());
  }
  renderer.invalidate();
}

const motion = (now) => ({ ready: tracker.ready(now), speedKmh: tracker.speedKmh(now) });

// The position the rules use is the smoothed one (the same one the needle is drawn at);
// accuracy is the receiver's own estimate for the latest reading.
function currentFix(e) {
  if (!e || !lastSample) return null;
  const g = frame.toGeo(e.x, e.y);
  return { lat: g.lat, lon: g.lon, acc: lastSample.acc };
}

const GPS_STATUS = { denied: 'gpsDenied', unavailable: 'gpsUnavailable', insecure: 'gpsInsecure', unsupported: 'gpsUnsupported' };
function computeStatus(now) {
  const gps = GPS_STATUS[source.state];
  if (gps) return { code: gps };
  if (mode === 'place') {
    if (!fix) return { code: 'locating' };
    if (fix.acc > RULES.maxAccuracyM) return { code: 'gps', acc: Math.round(fix.acc) };
    return { code: 'placeVault' };
  }
  return game.searchStatus(fix, motion(now), now);
}

// ---- Rendering & UI ----
const cam = new Camera();
cam.x = sim ? sim.x : 0;
cam.y = sim ? sim.y : 0;
const stage = $('stage');
const renderer = new MapRenderer($('map'));
const fx = new Particles($('fx'));
const hud = new Hud();
const reveal = new Reveal($('reveal'));
const notebook = new MissionNotebook($('notebook'), {
  onAbandon: () => { onAbandonMission(); notebook.close(); },
});
const gate = new GateScreen($('gate'));
const tooltip = new MapTooltip($('map-tip'));
const vaultPointer = new EdgePointer($('vault-pointer'));
const labels = new LabelLayer($('map-labels'));
const scaleBar = new ScaleBar($('scale-bar'));
const toast = new Toast($('toast'));
const onboarding = new Onboarding($('onboarding'));
const deposit = new DepositScreen($('deposit'));
const satchelUi = new SatchelButton($('btn-satchel'));
const satchelView = new SatchelView($('satchel-view'), { t, coinThumb: coinThumbnail, artifactThumb: artifactThumbnail, coinOrder: COINS.map((c) => c.id), sfx });
// ---- Installation (PWA) ----
let installPrompt = null;
addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  installPrompt = e;
  menu?.refresh();
});
const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const install = {
  canPrompt: () => !!installPrompt && !standalone(),
  iosHint: () => isIos && !standalone(),
  async prompt() {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice.catch(() => {});
    installPrompt = null;
    menu.refresh();
  },
};

const journal = new Journal($('journal'), {
  state,
  thumbnail: coinThumbnail,
  artifactThumb: artifactThumbnail,
  missionCheck: () => game.missionCheck(fix, clock.now()),
  missionOffer: () => game.missionOffer(),
  onViewCoin: (id) => reveal.viewCoin(id, state.coins[id] ?? 0),
  onShowTomb: (tb) => showTomb(tb),
  onShowNotebook: () => openNotebook(),
  openMissionPage: (page) => notebook.openPage(page),
  closeMissionPage: () => notebook.close(),
  onStartMission: () => onStartMission(),
  onViewArtifact: (a) => viewArtifact(a),
  fenceOffers: () => { const now = clock.now(); return game.fenceOffers(now).map((o) => ({ ...o, now })); },
  coinPrice: (id) => game.coinPrice(id),
  onSellCoin: (id) => onSellCoin(id),
  onBuyArtifact: (n) => onBuyArtifact(n),
});
const menu = new GameMenu($('menu'), {
  state,
  install,
  version: VERSION,
  canKeepAwake: MODE === 'real' && 'wakeLock' in navigator,
  onPlay: () => onPlay(),
  onSetting: (key, value) => changeSetting(key, value),
  onReset: () => resetGame(),
});
const insets = { top: 0, bottom: 0 };   // map area hidden under the top bar and the dock

// Appear animations for things created this session (keyed by state objects).
const bornAt = new WeakMap();
let animUntil = 0;
function markBorn(obj, at) {
  bornAt.set(obj, at);
  animUntil = Math.max(animUntil, at + 2000);
}
let vaultBornAt = 0;

let busy = false;
let est = null;
let fix = null;
let heading = 0;

// ?inspect=2 renders at 2× density and scales the whole app up, to judge detail on a low-DPI screen.
const INSPECT = +params.get('inspect') || 0;
if (INSPECT) {
  document.documentElement.classList.add('inspect');
  // ?inspect=2&w=360&h=640 emulates a phone of that size.
  if (params.get('w')) document.getElementById('app').style.width = `${+params.get('w')}px`;
  if (params.get('h')) document.getElementById('app').style.height = `${+params.get('h')}px`;
}
const saver = () => state.settings.quality === 'saver';
const pixelRatio = () => INSPECT || Math.min(devicePixelRatio || 1, saver() ? 1.25 : 2);

function resize() {
  const w = stage.clientWidth, h = stage.clientHeight;
  const dpr = pixelRatio();
  cam.setViewport(w, h);
  renderer.resize(w, h, dpr);
  fx.resize(w, h, dpr);
  // The medallion sticks out ~36 px above the dock.
  insets.top = $('topbar').offsetHeight;
  insets.bottom = document.querySelector('.dock').offsetHeight + 36;
  cam.offsetY = (insets.bottom - insets.top) / 2;
}

function applySettings() {
  const s = state.settings;
  sfx.setEnabled(s.sound);
  haptics.setEnabled(s.haptics);
  keepScreenOn(MODE === 'real' && s.keepAwake);
  resize();
}

function changeSetting(key, value) {
  if (key === 'lang') { setLang(value); return; }
  state.settings[key] = value;
  applySettings();
  scheduleSave();
}

// ---- Map interaction: what is under a tap ----
function hitTest(sx, sy, now) {
  let best = null;
  for (const tb of state.tombs) {
    const q = game.toLocal(tb);
    const s = cam.toScreen(q.x, q.y);
    const d = Math.hypot(sx - s.sx, sy - s.sy);
    if (d < 28 && (!best || d < best.d)) best = { d, kind: 'tomb', tb };
  }
  if (best) return best;
  if (!state.vault) return null;
  const v = cam.toScreen(0, 0);
  if (Math.hypot(sx - v.sx, sy - (v.sy - 6)) < 30) return { kind: 'vault' };
  const p = cam.toLocal(sx, sy);
  if (game.isSearched(p, now)) {
    // The area that contributes most to this spot is "the" area the player tapped.
    let area = null, top = 0;
    for (const s of game.activeSearches(now)) {
      const q = game.toLocal(s);
      const k = kernel(Math.hypot(p.x - q.x, p.y - q.y));
      if (k > top) { top = k; area = s; }
    }
    if (area) return { kind: 'area', area, p };
  }
  return null;
}

const treasureName = (tb) => (tb.artifact ? t(`artifacts.${tb.artifact}.name`) : t(`items.${tb.coinId}.name`));

function showTombTip(tb) {
  const q = game.toLocal(tb);
  tooltip.show(
    t('tip.tomb.title', { n: formatRoman(tb.n) }),
    tb.opened
      ? t('tip.tomb.body', { date: formatDate(tb.t), treasure: treasureName(tb) })
      : t('tip.tomb.closed', { r: formatDistance(RULES.gateRadius) }),
    () => { const s = cam.toScreen(q.x, q.y); return { sx: s.sx, sy: s.sy - 26 }; },
  );
}

function showTomb(tb) {
  const q = game.toLocal(tb);
  cam.flyTo(cam.followPoint(q), Math.max(cam.ppm, 1.2), 0.9);
  $('btn-recenter').classList.add('attention');
  setTimeout(() => showTombTip(tb), 950);
}

function onMapTap(sx, sy) {
  const now = clock.now();
  const hit = hitTest(sx, sy, now);
  if (!hit) { tooltip.hide(); return; }
  sfx.click();
  if (hit.kind === 'tomb') {
    // Standing at a closed tomb, a tap on it goes straight to the gate.
    if (!hit.tb.opened && game.gateCheck(fix).ok) { onOpenGate(); return; }
    showTombTip(hit.tb);
  } else if (hit.kind === 'vault') {
    const coins = Object.values(state.coins).reduce((a, b) => a + b, 0);
    tooltip.show(t('tip.vault.title'), t('tip.vault.body', { n: coins }), () => {
      const s = cam.toScreen(0, 0);
      return { sx: s.sx, sy: s.sy - 30 };
    });
  } else {
    const left = hit.area.t + RULES.searchTtlMs - now;
    const p = hit.p;
    tooltip.show(t('tip.area.title'), t('tip.area.body', { time: formatDuration(left) }), () => {
      const s = cam.toScreen(p.x, p.y);
      return { sx: s.sx, sy: s.sy - 6 };
    });
  }
}

// Region names fade in as the map zooms out; the mission ring gets a label where it
// crosses the middle of the view.
function updateMapLabels() {
  const items = [];
  const fade = Math.min(1, Math.max(0, (1.6 - cam.ppm) / 0.6));
  if (fade > 0.01) {
    // Names never cover the markers that matter: vault, tombs and the player.
    const keepClear = [];
    if (state.vault) keepClear.push(cam.toScreen(0, 0));
    for (const tb of state.tombs) { const q = game.toLocal(tb); keepClear.push(cam.toScreen(q.x, q.y)); }
    if (est) keepClear.push(cam.toScreen(est.x, est.y));
    for (const r of regionLabels(cam, worldOff)) {
      const s = cam.toScreen(r.x, r.y);
      if (keepClear.some((k) => Math.abs(k.sx - s.sx) < 110 && Math.abs(k.sy - 20 - s.sy) < 44)) continue;
      items.push({ id: r.id, sx: s.sx, sy: s.sy, text: r.name, rot: r.rot, cls: `region-${r.kind}`, opacity: fade });
    }
  }
  const z = seekingZone(clock.now());
  if (z) {
    const c = cam.toLocal(cam.w / 2, (insets.top + cam.h - insets.bottom) / 2);
    const dx = c.x - z.x, dy = c.y - z.y;
    const len = Math.hypot(dx, dy);
    const ux = len > 1 ? dx / len : 0, uy = len > 1 ? dy / len : 1;
    const s = cam.toScreen(z.x + ux * z.radius, z.y + uy * z.radius);
    if (s.sx > 40 && s.sx < cam.w - 40 && s.sy > insets.top + 20 && s.sy < cam.h - insets.bottom) {
      items.push({ id: 'zone', sx: s.sx, sy: s.sy - 14, text: t('tip.zone', { d: formatDistance(z.radius) }), rot: 0, cls: 'zone-label', opacity: 1 });
    }
  }
  labels.update(items);
}

// The ring this walk has to leave: around the stage's start, while a symbol or the tomb
// is still to be found and the stage is open.
function seekingZone(now) {
  const c = game.missionCheck(fix, now);
  if (!c.active || c.stage === 'gate' || !c.start) return null;
  const p = game.toLocal(c.start);
  return { x: p.x, y: p.y, radius: c.need, tomb: c.stage === 'tomb' };
}

// Compass first, then the receiver's course, then the direction the filter sees us moving.
function targetHeading() {
  const c = compass.heading();
  if (c !== null) return c;
  if (lastSample?.course != null && (lastSample.speed ?? 0) > 0.6) return lastSample.course;
  if (est && Math.hypot(est.vx, est.vy) > 0.5) return Math.atan2(est.vx, est.vy);
  return null;
}

// Debug panel can force the next find; it still goes through the game rules.
function forcedLoot() {
  if (!DEV) return undefined;
  const v = $('dbg-result').value;
  if (v === 'auto') return undefined;
  if (v === 'junk') return { type: 'junk', id: JUNK[Math.floor(Math.random() * JUNK.length)] };
  if (v === 'shard' || v === 'tomb') return { type: v };
  return { type: 'coin', id: v };
}

function shake() {
  stage.classList.remove('shake');
  void stage.offsetWidth;
  stage.classList.add('shake');
}

function deny() {
  sfx.deny();
  haptics.deny();
  hud.nudge();
}

async function digAnimation(strikes, strength = 1) {
  for (let i = 0; i < strikes; i++) {
    if (est) {
      const s = cam.toScreen(est.x, est.y);
      fx.dust(s.sx, s.sy, (i === strikes - 1 ? 1.4 : 0.8) * strength);
    }
    sfx.dig();
    haptics.dig();
    shake();
    await wait(420);
  }
}

function tombButtonArrive() {
  const btn = $('btn-tomb');
  btn.hidden = false;
  btn.classList.remove('arrive');
  void btn.offsetWidth;
  btn.classList.add('arrive');
}

// Resolves with 'gate' when the player chose to go straight to a found tomb's gate.
async function showLoot(loot) {
  if (loot.type === 'coin') return reveal.showCoin(loot.id);
  if (loot.type === 'junk') return reveal.showJunk(loot.id);
  if (loot.type === 'shard') return reveal.showShard(loot);
  if (loot.type === 'tomb') {
    if (await reveal.showTombFound(loot.tomb.n) === 'button') return 'gate';
    toast.show(t('toast.tombFound', { r: formatDistance(RULES.gateRadius) }), 6000);
  }
}

function onMedallion() {
  if (mode === 'place') onPlaceVault();
  else onSearch();
}

async function onSearch() {
  if (busy) return;
  const now = clock.now();
  if (computeStatus(now).code !== 'ready') { deny(); return; }
  const res = game.search(fix, motion(now), now, { forceLoot: forcedLoot() });
  if (!res.ok) { deny(); return; }
  busy = true;
  hud.setBusy(true);
  tooltip.hide();
  haptics.tap();
  cam.follow = true;
  // The area is already saved; it starts drawing once the digging is done.
  const tomb = res.loot.type === 'tomb';
  markBorn(res.area, performance.now() + (tomb ? 1680 : 1260));
  if (tomb) markBorn(res.loot.tomb, performance.now() + 1700);
  await digAnimation(tomb ? 4 : 3, tomb ? 1.3 : 1);
  if (tomb) { sfx.boom(); shake(); }
  sfx.ink();
  if (est) { const s = cam.toScreen(est.x, est.y); fx.ink(s.sx, s.sy); }
  await wait(1300);
  const next = await showLoot(res.loot);
  await stowFind(res.loot);
  busy = false;
  hud.setBusy(false);
  if (next === 'gate') onOpenGate();
}

// After its reveal a coin flies into the satchel and a shard to the mission button, so the
// player sees where the find went.
async function stowFind(loot) {
  if (loot.type === 'coin') await satchelUi.fly(coinThumbnail(loot.id)?.url);
  if (loot.type === 'shard') {
    const svg = shardSketch(loot.symbol).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
    await satchelUi.fly(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`, $('btn-tomb'));
  }
  satchelUi.set(game.satchelCount());
}

// Back inside the vault's ring with something in the satchel: everything goes into the
// chest, with ceremony. Waits while another screen is up.
let depositing = false;
function overlayOpen() {
  return !reveal.root.hidden || journal.isOpen || menu.isOpen || deposit.isOpen || satchelView.isOpen || notebook.isOpen || !gate.root.hidden || !$('onboarding').hidden;
}
async function maybeDeposit() {
  if (depositing || busy || mode !== 'play' || overlayOpen() || !game.depositCheck(fix).ok) return;
  depositing = true;
  busy = true;
  hud.setBusy(true);
  tooltip.hide();
  const haul = game.deposit(fix);
  saveNow();
  satchelUi.set(0);
  const where = await deposit.play(haul, { coinThumb: coinThumbnail, artifactThumb: artifactThumbnail });
  busy = false;
  hud.setBusy(false);
  depositing = false;
  journal.refresh();
  // Straight to what was just stored: the shelf when an artifact came home.
  if (where === 'vault') journal.open(haul.artifacts?.length ? 'artifacts' : 'coins');
}

// The vault is pressed into the map like a wax seal where the player stands.
async function onPlaceVault() {
  if (busy) return;
  const now = clock.now();
  if (computeStatus(now).code !== 'placeVault') { deny(); return; }
  const res = game.createVault(fix, now);
  if (!res.ok) { deny(); return; }
  vaultBornAt = Infinity;   // hidden until the frame switches to the vault
  busy = true;
  hud.setBusy(true);
  cam.follow = true;
  const s = cam.toScreen(est.x, est.y);
  const stamp = $('stamp');
  stamp.style.left = `${s.sx}px`;
  stamp.style.top = `${s.sy - 10}px`;
  stamp.hidden = false;
  stamp.classList.remove('go');
  void stamp.offsetWidth;
  stamp.classList.add('go');
  sfx.swell(0.5);
  await wait(630);
  sfx.boom();
  sfx.chime('rare');
  haptics.reveal('rare');
  shake();
  fx.dust(s.sx, s.sy, 1.2);
  setFrame(state.vault.lat, state.vault.lon);
  vaultBornAt = performance.now() + 450;
  animUntil = Math.max(animUntil, vaultBornAt + 1500);
  mode = 'play';
  hud.setMode('play');
  await wait(900);
  stamp.hidden = true;
  busy = false;
  hud.setBusy(false);
  saveNow();
  toast.show(t('toast.vaultPlaced', { r: RULES.vaultRadius }), 5200);
}

function openNotebook() {
  if (busy) return;
  const check = game.missionCheck(fix, clock.now());
  if (check.active) notebook.open(check);
}

function onStartMission() {
  const res = game.startMission(clock.now());
  if (!res.ok) { deny(); return; }
  missionSeen = res.n;
  sfx.paper();
  sfx.chime('rare');
  haptics.reveal('uncommon');
  journal.refresh();
  tombButtonArrive();
  toast.show(t('toast.missionStarted'), 5200);
}

// The tag beside the mission button, and a word when the walk is long enough.
// stageNote: { key, told } for the current stage.
let stageNote = null;
function updateMissionTag(now) {
  const check = game.missionCheck(fix, now);
  const tag = $('mission-tag');
  tag.hidden = !check.active;
  if (!check.active) { stageNote = null; return; }
  const brief = missionBrief(check);
  const set = (sel, text) => { const el = tag.querySelector(sel); if (el.textContent !== text) el.textContent = text; };
  set('.mt-label', brief.label);
  set('.mt-value', brief.value);
  const bar = tag.querySelector('.mt-bar');
  bar.hidden = brief.progress === undefined;
  if (!bar.hidden) bar.firstChild.style.width = `${Math.round(brief.progress * 100)}%`;
  tag.classList.toggle('reached', !!check.ok);

  const key = `${check.n}:${check.shards.length}:${check.stage}`;
  if (stageNote?.key !== key) stageNote = { key, told: !!check.ok };
  // Once per stage, so GPS jitter at the edge of the ring does not repeat it.
  if (check.ok && !stageNote.told && !busy) {
    stageNote.told = true;
    sfx.ready();
    haptics.tap();
    hud.ping();
    toast.show(t('toast.farEnough'), 4200);
  }
}

function checkMissionLost() {
  const n = state.mission?.n ?? null;
  const lost = missionSeen !== null && n === null ? state.lost.find((l) => l.n === missionSeen) : null;
  if (lost) {
    const name = t(`artifacts.${lost.artifact}.name`);
    toast.show(t('toast.missionLost', { name, days: RULES.fenceDelayMs / 864e5 }), 8000);
    journal.refresh();
  }
  missionSeen = n;
}

function onSellCoin(id) {
  if (!game.sellCoin(id).ok) { deny(); return; }
  sfx.chime('common');
  haptics.tap();
  journal.refresh();
}

async function onBuyArtifact(n) {
  const res = game.buyArtifact(n, clock.now());
  if (!res.ok) { deny(); return; }
  journal.refresh();
  await viewArtifact({ id: res.artifact, n, from: 'fence' }, { button: t('reveal.toVault'), fanfare: true });
}

function onAbandonMission() {
  missionSeen = null;   // abandoned on purpose: no toast
  if (!game.abandonMission(clock.now()).ok) return;
  sfx.paper();
  journal.refresh();
}

// The lore, then the optional line about how the artifact looks (seen only once found).
function artifactText(id) {
  const key = `artifacts.${id}.detail`;
  const lore = t(`artifacts.${id}.lore`), detail = t(key);
  return detail === key ? lore : `${lore} ${detail}`;
}

// a: { id, n, from: 'tomb' | 'fence' }, as stored in the vault.
function viewArtifact(a, opts = {}) {
  return reveal.viewArtifact(MODELS[a.id], {
    name: t(`artifacts.${a.id}.name`),
    desc: artifactText(a.id),
    tomb: a.n,
    context: [t('tier.label', { tier: t(`tiers.${missionDef(a.id)?.tier}`) }), a.from === 'fence' ? t('reveal.fromFence') : ''].filter(Boolean).join(' · '),
    ...opts,
  });
}

// The gate of the active mission's tomb, on site only. The rings start anywhere but at the key.
async function onOpenGate() {
  if (busy) return;
  const check = game.missionCheck(fix, clock.now());
  if (check.stage !== 'gate') return;
  if (!check.gate.ok) {
    deny();
    notebook.fail(t('gate.far', { r: formatDistance(RULES.gateRadius) }));
    return;
  }
  busy = true;
  hud.setBusy(true);
  tooltip.hide();
  await notebook.close();
  const key = state.mission.key;
  const start = key.map((sym) => (SYMBOLS.indexOf(sym) + 1 + Math.floor(Math.random() * (SYMBOLS.length - 1))) % SYMBOLS.length);
  let opened = null;
  const result = await gate.open({
    n: check.n,
    shards: check.shards,
    keyLength: check.keyLength,
    start,
    onTry: (combo) => {
      const r = game.openGate(fix, combo, clock.now());
      if (r.ok) { opened = r.tomb; return { ok: true }; }
      return r.reason === 'far' ? { ok: false, message: t('gate.far', { r: formatDistance(RULES.gateRadius) }) } : { ok: false };
    },
  });
  if (result === 'opened' && opened) {
    saveNow();
    journal.refresh();
    await viewArtifact({ id: opened.artifact, n: opened.n, from: 'tomb' }, { button: t('reveal.toSatchel'), fanfare: true });
    await satchelUi.fly(artifactThumbnail(opened.artifact)?.url);
    satchelUi.set(game.satchelCount());
  }
  busy = false;
  hud.setBusy(false);
}

function updateDebugReadout(now) {
  if (!DEV || !$('debug').classList.contains('open')) return;
  const lines = [];
  lines.push(`źródło: ${source.kind === 'sim' ? 'symulator' : 'GPS'} · ${source.state} · tryb: ${mode}`);
  if (lastSample) lines.push(`odczyt: ±${Math.round(lastSample.acc)} m · ${((now - lastSample.t) / 1000).toFixed(1)} s temu`);
  else lines.push('odczyt: brak');
  const m = motion(now);
  lines.push(`prędkość (20 s): ${m.speedKmh.toFixed(1)} km/h${m.ready ? '' : ' · zbieranie historii'}`);
  if (est) lines.push(`filtr: σ ${est.sigma.toFixed(1)} m · v ${Math.hypot(est.vx, est.vy).toFixed(2)} m/s`);
  const c = compass.heading();
  lines.push(`kompas: ${c === null ? 'brak' : `${Math.round(((c * 180) / Math.PI + 360) % 360)}°`} · ekran: ${screenLockHeld() ? 'nie gaśnie' : 'może zgasnąć'}`);
  lines.push(`mapa: zoom ${cam.ppm.toFixed(2)} px/m · tło przerysowane ×${renderer.baseRedraws}`);
  const txt = lines.join('\n');
  if ($('dbg-readout').textContent !== txt) $('dbg-readout').textContent = txt;

  const coins = Object.entries(state.coins).map(([id, n]) => `${id} ×${n}`).join(', ') || '—';
  const ms = state.mission;
  const map = ms ? ` · misja ${ms.n} (klucz ${ms.key.join('-')}, symbole ${ms.shards.length})` : '';
  const info = `Skarbiec: ${coins} · pieniądze ${state.money}${map} · grobowce: ${state.tombs.length} · artefakty: ${state.artifacts.length}`;
  if ($('dbg-coins').textContent !== info) $('dbg-coins').textContent = info;
}

const READY_AFTER = new Set(['searched', 'vault', 'fast']);
let prevStatus = null;
let lastSlowTick = 0;
let mapButtons = []; // screen rects the vault pointer keeps clear of, refreshed with the slow tick
let lastNotebookUpdate = 0;
let lastFrame = performance.now();
let lastRender = 0;
let lastCam = { x: 0, y: 0, ppm: 0 };

function frameLoop() {
  const perf = performance.now();
  const dt = Math.min(0.05, (perf - lastFrame) / 1000);
  lastFrame = perf;

  sim?.update(dt);
  const now = clock.now();
  est = filter.estimate(now);
  fix = currentFix(est);
  if (perf - lastSlowTick > 250) {
    // Measured before this tick writes to the DOM, so reading the layout costs nothing.
    // In the pointer's own css px: ?inspect scales the whole app with a transform.
    const box = $('vault-pointer').parentElement, o = box.getBoundingClientRect(), k = box.offsetWidth / o.width || 1;
    mapButtons = ['btn-tomb', 'mission-tag', 'btn-satchel'].map($).filter((b) => !b.hidden).map((b) => {
      const r = b.getBoundingClientRect();
      return { left: (r.left - o.left) * k, right: (r.right - o.left) * k, top: (r.top - o.top) * k, bottom: (r.bottom - o.top) * k };
    });
    game.prune(now);
    checkMissionLost();
    updateMissionTag(now);
    updateDebugReadout(now);
    if (menu.isOpen) menu.setStatus(menuGpsLine());
    if (!busy) satchelUi.set(game.satchelCount());
    $('vault-pointer').classList.toggle('laden', game.satchelCount() > 0);
    maybeDeposit();
    if (sim && state.vault) devSet(DEV_SIM_KEY, JSON.stringify(frame.toGeo(sim.x, sim.y)));
    if (journal.isOpen && journal.tab === 'notebook') journal.refreshNotebook();
    lastSlowTick = perf;
  }
  const th = targetHeading();
  if (th !== null) {
    const d = Math.atan2(Math.sin(th - heading), Math.cos(th - heading));
    heading += d * (1 - Math.exp(-dt * 8));
  }
  cam.update(dt, est ?? { x: 0, y: 0 });

  const status = computeStatus(now);
  // A soft bell (and a buzz) when searching becomes possible again on a walk.
  if (status.code === 'ready' && READY_AFTER.has(prevStatus) && !busy) {
    sfx.ready();
    haptics.tap();
    hud.ping();
  }
  prevStatus = status.code;
  hud.setStatus(status);
  const searches = state.vault ? game.activeSearches(now) : [];
  hud.setGps(GPS_STATUS[source.state] ? null : lastSample?.acc);
  $('btn-tomb').hidden = !state.mission;
  if (notebook.isOpen && perf - lastNotebookUpdate > 400) {
    notebook.update(game.missionCheck(fix, now));
    lastNotebookUpdate = perf;
  }

  // Map frame rate: 60 fps for fast motion (drag, zoom, fly, digging), 30 fps for the
  // slow drift of following a walker and for idle (paper grain and the GPS pulse still
  // animate), 10 fps behind full-screen overlays. Battery saver halves the first two.
  const sinceRender = Math.max(1, perf - lastRender);
  const camPx = Math.hypot(cam.x - lastCam.x, cam.y - lastCam.y) * cam.ppm;
  const fast = camPx / sinceRender > 0.04 || cam.ppm !== lastCam.ppm || busy || fx.active || perf < animUntil || cam.fly || cam.zoomGoal || renderer.filling;
  const covered = !reveal.root.hidden || journal.isOpen || menu.isOpen || deposit.isOpen || satchelView.isOpen || !$('onboarding').hidden || !gate.root.hidden;
  const interval = covered ? 100 : fast ? (saver() ? 32 : 15) : (saver() ? 50 : 32);
  if (perf - lastRender >= interval) {
    renderMap(perf, now, searches);
    // Everything pinned to the map moves in the same frames as the map, or it would
    // swim against it on a screen that refreshes faster than the map is drawn.
    tooltip.update(cam.w);
    updateMapLabels();
    if (state.vault) {
      vaultPointer.update(cam.toScreen(0, 0), { w: cam.w, h: cam.h, top: insets.top, bottom: insets.bottom, avoid: mapButtons }, est ? formatDistance(Math.hypot(est.x, est.y)) : '');
    } else {
      $('vault-pointer').hidden = true;
    }
    scaleBar.update(cam.ppm, getLang());
    lastRender = perf;
    lastCam = { x: cam.x, y: cam.y, ppm: cam.ppm };
  }
  if (fx.active || fx.dirty) { fx.update(dt); fx.dirty = fx.active; }
  requestAnimationFrame(frameLoop);
}

function renderMap(perf, now, searches) {
  const grid = pickGrid(cam, frame);
  const appear = (o, ms) => (bornAt.has(o) ? clamp01((perf - bornAt.get(o)) / ms) : 1);
  const ve = vaultBornAt ? (perf - vaultBornAt) / 600 : 1;
  const zone = seekingZone(now);
  renderer.render({
    worldOff,
    grid,
    vault: state.vault && ve >= 0 ? { x: 0, y: 0, scale: ve < 1 ? 1.5 - 0.5 * easeOutCubic(ve) : 1 } : null,
    zone,
    exclusions: zone?.tomb ? state.tombs.map((tb) => game.toLocal(tb)) : [],
    balls: searches.map((s) => {
      const p = game.toLocal(s);
      return { x: p.x, y: p.y, scale: 0.02 + 0.98 * easeOutCubic(appear(s, 1600)), age: clamp01((now - s.t) / RULES.searchTtlMs) };
    }),
    tombs: state.tombs.map((tb) => {
      const q = game.toLocal(tb);
      // A new tomb is stamped onto the map: hidden while digging, then lands oversized and settles.
      const e = bornAt.has(tb) ? (perf - bornAt.get(tb)) / 700 : 1;
      // A closed tomb breathes gently until its gate is opened.
      const pulse = tb.opened ? 1 : 1 + 0.06 * Math.sin(perf / 320);
      return { x: q.x, y: q.y, scale: (e < 0 ? 0 : e < 1 ? 1.6 - 0.6 * easeOutCubic(e) : 1) * pulse };
    }),
    player: est ? { x: est.x, y: est.y, heading, acc: lastSample?.acc ?? 30 } : null,
  }, cam, perf / 1000, { zooming: !!(cam.zoomGoal || cam.pinching || cam.fly) });
  hud.updateGridLabels(cam, frame, grid, insets.top);
}

// Coming back after a while: the speed check needs fresh readings.
let hiddenAt = 0;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    hiddenAt = performance.now();
    saveNow();
  } else if (performance.now() - hiddenAt > 30000) {
    if (sim) primeSimHistory();
    else tracker.reset();
  }
});

async function requestCompass() {
  if (compass.needsPermission) { if (await compass.requestPermission()) compass.start(); } else compass.start();
}

function wireUi() {
  // Audio and the iOS compass both need a user gesture to start.
  document.addEventListener('click', () => {
    sfx.unlock();
    if (state.vault) requestCompass();
  }, { once: true, capture: true });
  document.addEventListener('pointerdown', () => sfx.unlock(), { capture: true });

  for (const b of document.querySelectorAll('.btn-x')) b.innerHTML = closeGlyph();
  $('btn-menu').addEventListener('click', () => { sfx.paper(); menu.open(); });
  $('btn-search').addEventListener('click', onMedallion);
  $('btn-tomb').innerHTML = notebookSVG();
  $('btn-tomb').addEventListener('click', openNotebook);
  $('mission-tag').addEventListener('click', openNotebook);
  $('notebook-gate').addEventListener('click', onOpenGate);
  $('notebook-close').addEventListener('click', () => notebook.close());
  $('btn-recenter').onclick = () => {
    sfx.click();
    cam.flyTo(null, cam.defaultPpm, 0.7);
    $('btn-recenter').classList.remove('attention');
  };
  $('btn-journal').onclick = () => { tooltip.hide(); journal.open('notebook'); };
  $('btn-satchel').onclick = () => {
    sfx.click();
    tooltip.hide();
    const d = game.depositCheck(fix).distance;
    satchelView.open(state.satchel, t('satchel.hint', { d: formatDistance(d) }));
  };
  $('vault-pointer').onclick = () => {
    sfx.click();
    cam.flyTo(cam.followPoint({ x: 0, y: 0 }), Math.max(cam.ppm, 0.6), 0.9);
    $('btn-recenter').classList.add('attention');
  };
  cam.onUserMove = () => $('btn-recenter').classList.add('attention');
  cam.onGesture = () => tooltip.hide();
  cam.onTap = onMapTap;
  // Simulator: double-click walks there, Ctrl/⌘ + double-click teleports.
  // Otherwise (and always on touch) a double tap zooms in.
  cam.onDoubleTap = (sx, sy, info) => {
    if (!sim || info.type !== 'mouse') return true;
    const p = cam.toLocal(sx, sy);
    if (info.ctrl) sim.teleport(p.x, p.y);
    else sim.walkTo(p.x, p.y);
    return false;
  };
  if (DEV) wireDebug();
}

function wireDebug() {
  $('debug').hidden = false;
  $('debug').classList.toggle('real', MODE === 'real');
  $('debug-toggle').innerHTML = gearSVG();
  $('debug-toggle').onclick = () => $('debug').classList.toggle('open');
  for (const b of $('dbg-source').querySelectorAll('button')) {
    b.classList.toggle('on', b.dataset.gps === MODE);
    b.onclick = () => {
      if (b.dataset.gps === MODE) return;
      devSet(DEV_GPS_KEY, b.dataset.gps);
      saveNow();
      location.href = location.pathname + (INSPECT ? `?inspect=${INSPECT}` : '');
    };
  }
  if (sim) {
    const acc = $('dbg-acc'), warp = $('dbg-warp');
    acc.oninput = () => { sim.accuracy = +acc.value; $('dbg-acc-v').textContent = `${acc.value} m`; };
    warp.oninput = () => { sim.warp = +warp.value; $('dbg-warp-v').textContent = `×${warp.value}`; };
    $('dbg-noise').onchange = (e) => { sim.noise = e.target.checked ? 'realistic' : 'clean'; };
    $('dbg-signal').onchange = (e) => { sim.signal = e.target.checked; };
  }
  $('dbg-hour').onclick = () => { clock.advance(HOUR); scheduleSave(); };
  $('dbg-lang').onclick = () => setLang(getLang() === 'pl' ? 'en' : 'pl');
  $('dbg-newgame').onclick = resetGame;
  $('dbg-reset').onclick = () => { devSet(DEV_SEED_KEY, 'default'); resetGame(); };
  // Each press shows the next artifact.
  let dbgArtifact = 0;
  $('dbg-artifact').onclick = () => {
    if (!reveal.root.hidden) return;
    const id = ARTIFACTS[dbgArtifact++ % ARTIFACTS.length];
    reveal.viewArtifact(MODELS[id], { name: t(`artifacts.${id}.name`), desc: artifactText(id) });
  };
  $('dbg-coins-add').onclick = () => {
    for (const id of ['nummus', 'kaiyuan']) state.coins[id] = (state.coins[id] ?? 0) + 12;
    game.changed();
    journal.refresh();
  };
  // Missions: bring the time limit a day closer.
  $('dbg-deadline').onclick = () => {
    if (!state.mission) return;
    state.mission.t -= 24 * HOUR;
    game.changed();
    journal.refresh();
  };
  // The fence: money to spend, and lost artifacts on sale without the 7-day wait.
  $('dbg-money').onclick = () => {
    state.money += 50;
    game.changed();
    journal.refresh();
  };
  $('dbg-fence').onclick = () => {
    for (const l of state.lost) l.t = Math.min(l.t, clock.now() - RULES.fenceDelayMs);
    game.changed();
    journal.refresh();
  };
  // The satchel: a handful of coins to carry, and a jump home to store them.
  $('dbg-satchel').onclick = () => {
    const pool = ['nummus', 'kaiyuan', 'denarius', 'tetradrachm', 'ducat', 'eidmar'];
    for (let i = 0; i < 6; i++) { const id = pool[Math.floor(Math.random() * pool.length)]; state.satchel.coins[id] = (state.satchel.coins[id] ?? 0) + 1; }
    game.changed();
  };
  $('dbg-home').onclick = () => { if (sim) sim.teleport(12, 18); };
  // Simulator only: jump next to the closed tomb and open its gate.
  $('dbg-gate').onclick = () => {
    const tb = game.closedTomb();
    if (!sim || !tb) return;
    const q = game.toLocal(tb);
    sim.teleport(q.x + 20, q.y);
    setTimeout(onOpenGate, 300);
  };
  $('dbg-here').onclick = () => {
    if (!fix) return;
    devSet(DEV_SEED_KEY, JSON.stringify({ lat: fix.lat, lon: fix.lon }));
    resetGame();
  };
}

async function main() {
  document.documentElement.lang = getLang();
  applyI18n();
  onLangChange((l) => {
    applyI18n();
    hud.lastStatusKey = null;
    hud.render();
    journal.refresh();
    menu.refresh();
    state.settings.lang = l;
    scheduleSave();
  });
  await renderer.init();
  applySettings();
  addEventListener('resize', resize);
  cam.attach($('map'));
  wireUi();
  hud.setMode(mode);
  $('stamp').innerHTML = `<img alt="" src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(sealSVG())}">`;
  requestPersistence();
  saveNow();
  // Offline support. Not on localhost (a cache-first worker would hide every code edit)
  // unless ?sw=1 asks for it to test offline play.
  if ('serviceWorker' in navigator && (!LOCALHOST || params.get('sw') === '1')) {
    const hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (hadController) toast.show(t('toast.updated'), 6000);
    });
    navigator.serviceWorker.register('./sw.js').catch((e) => console.warn('Service worker not registered:', e));
  }
  document.body.classList.add('loaded');
  window.__reliq = { cam, sim, source, filter, compass, state, game, clock, tracker, reveal, renderer, notebook, gate, store, journal, menu, deposit, satchelUi, toast };
  requestAnimationFrame(frameLoop);
  // Lift the splash once the first map frame is on screen.
  requestAnimationFrame(() => requestAnimationFrame(() => $('splash').classList.add('gone')));

  // The game opens on its menu. A returning player's GPS starts now, behind it, so it has
  // a fix by the time they tap Continue; a first run waits for Begin (see onPlay).
  if (mode !== 'place') source.start();
  menu.open();
}

// Continue, or on a first run Begin: the letter and rules, then location (the browser's
// prompt has to follow a user tap).
let begun = false;
async function onPlay() {
  menu.close();
  if (mode !== 'place' || begun) return;
  begun = true;
  await onboarding.run(() => {
    sfx.unlock();
    source.start();
    requestCompass();
  });
}

// The menu's GPS line: nothing before a first run has asked for location.
function menuGpsLine() {
  if (mode === 'place' && !begun) return '';
  const gps = GPS_STATUS[source.state];
  if (gps) return t(`status.${gps}`);
  return lastSample ? t('menu.gpsReady', { acc: Math.round(lastSample.acc) }) : t('status.locating');
}

main().catch((e) => {
  console.error(e);
  $('boot-error').hidden = false;
  $('boot-error').textContent = e.code === 'webgl' ? t('error.webgl') : `${t('error.boot')} (${e.message || e})`;
});
