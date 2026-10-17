# Reliq — plan implementacji

## 0. Założenia techniczne

- **Zero zależności i zero build stepu.** Natywne ES modules, WebGL2, Web Audio, CSS. Gra działa z dowolnego statycznego hostingu.
- **Logika oddzielona od renderingu.** Reguły gry to czyste moduły bez DOM, testowane `node --test` (Node 24 jest zainstalowany).
- **Pełny offline.** Mapa jest fikcyjna, więc nie potrzebuje kafelków z sieci. Po pierwszym wczytaniu cała gra działa bez internetu.
- **Środowisko dev:** desktop ze statycznym serwerem lokalnym i symulatorem GPS. Wersje do testów w terenie trafiają na hosting z HTTPS (GitHub Pages), bo geolokalizacja na telefonie wymaga bezpiecznego kontekstu.

**Decyzje:**
- Monety, śmieci, artefakty i skrzynia skarbca to ręcznie modelowane siatki low-poly (`scripts/blender/`). Szkice, ikony terenu i grafika interfejsu to SVG rysowane tuszem.
- Mapa jest płaska, widziana z góry, bez perspektywy 3D.
- Dodatki, które weszły: dźwięk i haptyka, kompas (obraca igłę gracza). Czerwona linia trasy i róża wiatrów były, ale zostały usunięte.

## 1. Kierunek artystyczny — „Dziennik ekspedycji”

Inspiracja: kino przygodowe w stylu lat 30. Bez elementów chronionych: żadnych nazw, postaci, muzyki ani logotypów z filmów.

**Scena.** Płaska mapa widziana z góry wypełnia ekran. Pergamin ma fakturę i lekką winietę na brzegach. UI wygląda jak oprawa dziennika ekspedycji.

**Paleta.**

| Rola         | Kolor             |
|--------------|-------------------|
| Pergamin     | #e8d5a9 → #c9a66b |
| Tusz / sepia | #3b2414           |
| Czerwień     | #8b1e1e           |
| Mosiądz      | #c8973a           |
| Skóra        | #2a1a10           |

Czerwień służy do tras i akcentów.

**Typografia.**
- Nagłówki: Cinzel, krój inskrypcyjny.
- Tekst: serif drukarski, IM Fell albo EB Garamond.
- Notatki na mapach: pismo odręczne.
- Fonty są hostowane lokalnie, bo gra ma działać offline. Każdy trzeba sprawdzić pod kątem polskich znaków.

**Materiały UI.** Skóra z przeszyciami, mosiężne medaliony, papier z rwanymi krawędziami, pieczęcie lakowe.

**Ruch.**
- Każda zmiana stanu jest animowana: atrament się rozlewa, zwój rozwija, pieczęć odciska.
- Cel to 60 fps.
- Gra respektuje `prefers-reduced-motion`.

**Dźwięk i haptyka.**
- Dźwięki są syntezowane w Web Audio: kopanie, brzęk monet, szelest papieru, akord przy rzadkich znaleziskach.
- Wibracje działają tylko na Androidzie.

### Warstwy mapy (od spodu)

1. **Pergamin.** Proceduralny shader z włóknami, plamami, przetarciami i liniami zgięć.
2. **Biomy.** Deterministyczny szum liczony z absolutnych współrzędnych, więc to samo miejsce zawsze wygląda tak samo. Na nim ikony gór, lasów i równin rysowane tuszem (SVG wypalane do atlasu tekstur). Rozmieszczenie ikon jest deterministyczne, z LOD zależnym od zoomu.
3. **Siatka.** Siatka współrzędnych jak na starych mapach, z podpisami stopni, i łacińskie nazwy krain.
4. **Skarbiec.** Pieczęć lakowa i przerywany okrąg o promieniu 100 m.
5. **Przeszukane obszary (metaballe).**
   - Wnętrze jest lawowane tuszem, a krawędź to linia tuszu.
   - Nowy obszar rozlewa się animacją.
   - Starszy obszar blednie, ale jego kształt się nie zmienia. Granica jest zawsze dokładnie tą, którą liczy gra.
6. **Strefa misji.** Okrąg dystansu etapu i celownik w punkcie startu etapu.
7. **Grobowce.** Rysunek wrót grobowca; stuknięcie pokazuje dymek z numerem. Zamknięty grobowiec aktywnej misji pulsuje.
8. **Gracz.** Mosiężna igła kompasu, która obraca się zgodnie z kierunkiem telefonu. Bez danych z kompasu pokazuje kierunek ruchu. Dokładność GPS pokazuje okrąg rysowany jakby ołówkiem.
9. **Post-processing.** Color grading, miękka winieta i ziarno filmowe.

### Kluczowe momenty

**Onboarding.** List wprowadzający, 4 strony zasad ze szkicami i strona o lokalizacji, potem założenie skarbca przez odciśnięcie pieczęci na mapie.

**Szukanie skarbu.** Kopanie (pył, wstrząs, haptyka), potem atrament rozlewa się w nowy obszar, a na końcu odsłania się znalezisko.

**Pozy modeli.** Na spacerze modele stoją nieruchomo pod kątem z `restingView()` (`js/render/views.js`, z wyjątkami dla długich i płaskich przedmiotów); tak samo ustawione są miniatury. Palcem obraca się je tylko w skarbcu (`turnable` w `Reveal`).

**Badanie artefaktów.** W skarbcu obracanie artefaktu odkrywa jego 3 detale po kolei (`Examination` w `js/game/examine.js`, liczby w `RULES.examine`, postęp w `examined` przy artefakcie, `game.examineArtifact(n)`). Podgląd pokazuje nazwę, odkryte detale i pasek postępu; liczy się tylko czas, gdy palec trzyma model.

**Śmieć.** Model low-poly spada z odbiciem przy komicznym „tu-tu-tuuuu”, a „Do kosza” odrzuca go w dal.

**Moneta.**
- Moneta low-poly z płaskim cieniowaniem i odblaskiem wyskakuje i stoi nieruchomo w trzech czwartych. Po zamknięciu wlatuje do plecaka.
- Oprawa zależy od rzadkości:

| Rzadkość  | Oprawa                                                          |
|-----------|-----------------------------------------------------------------|
| Common    | brąz                                                            |
| Uncommon  | srebro                                                          |
| Rare      | złoto i poświata                                                |
| Legendary | promienie światła, iskry, mocny akcent dźwiękowy i haptyczny    |

**Symbol klucza.** Papierowa karta ze skorupą, na której namalowano symbol. „Zanotuj” posyła ją do przycisku misji.

**Grobowiec.** Dłuższe kopanie, wstrząs, wrota wbite w mapę i karta „Odkrycie” ze szkicem wrót. „Otwórz grobowiec” prowadzi od razu do wrót, krzyżyk odkłada to na później.

**Wrota.** Trzy pierścienie z symbolami obraca się palcem. Po otwarciu artefakt 3D wychodzi z fanfarą i trafia do plecaka.

**Powrót do skarbca.** Scena 3D: skrzynia otwiera się w blasku, monety wpadają po kolei, artefakt na końcu, wieko się zatrzaskuje.

**Skarbiec (dziennik).**
- Cztery zakładki: Notatnik (misje), Monety, Artefakty, Paser.
- Nieznalezione monety i artefakty mają postać pustych miejsc ze znakiem zapytania.
- Przy każdej monecie jest licznik sztuk.

**Przycisk akcji (mosiężny medalion).** Zawsze pokazuje, dlaczego jest nieaktywny:
- „Ustalanie pozycji…”
- „Słaby sygnał GPS (±72 m)”
- „Zwolnij — za szybko”
- „Za blisko skarbca”
- „Ten teren już przeszukany”

## 2. Architektura

```
index.html
manifest.webmanifest
sw.js             generowany przez scripts/build-sw.mjs
css/              app.css (mapa, HUD, znaleziska, skarbiec), screens.css (onboarding,
                  dziennik, menu, toast), fonts.css
assets/           fonts/, icons/ (ikony aplikacji)
js/
  main.js         bootstrap, pętla klatek, spięcie wszystkiego
  version.js      wersja wydania (nazwa cache offline)
  demo.js         gotowy świat demo dla panelu ⚙
  i18n/           pl.js, en.js, i18n.js
  core/           geo.js, noise.js, rng.js, clock.js, store.js, wakelock.js
  game/           rules.js (liczby z GDD, poziomy i misje), items.js, loot.js,
                  field.js (metaballe), state.js (kształt zapisu, migracje),
                  game.js (akcje i stan)
  gps/            geolocation.js, simulator.js, filter.js (Kalman),
                  location.js (okno prędkości), compass.js
  render/         gl.js, camera.js, map-renderer.js, base-cache.js, terrain.js,
                  atlas.js, icons.js, regions.js, shaders/map.js,
                  artifact3d.js, artifact-thumbs.js, vault-scene.js,
                  models/ (generowane przez skrypty Blendera)
  ui/             hud.js, map-ui.js, menu.js, onboarding.js, journal.js, notebook.js,
                  reveal.js, satchel.js, deposit.js, gate.js, toast.js, scale-bar.js,
                  particles.js, audio.js, haptics.js, grafika: art.js,
                  onboarding-art.js, gate-art.js, artifact-sketch.js
scripts/          serwer dev, build-sw, ikony; blender/ (modele low-poly)
gallery/          galeria artefaktów poza grą
tests/            *.test.js (node --test)
```

## 3. Kluczowe algorytmy

**Projekcja.**
- Lokalny układ w metrach względem skarbca (equirectangular). Na kilkunastu kilometrach jest dokładny.
- GPU dostaje tylko współrzędne względne, co pozwala uniknąć problemów z precyzją float32.

**Metaballe.**
- Pole: f(p) = Σ k(|p − cᵢ|).
- Jądro ma skończony zasięg: k(d) = (1 − (d/200)²)² dla d < 200 m, a poza nim 0.
- Próg: T = k(100) = 0,5625. Dzięki temu pojedynczy obszar ma dokładnie 100 m promienia. Bliskie obszary płynnie się łączą, a dalekie nie wpływają na siebie.
- Ta sama funkcja działa w JS (warunek „poza metaballami”) i w shaderze (rysowanie krawędzi). Gracz widzi dokładnie to, co liczy gra.

**Prędkość.**
- Liczona jako przesunięcie między najstarszą a najnowszą próbką z ostatnich 20 s, podzielone przez czas.
- Suma odcinków odpada, bo drgania GPS na stojąco potrafią ją zawyżyć ponad 10 km/h.
- Potrzebne jest ≥ 15 s historii. Do tego czasu przycisk pokazuje „Ustalanie pozycji…”.

**Misje.** Poziomy (`TIERS`) i misje (`MISSIONS`) są w `js/game/rules.js`, z `docs/lista-misji.md`. `missionDef(artifact)` daje dystanse i cenę u pasera.

**Wynik przeszukania** (`rollLoot` w `game.js`):
1. Etap symbolu i przeszukanie co najmniej w dystansie symbolu od startu etapu: nowy symbol klucza.
2. Ostatni etap i przeszukanie co najmniej w dystansie grobowca: grobowiec. Otwarte grobowce znikają z mapy i nie blokują nowych.
3. W przeciwnym razie zwykłe losowanie: 65% śmieć, 35% moneta.
- Start etapu (`stageStart`) to najstarsze aktywne przeszukanie z tego etapu. Etap jest oceniany, zanim liczy się obszar bieżącego przeszukania.
- Klucz (3 różne symbole z 8) jest losowany przy rozpoczęciu misji i zapisywany w stanie.

**Losowanie.** `crypto.getRandomValues`. Kolejność misji w poziomie tasuje ziarno `state.seed`, losowane przy zakładaniu skarbca.

**Wygasanie.** Przeszukania starsze niż 6 h są usuwane przy każdym odczycie stanu.

## 4. Stan i zapis

Stan jest zapisywany w localStorage jako wersjonowany JSON. Dodatkowo `navigator.storage.persist()` zmniejsza ryzyko, że przeglądarka skasuje dane.

**Migracje** (`js/game/state.js`): gdy zmienia się kształt zapisu, `SAVE_VERSION` idzie w górę, a do `MIGRATIONS` dochodzi krok ze starej wersji do nowej. Kroki działają na surowym JSON-ie, jeden po drugim (v4 → v5 → v6…), a dopiero potem zapis przechodzi walidację. Zapis sprzed migracji zostaje nietknięty pod `reliq.save.v<stara wersja>`. Test pilnuje, żeby każda czytana wersja miała swój krok. Zapisy starsze niż `OLDEST_SAVE_VERSION` (sprzed pierwszego wydania, dziś v1–v3) i zapisy z nowszej gry trafiają pod `reliq.save.unreadable`, a gra startuje od nowa. Na razie `MIGRATIONS` jest puste: v4 to pierwsza wersja, którą będziemy przenosić.

Zapis obsługuje `js/core/store.js`, a kształt stanu, walidację i migracje `js/game/state.js`. Nieczytelny zapis nie przepada: trafia pod klucz `reliq.save.unreadable`, a gra startuje od nowa.

```js
{
  v: 4,
  createdAt,
  vault: { lat, lon, t } | null,
  seed,                                 // tasuje misje w poziomie; losowane przy zakładaniu skarbca
  searches: [{ lat, lon, t }],          // tylko aktywne (< 6 h)
  coins: { [coinId]: count },           // w skarbcu
  satchel: { coins: { [coinId]: count }, artifacts: [{ id, n, t, from }] },  // plecak
  money,                                // ze sprzedaży monet paserowi
  mission: { n, artifact, t, key: [s1, s2, s3], shards: [symbol], stageAt } | null,  // stageAt: początek bieżącego etapu
  tombs: [{ n, lat, lon, t, opened, artifact }],   // zamknięty tylko grobowiec aktywnej misji
  artifacts: [{ id, n, t, from: 'tomb' | 'fence' }],  // artefakty w skarbcu
  lost: [{ n, artifact, t }],           // utracone misje; paser sprzedaje ich artefakty
  settings: { lang, sound, haptics, keepAwake, quality }
}
```

## 5. Etapy

| Etap | Zakres |
|------|--------|
| **E1 Prototyp wyglądu** | Pionowy wycinek: mapa z biomami, gracz, skarbiec, kilka metaballi, przycisk akcji i jedno odsłonięcie monety. **Wygląd akceptujesz, zanim ruszę dalej.** |
| E2 Logika + testy | geo, pole metaballi, losowanie, grobowce, wygasanie, zapis |
| E3 GPS + symulator | Na desktopie: sterowanie graczem (WASD lub przeciąganie), przyspieszanie czasu, wymuszanie wyniku losowania, panel debug |
| E4 Pełny renderer mapy | Kamera, gesty (przesuwanie, pinch, recenter), LOD, wszystkie warstwy |
| E5 Przepływy gry | Onboarding, szukanie, odsłonięcia, zwój mapy, szukanie grobowca, kolekcja, ustawienia (język, dźwięk, jakość) |
| E6 Juice | Dźwięk, haptyka, cząsteczki, przejścia, dopracowanie |
| E7 PWA | Manifest, service worker (offline), ikony, instalacja |
| E8 Testy na urządzeniach | iOS Safari, Android Chrome, wydajność, bateria. Trwają spacery testowe. |
| E9 Mapy za monety i wrota | Kupno map za monety, odkrywanie grobowca przyciskiem szukania, symbole klucza, zamek z 3 pierścieni przy grobowcu, artefakty low-poly 3D, migracja zapisu |
| E10 Misje | Misje zamiast kupowania map: karta misji ze szkicem, etapy z dystansem od punktu startu (jeden po drugim, bez przerw), limit 7 dni, półka z artefaktami, paser (sprzedaż monet, kupno utraconych artefaktów). Twardy reset zapisu. |

### Uruchamianie (dev)

```
node scripts/serve.mjs 8137
```

Serwer wyłącza cache przeglądarki (`Cache-Control: no-store`). Serwer Pythona pozwalał przeglądarce trzymać stare wersje modułów ES.

Potem w przeglądarce otwórz `http://127.0.0.1:8137/`.

- `?inspect=2` renderuje z gęstością 2× i powiększa widok. Przydaje się do oceny detali na ekranie bez retiny.
- Panel testowy (⚙) pozwala ustawić następne znalezisko, dokładność GPS, przyspieszenie marszu i przesunięcie czasu.
- Sterowanie symulatorem: WASD / strzałki to marsz, Shift to bieg.

Testy: `node --test` (albo `npm test`).

Statusy etapów poniżej to zapis historii: opisują stan z chwili zamknięcia etapu, a część rzeczy (mapy grobowców, zwój, reliefy monet, trasa) później zniknęła. Obecny stan opisują rozdziały 0–4, GDD i `changelogs.md`.

**Status E1:** zaakceptowany.


**Status E2:** gotowy.
- Logika gry: `js/game/game.js`, `loot.js`, `state.js`. Zapis: `js/core/store.js`.
- 46 testów jednostkowych w `tests/`.
- Wzory wszystkich 10 monet, szkice wszystkich 10 śmieci, karta i zwój mapy do grobowca.
- Do czasu onboardingu (E5) gra bez zapisu startuje ze światem demo. W panelu ⚙ przycisk „Nowy świat demo” go resetuje.

**Status E3:** gotowy (testy na telefonie czekają na hosting).
- **Źródła pozycji:**
  - `js/gps/geolocation.js`: prawdziwy GPS, obsługa zgody, braku sygnału i wymogu HTTPS;
  - `js/gps/simulator.js`: dwuklik = idź tam, Ctrl + dwuklik = teleport, realistyczny szum, wyłączanie sygnału.
- **Tryb:** domyślnie symulator na localhost, a gdzie indziej prawdziwy GPS. `?gps=sim|real` i panel ⚙ przełączają tryb, a wybór jest zapamiętany.
- **Wygładzanie:** `js/gps/filter.js` to filtr Kalmana. Gracz jest rysowany i oceniany przez reguły w tej samej, wygładzonej pozycji. Prędkość też jest liczona z toru po filtrze, więc skoki wielotorowe nie blokują szukania.
- **Kompas:** `js/gps/compass.js` (iOS: zgoda przy pierwszym dotknięciu). Gdy go brak, kierunek bierze się z kursu GPS albo z ruchu.
- **Ekran:** `js/core/wakelock.js` nie pozwala mu gasnąć w trybie prawdziwego GPS.
- **Powrót z tła:** po ponad 30 s w tle historia prędkości jest zbierana od nowa.
- **Trasa:** dzieli się na odcinki po skoku powyżej 150 m albo przerwie dłuższej niż 10 min.
- **Panel ⚙:** „Świat demo tutaj” przenosi świat demo w miejsce gracza (do testów z prawdziwym GPS).

**Status E4:** gotowy.
- **Kamera** (`js/render/camera.js`):
  - płynny zoom: kółko myszy, dwukrotne stuknięcie przybliża, stuknięcie dwoma palcami oddala;
  - przelot `flyTo`, którego używa „Wyśrodkuj”;
  - gracz jest utrzymywany w środku widocznej części mapy, między paskiem a dokiem.
  - Z myszą w trybie symulatora dwuklik nadal oznacza „idź tam”.
- **Dymki po stuknięciu:** zamknięty grobowiec (z jakiej odległości otworzysz wrota), skarbiec (liczba monet), przeszukany teren (za ile zniknie).
- **Wskaźnik skarbca:** gdy skarbiec jest poza ekranem, przy krawędzi pojawia się wskaźnik z odległością. Stuknięcie przenosi do skarbca.
- **Mapa do grobowca na mapie świata:** pierścień minimalnej odległości od skarbca z podpisem oraz kropkowane strefy 200 m wokół grobowców.
- **Nazwy krain** (`js/render/regions.js`):
  - deterministyczne, po łacinie, z poprawną odmianą przez rodzaje;
  - pojawiają się przy oddaleniu i omijają skarbiec, grobowce i gracza.
- **Podziałka liniowa** (`js/ui/scale-bar.js`).
- **Wydajność:**
  - Pergamin, biomy i ikony terenu są rysowane do tła z zapasem 96 px wokół ekranu. Tło jest przerysowywane dopiero po wyjściu poza zapas albo zmianie zoomu (w marszu raz na ~minutę).
  - Mapa rysuje się w 60 fps przy szybkim ruchu, w 30 fps w marszu i bezczynności, a w 10 fps pod oknem znaleziska.

**Status E5:** gotowy.
- **Onboarding** (`js/ui/onboarding.js`):
  - list od Towarzystwa Odkrywców i 4 strony zasad ze szkicami (skarbiec, poszukiwania, znaleziska, misje), te same co w „O grze”;
  - strona o lokalizacji: prośba o zgodę pada dopiero po stuknięciu, razem z kompasem na iOS.
- **Zakładanie skarbca:** medalion zmienia się w pieczęć z dziurką od klucza, a pieczęć „odciska się” na mapie. Do tego czasu gra używa tymczasowego układu współrzędnych. `setFrame()` przenosi pozycje bez przeładowania strony.
- **Skarbiec / dziennik** (`js/ui/journal.js`):
  - Monety: miniatury renderowane w 3D (`js/render/coin-thumbs.js`), a stuknięcie otwiera podgląd monety z licznikiem.
  - Grobowce: mapa z warunkami na żywo oraz lista odkrytych grobowców z przelotem na mapę.
  - Ustawienia: język, dźwięk, wibracje, wygaszanie ekranu (przy prawdziwym GPS), tryb oszczędny (niższa rozdzielczość i mniej klatek) i „Zacznij od nowa” z potwierdzeniem.
  - O grze: zasady, autor i licencje, wersja.
- **Toast** dla komunikatów: skarbiec założony, mapa w skarbcu.
- **Panel testowy:** tylko na localhost albo z `?debug=1` (zapamiętywane; `?debug=0` wyłącza). „Nowa gra” uruchamia onboarding, „Świat demo” tworzy gotowy świat (`js/demo.js`).

**Status E6:** gotowy.
- Ekran startowy z logo i wahającą się igłą kompasu.
- **Sygnał gotowości:** dzwonek, wibracja i błysk medalionu, gdy znów można szukać (po wyjściu z przeszukanego terenu, ze strefy skarbca albo po zwolnieniu).
- Kropelki atramentu przy rozlewaniu nowego obszaru.
- Ścianki kwadratowego otworu monety Kaiyuan.
- Opcjonalna muzyka generatywna: dron w D i rzadkie szarpane nuty pentatoniki. Usunięta 2026-10-16 razem z opcją w ustawieniach: na głośniku telefonu była prawie niesłyszalna, a w tle i tak milkła. Kto chce muzyki, puści ją z innej aplikacji.

**Status E7:** gotowy.
- **Ikony** (`scripts/make-icons.mjs`) generowane bez zależności: zwykłe, maskowalne, apple-touch i favicon.
- **Manifest:** `manifest.webmanifest`.
- **Service worker:**
  - `sw.js` jest generowany przez `scripts/build-sw.mjs`;
  - cache-first z pełną listą plików, więc gra działa offline (sprawdzone przy wyłączonym serwerze);
  - test `tests/pwa.test.js` pilnuje, żeby `sw.js` był aktualny.
  - Na localhost nie jest rejestrowany, chyba że z `?sw=1`.
- **Instalacja:** przycisk „Zainstaluj grę” w ustawieniach (Chrome/Android) i podpowiedź dla iPhone'a. Po aktualizacji pojawia się toast „Gra została zaktualizowana”.
- **Wydanie wersji:** podbij `VERSION` w `js/version.js` i uruchom `node scripts/build-sw.mjs`.

**Status E8:** gotowe to, co da się zrobić bez telefonu. Testy na urządzeniach trwają: gra jest na hostingu i chodzi się z nią na spacery testowe.
- **Wydajność** (zmierzona timerem GPU; na komputerze przy 720×1280: tło 3,1 ms, klatka z cache 0,6 ms):
  - podczas zoomu tło jest rozciągane z cache, a przerysowywane dopiero po geście (1 przerysowanie zamiast ~11–20 na zoom);
  - poziomy szczegółowości ikon przełączają się natychmiast;
  - nakładka pomija przeszukane obszary poza ekranem.
- **Monety:**
  - reliefy liczą się warstwa po warstwie z oddawaniem wątku, ruszają od razu po wylosowaniu (w trakcie kopania);
  - cache trzyma 3 ostatnie monety zamiast wszystkich (było do ~80 MB, jest ≤ 24 MB);
  - przyciski okna znaleziska są klikalne dopiero, gdy są widoczne.
- **Odporność:**
  - po utracie kontekstu WebGL (częstej na telefonach) mapa i moneta się odbudowują;
  - przeglądarka bez WebGL2 dostaje zrozumiały komunikat zamiast błędu.
- **Testy:**
  - kompletność tłumaczeń (te same klucze, zgodne zmienne, każdy klucz użyty w kodzie istnieje);
  - aktualność `sw.js`;
  - 78 testów.
- **Układ:** sprawdzony na 360×640 (`?inspect=2&w=360&h=640`). Zakładki dziennika mieszczą się na wąskich ekranach.
- **Do zrobienia na telefonie:**
  - prawdziwy GPS w ruchu, kompas, blokada wygaszania;
  - wydajność na słabszym GPU;
  - instalacja PWA na iOS i Androidzie;
  - zachowanie po powrocie z tła.

**Status E9:** gotowy (2026-10-16). To historia: mapy za monety, losowe symbole i losowe grobowce zastąpiły w E10 misje, a monety dostały potem modele low-poly.
- **Decyzje** (szczegóły w GDD, „Mapy i grobowce”):
  - mapy kupuje się za monety (płaci się też ostatnim egzemplarzem), a dawne 5% na mapę przechodzi na monety (65/35);
  - na razie są 4 mapy, a w każdym grobowcu jest artefakt (na razie wszędzie kielich) zamiast monety;
  - grobowiec odkrywa się przyciskiem „Szukaj skarbu” z szansą 20% po spełnieniu warunków, a przycisk „Szukaj grobowca” znika;
  - symbol (10%) zastępuje znalezisko, jest zawsze nowy i przestaje wypadać po trzech;
  - symbol pokazuje się jako papierowa karta ze szkicem, tak jak śmieci;
  - klucz to 3 różne symbole z 8, a wrota otwiera się w promieniu 100 m od grobowca bez limitu prób.
- **Kod:**
  - reguły: `TOMB_MAPS`, `SYMBOLS` i szanse w `rules.js`; `mapOffer`, `buyMap`, `rollLoot`, `openGate` w `game.js`;
  - wrota: `js/ui/gate.js` (obracanie przeciąganiem, stuknięcie przestawia o symbol, próba po każdym zatrzaśnięciu) i grafika `js/ui/gate-art.js` (8 symboli, karta symbolu, szkic wrót);
  - karty symbolu i odkrytego grobowca na ekranie znaleziska, a artefakt 3D z fanfarą po otwarciu wrót (`js/render/artifact3d.js`, model z `scripts/blender/chalice.py`);
  - dziennik: oferta i „Kup mapę”, symbole, lista grobowców z „Obejrzyj”; zwój: warunki albo odległość do grobowca i „Otwórz wrota”; zamknięty grobowiec pulsuje na mapie, a stuknięcie w niego na miejscu otwiera wrota;
  - panel ⚙: wymuszenie symbolu lub grobowca, „+12 Nummus i Kaiyuan”, „Teleport pod wrota”, „Podgląd artefaktu”.
- **Migracja zapisu:**
  - niewykorzystana mapa znaleziona po staremu staje się kupioną mapą z nowo wylosowanym kluczem;
  - istniejące grobowce są otwarte i zachowują swoje monety;
  - jeśli gracz ma już 4 lub więcej grobowców, nie dostaje nowych ofert.

**Plan E10** (zasady w GDD, „Misje”, „Artefakty w skarbcu” (wcześniej „Półka z artefaktami”), „Paser”):
- **Decyzje** (2026-10-16):
  - kupowanie map, losowe symbole (10%) i losowe grobowce (20%) znikają; symbol i grobowiec są pewne po przejściu dystansu etapu;
  - dystans liczy się w linii prostej od pierwszego przeszukania etapu, a po jego wygaśnięciu od najstarszego aktywnego przeszukania z tego etapu (nie od przebytej trasy, bo PWA nie śledzi GPS przy zablokowanym ekranie);
  - następny etap zaczyna się od razu, od przeszukania, które dało symbol (pierwotnie była przerwa 6 h; zniesiona 2026-10-16, bez dodatkowych zabezpieczeń przed oszukiwaniem);
  - limit 10 dni liczy się do otwarcia wrót; porzucenie działa jak przekroczenie limitu; następna misja od razu;
  - waluta pasera bez nazwy: „Pieniądze” / „Cena” z liczbą;
  - po ostatniej misji „Wkrótce nowe wyprawy”; docelowo ~60 misji (rok gry);
  - bez migracji: `SAVE_VERSION` w górę i twardy reset starych zapisów (gra nie była jeszcze testowana w terenie).
- **Kroki:**
  1. ✅ reguły i testy: tabela misji w `rules.js` (z `docs/lista-misji.md`), stan misji, etapy, przerwy, limit, porzucenie, ceny pasera; nowy kształt zapisu;
  2. ✅ karta misji w skarbcu: szkic artefaktu (SVG generowane z siatki modelu), lore, ostrzeżenie, „Rozpocznij misję” / „Porzuć misję”, postęp etapów i odliczanie;
  3. ✅ mapa i zwój: okrąg dystansu i celownik w punkcie startu etapu, etykieta misji przy przycisku (etap, dystans z paskiem, przerwa, odległość do wrót), komunikaty o końcu przerwy i o przejściu dystansu;
  4. ✅ półka z artefaktami (rzędy po 3, podgląd 3D) na zakładce „Kolekcja” (dawne „Monety”); „Grobowce” to teraz „Misje”;
  5. ✅ paser na osobnej zakładce: pieniądze, przepadłe artefakty (szkic, cena albo „dostępny za…”), sprzedaż monet po sztuce z potwierdzeniem ostatniej;
  6. ✅ panel ⚙: „Pomiń przerwę”, „Limit −1 dzień”, „+50 pieniędzy”, „Paser: od razu” (wymuszenie symbolu i grobowca było już w kroku 1); usunięcie resztek po mapach; `VERSION` 0.9.0.

**Status E10:** gotowy (2026-10-16). Do sprawdzenia w terenie: czy dystanse z `docs/lista-misji.md` dobrze się chodzą. Przerwa 6 h między etapami i przycisk „Pomiń przerwę” zostały potem usunięte.

**Po E10 (2026-10-16):** monety są low-poly jak artefakty (`scripts/blender/coins.py`, `COIN_MODELS`), rysowane przez `ArtifactRenderer`. Reliefy z Canvas 2D (`coin-art.js`, `coin3d.js`) zostały usunięte. Medalion szukania ma samą łopatę, bez napisu pod spodem. Licznik obszarów zniknął z górnego paska, a jego miejsce zajął przycisk menu.

**Menu gry** (`js/ui/menu.js`): gra zawsze startuje na stronie tytułowej z „Kontynuuj grę” (przy pierwszym uruchomieniu „Rozpocznij”, który prowadzi do onboardingu), „Ustawienia” i „O grze”, przeniesionymi ze skarbca. Menu niczego nie pauzuje: pod spodem ładuje się mapa i, jeśli skarbiec już jest, rusza GPS, więc menu pokazuje jego stan („GPS gotowy · ±8 m”). Skarbiec ma 4 zakładki: Notatnik, Monety, Artefakty, Paser.

**Później (2026-10-16 – 2026-10-17):**
- **Poziomy misji:** 8 poziomów po 3 misje, wszystkie 24 artefakty mają modele (`docs/lista-misji.md`). Galeria artefaktów w `gallery/`.
- **Notatnik:** karta misji to strona notatnika, a wpisy misji są na zakładce „Notatnik”.
- **Śmieci w 3D** z modelami z `scripts/blender/junk.py`.
- **Onboarding** z 4 stronami zasad (także w „O grze”); liczby w tekstach pochodzą z `RULES`.
- **„Otwórz grobowiec”** na karcie odkrytego grobowca prowadzi od razu do wrót.
- **Migracje zapisu:** szkielet w `state.js` (rozdział 4).

Pełna lista zmian dla graczy jest w `changelogs.md`.

**Plecak (wcześniej „sakwa”) i powrót do skarbca** (2026-10-16): monety i artefakt trafiają do plecaka, a składa się je w promieniu skarbca (GPS do 100 m). Ceremonia to scena 3D: low-poly skrzynia z `scripts/blender/chest.py` (korpus, wieko na zawiasie, stos złota), monety lecące łukiem z brzękiem i iskrami w kolorze rzadkości, artefakt zawisający nad skrzynią, trzask wieka i podsumowanie. Nowa misja dopiero po złożeniu artefaktu. Dźwięki: `clink`, `creak`, `slam`, `latch` w `audio.js`. Panel ⚙: „Plecak: +6 monet”, „Teleport do skarbca”.

### Otwarte kwestie (stan na 2026-10-17)

- **Treść misji.** Są 24 (po 3 na poziom); docelowo ~60, każda z modelem low-poly, szkicem i lore.
- **Testy w terenie.** Lista rzeczy do sprawdzenia jest w statusie E8. Do tego: czy dystanse poziomów dobrze się chodzą.
- **Do rozważenia:** eksport i import zapisu (iOS potrafi skasować dane niezainstalowanej strony) oraz przenoszenie skarbca (GDD: „na razie nie można”).

## 6. Wydajność i bateria

- DPR jest ograniczony do 2. Tryb oszczędny w ustawieniach obniża rozdzielczość i liczbę klatek.
- Pełne 60 fps tylko przy szybkim ruchu mapy. W marszu i spoczynku 30 fps, pod pełnoekranowymi oknami 10 fps, a gdy karta jest w tle, renderowanie się zatrzymuje.
- WebGL2 jest wymagany. Na nieobsługiwanym urządzeniu gra pokazuje czytelny komunikat.

## 7. Założenia (do potwierdzenia w razie wątpliwości)

- Dystans etapu jest oceniany przed dodaniem obszaru z bieżącego szukania.
- Otwieranie wrót wymaga tylko odległości ≤ 100 m od grobowca. Limit prędkości i dokładność GPS go nie dotyczą, poza tym, że pozycja musi być znana.
- Złożenie łupu w skarbcu wymaga dokładności GPS ≤ 100 m (łagodniej niż szukanie, bo w domu sygnał słabnie).
- Śmieci nie są nigdzie liczone.
- Duplikaty monet zwiększają licznik w kolekcji.

## 8. Ograniczenia i ryzyka

- **Grafiki.** Modele są celowo kanciaste (low-poly, płaskie cieniowanie), a szkice i ikony to SVG w stylu ryciny. Są spójne, ale nie malarskie ani fotorealistyczne. Wrażenie „AAA” mają budować przede wszystkim shadery, ruch, typografia i dźwięk.
- **iOS.**
  - Przeglądarka nie daje dostępu do wibracji.
  - Kompas wymaga osobnej zgody użytkownika.
  - Dane niezainstalowanych stron mogą zostać skasowane, dlatego gra zachęca do instalacji PWA.
