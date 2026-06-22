'use strict';
// ============================================================
//  RECITE — eigen klas-opnames als sfeer/recitatie in de game
//    • Talbiya  → zacht op de achtergrond tijdens de Ihram-scènes
//    • Adhan    → bij aankomst Masjid al-Haram (scène 3)
//    • Rabbana atina → als smeekbede op Arafat (scène 6)
//  Bestanden: assets/audio/recite/{talbiya,adhan,rabbana}.mp3
//  Volgt de geluid-aan/uit van Sound; geen twee stemmen tegelijk
//  (een eenmalige clip dempt even de zachte Talbiya-loop).
// ============================================================
const Recite = {
  base:'assets/audio/recite/', ext:'.mp3',
  loopEl:null,            // huidige zachte loop (Talbiya)
  loopVol:0.20,
  ones:[],               // lopende eenmalige clips (adhan/rabbana)
  _muted:false,
  // scènes (0-indexed) waarin de Talbiya zacht meeklinkt.
  //  Fiqh: de Talbiya begint bij de Miqaat (ihram) en loopt bij de Hajj door
  //  tot de steniging van Jamrat al-Aqaba (10 Dhul Hijjah). NIET tijdens de
  //  tawaf/sa'i zelf (dan gelden eigen du'a's, zoals Rabbana atina).
  //   2 Miqaat/ihram · 3 nadering Ka'ba · 6 Arafat · 7 Muzdalifah · 8 Mina (tot de steniging)
  TALBIYA_SCENES:[2,3,6,7,8],

  _make(name,vol,loop){
    const a=new Audio(this.base+name+this.ext+'?v='+BUILD);
    a.loop=!!loop; a.volume=vol; a.muted=this._muted;
    a.play().catch(()=>{});                       // start na de eerste tik (knop) → toegestaan
    return a;
  },
  startTalbiya(vol){
    this.loopVol=(vol!=null?vol:0.20);
    if(this.loopEl){ this.loopEl.volume=this.loopVol; return; }   // al bezig → niet herstarten
    this.loopEl=this._make('talbiya',this.loopVol,true);
  },
  stopTalbiya(){ if(this.loopEl){ try{this.loopEl.pause();}catch(e){} this.loopEl=null; } },
  // eenmalige clip; dempt de Talbiya zolang 'ie speelt en hervat daarna.
  // onEnd (optioneel) vuurt als de clip klaar is — gebruikt om de narratie verder te zetten.
  once(name,vol,onEnd){
    const wasLoop=this.loopEl;
    if(wasLoop){ try{wasLoop.pause();}catch(e){} }
    const a=this._make(name,(vol!=null?vol:0.60),false);
    this.ones.push(a);
    let fired=false, safety=null;
    const done=()=>{ if(fired)return; fired=true; if(safety)clearTimeout(safety);
      this.ones=this.ones.filter(x=>x!==a);
      if(wasLoop && this.loopEl===wasLoop && !this._muted){ wasLoop.play().catch(()=>{}); }
      if(typeof onEnd==='function') onEnd(); };
    a.addEventListener('ended',done);
    a.addEventListener('error',done);
    if(typeof onEnd==='function') safety=setTimeout(done,30000);   // vangnet: narratie nooit laten vastlopen
    return a;
  },
  // ---- klas spreekt het Arabisch in op bepaalde narratie-regels ----
  //  Talbiya bij de uitleg in scène 2. Rabbana NIET hier: die speelt positie-gebonden
  //  in de Tawaf (tussen Rukn al-Yamani en de Zwarte Steen) — zie tawafScene in 09-scenes-b.js.
  AT:{ '2_2':'talbiya' },
  speakThen(name,onEnd){ return this.once(name,0.9,onEnd); },      // duidelijk hoorbaar, dempt even de loop
  afterNarration(scene,idx,next){                                  // door GidsAudio aangeroepen na elke regel
    const name=this.AT[scene+'_'+idx];
    if(!name) return false;
    this.speakThen(name,next);
    return true;
  },
  // ---- positie-gebonden du'a (Tawaf): speel alleen als die clip niet al loopt ----
  isPlaying(name){ return this.ones.some(a=>a.src.indexOf('/'+name+this.ext)>=0 && !a.paused); },
  duaHere(name,vol){ if(this.isPlaying(name))return null; return this.once(name,(vol!=null?vol:0.7)); },
  stopAll(){ this.stopTalbiya();
    this.ones.forEach(a=>{ try{a.pause();}catch(e){} }); this.ones=[]; },
  setMuted(m){ this._muted=!!m;
    if(this.loopEl)this.loopEl.muted=this._muted;
    this.ones.forEach(a=>{ a.muted=this._muted; }); },

  // aangeroepen door loadScene(id)
  onScene(id){
    this.stopAll();
    this.setMuted(!(typeof Sound!=='undefined' && Sound.on));
    // Scène 2: de Talbiya begint pas als de speler de ihraam aanneemt + de Talbiyah
    // uitspreekt (zie 08-scenes-a.js), niet al bij het instappen. De latere Hajj-scènes
    // (speler is dan al in ihraam) starten de zachte loop wél meteen bij binnenkomst.
    if(id!==2 && this.TALBIYA_SCENES.indexOf(id)>=0) this.startTalbiya(this.loopVol);
    if(id===3) this.once('adhan',0.55);                          // aankomst Masjid al-Haram
    // Talbiya (2_2) en Rabbana (4_2) spreekt de klas in tijdens de narratie — zie afterNarration()
  }
};
window.Recite=Recite;
