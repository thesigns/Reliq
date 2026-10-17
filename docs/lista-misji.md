# Lista Misji

Dokument WIP.

Misje i artefakty dzielą się na 8 POZIOMÓW (Tier):

1. Drewniany
2. Miedziany
3. Brązowy
4. Żelazny
5. Srebrny
6. Złoty
7. Platynowy
8. Diamentowy

Wszystkie artefakty z tego samego POZIOMU mają te same parametry odległości symbolu/grobowca i cenę u pasera:

| Poziom     | Symbol   | Grobowiec | Paser    |
| ---------- | -------- | --------- | -------- |
| Drewniany  | 200m     | 400m      | 20       |
| Miedziany  | 300m     | 600m      | 30       |
| Brązowy    | 500m     | 1000m     | 50       |
| Żelazny    | 800m     | 1600m     | 80       |
| Srebrny    | 1200m    | 2400m     | 120      |
| Złoty      | 1700m    | 3400m     | 170      |
| Platynowy  | 2300m    | 4600m     | 230      |
| Diamentowy | 3000m    | 6000m     | 300      |

Misje pokazują się w kolejności od Drewnianego do Diamentowego - od najłatwiejszej do najtrudniejszej, ale WEWNĄTRZ jednego poziomu kolejność misji jest losowa.

Na początek będziemy mieli po 3 artefakty na poziom, czyli 3x8 = 24 artefakty. W przyszłości będziemy dodawać do poziomów nowe artefakty i może nawet nowe poziomy, słabsze od drewnianego i lepsze od diamentowego.

## Ustalenia

- **Kolejność poziomów:** Złoty jest przed Platynowym, jak w grach (srebro → złoto → platyna → diament).
- **Nowe łatwiejsze misje** dodane później (do niższego poziomu albo nowy poziom poniżej Drewnianego) dostają wszyscy gracze, także ci na wyższych poziomach. To odskocznia: misja z najniższego poziomu, w którym zostały niezrobione misje, idzie zawsze pierwsza.
- **Limit czasu** to 10 dni na każdym poziomie.
- **Numer misji** (Misja I, Grobowiec I) to kolejność rozegrania, nie miejsce na tej liście: pierwsza rozegrana misja to zawsze Misja I.
- **Poziom widać w grze:**
  - w notatniku, we wpisie i na stronie misji (np. „Misja IV · poziom żelazny”);
  - przy otwarciu wrót i zakupie od pasera, nad nazwą artefaktu (np. „Poziom żelazny”);
  - w skarbcu na zakładce Artefakty, gdzie artefakty są pogrupowane po poziomach, tak jak monety po rzadkości.

## Artefakty

Każdy wpis: tytuł, plik modelu, lore (widać na karcie misji przed wyprawą), trzy detale i kształt — opis bryły do zrobienia modelu low-poly.

Detale gracz odkrywa po kolei, badając artefakt w skarbcu (obracając go palcem): detal 1 jest najbardziej oczywisty i opisuje coś, co widać na modelu, detal 2 wymaga bliższego przyjrzenia się, często z boku, z tyłu albo od spodu, a detal 3 jest najbardziej tajemniczy — to dotyk, zapach, dźwięk albo domysł, czego na modelu nie widać. Modele z dopiskiem „gotowy” już są w grze.

## Drewniany

### Grzebień księżniczki z Teb

Tytuł: Grzebień księżniczki z Teb
Model: comb.js (gotowy)
Lore: Służki czesały nim księżniczkę o świcie, a gazela na grzbiecie pilnowała, żeby żaden sen nie uciekł jej z głowy.
Detal 1: Gazela straciła jeden róg, ale wciąż patrzy przed siebie.
Detal 2: Turkusowy pasek nad zębami to wkładka z fajansu, nie farba.
Detal 3: Drewno wciąż pachnie olejkiem lotosowym.
Kształt: płaski grzebień z ciemnego drewna, gęsty rząd zębów u dołu, na szczycie wycięta sylwetka leżącej gazeli.

### Chodak tulipanowego kupca

Tytuł: Chodak tulipanowego kupca
Model: clog.js (gotowy)
Lore: Za jedną cebulkę tulipana kupiec oddał dom, a gdy ceny runęły, uciekł z Amsterdamu w jednym chodaku.
Detal 1: Na nosku ktoś wymalował czerwony tulipan.
Detal 2: Podeszwa jest dwa razy grubsza, niż trzeba — kupiec lubił patrzeć na innych z góry.
Detal 3: Kiedy nim potrząsnąć, w środku coś cicho grzechocze. Może to ostatnia cebulka?
Kształt: drewniany chodak z wysokim, zadartym noskiem i grubą podeszwą, jasne drewno, czerwono-zielony tulipan na czubku.

### Liczydło kupca z Kantonu

Tytuł: Liczydło kupca z Kantonu
Model: abacus.js (gotowy)
Lore: Kupiec liczył na nim tak szybko, że rywale przysięgali, iż koraliki przesuwają się same.
Detal 1: Narożniki ramy okuto mosiądzem, żeby przetrwała podróże kupca.
Detal 2: Jeden koralik jest z jadeitu — zapłata za najlepszy interes jego życia.
Detal 3: Koraliki chodzą tak lekko, że wystarczy na nie chuchnąć.
Kształt: prostokątna rama z ciemnego drewna, poprzeczna belka, pionowe pręty z rzędami czerwonych koralików (jeden zielony).

## Miedziany

### Kubek Brata Odona

Tytuł: Kubek Brata Odona
Model: cup.js (gotowy)
Lore: Łupieżcy wynieśli z klasztoru całe złoto, a skromnym kubkiem Brata Odona wzgardzili, i tylko dlatego przetrwał.
Detal 1: Polewa spłynęła po glinie zaciekami.
Detal 2: Spód został bez polewy: goła, wypalona glina.
Detal 3: Glina wciąż pachnie miodem pitnym, choć reguła zakazywała braciom mocnych trunków.

### Lampka oliwna z Aleksandrii

Tytuł: Lampka oliwna z Aleksandrii
Model: lamp.js (gotowy)
Lore: Przy jej płomieniu kopista z Biblioteki przepisał ostatni zwój, zanim przyszedł pożar.
Detal 1: Kopeć z knota zostawił na dziobku czarny ślad.
Detal 2: Ucho zawinięto w pętlę, żeby lampkę dało się nieść na jednym palcu.
Detal 3: Gdy ją przechylić, na dnie przelewa się jeszcze kropla oliwy.
Kształt: niska, wydłużona miedziana lampka: brzuszek z wieczkiem, długi dziobek na knot z jednej strony, zawinięte ucho z drugiej.

### Dzwonek najupartszej krowy z Tyrolu

Tytuł: Dzwonek najupartszej krowy z Tyrolu
Model: bell.js (gotowy)
Lore: Krowa Berta zawsze szła pod prąd stada, więc pasterz dał jej największy dzwonek w dolinie, żeby zawsze słyszeć, dokąd znowu poszła.
Detal 1: Skórzany pas wytarł się tam, gdzie Berta drapała się o płoty.
Detal 2: W środku wisi ciężkie serce: jedno kiwnięcie łbem i słychać je w całej dolinie.
Detal 3: Skóra wciąż pachnie oborą i alpejskim sianem.
Kształt: miedziany dzwon rozszerzony u dołu, serce widoczne w środku, szeroki skórzany pas z mosiężną klamrą zawieszony u góry.

## Brązowy

### Hełm hoplity spod Maratonu

Tytuł: Hełm hoplity spod Maratonu
Model: helmet.js (gotowy)
Lore: Hoplita biegł w nim z wieścią o zwycięstwie aż do Aten, a zgubił go dopiero na ostatniej prostej.
Detal 1: Grzebień z końskiego włosia wyblakł z purpury do rdzy.
Detal 2: Szczeliny na oczy są tak wąskie, że hoplita widział tylko to, co miał przed sobą.
Detal 3: Od środka brąz jest gładki, wyślizgany przez lata noszenia, i wciąż ciepły w dotyku.
Kształt: hełm koryncki z brązu: wąskie szczeliny na oczy, nosal, policzki schodzące do brody, czerwony grzebień z włosia biegnący przez szczyt.

### Lur z duńskiego torfowiska

Tytuł: Lur z duńskiego torfowiska
Model: lur.js (gotowy)
Lore: Takie rogi zakopywano w bagnie parami, żeby grały do siebie, a ten wciąż czeka na drugi.
Detal 1: Ustnik jest wygładzony od tysięcy oddechów.
Detal 2: Talerz na końcu zdobi rząd wypukłych guzów, jak krople rosy.
Detal 3: Gdy w niego lekko dmuchnąć, odpowiada niskim pomrukiem, jakby szukał drugiego rogu.
Kształt: długa tuba z brązu wygięta w kształt litery S, zakończona płaskim talerzem z rzędem wypukłych guzów.

### Tarcza nieba znad Łaby

Tytuł: Tarcza nieba znad Łaby
Model: skydisc.js (gotowy)
Lore: Szaman czytał z niej, kiedy siać, a kiedy zbierać, i nigdy nie pomylił się o dzień.
Detal 1: Złoty sierp księżyca błyszczy mocniej niż słońce.
Detal 2: Złoty łuk na brzegu to horyzont: od jego końców liczono dni do przesilenia.
Detal 3: Kto weźmie go w dłonie nocą, przysięga, że księżyc na dysku zawsze wskazuje ten na niebie.
Kształt: płaski dysk z zielonej, spatynowanej miedzi ze złotymi wkładkami: koło słońca, sierp księżyca, gwiazdy i łuk horyzontu na brzegu.

## Żelazny

### Waza z Jadeitowej Przełęczy

Tytuł: Waza z Jadeitowej Przełęczy
Model: vase.js (gotowy)
Lore: Karawana niosła ją na zachód przez trzy lata, a z dwudziestu wielbłądów dotarł tylko ten, który ją dźwigał.
Detal 1: Niebieskie romby obiegają brzusiec jak szachownica.
Detal 2: Na szyjce wciąż widać ślady sznurów.
Detal 3: W środku wciąż czuć herbatę, którą w niej wieziono.

### Kielich Czerwonej Hrabiny

Tytuł: Kielich Czerwonej Hrabiny
Model: chalice.js (gotowy)
Lore: Hrabina nalewała z niego wino gościom, a ci, którzy ją zawiedli, nie dopijali do dna.
Detal 1: Rubiny na trzonie wciąż łapią światło.
Detal 2: Stopa ma osiem boków, żeby kielich nie potoczył się, gdy wypadnie z drżącej ręki.
Detal 3: Na dnie czary palec wyczuwa szorstki osad, którego nie zmyje żadna woda.

### Klucz kasztelana

Tytuł: Klucz kasztelana
Model: key.js (gotowy)
Lore: Kasztelan zamknął nim w lochu własnego brata, a potem wrzucił klucz do fosy, żeby żaden z nich nie zmienił zdania.
Detal 1: Ucho klucza wycięto w kształt koniczyny.
Detal 2: Pióro klucza ma siedem zębów — po jednym na każdy zamek wieży.
Detal 3: Żelazo wciąż pachnie mułem z fosy.
Kształt: duży żelazny klucz: ażurowe ucho w kształcie koniczyny, długi trzon z pierścieniem, rozbudowane pióro z zębami.

## Srebrny

### Róg jarla Hrafna

Tytuł: Róg jarla Hrafna
Model: horn.js (gotowy)
Lore: Jarl pił z niego tylko z wrogami, z którymi zawierał pokój, i dlatego pił rzadko.
Detal 1: Srebrne okucie na czubku wyrzeźbiono w głowę kruka.
Detal 2: Róg stoi na dwóch srebrnych nóżkach, żeby nikt nie musiał wypijać go duszkiem.
Detal 3: Kto się z niego napije, czuje na języku słony posmak morza.
Kształt: zakrzywiony kremowy róg do picia, srebrna obręcz przy brzegu i srebrny czubek z głową kruka, dwie srebrne nóżki, na których stoi.

### Zegarek kapitana

Tytuł: Zegarek kapitana
Model: watch.js (gotowy)
Lore: Kapitan zszedł ze statkiem na dno, a jego zegarek wypłynął sam i od tamtej pory wskazuje tę samą godzinę.
Detal 1: Wskazówki stanęły na jednej godzinie i nie drgną.
Detal 2: Z koronki zwisa urwany kawałek łańcuszka.
Detal 3: Przyłożony do ucha wciąż cicho tyka, choć wskazówki stoją.
Kształt: srebrny zegarek kieszonkowy z uniesioną klapką, biała tarcza z czarnymi wskazówkami, koronka u góry i kawałek łańcuszka.

### Kałamarz poety

Tytuł: Kałamarz poety
Model: inkwell.js (gotowy)
Lore: Poeta pisał tylko nocą, a rano palił wszystko, co napisał — ocalał jeden wiersz, ukryty w kałamarzu.
Detal 1: Z kałamarza wciąż sterczy długie białe pióro.
Detal 2: Na dnie zasechł atrament w kolorze nocnego nieba.
Detal 3: Kiedy nim potrząsnąć, pod zaschniętym atramentem coś szeleści. Złożona kartka?
Kształt: srebrny kałamarz na czterech nóżkach, z odchylonym wieczkiem i wbitym długim białym piórem.

## Złoty

### Korona zapomnianej królowej

Tytuł: Korona zapomnianej królowej
Model: crown.js (gotowy)
Lore: Królowa rządziła tylko dziewięć dni, a kronikarze tak się spieszyli z nowym królem, że zapomnieli wpisać jej imię.
Detal 1: Zęby korony wycięto w kształt lilii.
Detal 2: Wnętrze wyściełano ciemnoczerwonym aksamitem.
Detal 3: Jeden z rubinów jest szkłem — ktoś podmienił go jeszcze za jej życia.
Kształt: złota obręcz z wysokimi zębami w kształcie lilii, czerwone i zielone kamienie wokół, ciemnoczerwony aksamit w środku.

### Skarabeusz faraona

Tytuł: Skarabeusz faraona
Model: scarab.js (gotowy)
Lore: Położono go na sercu faraona, żeby nie zdradziło go podczas sądu bogów.
Detal 1: Skrzydła z lazurytu rozłożono jak do lotu.
Detal 2: Sześć krótkich nóżek chowa się pod złotym korpusem.
Detal 3: Palec wyczuwa na spodzie wyryte słowa: „Serce, nie świadcz przeciwko mnie”.
Kształt: złoty żuk o owalnym korpusie, z rozłożonymi skrzydłami z niebieskiego lazurytu i sześcioma krótkimi nóżkami.

### Jabłko koronacyjne

Tytuł: Jabłko koronacyjne
Model: orb.js (gotowy)
Lore: Król ściskał je podczas koronacji tak mocno, że odcisk jego dłoni został w złocie.
Detal 1: Kulę opasują złote obręcze wysadzane kamieniami.
Detal 2: Pozioma obręcz to równik, pionowa biegnie do krzyża: cały świat w jednej dłoni.
Detal 3: Pod palcami czuć płytkie wgniecenie — jabłko upadło raz, podczas zamieszek.
Kształt: złota kula opasana poziomą i pionową opaską wysadzaną kamieniami, na szczycie krzyż.

## Platynowy

### Sekstant kartografa

Tytuł: Sekstant kartografa
Model: sextant.js (gotowy)
Lore: Kartograf zmierzył nim brzeg, którego nie było na żadnej mapie, i nikomu nie zdradził, gdzie leży.
Detal 1: Na łuku wygrawerowano gęstą skalę stopni.
Detal 2: Z tyłu przykręcono drewniany uchwyt, wytarty od dłoni kartografa.
Detal 3: W lusterkach przez mgnienie oka widać brzeg, którego nie ma za twoimi plecami.
Kształt: mosiężna rama w kształcie wycinka koła ze skalą na łuku, ruchome ramię, lusterka i krótka luneta, drewniany uchwyt z tyłu.

### Klepsydra alchemika z Pragi

Tytuł: Klepsydra alchemika z Pragi
Model: hourglass.js (gotowy)
Lore: Alchemik obiecał cesarzowi, że cofnie czas, i w tej klepsydrze piasek naprawdę sypie się w górę.
Detal 1: Piasek mieni się jak sproszkowane złoto.
Detal 2: Piasek leży w górnej bańce, choć klepsydra stoi prosto.
Detal 3: Odwróć ją, a piasek i tak wróci na górę — po cichu, kiedy nikt nie patrzy.
Kształt: dwie bańki z bladoniebieskiego szkła w ramie z ciemnego drewna z toczonymi słupkami, złoty piasek w górnej bańce.

### Mechaniczny słowik cesarza

Tytuł: Mechaniczny słowik cesarza
Model: nightingale.js (gotowy)
Lore: Cesarz wolał go od prawdziwego słowika, dopóki nakręcany ptak nie zamilkł, a prawdziwy nie wrócił, żeby zaśpiewać.
Detal 1: Klatka zwęża się u góry w kopułę z cienkich prętów.
Detal 2: Zamiast oczu ptaszek ma dwa drobne kamienie.
Detal 3: Za skrzydłem schowano maleńki kluczyk do nakręcania.
Kształt: złota klatka z kopułą z prętów, w środku na drążku ptaszek z blachy z kamieniami zamiast oczu.

## Diamentowy

### Jajo carycy

Tytuł: Jajo carycy
Model: egg.js (gotowy)
Lore: Jubiler robił dla carycy jedno takie jajo na każdą Wielkanoc, a to jedno zaginęło w dniu, w którym upadło imperium.
Detal 1: Pod złotą siateczką prześwituje emalia w kolorze lodu.
Detal 2: W węzłach kratki osadzono drobne diamenty.
Detal 3: Jajo jest cięższe, niż powinno — w środku czeka niespodzianka, której nikt jeszcze nie otworzył.
Kształt: jajo z błękitnej emalii w złotej kratce, z diamentami w węzłach kratki, na złotej nóżce.

### Błękitny diament maharadży

Tytuł: Błękitny diament maharadży
Model: diamond.js (gotowy)
Lore: Każdy, kto go posiadał, tracił coś cennego — ostatni właściciel stracił tylko diament, więc uznał, że miał szczęście.
Detal 1: W słońcu rzuca na dłoń błękitne iskry.
Detal 2: Spód schodzi w ostry szpic, osadzony w małej złotej oprawie.
Detal 3: Trzymany dłużej w dłoni robi się zimny, jakby coś ci odbierał.
Kształt: duży diament w szlifie brylantowym — płaska tafla na górze, fasety korony i ostry spód — w kilku odcieniach błękitu, na małej złotej oprawie.

### Karabela hetmana

Tytuł: Karabela hetmana
Model: sabre.js (gotowy)
Lore: Hetman nosił ją tylko od święta, bo na wojnę szkoda mu było takiej szabli — dlatego przetrwała wszystkie bitwy.
Detal 1: Klinga wygina się łukiem, srebrna od jelca po sztych.
Detal 2: Głowica w kształcie orlej głowy ma oczy z rubinów.
Detal 3: Na ostrzu nie ma ani jednej szczerby — nigdy nie skrzyżowało się z inną szablą.
Kształt: zakrzywiona srebrna klinga, krzyżowy jelec, rękojeść zakończona orlą głową, złote okucia i czerwone kamienie.
