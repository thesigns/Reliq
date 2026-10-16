# Changelog

Zmiany w grze Reliq, od najnowszej wersji. Wersję podaje `VERSION` w `js/version.js`.

## 0.11.0 — w przygotowaniu

Poprawki po pierwszym spacerze testowym. Lista jeszcze się wydłuży.

### Nowe

- Ekran menu ma pod podtytułem krótką notę o bezpieczeństwie. Mówi, żeby patrzeć przed siebie, a nie w ekran, omijać teren prywatny, ogrodzony i niebezpieczny, uważać na ruch uliczny i zatrzymać się, zanim zerknie się na mapę.

- **Dwie nowe monety**, pierwsze z XIX wieku: pospolity krajcar austriacki (miedziany, krążył w Galicji) i legendarny rubel Konstantego (1825, srebrny, cesarza, który nigdy nie panował). W kolekcji jest teraz 12 monet, po trzy w każdej rzadkości.

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
- **Numery grobowców** są pisane cyframi rzymskimi: Grobowiec I, II, III…
- **Symbole:** „skorupy” nazywają się teraz „symbolami”, po polsku i po angielsku („Symbols”).
- **Podpowiedź pod wrotami** nie mówi już niejasnego „od zewnętrznego” i nie sugeruje, że kolejność na pasku symboli to klucz: „Ustaw znalezione symbole pod znacznikiem, po jednym na każdym pierścieniu. Właściwą kolejność musisz odgadnąć.”
- **Opisy śmieci** zachęcają do dalszych poszukiwań i bawią, zamiast zniechęcać. Na przykład bateria: „Rozładowana do zera. Ty na pewno masz więcej energii!”
- **Polskie teksty** nie zakładają płci gracza: zniknęły formy typu „znalazłeś”, „zaszedłeś”, „zarobiłeś”.

- **Skarbiec ma cztery zakładki:** Notatnik, Monety, Artefakty i Paser, a skrzynia w doku otwiera go na Notatniku. Dawna „Kolekcja” rozpadła się na monety i półkę z artefaktami, bo artefaktów z czasem będzie dużo i monety lądowałyby na dole długiej strony. Po złożeniu łupu „Otwórz skarbiec” prowadzi do artefaktów, jeśli właśnie trafił tam artefakt.
- **Typografia:** odstępy między wierszami zależą od długości wiersza. Krótkie opisy (znaleziska, karty, komunikaty) mają ciaśniejszą interlinię, dłuższe akapity (lore, „O grze”, onboarding) nieco luźniejszą, ale już nie rozstrzeloną. Akapity równoważą długość wierszy, żeby na końcu nie zostawało pojedyncze słowo.

### Usunięte

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
