# Reliq — Game Design Document

## Wizja

### W jednym zdaniu

Reliq zamienia zwykły spacer w wyprawę poszukiwacza skarbów: twoja okolica staje się starą mapą, każdy postój może odsłonić monetę sprzed wieków, a dłuższa wędrówka prowadzi do zapomnianego grobowca.

### Opis

Wychodzisz z domu i nie jesteś już na swojej ulicy, tylko na skraju nieznanego lądu. Telefon pokazuje mapę wyrysowaną sepią na pergaminie: góry, lasy i równiny, a na nich czerwoną kreskę twojej trasy. Ulice zniknęły. Zostały kierunki, odległości i pytanie, co leży za następnym wzgórzem.

Gdzie się zatrzymasz, tam możesz kopać. Najczęściej wykopiesz śmieci: zawleczkę od puszki, skasowany bilet, baterię rozładowaną jak twoje nadzieje. Ale co trzecie przeszukanie daje monetę: rzymskiego denara, chińską Kaiyuan Tongbao, wenecki dukat. Każda ma krótką historię prawdziwego pieniądza, a gdzieś na dnie losowania czeka aureus, którym Brutus uczcił Idy marcowe. Przeszukany teren zostaje zaznaczony na mapie, więc żeby kopać dalej, trzeba iść dalej.

Prawdziwa przygoda zaczyna się od misji. Każda opowiada o jednym przedmiocie, na przykład o skromnym kubku mnicha, którym wzgardzili łupieżcy, i dlatego przetrwał. Żeby go odnaleźć, trzeba się oddalić: trzy odcinki wędrówki dają trzy symbole klucza, czwarty odsłania grobowiec. Jego wrota otworzysz tylko na miejscu, ustawiając pierścienie z symbolami we właściwej kolejności. Misję przejdziesz jednym długim spacerem albo rozłożysz na tydzień.

Łup trzeba jeszcze donieść do domu. Monety i artefakt niesiesz w sakwie, a gdy wrócisz do skarbca, skrzynia otwiera się w blasku i przyjmuje wszystko, co znalazłeś, sztuka po sztuce. Artefakty stają na półce jako kanciaste modele 3D, które można obracać w palcach. Nadwyżkę monet kupi paser, a u niego da się też odkupić artefakt z misji, która przepadła.

Reliq nie każe biec ani bić rekordów. Nagradza ciekawość i nogi: kopać można tylko na piechotę, więc samochód nic tu nie da. Docelowo około 60 misji to rok wypraw zaczynających się od własnych drzwi.

## Podstawy

Reliq to gra - aplikacja grywalizująca poruszanie się po okolicy. Gracz wciela się w poszukiwacza skarbów.

Gra jest zwykłą stroną internetową napisaną w vanilla html/css/js i z opcją instalacji jako PWA.

Gra udostępnia 2 wersje językowe: angielską i polską.

Gracz na początku gry zakłada lokację „Skarbiec” (Vault) w miejscu, z którego zwykle zaczyna spacery. Gracz ma tylko jeden skarbiec. Skarbiec ma promień 100 metrów. Gracz nie może przeszukiwać terenu, nie posiadając skarbca. Na razie skarbca nie można przenosić.

## Mapa

Mapa gry jest mapą fikcyjną nałożoną na realne koordynaty GPS. Wygląda jak stary pergamin z ikonami gór, lasów i równin. Technicznie rzecz biorąc biomy to tylko dekoracja. Nie ma na niej zaznaczonych jezior, rzek ani mórz/oceanów.

## Szukanie skarbów

Gracz, będąc w odległości co najmniej 100 metrów od skarbca, może kliknąć „Szukaj skarbu” — medalion z łopatą na dole ekranu.

Przeszukany obszar to 2D metaball o nominalnym promieniu 100 m ze środkiem w miejscu przeszukiwania. Przeszukane obszary płynnie się ze sobą łączą (jak to metaballe).

Ponownie szukać można, będąc poza metaballami i poza skarbcem. Granicą metaballi jest dokładnie ta krawędź, którą pokazuje mapa (to, co widzi gracz, jest tym, co liczy gra).

Przeszukane obszary znikają po 6 godzinach.

Przeszukiwanie jest niemożliwe, jeśli gracz porusza się ze średnią prędkością z ostatnich 20 sekund większą niż 10 km/h.

Przeszukiwanie jest niemożliwe, jeśli błąd pozycji GPS jest większy niż 50 m.

Gracz ma 65% szans na znalezienie losowego śmiecia i 35% szans na znalezienie skarbu — monety. W trakcie misji przeszukanie może zamiast tego dać symbol klucza albo odkryć grobowiec (zob. „Misje”).

Śmieci znikają zaraz po znalezieniu. Monety trafiają do sakwy i gracz zanosi je do skarbca (zob. „Sakwa i skarbiec”).

**Lista śmieci (65% prawdopodobieństwa):**

- Grosz. Jedyna moneta, której nikt nie chce. Nawet ty.
  - EN: Penny. The only coin nobody wants. Not even you.
- Zawleczka od puszki. Najczęściej znajdowany „metal” w historii poszukiwań.
  - EN: Can pull tab. The most frequently found “metal” in the history of treasure hunting.
- Skasowany bilet. Ktoś dojechał. Ty nie.
  - EN: Used ticket. Someone got there. You didn't.
- Zapalniczka bez gazu. Ostatni ogień zgasł dawno temu.
  - EN: Empty lighter. Its last flame died long ago.
- Bateria AA. Rozładowana, jak twoje nadzieje.
  - EN: AA battery. Drained, like your hopes.
- Spinacz biurowy. Trzymał kiedyś coś ważnego. Teraz nic.
  - EN: Paper clip. It once held something important. Now it holds nothing.
- Kolczyk bez pary. Złoty? Nie. Pozłacany? Też nie.
  - EN: Lone earring. Gold? No. Gold-plated? Also no.
- Gumka recepturka. Wciąż elastyczna, bo to wieczny materiał.
  - EN: Rubber band. Still stretchy, because some materials are forever.
- Nakrętka od butelki. Plastik przetrwa nas wszystkich.
  - EN: Bottle cap. Plastic will outlive us all.
- Wyblakły paragon. Ktoś kupił chleb. Data nieczytelna.
  - EN: Faded receipt. Someone bought bread. The date is illegible.

**Lista monet (35% prawdopodobieństwa):**

Common (75% szans)

1. Nummus rzymski. Rzym bił je jak dziś grosze. Ktoś zgubił, ty znalazłeś, tylko 1600 lat później.
   - EN: Roman nummus. Rome minted them like pocket change. Someone lost it, you found it, just 1,600 years later.
2. Kaiyuan Tongbao. Nawlekano je na sznurki po tysiąc sztuk. Ta jedna się wymknęła.
   - EN: Kaiyuan Tongbao. They were strung on cords a thousand at a time. This one slipped away.

Uncommon (20% szans)

3. Denar rzymski. Mniej więcej dniówka robotnika. Ty zarobiłeś ją spacerem.
   - EN: Roman denarius. Roughly a laborer's daily wage. You earned it with a walk.
4. Hiszpańskie 8 reali. Gdy brakowało drobnych, cięto je na kawałki. Ta jest cała.
   - EN: Spanish piece of eight. When small change ran short, they were cut into pieces. This one is whole.
5. Tetradrachma ateńska. „Wozić sowy do Aten” mówili Grecy o czymś zbędnym. Ta sowa zbędna nie jest.
   - EN: Athenian tetradrachm. “Bringing owls to Athens,” the Greeks said of anything pointless. This owl is anything but.

Rare (4% szans)

6. Dukat wenecki. Doża klęczy przed świętym Markiem. Bity przez pięć wieków, aż Napoleon zakończył Republikę.
   - EN: Venetian ducat. The Doge kneels before Saint Mark. Minted for five centuries, until Napoleon ended the Republic.
7. Solidus bizantyjski. Konstantyn ustalił jego wagę, a Bizancjum dotrzymało słowa przez siedem stuleci.
   - EN: Byzantine solidus. Constantine fixed its weight, and Byzantium kept its word for seven centuries.
8. Dublon hiszpański. Galeony wiozły je przez Atlantyk tonami. Ten jakimś cudem trafił tutaj.
   - EN: Spanish doubloon. Galleons carried them across the Atlantic by the ton. Somehow this one ended up here.

Legendary (1% szans)

9. Stater lidyjski. Z krainy Krezusa. Lew na awersie strzeże jednej z pierwszych monet w dziejach ludzkości.
   - EN: Lydian stater. From the land of Croesus. The lion on its face guards one of the first coins in human history.
10. Aureus EID MAR. Brutus wybił go, by uczcić Idy marcowe. Przetrwała garstka. Jedna jest teraz twoja.
    - EN: EID MAR aureus. Brutus struck it to celebrate the Ides of March. Only a handful survive. One of them is now yours.

## Misje

Misje prowadzą do grobowców z unikalnymi artefaktami. Gracz ma najwyżej jedną aktywną misję. Misje idą w ustalonej kolejności. Ich lista z tytułami, lore i dystansami jest w `docs/lista-misji.md`. Docelowo ma ich być około 60, żeby starczyły na rok gry.

### Karta misji

Gdy gracz nie ma aktywnej misji, w skarbcu, na zakładce „Misje”, pojawia się następna misja:

- tytuł, np. „Znajdź Kubek Brata Odona”;
- szkic artefaktu tuszem (SVG narysowane na podstawie modelu 3D);
- zdanie lore;
- drobne ostrzeżenie: „4 etapy: 3 symbole i grobowiec. Przejdziesz je jednym spacerem albo rozłożysz na 7 dni.”;
- przycisk „Rozpocznij misję”.

Model 3D nie jest pokazywany przed zdobyciem artefaktu — jest nagrodą reprezentującą prawdziwy przedmiot.

Rozpoczęcie misji czyści wszystkie przeszukane obszary, tak jakby minęło 6 godzin, i uruchamia limit czasu.

### Przebieg misji

Misja ma 4 etapy: trzy symbole klucza, a potem grobowiec. Sprawny piechur przejdzie je jednym spacerem; można je też rozłożyć w czasie, w granicach limitu misji.

**Dystans etapu.** Każda misja podaje dwa dystanse: na symbol i na grobowiec (np. 400 m i 800 m). Dystans liczy się w linii prostej od punktu startu etapu do miejsca przeszukania:

- punktem startu jest pierwsze przeszukanie w danym etapie;
- jeśli ten obszar wygaśnie (po 6 godzinach), punktem startu staje się najstarsze aktywne przeszukanie z tego etapu, a jeśli takiego nie ma — następne przeszukanie.

**Symbol.** Przeszukanie wykonane co najmniej w dystansie symbolu od punktu startu zawsze daje symbol klucza zamiast zwykłego znaleziska (śmiecia lub monety). Jest to zawsze symbol, którego gracz jeszcze nie ma. Gra nie zdradza, na którym pierścieniu leży.

**Kolejny etap.** Zaczyna się od razu, bez przerwy: przeszukanie, które dało symbol, jest punktem startu następnego etapu. Karta symbolu podpowiada, ile trzeba przejść dalej („Szukasz dalej? Odejdź stąd 450 m.”). Szybkość nie jest sprawdzana poza zwykłym limitem 10 km/h przy szukaniu — kto podjeżdża samochodem, oszukuje tylko siebie.

**Grobowiec.** Po trzecim symbolu zaczyna się ostatni, najdłuższy spacer. Przeszukanie wykonane co najmniej w dystansie grobowca od punktu startu odkrywa grobowiec zamiast zwykłego znaleziska. Grobowiec powstaje dokładnie w miejscu przeszukania i zostaje na mapie na stałe jako ikona. Musi leżeć co najmniej 200 m od innych grobowców — jeśli leżałby bliżej, przeszukanie przebiega normalnie.

Wszystkie przeszukania misji podlegają tym samym zasadom co zwykłe szukanie: poza przeszukanym terenem i skarbcem, prędkość, dokładność GPS. Każde tworzy obszar jak zwykle.

Misja kończy się sukcesem po otwarciu wrót grobowca (zob. „Wrota i klucz”). Artefakt trafia do sakwy. Następną misję można rozpocząć dopiero wtedy, gdy artefakt zostanie złożony w skarbcu — karta następnej misji jest widoczna, ale przycisk „Rozpocznij misję” czeka.

### Limit czasu i porzucenie

Misja ma limit 7 dni od rozpoczęcia. Liczy się otwarcie wrót, nie samo odkrycie grobowca.

Jeśli limit minie, misja przepada, a z nią grobowiec (jeśli był już odkryty) i artefakt. Gracz może też sam porzucić misję przyciskiem „Porzuć misję” — skutek jest taki sam.

Utracony artefakt pojawia się u pasera 7 dni po utracie misji. Następna misja jest dostępna od razu.

Po ostatniej misji karta pokazuje „Wkrótce nowe wyprawy”.

### Wrota i klucz

Grobowiec jest zamknięty wrotami z kluczem kołowym z 3 pierścieni. Każdy pierścień ma ten sam zestaw 8 symboli:

| PL       | EN     |
|----------|--------|
| Ryba     | Fish   |
| Pająk    | Spider |
| Mucha    | Fly    |
| Żółw     | Turtle |
| Ptak     | Bird   |
| Człowiek | Man    |
| Kot      | Cat    |
| Wąż      | Snake  |

Każdy grobowiec ma własny klucz: 3 różne symbole w ustalonej kolejności, np. Ryba–Ptak–Mucha. Gracz ustawia pierścienie tak, żeby symbole zgadzały się w odpowiedniej kolejności.

Wrota otwiera się na miejscu — gracz musi być w promieniu 100 m od grobowca. Liczba prób jest nieograniczona, a zły układ nie ma żadnych konsekwencji poza tym, że wrota się nie otwierają. Grobowiec pozostaje zamknięty, dopóki gracz nie ustawi klucza.

Po otwarciu wrót gracz otrzymuje zamknięty w grobowcu artefakt.

## Sakwa i skarbiec

Gracz nosi znaleziska w sakwie: monety i artefakt z otwartego grobowca. Symbole do sakwy nie trafiają — należą do misji. Po zamknięciu okna znaleziska moneta wlatuje do przycisku sakwy na mapie (symbol — do przycisku misji). Przycisk sakwy pokazuje liczbę niesionych znalezisk, a wskaźnik kierunku do skarbca pulsuje. Stuknięcie w sakwę otwiera kartę z jej zawartością (artefakt, monety z liczbą sztuk) i odległością do skarbca.

Gdy gracz wejdzie w promień skarbca (100 m) z czymś w sakwie, cała zawartość zostaje złożona w skarbcu. Limit GPS jest łagodniejszy niż przy szukaniu: dokładność do 100 m, bo skarbiec to zwykle dom, a w budynku sygnał słabnie. Prędkość nie ma znaczenia.

Złożenie to osobny moment nagrody — scena „Powrót do skarbca”: skrzynia skarbca spada i otwiera się w blasku, monety wpadają do niej jedna po drugiej (od pospolitych do najrzadszych, nowe z napisem „Nowość”), artefakt zawisa nad skrzynią z nazwą i wpada do niej na koniec, wieko się zatrzaskuje. Podsumowanie pokazuje, co złożono. Dotknięcie ekranu przyspiesza scenę.

Zawartość sakwy nigdy nie przepada. Monety w sakwie nie liczą się jeszcze do kolekcji i paser ich nie kupi, dopóki nie trafią do skarbca.

## Półka z artefaktami

Artefakty złożone w skarbcu stoją na półce, po 3 w rzędzie. Artefakt, który jest jeszcze w sakwie, widać na półce wyblakły, z dopiskiem „w sakwie”. Półka stoi na zakładce „Kolekcja”, nad monetami. Stuknięcie w artefakt pokazuje go w 3D z możliwością obracania, razem z nazwą i lore. Nieodkryte jeszcze miejsca na półce są puste.

## Paser

Paser to czarny rynek w skarbcu, na osobnej zakładce „Paser”. Waluta nie ma nazwy — w interfejsie to po prostu „Pieniądze” (Money) i „Cena” (Price) z liczbą.

**Sprzedaż monet.** Gracz sprzedaje monety ze skarbca (nie z sakwy) po jednej sztuce. Sprzedana moneta znika z kolekcji (licznik spada o 1). Sprzedaż ostatniej sztuki wymaga potwierdzenia, bo moneta znika wtedy z kolekcji.

| Rzadkość     | Cena |
|--------------|------|
| Pospolita    | 1    |
| Niepospolita | 5    |
| Rzadka       | 20   |
| Legendarna   | 100  |

Przy szansach z „Szukania skarbów” jedno przeszukanie jest średnio warte około 1,24.

**Kupno artefaktów.** U pasera można kupić tylko artefakty z utraconych misji, 7 dni po ich utracie. Kupiony artefakt trafia od razu na półkę — paser jest w skarbcu, więc nie trzeba go nieść. Cenę artefaktu podaje każda misja w `docs/lista-misji.md`.

## Słownik UI (PL / EN)

| PL                      | EN                  |
|-------------------------|---------------------|
| Skarbiec                | Vault               |
| Szukaj skarbu           | Search for treasure |
| Misja                   | Mission             |
| Rozpocznij misję        | Start mission       |
| Porzuć misję            | Abandon mission     |
| Wkrótce nowe wyprawy    | New expeditions soon |
| Grobowiec               | Tomb                |
| Wrota                   | Gate                |
| Otwórz wrota            | Open the gate       |
| Symbol                  | Shard               |
| Artefakt                | Artifact            |
| Sakwa                   | Satchel             |
| Powrót do skarbca       | Back at the vault   |
| Kolekcja                | Hoard               |
| Misje (zakładka)        | Missions            |
| Półka z artefaktami     | Artifact shelf      |
| Paser                   | Fence               |
| Pieniądze               | Money               |
| Cena                    | Price               |
| Przeszukany obszar      | Searched area       |
| Śmieć                   | Junk                |
| Moneta                  | Coin                |
| Pospolita               | Common              |
| Niepospolita            | Uncommon            |
| Rzadka                  | Rare                |
| Legendarna              | Legendary           |
