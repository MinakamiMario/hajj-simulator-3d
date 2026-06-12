'use strict';
// ============================================================
//  HUD / FEEDBACK
// ============================================================
function el(id){return document.getElementById(id);}
function showScreen(id){ document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active')); el(id).classList.add('active'); }
function setTask(s){ el('task-ar').textContent=s.ar||''; el('task-txt').textContent=s.task||''; el('task-prog').textContent=''; }
function setProgress(t){ el('task-prog').textContent=t||''; }
function updateHUD(s){ el('hud-loc').textContent=s.loc; el('hud-num').textContent=`${s.id+1} / ${SCENES.length}`;
  el('hud-fill').style.width=((s.id+1)/SCENES.length*100)+'%'; }
let titleTimer;
function showSceneTitle(s){
  const t=el('scene-title'); if(!t)return;
  el('st-ar').textContent=s.ar||''; el('st-loc').textContent=s.loc||'';
  t.classList.add('show'); clearTimeout(titleTimer);
  titleTimer=setTimeout(()=>t.classList.remove('show'),2300);
}
function showFeedback(msg,ok,ms){
  if(!ok)Sound.bad();
  document.querySelectorAll('.feedback-bar').forEach(f=>f.remove());
  const fb=document.createElement('div'); fb.className='feedback-bar'+(ok?'':' bad'); fb.innerHTML=msg;
  el('screen-game').appendChild(fb); if(ms!==0)setTimeout(()=>fb.remove(),ms||4000); return fb;
}
function showNextBtn(label){
  Sound.success();
  document.querySelectorAll('.next-bar').forEach(n=>n.remove());
  const bar=document.createElement('div'); bar.className='next-bar';
  bar.innerHTML=`<button class="btn-next-scene" onclick="Game.next()">${label||'Volgende fase →'}</button>`;
  el('screen-game').appendChild(bar);
}
function clearSimBtn(){ document.querySelectorAll('.sim-bar').forEach(n=>n.remove()); }
function showSimBtn(label,fn){
  clearSimBtn();
  const bar=document.createElement('div'); bar.className='sim-bar';
  const b=document.createElement('button'); b.className='btn-sim'; b.textContent=label||'⏩ Simuleer de rest';
  b.onclick=()=>{ clearSimBtn(); fn(); };
  bar.appendChild(b); el('screen-game').appendChild(bar);
}
// auto-walk the Tawaf for the remaining rounds
function startTawafSim(){
  if(encounter && !encounter.triggered){ if(encounter.npc)world.remove(encounter.npc); encounter=null; }
  Sound.init();
  Player.simAngle=Math.atan2(Player.z,Player.x); Player.simR=5; Player.simDir=-1; Player.simSpeed=5.2;
  Player.simOrbit=true;
  showFeedback('⏩ De resterende rondes worden gesimuleerd...',true,2500);
}
// auto-walk the Sa'i for the remaining lengths
function startSaiSim(){
  if(encounter && !encounter.triggered){ if(encounter.npc)world.remove(encounter.npc); encounter=null; }
  Sound.init();
  Player.simDir=(Player.x<=0)?1:-1; Player.simSpeed=11; Player.simLine=true;
  showFeedback('⏩ De resterende keren worden gesimuleerd...',true,2500);
}
function openStory(s){ el('modal-ar').textContent=s.ar||''; el('modal-sub').textContent=s.loc||'';
  el('modal-txt').innerHTML=s.story||s.task||''; el('modal-story').classList.remove('hidden'); }
function closeStory(){ el('modal-story').classList.add('hidden'); }

// ---- DU'A-BOEK: verzamel de echte du'as van de reis ----
const DUAS={
  talbiyah:{t:'De Talbiyah', ar:'لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ، لَا شَرِيكَ لَكَ', nl:'Hier ben ik, o Allah, hier ben ik. U heeft geen deelgenoot. Alle lof, gunst en heerschappij behoren U toe.'},
  kaaba:{t:"Bij het zien van de Ka'ba", ar:'اللَّهُمَّ زِدْ هَذَا الْبَيْتَ تَشْرِيفًا وَتَعْظِيمًا وَتَكْرِيمًا وَمَهَابَةً', nl:'O Allah, vermeerder dit Huis in eer, grootsheid, aanzien en ontzag.'},
  rabbana:{t:'Tussen Rukn Yamani en de Zwarte Steen', ar:'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ', nl:'Onze Heer, geef ons het goede in dit leven en het goede in het Hiernamaals, en bescherm ons tegen het Vuur. (2:201)'},
  zamzam:{t:'Bij het drinken van Zamzam', ar:'اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا وَرِزْقًا وَاسِعًا وَشِفَاءً مِنْ كُلِّ دَاءٍ', nl:'O Allah, ik vraag U om nuttige kennis, ruime voorziening en genezing van elke kwaal.'},
  safa:{t:'Op Safa en Marwa', ar:'إِنَّ الصَّفَا وَالْمَرْوَةَ مِن شَعَائِرِ اللهِ', nl:'Voorwaar, Safa en Marwa behoren tot de tekenen van Allah. (2:158)'},
  arafat:{t:'De beste du\'a — dag van Arafat', ar:'لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ', nl:'Er is geen god dan Allah, alleen, zonder deelgenoot. Aan Hem behoort de heerschappij en alle lof, en Hij is tot alles in staat.'},
  takbir:{t:'Bij het werpen van de steentjes', ar:'اللهُ أَكْبَرُ', nl:'Allah is de Grootste — bij elke worp.'},
  salawat:{t:'Salawat in de moskee van de Profeet ﷺ', ar:'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ', nl:'O Allah, zegen Mohammed en de familie van Mohammed.'},
  terugkeer:{t:'Bij thuiskomst van de reis', ar:'آيِبُونَ تَائِبُونَ عَابِدُونَ لِرَبِّنَا حَامِدُونَ', nl:'Wij keren terug, berouwvol, aanbiddend en onze Heer prijzend.'},
};
function learnDua(key){
  State.duas=State.duas||{};
  if(State.duas[key])return;
  State.duas[key]=true; Sound.pickup();
  const d=DUAS[key];
  showFeedback('📖 Nieuwe du\'a in je Du\'a-boek: <strong>'+d.t+'</strong>',true,3500);
}
function showDuaBook(){
  State.duas=State.duas||{};
  const keys=Object.keys(DUAS);
  const got=keys.filter(k=>State.duas[k]);
  let html='<div style="text-align:left">';
  if(!got.length) html+='<em>Nog geen du\'as verzameld — je leert ze onderweg, op de juiste momenten.</em>';
  got.forEach(k=>{ const d=DUAS[k];
    html+=`<div style="margin:.7rem 0;padding:.6rem .8rem;border:1px solid rgba(201,168,76,.3);border-radius:10px;background:rgba(201,168,76,.06)">
      <div style="color:var(--gold);font-weight:700;font-size:.85rem">${d.t}</div>
      <div style="font-family:'Amiri',serif;font-size:1.15rem;direction:rtl;margin:.3rem 0;color:#f0e8d4">${d.ar}</div>
      <div style="font-size:.8rem;color:#cfc6b0">${d.nl}</div></div>`; });
  html+=`<div style="margin-top:.6rem;color:var(--gold);text-align:center">📖 ${got.length} / ${keys.length} verzameld</div></div>`;
  openStory({loc:'Geleerd tijdens je reis', ar:'دُعَاء', story:html});
}
function openChoice(o){ el('mc-ar').textContent=o.ar||''; el('mc-sub').textContent=o.sub||''; el('mc-txt').innerHTML=o.txt||'';
  const ac=el('mc-actions'); ac.innerHTML='';
  o.choices.forEach(c=>{ const b=document.createElement('button'); b.className='choice-btn'; b.innerHTML=c.txt;
    b.onclick=()=>{ closeChoice(); c.action(); }; ac.appendChild(b); });
  el('modal-choice').classList.remove('hidden'); }
function closeChoice(){ el('modal-choice').classList.add('hidden'); }

// ---- Quiz tussen scènes ----
const QUIZZES={
  0:{q:'Waar zit de Niyyah (intentie)?',a:['In je hart',"Op je tong — je moet 'm hardop zeggen",'Op een gebedskleed'],ok:0,info:'De Niyyah zit in het hart; hardop uitspreken hoeft niet.'},
  1:{q:'Wat is verboden in staat van Ihraam?',a:['Een horloge dragen','Parfum gebruiken','Sandalen dragen'],ok:1,info:'Parfum, haar/nagels knippen en (voor mannen) genaaide kleding zijn niet toegestaan.'},
  2:{q:'Wanneer moet je uiterlijk in Ihraam zijn?',a:['Bij aankomst in het hotel','Vóór het passeren van de Miqaat',"Pas bij de Ka'ba"],ok:1,info:'Je mag de Miqaat niet zonder Ihraam passeren.'},
  4:{q:'In welke richting loop je de Tawaf?',a:['Met de klok mee','Tegen de klok in — Ka\'ba links','Maakt niet uit'],ok:1,info:"Tegen de klok in, met de Ka'ba aan je linkerhand — 7 rondes."},
  5:{q:'Waarom joggen mannen tussen de groene lampen?',a:['Om sneller klaar te zijn','Ter herinnering aan het rennen van Hajar','Omdat het daar koeler is'],ok:1,info:'Het herdenkt Hajar die tussen Safa en Marwa rende, zoekend naar water.'},
  6:{q:'De Profeet ﷺ zei: "De Hajj is ___"',a:['Tawaf','Arafat','Mina'],ok:1,info:'Wie de wuquf op Arafat (9 Dhul Hijjah) mist, mist de Hajj.'},
  7:{q:'Hoeveel steentjes raap je voor Jamarat al-Aqaba?',a:['7','21','70'],ok:0,info:'7 steentjes voor de grote jamarah op 10 Dhul Hijjah.'},
  8:{q:'Wat zeg je bij elke worp?',a:['Bismillah','Allahu Akbar','Alhamdulillah'],ok:1,info:'Bij elke steen: Allahu Akbar.'},
  9:{q:'Wat geeft meer beloning volgens de Profeet ﷺ?',a:['Taqsir (inkorten)','Halq (kaalscheren)','Geen verschil'],ok:1,info:'De Profeet ﷺ vroeg 3× vergeving voor wie scheert, 1× voor wie inkort.'},
  11:{q:'Is het bezoek aan Medina onderdeel van de Hajj?',a:['Ja, het is verplicht','Nee — het is een aanbevolen ziyarah','Alleen voor mannen'],ok:1,info:'De ziyarah naar Medina is aanbevolen, maar geen rite of voorwaarde van de Hajj.'},
  12:{q:'Wat zei de Profeet ﷺ over 2 rak\'ah in Quba?',a:['Beloning van een Hajj','Beloning van een Umrah','Beloning van 100 gebeden'],ok:1,info:'Wie zich thuis reinigt en in Quba 2 rak\'ah bidt, heeft de beloning van een Umrah.'},
};
function askQuiz(sceneIdx,then){
  const qz=QUIZZES[sceneIdx];
  if(!qz||qz.asked){ then(); return; }
  qz.asked=true; State.quizTotal=(State.quizTotal||0)+1; paused=true;
  openChoice({ ar:'سُؤَال', sub:'Quizvraag', txt:'🧠 '+qz.q,
    choices:qz.a.map((txt,i)=>({txt:txt, action:()=>{ paused=false;
      if(i===qz.ok){ State.quiz=(State.quiz||0)+1; Sound.success(); showFeedback('✅ Goed! '+qz.info,true,4000); }
      else { Sound.bad(); showFeedback('❌ Helaas. '+qz.info,false,4500); }
      setTimeout(then,650); }})) });
}
