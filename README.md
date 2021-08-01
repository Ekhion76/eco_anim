# eco_anim
Fejlesztői szkript animációk keresésére

FONTOS: letöltés után a mappa neve "eco_anim" legyen, töröld a "-main" suffixet.

A GTA5 ben több, mint 150 ezer animáció található, ezek egy része prop-okra, állatokra használható. Nehéz megtalálni azt az animációt, ami a szkriptedhez legjobban megfelel, ebben próbál ez a szkript segíteni.

Ez egy fejlesztőknek szánt segédeszköz, egyszerűen van van összerakva, ne várj nagyon kidolgozott funkciókat :)

Több ped is beállítható, férfi/női stb... különböző anim flag-eket tesztelni.

Funkciók:
 - ha rákattintasz egy animra, a dict-et és az anim-ot vágólapra másolja, neked már csak CTRL+V-t kell nyomj, hogy a szkriptedbe beilleszd.
 - kereső
 - több ped beállítása (különböző flag-ekkel)
 - méri az animáció időtartamát
 - Alexguirre féle animáció listát használja (animations.js): JS: view-source:https://alexguirre.github.io/animations-list/js/animations.js HTML: https://alexguirre.github.io/animations-list/ 

Használat:
 - /anim paranccsal indul, megjelenik a nui felület
 - i betűvel átkerül a fókusz a nui felületre, lehet animációra klikkelni, keresni
 - animáció névre klikkelve megjelennek az NPC-k előtted és megkezdik az animot
 - ESC billentyűvel  lekerül a fókusz és mozoghatsz, de NUI és az NPC-k maradnak
 - BEZÁR gombbal, NPC-k törlésre kerülnek, NUI felület eltűnik

Kaszinó animok ki vannak kommentelve (animations.js)

![ecoanim preview](https://github.com/Ekhion76/eco_anim/blob/main/preview_images/eco_anim.jpg)
