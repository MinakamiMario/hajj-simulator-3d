'use strict';
// ============================================================
//  SCENE LOADER
// ============================================================
function clearWorld(){ for(let i=world.children.length-1;i>=0;i--){ const c=world.children[i]; world.remove(c); } }
let sceneIntervals=[];
function everyMs(fn,ms){ const id=setInterval(fn,ms); sceneIntervals.push(id); return id; }
function sceneTimeout(fn,ms){ const id=setTimeout(fn,ms); sceneIntervals.push(id); return id; }
function clearSceneIntervals(){ sceneIntervals.forEach(id=>{ clearInterval(id); clearTimeout(id); }); sceneIntervals=[]; }
function loadScene(id){
  const s=SCENES[id]; State.scene=id; frameHook=null; jamPillar=null;
  encounter=null; paused=false; closeChoice(); colliders=[]; camOccluders.length=0; terrainFn=null;
  clearSceneIntervals();
  clearWorld(); Zone.clear();
  document.querySelectorAll('.feedback-bar,.next-bar,.sim-bar').forEach(n=>n.remove());
  // lighting
  const L=s.light||{};
  const skyC=L.sky!==undefined?L.sky:0x06040f;
  // luchtkoepel met gradient + (bij nacht) sterrenveld
  const sky=makeSky(skyC);
  world.add(sky.dome);
  if(lum(skyC)<0.10) world.add(makeStarField(340));
  scene.background=new THREER.Color(skyC);
  // omgevings-reflectie uit een losse sky-scène (raakt de hoofdscène niet) → metallic goud/marmer spiegelt de lucht
  if(pmremGen){
    if(envRT)envRT.dispose();
    const envScene=new THREER.Scene();
    const ed=makeSky(skyC).dome; ed.scale.setScalar(0.2); envScene.add(ed);   // kleine dome binnen camerabereik
    envRT=pmremGen.fromScene(envScene,0.0,0.1,200); scene.environment=envRT.texture;
  }
  const fogCfg=s.fog||{near:26,far:80};
  scene.fog=new THREER.Fog(sky.horizon, fogCfg.near, fogCfg.far);
  // per-scène belichting (color grade): L.exp stuurt de tone-mapping exposure
  renderer.toneMappingExposure=(L.exp!==undefined?L.exp:0.75);
  // compensatie: sRGB-output tilt middentonen op, dus scènewaarden (getuned op v3) omlaag schalen
  ambLight.color.set(L.amb!==undefined?L.amb:0x334466); ambLight.intensity=(L.ambI!==undefined?L.ambI:0.6)*0.6;
  dirLight.color.set(L.dir!==undefined?L.dir:0xffffff); dirLight.intensity=(L.dirI!==undefined?L.dirI:0.8)*0.85;
  if(hemiLight){
    hemiLight.color.set(lighten(mixHex(skyC,0xffffff,0.3),1.2));
    hemiLight.groundColor.set(0x4a3a2c);
    hemiLight.intensity=L.hemiI!==undefined?L.hemiI:0.18;
  }
  if(s.onEnter)s.onEnter();
  Player.scaleVal=(s.cam&&s.cam.playerScale)?s.cam.playerScale:1;
  if(s.build)s.build();
  Player.spawn(s.spawn||{x:0,z:3});
  // orient player toward the first objective (or scene centre), camera behind
  let tx=0,tz=0;
  if(Zone.list.length){ tx=Zone.list[0].x; tz=Zone.list[0].z; }
  const odx=tx-Player.x, odz=tz-Player.z;
  Player.faceY=(odx===0&&odz===0)?Player.faceY:Math.atan2(-odx,-odz);
  Player.updateTransform();
  const C=s.cam||{};
  Cam.dist=C.dist!==undefined?C.dist:6.2;
  Cam.height=C.height!==undefined?C.height:2.4;
  Cam.maxY=C.maxY!==undefined?C.maxY:null;
  Cam.bound=C.bound||null;
  Cam.yaw=Player.faceY; Cam.pitch=C.pitch!==undefined?C.pitch:0.32;
  Cam.update();
  showSceneTitle(s);
  const AMBIENTS=['night','outdoor','plane','crowd','crowd','crowd','outdoor','night','crowd','outdoor','crowd','crowd','crowd','outdoor','outdoor'];
  Sound.setAmbient(AMBIENTS[id]||null);
  updateHUD(s); setTask(s);
  if(typeof Gids!=='undefined') Gids.start(typeof NARRATION!=='undefined'?NARRATION[id]:null);   // reisbegeleider-narratie
}

// ============================================================
//  ENDING
// ============================================================
function renderEnding(){
  const items=['Niyyah gemaakt','Koffer gepakt','Ihraam aangenomen',"Ka'ba gezien",'Tawaf (7 rondjes)',
    "2 rak'ah bij Maqam Ibrahim"+(State.zamzamDone?' + Zamzam':''),
    "Sa'i (Safa–Marwa)",'Wuquf op Arafat','Nacht in Muzdalifah','7 steentjes geraapt',
    'Jamarat al-Aqaba gesteenigd','Hadi (offer) geregeld','Haar geschoren/ingekort','Tawaf al-Ifada + al-Wada'];
  if(State.medinaDone) items.push('Ziyarah: Rawda + salam aan de Profeet ﷺ');
  if(State.baqiDone) items.push('Ziyarah: salam aan de mensen van al-Baqi');
  if(State.qubaDone) items.push("Quba: 2 rak'ah (beloning van een Umrah)");
  if(State.gaveZamzam) items.push('Zamzam & dadels mee naar huis 🧴');
  const faqs=[
    ['Wat is het verschil tussen Hajj en Umrah?','De Hajj is de grote bedevaart met vaste dagen (8–13 Dhul Hijjah) en is één van de vijf zuilen — eens in je leven verplicht als je het kunt. De Umrah is de "kleine" bedevaart (tawaf + sa\'i + knippen/scheren) en kan het hele jaar door.'],
    ['Moet ik de Niyyah hardop uitspreken?','Nee. De Niyyah (intentie) zit in het hart. Hardop uitspreken is niet nodig; de Talbiyah spreek je wél hardop uit.'],
    ['Wat mag niet in staat van Ihraam?','O.a. parfum gebruiken, haar of nagels knippen, jagen, ruzie maken en (voor mannen) genaaide kleding en het bedekken van het hoofd. Een horloge, bril, riem en sandalen mogen wel.'],
    ['Dragen vrouwen ook witte Ihraam-kleding?','Nee. De Ihraam van de vrouw is haar gewone bedekkende kleding, in elke kleur. Gezicht en handen blijven onbedekt: geen niqab en geen handschoenen tijdens de Ihraam. De witte izar en rida zijn alleen voor mannen.'],
    ['Waar doe ik de Ihraam aan?','Vóór het passeren van de Miqaat. Dat kan thuis, op het vliegveld of in het vliegtuig — zolang je de Miqaat niet zonder Ihraam passeert wanneer je Hajj of Umrah van plan bent.'],
    ['Wat als ik een tawaf-ronde vergeet te tellen?','Ga uit van het aantal waar je zéker van bent (het laagste) en maak de rondes af. Twijfel achteraf hoef je niet te herstellen.'],
    ['Waarom joggen mannen tussen de groene lampen bij Sa\'i?','Het herdenkt het rennen van Hajar op zoek naar water voor Ismail. Mannen joggen licht (ramal) tussen de groene markeringen; vrouwen lopen gewoon door.'],
    ['Wat is de belangrijkste dag van de Hajj?','De dag van Arafat (9 Dhul Hijjah). De Profeet ﷺ zei: "De Hajj is Arafat." Wie de wuquf op Arafat mist, mist de Hajj.'],
    ['Hoeveel steentjes heb ik nodig?','Voor 10 Dhul Hijjah: 7 voor Jamarat al-Aqaba. Blijf je de dagen erna in Mina, dan gooi je per dag 7 bij elk van de drie jamarat (21 per dag).'],
    ['Moet ik mijn hoofd kaalscheren?','Mannen kiezen tussen kaalscheren (halq, met meer beloning) of inkorten (taqsir). Vrouwen knippen alleen een klein stukje (een vingerkootje) van het haar.'],
    ['Wat is de Tawaf al-Wada?','De afscheids-tawaf: het laatste wat je in Mekka doet vóór vertrek. Daarna verlaat je de stad zonder er nog te winkelen of lang te blijven.'],
  ];
  el('end-list').innerHTML=
    items.map(i=>`<div class="end-item">✅ ${i}</div>`).join('')
    +`<div class="end-faq"><div class="faq-title">📖 Veelgestelde vragen over de Hajj</div>`
    +faqs.map(f=>`<details class="faq"><summary>${f[0]}</summary><p>${f[1]}</p></details>`).join('')
    +`</div>`;
  const sb=document.querySelector('.end-sub');
  if(sb){ sb.innerHTML=`<span class="end-dua">🤲 Moge Allah jouw Hajj accepteren — تَقَبَّلَ اللّٰهُ حَجَّك. آمين</span><br><span style="color:var(--gold)">Sabr / ihsan getoond: ${State.sabr}× &nbsp;•&nbsp; 🧠 Quiz: ${State.quiz||0}/${State.quizTotal||0} &nbsp;•&nbsp; 📖 Du'as: ${Object.keys(State.duas||{}).length}/${Object.keys(DUAS).length}</span>`; }
  const es=document.querySelector('.end-stars'); es.innerHTML='';
  for(let i=0;i<80;i++){ const d=document.createElement('div'); d.className='star-dot';
    const sz=1+Math.random()*2.5; d.style.cssText=`width:${sz}px;height:${sz}px;left:${Math.random()*100}%;top:${Math.random()*100}%;--op:${.4+Math.random()*.6};--d:${2+Math.random()*4}s;--delay:${Math.random()*4}s;`;
    es.appendChild(d); }
  showScreen('screen-end');
}

// ============================================================
//  INTRO STARS (2D canvas)
// ============================================================
function initIntroStars(){
  const canvas=el('intro-stars'); if(!canvas)return; const ctx=canvas.getContext('2d');
  function resize(){ canvas.width=window.innerWidth; canvas.height=window.innerHeight; }
  resize(); window.addEventListener('resize',resize);
  const stars=Array.from({length:160},()=>({x:Math.random(),y:Math.random(),r:.5+Math.random()*1.5,op:.3+Math.random()*.7,sp:.5+Math.random()*1.5,ph:Math.random()*6.28}));
  let t=0;
  (function draw(){ ctx.clearRect(0,0,canvas.width,canvas.height); t+=0.01;
    stars.forEach(s=>{ const a=s.op*(0.4+0.6*Math.abs(Math.sin(t*s.sp+s.ph)));
      ctx.beginPath(); ctx.arc(s.x*canvas.width,s.y*canvas.height,s.r,0,6.28); ctx.fillStyle=`rgba(255,255,220,${a})`; ctx.fill(); });
    requestAnimationFrame(draw); })();
}
