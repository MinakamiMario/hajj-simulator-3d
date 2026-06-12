# رحلة الحج — Hajj Simulator 3D (v4)

Een educatieve 3D third-person game (Nederlands) waarin je de volledige Hajj beleeft:
van de Niyyah thuis tot de terugkeer als Hajji — 14 scènes, quizzen, du'a-boek en
sabr/ihsan-keuzemomenten.

## Starten

Het spel heeft een simpele webserver nodig (geen build-stap):

```bash
cd "Hadj game"
python3 -m http.server 8421
# open http://localhost:8421
```

Of via de Claude Code preview: server `hajj-game` (zie `.claude/launch.json`).

## Besturing

| Invoer | Actie |
|---|---|
| WASD / pijltjes / joystick (touch) | lopen |
| Shift | rennen |
| Slepen op het scherm | camera draaien |
| A-knop / spatie / Enter / F | actie |
| Q | camera draaien (toets) |

## Projectstructuur

```
index.html          schil: schermen + script-volgorde
css/style.css       alle styling
js/
  00-globals.js     BUILD-tag, globale refs, Sound (WebAudio-synth + ambience)
  01-helpers.js     mesh-helpers (box/cyl/sph), emoji-sprites, pilgrimMesh/crowds
  02-gfx.js         v4: procedurele texturen (marmer/zand/asfalt), luchtkoepel,
                    sterrenveld, skyline (klokkentoren/hotels/bergen), Mina-tenten
  03-avatar.js      makeAvatar — volledig aanpasbaar personage
  04-player.js      Player (animatie-blending), Cam (third-person rig), Input
  05-zones.js       interactiezones, pickups, wereld-labels, sparkles
  06-ui.js          HUD, feedback, modals, du'a-boek, quizzen
  07-env.js         omgevingsbouwers (meubels, huizen, Ka'ba, Haram-arcade, skyline)
  08-scenes-a.js    State + scènes 0–5 (thuis, inpakken, vliegtuig, Haram, tawaf, sa'i)
  09-scenes-b.js    scènes 6–13 (Arafat … thuiskomst) + tawaf-logica + encounters
  10-loader.js      loadScene: lucht/fog/licht per scène (incl. per-scène exposure)
  11-engine.js      initThree (ACES tone mapping, sRGB, schaduwen) + render-loop
  12-customize.js   personage-editor met live 3D-preview
  13-main.js        Game-flow (start/next/restart) + opstarten
```

De scripts zijn klassieke scripts in vaste volgorde (geen modules/bundler), zodat
alles ook zonder toolchain werkt. Globale namen worden gedeeld tussen bestanden.

## Belangrijke afspraken

- **Per-scène belichting**: elke scène heeft `light:{amb,ambI,dir,dirI,sky,exp}` +
  optioneel `fog:{near,far}`. `exp` is de tone-mapping-exposure ("color grade"):
  nacht ≈ 0.4–0.5, schemering ≈ 0.6–0.8, dag ≈ 0.85–0.95.
- **Procedurele texturen** komen uit `canvasTex()` in `02-gfx.js` en worden gecachet;
  geen externe assets nodig.
- **Educatieve inhoud**: de volgorde en uitleg van de riten zijn onderdeel van het
  ontwerp (Niyyah in het hart, vrouwen-Ihraam, Miqaat, volgorde 10 Dhul Hijjah, enz.).
  Wijzig die teksten alleen bewust.
