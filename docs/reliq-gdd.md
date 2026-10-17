# Reliq — Game Design Document

## Wizja

### W jednym zdaniu

Reliq zamienia zwykły spacer w wyprawę poszukiwacza skarbów: twoja okolica staje się starą mapą, każdy postój może odsłonić monetę sprzed wieków, a dłuższa wędrówka prowadzi do zapomnianego grobowca.

### Opis

Wychodzisz z domu i nie jesteś już na swojej ulicy, tylko na skraju nieznanego lądu. Telefon pokazuje mapę wyrysowaną sepią na pergaminie: góry, lasy i równiny, a na nich czerwoną kreskę twojej trasy. Ulice zniknęły. Zostały kierunki, odległości i pytanie, co leży za następnym wzgórzem.

Gdzie się zatrzymasz, tam możesz kopać. Najczęściej wykopiesz śmieci: zawleczkę od puszki, skasowany bilet, baterię, która ma mniej energii niż ty. Ale co trzecie przeszukanie daje monetę: rzymskiego denara, chińską Kaiyuan Tongbao, wenecki dukat. Każda ma krótką historię prawdziwego pieniądza, a gdzieś na dnie losowania czeka aureus, którym Brutus uczcił Idy marcowe. Przeszukany teren zostaje zaznaczony na mapie, więc żeby kopać dalej, trzeba iść dalej.

Prawdziwa przygoda zaczyna się od misji. Każda opowiada o jednym przedmiocie, na przykład o skromnym kubku mnicha, którym wzgardzili łupieżcy, i dlatego przetrwał. Żeby go odnaleźć, trzeba się oddalić: trzy odcinki wędrówki dają trzy symbole klucza, czwarty odsłania grobowiec. Jego wrota otworzysz tylko na miejscu, ustawiając pierścienie z symbolami we właściwej kolejności. Misję przejdziesz jednym długim spacerem albo rozłożysz na tydzień.

Łup trzeba jeszcze donieść do domu. Monety i artefakt niesiesz w plecaku, a gdy wrócisz do skarbca, skrzynia otwiera się w blasku i przyjmuje wszystko, co przynosisz, sztuka po sztuce. Artefakty zostają w skarbcu jako kanciaste modele 3D, które można obracać w palcach. Nadwyżkę monet kupi paser, a u niego da się też odkupić artefakt z misji, która przepadła.

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

Śmieci znikają zaraz po znalezieniu. Monety trafiają do plecaka i gracz zanosi je do skarbca (zob. „Plecak i skarbiec”).

**Lista śmieci (65% prawdopodobieństwa):**

- Grosz. Grosz do grosza: tak zaczyna się każda fortuna. Kop dalej!
  - EN: Penny. Every fortune starts with a single penny. Keep digging!
- Zawleczka od puszki. Każdy wielki poszukiwacz ma w kieszeni kilka takich. Witaj w klubie!
  - EN: Can pull tab. Every great treasure hunter has a pocketful of these. Welcome to the club!
- Skasowany bilet. Czyjaś podróż już się skończyła. Twoja dopiero się zaczyna!
  - EN: Used ticket. Someone's journey is over. Yours is just getting started!
- Zapalniczka bez gazu. Jej płomień zgasł, ale twój zapał płonie dalej!
  - EN: Empty lighter. Its flame is out, but your fire is still burning!
- Bateria AA. Rozładowana do zera. Ty na pewno masz więcej energii!
  - EN: AA battery. Flat as a pancake. You've surely got more energy than this!
- Spinacz biurowy. Mały, a nigdy nie odpuszcza. Weź z niego przykład!
  - EN: Paper clip. Small, but it never lets go. Take a leaf out of its book!
- Kolczyk bez pary. Jego para leży gdzieś w okolicy. Kto wie, co jeszcze tu znajdziesz?
  - EN: Lone earring. Its twin is somewhere nearby. Who knows what else you'll turn up?
- Gumka recepturka. Wciąż sprężysta. Wystrzel się nią w stronę następnego skarbu!
  - EN: Rubber band. Still springy. Use it to launch yourself at the next treasure!
- Nakrętka od butelki. Ktoś tu odkręcił napój, a ty odkręcasz przygodę. Następna łopata może być złota!
  - EN: Bottle cap. Someone opened a drink here; you're opening an adventure. The next dig could strike gold!
- Wyblakły paragon. Ktoś tu kupił chleb, a ty zbierasz kilometry. Lepszy interes!
  - EN: Faded receipt. Someone bought bread here; you're collecting miles. Better deal!

**Lista monet (35% prawdopodobieństwa):**

Common (75% szans)

1. Nummus rzymski. Rzym bił je jak dziś grosze. Ktoś go zgubił, a w twoje ręce trafił 1600 lat później.
   - EN: Roman nummus. Rome minted them like pocket change. Someone lost it, you found it, just 1,600 years later.
2. Kaiyuan Tongbao. Nawlekano je na sznurki po tysiąc sztuk. Ta jedna się wymknęła.
   - EN: Kaiyuan Tongbao. They were strung on cords a thousand at a time. This one slipped away.
3. Krajcar austriacki (1858–1891). W Galicji płacono nim za chleb i gazetę. Ten wypadł komuś z kieszeni półtora wieku temu.
   - EN: Austrian kreuzer. In Galicia it paid for bread and the morning paper. This one slipped out of a pocket a century and a half ago.

Uncommon (20% szans)

4. Denar rzymski. Mniej więcej dniówka robotnika. Twoja wpadła za spacer.
   - EN: Roman denarius. Roughly a laborer's daily wage. You earned it with a walk.
5. Hiszpańskie 8 reali. Gdy brakowało drobnych, cięto je na kawałki. Ta jest cała.
   - EN: Spanish piece of eight. When small change ran short, they were cut into pieces. This one is whole.
6. Tetradrachma ateńska. „Wozić sowy do Aten” mówili Grecy o czymś zbędnym. Ta sowa zbędna nie jest.
   - EN: Athenian tetradrachm. “Bringing owls to Athens,” the Greeks said of anything pointless. This owl is anything but.

Rare (4% szans)

7. Dukat wenecki. Doża klęczy przed świętym Markiem. Bity przez pięć wieków, aż Napoleon zakończył Republikę.
   - EN: Venetian ducat. The Doge kneels before Saint Mark. Minted for five centuries, until Napoleon ended the Republic.
8. Solidus bizantyjski. Konstantyn ustalił jego wagę, a Bizancjum dotrzymało słowa przez siedem stuleci.
   - EN: Byzantine solidus. Constantine fixed its weight, and Byzantium kept its word for seven centuries.
9. Dublon hiszpański. Galeony wiozły je przez Atlantyk tonami. Ten jakimś cudem trafił tutaj.
   - EN: Spanish doubloon. Galleons carried them across the Atlantic by the ton. Somehow this one ended up here.

Legendary (1% szans)

10. Stater lidyjski. Z krainy Krezusa. Lew na awersie strzeże jednej z pierwszych monet w dziejach ludzkości.
   - EN: Lydian stater. From the land of Croesus. The lion on its face guards one of the first coins in human history.
11. Aureus EID MAR. Brutus wybił go, by uczcić Idy marcowe. Przetrwała garstka. Jedna jest teraz twoja.
    - EN: EID MAR aureus. Brutus struck it to celebrate the Ides of March. Only a handful survive. One of them is now yours.
12. Rubel Konstantego (1825). Cesarz, który nigdy nie panował: brat objął tron, zanim moneta trafiła do obiegu. Przetrwało ich ledwie kilka.
    - EN: Constantine ruble. The emperor who never reigned: his brother took the throne before the coin was issued. Only a few survive.

## Misje

Misje prowadzą do grobowców z unikalnymi artefaktami. Gracz ma najwyżej jedną aktywną misję. Każda misja należy do jednego z 8 poziomów, od najłatwiejszego: drewniany, miedziany, brązowy, żelazny, srebrny, złoty, platynowy, diamentowy. Poziom wyznacza dystanse spacerów i cenę artefaktu u pasera; wszystkie misje poziomu mają te same:

| Poziom     | Symbol | Grobowiec | Paser |
|------------|--------|-----------|-------|
| Drewniany  | 200 m  | 400 m     | 20    |
| Miedziany  | 300 m  | 600 m     | 30    |
| Brązowy    | 500 m  | 1000 m    | 50    |
| Żelazny    | 800 m  | 1600 m    | 80    |
| Srebrny    | 1200 m | 2400 m    | 120   |
| Złoty      | 1700 m | 3400 m    | 170   |
| Platynowy  | 2300 m | 4600 m    | 230   |
| Diamentowy | 3000 m | 6000 m    | 300   |

Lista misji z poziomami, tytułami, lore i opisem modeli jest w `docs/lista-misji.md`. Na start jest po 3 artefakty na poziom (24 misje); nowe będą dochodzić z czasem.

**Kolejność.** Gra proponuje misję z najniższego poziomu, na którym zostały misje nierozegrane. Wewnątrz poziomu kolejność jest losowa, ale stała dla danej gry: losuje się ją przy zakładaniu skarbca. Misja dodana później do łatwiejszego poziomu trafia do wszystkich graczy, także tych na wyższych poziomach — jako odskocznia.

**Numer misji** to kolejność rozegrania: pierwsza rozpoczęta misja to Misja I i Grobowiec I, następna II itd. Poziom widać w notatniku (przy wpisie i w nagłówku strony misji), na podglądzie artefaktu i w skarbcu, gdzie artefakty są pogrupowane po poziomach.

**Długie spacery.** Punkt startu etapu wygasa razem z przeszukaniem po 6 godzinach, więc każdy etap trzeba przejść w ciągu 6 godzin od jego startu. Na wysokich poziomach to wyprawa na cały dzień.

### Notatnik poszukiwacza

Misje są zapisane w notatniku poszukiwacza: w skarbcu na zakładce „Notatnik”, a misja w trakcie także pod przyciskiem misji na mapie. Zakładka wygląda jak liniowana strona z odręcznymi zapiskami. Numer misji stoi cyfrą rzymską na marginesie.

Na górze strony jest jeden wpis:

- „Dostępna nowa misja”: nazwa artefaktu i jego szkic tuszem (SVG narysowane na podstawie modelu 3D), wklejony jak zdjęcie;
- albo „Misja w trakcie”: nazwa, szkic i czas, który został („Zostało: 6 d 4 h 23 min”);
- albo „Wkrótce nowe wyprawy.”, gdy misje się skończyły.

Pod nim, jeśli jakieś misje już się odbyły, jest rozdział „Odbyte misje”, od najnowszej: nazwa artefaktu i „Misja zakończona powodzeniem” (z ptaszkiem) albo „Misja zakończona niepowodzeniem” (z krzyżykiem).

Każdy wpis ma przycisk „Szczegóły”, który otwiera stronę notatnika tej misji (zamykaną krzyżykiem):

- **dostępna misja:** szkic, zdanie lore, ostrzeżenie „4 etapy: 3 symbole i grobowiec. Przejdziesz je jednym spacerem albo rozłożysz na 7 dni.” i przycisk „Rozpocznij misję”. Gdy artefakt poprzedniej misji jest jeszcze w plecaku, przycisk czeka, a strona mówi, żeby zanieść go do skarbca;
- **misja w trakcie:** spacery z odhaczonymi etapami, znalezione symbole, co robić dalej, czas do końca, przycisk „Otwórz wrota” przy grobowcu i „Porzuć misję” z potwierdzeniem;
- **misja udana:** lore, opis wyglądu artefaktu, kiedy odkryto grobowiec i gdzie jest artefakt (w skarbcu czy w plecaku), przyciski „Obejrzyj artefakt” i „Pokaż grobowiec na mapie”;
- **misja nieudana:** lore, kiedy przepadła i co z artefaktem (kiedy trafi do pasera, czy już tam czeka, czy został odkupiony), przycisk „Zajrzyj do pasera” albo „Obejrzyj artefakt”.

Model 3D nie jest pokazywany przed zdobyciem artefaktu — jest nagrodą reprezentującą prawdziwy przedmiot.

Rozpoczęcie misji czyści wszystkie przeszukane obszary, tak jakby minęło 6 godzin, i uruchamia limit czasu.

### Przebieg misji

Misja ma 4 etapy: trzy symbole klucza, a potem grobowiec. Sprawny piechur przejdzie je jednym spacerem; można je też rozłożyć w czasie, w granicach limitu misji.

**Dystans etapu.** Poziom misji podaje dwa dystanse: na symbol i na grobowiec (np. 800 m i 1600 m na poziomie żelaznym). Dystans liczy się w linii prostej od punktu startu etapu do miejsca przeszukania:

- punktem startu jest pierwsze przeszukanie w danym etapie;
- jeśli ten obszar wygaśnie (po 6 godzinach), punktem startu staje się najstarsze aktywne przeszukanie z tego etapu, a jeśli takiego nie ma — następne przeszukanie.

**Symbol.** Przeszukanie wykonane co najmniej w dystansie symbolu od punktu startu zawsze daje symbol klucza zamiast zwykłego znaleziska (śmiecia lub monety). Jest to zawsze symbol, którego gracz jeszcze nie ma. Gra nie zdradza, na którym pierścieniu leży.

**Kolejny etap.** Zaczyna się od razu, bez przerwy: przeszukanie, które dało symbol, jest punktem startu następnego etapu. Karta symbolu podpowiada, ile trzeba przejść dalej („Szukasz dalej? Odejdź stąd 800 m.”). Szybkość nie jest sprawdzana poza zwykłym limitem 10 km/h przy szukaniu — kto podjeżdża samochodem, oszukuje tylko siebie.

**Grobowiec.** Po trzecim symbolu zaczyna się ostatni, najdłuższy spacer. Przeszukanie wykonane co najmniej w dystansie grobowca od punktu startu odkrywa grobowiec zamiast zwykłego znaleziska. Grobowiec powstaje dokładnie w miejscu przeszukania i zostaje na mapie na stałe jako ikona. Musi leżeć co najmniej 200 m od innych grobowców — jeśli leżałby bliżej, przeszukanie przebiega normalnie. Grobowce mają numery misji pisane cyframi rzymskimi: Grobowiec I, Grobowiec II, Grobowiec III itd.

Wszystkie przeszukania misji podlegają tym samym zasadom co zwykłe szukanie: poza przeszukanym terenem i skarbcem, prędkość, dokładność GPS. Każde tworzy obszar jak zwykle.

Misja kończy się sukcesem po otwarciu wrót grobowca (zob. „Wrota i klucz”). Artefakt trafia do plecaka. Następną misję można rozpocząć dopiero wtedy, gdy artefakt zostanie złożony w skarbcu — karta następnej misji jest widoczna, ale przycisk „Rozpocznij misję” czeka.

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

Wrota otwiera się na miejscu — gracz musi być w promieniu 100 m od grobowca. Karta odkrycia grobowca ma przycisk „Otwórz grobowiec”, który od razu prowadzi do wrót; krzyżyk zamyka kartę, a wrota czekają (przycisk „Otwórz wrota” w notatniku albo stuknięcie w grobowiec na mapie). Liczba prób jest nieograniczona, a zły układ nie ma żadnych konsekwencji poza tym, że wrota się nie otwierają. Grobowiec pozostaje zamknięty, dopóki gracz nie ustawi klucza.

Po otwarciu wrót gracz otrzymuje zamknięty w grobowcu artefakt.

## Plecak i skarbiec

Gracz nosi znaleziska w plecaku: monety i artefakt z otwartego grobowca. Symbole do plecaka nie trafiają — należą do misji. Po zamknięciu okna znaleziska moneta wlatuje do przycisku plecaka na mapie (symbol — do przycisku misji). Przycisk plecaka pokazuje liczbę niesionych znalezisk, a wskaźnik kierunku do skarbca pulsuje. Stuknięcie w plecak otwiera kartę z jego zawartością (artefakt, monety z liczbą sztuk) i odległością do skarbca.

Gdy gracz wejdzie w promień skarbca (100 m) z czymś w plecaku, cała zawartość zostaje złożona w skarbcu. Limit GPS jest łagodniejszy niż przy szukaniu: dokładność do 100 m, bo skarbiec to zwykle dom, a w budynku sygnał słabnie. Prędkość nie ma znaczenia.

Złożenie to osobny moment nagrody — scena „Powrót do skarbca”: skrzynia skarbca spada i otwiera się w blasku, monety wpadają do niej jedna po drugiej (od pospolitych do najrzadszych), artefakt zawisa nad skrzynią z nazwą i wpada do niej na koniec, wieko się zatrzaskuje. Podsumowanie pokazuje, co złożono. Dotknięcie ekranu przyspiesza scenę.

Zawartość plecaka nigdy nie przepada. Monety w plecaku nie liczą się jeszcze do kolekcji i paser ich nie kupi, dopóki nie trafią do skarbca.

## Artefakty w skarbcu

Artefakty złożone w skarbcu mają własną zakładkę „Artefakty”, obok zakładki „Monety”: artefaktów z czasem będzie dużo, a monety mają być pod ręką. Stoją po 3 w rzędzie: obrazek artefaktu, a pod nim nazwa. Brakujący artefakt to pusty prostokąt z zaokrąglonymi rogami i znakiem zapytania. Artefakt, który jest jeszcze w plecaku, widać wyblakły, z dopiskiem „w plecaku”. Stuknięcie w artefakt pokazuje go w 3D z możliwością obracania, razem z nazwą i lore.

## Paser

Paser to czarny rynek w skarbcu, na osobnej zakładce „Paser”. Waluta nie ma nazwy — w interfejsie to po prostu „Pieniądze” (Money) i „Cena” (Price) z liczbą.

**Sprzedaż monet.** Gracz sprzedaje monety ze skarbca (nie z plecaka) po jednej sztuce. Sprzedana moneta znika z kolekcji (licznik spada o 1). Sprzedaż ostatniej sztuki wymaga potwierdzenia, bo moneta znika wtedy z kolekcji.

| Rzadkość     | Cena |
|--------------|------|
| Pospolita    | 1    |
| Niepospolita | 5    |
| Rzadka       | 20   |
| Legendarna   | 100  |

Przy szansach z „Szukania skarbów” jedno przeszukanie jest średnio warte około 1,24.

**Kupno artefaktów.** U pasera można kupić tylko artefakty z utraconych misji, 7 dni po ich utracie. Kupiony artefakt trafia od razu do skarbca — paser jest w skarbcu, więc nie trzeba go nieść. Cenę artefaktu wyznacza poziom misji (tabela w rozdziale „Misje”). Odkupiona misja zostaje w notatniku jako nieudana, a jej artefakt trafia do skarbca.

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
| Symbol                  | Symbol              |
| Artefakt                | Artifact            |
| Plecak                  | Backpack            |
| Powrót do skarbca       | Back at the vault   |
| Monety (zakładka)       | Coins               |
| Artefakty (zakładka)    | Artifacts           |
| Notatnik (zakładka)     | Notebook            |
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
