# Roadmap — Hajj Simulator naar volwaardige game

## ✅ Fase 1 — Fundament (v4, klaar)
- Modulaire projectstructuur (14 js-bestanden i.p.v. één HTML)
- Render-upgrade: ACES tone mapping, sRGB, 2048-schaduwen, hemisfeerlicht
- Luchtkoepel met gradient + sterrenveld bij nacht, per-scène exposure ("grading")
- Procedurele texturen: marmer (Haram/mas'a/Nabawi), zand, asfalt, ramen
- Grotere wereld: ruimere Haram (arcade r16), Mekka-skyline met Abraj al-Bait
  klokkentoren + hotels + bergrand, Mina-tentenstad, grotere Arafat-vlakte,
  langere straat met dorpsmoskee
- Rennen met Shift, voetstap-cadans en animatie schalen mee

## Fase 2 — Wereld & beweging
- [ ] Doorlopende Haram-wereld: plein → poort → mataf zonder scène-knip
- [ ] Camera-botsing met muren/zuilen (raycast i.p.v. clamp)
- [ ] Minimap / kompas naar het actieve doel
- [ ] Dag-nachtcyclus binnen een scène (Arafat: middag → zonsondergang)
- [ ] Meer Mina: tent van binnen, overnachten 11–13 Dhul Hijjah, 3 jamarat

## Fase 3 — Graphics
- [ ] GLTF-modellen voor Ka'ba, klokkentoren en poorten (Blender-pipeline;
      de Blender-MCP is beschikbaar om assets te bouwen/exporteren)
- [ ] Skinned characters met echte loop-animaties (mixamo-achtig)
- [ ] Post-processing: bloom op minaret-lampen, zachte vignette in-engine
- [ ] Instanced rendering voor de menigte (duizenden pelgrims i.p.v. ~90)
- [ ] Hitte-flikkering op Arafat, stofdeeltjes, vogels rond de minaretten

## Fase 4 — Gameplay & educatie
- [ ] Opslaan van voortgang (localStorage): scène, du'a-boek, quizscore
- [ ] Moeilijkheidsgraden: "begeleid" (huidige hints) vs "zelfstandig" (examenstand)
- [ ] Meer encounters (verloren kind, rolstoel-duwen, vertaalhulp)
- [ ] Umrah-modus (tawaf + sa'i + knippen) als korte aparte reis
- [ ] Echte audio: talbiyah-recitatie, adhan op de juiste momenten (met respect
      voor rechten/bronnen)
- [ ] Toegankelijkheid: tekstgrootte, kleurenblind-vriendelijke markeringen

## Fase 5 — Distributie
- [ ] PWA (offline spelen, thuisscherm-installatie op telefoon)
- [ ] Meertalig: NL → EN/AR/TR/FR via een strings-bestand
- [ ] Drie.js naar recente versie + Vite-build (wanneer modules gewenst zijn)
