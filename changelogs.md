# Changelog

Zmiany w grze Reliq, od najnowszej wersji. Wersję podaje `VERSION` w `js/version.js`.

## 0.11.0 — w przygotowaniu

Poprawki po pierwszym spacerze testowym. Lista jeszcze się wydłuży.

### Nowe

- Ekran menu ma pod podtytułem krótką notę o bezpieczeństwie. Mówi, żeby patrzeć przed siebie, a nie w ekran, omijać teren prywatny, ogrodzony i niebezpieczny, uważać na ruch uliczny i zatrzymać się, zanim zerknie się na mapę.

### Zmienione

- **Zamykanie okien:** każde okno, które da się po prostu zamknąć, ma ten sam okrągły przycisk „X” w prawym górnym rogu. Dotyczy to ustawień, „O grze”, dziennika skarbca, karty sakwy, karty misji, wrót grobowca, podglądu monet i artefaktów oraz podsumowania „Powrót do skarbca”. Przyciski z prawdziwą akcją zostały: „Do sakwy”, „Wyrzuć”, „Otwórz wrota”, „Pokaż skarbiec”.
- **Przycisk misji** razem z etykietą odległości przeniósł się do lewego górnego rogu mapy. Na dole zasłaniał napis nad przyciskiem szukania.
- **Wskaźnik skarbca** omija przyciski na mapie i staje w najbliższym wolnym miejscu krawędzi, w kierunku skarbca. Komunikaty pokazują się niżej, pod przyciskiem misji.
- **Ikona grobowca** na mapie to teraz jego wrota: kamienny krąg z trzema pierścieniami po 8 kropek i zamkiem pośrodku. Środek kręgów to miejsce odkrycia. Wcześniej była to zrujnowana świątynia z czerwonym X.
- **Ikona skarbca** w doku to nowa, staranniej narysowana skrzynia: deski z połyskiem, nitowane żelazne okucia, mosiężne narożniki, zapięcie z zamkiem i złoty blask w szczelinie pod wiekiem.
- **Numery grobowców** są pisane cyframi rzymskimi: Grobowiec I, II, III…
- **Symbole:** „skorupy” nazywają się teraz „symbolami”, po polsku i po angielsku („Symbols”).
- **Podpowiedź pod wrotami** nie mówi już niejasnego „od zewnętrznego” i nie sugeruje, że kolejność na pasku symboli to klucz: „Ustaw znalezione symbole pod znacznikiem, po jednym na każdym pierścieniu. Właściwą kolejność musisz odgadnąć.”
- **Opisy śmieci** zachęcają do dalszych poszukiwań i bawią, zamiast zniechęcać. Na przykład bateria: „Rozładowana do zera. Ty na pewno masz więcej energii!”
- **Polskie teksty** nie zakładają płci gracza: zniknęły formy typu „znalazłeś”, „zaszedłeś”, „zarobiłeś”.

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
