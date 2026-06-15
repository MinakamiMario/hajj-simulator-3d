'use strict';
const BUILD='v5.2';
/* ============================================================
   HAJJ SIMULATOR 3D — third-person engine (Three.js r128)
   v4: modulaire structuur, betere graphics, grotere wereld
   ============================================================ */

let THREER, scene, camera, renderer, world, clock;
let dirLight, ambLight, hemiLight;
let pmremGen, envRT;

// ---------- Sound (WebAudio synth — no files) ----------
const Sound = {
  ctx:null, on:true,
  init(){ if(!this.ctx){ try{ this.ctx=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} }
    if(this.ctx && this.ctx.state==='suspended') this.ctx.resume(); },
  blip(freq,dur,type,vol,when){ if(!this.on||!this.ctx)return; const t=this.ctx.currentTime+(when||0);
    if(!isFinite(freq)||freq<=0)freq=600;
    const o=this.ctx.createOscillator(), g=this.ctx.createGain();
    o.type=type||'sine'; o.frequency.value=freq; o.connect(g); g.connect(this.ctx.destination);
    g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(vol||0.16,t+0.012);
    g.gain.exponentialRampToValueAtTime(0.0001,t+(dur||0.2));
    o.start(t); o.stop(t+(dur||0.2)+0.03); },
  pickup(){ this.blip(880,0.12,'triangle',0.14); this.blip(1320,0.13,'sine',0.09,0.02); },
  step(){ this.blip(560,0.13,'sine',0.13); this.blip(840,0.13,'sine',0.07,0.01); },
  success(){ [523,659,784,1046].forEach((f,i)=>this.blip(f,0.45,'sine',0.11,i*0.07)); },
  round(){ this.blip(660,0.16,'sine',0.15); this.blip(990,0.2,'sine',0.09,0.05); },
  toss(){ this.blip(280,0.18,'sawtooth',0.1); },
  hit(){ this.blip(150,0.18,'square',0.12); this.blip(90,0.22,'sine',0.1,0.01); },
  bad(){ this.blip(180,0.22,'square',0.11); this.blip(120,0.26,'sine',0.09,0.02); },
  footstep(){ this.blip(420,0.07,'sine',0.05); },
  // ---- ambient soundscapes per scène ----
  ambNodes:[], ambGain:null, ambTimer:null, ambType:null,
  _noise(){ const n=2*this.ctx.sampleRate, b=this.ctx.createBuffer(1,n,this.ctx.sampleRate), d=b.getChannelData(0);
    for(let i=0;i<n;i++)d[i]=Math.random()*2-1;
    const src=this.ctx.createBufferSource(); src.buffer=b; src.loop=true; return src; },
  setAmbient(type){
    this.ambType=type; this.stopAmbient(); if(!this.ctx||!type)return;
    const g=this.ctx.createGain(); g.gain.value=this.on?1:0; g.connect(this.ctx.destination);
    this.ambGain=g; const N=this.ambNodes;
    const add=(node,vol,filterType,freq)=>{ const gg=this.ctx.createGain(); gg.gain.value=vol;
      if(filterType){ const f=this.ctx.createBiquadFilter(); f.type=filterType; f.frequency.value=freq; node.connect(f); f.connect(gg); }
      else node.connect(gg);
      gg.connect(g); node.start(); N.push(node); };
    if(type==='crowd'){            // geroezemoes van de menigte
      add(this._noise(),0.028,'bandpass',300);
      add(this._noise(),0.016,'bandpass',700);
      this.ambTimer=setInterval(()=>{ if(this.on&&Math.random()<0.5)this.blip(180+Math.random()*120,0.4,'sine',0.018); },1800);
    } else if(type==='plane'){     // motorgebrom + lucht
      const o=this.ctx.createOscillator(); o.type='sawtooth'; o.frequency.value=62; add(o,0.02,'lowpass',140);
      add(this._noise(),0.02,'lowpass',420);
    } else if(type==='night'){     // krekels + zachte wind
      add(this._noise(),0.008,'lowpass',300);
      this.ambTimer=setInterval(()=>{ if(this.on){ this.blip(4300,0.05,'square',0.012); this.blip(4300,0.05,'square',0.01,0.09); } },650);
    } else if(type==='outdoor'){   // wind + vogels
      add(this._noise(),0.014,'lowpass',420);
      this.ambTimer=setInterval(()=>{ if(this.on&&Math.random()<0.6){ const f=2100+Math.random()*1500;
        this.blip(f,0.09,'sine',0.025); this.blip(f*1.2,0.08,'sine',0.02,0.1); } },2600);
    }
  },
  stopAmbient(){ (this.ambNodes||[]).forEach(x=>{try{x.stop();}catch(e){}}); this.ambNodes=[];
    if(this.ambGain){ try{this.ambGain.disconnect();}catch(e){} this.ambGain=null; }
    if(this.ambTimer){ clearInterval(this.ambTimer); this.ambTimer=null; } },
  toggle(){ this.on=!this.on; this.init(); if(this.ambGain)this.ambGain.gain.value=this.on?1:0; return this.on; }
};
