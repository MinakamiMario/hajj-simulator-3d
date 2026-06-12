'use strict';
// ============================================================
//  GAME FLOW
// ============================================================
const Game={
  toCharSelect(){ if(Custom.gender==='female' && Custom.headcover==='none' && Custom.hairStyle==='short') applyGenderDefaults('female'); showScreen('screen-char'); initPreview(); buildControls(); refreshPreview(); },
  pickChar(g){ Custom.gender=g; Char.gender=g; applyGenderDefaults(g); buildControls(); refreshPreview(); },
  start(){ Char.gender=Custom.gender; Char.ihram=false; Char.hair='full'; Sound.init(); showScreen('screen-game'); if(!renderer)initThree(); Input.init(); loadScene(State.startScene||0);
    clearTimeout(lookHintTimer); lookHintTimer=setTimeout(hideLookHint,5000); },
  next(){ askQuiz(State.scene, ()=>Game._advance()); },
  _advance(){ const cur=SCENES[State.scene]; if(cur&&cur.onExit)cur.onExit();
    let n=State.scene+1;
    if(State.scene===10 && State.medinaChosen===false) n=SCENES.length-1;   // sla Medina/Quba over
    if(n>=SCENES.length){ renderEnding(); return; }
    const fade=el('fade'); fade.classList.add('show');
    setTimeout(()=>{ loadScene(n); fade.classList.remove('show'); },500); },
  restart(){ Object.assign(State,{scene:0,packed:0,ihrSteps:0,stonesCol:0,stonesThrown:0,tawaf:0,sai:0,saiLast:null,tawafAngle:0,tawafAccum:0,sabr:0,angryDone:false,saiHelpDone:false,quiz:0,quizTotal:0,zamzamDone:false,maqamDone:false,hadiDone:false,medinaChosen:undefined,medinaDone:false,rawdaDone:false,salamDone:false,qubaDone:false,duas:{},zamzamBottle:false,sharedZamzam:false,gaveZamzam:false});
    Object.values(QUIZZES).forEach(q=>delete q.asked);
    Sound.stopAmbient();
    encounter=null; paused=false;
    Char.ihram=false; Char.hair='full';
    showScreen('screen-intro'); },
  toggleSound(){ const on=Sound.toggle(); const b=el('btn-sound'); if(b)b.textContent=on?'🔊':'🔇'; },
  showStory(){ openStory(SCENES[State.scene]); },
  closeStory:closeStory
};
window.Game=Game; window.Player=Player; window.Zone=Zone;

window.addEventListener('load',()=>{
  initIntroStars();
  ['build-tag','build-tag2'].forEach(i=>{ const e=el(i); if(e)e.textContent=BUILD; });
  const sel=el('scene-jump');
  if(sel){ SCENES.forEach((sc,i)=>{ const op=document.createElement('option'); op.value=i; op.textContent=(i+1)+'. '+sc.loc; sel.appendChild(op); });
    sel.value=0; State.startScene=0; }
});
