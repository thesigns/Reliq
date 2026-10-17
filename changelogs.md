# Changelog

Zmiany w grze Reliq, od najnowszej wersji. Wersję podaje `VERSION` w `js/version.js`.

## 0.15.0 — 2026-10-17

### Zmienione

- **Misja trwa 10 dni** zamiast 7, więc można ją zacząć w jeden weekend i skończyć w następny.
- **Utracony artefakt od razu trafia do pasera**, bez 7 dni czekania. Kto przegapi termin albo porzuci misję, może go odkupić, gdy tylko uzbiera pieniądze.
- **Kolejna misja od razu**, z artefaktem jeszcze w plecaku. Po krótkiej misji można na tym samym spacerze szukać następnego grobowca, a na wyjeździe zebrać kilka artefaktów i złożyć je w skarbcu razem po powrocie. Plecak mieści dowolnie wiele artefaktów: przy więcej niż dwóch karta plecaka i podsumowanie w skarbcu pokazują je mniejsze, po trzy w rzędzie, a w scenie „Powrót do skarbca” wpadają do skrzyni jeden po drugim, szybciej niż pojedynczy. Pierwsze trzy zawisają nad skrzynią ze swoją nazwą, a kolejne wpadają od razu, z krótkim błyskiem; wszystkie wymienia podsumowanie.
- **Otwarty grobowiec znika z mapy** i nie zajmuje już miejsca: kolejny może się pojawić w tej samej okolicy, nawet tuż obok. Nie ma więc 200 m odstępu między grobowcami ani kropkowanych stref wokół nich, co ułatwia grę tam, gdzie dróg jest niewiele. Wpis w notatniku zostaje, z datą odkrycia; zniknął z niego przycisk „Pokaż grobowiec na mapie”.
- **Fanfara przy monecie:** zamiast pojedynczego brzdęku dęciaki grają „ta-daaa!”, czyli krótki akord, który rozwiązuje się w długi, trzymany. Im rzadsza moneta, tym dłużej trzymają, jaśniej brzmią i grają pełniejszym składem.
- **Fanfara przy artefakcie:** otwarte wrota grają największą fanfarę, „ta-ta-daaaa” z dodatkowym akordem przed rozwiązaniem, więc artefakt brzmi okazalej niż każda moneta. Symbol klucza dostał skromne, krótkie „ta-da” zamiast dzwonka.

## 0.14.1 — 2026-10-17

### Poprawione

- **Własny identyfikator aplikacji** (`"id": "/Reliq/"` w manifeście). Dotąd `"./"` oznaczało całą domenę `thesigns.github.io`, tak samo jak w Xenowalk, więc przeglądarka brała obie gry za jedną aplikację: po zainstalowaniu jednej druga wyglądała na już zainstalowaną. Zainstalowaną wcześniej grę trzeba odinstalować i zainstalować ponownie; postępy zostają, bo zapis zależy od domeny, nie od identyfikatora.

## 0.14.0 — 2026-10-17

### Zmienione

- **Teksty wprowadzenia** opisują grę taką, jaka jest teraz: łup nosisz w plecaku i składasz w skarbcu po powrocie w jego krąg, skarbca nie da się przenieść, śmieci się wyrzuca, a nadwyżkę monet kupi paser. Telefon może między poszukiwaniami spać w kieszeni. List zaczyna się od „Witaj w Towarzystwie!”, bez formy męskiej.
- **Strona „Misje”** we wprowadzeniu i w „O grze”, ze szkicem trasy przez trzy symbole do wrót grobowca: misje czekają w notatniku, spacery dają symbole klucza, ostatni odsłania grobowiec, a wrota otwiera się na miejscu, odgadując kolejność symboli, w ciągu 7 dni.
- **„Otwórz grobowiec”** na karcie odkrytego grobowca prowadzi od razu do wrót. Krzyżyk w rogu zostaje, gdy gracz woli wrócić później.
- Szkic „Znalezisk” pokazuje łopatę w kopczyku ziemi zamiast mapy z krzyżykiem.
- Liczby w zasadach (odległość od skarbca, czas znikania śladów, limit prędkości, czas misji) gra bierze ze swoich reguł, więc nie rozjadą się z rozgrywką.

## 0.13.0 — 2026-10-16

### Zmienione

- **Śmieci w 3D:** dziesięć śmieci to teraz modele, jak monety i artefakty: grosz z jedynką, zawleczka, skasowany bilet, zapalniczka, rozładowana bateria z wyciekiem, spinacz, kolczyk z różowym oczkiem, gumka recepturka, nakrętka od butelki i zwinięty paragon. Spadają na ziemię z odbiciem, można je obracać palcem, a „Wyrzuć” odrzuca je w dal.
- **Dźwięk porażki:** znalezienie śmiecia kwituje ciche, komiczne „tu-tu-tuuuu” — trzy opadające nuty, ostatnia przeciągnięta i drżąca.

### Usunięte

- Rysunki śmieci na papierowej karcie.

## 0.12.1 — 2026-10-16

### Nowe

- **Galeria artefaktów** pod adresem `gallery/`: wszystkie artefakty z grobowców obracają się w 3D, pogrupowane według poziomów, z legendą i detalem, po polsku i po angielsku. Strona korzysta z modeli i tekstów gry, więc nowe artefakty pojawiają się w niej same.

## 0.12.0 — 2026-10-16

### Nowe

- **Komplet 24 artefaktów:** wszystkie misje z listy mają już modele, od miedzi do diamentu.
  - Miedziany: lampka oliwna z Aleksandrii i dzwonek najupartszej krowy z Tyrolu.
  - Brązowy: hełm hoplity spod Maratonu, lur z duńskiego torfowiska, tarcza nieba znad Łaby.
  - Żelazny: klucz kasztelana.
  - Srebrny: róg jarla Hrafna, zegarek kapitana, kałamarz poety.
  - Złoty: korona zapomnianej królowej, skarabeusz faraona, jabłko koronacyjne.
  - Platynowy: sekstant kartografa, klepsydra alchemika z Pragi, mechaniczny słowik cesarza.
  - Diamentowy: jajo carycy, błękitny diament maharadży, karabela hetmana.

### Zmienione

- **Znaleziony symbol** zamyka się przyciskiem „Zanotuj” zamiast „Do plecaka”. Symbol trafia do notatnika misji, nie do plecaka.
- Opis symbolu nie zwraca się już do gracza w rodzaju męskim („trzeba odgadnąć samodzielnie”).

## 0.11.0 — 2026-10-16

Poprawki po pierwszym spacerze testowym.

### Nowe

- Ekran menu ma pod podtytułem krótką notę o bezpieczeństwie. Mówi, żeby patrzeć przed siebie, a nie w ekran, omijać teren prywatny, ogrodzony i niebezpieczny, uważać na ruch uliczny i zatrzymać się, zanim zerknie się na mapę.

- **Dwie nowe monety**, pierwsze z XIX wieku: pospolity krajcar austriacki (miedziany, krążył w Galicji) i legendarny rubel Konstantego (1825, srebrny, cesarza, który nigdy nie panował). W kolekcji jest teraz 12 monet, po trzy w każdej rzadkości.

- **Poziomy misji:** osiem poziomów, od drewnianego do diamentowego. Poziom wyznacza dystanse spacerów (od 200/400 m do 3000/6000 m) i cenę artefaktu u pasera. Misje idą od najłatwiejszego poziomu, wewnątrz poziomu w losowej, ale stałej dla gracza kolejności, a numer misji to kolejność rozegrania. Poziom widać w notatniku, na podglądzie artefaktu i w skarbcu, gdzie artefakty są pogrupowane po poziomach. Zapis gry z poprzedniej wersji zaczyna się od nowa.
- **Trzy drewniane artefakty** otwierają grę: grzebień księżniczki z Teb (z leżącą gazelą i fajansowym pasem), chodak tulipanowego kupca (z tulipanem na nosku) i liczydło kupca z Kantonu (z jadeitowym koralikiem). Pierwsza misja nowego gracza jest teraz drewniana i krótka: 200 m do symbolu, 400 m do grobowca.
- **Odkupiona misja** zostaje w notatniku jako nieudana, z dopiskiem, że artefakt odkupiono.

### Zmienione

- **Zamykanie okien:** każde okno, które da się po prostu zamknąć, ma ten sam okrągły przycisk „X” w prawym górnym rogu. Dotyczy to ustawień, „O grze”, dziennika skarbca, karty plecaka, karty misji, wrót grobowca, podglądu monet i artefaktów oraz podsumowania „Powrót do skarbca”. Przyciski z prawdziwą akcją zostały: „Do plecaka”, „Wyrzuć”, „Otwórz wrota”, „Pokaż skarbiec”.
- **Przycisk misji** razem z etykietą odległości przeniósł się do lewego górnego rogu mapy. Na dole zasłaniał napis nad przyciskiem szukania.
- **Wskaźnik skarbca** omija przyciski na mapie i staje w najbliższym wolnym miejscu krawędzi, w kierunku skarbca. Komunikaty pokazują się niżej, pod przyciskiem misji.
- **Ikona grobowca** na mapie to teraz jego wrota: kamienny krąg z trzema pierścieniami po 8 kropek i zamkiem pośrodku. Środek kręgów to miejsce odkrycia. Wcześniej była to zrujnowana świątynia z czerwonym X.
- **Plecak zamiast sakwy:** znaleziska nosisz w plecaku (po angielsku „Backpack”). Jego ikona to staroświecki skórzany plecak podróżnika z początku XX wieku: duża przeszyta klapa, dwa rzemienie z mosiężnymi sprzączkami, naszyta kieszeń i zwinięty wełniany koc przypięty na górze.
- **Zakładka „Misje” w skarbcu to teraz „Notatnik”:** liniowana strona z odręcznymi zapiskami i numerami misji na marginesie. Na górze „Dostępna nowa misja” albo „Misja w trakcie” z odliczaniem czasu i wklejonym szkicem artefaktu, niżej „Odbyte misje” z ptaszkiem albo krzyżykiem. Przy każdym wpisie „Szczegóły” otwierają stronę notatnika: przyjęcie misji, postęp i porzucenie, obejrzenie artefaktu, grobowiec na mapie albo pasera.
- **Ikona przycisku misji** to teraz notatnik poszukiwacza zamiast zwoju: oprawa z ciemnoczerwonej skóry z przeszyciem, mosiężne narożniki, gumka, zakładka-wstążka, widoczny blok kartek i wytłoczone na okładce wrota grobowca (trzy pierścienie z kropkami i zamkiem).
- **Karta misji** wygląda jak strona z notatnika poszukiwacza: liniowany papier z czerwonym marginesem. Zamiast mapki ze ścieżką ma szkic artefaktu, taki jak w skarbcu, a numer misji jest w nagłówku („Misja II”). W skarbcu przycisk „Rozwiń mapę” nazywa się teraz „Otwórz notatnik”.
- **Ikona skarbca** w doku to nowa, staranniej narysowana skrzynia: deski z połyskiem, nitowane żelazne okucia, mosiężne narożniki, zapięcie z zamkiem i złoty blask w szczelinie pod wiekiem.
- **Podgląd artefaktu** nie powtarza się: zamiast „Skarb grobowca I” nad „Artefakt z grobowca” jest jedna etykieta „Artefakt z grobowca I”. Artefakt odkupiony od pasera ma nad nią „Kupiony u pasera”.
- **Numery grobowców** są pisane cyframi rzymskimi: Grobowiec I, II, III…
- **Symbole:** „skorupy” nazywają się teraz „symbolami”, po polsku i po angielsku („Symbols”).
- **Podpowiedź pod wrotami** nie mówi już niejasnego „od zewnętrznego” i nie sugeruje, że kolejność na pasku symboli to klucz: „Ustaw znalezione symbole pod znacznikiem, po jednym na każdym pierścieniu. Właściwą kolejność musisz odgadnąć.”
- **Opisy śmieci** zachęcają do dalszych poszukiwań i bawią, zamiast zniechęcać. Na przykład bateria: „Rozładowana do zera. Ty na pewno masz więcej energii!”
- **Polskie teksty** nie zakładają płci gracza: zniknęły formy typu „znalazłeś”, „zaszedłeś”, „zarobiłeś”.

- **Skarbiec ma cztery zakładki:** Notatnik, Monety, Artefakty i Paser, a skrzynia w doku otwiera go na Notatniku. Artefakty nie stoją już na narysowanej półce: to siatka z obrazkiem i nazwą pod spodem, a brakujący artefakt to prostokąt ze znakiem zapytania. Dawna „Kolekcja” rozpadła się na monety i artefakty, bo artefaktów z czasem będzie dużo i monety lądowałyby na dole długiej strony. Po złożeniu łupu „Otwórz skarbiec” prowadzi do artefaktów, jeśli właśnie trafił tam artefakt.
- **Typografia:** odstępy między wierszami zależą od długości wiersza. Krótkie opisy (znaleziska, karty, komunikaty) mają ciaśniejszą interlinię, dłuższe akapity (lore, „O grze”, onboarding) nieco luźniejszą, ale już nie rozstrzeloną. Akapity równoważą długość wierszy, żeby na końcu nie zostawało pojedyncze słowo.

### Usunięte

- **Róża wiatrów** w prawym górnym rogu mapy. Wyglądała jak element interfejsu i tylko zaśmiecała mapę.
- **Czerwona przerywana linia trasy** za graczem. Przeszukane obszary i tak pokazują przebytą drogę, a linia myliła się z innymi przerywanymi liniami na mapie. Zapis gry nie przechowuje już trasy (wcześniej nawet ~250 KB po długim spacerze).
- **Muzyka** i jej przełącznik w ustawieniach. Na głośniku telefonu prawie jej nie było słychać, a w tle i tak milkła. Efekty dźwiękowe zostały.
- **Napis „Nowość”** przy monetach: w scenie składania łupu, w podsumowaniu i na ekranie znaleziska.

### Wydajność

- **Płynne przesuwanie i zoom mapy.** Tło mapy (papier, biomy, siatka, ikony terenu) nie jest już przerysowywane w całości co kilkadziesiąt pikseli ruchu. Przy przesuwaniu dorysowuje się tylko pasek, który wjeżdża na ekran. W trakcie zoomu ostre tło jest rozciągane albo zastępowane tańszą warstwą, a po geście dorysowuje się w kilku porcjach. Najgorsza klatka przy przesuwaniu jest około 4× krótsza, a szczypnięcie nie ma już skoków.
- Napisy, dymki i wskaźnik skarbca poruszają się w tych samych klatkach co mapa, więc na ekranach 90/120 Hz nie „pływają” względem niej.

### Dla deweloperów

- Przycisk panelu testowego jest w górnej belce, obok ☰, i ma ten sam styl: mosiężną zębatkę z cieniem.
- GDD zaczyna się od rozdziału „Wizja” („W jednym zdaniu” i „Opis”).

## 0.10.0

Pierwsza wersja w repozytorium.
