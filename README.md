# Bluffi & Fakta - Moninpeli 🎮

Bluffi & Fakta on reaaliaikainen seurapeli, jota pelataan yhdessä samassa huoneessa. Yksi laite (esim. TV tai tabletti) toimii pelin päänäyttönä, ja pelaajat liittyvät peliin omilla älypuhelimillaan PIN-koodin avulla.

## 🚀 Pikakäyttöohje (Pelaajille)

Tämä peli tarvitsee **yhden yhteisen ruudun** ja kaikille pelaajille **omat puhelimet**.

1. **Avaa TV-ruutu:** Mene TV:n tai tietokoneen selaimella osoitteeseen:  
   👉 [https://bluffi-peli.onrender.com/tv.html](https://bluffi-peli.onrender.com/tv.html)
2. **Liity puhelimella:** Kaikki pelaajat menevät puhelimillaan osoitteeseen:  
   👉 [https://bluffi-peli.onrender.com](https://bluffi-peli.onrender.com)
3. **Pelaa:** Syötä TV:ssä näkyvä PIN-koodi, keksi uskottava valhe ja yritä löytää oikea fakta muiden joukosta!

---

## Teknologiat

* **Backend:** Node.js, Express, WebSockets (ws)
* **Frontend:** HTML, CSS, Vanilla JavaScript, PWA (Progressive Web App)
* **Hosting:** Render (Backend)

## Ominaisuudet

* Pelaajien liittyminen reaaliajassa huonekoodilla
* Websocket-pohjainen nopea tiedonsiirto
* "Lisää aloitusnäytölle" (PWA) tuki mobiililaitteille
* Pelaajien nimimerkkien ja syötteiden validointi
* Automaattinen epäaktiivisten pelien siivous palvelimelta
