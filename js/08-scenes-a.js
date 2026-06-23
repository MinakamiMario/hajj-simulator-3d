'use strict';
// ============================================================
//  SCENES — deel A (0 t/m 5)
// ============================================================
const State={ scene:0, packed:0, ihrSteps:0, stonesCol:0, stonesThrown:0,
  tawaf:0, sai:0, saiLast:null, tawafAngle:0, tawafAccum:0, sabr:0, angryDone:false, saiHelpDone:false, tawafSimOffered:false, saiSimOffered:false };
let frameHook=null;
let fadeModel=null;        // model waarvan muren transparant worden als ze cam→speler blokkeren (binnenruimtes)
let paused=false;
let encounter=null;
let colliders=[];
let terrainFn=null;   // hoogteprofiel van de scène (heuvels)
function blocked(x,z){ for(const c of colliders){ if(x>c.minX&&x<c.maxX&&z>c.minZ&&z<c.maxZ)return true; } return false; }

const SCENES=[];

/* Niyyah → slapen-flow, gedeeld door appartement en procedurele fallback */
function addNiyyahFlow(matX,matZ,bedX,bedZ){
  Zone.add({ id:'mat', x:matX, z:matZ, r:0.9, icon:'🤲', label:'Maak Niyyah', guide:true,
    action:()=>{ Player.setPose('dua');
      showFeedback('✅ In je hart maak je de intentie voor de Hajj — hardop hoeft niet. Een warm gevoel trekt door je borst. Ga nu slapen; morgenochtend pak je je koffer.',true,5500);
      setTimeout(()=>{ Player.setPose('stand');
        Zone.add({ id:'sleep', x:bedX, z:bedZ, r:1.1, icon:'😴', label:'Ga slapen', guide:true,
          action:()=>{ showFeedback('🌙 Je slaapt vol voorpret. De volgende ochtend begint je reis met inpakken.',true,3500); showNextBtn('De volgende ochtend →'); }});
      },1200);
    }});
}

/* inpak-item (gedeeld door appartement + procedurele fallback) */
function addPackItem(it){
  // leg het item op het werkelijke oppervlak (meubel of vloer) zodat 't nooit ín een meubel verdwijnt
  if(typeof surfaceTopY==='function'){ const sy=surfaceTopY(it.x,it.z); if(sy!==null) it.y=sy+0.3; }
  Zone.add({ id:'pi-'+it.id, x:it.x, z:it.z, y:it.y, r:0.7, trigR:0.95, pickup:true, glow:it.ok,
    icon:it.e, label:'Pak '+it.l, noConsume:true,
    action:(z)=>{
      if(it.ok){ Zone.markDone(z); State.packed++; setProgress(`📦 ${State.packed}/7 ingepakt`);
        if(State.packed>=7){ showFeedback('✅ Koffer gepakt! De taxi staat voor.',true,4000); showNextBtn('Naar het vliegtuig →'); }
      } else { showFeedback(`❌ ${it.l}: ${it.id==='parfum'?'verboden tijdens Ihraam':it.id==='alcohol'?'haram, hoort niet mee':'laat thuis — leid je niet af'}`,false,3000); }
    }});
}
function addWearIhram(x,z){
  Zone.add({ id:'wear-ihram', x:x, z:z, r:1.0, icon:'🤍', label:'Ihraam aandoen (optioneel)', noConsume:true,
    action:(zo)=>{ if(Char.ihram){ showFeedback('Je draagt de Ihraam al. 🤍',true,2500); return; }
      Char.ihram=true; Player.build();
      showFeedback(Char.gender==='female'?'🧕 Voor jou als vrouw is je gewone bedekkende kleding je Ihraam — geen witte doeken nodig. De intentie en de regels gelden wél vanaf de Miqaat.':'🤍 Je doet de witte Ihraam-doeken alvast aan. In het vliegtuig hoef je je dan niet meer te verkleden (niet verplicht).',true,4800);
      if(zo.ring) zo.ring.material.color.set(0x27ae60); }});
}

/* 0 — NIYYAH (bedroom night) */
SCENES.push({
  id:0, loc:'🏠 Je slaapkamer — 02:17', ar:'النِّيَّة',
  task:'🎯 Maak je Niyyah (intentie), en ga dan slapen — morgen begint de reis',
  story:`Het is midden in de nacht. Je hebt maanden voorbereid voor je Hajj. Tijd om je <em>Niyyah</em> (intentie) te maken.<br><br>💡 <strong>Goed om te weten:</strong> de Niyyah zit in je <strong>hart</strong> — je hoeft 'm niet hardop uit te spreken, en een gebedskleed is er niet voor nodig. In dit spel doen we het bij het kleedje als rustig moment.<br><br>Loop ernaartoe (WASD / joystick), druk op <strong>A</strong> — en ga daarna naar je <strong>bed</strong>. Morgenochtend pak je je koffer.`,
  spawn:{x:-4.8,z:4.2,face:0,bounds:{minX:-9.8,maxX:0.2,minZ:-9.0,maxZ:6.4}},
  light:{amb:0x46588a,ambI:1.0,dir:0x9aaae0,dirI:0.65,sky:0x0e0b24,exp:0.5},
  cam:{dist:4.8,height:4.7,pitch:0.62},                      // third-person dollhouse-hoek (kijkt in de open kamers) + muur-fade
  build(){
    const S=1.5;                                             // appartement ruim → genoeg loopruimte rond meubels
    const apt=(typeof Assets!=='undefined')?Assets.placeApartment(0,0,S):null;
    if(apt){
      Assets.tint(apt,0.55);                                 // nacht: dim de baked-bright woning (eigen nachtlamp blijft warm)
      fadeModel=apt;                                         // muren faden als ze cam→speler blokkeren
      // Niyyah in de ruime open woonkamer/eethoek (loopbaar), daarna 'slapen' richting slaapkamer
      addNiyyahFlow(-4.8,3.0, -3.9,1.5);
    } else {
      // ---- procedurele fallback (oude slaapkamer) ----
      room(10,10,3.2,0x322652,0x3a2e58);
      windowOnWall(-3.6,-4.9,0x2a4a90);
      const moonL=new THREER.PointLight(0xaac4ff,0.9,18); moonL.position.set(-3.4,2.4,-3.5); world.add(moonL);
      bed(-3.4,-3.0,0);
      const ns=nightstand(-3.5,-1.4);
      const lamp=cyl(0.1,0.16,0.4,0xd4a040,{emissive:0xffcc66,emissiveIntensity:1.4}); lamp.position.set(ns.position.x,ns.userData.topY+0.22,ns.position.z); world.add(lamp);
      const pl=new THREER.PointLight(0xffcc88,1.7,12); pl.position.set(ns.position.x,1.4,ns.position.z); world.add(pl);
      rugMat(-0.6,0.4,0x3a1d55);
      const door=box(1.2,2.4,0.12,0x241326); door.position.set(0,1.2,-4.86); world.add(door);
      addNiyyahFlow(-0.6,0.4,-3.4,-2.4);
    }
  }
});

/* 1 — PACKING (bedroom day) — items rest ON surfaces */
SCENES.push({
  id:1, loc:'🏠 Inpakken — Ochtend', ar:'التَّحضِير',
  task:'🎯 Pak de juiste 7 items (sommige zijn verboden in Ihraam!)',
  story:`Het is ochtend in je straat. Door het grote raam zie je het dorp en de taxi die zo komt. Pak alleen wat je nodig hebt — sommige items zijn <strong>verboden</strong> tijdens Ihraam.<br><br>Tip: je mag je <strong>Ihraam hier alvast aandoen</strong> (niet verplicht — het kan ook in het vliegtuig).`,
  spawn:{x:-4.5,z:4.5,face:0,bounds:{minX:-9.8,maxX:0.2,minZ:-9.0,maxZ:6.4}},
  light:{amb:0xbfd0e8,ambI:1.0,dir:0xfff2da,dirI:1.05,sky:0x9cc4e8,exp:0.95},
  fog:{near:40,far:150},
  cam:{dist:5.2,height:4.9,pitch:0.6},                         // third-person dollhouse-hoek (kijkt in de open kamers) + muur-fade
  build(){
    const S=1.5;                                              // appartement ruim → loop door de hele woning
    const apt=(typeof Assets!=='undefined')?Assets.placeApartment(0,0,S):null;
    if(apt){
      fadeModel=apt;                                          // muren faden als ze cam→speler blokkeren
      State.packed=0;
      suitcase(-3.0*S,4.0*S);                                  // koffer klaar bij de eethoek
      // items logisch over de hele woning verspreid (eettafel, salontafel, keuken, badkamer, slaapkamer, hal) — ×S meegeschaald
      [ {id:'paspoort',e:'🛂',l:'Paspoort',     ok:true, x:-3.6,z:2.2, y:0.78},  // eettafel
        {id:'duaboek', e:'📖',l:"Du'a boek",    ok:true, x:-5.6,z:3.4, y:0.45},  // salontafel (woonkamer)
        {id:'geld',    e:'💵',l:'Geld',         ok:true, x:-1.4,z:1.0, y:0.9},   // keuken-aanrecht
        {id:'medicijn',e:'💊',l:'Medicijnen',   ok:true, x:-5.4,z:-2.4,y:0.75},  // badkamer
        {id:'zeep',    e:'🧴',l:'Reukloze zeep',ok:true, x:-5.0,z:-1.4,y:0.75},  // badkamer
        {id:'sandalen',e:'👡',l:'Sandalen',     ok:true, x:-3.0,z:3.4, y:0.1},   // bij de entree/hal
        {id:'ihraam',  e:'🤍',l:'Ihraam',       ok:true, x:-2.5,z:-0.5,y:0.6},   // op het bed (voeteneind)
        {id:'parfum',  e:'🌸',l:'Parfum',       ok:false,x:-1.5,z:-1.0,y:0.6},   // slaapkamer-nachtkastje
        {id:'alcohol', e:'🍷',l:'Alcohol',      ok:false,x:-1.1,z:0.5, y:0.9},   // keuken
        {id:'camera',  e:'📷',l:'Camera',       ok:false,x:-5.9,z:3.6, y:0.45},  // salontafel
      ].forEach(it=>{ it.x*=S; it.z*=S; it.y*=S; addPackItem(it); });
      setProgress('📦 0/7 ingepakt');
      addWearIhram(-4.3,-0.6);                                // ihraam aandoen: open vloer naast het bed (slaapkamer, bereikbaar)
    } else {
      // ---- procedurele fallback (oude inpak-kamer) ----
      ground(0x6a705a,90,{roughness:1});                        // outdoor earth (visible outside)
    const floor=box(10,0.08,10,0x4a3a55); floor.position.set(0,0.05,0); world.add(floor);
    const left=box(0.2,3.2,10,0x4a4060,{roughness:1}); left.position.set(-5,1.6,0); world.add(left);
    const right=box(0.2,3.2,10,0x4a4060,{roughness:1}); right.position.set(5,1.6,0); world.add(right);
    // back wall: solid left part (with the front door), big street window on the right
    const sill=box(10,0.9,0.2,0x4a4060); sill.position.set(0,0.45,-5); world.add(sill);
    const lintel=box(10,0.75,0.2,0x4a4060); lintel.position.set(0,2.82,-5); world.add(lintel);
    const wallL=box(3.4,1.7,0.2,0x4a4060); wallL.position.set(-3.3,1.7,-5); world.add(wallL);   // solid section
    [-1.6,1.6,4.6].forEach(px=>{ const p=box(0.4,1.7,0.2,0x4a4060); p.position.set(px,1.7,-5); world.add(p); });
    const glass=box(5.8,1.7,0.05,0xcfeaff,{transparent:true,opacity:0.14,emissive:0x9fd0ff,emissiveIntensity:.15}); glass.position.set(1.55,1.7,-5); world.add(glass);
    // front door (in the solid wall, clearly separate from the window)
    const door=box(1.0,2.2,0.14,0x3a241c); door.position.set(-3.3,1.1,-4.95); world.add(door);
    const dframe=box(1.25,2.45,0.06,0xc9a84c,{emissive:0x5a4410,emissiveIntensity:.35}); dframe.position.set(-3.3,1.22,-5.02); world.add(dframe);
    const knob=sph(0.05,0xc9a84c,{emissive:0x6b5012,emissiveIntensity:.6}); knob.position.set(-2.9,1.1,-4.86); world.add(knob);
    const doormat=box(0.9,0.04,0.5,0x6a4a3a); doormat.position.set(-3.3,0.06,-4.4); world.add(doormat);
    // ---- village street behind the window ----
    const street=box(36,0.06,5,0xffffff,{map:texAsphalt(10)}); street.position.set(0,0.03,-9); world.add(street);
    [-2.6,2.6].forEach(o=>{ const c=box(36,0.14,0.3,0x70707a); c.position.set(0,0.07,-9+o); world.add(c); });
    for(let i=-17;i<=17;i+=2){ const d=box(0.6,0.07,0.14,0xd8d2b0); d.position.set(i,0.08,-9); world.add(d); }
    const sidewalk=box(36,0.1,3,0x8a8a82); sidewalk.position.set(0,0.05,-12.5); world.add(sidewalk);
    [-15,-12.2,-9,-6.4,-3.8,3.8,6.4,9,12.2,15].forEach((hx,i)=>{ house(hx,-13.4,[0xcdbb99,0xb9a98a,0xd6c2a0,0xc9b59a,0xbfae90,0xd0bfa0,0xcdbb99,0xb9a98a,0xd6c2a0,0xc9b59a][i]); });
    [-13,-7.5,-1.5,4.5,8.5,13.5].forEach(x=> lampPost(x,-10.6));
    potplant(-9.5,-10.4,1.3); potplant(9.5,-10.4,1.3);
    taxi(2.2,-10.2);
    // dorpsmoskeetje in de verte
    const mq=box(3.4,2.6,2.6,0xe8e0cc,{roughness:.95}); mq.position.set(-16,1.3,-15.5); mq.castShadow=false; world.add(mq);
    const mqDome=sph(1.2,0x2e8a55,{roughness:.6},16); mqDome.position.set(-16,2.9,-15.5); mqDome.scale.set(1,0.8,1); mqDome.castShadow=false; world.add(mqDome);
    const mqMin=cyl(0.22,0.3,5,0xe8e0cc,{roughness:.9}); mqMin.position.set(-13.8,2.5,-15.8); mqMin.castShadow=false; world.add(mqMin);
    addWanderers(5,{minX:-13,maxX:13,minZ:-12.4,maxZ:-10.6});
    const sun=sph(2.2,0xfff4d0,{emissive:0xffe49a,emissiveIntensity:1}); sun.position.set(8,9,-16); world.add(sun);
    // furniture spread around the room
    const bd=bed(-3.2,-2.6,0.2);
    const ns=nightstand(-3.4,-0.7);
    const dk=desk(3.2,-3.2);
    const ch=chair(2.0,-2.4,0.4);
    const dr=dresser(3.6,1.4,-Math.PI/2);
    const sh=shelf(-1.4,1.5,-4.85,1.6);
    suitcase(0,1.0);
    potplant(-4.2,3.8,1);
    const bedTop=bd.userData.topY, deskTop=dk.userData.topY, nsTop=ns.userData.topY, chTop=ch.userData.topY, drTop=dr.userData.topY, shTop=sh.userData.topY;
    // items spread across bed, desk, nightstand, chair, dresser, shelf, windowsill, suitcase
    const items=[
      {id:'paspoort',e:'🛂',l:'Paspoort',     ok:true, x:-3.5,z:-3.2,y:bedTop},
      {id:'ihraam',  e:'🤍',l:'Ihraam',       ok:true, x:-2.9,z:-2.1,y:bedTop},
      {id:'sandalen',e:'👡',l:'Sandalen',     ok:true, x:2.0, z:-2.4,y:chTop},
      {id:'duaboek', e:'📖',l:"Du'a boek",    ok:true, x:3.4, z:-3.4,y:deskTop},
      {id:'medicijn',e:'💊',l:'Medicijnen',   ok:true, x:-3.4,z:-0.7,y:nsTop},
      {id:'geld',    e:'💵',l:'Geld',         ok:true, x:3.6, z:1.4, y:drTop},
      {id:'zeep',    e:'🧴',l:'Reukloze zeep',ok:true, x:-1.4,z:-4.7,y:shTop},
      {id:'parfum',  e:'🌸',l:'Parfum',       ok:false,x:2.9, z:-3.1,y:deskTop},
      {id:'alcohol', e:'🍷',l:'Alcohol',      ok:false,x:3.6, z:1.9, y:drTop},
      {id:'camera',  e:'📷',l:'Camera',       ok:false,x:3.2, z:-4.6,y:1.35},
    ];
    State.packed=0;
    items.forEach(it=>{
      Zone.add({ id:'pi-'+it.id, x:it.x, z:it.z, y:it.y, r:0.7, trigR:0.95, pickup:true, glow:it.ok,
        icon:it.e, label:'Pak '+it.l, noConsume:true,
        action:(z)=>{
          if(it.ok){ Zone.markDone(z); State.packed++;
            setProgress(`📦 ${State.packed}/7 ingepakt`);
            if(State.packed>=7){ showFeedback('✅ Koffer gepakt! De taxi staat voor.',true,4000); showNextBtn('Naar het vliegtuig →'); }
          } else {
            showFeedback(`❌ ${it.l}: ${it.id==='parfum'?'verboden tijdens Ihraam':it.id==='alcohol'?'haram, hoort niet mee':'laat thuis — leid je niet af'}`,false,3000);
          }
        }});
    });
    setProgress('📦 0/7 ingepakt');
    // optional: put on Ihraam already (not required; can also be done on the plane)
    Zone.add({ id:'wear-ihram', x:-4.2, z:-3.4, r:1.0, icon:'🤍', label:'Ihraam aandoen (optioneel)', noConsume:true,
      action:(z)=>{ if(Char.ihram){ showFeedback('Je draagt de Ihraam al. 🤍',true,2500); return; }
        Char.ihram=true; Player.build();
        showFeedback(Char.gender==='female'?'🧕 Voor jou als vrouw is je gewone bedekkende kleding je Ihraam — geen witte doeken nodig. De intentie en de regels gelden wél vanaf de Miqaat.':'🤍 Je doet de witte Ihraam-doeken alvast aan. In het vliegtuig hoef je je dan niet meer te verkleden (niet verplicht).',true,4800);
        if(z.ring) z.ring.material.color.set(0x27ae60); }});
    }
  }
});

/* 2 — IHRAAM (plane) */
SCENES.push({
  id:2, loc:'✈️ Aan boord — onderweg naar de Miqaat', ar:'الإِحرَام',
  task:'🎯 Volg de aanwijzingen aan boord',
  story:`<em>"Wij naderen de Miqaat..."</em> Je hebt thuis al ghusl gedaan. Aan boord ga je in staat van Ihraam.<br><br>Deed je de Ihraam thuis nog niet aan? <strong>Verkleed je in het toilet (achterin)</strong>. Daarna: <strong>ga in je stoel ✦ zitten → Niyyah → Talbiyah</strong>.`,
  spawn:{x:0,z:2.4,face:Math.PI,bounds:{minX:-0.42,maxX:0.42,minZ:-4.0,maxZ:4.0}},
  light:{amb:0xcfe2ff,ambI:1.0,dir:0xffffff,dirI:0.95,sky:0x7fb4e6,exp:0.95},
  fog:{near:60,far:340},                                  // ruimere fog: blauwe lucht voor de establishing-shot
  cam:{dist:4.4,height:2.0,pitch:0.2,maxY:2.7,bound:{minX:-2.1,maxX:2.1,minZ:-4.6,maxZ:4.6},playerScale:0.85},
  build(){
    // ceiling + floor (no big ground -> open sides reveal the sky)
    const ceil=box(4.6,0.18,11,0xeae8e2); ceil.position.set(0,2.95,0); world.add(ceil);
    const floor=box(4.2,0.06,11,0x2a3550); floor.position.y=0.03; world.add(floor);
    const aisle=box(0.95,0.04,11,0x16202e); aisle.position.set(0,0.06,0); world.add(aisle);
    // open side walls (solid base + top, glassy window band between) so you SEE the sky
    [-1,1].forEach(side=>{ const wx=side*2.0;
      const base=box(0.16,1.05,11,0xe8e6e2); base.position.set(wx,0.55,0); world.add(base);
      const top =box(0.16,1.0,11,0xe2e0da);  top.position.set(wx,2.45,0); world.add(top);
      for(let i=-4;i<=4;i++){ const fz=i*1.18;
        // afgeronde bezel (afgeplatte bol = zachte raamomlijsting)
        const bezel=sph(0.33,0xf6f4ee,{roughness:.6},16); bezel.scale.set(0.12,1.0,0.78); bezel.position.set(wx,1.78,fz); bezel.castShadow=false; world.add(bezel);
        // ovaal raampje: afgeplatte cilinder op z'n kant = vliegtuigraam, helder verlicht
        const glass=cyl(0.24,0.24,0.07,0xddf2ff,{transparent:true,opacity:0.55,emissive:0xbfe6ff,emissiveIntensity:.85},20);
        glass.rotation.z=Math.PI/2; glass.scale.set(1.0,1.0,0.78); glass.position.set(wx+side*0.02,1.78,fz); glass.castShadow=false; world.add(glass);
        // dun zonnescherm erboven
        const shade=box(0.05,0.12,0.46,0xe8e4dc); shade.position.set(wx-side*0.01,2.05,fz); shade.castShadow=false; world.add(shade);
      }
    });
    // overhead bins + cabin lights
    [-1.9,1.9].forEach(bx=>{ const bin=box(0.5,0.45,10.6,0xeae6dd); bin.position.set(bx,2.55,0); world.add(bin); });
    for(let i=0;i<4;i++){ const cl=new THREER.PointLight(0xfff0d8,0.4,9); cl.position.set(0,2.5,i*2.6-3.8); world.add(cl); }
    // SKY: drifting clouds outside both sides + far below -> you see you're flying
    function makeCloud(s){ const grp=new THREER.Group(); const n=3+Math.floor(Math.random()*3);
      for(let k=0;k<n;k++){ const b=sph(0.7+Math.random()*0.7,0xffffff,{roughness:1}); b.castShadow=false;
        b.position.set((Math.random()-.5)*1.8,(Math.random()-.5)*0.5,(Math.random()-.5)*1.2); b.scale.y=0.55; grp.add(b); }
      grp.scale.setScalar(s||1); return grp; }
    for(let i=0;i<14;i++){ const c=makeCloud(0.7+Math.random()*1.1);
      const side=Math.random()>.5?1:-1; c.position.set(side*(3.5+Math.random()*7), 0.5+Math.random()*3.2, -12+Math.random()*24);
      c.userData.cloud={sp:2.2+Math.random()*2.2}; world.add(c); }
    for(let i=0;i<8;i++){ const c=makeCloud(1.4+Math.random()*1.6);
      c.position.set((Math.random()-.5)*26, -5-Math.random()*5, -12+Math.random()*24);
      c.userData.cloud={sp:1.4+Math.random()*1.4}; world.add(c); }
    // wing + engine + winglet, visible through the left windows
    const wing=box(4.2,0.16,1.5,0xc4c8ce,{metalness:.3,roughness:.5}); wing.position.set(-4.6,0.5,0.8); wing.rotation.z=0.05; world.add(wing);
    const winglet=box(0.16,0.7,0.8,0xb4b8be); winglet.position.set(-6.6,0.85,0.8); world.add(winglet);
    const engine=cyl(0.4,0.4,1.1,0x9aa0a8); engine.rotation.x=Math.PI/2; engine.position.set(-4.2,0.2,0.8); world.add(engine);
    // seat rows (2 + 2)
    const rowsZ=[-3.0,-1.8,-0.6,0.6,1.8,3.0];
    rowsZ.forEach(zz=>{ [-1.45,-0.85,0.85,1.45].forEach(sx=>{
      const seat=box(0.5,0.42,0.5,0x33506a); seat.position.set(sx,0.42,zz); world.add(seat);
      const bk=box(0.5,0.62,0.12,0x294056); bk.position.set(sx,0.78,zz-0.27); world.add(bk);
      const scr=box(0.3,0.2,0.03,0x0a1420,{emissive:0x10406a,emissiveIntensity:.55}); scr.position.set(sx,0.98,zz-0.33); world.add(scr);
    }); });
    // YOUR seat (right inner, row z=-0.6) highlighted
    const sx=0.85, sz=-0.6;
    const ring=glowRing(0.5,0x6ad0a0); ring.position.set(sx,0.66,sz); world.add(ring);
    const star=emojiSprite('✦',0.4); star.position.set(sx,1.5,sz); world.add(star);
    // galley (back) + cockpit (front) + lavatory door (back-left)
    const galley=box(4.2,2.6,0.5,0xb8bcc4,{metalness:.3,roughness:.5}); galley.position.set(0,1.3,5.0); world.add(galley);
    const counter=box(2.0,0.9,0.4,0xc8ccd2); counter.position.set(0,0.45,4.6); world.add(counter);
    const cockpit=box(4.2,2.7,0.35,0x9aa0aa); cockpit.position.set(0,1.35,-5.0); world.add(cockpit);
    const cdoor=box(0.85,1.9,0.06,0x5a6068,{metalness:.4}); cdoor.position.set(0,0.95,-4.8); world.add(cdoor);
    const lavDoor=box(0.7,1.9,0.08,0xc0c4ca); lavDoor.position.set(-1.55,0.95,4.5); lavDoor.rotation.y=Math.PI/2; world.add(lavDoor);
    const lavSign=emojiSprite('🚻',0.4); lavSign.position.set(-1.4,2.0,4.2); world.add(lavSign);
    // fasten-seatbelt sign + flight attendant
    const sign=emojiSprite('🔔',0.4); sign.position.set(0,2.55,-3.0); world.add(sign);
    const att=makePilgrim(0x355a8a); att.position.set(0,0,3.9); att.rotation.y=Math.PI; att.userData.ph=Math.random()*6.28; world.add(att);

    // ---- clear, ordered tasks ----
    function instruct(){ setProgress(Char.ihram ? '👉 Loop naar je stoel ✦ (rechts) en ga zitten' : '👉 Toilet achterin: trek je Ihraam aan'); }
    function seatedNiyyah(){ openChoice({ ar:'النِّيَّة', sub:'Gezeten in je stoel', txt:'Maak nu je <strong>Niyyah</strong> (intentie) voor de Hajj.',
      choices:[{txt:'🤲 Spreek de Niyyah uit', action:()=>{ Sound.success(); showFeedback('✅ "Labbayka Allahumma Hajjan." Je intentie is gemaakt.',true,3000); setTimeout(seatedTalbiyah,1100); }}]}); }
    function seatedTalbiyah(){ openChoice({ ar:'التَّلبِية', sub:'', txt:'Spreek de <strong>Talbiyah</strong> uit:<br><br><em>لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ</em><br>"Hier ben ik, o Allah, hier ben ik."',
      choices:[{txt:'🗣️ Spreek de Talbiyah', action:()=>{ Sound.success(); learnDua('talbiyah');
        if(window.Recite)Recite.startTalbiya();                 // vanaf nu klinkt de Talbiya zacht mee (staat van ihraam)
        showFeedback('✅ Labbayka Allahumma labbayk! Je bent nu in staat van Ihraam. ✈️',true,4000); showNextBtn('Aankomst Mekka →'); }}]}); }
    function sitDown(){ const sz2=Zone.list.find(q=>q.id==='seat'); if(sz2&&!sz2.done)Zone.markDone(sz2);
      Player.x=sx; Player.z=sz; Player.faceY=Math.PI; Player.sitting=true; Player.setPose('sit'); Player.updateTransform();
      Cam.yaw=Math.PI; Sound.step(); showFeedback('Je zit in je stoel met je gordel om. 🤍',true,2200); setTimeout(seatedNiyyah,1000); }

    if(!Char.ihram){
      Zone.add({ id:'lav', x:-0.3, z:3.7, r:1.1, icon:'🚻', label:'Trek Ihraam aan', noConsume:true, guide:true,
        action:(z)=>{ if(Char.ihram)return; Char.ihram=true; Player.build(); Sound.step();
          showFeedback(Char.gender==='female'?'🧕 Voor de vrouw is de Ihraam geen witte kleding: je gewone bedekkende kleding ís je Ihraam (gezicht en handen blijven onbedekt — geen niqab of handschoenen). Je bent er klaar voor.':'🤍 In het toilet trek je de twee witte Ihraam-doeken aan (izar en rida). Je outfit verandert.',true,Char.gender==='female'?5000:3500);
          Zone.markDone(z); instruct(); }});
    }
    Zone.add({ id:'seat', x:0.3, z:sz, r:1.0, icon:'🪑', label:'Ga zitten', noConsume:true, guide:true,
      action:()=>{ if(!Char.ihram){ showFeedback('⚠️ Trek eerst je Ihraam aan in het toilet (achterin).',false,2800); return; } sitDown(); }});
    instruct();

    // ---- establishing-shot: het exterieur-toestel vliegt door de lucht, daarna ben je aan boord ----
    if(typeof Assets!=='undefined' && Assets.ready('airplane')){
      const pl=Assets.cache.airplane.clone(true); pl.scale.setScalar(0.5);
      pl.traverse(o=>{ if(o.isMesh){ o.castShadow=false; o.receiveShadow=false; } });
      if(Assets.tint) Assets.tint(pl,0.62);                                    // grijstint → contrast tegen de lichte lucht
      pl.position.set(-55,15,-16); pl.rotation.set(0,0,0.07); world.add(pl);   // lange as = X → vliegt naar +X
      const t0=performance.now(), DUR=4600;
      paused=true;
      Cam.cine=function(){
        const e=Math.min(1,(performance.now()-t0)/DUR);
        pl.position.x=-55+e*110;                                       // kruist de hemel van links naar rechts
        pl.position.y=15-Math.sin(e*Math.PI)*2;                        // zachte boog
        pl.rotation.z=0.07+Math.sin(e*Math.PI)*0.05;                   // subtiele bank
        camera.position.set(0,9,16);                                   // BINNEN de sky-dome (buiten = zwarte lucht)
        camera.lookAt(pl.position.x*0.22,13,-14);                      // pan zacht met het toestel mee
      };
      sceneTimeout(()=>{ Cam.cine=null; world.remove(pl); paused=false; }, DUR+150);
    }
  }
});

/* 3 — KA'BA REVEAL */
SCENES.push({
  id:3, loc:"🕌 Masjid al-Haram — Eerste blik", ar:'أَوَّل رُؤيَة الكَعبَة',
  task:"🎯 Loop over de mataf naar de Ka'ba en hef je handen op voor du'a",
  story:`Je loopt de Masjid al-Haram binnen. En dan zie je hem — de Ka'ba. Tranen wellen op.`,
  spawn:{x:0,z:34,face:Math.PI,bounds:{minX:-15,maxX:15,minZ:2,maxZ:38}},
  light:{amb:0xffeede,ambI:1.2,dir:0xfff0d4,dirI:1.1,sky:0xa9c4dd,exp:0.6,hemiI:0.1},
  fog:{near:70,far:520},
  cam:{dist:10,height:4.2,pitch:0.12},
  build(){
    // fotorealistisch Haram-model (Ka'ba + mataf + galerij); val terug op procedureel als 't model nog laadt
    const haram=(typeof Assets!=='undefined')?Assets.placeHaram(0,-3,6.5):null;
    if(haram){
      groundTex(texMarble(40),360,0xece4d2);                      // mataf-vloer rondom het model
      Assets.placeProp('clocktower',-72,-150,2.6);                // Abraj Al-Bait in de skyline links-achter de Haram
    } else {
      groundTex(texMarble(34),150,0xf0e8d6); kaaba(0,-3); haramSurround(0,-3,16); meccaSkyline(0,-3,16);
    }
    const oc=makeOrbitCrowd(70,9,24); oc.position.set(0,0,-3); world.add(oc);   // tawaf-menigte rónd de grote Ka'ba
    addWanderers(10,{minX:-13,maxX:13,minZ:6,maxZ:34});
    everyMs(()=>spawnDhikrAt(0,-3),2600);
    Zone.add({ id:'pray', x:0, z:7, r:1.8, icon:'🤲', label:"Du'a voor Ka'ba", guide:true,
      action:()=>{ Player.faceTowards(0,-3); Player.setPose('dua'); learnDua('kaaba');   // richt naar de Ka'ba
        showFeedback("✅ Je heft je handen op. \"Allahumma anta as-Salam wa minka as-Salam...\" Tranen lopen over je wangen.",true,5000);
        showNextBtn('Begin Tawaf →'); }});
  }
});

/* 4 — TAWAF */
SCENES.push({
  id:4, loc:"🕋 Tawaf — Rondom de Ka'ba", ar:'الطَّوَاف',
  task:"🎯 Loop 7× rondom de Ka'ba (tegen de klok in)",
  story:`Begin bij de Hajar al-Aswad-hoek. Loop <strong>tegen de klok in</strong> rondom de Ka'ba — de Ka'ba aan je linkerhand. Een volledige ronde telt als 1 tawaf.`,
  spawn:{x:5,z:0,face:-Math.PI/2,bounds:{minX:-12,maxX:12,minZ:-12,maxZ:12}},
  light:{amb:0xffeede,ambI:1.2,dir:0xfff0d4,dirI:1.1,sky:0xa9c4dd,exp:0.6,hemiI:0.1},
  fog:{near:60,far:520},
  cam:{dist:9.5,height:3.8,pitch:0.22},                 // uitgezoomd zodat Ka'ba + hoeklabels leesbaar blijven
  build(){ tawafScene();
    // Maqam Ibrahim: 2 rak'ah na de tawaf (optioneel, educatief)
    const maqam=box(0.5,0.9,0.5,0xc9a84c,{metalness:.5,roughness:.3,emissive:0x5a4410,emissiveIntensity:.4}); maqam.position.set(2.2,0.45,5.6); world.add(maqam);
    const mqGlass=box(0.56,0.5,0.56,0xbfe6ff,{transparent:true,opacity:0.25}); mqGlass.position.set(2.2,1.05,5.6); world.add(mqGlass);
    Zone.add({ id:'maqam', x:2.2, z:6.6, r:1.1, icon:'🕌', label:"2 rak'ah bij Maqam Ibrahim", noConsume:true,
      action:(zz)=>{ if(State.tawaf<7){ showFeedback('Maak eerst je 7 rondes af. 🕋',false,2500); return; }
        if(State.maqamDone){ showFeedback('Je hebt hier al gebeden. 🤲',true,2000); return; }
        openChoice({ ar:'مَقَام إِبرَاهِيم', sub:'"En neem de Maqam Ibrahim als gebedsplaats" (2:125)',
          txt:"Achter deze steen — met de voetafdruk van Ibrahim (a.s.) — bid je 2 rak'ah. Sunnah: al-Kafirun in de eerste, al-Ikhlas in de tweede rak'ah.",
          choices:[{txt:"🤲 Bid 2 rak'ah", action:()=>{ State.maqamDone=true; if(zz)Zone.markDone(zz);
            showFeedback("🕌 Je bidt 2 rak'ah achter de Maqam — volg de bewegingen.",true,3000);
            Player.faceTowards(0,0);                                 // bid richting de Ka'ba
            Player.praySalat(2, ()=>{ Sound.success(); sparkle(Player.x,1.6,Player.z);
              showFeedback("✅ Gebed voltooid. Drink nu Zamzam 💧, daarna verder naar Sa'i.",true,5000);
              const zm=Zone.list.find(q=>q.id==='zamzam'); if(zm&&!zm.done){ zm.guide=true; Guide.refresh(); }
              showNextBtn("Naar Sa'i →"); }); }}]}); }});
    // Zamzam-station
    [[-3.6,6.2],[-4.4,6.2]].forEach(p=>{ const cooler=cyl(0.28,0.32,0.95,0xb8860b,{metalness:.4,roughness:.4}); cooler.position.set(p[0],0.48,p[1]); world.add(cooler);
      const tap=box(0.06,0.06,0.14,0xd9d2c2); tap.position.set(p[0],0.62,p[1]-0.34); world.add(tap); });
    const cups=box(0.5,0.3,0.3,0xeae4d6); cups.position.set(-4.0,0.15,5.7); world.add(cups);
    Zone.add({ id:'zamzam', x:-4.0, z:7.0, r:1.2, icon:'💧', label:'Drink Zamzam', noConsume:true,
      action:(zz)=>{ if(State.zamzamDone){ showFeedback('Alhamdulillah, je hebt al gedronken. 💧',true,2000); return; }
        State.zamzamDone=true; State.zamzamBottle=true; if(zz)Zone.markDone(zz); Sound.pickup(); sparkle(Player.x,1.4,Player.z); learnDua('zamzam');
        showFeedback('💧 Zamzam! Drink staand, in drie teugen, met een du\'a — dit water stroomt al sinds Hajar en Ismail. Je vult ook een flesje 🧴 voor onderweg.',true,6000); }});
  },
  onExit(){ frameHook=null; }
});

/* 5 — SA'I */
SCENES.push({
  id:5, loc:"🏃 Tussen Safa en Marwa", ar:'السَّعي',
  task:"🎯 Loop 7× heen-en-weer tussen Safa (links) en Marwa (rechts)",
  story:`In de voetsporen van Hajar — die hier rende, zoekend naar water voor Ismail. Begin bij Safa. <strong>Safa → Marwa = 1</strong>, terug = 2. Totaal 7.`,
  spawn:{x:0,z:0,face:-Math.PI/2,bounds:{minX:-9,maxX:9,minZ:-2,maxZ:2}},
  light:{amb:0xcfd6cc,ambI:0.85,dir:0xfff4e0,dirI:0.85,sky:0x9cc4b8,exp:0.88},
  build(){
    ground(0xd8d2c6,60,{roughness:.9});
    // marble corridor (mas'a) with side walls and arches
    const corridor=box(19,0.06,4.2,0xffffff,{map:texMarble(7)}); corridor.position.y=0.03; world.add(corridor);
    const lane=box(19,0.04,0.18,0xc9a84c); lane.position.set(0,0.07,0); world.add(lane);
    [-1,1].forEach(s=>{
      const wall=box(19,2.6,0.25,0xe2dccb,{roughness:.95}); wall.position.set(0,1.3,s*2.2); world.add(wall);
      for(let x=-8;x<=8;x+=2){ const pil=cyl(0.16,0.2,2.6,0xd6cfbc); pil.position.set(x,1.3,s*1.95); world.add(pil); }
    });
    // Safa & Marwa as rock mounds — gesculpte Blender-rotsen met fallback
    [['safa',-8],[null,8]].forEach((h,i)=>{ const x=i===0?-8:8;
      const rock=rockAt(x,0,2.4,0); rock.scale.multiplyScalar(1.0);
      rockAt(x+(i?-0.9:0.9),0.5,1.5,0);
      colliders.push(i===0 ? {minX:-10,maxX:-6.6,minZ:-1.6,maxZ:1.6} : {minX:6.6,maxX:10,minZ:-1.6,maxZ:1.6});
      camOccluders.push(rock);
    });
    const safaLbl=textSprite('Safa','#f0d080'); safaLbl.position.set(-8,2.6,0); world.add(safaLbl);
    const marwaLbl=textSprite('Marwa','#f0d080'); marwaLbl.position.set(8,2.6,0); world.add(marwaLbl);
    // GREEN LIGHTS zone (between x=-2 and x=2): men jog here
    const strip=box(4,0.05,4.0,0x2a8a4a,{emissive:0x1e6b36,emissiveIntensity:.5}); strip.position.set(0,0.08,0); world.add(strip);
    [-2,2].forEach(gx=>{ [-1,1].forEach(s=>{
      const post=cyl(0.07,0.09,2.5,0x3a4a3e); post.position.set(gx,1.25,s*1.8); world.add(post);
      const tube=cyl(0.07,0.07,1.2,0x6affa0,{emissive:0x35e070,emissiveIntensity:1.6}); tube.rotation.x=Math.PI/2; tube.position.set(gx,2.45,s*1.2); world.add(tube);
      const gl=new THREER.PointLight(0x57f08a,0.7,6); gl.position.set(gx,2.4,s*1.2); world.add(gl);
    }); });
    const greenLbl=textSprite('🟩 groene lichten','#9af0b4',{h:0.7}); greenLbl.position.set(0,3.0,0); world.add(greenLbl);
    // floating duas + fellow pilgrims walking back and forth (human-sized)
    everyMs(()=>spawnDhikrAt(0,0),2600);
    State.sai=0; State.saiLast=null; State.saiSimOffered=false;
    for(let i=0;i<7;i++){
      const p=pilgrimMesh();
      const z=(i%2?1:-1)*(0.7+Math.random()*0.5);
      const startX=-6+Math.random()*12;
      p.position.set(startX,0,z); p.rotation.y=Math.PI/2;
      p.userData.walk={x:startX,min:-6.5,max:6.5,sp:1.4+Math.random()*0.9,dir:Math.random()>.5?1:-1,ph:Math.random()*6.28};
      world.add(p);
    }
    Zone.add({ id:'safa', x:-7, z:0, r:1.5, icon:'⛰️', label:'Safa', auto:true, noConsume:true, guide:true, action:()=>saiTouch('safa') });
    Zone.add({ id:'marwa',x:7,  z:0, r:1.5, icon:'⛰️', label:'Marwa',auto:true, noConsume:true, action:()=>saiTouch('marwa') });
    showFeedback('🟩 Tussen de groene lampen joggen de mannen een stukje — vrouwen lopen gewoon door.',true,4500);
    sceneTimeout(saiEncounter,6000);
    setProgress("🏃 0/7");
  }
});
function saiTouch(which){
  if(which==='safa') learnDua('safa');
  if(State.saiLast===which)return; State.saiLast=which; State.sai++; Sound.step();
  // baken wijst steeds naar de andere heuvel
  Zone.list.forEach(z=>{ if(z.id==='safa'||z.id==='marwa'){ z.guide=(z.id!==which); } });
  Guide.refresh();
  setProgress(`🏃 ${State.sai}/7`);
  showFeedback(`✅ ${which==='safa'?'Bij Safa':'Bij Marwa'} — ${State.sai}/7`,true,1800);
  // re-arm both zones
  Zone.list.forEach(z=>{ if(z.id==='safa'||z.id==='marwa') z.done=false; });
  if(State.sai>=2 && State.sai<7 && !State.saiSimOffered && !Player.simLine){
    State.saiSimOffered=true; showSimBtn('⏩ Simuleer de rest', startSaiSim);
  }
  if(State.sai>=7){ Player.simLine=false; clearSimBtn();
    setTimeout(()=>{ showFeedback("✅ Sa'i voltooid! Drink Zamzam-water.",true,4000); showNextBtn('Naar Arafat →'); },1400); }
}
