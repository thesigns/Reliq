# Reliq

A treasure-hunting game for your daily walks. You set up a **Vault** where your walks usually start, then head out. When you are at least 100 m from the Vault, search the ground. Most of the time you dig up junk, sometimes an ancient coin. Missions send you on longer walks to find the symbols of a tomb's key and then the tomb itself, with a unique artifact inside. Everything you find rides home in your backpack, and storing it in the Vault is a moment of its own.

The map is a fictional, hand-inked parchment laid over real GPS coordinates. There are no streets on it, only mountains, forests and plains, plus the areas you have already searched.

Reliq is a plain website (vanilla HTML/CSS/JS, WebGL2, Web Audio) that can be installed as a PWA. It ships in English and Polish.

## How it plays

- **Search for treasure.** Each search marks a searched area with a radius of about 100 m. Nearby areas merge smoothly, like metaballs, and fade away after 6 hours. You can only search again outside every searched area and outside the Vault.
- **Fair play.** Searching is blocked when you move faster than 10 km/h (averaged over 20 s) or when the GPS error exceeds 50 m.
- **Finds.** Junk 65%, coin 35%. Coins are common, uncommon, rare or legendary (75/20/4/1%). All twelve are real historical coins, from a Roman nummus to Brutus's EID MAR aureus, modelled as low-poly 3D coins. Junk, ten kinds of it, drops in as a 3D model too, and is thrown away.
- **The backpack and the Vault.** Coins and artifacts go into your backpack. Walk back into the Vault's ring and they are stored: the treasure chest opens, the coins rain into it one by one and the artifact sinks in last. Nothing in the backpack is ever lost.
- **Missions.** One at a time, from the easiest of eight tiers (wood to diamond) to the hardest; the tier sets the walking distances. There are 24 so far, three per tier. A notebook page shows an ink sketch of the artifact and its lore. Each mission has four stages, each a walk of a set straight-line distance from where that stage began: three walks for the symbols of the tomb's key, then a longer one to the tomb. You can do them all in one go or spread them over the 10-day limit. Open the tomb's three-ring gate on site, by guessing the order of the symbols, to win the artifact. The next mission starts once that artifact is in the Vault.
- **The fence.** Sell coins from the Vault for money. Artifacts of missions you lost or abandoned go straight to the fence, for a price.
- **The Vault journal.** Four tabs: the notebook with the missions, the coins, the artifacts and the fence.

The full rules are in [`docs/reliq-gdd.md`](docs/reliq-gdd.md) and the missions in [`docs/lista-misji.md`](docs/lista-misji.md) (both in Polish).

## Status

Playable, and being tested on test walks with a phone. See [`docs/implementation-plan.md`](docs/implementation-plan.md) (in Polish).

| Stage | Scope | State |
|-------|-------|-------|
| E1 | Look-and-feel prototype | done |
| E2 | Game logic, tests, save game | done |
| E3 | Real GPS, smoothing, compass, simulator | done (device testing pending) |
| E4 | Full map renderer: camera, tap tooltips, region names, scale, caching | done |
| E5 | Game flows: onboarding, vault journal, settings | done |
| E6 | Polish: splash, "ready to search" bell, ink particles, optional generative music | done |
| E7 | PWA: icons, manifest, offline service worker, install prompt | done |
| E8 | Performance, robustness (WebGL context loss), i18n checks; device testing pending | in progress |
| E9 | Tomb gates with a three-ring key, low-poly 3D artifacts | done |
| E10 | Missions, the artifacts, the fence; then the game menu, low-poly coins, the backpack and the deposit scene, mission tiers with all 24 artifacts, 3D junk | done |

A fresh install opens on the game menu. *Begin* leads to a short introduction (a letter and four pages of rules, also under *About*), then you stamp your vault where you stand and start walking.

## Running locally

There is no build step and there are no dependencies. Serve the folder with the bundled dev server, which turns off browser caching so edits show up on reload:

```sh
node scripts/serve.mjs 8137
# or: npm run serve
```

Use this server rather than a generic one such as `python -m http.server`: browsers may cache ES modules from those, and a reload can then run stale code.

Then open <http://127.0.0.1:8137/>. On a desktop the game shows in a phone-sized frame.

Geolocation only works in a secure context. On `localhost` and `127.0.0.1` the game uses the built-in **GPS simulator** by default. Anywhere else it uses the real GPS, which requires HTTPS.

### Simulator and debug panel

The debug panel (⚙ in the top bar, beside the menu button) is shown on localhost. Anywhere else, `?debug=1` turns it on and the choice is remembered; `?debug=0` turns it off again.

- **Movement:** WASD or the arrow keys walk, and Shift runs (which trips the speed limit). Double-click the map to walk to a spot, Ctrl/⌘ + double-click to teleport.
- **Map:** drag to pan, use the wheel or pinch to zoom; on touch, double-tap zooms in and a two-finger tap zooms out. Tap a tomb, the vault or a searched area for details.
- **GPS:** the panel switches between the simulator and real GPS. In simulator mode it also sets accuracy, walking speed-up (time warp) and realistic noise (drift and multipath jumps), and can cut the signal.
- **Game:**
  - force the next find, including a symbol of the key or the tomb, and move time forward by an hour;
  - bring a mission's time limit a day closer, add coins or money, put six coins in the backpack, or put lost artifacts on sale at once;
  - teleport to the tomb's gate or to the vault;
  - preview each artifact, switch the language, start a new game, load a ready-made demo world, or move the demo world to your current position.
- **Readout:** a live view of the fix, speed, filter and compass.

URL parameters:

- `?gps=sim` or `?gps=real` overrides the location source. The choice is remembered.
- `?inspect=2` renders at 2× pixel density and scales the app up, to judge fine detail on a low-DPI screen. Add `&w=360&h=640` to emulate a phone of that size.
- `?sw=1` registers the service worker on localhost, to test offline play. Unregister it afterwards, because it serves cached files.

### Tests

The game rules (searching, missions, the backpack, the fence), geometry, loot tables, GPS filter, compass math, save game, translations and the service worker's file list have unit tests:

```sh
node --test
# or: npm test
```

Requires Node 20+. No packages to install.

### 3D models

The artifacts, coins, junk and the vault chest are low-poly meshes built vertex by vertex by Python scripts in `scripts/blender/`, run headless in Blender 5.2:

```sh
blender -b --factory-startup -P scripts/blender/<model>.py
```

Each script writes a generated module to `js/render/models/`. Edit the script and re-run it, never the generated file.

`gallery/` shows every tomb artifact turning in 3D, tier by tier, in Polish or English. It imports the game's own models, rules and strings, so it always matches the game; on GitHub Pages it lives at `<site>/gallery/`. Beside it, `gallery/fokker.html` shows a Fokker Dr.I triplane made the same way (`scripts/blender/fokker.py`), with a spinning propeller: a test of the method beyond the game.

## Deploying

Any static host with HTTPS works. For GitHub Pages: *Settings → Pages → Deploy from a branch*, pick the branch and `/ (root)`. Away from localhost the game switches to real GPS automatically.

Project pages on one GitHub Pages account share an origin, and so share localStorage and the cache storage. Reliq keeps to its own: every saved key starts with `reliq.`, and the service worker only reads and clears caches named `reliq-<version>`.

The game is an installable PWA and works offline. The service worker caches every file, cache-first, so **every release needs a new version**:

1. Bump `VERSION` in `js/version.js`.
2. Run `node scripts/build-sw.mjs` to regenerate `sw.js` with the new version and the current file list.
3. Run `node --test`. It fails if `sw.js` is out of date.

Saves carry a version. If a release changes their shape, raise `SAVE_VERSION` in `js/game/state.js` and add an upgrade step to `MIGRATIONS`, so players keep their progress; the tests fail when a step is missing. The save from before the upgrade is kept under `reliq.save.v<old version>`.

Players get the new version on their next visit, with a short "updated" notice. The app icons come from `node scripts/make-icons.mjs` and do not need regenerating for a release.

## Project layout

```
index.html            app shell
manifest.webmanifest  PWA manifest
sw.js                 service worker (generated by scripts/build-sw.mjs)
css/                  app.css (map, HUD, reveal, deposit), screens.css (onboarding, journal, menu), fonts.css
assets/fonts/         self-hosted fonts (works offline) + their licences
assets/icons/         app icons (generated by scripts/make-icons.mjs)
scripts/              dev server, service worker builder, icon generator
scripts/blender/      the low-poly model scripts and their exporter
js/
  main.js             bootstrap, frame loop, wiring
  version.js          release version (names the offline cache)
  demo.js             ready-made demo world for the debug panel
  core/               geo, noise, rng, clock, save store, wake lock
  game/               rules, tiers and missions, items, loot, metaball field,
                      save shape and migrations, game actions
  gps/                real geolocation, simulator, Kalman filter, compass, speed tracker
  render/             WebGL2 map renderer, shaders, ink icons, low-poly model renderer,
                      vault chest scene, thumbnails, generated models
  ui/                 HUD, game menu, onboarding, vault journal and mission notebook,
                      reveal and deposit scenes, backpack, tomb gate, artifact sketches,
                      tooltips, particles, procedural audio, haptics
  i18n/               en / pl strings
gallery/              the artifact gallery and the Fokker test page, outside the game
tests/                node --test unit tests
docs/                 game design document, mission list and implementation plan (Polish)
```

## Credits

- Code and art (SVG ink drawings, low-poly models, shaders, synthesized sound) by Jakub W. Adamczyk.
- Fonts, licensed under the [SIL Open Font License 1.1](https://openfontlicense.org) (licence texts in `assets/fonts/`):
  - [Cinzel](https://github.com/NDISCOVER/Cinzel) and Cinzel Decorative by Natanael Gama;
  - [EB Garamond](https://github.com/octaviopardo/EBGaramond12) by Georg Duffner and Octavio Pardo.

The adventure-film mood is an homage to the genre. Reliq has no connection to any film franchise.

## License

Code: [MIT](LICENSE) © 2026 Jakub W. Adamczyk. Fonts keep their own OFL licences.
