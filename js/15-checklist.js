'use strict';
// ============================================================
//  PER-SCENE CHECKLIST — toont de taken van de scène, vinkt af
//  Bron van waarheid: bestaande Zone.done en State-vlaggen.
//  Geen wijziging nodig in scene-code: we LEZEN alleen status.
// ============================================================

// item: { label, ar?, zone?:'<zoneId>', flag?:()=>bool, opt?:true }
//  - zone : afgevinkt als die Zone done is (Zone.markDone)
//  - flag : afgevinkt als de predicate true is (State-tellers)
//  - opt  : optioneel (dimmer; telt niet mee voor 'alles klaar')
const CHECKLIST = {
  0:[ {label:'Maak je Niyyah (intentie)', zone:'mat'},
      {label:'Ga slapen', zone:'sleep'} ],
  1:[ {label:'Pak de 7 juiste items', flag:()=>State.packed>=7},
      {label:'Ihraam alvast aandoen', opt:true, flag:()=>!!Char.ihram} ],
  2:[ {label:'Trek je Ihraam aan', flag:()=>!!Char.ihram},
      {label:'Ga in je stoel zitten', zone:'seat'} ],
  3:[ {label:"Du'a bij de eerste blik op de Ka'ba", zone:'pray'} ],
  4:[ {label:'7 ronden Tawaf (tegen de klok in)', ar:'الطَّوَاف', flag:()=>State.tawaf>=7},
      {label:"2 rak'ah bij Maqam Ibrahim", flag:()=>!!State.maqamDone},
      {label:'Zamzam drinken', flag:()=>!!State.zamzamDone} ],
  5:[ {label:"Sa'i: 7× Safa ↔ Marwa", ar:'السَّعي', flag:()=>State.sai>=7} ],
  6:[ {label:"Du'a op Jabal al-Rahma (Wuquf)", ar:'يَوم عَرَفَة', zone:'mtn'},
      {label:'Help de dorstige pelgrim', opt:true, flag:()=>!!State.sharedZamzam} ],
  7:[ {label:'Raap 7 steentjes', flag:()=>State.stonesCol>=7} ],
  8:[ {label:'Gooi 7 steentjes (Jamarat al-Aqaba)', ar:'رَمي الجَمَرَات', flag:()=>State.stonesThrown>=7} ],
  9:[ {label:'Regel je Hadi (offer)', zone:'hadi'},
      {label:'Halq of Taqsir (haar)', zone:'barber'} ],
  10:[ {label:'7 ronden Tawaf al-Ifada', ar:'طَوَاف الإِفَاضَة', flag:()=>State.tawaf>=7} ],
  11:[ {label:'Groet de mensen van al-Baqi', opt:true, zone:'baqi'},
       {label:'Ga de moskee binnen (Bab as-Salam)', zone:'enter'} ],
  12:[ {label:"2 rak'ah in de Rawda", ar:'الرَّوضَة', flag:()=>!!State.rawdaDone},
       {label:'Geef salam aan de Profeet ﷺ', flag:()=>!!State.salamDone} ],
  13:[ {label:"2 rak'ah in Quba (beloning Umrah)", zone:'quba'} ],
  14:[ {label:'Loop naar de voordeur', zone:'door'} ],
};

const Checklist = {
  items:[], panel:null, list:null, badge:null, open:true,
  _build_dom(){
    if(this.panel) return;
    const host=el('screen-game'); if(!host) return;
    const p=document.createElement('div'); p.className='checklist'; p.id='checklist';
    p.innerHTML='<div class="cl-head"><span class="cl-title">📋 Te doen</span>'+
                '<span class="cl-badge" id="cl-badge"></span></div>'+
                '<div class="cl-list" id="cl-list"></div>';
    host.appendChild(p);
    this.panel=p; this.list=el('cl-list'); this.badge=el('cl-badge');
    p.querySelector('.cl-head').addEventListener('click',()=>{ this.open=!this.open; p.classList.toggle('collapsed',!this.open); });
  },
  _done(it){
    if(it.flag){ try{ return !!it.flag(); }catch(e){ return false; } }
    if(it.zone){ const z=Zone.list.find(q=>q.id===it.zone); return !!(z&&z.done); }
    return false;
  },
  build(sceneId){
    this._build_dom(); if(!this.panel) return;
    this.items=(CHECKLIST[sceneId]||[]).slice();
    if(!this.items.length){ this.panel.style.display='none'; return; }
    this.panel.style.display='block';
    this.list.innerHTML=this.items.map((it,i)=>
      '<div class="cl-item'+(it.opt?' opt':'')+'" data-i="'+i+'">'+
        '<span class="cl-mark">○</span>'+
        '<span class="cl-label">'+it.label+(it.opt?' <em>(optioneel)</em>':'')+'</span>'+
      '</div>').join('');
    this.refresh();
  },
  refresh(){
    if(!this.panel||!this.items.length) return;
    let done=0, req=0;
    this.items.forEach((it,i)=>{
      const row=this.list.querySelector('.cl-item[data-i="'+i+'"]'); if(!row) return;
      const ok=this._done(it);
      row.classList.toggle('done',ok);
      row.querySelector('.cl-mark').textContent=ok?'✅':'○';
      if(!it.opt){ req++; if(ok)done++; }
    });
    if(this.badge) this.badge.textContent=done+'/'+req;
  }
};
window.Checklist=Checklist;
