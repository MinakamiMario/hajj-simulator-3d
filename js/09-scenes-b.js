'use strict';
// ============================================================
//  SCENES — deel B (6 t/m 13) + tawaf + encounters
// ============================================================

/* 6 — ARAFAT */
SCENES.push({
  id:6, loc:'🌄 Vlakte van Arafat — 9 Dhul Hijjah', ar:'يَوم عَرَفَة',
  task:'🎯 Loop naar Jabal al-Rahma en hef je handen op',
  story:`<strong>"الحَجُّ عَرَفَة"</strong> — "De Hajj IS Arafat."<br><br>Voor je ligt de <strong>Jabal al-Rahma</strong> (Berg van Genade), met de witte obelisk op de top — hier hield de Profeet ﷺ zijn afscheidspreek. Volg het gouden baken 🔆, beklim het pad en maak du'a tot zonsondergang.`,
  spawn:{x:0,z:9,face:Math.PI,bounds:{minX:-17,maxX:17,minZ:-13.5,maxZ:14}},
  light:{amb:0xffcaa0,ambI:0.8,dir:0xff9a40,dirI:1.1,sky:0xd87830,exp:0.8},
  fog:{near:34,far:130},
  build(){
    groundTex(texSand(30),160);
    // ===== JABAL AL-RAHMA: beklimbare granietheuvel met witte obelisk =====
    const HILL={x:0,z:-13,r:9.0,h:7.5};         // forse, beklimbare granietberg (Jabal al-Rahma) — zuidvoet als origineel (camera vrij)
    const terr=(x,z)=>{ const d=Math.hypot(x-HILL.x,z-HILL.z); if(d>=HILL.r)return 0;
      const t=1-d/HILL.r; return HILL.h*t*t*(3-2*t); };          // glad koepelprofiel
    terrainFn=terr;
    // heuvel-mesh die exact het loopprofiel volgt (lathe van hetzelfde profiel)
    const pts=[]; for(let i=16;i>=0;i--){ const rr=HILL.r*i/16; pts.push(new THREER.Vector2(rr,terr(HILL.x+rr,HILL.z))); }
    const hillM=new THREER.Mesh(new THREER.LatheGeometry(pts,40), mat(0x6b6055,{roughness:1}));   // granietgrijs (steekt af tegen het zand)
    hillM.position.set(HILL.x,0,HILL.z); hillM.receiveShadow=true; hillM.castShadow=false; world.add(hillM);
    // granietblokken op de flanken — solide, en het trappad blijft vrij
    for(let i=0;i<42;i++){ const a=Math.random()*Math.PI*2, rr=1.4+Math.random()*(HILL.r-1.0);
      const bx=HILL.x+Math.cos(a)*rr, bz=HILL.z+Math.sin(a)*rr;
      if(bz>HILL.z+HILL.r*0.90) continue;                         // zuidkant (toegang) open
      if(Math.abs(bx)<1.9 && bz>HILL.z-1) continue;               // corridor van het trappad vrij
      const rad=1.0+Math.random()*2.0;                            // grotere granietblokken → ruwer, rotsiger silhouet
      rockAt(bx,bz,rad,terr(bx,bz)*0.85);
      colliders.push({minX:bx-rad*0.7,maxX:bx+rad*0.7,minZ:bz-rad*0.7,maxZ:bz+rad*0.7});
    }
    // trappad van de voet naar de top (lichtere steenplaten)
    for(let i=0;i<=17;i++){ const pz=HILL.z+HILL.r-0.4 - i*((HILL.r-0.6)/17);
      const st=box(1.7,0.14,0.8,0xc4b496,{roughness:.95}); st.position.set(0,terr(0,pz)+0.05,pz);
      st.rotation.x=-0.1; st.castShadow=false; world.add(st); }
    // witte obelisk op de top (het herkenningspunt van Arafat)
    const topY=terr(HILL.x,HILL.z);
    const plat=cyl(2.0,2.4,0.6,0xd8cdb4,{roughness:.9},16); plat.position.set(HILL.x,topY+0.25,HILL.z); plat.castShadow=false; world.add(plat);
    const obelisk=box(0.9,4.6,0.9,0xf2efe6,{roughness:.7,emissive:0x55503e,emissiveIntensity:.25});
    obelisk.position.set(HILL.x,topY+2.9,HILL.z); world.add(obelisk);
    colliders.push({minX:HILL.x-0.7,maxX:HILL.x+0.7,minZ:HILL.z-0.7,maxZ:HILL.z+0.7});
    camOccluders.push(obelisk);
    const obLbl=textSprite('جَبَل الرَّحمَة — Jabal al-Rahma','#ffe2a0',{h:1.05}); obLbl.position.set(HILL.x,topY+6.8,HILL.z); world.add(obLbl);
    // pelgrims op de flanken, handen geheven in du'a
    for(let i=0;i<9;i++){ const a=(i/9)*Math.PI*2+0.3, rr=2.2+Math.random()*4.5;
      const px2=HILL.x+Math.cos(a)*rr, pz2=HILL.z+Math.sin(a)*rr;
      const p=pilgrimMesh(); p.position.set(px2,terr(px2,pz2),pz2); p.rotation.y=Math.PI;
      pilgrimDua(p);                                               // natuurlijk geheven handen (du'a)
      world.add(p); }
    everyMs(()=>spawnDhikrAt(HILL.x,HILL.z+4),3400);
    // laagstaande zon achter de heuvel
    const sun=sph(2.4,0xffd070,{emissive:0xffb050,emissiveIntensity:1}); sun.position.set(6,4.5,-30); world.add(sun);
    // ===== een rijke Arafat-vlakte =====
    // Masjid Namirah in de verte (waar de khutbah wordt gehouden)
    const nam=box(16,3.6,5,0xf0ead8,{roughness:.95}); nam.position.set(-34,1.8,4); nam.castShadow=false; world.add(nam);
    [[-41,4],[-27,4]].forEach(p=>{ const m=cyl(0.35,0.5,11,0xf0ead8,{roughness:.9}); m.position.set(p[0],5.5,p[1]); m.castShadow=false; world.add(m);
      const tip=cyl(0.02,0.3,1.3,0xc9a84c,{emissive:0x6b5012,emissiveIntensity:.5}); tip.position.set(p[0],11.6,p[1]); tip.castShadow=false; world.add(tip); });
    const namBand=box(16.2,0.5,5.2,0x2e7a4a,{roughness:.8}); namBand.position.set(-34,3.4,4); namBand.castShadow=false; world.add(namBand);
    // acacia's verspreid over de vlakte
    [[-12,6],[14,3],[-9,12],[18,10],[-17,11],[10,13],[22,5],[-22,7]].forEach(p=>acacia(p[0],p[1],0.85+Math.random()*0.4));
    // schijnwerpermasten en het gele grensbord van Arafat
    [[-11,-1],[11,-1],[-17,7],[17,7]].forEach(p=>lightMast(p[0],p[1]));
    [[8.5,12.5],[-8.5,12.5]].forEach(p=>{
      [-0.9,0.9].forEach(o=>{ const pl2=cyl(0.06,0.08,2.6,0x9a9a9a,{metalness:.3},8); pl2.position.set(p[0]+o,1.3,p[1]); pl2.castShadow=false; world.add(pl2); });
      const brd=box(2.6,1.1,0.12,0xf2c61e,{roughness:.6}); brd.position.set(p[0],2.6,p[1]); brd.castShadow=false; world.add(brd);
      const brdT=textSprite('بِدَايَة عَرَفَات','#163a16',{h:0.62}); brdT.position.set(p[0],2.6,p[1]-0.2); world.add(brdT); });
    // pelgrimsbussen langs de rand + watervoorraad bij de tenten
    pilgrimBus(-14,13.5,0xe8e4da,0.1); pilgrimBus(-19,13.8,0xdde8dd,-0.06); pilgrimBus(15,14,0xe2dccc,0.05);
    [[-6,11],[6.5,11.5]].forEach(p=>{ const wv=cyl(0.5,0.55,1.1,0x3a7ab8,{roughness:.5},10); wv.position.set(p[0],0.55,p[1]); wv.castShadow=false; world.add(wv);
      const krat=box(0.8,0.5,0.5,0xc86a2a,{roughness:.8}); krat.position.set(p[0]+0.9,0.25,p[1]); krat.castShadow=false; world.add(krat); });
    // donkere kiezelvlekken voor bodemvariatie
    for(let i=0;i<16;i++){ const px3=(Math.random()-.5)*30, pz3=2+Math.random()*11;
      if(Math.hypot(px3-HILL.x,pz3-HILL.z)<HILL.r+1) continue;
      const kz=sph(0.12+Math.random()*0.14,0x6a5d4a,{roughness:1},6); kz.position.set(px3,0.05,pz3); kz.scale.y=0.35; kz.castShadow=false; world.add(kz); }
    // verre bergrand rond de vlakte
    mountainRange(80,0x5a4030,16);
    // white tents + umbrellas at the edges
    [[-9,4],[-7,7],[8,5],[10,8],[-10,8],[7,9],[-13,6],[13,7],[-15,10],[15,11],[12,12],[-12,12]].forEach(p=>{
      const t=cyl(0.05,1.1,1.3,0xf2efe6,{roughness:1},4); t.rotation.y=Math.PI/4; t.position.set(p[0],0.65,p[1]); t.castShadow=false; world.add(t); });
    // groot tentenkamp aan de randen
    minaTentField(-20,2,5,7,2.6); minaTentField(20,2,5,7,2.6);
    [[-4,8],[5,7],[-8,11],[9,11]].forEach(p=>{ const um=cyl(0.04,1.0,0.5,0xd8d2c0,{roughness:1},8); um.position.set(p[0],2.0,p[1]); um.castShadow=false; world.add(um);
      const up=cyl(0.04,0.04,2.0,0x6a5a40); up.position.set(p[0],1.0,p[1]); up.castShadow=false; world.add(up); });
    world.add(makeCrowd(50,0,4,0,{min:3,max:9}));
    addWanderers(10,{minX:-14,maxX:14,minZ:0,maxZ:13});
    everyMs(()=>spawnDhikrAt(0,2),3000);
    // dorstige oudere pelgrim in de hitte
    const thirsty=makePilgrim(0xc8b890,'🥵'); thirsty.position.set(5.5,0,2.5); thirsty.rotation.y=Math.PI; thirsty.userData.ph=Math.random()*6.28; world.add(thirsty);
    Zone.add({ id:'thirsty', x:5.5, z:3.6, r:1.3, icon:'💧', label:'Help de dorstige pelgrim', noConsume:true,
      action:(z)=>{ if(State.sharedZamzam){ showFeedback('Hij rust nu uit, alhamdulillah. 🤲',true,2200); return; }
        if(!State.zamzamBottle){ showFeedback('🥵 Een oudere pelgrim heeft het zwaar in de hitte... maar je hebt geen water bij je. (Tip: vul Zamzam bij de Haram.)',false,4500); return; }
        openChoice({ ar:'الإِحسَان', sub:'Een oudere pelgrim, uitgeput door de hitte', txt:'Je hebt je flesje Zamzam 🧴 bij je. De zon brandt — en hij heeft niets.',
          choices:[
            {txt:'🧴 Geef hem je Zamzam te drinken', action:()=>{ State.sharedZamzam=true; State.sabr++; Sound.success(); sparkle(5.5,1.6,2.5);
              if(thirsty.userData.emoji)thirsty.userData.emoji.material.map=emojiTexture('🤲');
              spawnTextAt('جَزَاكَ اللهُ خَيرًا',5.5,2.4,2.5,'#bfe8c0');
              showFeedback('✅ "JazakAllahu khayran, mijn kind." De beste mensen zijn zij die anderen tot nut zijn — en op Arafat weegt elke goede daad zwaar.',true,6000); }},
            {txt:'Doorlopen', action:()=>{ showFeedback('Je loopt door... maar zijn blik blijft je bij. Misschien toch teruggaan?',false,3500); }}
          ]}); }});
    Zone.add({ id:'mtn', x:0, z:-9.6, y:terr(0,-9.6), r:2.0, icon:'🤲', label:"Du'a op Jabal al-Rahma", guide:true,
      action:()=>{ Player.faceTowards(0,-13); Player.setPose('dua'); learnDua('arafat');   // richt op de Berg/qibla
        showFeedback("SubhanAllah. Allah daalt neer en spreekt trots over de mensen op Arafat. Geen dag worden meer mensen bevrijd dan vandaag.",true,6000);
        showNextBtn('Naar Muzdalifah →'); }});
  }
});

/* 7 — MUZDALIFAH (pick stones from the ground — natural) */
SCENES.push({
  id:7, loc:'🌙 Muzdalifah — Onder de sterren', ar:'مُزدَلِفَة',
  task:'🎯 Raap 7 steentjes van de grond',
  story:`Geen tent — je slaapt onder de sterren. Eerst: raap kleine steentjes voor de steniging morgen. Ze liggen verspreid op de grond.`,
  spawn:{x:0,z:0,face:0,bounds:{minX:-10,maxX:10,minZ:-10,maxZ:10}},
  light:{amb:0x223055,ambI:0.45,dir:0x5a6aa0,dirI:0.35,sky:0x06040f,exp:0.5},
  fog:{near:26,far:90},
  build(){
    groundTex(texSand(22),100,0x6a6258);
    const moon=sph(1,0xfff9e0,{emissive:0xfff0c0,emissiveIntensity:1}); moon.position.set(-6,7,-8); world.add(moon);
    mountainRange(55,0x241c14,14);
    for(let i=0;i<40;i++){ const st=sph(0.05,0xffffff,{emissive:0xffffff,emissiveIntensity:1}); st.castShadow=false;
      st.position.set((Math.random()-.5)*36,6+Math.random()*8,(Math.random()-.5)*36); world.add(st); }
    // sleeping pilgrims on mats + a few walking around
    [[-5,4],[5,3],[-4,-5],[6,-4],[2,6],[-8,7],[8,-7],[-7,-8]].forEach(p=>{
      const m=box(0.7,0.04,1.7,0x4a3a30); m.position.set(p[0],0.05,p[1]); world.add(m);
      const b=cyl(0.18,0.24,1.3,0xddd6c8,{roughness:1}); b.rotation.x=Math.PI/2; b.position.set(p[0],0.22,p[1]); b.castShadow=false; world.add(b);
      const h=sph(0.14,0xc9a06a); h.position.set(p[0],0.22,p[1]-0.8); h.castShadow=false; world.add(h); });
    addWanderers(5,{minX:-9,maxX:9,minZ:-9,maxZ:9});
    State.stonesCol=0;
    const pos=[[-3,-2],[2,-3],[3,2],[-2,3],[-5,1],[5,-1],[1,3],[-1,-4],[4.5,4.5],[-4.5,-4.5],[0,-3.5],
               [-6,-3],[6,3],[-6.5,4],[6.5,-4],[3.5,-6],[-3.5,6],[0,6.5]];
    pos.forEach((p,i)=>{
      const stone=sph(0.13,0x8a8478,{roughness:1}); stone.position.set(p[0],0.1,p[1]); stone.scale.set(1,.7,1); world.add(stone);
      Zone.add({ id:'stone-'+i, x:p[0], z:p[1], y:0.1, r:0.8, trigR:0.95, pickup:true, glow:true, icon:'🪨', label:'Raap op', guide:true,
        action:(z)=>{ world.remove(stone); State.stonesCol++; setProgress(`🪨 ${State.stonesCol}/7 steentjes`);
          if(State.stonesCol>=7){ showFeedback('✅ 7 steentjes! Je bidt Maghrib + Isha samen, dan rust je.',true,4000); showNextBtn('Eid al-Adha → Jamarat'); } }});
    });
    setProgress('🪨 0/7 steentjes');
  }
});

/* 8 — JAMARAT */
SCENES.push({
  id:8, loc:'💎 Mina — Jamarat al-Aqaba', ar:'رَمي الجَمَرَات',
  task:'🎯 Gooi 7 steentjes naar de pijler (druk 7× op A)',
  story:`Ibrahim عليه السلام verjoeg hier de shaytaan. Loop naar de pijler en gooi 7 steentjes, telkens "Allahu Akbar".`,
  spawn:{x:0,z:5,face:Math.PI,bounds:{minX:-7,maxX:7,minZ:0.6,maxZ:7}},
  light:{amb:0x9aa6c0,ambI:0.95,dir:0xfff0d8,dirI:0.95,sky:0x8aa6cc,exp:0.88},
  fog:{near:30,far:120},
  build(){
    groundTex(texSand(24),110,0x8a8278);
    const deck=box(16,0.06,14,0xffffff,{map:texAsphalt(8)}); deck.position.y=0.03; world.add(deck);
    // de iconische tentenstad van Mina rondom
    minaTentField(0,-12,7,18,2.5);
    minaTentField(-16,4,6,5,2.5); minaTentField(16,4,6,5,2.5);
    mountainRange(60,0x4a3a2c,12);
    // the pillar (wall) inside its oval basin ("put")
    const pillar=box(1.4,4,0.6,0x4a4858,{roughness:.8}); pillar.position.set(0,2,-2.5); world.add(pillar); jamPillar=pillar; jamPillarShake=0;
    const cap=box(1.7,0.4,0.9,0x5a5868); cap.position.set(0,4.1,-2.5); world.add(cap);
    const basinFloor=cyl(2.5,2.5,0.08,0x2e2c30); basinFloor.position.set(0,0.05,-2.5); basinFloor.scale.set(1.25,1,0.85); world.add(basinFloor);
    for(let i=0;i<22;i++){ const a=(i/22)*Math.PI*2;
      const seg=box(0.78,0.9,0.18,0x8a867c,{roughness:.9});
      seg.position.set(Math.cos(a)*3.1,0.45,-2.5+Math.sin(a)*2.1);
      seg.rotation.y=-a+Math.PI/2; world.add(seg);
      colliders.push({minX:seg.position.x-0.4,maxX:seg.position.x+0.4,minZ:seg.position.z-0.3,maxZ:seg.position.z+0.3});
    }
    // pebbles already in the basin + lamp posts
    for(let i=0;i<10;i++){ const pb=sph(0.07,0x9a948a); pb.position.set((Math.random()-.5)*3,0.12,-2.5+(Math.random()-.5)*2); pb.castShadow=false; world.add(pb); }
    [[-5,4],[5,4]].forEach(p=>lampPost(p[0],p[1]));
    world.add(makeCrowd(22,0,-2.5,0,{min:4.2,max:6.8}));   // rond de pijler, buiten de bak (binnenstraal 4.2 > bakwand ~3.1)
    addWanderers(5,{minX:-6,maxX:6,minZ:1.5,maxZ:6.5});
    everyMs(()=>spawnTextAt('اللّٰهُ أَكبَر',(Math.random()-.5)*5,2.2,1+Math.random()*3),3200);
    State.stonesThrown=0;
    Zone.add({ id:'throw', x:0, z:1.6, r:1.6, icon:'💎', label:'Gooi steen', noConsume:true, guide:true,
      action:(z)=>{ if(State.stonesThrown>=7)return; State.stonesThrown++;
        if(State.stonesThrown===1){ learnDua('takbir'); if(window.Recite)Recite.stopTalbiya(); }   // Talbiya stopt bij de eerste worp op Jamrat al-Aqaba
        setProgress(`💎 ${State.stonesThrown}/7 gegooid`);
        throwStone(Player.x,Player.z,0,-2.5);
        spawnTextAt('اللّٰهُ أَكبَر',Player.x,2.3,Player.z-0.5);
        if(State.stonesThrown>=7){ Zone.markDone(z); showFeedback('✅ Allahu Akbar! De shaytaan is symbolisch verdreven.',true,4000); showNextBtn('Naar de kapper →'); } }});
    setProgress('💎 0/7 gegooid');
  }
});
function throwStone(sx,sz,tx,tz){
  Sound.toss();
  const s=sph(0.1,0x999088); s.position.set(sx,1.4,sz); world.add(s);
  const start={x:sx,y:1.4,z:sz}, end={x:tx,y:2.2,z:tz}; let t=0;
  const iv=setInterval(()=>{ t+=0.06; const e=Math.min(1,t);
    s.position.x=start.x+(end.x-start.x)*e; s.position.z=start.z+(end.z-start.z)*e;
    s.position.y=start.y+(end.y-start.y)*e + Math.sin(e*Math.PI)*1.2;
    if(e>=1){ clearInterval(iv); world.remove(s); Sound.hit(); dustPuff(tx,2.0,tz);
      if(jamPillar){ jamPillarShake=0.25; } } },16);
}
let jamPillar=null, jamPillarShake=0;
function dustPuff(x,y,z){
  for(let i=0;i<7;i++){ const p=sph(0.12,0xb8a890,{roughness:1}); p.material.transparent=true; p.position.set(x,y,z); world.add(p);
    const a=Math.random()*Math.PI*2, sp=0.8+Math.random();
    let t=0; const iv=setInterval(()=>{ t+=0.04; p.position.x+=Math.cos(a)*sp*0.05; p.position.z+=Math.sin(a)*sp*0.05; p.position.y+=0.02;
      p.scale.multiplyScalar(1.06); p.material.opacity=Math.max(0,0.6-t*1.2);
      if(t>0.5){clearInterval(iv); world.remove(p);} },16);
  }
}

/* 9 — HALQ */
SCENES.push({
  id:9, loc:'✂️ Bij de kapper — Mina', ar:'الحَلق',
  task:'🎯 Loop naar de kapper en kies Halq of Taqsir',
  story:`Het is 10 Dhul Hijjah, de dag van Eid. Eerst regel je je <strong>Hadi</strong> (offerdier) bij het loket 🐑 — daarna naar de kapper voor Halq of Taqsir.`,
  spawn:{x:0,z:4,face:Math.PI,bounds:{minX:-6,maxX:6,minZ:-1,maxZ:6}},
  light:{amb:0x404058,ambI:0.7,dir:0xc8c8d8,dirI:0.7,sky:0x121028,exp:0.55},
  build(){
    groundTex(texSand(16),50,0x5a544c);
    minaTentField(0,-10,4,12,2.5);
    const chair=box(0.7,0.5,0.7,0x5a3a2a); chair.position.set(0,0.25,-2); world.add(chair);
    const back=box(0.7,0.9,0.12,0x6a4636); back.position.set(0,0.7,-2.3); world.add(back);
    const sign=emojiSprite('✂️',1.2); sign.position.set(0,2.4,-2.5); world.add(sign);
    // Hadi-loket (offerdier via tegoedbon)
    const kiosk=box(1.6,1.6,0.8,0x4a5a3a); kiosk.position.set(-4,0.8,0.5); world.add(kiosk);
    const kRoof=box(1.9,0.12,1.1,0x6a7a4a); kRoof.position.set(-4,1.7,0.5); world.add(kRoof);
    const counterH=box(1.6,0.1,0.5,0x8a7a5a); counterH.position.set(-4,0.95,1.05); world.add(counterH);
    const sheepSign=emojiSprite('🐑',0.9); sheepSign.position.set(-4,2.3,0.5); world.add(sheepSign);
    const clerk=makePilgrim(0x3a5a4a); clerk.position.set(-4,0,-0.2); clerk.rotation.y=0; clerk.userData.ph=Math.random()*6.28; world.add(clerk);
    State.hadiDone=false;
    Zone.add({ id:'hadi', x:-4, z:1.8, r:1.2, icon:'🐑', label:'Regel je Hadi (offer)', noConsume:true, guide:true,
      action:(z)=>{ if(State.hadiDone){ showFeedback('Je Hadi is al geregeld. 🐑',true,2000); return; }
        State.hadiDone=true; Zone.markDone(z); Sound.success();
        showFeedback('🐑 Hadi geregeld via een tegoedbon — het vlees gaat naar de armen. "Hun vlees noch bloed bereikt Allah, maar jullie taqwa bereikt Hem." (22:37)',true,6000);
        setProgress('✂️ Nu naar de kapper'); }});
    setProgress('🐑 Regel eerst je Hadi (loket links)');
    Zone.add({ id:'barber', x:0, z:-0.6, r:1.4, icon:'✂️', label:'Naar kapper', noConsume:true, guide:true,
      action:(z)=>{ if(!State.hadiDone){ showFeedback('⚠️ Regel eerst je Hadi bij het loket 🐑 — de volgorde op deze dag: stenigen → offeren → scheren.',false,3500); return; }
        openChoice({ ar:'الحَلق أو التَّقصِير', sub:'Kies je Tahallul', txt:'Hoe doe je je haar?',
        choices:[
          {txt:'🪒 Halq — volledig scheren (de Profeet ﷺ bad 3× voor wie scheert)',action:()=>{ Zone.markDone(z);
            Char.hair=(Char.gender==='female')?'short':'bald'; Player.build(); Sound.success();
            showFeedback(Char.gender==='female'?'✅ Je knipt een vingertoplengte af. الحمد لله':'✅ Allahu Akbar! Helemaal kaalgeschoren — je voelt je herboren. الحمد لله',true,4500); showNextBtn('Tawaf al-Ifada →'); }},
          {txt:'✂️ Taqsir — inkorten van alle kanten',action:()=>{ Zone.markDone(z);
            Char.hair='short'; Player.build(); Sound.success();
            showFeedback('✅ Taqsir: je haar is ingekort. De Profeet ﷺ bad één keer voor wie inkort.',true,4500); showNextBtn('Tawaf al-Ifada →'); }}
        ]}); }});
  }
});

/* 10 — TAWAF AL-IFADA */
SCENES.push({
  id:10, loc:"🕋 Tawaf al-Ifada + al-Wada", ar:'طَوَاف الإِفَاضَة',
  task:"🎯 Loop 7× rondom de Ka'ba — de afsluitende tawaf",
  story:`De afsluitende tawaf. Je Ihraam is af. Loop opnieuw 7× tegen de klok in rondom de Ka'ba.`,
  spawn:{x:5,z:0,face:-Math.PI/2,bounds:{minX:-11,maxX:11,minZ:-11,maxZ:11}},
  light:{amb:0x3a3654,ambI:0.8,dir:0xd8b86a,dirI:0.7,sky:0x141030,exp:0.6},
  fog:{near:34,far:150},
  cam:{dist:9,height:3.4,pitch:0.32},                   // uitgezoomd zoals de eerste tawaf
  onEnter:()=>{ Char.ihram=false; },
  build(){ tawafScene(true); },
  onExit(){ frameHook=null; }
});

/* 11 — MEDINA: MASJID AN-NABAWI + AL-BAQI (ziyarah, geen Hajj-rite) */
SCENES.push({
  id:11, loc:'🕌 Medina — Masjid an-Nabawi', ar:'المَسجِد النَّبَوِي',
  task:'🎯 Bezoek al-Baqi 🌴 en ga dan de moskee binnen via Bab as-Salam',
  story:`Welkom in <strong>Medina al-Munawwarah</strong> — de verlichte stad. Dit bezoek (ziyarah) is <em>aanbevolen maar geen onderdeel van de Hajj</em>.<br><br>🌴 Bezoek eerst <strong>al-Baqi</strong> — de oude begraafplaats naast de moskee (poort rechts), waar veel metgezellen en familie van de Profeet ﷺ rusten.<br><br>🕌 Ga daarna door de groene poort <strong>Bab as-Salam</strong> de moskee binnen voor de Rawda en de salam aan de Profeet ﷺ.`,
  spawn:{x:0,z:10,face:Math.PI,bounds:{minX:-15,maxX:17,minZ:-4.2,maxZ:13}},
  light:{amb:0xc8d2e0,ambI:0.9,dir:0xfff0d8,dirI:1.0,sky:0x9cc0e4,exp:0.92},
  fog:{near:34,far:140},
  cam:{dist:6.6,height:2.6},
  build(){
    groundTex(texSand(28),170,0xd8c8a8);                                    // woestijnbodem rondom de stad
    const plein=box(46,0.08,40,0xffffff,{map:texMarble(12),roughness:.9}); plein.position.set(0,0.045,2); plein.castShadow=false; world.add(plein);
    // donkere patroonvakken rond elke parasol (zoals het echte Nabawi-plein)
    for(let px4=-10;px4<=10;px4+=4){ [3.5,7.5].forEach(pz4=>{
      const kader=box(3.8,0.012,3.8,0x9a8d74,{roughness:.9}); kader.position.set(px4,0.092,pz4); kader.castShadow=false; world.add(kader);
      const binnen=box(3.2,0.014,3.2,0xe9e0cc,{roughness:.9}); binnen.position.set(px4,0.094,pz4); binnen.castShadow=false; world.add(binnen);
    }); }
    // ===== gevel met twee verdiepingen arcades =====
    const facade=box(30,7,0.6,0xead9b8,{roughness:.9}); facade.position.set(0,3.5,-5); world.add(facade);
    camOccluders.push(facade);
    for(let x=-13;x<=13;x+=2.2){ if(Math.abs(x)<1.3) continue;
      const arch=box(1.3,2.6,0.7,0x9a7a4a,{roughness:.85}); arch.position.set(x,1.3,-4.95); world.add(arch);
      const archTop=sph(0.65,0x9a7a4a,{roughness:.85},10); archTop.position.set(x,2.6,-4.95); archTop.scale.set(1,0.6,1); world.add(archTop);
      const arch2=box(1.0,1.7,0.5,0xb89a64,{roughness:.85}); arch2.position.set(x,4.6,-4.9); world.add(arch2);
      const arch2T=sph(0.5,0xb89a64,{roughness:.85},10); arch2T.position.set(x,5.5,-4.9); arch2T.scale.set(1,0.55,1); world.add(arch2T);
    }
    const roofline=box(30.4,0.5,0.9,0xd9c89e); roofline.position.set(0,7.2,-5); world.add(roofline);
    // Bab as-Salam: gouden portaal met groene deuren
    const portal=box(3.6,4.4,0.5,0xc9a84c,{metalness:.45,roughness:.4}); portal.position.set(0,2.2,-4.92); world.add(portal);
    const portalTop=sph(1.5,0xc9a84c,{metalness:.45,roughness:.4},14); portalTop.position.set(0,4.4,-4.92); portalTop.scale.set(1,0.6,0.35); world.add(portalTop);
    [-0.8,0.8].forEach(dx=>{ const deur=box(1.45,3.3,0.18,0x1f6b45,{roughness:.6}); deur.position.set(dx,1.65,-4.72); world.add(deur);
      for(let yy=0.7;yy<=2.7;yy+=0.5){ const stud=sph(0.05,0xc9a84c,{metalness:.6},6); stud.position.set(dx,yy,-4.6); stud.castShadow=false; world.add(stud); } });
    const babLbl=textSprite('بَاب السَّلَام','#f0d080'); babLbl.position.set(0,5.4,-4.6); world.add(babLbl);
    // DE GROENE KOEPEL boven de kamer van de Profeet ﷺ — Blender-model met procedurele fallback
    if(!Assets.spawn('dome_nabawi',4.5,-6.6,1.55,0,6.9)){
      const drum=cyl(1.9,2.1,1.8,0xe2d4b0,{roughness:.9},20); drum.position.set(4.5,7.9,-6.6); world.add(drum);
      const dome=sph(2.2,0x1f7a4d,{roughness:.45,metalness:.15},26); dome.position.set(4.5,9.4,-6.6); dome.scale.set(1,1.05,1); world.add(dome);
      const domeTip=cyl(0.02,0.2,1.0,0xc9a84c,{emissive:0x6b5012,emissiveIntensity:.6}); domeTip.position.set(4.5,11.6,-6.6); world.add(domeTip);
    }
    // rij zilveren koepeltjes op het dak
    [-10,-6,-2,2,8,12].forEach(x=>{ const sd=sph(0.7,0xd8d4c8,{roughness:.5,metalness:.2},14); sd.position.set(x,7.5,-6.2); sd.scale.set(1,0.75,1); sd.castShadow=false; world.add(sd); });
    // zes slanke minaretten met balkon (GLTF-model met fallback)
    [[-15,-6],[15,-6],[-9,-9.5],[9,-9.5],[-15,5],[15,5]].forEach(p=>{
      minaret(p[0],p[1],0.85);
    });
    // de beroemde plein-parasols (GLTF-model met fallback)
    for(let px=-10;px<=10;px+=4){ [3.5,7.5].forEach(pz=>nabawiParasol(px,pz,1.05)); }
    // ===== AL-BAQI: de oude begraafplaats naast de moskee =====
    const sand=box(7,0.05,11,0xffffff,{map:texSand(6),roughness:1}); sand.position.set(13.4,0.05,6.5); world.add(sand);
    const wallSegs=[
      {x:13.4,z:1.2,w:7,d:0.4},          // zuid
      {x:13.4,z:11.8,w:7,d:0.4},         // noord
      {x:16.8,z:6.5,w:0.4,d:11},         // oost
      {x:10.0,z:3.0,w:0.4,d:4.0},        // west — onder de poort
      {x:10.0,z:10.2,w:0.4,d:3.6},       // west — boven de poort
    ];
    wallSegs.forEach(s2=>{ const w=box(s2.w,1.15,s2.d,0xd8cdb2,{roughness:.95}); w.position.set(s2.x,0.57,s2.z); world.add(w);
      colliders.push({minX:s2.x-s2.w/2-0.15,maxX:s2.x+s2.w/2+0.15,minZ:s2.z-s2.d/2-0.15,maxZ:s2.z+s2.d/2+0.15}); });
    [[10.0,5.2],[10.0,7.8]].forEach(p=>{ const post=cyl(0.14,0.18,1.9,0xcfc4a8,{roughness:.9},10); post.position.set(p[0],0.95,p[1]); world.add(post); });
    const baqiLbl=textSprite('البَقِيع','#e8dcc0'); baqiLbl.position.set(10.0,2.6,6.5); world.add(baqiLbl);
    // eenvoudige, naamloze grafstenen — zoals al-Baqi er echt uitziet
    for(let gx=11.4;gx<=16.2;gx+=1.2){ for(let gz=2.4;gz<=11;gz+=1.35){
      if(Math.random()<0.12) continue;
      const h=0.28+Math.random()*0.3;
      const g2=box(0.16,h,0.34,[0x9a9286,0x8a8276,0xa8a094][Math.floor(Math.random()*3)],{roughness:1});
      g2.position.set(gx+(Math.random()-.5)*0.3, h/2+0.07, gz+(Math.random()-.5)*0.3);
      g2.rotation.y=(Math.random()-.5)*0.4; g2.rotation.z=(Math.random()-.5)*0.12; g2.castShadow=false; world.add(g2);
    }}
    // twee stille bezoekers tussen de graven
    [[12.4,4.6],[14.8,8.2]].forEach(p=>{ const v=pilgrimMesh(); v.position.set(p[0],0,p[1]); v.rotation.y=Math.PI/2; v.userData.ph=Math.random()*6.28; world.add(v); });
    // palmen rond plein en begraafplaats
    [[9.4,0.2],[9.4,12.6],[17,12.4],[-8,10],[-12,7],[8,10.5],[-14,2]].forEach(p=>palmTree(p[0],p[1],0.9+Math.random()*0.3));
    // ===== de stad rondom: hotels, berg Uhud, lantaarns, palmen =====
    hotelTower(-30,18,7,16,0x2a3046); hotelTower(-34,4,8,20,0x343a52); hotelTower(-29,-10,7,14,0x2e3448);
    hotelTower(30,20,8,18,0x262c40); hotelTower(34,0,7,15,0x32384e); hotelTower(27,-14,8,21,0x2a3046);
    hotelTower(-16,26,8,17,0x343a52); hotelTower(14,27,7,19,0x2e3448);
    // berg Uhud — de roodbruine bergrug ten noorden van de stad
    [[-26,-46,26,12],[6,-52,30,15],[38,-46,24,11]].forEach(p=>{
      const uh=cyl(1.5,p[2],p[3],0x7a4a38,{roughness:1},7); uh.position.set(p[0],p[3]/2-1,p[1]); uh.castShadow=false; uh.receiveShadow=false; world.add(uh); });
    // Nabawi-lantaarnpalen langs het plein
    [[-13,1],[-13,8],[13.5,13],[-8,12.5],[3,12.5],[13,-1]].forEach(p=>nabawiLamp(p[0],p[1]));
    // palmen in stenen plantenbakken
    [[-12,4],[-12,10],[6,12],[-4,12.6],[16.5,13]].forEach(p=>{
      const bak=cyl(0.85,0.95,0.55,0xcfc4ae,{roughness:.9},12); bak.position.set(p[0],0.27,p[1]); bak.castShadow=false; world.add(bak);
      palmTree(p[0],p[1],0.75+Math.random()*0.2); });
    // groene hekjes die de looproute naar Bab as-Salam markeren
    [-2.6,2.6].forEach(hx=>{ for(let hz=-2.8;hz<=1.2;hz+=2.1){
      const hek=box(0.08,0.5,2.0,0x1f6b45,{roughness:.5,metalness:.2}); hek.position.set(hx,0.3,hz); hek.castShadow=false; world.add(hek);
      colliders.push({minX:hx-0.15,maxX:hx+0.15,minZ:hz-1.05,maxZ:hz+1.05}); } });
    // mensen op het plein
    world.add(makeCrowd(28,-2,5,16));
    addWanderers(8,{minX:-12,maxX:7,minZ:1,maxZ:9});
    everyMs(()=>spawnDhikrAt(-1,2),3200);
    // ===== volgorde: (aanbevolen) al-Baqi → de moskee binnen =====
    State.baqiDone=false;
    setProgress('🌴 Bezoek al-Baqi (poort rechts) en ga dan naar binnen 🕌');
    Zone.add({ id:'enter', x:0, z:-3.5, r:1.5, icon:'🕌', label:'Ga de moskee binnen', noConsume:true, guide:true,
      action:()=>{
        if(!State.baqiDone){
          openChoice({ ar:'بَاب السَّلَام', sub:'De Poort van de Vrede',
            txt:'Wil je eerst <strong>al-Baqi</strong> bezoeken (aanbevolen — poort rechts 🌴), of meteen de moskee binnengaan?',
            choices:[
              {txt:'🕌 Naar binnen', action:()=>{ showFeedback('🕌 Je stapt met je rechtervoet naar binnen, met een du\'a voor de poorten van genade.',true,2500); Game.next(); }},
              {txt:'🌴 Eerst al-Baqi bezoeken', action:()=>{ showFeedback('🌴 De poort van al-Baqi is rechts naast de moskee.',true,3000); }}
            ]}); return; }
        showFeedback('🕌 Je stapt met je rechtervoet naar binnen, met een du\'a voor de poorten van genade.',true,2500);
        Game.next(); }});
    Zone.add({ id:'baqi', x:10.0, z:6.5, r:1.4, icon:'🌴', label:'Groet de mensen van al-Baqi', noConsume:true,
      action:()=>{ if(State.baqiDone){ showFeedback('Je hebt de mensen van al-Baqi al gegroet. 🤲',true,2200); return; }
        openChoice({ ar:'بَقِيع الغَرقَد', sub:'De oude begraafplaats van Medina — hier rusten o.a. Uthman, vrouwen en kinderen van de Profeet ﷺ en vele metgezellen',
          txt:'Geen namen, geen monumenten — eenvoudige graven, zoals de islam het leert. De Profeet ﷺ leerde ons hier te groeten:<br><br><em>"As-salamu alaykum, bewoners van deze verblijfplaats..."</em>',
          choices:[{txt:'🤲 Geef salam en maak du\'a voor hen', action:()=>{ State.baqiDone=true; learnDua('baqi'); Sound.success();
            Player.setPose('dua'); spawnTextAt('السَّلَامُ عَلَيكُم أَهلَ الدِّيَار',10.0,2.6,6.5,'#cfe0c8');
            showFeedback('✅ Je groet de mensen van al-Baqi en vraagt vergeving voor hen — en beseft: ook wij zullen hen eens volgen. Een les in nederigheid.',true,6000);
            setTimeout(()=>Player.setPose('stand'),2600); }}]}); }});
  }
});

/* 12 — BINNEN IN MASJID AN-NABAWI */
SCENES.push({
  id:12, loc:'🕌 In de gebedshal — Masjid an-Nabawi', ar:'الرَّوضَة الشَّرِيفَة',
  task:"🎯 1) Bid 2 rak'ah in de Rawda  2) Geef salam aan de Profeet ﷺ",
  story:`Je stapt door <strong>Bab as-Salam</strong> de koele gebedshal binnen — rode tapijten, witte zuilen met gouden kapitelen, kroonluchters.<br><br>1️⃣ Loop naar het <strong>groene tapijt van de Rawda</strong> — "een tuin van de tuinen van het Paradijs" — en bid er 2 rak'ah.<br>2️⃣ Geef daarna <strong>salam</strong> bij de gouden afscheiding van de kamer van de Profeet ﷺ — rustig, met zachte stem.`,
  spawn:{x:0,z:6.4,face:Math.PI,bounds:{minX:-11.4,maxX:9.3,minZ:-7.1,maxZ:7.3}},
  light:{amb:0xd8c8a8,ambI:0.85,dir:0xffe8c0,dirI:0.45,sky:0x14120e,exp:0.7,hemiI:0.3},
  fog:{near:40,far:120},
  cam:{dist:5.4,height:2.2,pitch:0.26,maxY:4.6,bound:{minX:-11.8,maxX:9.7,minZ:-7.6,maxZ:7.7}},
  build(){
    // vloer: gebedstapijt met saff-banen richting qibla
    const floor=box(24,0.06,17,0xffffff,{map:texCarpet(7),roughness:1}); floor.position.set(-1,0.03,0); world.add(floor);
    // hal-schil met GI gebakken in vertex-kleuren (Blender Cycles), unlit getoond — warme sfeer.
    // Fallback: vlakke procedurele wanden + plafond als het model niet laadt.
    const shell=Assets.spawn('nabawi_interior',-1,0,1,0);
    if(shell){ shell.traverse(o=>{ if(o.isMesh){ o.material=new THREER.MeshBasicMaterial({vertexColors:true}); o.castShadow=false; o.receiveShadow=false; } }); }
    else {
      const wallC=0xe8dcc2;
      [[24,0.4,-1,-8.2],[24,0.4,-1,8.2]].forEach(w=>{ const m=box(w[0],5.6,w[1],wallC,{roughness:.95}); m.position.set(w[2],2.8,w[3]); m.castShadow=false; world.add(m); });
      [[-12.2],[10.2]].forEach(w=>{ const m=box(0.4,5.6,17,wallC,{roughness:.95}); m.position.set(w[0],2.8,0); m.castShadow=false; world.add(m); });
      const ceil=box(24,0.3,17,0xf2e9d4,{roughness:1}); ceil.position.set(-1,5.75,0); ceil.castShadow=false; world.add(ceil);
      const trim=box(24,0.18,0.18,0xc9a84c,{metalness:.4,roughness:.4}); trim.position.set(-1,5.1,-7.95); trim.castShadow=false; world.add(trim);
    }
    // boogvensters met warm avondlicht
    for(let z=-6;z<=6;z+=3){ [-12,10].forEach(wx=>{
      const win=box(0.12,1.6,1.1,0xffd9a0,{emissive:0xffc070,emissiveIntensity:.7}); win.position.set(wx,3.4,z); win.castShadow=false; world.add(win);
    }); }
    // zuilen met gouden kapitelen + boogkappen
    [-9.5,-5,-0.5,4].forEach(cx=>[-4,0,4].forEach(cz=>{
      const col=cyl(0.3,0.34,4.4,0xf6f1e4,{roughness:.8},14); col.position.set(cx,2.2,cz); world.add(col);
      const capRing=cyl(0.42,0.36,0.3,0xc9a84c,{metalness:.5,roughness:.35},14); capRing.position.set(cx,4.5,cz); capRing.castShadow=false; world.add(capRing);
      const arch=sph(0.85,0xefe7d2,{roughness:.9},12); arch.position.set(cx,5.0,cz); arch.scale.set(1.5,0.55,1.5); arch.castShadow=false; world.add(arch);
      colliders.push({minX:cx-0.45,maxX:cx+0.45,minZ:cz-0.45,maxZ:cz+0.45});
    }));
    // kroonluchters
    [[-5,-2],[2,2],[-9,3]].forEach(p=>{
      const ring=cyl(0.7,0.7,0.16,0xc9a84c,{metalness:.6,roughness:.3},16); ring.position.set(p[0],3.9,p[1]); ring.castShadow=false; world.add(ring);
      const chain=cyl(0.03,0.03,1.6,0x8a7a3a); chain.position.set(p[0],4.9,p[1]); chain.castShadow=false; world.add(chain);
      for(let i=0;i<6;i++){ const a=(i/6)*Math.PI*2; const bulb=sph(0.09,0xfff0c8,{emissive:0xffd070,emissiveIntensity:1.2},8);
        bulb.position.set(p[0]+Math.cos(a)*0.55,3.82,p[1]+Math.sin(a)*0.55); bulb.castShadow=false; world.add(bulb); }
      const pl=new THREER.PointLight(0xffd9a0,0.75,13); pl.position.set(p[0],3.6,p[1]); world.add(pl);
    });
    // rij warme hanglantaarns tussen de zuilen (GLTF-model met fallback)
    [-7.2,-2.7,1.7].forEach(lx=>[-2,2].forEach(lz=>hangLantern(lx,lz,4.3,0.85)));
    // qibla-wand: MIHRAB (gouden nis) + MINBAR (preekstoel)
    const mihrabFrame=box(2.0,3.4,0.3,0xc9a84c,{metalness:.5,roughness:.35}); mihrabFrame.position.set(-2.5,1.7,-7.95); world.add(mihrabFrame);
    const niche=box(1.4,2.8,0.25,0x2a4a3a,{emissive:0x14301f,emissiveIntensity:.5}); niche.position.set(-2.5,1.4,-7.85); world.add(niche);
    const nicheTop=sph(0.7,0xc9a84c,{metalness:.5,roughness:.35},12); nicheTop.position.set(-2.5,3.4,-7.92); nicheTop.scale.set(1,0.75,0.3); world.add(nicheTop);
    const mb=new THREER.Group();
    for(let i=0;i<4;i++){ const tr=box(1.0,0.28,0.5,0xe8dfca,{roughness:.85}); tr.position.set(0,0.14+i*0.28,0.8-i*0.5); mb.add(tr); }
    [-0.5,0.5].forEach(s2=>{ const rail=box(0.08,1.3,2.4,0xd9cdaf,{roughness:.85}); rail.position.set(s2,0.85,0.05); mb.add(rail); });
    const canopy=sph(0.6,0x1f7a4d,{roughness:.5},12); canopy.position.set(0,2.6,-0.85); canopy.scale.set(1,0.7,1); mb.add(canopy);
    [-0.45,0.45].forEach(s2=>{ const post=cyl(0.05,0.05,1.6,0xc9a84c,{metalness:.4},8); post.position.set(s2,1.8,-0.85); mb.add(post); });
    mb.position.set(-5.4,0,-6.7); world.add(mb);
    colliders.push({minX:-6.1,maxX:-4.7,minZ:-7.4,maxZ:-5.5});
    // DE RAWDA: groen tapijt + wit-groene zuilen
    const rawda=box(5.4,0.05,3.2,0x2e8a55,{roughness:1,emissive:0x0f3a20,emissiveIntensity:.35}); rawda.position.set(-1.2,0.08,-5.6); world.add(rawda);
    const rawdaLbl=textSprite('الرَّوضَة','#9af0b4'); rawdaLbl.position.set(-1.2,2.9,-5.6); world.add(rawdaLbl);
    [-3.4,-1.2,1.0].forEach(x=>{ const rc=cyl(0.16,0.2,4.4,0xf8f5ea,{roughness:.8},12); rc.position.set(x,2.2,-6.6); world.add(rc);
      const gb=cyl(0.22,0.22,0.5,0x2e8a55,{roughness:.6},12); gb.position.set(x,1.3,-6.6); gb.castShadow=false; world.add(gb);
      colliders.push({minX:x-0.3,maxX:x+0.3,minZ:-6.9,maxZ:-6.3}); });
    // de gouden afscheiding van de Heilige Kamer (oostkant)
    const grille=box(0.3,2.6,5.0,0x9a7a2a,{metalness:.6,roughness:.35,emissive:0x3a2c08,emissiveIntensity:.4}); grille.position.set(8.6,1.3,-4.4); world.add(grille);
    for(let z=-6.6;z<=-2.3;z+=0.36){ const bar=cyl(0.035,0.035,2.5,0xc9a84c,{metalness:.7,roughness:.3},8); bar.position.set(8.4,1.3,z); world.add(bar); }
    const grTop=box(0.5,0.3,5.4,0x6b5012,{metalness:.5,roughness:.4}); grTop.position.set(8.6,2.75,-4.4); grTop.castShadow=false; world.add(grTop);
    colliders.push({minX:8.0,maxX:9.4,minZ:-7.2,maxZ:-1.8});
    camOccluders.push(grille);
    const grLbl=emojiSprite('🕊️',0.55); grLbl.position.set(8.2,3.4,-4.4); world.add(grLbl);
    // biddende rijen (saff) richting qibla — gescheiden mannen-/vrouwengedeelte.
    // De Rawda heeft aparte toegang/tijden voor mannen en vrouwen; hier tonen we
    // het mannengedeelte (links, qibla-zijde) en het vrouwengedeelte (rechts), met tussenruimte.
    const saff=(gen,x0,x1)=>{ for(let r=0;r<2;r++){ for(let x=x0;x<=x1;x+=1.7){
      if(Math.random()<0.2) continue;
      const p=pilgrimMesh(null,null,gen); p.position.set(x+(Math.random()-.5)*0.3,0,1.6+r*1.9); p.rotation.y=0; p.userData.ph=Math.random()*6.28; world.add(p);
    }} };
    saff('m',-9,-2.5);    // mannengedeelte (qibla-zijde)
    saff('f', 0.5, 6);    // vrouwengedeelte (apart, met tussenruimte)
    addWanderers(3,{minX:-10,maxX:-3,minZ:3,maxZ:6.5},'m');   // lopers blijven binnen hun eigen zijde
    addWanderers(3,{minX:0,maxX:7,minZ:3,maxZ:6.5},'f');
    everyMs(()=>spawnDhikrAt(-1,0),3400);
    // ===== taken: Rawda → salam =====
    State.rawdaDone=false; State.salamDone=false;
    setProgress("1️⃣ Bid 2 rak'ah in de Rawda (groen tapijt vooraan)");
    Zone.add({ id:'rawda', x:-1.2, z:-5.0, r:1.5, icon:'🤲', label:"Bid in de Rawda", noConsume:true, guide:true,
      action:(zz)=>{ if(State.rawdaDone){ showFeedback('Je hebt hier al gebeden. 🤲',true,2000); return; }
        openChoice({ ar:'الرَّوضَة الشَّرِيفَة', sub:'"Tussen mijn huis en mijn minbar ligt een tuin van de tuinen van het Paradijs" (Bukhari & Muslim)',
          txt:"Je staat op het groene tapijt van de Rawda. Bid hier 2 rak'ah — volg de bewegingen rustig.<br><br><em>Mannen en vrouwen bezoeken de Rawda op aparte tijden, via gescheiden toegang. Je reserveert je moment via de Nusuk-app.</em>",
          choices:[{txt:"🤲 Bid 2 rak'ah", action:()=>{ State.rawdaDone=true; if(zz)Zone.markDone(zz);
            Player.faceTowards(Player.x, Player.z-10);               // bid richting de qibla (mihrab, -z)
            Player.praySalat(2, ()=>{ Sound.success(); sparkle(Player.x,1.6,Player.z); learnDua('salawat');
              showFeedback("✅ Wat een bijzondere plek. Ga nu rustig naar de gouden afscheiding voor de salam. ➡️",true,5000);
              setProgress('2️⃣ Geef salam bij de gouden afscheiding (rechts)'); }); }}]}); }});
    Zone.add({ id:'salam', x:7.3, z:-4.4, r:1.5, icon:'🕊️', label:'Geef salam', noConsume:true, guide:true,
      action:(zz)=>{ if(!State.rawdaDone){ showFeedback('Bid eerst 2 rak\'ah in de Rawda (groen tapijt). 🤲',false,3000); return; }
        if(State.salamDone){ showFeedback('Je hebt je salam al gegeven. 🕊️',true,2000); return; }
        openChoice({ ar:'السَّلَام عَلَيكَ يَا رَسُولَ الله', sub:'Sta rustig, met respect — niet dringen, stem zacht',
          txt:'Je staat voor de kamer van de Profeet ﷺ. Geef je salam:<br><br><em>"As-salamu alayka ya Rasulallah"</em> 🕊️<br>Een stap verder: salam aan <strong>Abu Bakr</strong>, en daarna aan <strong>Umar</strong> (moge Allah tevreden met hen zijn).',
          choices:[{txt:'🕊️ Geef de salam en loop rustig door', action:()=>{ State.salamDone=true; State.medinaDone=true; Sound.success(); if(zz)Zone.markDone(zz);
            spawnTextAt('السَّلَامُ عَلَيكَ يَا رَسُولَ الله', Player.x, 2.4, Player.z, '#bfe8c0');
            showFeedback('✅ Salam gegeven — kalm en vol respect. De Profeet ﷺ zei: "Wie mij groet, Allah stuurt mijn ziel terug zodat ik zijn groet beantwoord."',true,6000);
            showNextBtn('Naar moskee Quba →'); }}]}); }});
  }
});

/* 12 — QUBA (eerste moskee van de islam) */
SCENES.push({
  id:13, loc:'🕌 Moskee Quba — Medina', ar:'مَسجِد قُبَاء',
  task:"🎯 Bid 2 rak'ah in Quba (beloning van een Umrah)",
  story:`<strong>Quba</strong> — de allereerste moskee van de islam, gebouwd door de Profeet ﷺ zelf bij aankomst in Medina.<br><br>De Profeet ﷺ zei: <em>"Wie zich thuis reinigt en naar Quba komt en er 2 rak'ah bidt, heeft de beloning van een Umrah."</em>`,
  spawn:{x:0,z:7,face:Math.PI,bounds:{minX:-8,maxX:8,minZ:-2,maxZ:8}},
  light:{amb:0xd4dce6,ambI:0.95,dir:0xfff4dc,dirI:1.05,sky:0xa8cce8,exp:0.95},
  fog:{near:30,far:110},
  build(){
    groundTex(texSand(18),80,0xcabb9e);
    // witte moskee met koepel en vier minaretten
    const hall=box(14,4.2,6,0xf6f2e8,{roughness:.92}); hall.position.set(0,2.1,-4); world.add(hall);
    colliders.push({minX:-7.2,maxX:7.2,minZ:-7.2,maxZ:-0.85});
    camOccluders.push(hall);
    for(let x=-5.5;x<=5.5;x+=2.2){ const arch=box(1.2,2.2,0.3,0xddd4c2,{roughness:.9}); arch.position.set(x,1.1,-0.9); world.add(arch);
      const at=sph(0.6,0xddd4c2,{roughness:.9},10); at.position.set(x,2.2,-0.9); at.scale.set(1,0.6,0.5); world.add(at); }
    const dome=sph(1.7,0xf2ede0,{roughness:.85},24); dome.position.set(0,5.0,-4); dome.scale.set(1,0.85,1); world.add(dome);
    const domeTip=cyl(0.02,0.16,0.8,0xc9a84c,{emissive:0x6b5012,emissiveIntensity:.55}); domeTip.position.set(0,6.6,-4); world.add(domeTip);
    [[-6.4,-1.4],[6.4,-1.4],[-6.4,-6.6],[6.4,-6.6]].forEach(p=>{
      const m=cyl(0.38,0.5,9,0xf6f2e8,{roughness:.9}); m.position.set(p[0],4.5,p[1]); m.castShadow=false; world.add(m);
      const tip=cyl(0.02,0.3,1.2,0xc9a84c,{emissive:0x6b5012,emissiveIntensity:.5}); tip.position.set(p[0],9.7,p[1]); tip.castShadow=false; world.add(tip); });
    // palmbomen (Medina staat bekend om zijn dadelpalmen) — GLTF met fallback
    [[-6,4],[6,4],[-8,1],[8,1],[-3,6.5],[3,6.5],[-10,5],[10,5],[-12,2],[12,2]].forEach(p=>palmTree(p[0],p[1],0.9+Math.random()*0.25));
    const courtyard=box(14,0.05,8,0xffffff,{map:texMarble(6),roughness:.9}); courtyard.position.set(0,0.04,3); world.add(courtyard);
    world.add(makeCrowd(12,0,3,12));
    addWanderers(4,{minX:-6,maxX:6,minZ:1,maxZ:7});
    State.qubaDone=false;
    Zone.add({ id:'quba', x:0, z:0.4, r:1.5, icon:'🤲', label:"Bid 2 rak'ah", noConsume:true, guide:true,
      action:(zz)=>{ if(State.qubaDone)return;
        State.qubaDone=true; if(zz)Zone.markDone(zz);
        showFeedback("🕌 Je bidt 2 rak'ah in Quba — volg de bewegingen.",true,2500);
        Player.faceTowards(Player.x, Player.z-10);                  // bid richting de qibla (-z, de moskee)
        Player.praySalat(2, ()=>{ Sound.success(); sparkle(Player.x,1.6,Player.z);
          showFeedback("✅ 2 rak'ah in Quba — met de beloning van een Umrah, in shaa Allah. Tijd om naar huis te gaan. 🏠",true,5500);
          showNextBtn('Naar huis →'); }); }});
  }
});

/* 13 — HOME */
SCENES.push({
  id:14, loc:'🏠 Thuis — Je bent terug', ar:'العَودَة',
  task:'🎯 Loop naar de voordeur',
  story:`Je bent thuis. Je familie wacht. Je bent veranderd — dat voel je diep van binnen.`,
  spawn:{x:0,z:4.4,face:Math.PI,bounds:{minX:-4.6,maxX:4.6,minZ:-4.6,maxZ:4.6}},
  light:{amb:0x7a6678,ambI:0.9,dir:0xffe0c0,dirI:0.85,sky:0x2a1f30,exp:0.62},
  build(){
    room(10,10,3.2,0x4a3a52,0x5a4a48);
    // floor rug under the seating
    const rug=box(3.6,0.04,2.8,0x7a3a2a); rug.position.set(2.2,0.02,1.6); world.add(rug);
    const rugB=box(3.9,0.02,3.1,0xc9a84c); rugB.position.set(2.2,0.005,1.6); world.add(rugB);
    // door + frame + welcome banner
    const door=box(1.2,2.4,0.12,0x2a1525); door.position.set(0,1.2,-4.85); world.add(door);
    const frame=box(1.5,2.7,0.06,0xc9a84c,{emissive:0x6b5012,emissiveIntensity:.4}); frame.position.set(0,1.35,-4.9); world.add(frame);
    const banner=emojiSprite('🎉',0.8); banner.position.set(0,2.7,-4.4); world.add(banner);
    // sofa + cushions
    const sofa=box(2.4,0.55,0.95,0x3a2a4a); sofa.position.set(2.6,0.32,2.2); world.add(sofa);
    const sofaBack=box(2.4,0.6,0.2,0x2f2240); sofaBack.position.set(2.6,0.65,2.65); world.add(sofaBack);
    [-0.7,0.7].forEach(o=>{ const c=box(0.5,0.16,0.5,0xc9a84c); c.position.set(2.6+o,0.62,2.1); world.add(c); });
    // coffee table + teapot
    const ct=box(1.1,0.1,0.6,0x4a3422); ct.position.set(2.4,0.45,1.0); world.add(ct);
    [[-.45,-.22],[.45,-.22],[-.45,.22],[.45,.22]].forEach(p=>{ const l=box(0.07,0.45,0.07,0x3a2a18); l.position.set(2.4+p[0],0.22,1.0+p[1]); world.add(l); });
    const tea=emojiSprite('🫖',0.42); tea.position.set(2.4,0.72,1.0); world.add(tea);
    // tv cabinet on right wall
    const cab=box(0.4,0.6,2.4,0x2a2030); cab.position.set(4.7,0.3,-1.2); world.add(cab);
    const tv=box(0.08,1.1,1.9,0x0a0a10,{emissive:0x10324a,emissiveIntensity:.6}); tv.position.set(4.55,1.4,-1.2); world.add(tv);
    // dining nook (table + chairs) left side
    const dt=box(1.6,0.12,1.0,0x5a4028); dt.position.set(-2.8,0.78,1.6); world.add(dt);
    [[-.7,-.4],[.7,-.4],[-.7,.4],[.7,.4]].forEach(p=>{ const lg=box(0.08,0.78,0.08,0x3a2a18); lg.position.set(-2.8+p[0],0.39,1.6+p[1]); world.add(lg); });
    chair(-2.8,2.5,Math.PI); chair(-2.8,0.7,0); chair(-3.9,1.6,Math.PI/2);
    const food=emojiSprite('🍲',0.5); food.position.set(-2.8,1.05,1.6); world.add(food);
    const dates=emojiSprite('🌴',0.4); dates.position.set(-3.1,1.0,1.9); world.add(dates);
    // bookshelf with Qurans on left-back wall
    bookshelf(-4.4,-2.6,Math.PI/2);
    // prayer corner (rug + Ka'ba pic) back-right
    rugMat(3.6,-3.4,0x2a4a3a);
    const pic=box(1.0,0.8,0.05,0xc9a84c); pic.position.set(2.0,2.0,-4.86); world.add(pic);
    const picIn=box(0.85,0.65,0.03,0x10101a,{emissive:0x3a2a10,emissiveIntensity:.3}); picIn.position.set(2.0,2.0,-4.83); world.add(picIn);
    const picK=emojiSprite('🕋',0.5); picK.position.set(2.0,2.0,-4.77); world.add(picK);
    // calligraphy above the door
    const calli=emojiSprite('🕌',0.5); calli.position.set(0,2.2,-4.8); world.add(calli);
    // daylight window on left wall + plants
    const win=box(0.06,1.5,2.0,0xbfe0ff,{emissive:0x6aa0d0,emissiveIntensity:.6}); win.position.set(-4.86,1.95,-0.6); world.add(win);
    potplant(-4.3,3.6,1.1); potplant(4.3,3.6,0.9);
    // shoes by the door
    [-0.4,0.4].forEach((o,i)=>{ const sh=box(0.18,0.1,0.32,i?0x6a4a2a:0x4a3422); sh.position.set(o,0.05,-3.3); world.add(sh); });
    // hanging lantern + cosy lamp
    const lantern=cyl(0.16,0.12,0.4,0xc9a84c,{emissive:0xffcc66,emissiveIntensity:1.0}); lantern.position.set(0,2.5,-1.5); world.add(lantern);
    const lamp=new THREER.PointLight(0xffd9a0,1.1,16); lamp.position.set(0.5,2.7,0.5); world.add(lamp);
    // family waiting near the door
    const fam=[{x:-1.3,z:-2.2,c:0x8a4a6a},{x:1.3,z:-2.2,c:0x3a6a7a},{x:-0.6,z:-1.6,c:0x6a5a3a}];
    fam.forEach(f=>{ const p=makePilgrim(f.c,'🙂'); p.position.set(f.x,0,f.z); p.rotation.y=0; p.userData.ph=Math.random()*6.28; world.add(p); });
    sceneTimeout(()=>learnDua('terugkeer'),1500);
    if(State.zamzamBottle){
      Zone.add({ id:'gift', x:0.8, z:-2.2, r:1.3, icon:'🎁', label:'Geef Zamzam & dadels', noConsume:true,
        action:()=>{ if(State.gaveZamzam){ showFeedback('Je familie geniet al van de Zamzam. 😊',true,2000); return; }
          State.gaveZamzam=true; Sound.success(); sparkle(0.8,1.4,-2.2);
          showFeedback('🎁 Je deelt Zamzam 🧴 en dadels 🌴 uit — zoals hajji\'s al eeuwen doen. De gezichten van je familie stralen. Alhamdulillah!',true,5500); }});
    }

    Zone.add({ id:'door', x:0, z:-3.6, r:1.3, icon:'🚪', label:'Naar je familie', guide:true,
      action:()=>{ showFeedback('🏆 Mabroek! Je bent een Hajji. Je familie omhelst je.',true,3000); setTimeout(()=>renderEnding(),2200); }});
  }
});

// ---- shared tawaf scene + frame hook ----
function tawafScene(){
  groundTex(texMarble(34),150,0xf0e8d6);
  kaaba(0,0);
  haramSurround(0,0,16);
  meccaSkyline(0,0,16);
  world.add(makeOrbitCrowd(90));
  // dashed path ring (visual)
  const ring=new THREER.Mesh(new THREER.RingGeometry(4.2,4.4,64),
    new THREER.MeshBasicMaterial({color:0xc9a84c,transparent:true,opacity:.3,side:THREER.DoubleSide}));
  ring.rotation.x=-Math.PI/2; ring.position.y=0.02; world.add(ring);
  // ===== START: de Zwarte Steen (Hajar al-Aswad) — duidelijk gemarkeerd =====
  const stone=box(0.5,1.0,0.3,0x111016,{emissive:0x3a2a10,emissiveIntensity:.5}); stone.position.set(4.4,0.5,0); world.add(stone);
  const stoneFrame=box(0.7,1.2,0.18,0xc9a84c,{metalness:1,roughness:.3}); stoneFrame.position.set(4.55,0.6,0); world.add(stoneFrame);
  // groene startlijn op de mataf (de echte groene lijn die de start/eind-lijn markeert)
  const startLine=box(0.45,0.05,4.2,0x2fd95f,{emissive:0x18b23e,emissiveIntensity:.8}); startLine.position.set(5.8,0.07,0); startLine.castShadow=false; world.add(startLine);
  // 2-regelig label hóóg boven de Zwarte-Steen-markering (boven de menigte) → naam↔hoek meteen duidelijk
  const startLbl=textSprite('الحَجَر الأَسوَد\n🟢 Zwarte Steen — start','#9af0b4',{h:0.95}); startLbl.position.set(4.6,3.0,0); world.add(startLbl);
  // Rukn al-Yamani: de hoek vlak vóór de Zwarte Steen — vanaf hier de Rabbana-du'a
  const yamDisc=cyl(0.6,0.6,0.06,0xc9a84c,{metalness:.6,roughness:.4},20); yamDisc.position.set(2.7,0.05,2.7); yamDisc.castShadow=false; world.add(yamDisc);
  const yam=cyl(0.14,0.18,0.9,0x7a6a48,{roughness:.6,emissive:0x2a2212,emissiveIntensity:.3},12); yam.position.set(2.7,0.48,2.7); world.add(yam);
  const yamLbl=textSprite('الرُّكن اليَمَاني\nRukn al-Yamani','#f0d080',{h:0.9}); yamLbl.position.set(2.9,2.85,2.9); world.add(yamLbl);
    State.tawaf=0; State.tawafAngle=null; State.tawafAccum=0; State.tawafSimOffered=false;
    setProgress('🕋 Ronde 0/7 — start bij de groene lijn');
  sceneTimeout(()=>showFeedback('🟢 Begin bij de <strong>Zwarte Steen</strong> (groene lijn). Loop <strong>tegen de klok in</strong> met de Ka\'ba aan je <strong>linkerhand</strong>.<br>Tussen <em>Rukn al-Yamani</em> en de Zwarte Steen zeg je: <em>رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً</em>.',true,8000),700);
  everyMs(spawnDhikr,2200);
  sceneTimeout(angryEncounter,9000);
  let rabbanaSeg=false;
  frameHook=()=>{
    const a=Math.atan2(Player.z,Player.x);
    if(State.tawafAngle===null){ State.tawafAngle=a; return; }
    // Rabbana atina klinkt tussen Rukn al-Yamani (~45°) en de Zwarte Steen (0°) — op de juiste plek
    const inSeg=(a>0.04 && a<0.80);
    if(inSeg){ if(!rabbanaSeg){ rabbanaSeg=true; if(window.Recite)Recite.duaHere('rabbana',0.7); } }
    else rabbanaSeg=false;
    let d=a-State.tawafAngle;
    if(d>Math.PI)d-=Math.PI*2; if(d<-Math.PI)d+=Math.PI*2;
    State.tawafAccum+=d; State.tawafAngle=a;
    const rounds=Math.floor(Math.abs(State.tawafAccum)/(Math.PI*2));
    if(rounds>State.tawaf && rounds<=7){
      State.tawaf=rounds; Sound.round(); setProgress(`🕋 Ronde ${State.tawaf}/7`);
      learnDua('rabbana'); spawnTextAt('رَبَّنَا آتِنَا فِي الدُّنيَا حَسَنَة', Player.x, 2.4, Player.z, '#f0d080');
      showFeedback(`✅ Ronde ${State.tawaf} voltooid!${State.tawaf<7?'':' Allahu Akbar!'}`,true,2200);
      if(State.tawaf>=2 && State.tawaf<7 && !State.tawafSimOffered && !Player.simOrbit){
        State.tawafSimOffered=true; showSimBtn('⏩ Simuleer de resterende rondes', startTawafSim);
      }
      if(State.tawaf>=7){ frameHook=null; Player.simOrbit=false; clearSimBtn();
        setTimeout(()=>{
          if(State.scene===4){
            showFeedback("✅ 7 rondes voltooid! Bid nu 2 rak'ah achter Maqam Ibrahim 🕌 (en drink daarna Zamzam 💧).",true,5500);
            setProgress("🕌 Bid 2 rak'ah bij Maqam Ibrahim");
          } else {
            showFeedback('✅ Tawaf al-Ifada voltooid — alle zuilen van je Hajj zijn volbracht! Allahu Akbar! 🕋',true,4500);
            openChoice({ ar:'المَدِينَة المُنَوَّرَة', sub:'Aanbevolen bezoek (geen onderdeel van de Hajj)',
              txt:'Wil je <strong>Medina</strong> bezoeken — de stad van de Profeet ﷺ — met de Rawda en moskee Quba? Dit is een aanbevolen ziyarah, maar hoort niet bij de Hajj-riten.',
              choices:[
                {txt:'🕌 Ja, naar Medina al-Munawwarah', action:()=>{ State.medinaChosen=true; showNextBtn('Naar Medina →'); }},
                {txt:'🏠 Nee, direct naar huis', action:()=>{ State.medinaChosen=false; showNextBtn('Naar huis →'); }}
              ]});
          } },1400); }
    }
  };
}
// crowd that slowly circles the Ka'ba (anti-clockwise)
function makeOrbitCrowd(n){
  const grp=new THREER.Group();
  for(let i=0;i<n;i++){
    const p=pilgrimMesh();
    const r=3.2+Math.random()*7.5, a=(i/n)*Math.PI*2;
    p.position.set(Math.cos(a)*r,0,Math.sin(a)*r);
    p.userData.orbit={r:r, a:a, sp:-(0.09+Math.random()*0.08)};  // negative = anti-clockwise
    grp.add(p);
  }
  return grp;
}
// tekstlabel/sprite: dynamisch canvas, meerdere regels ('\n'), leesbaar paneel, crisp lettertype
function textSprite(text,color,opts){
  opts=opts||{};
  const fs=opts.fontSize||74, padX=30, padY=18, lineH=Math.round(fs*1.24);
  const lines=String(text).split('\n');
  const meas=document.createElement('canvas').getContext('2d');
  meas.font='bold '+fs+'px Amiri, serif';
  let tw=0; lines.forEach(l=>{ tw=Math.max(tw, Math.ceil(meas.measureText(l).width)); });
  const h=lines.length*lineH + padY*2;
  const c=document.createElement('canvas'); c.width=tw+padX*2; c.height=h;
  const x=c.getContext('2d');
  if(opts.panel!==false){                                  // afgerond donker paneel → leesbaar tegen elke achtergrond
    const rr=24, w=c.width; x.fillStyle='rgba(8,6,16,0.55)';
    x.beginPath(); x.moveTo(rr,5); x.lineTo(w-rr,5); x.arcTo(w-5,5,w-5,rr,rr); x.lineTo(w-5,h-rr);
    x.arcTo(w-5,h-5,w-rr,h-5,rr); x.lineTo(rr,h-5); x.arcTo(5,h-5,5,h-rr,rr); x.lineTo(5,rr); x.arcTo(5,5,rr,5,rr); x.closePath(); x.fill();
    x.lineWidth=3; x.strokeStyle='rgba(201,168,76,0.5)'; x.stroke();
  }
  x.font='bold '+fs+'px Amiri, serif'; x.textAlign='center'; x.textBaseline='middle';
  x.shadowColor='rgba(0,0,0,.85)'; x.shadowBlur=6; x.fillStyle=color||'#f0d080';
  lines.forEach((l,i)=>{ x.fillText(l, c.width/2, padY + lineH*(i+0.5)); });
  const t=new THREER.CanvasTexture(c); t.anisotropy=4;
  const m=new THREER.SpriteMaterial({map:t,transparent:true,depthWrite:false});
  const s=new THREER.Sprite(m); const sc=opts.h||0.85; s.scale.set(sc*c.width/h, sc, 1); return s;
}
function spawnDhikr(){ spawnDhikrAt(0,0); }
function spawnDhikrAt(cx,cz){
  if(!el('screen-game').classList.contains('active'))return;
  const phrases=['اللّٰهُ أَكبَر','لَبَّيْكَ','سُبْحَانَ اللّٰه'];
  spawnTextAt(phrases[Math.floor(Math.random()*phrases.length)], cx+(Math.random()-.5)*4, 2.2, cz+(Math.random()-.5)*4);
}
// rising, fading text at a world position
function spawnTextAt(txt,x,y,z,color){
  if(!el('screen-game').classList.contains('active'))return;
  const s=textSprite(txt,color,{panel:false}); s.position.set(x,y,z); world.add(s);
  let t=0; const iv=setInterval(()=>{ t+=0.03; s.position.y+=0.02; s.material.opacity=Math.max(0,0.95-t*0.85);
    if(t>1.15){ clearInterval(iv); world.remove(s); } },16);
}
// wandering pilgrims: walk between random points, greet you when you come close
function addWanderers(n,area,gender){
  for(let i=0;i<n;i++){
    const p=pilgrimMesh(null,null,gender);
    const rx=()=>area.minX+Math.random()*(area.maxX-area.minX);
    const rz=()=>area.minZ+Math.random()*(area.maxZ-area.minZ);
    p.position.set(rx(),0,rz());
    p.userData.wander={area:area, tx:rx(), tz:rz(), sp:0.7+Math.random()*0.7, wait:Math.random()*2, greetCd:0, ph:Math.random()*6.28};
    world.add(p);
  }
}
// glowing burst when raising hands in du'a
function duaGlow(x,z){
  const ring=new THREER.Mesh(new THREER.RingGeometry(0.3,0.55,40),
    new THREER.MeshBasicMaterial({color:0xffd870,transparent:true,opacity:.8,side:THREER.DoubleSide}));
  ring.rotation.x=-Math.PI/2; ring.position.set(x,0.05,z); world.add(ring);
  const light=new THREER.PointLight(0xffe0a0,2.2,10); light.position.set(x,1.6,z); world.add(light);
  let t=0; const iv=setInterval(()=>{ t+=0.03; ring.scale.multiplyScalar(1.07); ring.material.opacity=Math.max(0,0.8-t*0.9);
    light.intensity=Math.max(0,2.2-t*3);
    if(t>0.9){ clearInterval(iv); world.remove(ring); world.remove(light); } },16);
}

// ============================================================
//  ENCOUNTERS — NPCs that walk up and need a response
// ============================================================
function spawnEncounter(opts){
  if(encounter)return;
  const npc=makePilgrim(opts.color||0xb04a3a, opts.emoji||null);
  const a=opts.fromAngle!==undefined?opts.fromAngle:(Math.random()*Math.PI*2);
  const r=opts.from||6;
  npc.position.set(Player.x+Math.cos(a)*r,0,Player.z+Math.sin(a)*r);
  world.add(npc);
  encounter={ npc, speed:opts.speed||2.3, triggered:false, opts, leaving:false, ph:0 };
}
function triggerEncounter(){
  const e=encounter; if(!e||e.triggered)return; e.triggered=true; paused=true;
  // face player
  const o=e.opts;
  openChoice({ ar:o.ar||'الصَّبر', sub:o.sub||'', txt:o.txt||'',
    choices:o.choices.map(c=>({ txt:c.txt, action:()=>resolveEncounter(c) })) });
}
function resolveEncounter(choice){
  const e=encounter; if(!e)return;
  if(choice.sabr){ State.sabr++; Sound.success(); if(e.npc.userData.emoji){ e.npc.userData.emoji.material.map=emojiTexture('🙂'); e.npc.userData.emoji.material.needsUpdate=true; } }
  else { Sound.bad(); }
  showFeedback(choice.result||'',choice.sabr!==false, 4800);
  e.leaving=true; e.leaveDir=Math.atan2(e.npc.position.z-Player.z, e.npc.position.x-Player.x);
  paused=false;
  // remove npc after it walks off
  sceneTimeout(()=>{ if(encounter&&encounter.npc){ world.remove(encounter.npc); } encounter=null; }, 2600);
}
function updateEncounter(dt){
  const e=encounter; if(!e||!e.npc)return;
  const npc=e.npc;
  if(!e.triggered){
    const dx=Player.x-npc.position.x, dz=Player.z-npc.position.z; const d=Math.hypot(dx,dz);
    npc.rotation.y=Math.atan2(-dx,-dz);
    e.ph+=dt*8; npc.position.y=Math.abs(Math.sin(e.ph))*0.05;
    if(d>1.5){ npc.position.x+=dx/d*e.speed*dt; npc.position.z+=dz/d*e.speed*dt; }
    else { triggerEncounter(); }
  } else if(e.leaving){
    npc.position.x+=Math.cos(e.leaveDir)*e.speed*dt; npc.position.z+=Math.sin(e.leaveDir)*e.speed*dt;
    e.ph+=dt*8; npc.position.y=Math.abs(Math.sin(e.ph))*0.05;
    npc.rotation.y=Math.atan2(-Math.cos(e.leaveDir),-Math.sin(e.leaveDir));
  }
}
// the angry-pilgrim encounter (used in crowded scenes)
function angryEncounter(){
  if(State.angryDone)return; State.angryDone=true;
  spawnEncounter({ color:0xb0463a, emoji:'😠', speed:2.6,
    ar:'الصَّبر', sub:'Drukte rond de Ka\'ba',
    txt:'In de massa botst een geïrriteerde pelgrim hard tegen je aan en snauwt: "Kijk uit waar je loopt!" Wat doe je?',
    choices:[
      {txt:'🤲 Sabr — glimlach, zeg rustig "geen probleem" en loop door', sabr:true,
        result:'✅ Je koos geduld. Een hajji beheerst zijn boosheid — "...en wie vergeeft en verzoent, zijn beloning is bij Allah." Je hart blijft kalm. (+Sabr)'},
      {txt:'😤 Snauw terug en eis excuses', sabr:false,
        result:'❌ Je verheft je stem. De spanning stijgt en je innerlijke rust is even weg. Een hajji laat zich niet meeslepen.'}
    ]});
}
function saiEncounter(){
  if(State.saiHelpDone)return; State.saiHelpDone=true;
  spawnEncounter({ color:0x5a6a7a, emoji:'🧓', speed:1.7,
    ar:'الإِحسَان', sub:'Tussen Safa en Marwa',
    txt:'Een oudere pelgrim raakt buiten adem en wankelt naast je. Wat doe je?',
    choices:[
      {txt:'🤝 Help — ondersteun hem en geef wat Zamzam-water', sabr:true,
        result:'✅ Je helpt een vermoeide pelgrim. "De beste mensen zijn zij die het nuttigst zijn voor anderen." (+Sabr)'},
      {txt:'🚶 Loop door — je wilt je eigen Sa\'i afmaken', sabr:false,
        result:'⚠️ Je loopt door. Misschien had juist hier iemand je hulp nodig...'}
    ]});
}
