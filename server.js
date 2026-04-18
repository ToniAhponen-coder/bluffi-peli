const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, 'public')));

const games = {};
const MAX_PLAYERS = 20;
const ROUND_COUNT = 10;

// Salli localhost ja Renderin domain (tai kaikki domainit tuotannossa)
const isProduction = process.env.NODE_ENV === 'production';

const questions = [
    // --- Maantieto ---
    { q: "Mikä on Ranskan pääkaupunki?", a: "Pariisi" },
    { q: "Mikä on maailman pisin joki?", a: "Niili" },
    { q: "Mikä on maailman korkein vuori?", a: "Mount Everest" },
    { q: "Mikä on maailman pienin valtio?", a: "Vatikaani" },
    { q: "Mikä on asukasluvultaan maailman suurin kaupunki?", a: "Tokio" },
    { q: "Minkä maan pääkaupunki on Ottawa?", a: "Kanadan" },
    { q: "Mikä on Etelä-Amerikan suurin valtio?", a: "Brasilia" },
    { q: "Missä maassa sijaitsee Taj Mahal?", a: "Intiassa" },
    { q: "Mikä on maailman syvin järvi?", a: "Baikaljärvi" },
    { q: "Mikä on Afrikan mantereen suurin valtio pinta-alaltaan?", a: "Algeria" },
    { q: "Millä merellä Kypros sijaitsee?", a: "Välimerellä" },
    { q: "Mikä on maailman suurin saari?", a: "Grönlanti" },
    { q: "Missä maassa sijaitsevat Gizan pyramidit?", a: "Egyptissä" },
    { q: "Mikä on Yhdysvaltojen suurin osavaltio pinta-alaltaan?", a: "Alaska" },
    { q: "Mikä on Suomen suurin järvi?", a: "Saimaa" },
    { q: "Mikä on Suomen pohjoisin kunta?", a: "Utsjoki" },
    { q: "Mikä on Ruotsin pääkaupunki?", a: "Tukholma" },
    { q: "Minkä valtion alueella on Pisan kalteva torni?", a: "Italian" },
    { q: "Mikä on Euroopan pisin joki?", a: "Volga" },
    { q: "Mikä valtio omistaa Pääsiäissaaret?", a: "Chile" },
    { q: "Mikä on maailman väkirikkain maa?", a: "Intia" },
    { q: "Missä kaupungissa sijaitsee Colosseum?", a: "Roomassa" },
    { q: "Mikä joki virtaa Lontoon halki?", a: "Thames" },
    { q: "Mikä on Espanjan pääkaupunki?", a: "Madrid" },
    { q: "Mikä on Norjan valuutta?", a: "Kruunu" },
    { q: "Missä maanosassa sijaitsee Amazonin sademetsä?", a: "Etelä-Amerikassa" },
    { q: "Mikä on maailman kuivin aavikko?", a: "Atacama" },
    { q: "Mikä vuoristo erottaa Euroopan ja Aasian?", a: "Uralvuoret" },
    { q: "Missä maassa on eniten tulivuoria?", a: "Indonesiassa" },
    { q: "Mikä on Suomen eteläisin kaupunki?", a: "Hanko" },

    // --- Eläimet ja Luonto ---
    { q: "Mikä on maailman nopein maaeläin?", a: "Gepardi" },
    { q: "Mikä on suurin nykyään elävä eläin?", a: "Sinivalas" },
    { q: "Kuinka monta jalkaa on hämähäkillä?", a: "Kahdeksan" },
    { q: "Mikä lintu munii maailman suurimmat munat?", a: "Strutsi" },
    { q: "Mikä on ainoa lentokykyinen nisäkäs?", a: "Lepakko" },
    { q: "Kuinka monta sydäntä mustekalalla on?", a: "Kolme" },
    { q: "Mikä eläin on Suomen kansalliseläin?", a: "Karhu" },
    { q: "Mitä bambua syövä karhu on kotoisin Kiinasta?", a: "Jättiläispanda" },
    { q: "Mikä koirarotu on kuuluisa sinisestä kielestään?", a: "Chow chow" },
    { q: "Mikä on maailman pisin käärme?", a: "Verkkopyton" },
    { q: "Mihin heimoon leijona kuuluu?", a: "Kissaeläimiin" },
    { q: "Mikä nisäkäs munii munia?", a: "Vesinokkaeläin" },
    { q: "Kuinka pitkä on norsun tiineysaika kuukausina (noin)?", a: "22 kuukautta" },
    { q: "Mikä on Suomen kansallislintu?", a: "Laulujoutsen" },
    { q: "Mikä on Suomen yleisin puulaji?", a: "Mänty" },
    { q: "Mikä on maailman nopein lintu?", a: "Muuttohaukka" },
    { q: "Minkä eläimen uros synnyttää poikaset?", a: "Merihevosen" },
    { q: "Mikä on maailman suurin kissaeläin?", a: "Tiikeri" },
    { q: "Kuinka monta silmää mehiläisellä on?", a: "Viisi" },
    { q: "Mitä ainetta sarvikuonon sarvi pääasiassa on?", a: "Keratiinia" },
    { q: "Mikä on maailman myrkyllisin käärme?", a: "Aavikkotaipaani" },
    { q: "Mikä kala pystyy uimaan takaperin?", a: "Ankerias" },
    { q: "Mille hyönteisellä on makuaisti jaloissaan?", a: "Perhosella" },
    { q: "Mikä eläin voi nukkua jopa kolme vuotta putkeen?", a: "Etana" },
    { q: "Minkä värinen on jääkarhun iho?", a: "Musta" },

    // --- Tiede ja Avaruus ---
    { q: "Mikä on aurinkokuntamme suurin planeetta?", a: "Jupiter" },
    { q: "Mikä planeetta tunnetaan 'punaisena planeettana'?", a: "Mars" },
    { q: "Mikä on kemiallinen merkki vedelle?", a: "H2O" },
    { q: "Mikä on kumin pääraaka-aine?", a: "Kautsu" },
    { q: "Kuka kehitti suhteellisuusteorian?", a: "Albert Einstein" },
    { q: "Mikä on valon nopeus tyhjiössä (noin km/s)?", a: "300 000 km/s" },
    { q: "Mistä alkuaineesta timantti koostuu?", a: "Hiilestä" },
    { q: "Kuinka monta luuta on aikuisen ihmisen kehossa?", a: "206" },
    { q: "Mikä on jaksollisen järjestelmän ensimmäinen alkuaine?", a: "Vety" },
    { q: "Mikä on ihmiskehon suurin elin?", a: "Iho" },
    { q: "Kuka keksi penisilliinin?", a: "Alexander Fleming" },
    { q: "Mikä on maapallon sisin kerros?", a: "Sisäydin" },
    { q: "Mitä kaasua on eniten maapallon ilmakehässä?", a: "Typpeä" },
    { q: "Mikä on kullan kemiallinen merkki?", a: "Au" },
    { q: "Kuka oli ensimmäinen ihminen avaruudessa?", a: "Juri Gagarin" },
    { q: "Mikä on raudan kemiallinen merkki?", a: "Fe" },
    { q: "Mikä elin pumppaa verta kehossa?", a: "Sydän" },
    { q: "Mitä tarkoittaa DNA:n kirjain D?", a: "Deoksi" },
    { q: "Mitä kutsutaan myös 'naurukaasuksi'?", a: "Typpioksiduulia" },
    { q: "Missä ruumiinosassa sijaitsee vasara, alasin ja jalustin?", a: "Korvassa" },
    { q: "Mikä on aurinkokuntamme kylmin planeetta?", a: "Uranus" },
    { q: "Kuka esitti ensimmäisenä evoluutioteorian luonnonvalinnan kautta?", a: "Charles Darwin" },
    { q: "Mikä on maailmankaikkeuden yleisin alkuaine?", a: "Vety" },
    { q: "Minkä lämpötila on absoluuttinen nollapiste celsiuksina?", a: "-273,15" },
    { q: "Mikä on ihmisen vahvin lihas suhteessa kokoonsa?", a: "Puremalihas" },
    { q: "Mikä verihiutaleiden päätehtävä on?", a: "Veren hyydyttäminen" },
    { q: "Mikä on lyijyn kemiallinen merkki?", a: "Pb" },
    { q: "Kuinka monta kromosomia ihmisen solussa on normaalisti?", a: "46" },
    { q: "Mikä on Maan ainoa luonnollinen kiertolainen?", a: "Kuu" },

    // --- Historia ---
    { q: "Minä vuonna ensimmäinen maailmansota alkoi?", a: "1914" },
    { q: "Kuka oli Yhdysvaltain ensimmäinen presidentti?", a: "George Washington" },
    { q: "Kuka löysi Amerikan vuonna 1492?", a: "Kristoffer Kolumbus" },
    { q: "Minä vuonna Suomiitsenäistyi?", a: "1917" },
    { q: "Mikä laiva upposi neitsytmatkallaan vuonna 1912?", a: "Titanic" },
    { q: "Kuka oli Ranskan keisari 1800-luvun alussa?", a: "Napoleon Bonaparte" },
    { q: "Mikä muuri murtui vuonna 1989?", a: "Berliinin muuri" },
    { q: "Kuka oli Suomen ensimmäinen presidentti?", a: "K.J. Ståhlberg" },
    { q: "Minä vuonna toinen maailmansota päättyi?", a: "1945" },
    { q: "Mikä kaupunki tuhoutui Vesuviuksen purkauksessa vuonna 79?", a: "Pompeji" },
    { q: "Kuka johti Neuvostoliittoa toisen maailmansodan aikana?", a: "Josif Stalin" },
    { q: "Kuka oli Rooman diktaattori, joka murhattiin vuonna 44 eaa.?", a: "Julius Caesar" },
    { q: "Mikä suomalainen keksintö patentoitiin vuonna 1932 A.I. Virtasen toimesta?", a: "AIV-rehu" },
    { q: "Kuka oli Egyptin viimeinen faarao?", a: "Kleopatra" },
    { q: "Kuka kirjoitti 95 teesiä, jotka käynnistivät uskonpuhdistuksen?", a: "Martti Luther" },
    { q: "Missä kaupungissa J.F. Kennedy salamurhattiin?", a: "Dallasissa" },
    { q: "Mikä sota käytiin Suomessa vuosina 1939-1940?", a: "Talvisota" },
    { q: "Kuka ritarikunnan naissotilas poltettiin roviolla Rouenissa 1431?", a: "Jeanne d'Arc" },
    { q: "Minä vuonna Apollo 11 laskeutui kuuhun?", a: "1969" },
    { q: "Kuka on pitkäaikaisin Suomen presidentti?", a: "Urho Kekkonen" },
    { q: "Mitä historiallista ajanjaksoa kutsutaan myös 'pimeäksi keskiajaksi'?", a: "Varhaiskeskiaikaa" },
    { q: "Mikä sivilisaatio rakensi Machu Picchun?", a: "Inkat" },
    { q: "Minkä valtakunnan hallitsija oli Tsingis-kaani?", a: "Mongolivaltakunnan" },
    { q: "Kuka teki ensimmäisen yksinlennon Atlantin yli?", a: "Charles Lindbergh" },
    { q: "Mikä tunnettu sota päättyi vuonna 1975?", a: "Vietnamin sota" },

    // --- Kulttuuri ja Taide ---
    { q: "Kuka maalasi Mona Lisan?", a: "Leonardo da Vinci" },
    { q: "Kuka kirjoitti Tuntemattoman sotilaan?", a: "Väinö Linna" },
    { q: "Mikä on J.R.R. Tolkienin tunnetuin kirjasarja?", a: "Taru sormusten herrasta" },
    { q: "Kuka maalasi Tähtikirkas yö -teoksen?", a: "Vincent van Gogh" },
    { q: "Mikä on William Shakespearen tunnetuin näytelmä nuorista rakavaisista?", a: "Romeo ja Julia" },
    { q: "Kuka kirjoitti Seitsemän veljestä?", a: "Aleksis Kivi" },
    { q: "Mikä on maailman käännetyin kirja?", a: "Raamattu" },
    { q: "Kuka sävelsi Finlandia-hymnin?", a: "Jean Sibelius" },
    { q: "Missä museossa Mona Lisa sijaitsee?", a: "Louvressa" },
    { q: "Mikä on Kalevalan sankarin, Väinämöisen, soitin?", a: "Kantele" },
    { q: "Kuka loi Aku Ankan?", a: "Walt Disney" },
    { q: "Mikä on Agatha Christien tunnetuin belgialainen salapoliisi?", a: "Hercule Poirot" },
    { q: "Kuka on kirjoittanut Harry Potter -kirjat?", a: "J.K. Rowling" },
    { q: "Mitä taidesuuntausta Salvador Dalí edusti?", a: "Surrealismia" },
    { q: "Kuka kirjoitti teoksen 'Rikos ja rangaistus'?", a: "Fjodor Dostojevski" },
    { q: "Mikä patsas lahjoitettiin Ranskalta Yhdysvalloille?", a: "Vapaudenpatsas" },
    { q: "Minkä niminen on Muumipeikon paras ystävä?", a: "Nuuskamuikkunen" },
    { q: "Kuka ohjasi elokuvan Titanic (1997)?", a: "James Cameron" },
    { q: "Mikä yhtye esitti kappaleen 'Bohemian Rhapsody'?", a: "Queen" },
    { q: "Kuka näytteli pääosaa elokuvassa Forrest Gump?", a: "Tom Hanks" },

    // --- Viihde ja Pop-kulttuuri ---
    { q: "Mikä on kaikkien aikojen tuottoisin elokuva?", a: "Avatar" },
    { q: "Mikä on maailman käytetyin suoratoistopalvelu musiikille?", a: "Spotify" },
    { q: "Kuka on popin kuningas?", a: "Michael Jackson" },
    { q: "Mikä on Homer Simpsonin vaimon nimi?", a: "Marge" },
    { q: "Mikä on suosituin videopeli maailmassa (myytyjen kopioiden mukaan)?", a: "Minecraft" },
    { q: "Kuka voitti ensimmäisen Suomen Idols-kilpailun vuonna 2004?", a: "Hanna Pakarinen" },
    { q: "Mikä artisti lauloi kappaleen 'Rolling in the Deep'?", a: "Adele" },
    { q: "Mikä on Batmanin salainen henkilöllisyys?", a: "Bruce Wayne" },
    { q: "Kuka esittää Jack Sparrow'ta Pirates of the Caribbean -elokuvissa?", a: "Johnny Depp" },
    { q: "Mikä on Pokémon-sarjan päähahmon nimi?", a: "Ash Ketchum" },
    { q: "Mikä on Netflixin kaikkien aikojen katsotuin sarja?", a: "Squid Game" },
    { q: "Mikä oli ensimmäinen kokonaan tietokoneella animoitu elokuva?", a: "Toy Story" },
    { q: "Kenellä on eniten seuraajia Instagramissa (henkilö)?", a: "Cristiano Ronaldo" },
    { q: "Mikä on James Bondin agenttinumero?", a: "007" },
    { q: "Kuka lauloi kappaleen 'Hard Rock Hallelujah' Euroviisuissa?", a: "Lordi" },
    { q: "Minkä niminen on Tähtien sota -elokuvien vihreä jedimestari?", a: "Yoda" },
    { q: "Mikä oli ensimmäinen kaupallinen pelikonsoli?", a: "Magnavox Odyssey" },
    { q: "Kuka näytteli Neo-hahmoa Matrix-elokuvissa?", a: "Keanu Reeves" },
    { q: "Minkä bändin nokkamies oli Kurt Cobain?", a: "Nirvana" },
    { q: "Mikä on Suomen katsotuin elokuva elokuvateattereissa?", a: "Tuntematon sotilas (1955)" },

    // --- Urheilu ---
    { q: "Missä lajissa Matti Nykänen oli maailmanmestari?", a: "Mäkihypyssä" },
    { q: "Mikä maa on voittanut eniten jalkapallon miesten maailmanmestaruuksia?", a: "Brasilia" },
    { q: "Kuinka pitkä on maratonjuoksun pituus (kilometreinä)?", a: "42,195 km" },
    { q: "Kuka on tehnyt eniten maaleja NHL:n runkosarjassa?", a: "Wayne Gretzky" },
    { q: "Missä kaupungissa järjestettiin vuoden 1952 kesäolympialaiset?", a: "Helsingissä" },
    { q: "Mikä on jääkiekon MM-kisoissa jaettavan pokaalin nimi?", a: "Poika" },
    { q: "Kuka pitää hallussaan miesten 100 metrin juoksun maailmanennätystä?", a: "Usain Bolt" },
    { q: "Kuinka monta kenttäpelaajaa on yhdellä jalkapallojoukkueella kentällä?", a: "11" },
    { q: "Mitä lajia Kimi Räikkönen on ajanut ammatikseen?", a: "Formula 1" },
    { q: "Mikä maa on voittanut eniten jääkiekon olympiakultia?", a: "Kanada" },
    { q: "Missä lajissa pelataan Super Bowl?", a: "Amerikkalaisessa jalkapallossa" },
    { q: "Minkä urheilulajin ammattilainen oli Muhammad Ali?", a: "Nyrkkeilyn" },
    { q: "Mitä väriä on Tour de France -pyöräilykilpailun johtajan paita?", a: "Keltainen" },
    { q: "Kuka suomalainen juoksija voitti kultaa Münchenissä 1972?", a: "Pekka Vasala" },
    { q: "Kuka suomalainen keihäänheittäjä voitti kultaa vuoden 2007 MM-kisoissa?", a: "Tero Pitkämäki" },
    { q: "Kuinka monta ruutua on dartstaulun ulkokehällä?", a: "20" },
    { q: "Mikä on tenniksen vanhin Grand Slam -turnaus?", a: "Wimbledon" },
    { q: "Kuka oli ensimmäinen suomalainen Formula 1 -maailmanmestari?", a: "Keke Rosberg" },
    { q: "Mikä urheiluväline painaa miesten yleisurheilussa 7,26 kg?", a: "Kuula" },
    { q: "Mitä peliä pelataan NBA-liigassa?", a: "Koripalloa" },

    // --- Ruoka ja Juoma ---
    { q: "Mikä on italialainen ruoka, jossa on taikinapohja ja päällä juustoa ja tomaattikastiketta?", a: "Pizza" },
    { q: "Mistä maasta sushi on kotoisin?", a: "Japanista" },
    { q: "Mikä on pääraaka-aine guacamolessa?", a: "Avokado" },
    { q: "Mikä vihannes saa Popeye-merimiehen vahvaksi?", a: "Pinaatti" },
    { q: "Mistä viljasta mämmi pääasiassa valmistetaan?", a: "Rukiista" },
    { q: "Mikä on maailman kulutetuin juoma heti veden jälkeen?", a: "Tee" },
    { q: "Minkä niminen on perinteinen karjalainen leivonnainen, jossa on riisipuuroa ruistaikinakuoressa?", a: "Karjalanpiirakka" },
    { q: "Mitä on italialainen 'gelato'?", a: "Jäätelöä" },
    { q: "Mikä hedelmä on tunnettu C-vitamiinipitoisuudestaan ja sen kuori on oranssi?", a: "Appelsiini" },
    { q: "Mikä on ranskalainen aamu- tai välipalaleivonnainen, joka on muodoltaan puolikuu?", a: "Croissant" },
    { q: "Mitä lihaa on perinteisessä wieninleikkeessä?", a: "Vasikanlihaa" },
    { q: "Mistä marjasta tehdään lakkalikööriä?", a: "Hilla (Lakka)" },
    { q: "Mikä on keltaista, tulista ja sitä käytetään usein intialaisessa ruoassa?", a: "Curry" },
    { q: "Minkä värinen on kypsä Granny Smith -omena?", a: "Vihreä" },
    { q: "Mikä juoma valmistetaan paahdetuista kahvipavuista?", a: "Kahvi" },
    { q: "Mitä on tofu?", a: "Soijapapujuustoa" },
    { q: "Mikä leipä on rinkelimäinen ja kotoisin New Yorkista?", a: "Bagel" },
    { q: "Mikä alkoholijuoma yhdistetään useimmiten Venäjään?", a: "Vodka" },
    { q: "Mikä on makea, ruskea herkku, joka valmistetaan kaakaopavuista?", a: "Suklaa" },

    // --- Sekalaista yleistietoa ---
    { q: "Mikä on hätänumero Suomessa?", a: "112" },
    { q: "Kuinka monta päivää on karkausvuodessa?", a: "366" },
    { q: "Mitä tarkoittaa lyhenne WWW?", a: "World Wide Web" },
    { q: "Mikä on kuukauden kolmas päivä, jos ensimmäinen on maanantai?", a: "Keskiviikko" },
    { q: "Mikä väri saadaan sekoittamalla sinistä ja keltaista?", a: "Vihreä" },
    { q: "Mikä on Suomen eduskunnan kansanedustajien lukumäärä?", a: "200" },
    { q: "Kuinka monta nollaa on miljoonassa?", a: "Kuusi" },
    { q: "Mikä on maailman suosituin hakukone?", a: "Google" },
    { q: "Kuinka monta sivua on kuutiossa?", a: "Kuusi" },
    { q: "Mikä on shakkilaudan nappuloiden kokonaismäärä pelin alussa?", a: "32" },
    { q: "Mikä kieli on maailman puhutuin äidinkieli?", a: "Mandariinikiina" },
    { q: "Minkä yrityksen perusti Bill Gates?", a: "Microsoft" },
    { q: "Mitä tarkoittaa lyhenne EU?", a: "Euroopan unioni" },
    { q: "Kuinka monta tuntia on yhdessä vuorokaudessa?", a: "24" },
    { q: "Mikä on vastakohta sanalle 'synonyymi'?", a: "Antonyymi" },
    { q: "Mikä on suurin yksinumeroinen alkuluku?", a: "7" },
    { q: "Mikä on Suomen kansallislaulun nimi?", a: "Maamme" },
    { q: "Kuka oli Yhdysvaltain presidentti ennen Joe Bidenia?", a: "Donald Trump" },
    { q: "Mikä on aakkosten viides kirjain?", a: "E" },
    { q: "Minkä muotoinen on liikennemerkki 'Kärkikolmio'?", a: "Kolmio" },

    // --- Vielä hieman lisää satunnaisia ---
    { q: "Mikä eläin ääntelee sanomalla 'Kvaak'?", a: "Ankka" },
    { q: "Mikä on Suomen suurin saari merialueilla?", a: "Ahvenanmanner" },
    { q: "Mikä on pitkän pituuden SI-perusyksikkö?", a: "Metri" },
    { q: "Mikä on Rooman valtakunnan kieli?", a: "Latina" },
    { q: "Mitä väriä smaragdi edustaa?", a: "Vihreää" },
    { q: "Mikä on ihmisen normaali ruumiinlämpö celsiusasteina?", a: "Noin 37 astetta" },
    { q: "Kuinka monta minuuttia on yhdessä asteessa (kulmamitassa)?", a: "60" },
    { q: "Mikä on maailman suurin matkustajalentokone?", a: "Airbus A380" },
    { q: "Mitä nimitystä käytetään kahden ihmisen laulamasta laulusta?", a: "Duetto" },
    { q: "Mikä on maailman tunnetuin kryptovaluutta?", a: "Bitcoin" },
    { q: "Kuka perusti Applen yhdessä Steve Wozniakin kanssa?", a: "Steve Jobs" },
    { q: "Mikä on ruotsiksi 'Kiitos'?", a: "Tack" },
    { q: "Mikä on taivaan sateenkaaren ylin väri?", a: "Punainen" },
    { q: "Mikä lintu toimittaa tarinoiden mukaan vauvoja?", a: "Haikara" },
    { q: "Kuinka monta pelaajaa on yhdessä jääkiekkojoukkueessa jäällä kerrallaan?", a: "Kuusi" },
    { q: "Mikä on aurinkokunnan pienin planeetta?", a: "Merkurius" },
    { q: "Missä kuussa vietetään Ystävänpäivää?", a: "Helmikuussa" },
    { q: "Mikä on englannin kielen yleisin kirjain?", a: "E" },
    { q: "Kuinka monta millimetriä on yhdessä senttimetrissä?", a: "10" },
    { q: "Mitä eläintä pidetään laiskana, koska se nukkuu puissa suurimman osan päivästä?", a: "Laiskiainen" }
];

// --- helpers ---
function sanitize(str, maxLen = 10) {
  return String(str).replace(/[<>]/g, "").trim().substring(0, maxLen);
}

function safeSend(ws, data) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

function genCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

function genToken() {
  return crypto.randomBytes(16).toString('hex');
}

function rateLimit(ws) {
  const now = Date.now();
  ws.reqTimes = (ws.reqTimes || []).filter(t => now - t < 1000);
  ws.reqTimes.push(now);
  return ws.reqTimes.length < 15;
}

// SIIVOUS: Poistetaan peli muistista, jos se on ollut epäaktiivinen 1 tunnin
setInterval(() => {
  const now = Date.now();
  for (const code in games) {
    if (now - games[code].lastActive > 3600000) { 
      console.log(`Siivotaan vanha peli: ${code}`);
      delete games[code];
    }
  }
}, 600000); // Suoritetaan 10 minuutin välein

// --- GAME FLOW ---
function startRound(game) {
  game.round++;
  game.lastActive = Date.now();

  if (game.round > ROUND_COUNT) {
    endGame(game);
    return;
  }

  const q = questions[Math.floor(Math.random() * questions.length)];
  game.current = {
    question: q,
    answers: [],
    votes: {}
  };

  const impostorIndex = Math.floor(Math.random() * game.players.length);
  game.impostorId = game.players[impostorIndex].id;

  game.players.forEach(p => {
    p.answer = null;
    p.vote = null;

    safeSend(p.ws, {
      type: 'ROLE_ASSIGNED',
      payload: {
        role: p.id === game.impostorId ? 'IMPOSTOR' : 'PLAYER',
        question: q.q
      }
    });
  });

  safeSend(game.host, {
    type: 'GAME_STARTED',
    payload: { question: q.q, round: game.round }
  });
}

function endRound(game) {
  game.lastActive = Date.now();
  const correct = game.current.question.a;

  const results = game.players.map(p => {
    const isCorrect = p.vote === correct;
    let pts = 0;

    if (p.id === game.impostorId) {
      const votesOnImpostor = game.players.filter(x => x.vote === p.answer).length;
      pts = votesOnImpostor === 0 ? 150 : 0;
    } else {
      pts = isCorrect ? 100 : 0;
    }

    p.score += pts;

    return {
      name: p.name,
      score: p.score,
      roundPoints: pts,
      isCorrect
    };
  });

  safeSend(game.host, {
    type: 'GAME_RESULTS',
    payload: { correctAnswer: correct, results }
  });

  setTimeout(() => startRound(game), 4000);
}

function endGame(game) {
  game.lastActive = Date.now();
  const sorted = [...game.players].sort((a,b) => b.score - a.score);

  safeSend(game.host, {
    type: 'FINAL_RESULTS',
    payload: { results: sorted }
  });
}

// --- WS ---
wss.on('connection', (ws, req) => {
  // Joustavampi origin-tarkistus tuotantoon
  const origin = req.headers.origin;
  if (isProduction && origin && !origin.includes("onrender.com")) {
    ws.close();
    return;
  }

  ws.on('message', (msg) => {
    if (!rateLimit(ws)) return;

    let data;
    try { data = JSON.parse(msg); } catch { return; }

    const { type, payload } = data;

    // CREATE
    if (type === 'CREATE_GAME') {
      const code = genCode();

      games[code] = {
        host: ws,
        players: [],
        round: 0,
        lastActive: Date.now()
      };

      ws.room = code;
      ws.isHost = true;

      safeSend(ws, { type: 'GAME_CREATED', payload: { roomCode: code } });
    }

    // JOIN
    if (type === 'JOIN_GAME') {
      const { roomCode, playerName } = payload;
      const game = games[roomCode];
      if (!game || game.players.length >= MAX_PLAYERS) return;

      const token = genToken();
      // RAJOITUS: Nimimerkki max 10 merkkiä
      const cleanName = sanitize(playerName, 10);

      const player = {
        id: crypto.randomUUID(),
        name: cleanName,
        ws,
        token,
        score: 0
      };

      ws.playerId = player.id;
      ws.room = roomCode;
      ws.token = token;

      game.players.push(player);
      game.lastActive = Date.now();

      safeSend(ws, { type: 'JOIN_SUCCESS', payload: { token } });

      safeSend(game.host, {
        type: 'PLAYER_JOINED',
        payload: { players: game.players.map(p => ({ name: p.name })) }
      });
    }

    // RECONNECT
    if (type === 'RECONNECT') {
      const { roomCode, token } = payload;
      const game = games[roomCode];
      if (!game) return;

      const player = game.players.find(p => p.token === token);
      if (!player) return;

      player.ws = ws;
      ws.playerId = player.id;
      ws.room = roomCode;
      ws.token = token;
      game.lastActive = Date.now();
    }

    // START
    if (type === 'START_GAME') {
      const game = games[ws.room];
      if (!game || ws !== game.host) return;

      startRound(game);
    }

 // ANSWER
    if (type === 'SUBMIT_ANSWER') {
      const game = games[ws.room];
      if (!game) return;
      game.lastActive = Date.now();

      const p = game.players.find(x => x.id === ws.playerId);
      if (!p || p.answer) return;

      p.answer = sanitize(payload.answer, 10);
      game.current.answers.push(p.answer);

      // TÄMÄ RIVI PUUTTUI! Ilmoittaa TV-ruudulle, kuka vastasi:
      safeSend(game.host, { type: 'PLAYER_SUBMITTED', payload: { playerName: p.name } });

      if (game.current.answers.length === game.players.length) {
        
        let votingOptions = [...game.current.answers, game.current.question.a];
        votingOptions.sort(() => Math.random() - 0.5);

        safeSend(game.host, {
          type: 'SHOW_ANSWERS',
          payload: { answers: votingOptions }
        });

        game.players.forEach(pl => {
          safeSend(pl.ws, {
            type: 'START_VOTING',
            payload: { answers: votingOptions }
          });
        });
      }
    }

    // VOTE
    if (type === 'SUBMIT_VOTE') {
      const game = games[ws.room];
      if (!game) return;
      game.lastActive = Date.now();

      const p = game.players.find(x => x.id === ws.playerId);
      if (!p || p.vote) return;

      p.vote = payload.vote;

      if (game.players.every(pl => pl.vote)) {
        endRound(game);
      }
    }
  });

ws.on('close', () => {
    if (ws.isHost && ws.room) {
      // Jos TV/host poistuu, peli voidaan merkitä poistettavaksi pian
      if (games[ws.room]) games[ws.room].lastActive = 0; 
    } else if (ws.room && ws.playerId) {
      // Pelaaja poistui tai päivitti sivun
      const game = games[ws.room];
      if (game) {
        if (game.round === 0) {
          // Jos peli ei ole vielä alkanut, poistetaan pelaaja kokonaan listalta
          game.players = game.players.filter(p => p.id !== ws.playerId);
          
          // Päivitetään TV-ruudun nimilista
          safeSend(game.host, {
            type: 'PLAYER_JOINED',
            payload: { players: game.players.map(p => ({ name: p.name })) }
          });
        } else {
          // Jos peli on JO käynnissä, syötetään automaattivastaus, jotta peli ei jumiudu
          const p = game.players.find(x => x.id === ws.playerId);
          if (p && !p.answer) {
            p.answer = "-Luovutti-";
            game.current.answers.push(p.answer);
            
            // Tarkistetaan, oliko tämä viimeinen puuttuva vastaus
            if (game.current.answers.length === game.players.length) {
              let votingOptions = [...game.current.answers, game.current.question.a];
              votingOptions.sort(() => Math.random() - 0.5); // Sekoitetaan

              safeSend(game.host, {
                type: 'SHOW_ANSWERS',
                payload: { answers: votingOptions }
              });

              game.players.forEach(pl => {
                safeSend(pl.ws, {
                  type: 'START_VOTING',
                  payload: { answers: votingOptions }
                });
              });
            }
          }
        }
      }
    }
  });
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));