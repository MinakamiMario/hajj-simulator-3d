'use strict';
// ============================================================
//  PLAYER CONTROLLER
// ============================================================
const Player = {
  obj:null, pos:null,
  x:0, z:0, speed:3.2, walkPhase:0, moving:false, pose:'stand', faceY:0,
  simOrbit:false, simLine:false, simAngle:0, simDir:-1, simSpeed:5, simR:5,
  bounds:{minX:-6,maxX:6,minZ:-6,maxZ:6},

  build(){
    if(this.obj){ world.remove(this.obj); }
    if(typeof Char!=='undefined' && Char.preset && this._buildRig(Char.preset)) return;
    this.rigBones=null;
    this.obj=makeAvatar(Object.assign({}, Custom, { gender:Char.gender, ihram:Char.ihram, shaved:Char.hair }));
    this.obj.scale.setScalar((this.scaleVal||1)*(this.obj.userData.baseScale||1));
    world.add(this.obj);
    this.setPose(this.pose);
    this.updateTransform();
  },
  // kant-en-klaar (gerigd) personage: gebruik 't GLB-skelet i.p.v. de procedurele avatar
  _buildRig(preset){
    const key = preset==='man' ? 'preset_man' : 'preset_woman';
    const src = (typeof Assets!=='undefined') ? Assets.cache[key] : null;
    if(!src){                                               // nog niet geladen → laad lui en herbouw straks; intussen procedureel
      if(typeof Assets!=='undefined' && Assets.loadPreset) Assets.loadPreset(preset, ()=>{ if(Char.preset===preset) Player.build(); });
      return false;
    }
    this.rigBones={}; src.traverse(o=>{ if(o.isBone) this.rigBones[o.name]=o; if(o.isSkinnedMesh) o.frustumCulled=false; });
    this.obj=src; this.obj.scale.setScalar(this.scaleVal||1);
    world.add(this.obj);
    this.setPose(this.pose); this.updateTransform();
    return true;
  },
  spawn(s){
    this.x=s.x||0; this.z=s.z||0; this.faceY=s.face||0;
    this.bounds=s.bounds||{minX:-6,maxX:6,minZ:-6,maxZ:6};
    this.pose='stand'; this.moving=false; this.walkPhase=0; this._resetBlend();
    this.simOrbit=false; this.simLine=false; this.sitting=false;
    this.build();
  },
  updateTransform(){
    if(!this.obj)return;
    this.obj.position.set(this.x, this.sitting?-0.42:0, this.z);
    this.obj.rotation.y=this.faceY + (this.rigBones?this._rigFaceOffset:0);
  },
  _rigFaceOffset:Math.PI,   // gerigde GLB kijkt +Z bij rotatie 0 → draai naar de -Z conventie
  setPose(p){
    const was=this.pose;
    this.pose=p;
    if(p==='dua' && was!=='dua' && typeof duaGlow==='function') duaGlow(this.x,this.z);
  },
  // draai de speler (en camera) naar een punt — gebruikt om richting de qibla/Ka'ba te bidden
  faceTowards(tx,tz){
    const dx=tx-this.x, dz=tz-this.z;
    if(dx===0 && dz===0) return;
    this.faceY=Math.atan2(-dx,-dz);
    this.updateTransform();
    if(typeof Cam!=='undefined') Cam.yaw=this.faceY;
  },
  // ---- salat: echt gebed met de juiste bewegingen ----
  salat:null,
  praySalat(rakat,cb){
    Sound.init();
    const n=rakat||2, tl=[];
    for(let r=0;r<n;r++){
      tl.push({st:'qiyam',d:3.0},{st:'ruku',d:2.4},{st:'itidal',d:1.1},
              {st:'sujud',d:2.3},{st:'julus',d:1.1},{st:'sujud',d:2.3});
      tl.push(r<n-1 ? {st:'itidal',d:0.9} : {st:'tashahhud',d:3.2});
    }
    tl.push({st:'salamR',d:1.5},{st:'salamL',d:1.5});
    this.salat={tl, idx:-1, t:0, cb:cb||null};
    this.setPose('salat');
  },
  _salatEnter(st){
    const tx={qiyam:'اللهُ أَكبَر', ruku:'سُبحَانَ رَبِّيَ العَظِيم', sujud:'سُبحَانَ رَبِّيَ الأَعلَى',
      salamR:'السَّلَامُ عَلَيكُم وَرَحمَةُ الله'}[st];
    if(st==='qiyam'||st==='sujud'||st==='itidal') Sound.blip(520,0.3,'sine',0.1);
    if(tx && typeof spawnTextAt==='function') spawnTextAt(tx, this.x, 2.5, this.z, '#f0e0b0');
  },
  // ---- animatie-engine: doelhoudingen + vloeiend blenden ----
  _bl:null,
  _resetBlend(){ this._bl={legL:0,legR:0,kneeL:0,kneeR:0,armLx:0,armRx:0,armLz:0,armRz:0,elbL:0,elbR:0,footL:0,footR:0,bodyY:0,bodyRz:0,bodyRy:0,bodyRx:0,rootY:0}; },
  animate(dt){
    if(!this.obj)return;
    const pa=this.obj.userData.parts;
    if(!this._bl)this._resetBlend();
    const b=this._bl, t={};
    const now=clock?clock.elapsedTime:0;
    // 1) bepaal DOEL-houding
    if(this.pose==='salat' && this.salat){
      // doorloop de gebedsfases op tijd; elke fase heeft een eigen doelhouding
      const sl=this.salat;
      sl.t+=dt;
      if(sl.idx<0 || sl.t>sl.tl[sl.idx].d){
        sl.t=0; sl.idx++;
        if(sl.idx>=sl.tl.length){ // klaar
          this.salat=null; this.setPose('stand');
          if(sl.cb) sl.cb();
        } else this._salatEnter(sl.tl[sl.idx].st);
      }
      const st=this.salat ? this.salat.tl[this.salat.idx].st : 'qiyam';
      const KNEEL={legL:-1.5,legR:-1.5,kneeL:2.7,kneeR:2.7};        // zittend op de hielen, schenen onder het lichaam
      const P={
        qiyam:    {armLx:-1.25,armRx:-1.25,elbL:1.4,elbR:1.4,armLz:-0.12,armRz:0.12},
        ruku:     {bodyRx:-1.45,armLx:-0.2,armRx:-0.2,elbL:0.1,elbR:0.1,kneeL:0.15,kneeR:0.15},   // rug horizontaal, handen naar de knieën
        itidal:   {elbL:0.12,elbR:0.12},
        sujud:    Object.assign({rootY:-0.42,bodyRx:-1.48,armLx:-0.15,armRx:-0.15,elbL:0.55,elbR:0.55},KNEEL),  // knieën onder, voorhoofd net boven de grond
        julus:    Object.assign({rootY:-0.45,bodyRx:-0.05,armLx:-0.55,armRx:-0.55,elbL:0.85,elbR:0.85},KNEEL),
        tashahhud:Object.assign({rootY:-0.45,bodyRx:-0.05,armLx:-0.55,armRx:-0.55,elbL:0.85,elbR:0.85},KNEEL),
        salamR:   Object.assign({rootY:-0.45,bodyRx:-0.05,bodyRy:-0.62,armLx:-0.55,armRx:-0.55,elbL:0.85,elbR:0.85},KNEEL),
        salamL:   Object.assign({rootY:-0.45,bodyRx:-0.05,bodyRy:0.62,armLx:-0.55,armRx:-0.55,elbL:0.85,elbR:0.85},KNEEL),
      }[st]||{};
      for(const k in b) t[k]=0;
      Object.assign(t,P);
    } else if(this.pose==='dua'){
      const br=Math.sin(now*1.6)*0.015;                                  // rustige ademhaling
      t.armLx=-0.6; t.armRx=-0.6; t.armLz=-0.18; t.armRz=0.18;           // bovenarmen licht naar voren
      t.elbL=1.55; t.elbR=1.55;                                          // onderarmen omhoog, handpalmen voor de borst
      t.legL=0; t.legR=0; t.kneeL=0; t.kneeR=0;
      t.bodyY=br; t.bodyRz=0; t.bodyRy=0;
    } else if(this.pose==='sit'||this.sitting){
      t.legL=-1.5; t.legR=-1.5; t.kneeL=1.5; t.kneeR=1.5;                // bovenbeen horizontaal, onderbeen omlaag
      t.armLx=-0.55; t.armRx=-0.55; t.elbL=0.75; t.elbR=0.75;            // handen op schoot
      t.armLz=-0.08; t.armRz=0.08; t.bodyY=0; t.bodyRz=0; t.bodyRy=0;
    } else if(this.moving){
      this.walkPhase+=dt*(this.running?10.5:8.2);
      const ph=this.walkPhase, S=Math.sin(ph), C=Math.cos(ph);
      if(this._lastS!==undefined && ((this._lastS<0)!==(S<0))) Sound.footstep();   // voetstap op elke pas
      this._lastS=S;
      const lift=x=>Math.max(0,x);
      const amp=this.running?1.2:1;
      t.legL=S*0.5*amp;             t.legR=-S*0.5*amp;
      t.kneeL=lift(-C)*0.7*amp;     t.kneeR=lift(C)*0.7*amp;             // knie buigt in de zwaaifase
      // enkel houdt de voet vlakker → standvoet glijdt niet, zwaaivoet heft de teen (hiel-af)
      t.footL=-t.legL*0.55 + lift(-C)*0.3*amp;   t.footR=-t.legR*0.55 + lift(C)*0.3*amp;
      t.armLx=-S*0.30*amp;          t.armRx=S*0.30*amp;                  // armzwaai vanuit de schouder
      t.elbL=0.2+lift(S)*0.24;      t.elbR=0.2+lift(-S)*0.24;            // elleboog veert licht mee
      t.armLz=-0.06; t.armRz=0.06;                                      // armen blijven dicht langs het lichaam
      t.bodyY=Math.abs(S)*0.05*amp;
      t.bodyRz=S*0.045;                                                  // heupzwaai
      t.bodyRy=S*0.07;                                                   // schouders draaien licht tegen
    } else {
      const br=Math.sin(now*1.7);                                        // idle: ademen + microbeweging
      t.legL=0; t.legR=0; t.kneeL=0.04; t.kneeR=0.04;
      t.armLx=br*0.025; t.armRx=-br*0.025; t.armLz=-0.03; t.armRz=0.03;
      t.elbL=0.12; t.elbR=0.12;
      t.bodyY=br*0.012; t.bodyRz=0; t.bodyRy=Math.sin(now*0.6)*0.02;
    }
    // 2) blend huidig → doel
    if(t.footL===undefined){ t.footL=0; t.footR=0; }      // enkel terug naar neutraal buiten het lopen
    const k=Math.min(1,dt*(this.moving?14:7));
    for(const key in t) b[key]+= (t[key]-b[key])*k;
    // 3a) gerigd GLB-personage: map de geblende houding op de botten en stop
    if(this.rigBones){
      const ty=(typeof terrainFn==='function'&&terrainFn)?terrainFn(this.x,this.z):0; Player.y0=ty;
      this._applyRig(b);
      this.obj.position.y=(this.sitting?-0.42:0)+b.rootY+(b.bodyY||0)+ty;
      return;
    }
    // 3) pas toe op het skelet
    pa.legL.rotation.x=b.legL;   pa.legR.rotation.x=b.legR;
    if(pa.kneeL){ pa.kneeL.rotation.x=b.kneeL; pa.kneeR.rotation.x=b.kneeR; }
    if(pa.footL){ pa.footL.rotation.x=b.footL; pa.footR.rotation.x=b.footR; }
    pa.armL.rotation.x=b.armLx;  pa.armR.rotation.x=b.armRx;
    pa.armL.rotation.z=b.armLz;  pa.armR.rotation.z=b.armRz;
    if(pa.elbL){ pa.elbL.rotation.x=b.elbL; pa.elbR.rotation.x=b.elbR; }
    pa.body.rotation.z=b.bodyRz; pa.body.rotation.y=b.bodyRy;
    // buigen (ruku/sujud) om een HEUP-scharnier: romp kantelt, heupen blijven boven de voeten
    const hipH=0.62;
    pa.body.rotation.x=b.bodyRx;
    pa.body.position.y=b.bodyY + hipH*(1-Math.cos(b.bodyRx));
    pa.body.position.z=-hipH*Math.sin(b.bodyRx);
    const ty=(typeof terrainFn==='function'&&terrainFn)?terrainFn(this.x,this.z):0;   // heuvels (Jabal al-Rahma)
    Player.y0=ty;
    this.obj.position.y=(this.sitting?-0.42:0)+b.rootY+ty;     // zakken naar de grond + terreinhoogte
  },
  // map de geblende procedurele houding (b) op de GLB-botten (eigen as-conventie van 't rig)
  _applyRig(b){
    const B=this.rigBones; if(!B)return;
    const DN=-1.45;                                          // bovenarm-rust: omlaag langs 't lichaam
    // armen: b.armLx/Rx = voorwaartse elevatie (0=omlaag, negatief=naar voren/omhoog); z = voor/achter zwaai
    if(B.upperarmL) B.upperarmL.rotation.set(DN - b.armLx*0.7, 0, -b.armLx*0.6);
    if(B.upperarmR) B.upperarmR.rotation.set(DN - b.armRx*0.7, 0,  b.armRx*0.6);
    if(B.forearmL) B.forearmL.rotation.set(b.elbL*0.9, 0, 0); // elleboog buigt onderarm omhoog
    if(B.forearmR) B.forearmR.rotation.set(b.elbR*0.9, 0, 0);
    // romp: buigen (ruku/sujud), draaien (salam/loop) — verdeeld over spine+chest
    if(B.spine){ B.spine.rotation.set(b.bodyRx*0.6, b.bodyRy*0.6, b.bodyRz||0); }
    if(B.chest){ B.chest.rotation.set(b.bodyRx*0.5, b.bodyRy*0.4, 0); }
    if(B.head){ B.head.rotation.set(-b.bodyRx*0.35, 0, 0); }  // hoofd blijft iets rechter bij 't buigen
  },
  interact(){ Sound.init(); Zone.trigger(); }
};

// ============================================================
//  CAMERA RIG
// ============================================================
let camOccluders=[];   // grote objecten waar de camera niet achter mag verdwijnen
const Cam = {
  yaw:0, pitch:0.32, dist:6.2, height:2.4, lookH:1.4, maxY:null, bound:null,
  fp:false, intro:null, eyeH:1.55, cine:null,          // first-person modus + intro-zwaai + filmische cutscene
  // start een filmische zwaai vanaf 'from' naar het popetje, daarna first-person
  startIntro(from, durMs){ this.fp=false; this.intro={ from:{x:from.x,y:from.y,z:from.z}, start:performance.now(), dur:durMs||2600 }; },
  update(){
    // ---- scripted filmische camera (cutscene): scène stuurt camera volledig, normale cam pauzeert ----
    if(this.cine){ this.cine(); return; }
    // ---- intro-zwaai naar het popetje → first-person ----
    if(this.intro){
      const e=Math.min(1,(performance.now()-this.intro.start)/this.intro.dur);
      const k=e<0.5?2*e*e:1-Math.pow(-2*e+2,2)/2;        // easeInOut
      const eyeY=Player.y0+this.eyeH, f=this.intro.from, cpz=Math.cos(this.pitch);
      camera.position.set(f.x+(Player.x-f.x)*k, f.y+(eyeY-f.y)*k, f.z+(Player.z-f.z)*k);
      camera.lookAt(Player.x-Math.sin(this.yaw)*cpz*4, eyeY-Math.sin(this.pitch)*4, Player.z-Math.cos(this.yaw)*cpz*4);
      if(Player.obj) Player.obj.visible=true;
      if(e>=1){ this.intro=null; this.fp=true; }
      return;
    }
    // ---- first-person: camera op het hoofd, kijkend langs yaw/pitch ----
    if(this.fp){
      const eyeY=Player.y0+this.eyeH, cpz=Math.cos(this.pitch);
      camera.position.set(Player.x,eyeY,Player.z);
      camera.lookAt(Player.x-Math.sin(this.yaw)*cpz*4, eyeY-Math.sin(this.pitch)*4, Player.z-Math.cos(this.yaw)*cpz*4);
      if(Player.obj) Player.obj.visible=false;           // verberg jezelf in first-person
      return;
    }
    if(Player.obj && !Player.obj.visible) Player.obj.visible=true;   // weer zichtbaar in third-person
    const cp=Math.cos(this.pitch), sp=Math.sin(this.pitch);
    const bx=Math.sin(this.yaw)*cp, bz=Math.cos(this.yaw)*cp;     // behind dir (xz)
    let camX=Player.x+bx*this.dist;
    let camZ=Player.z+bz*this.dist;
    let camY=Player.y0+this.height+sp*this.dist;
    if(this.maxY!==null) camY=Math.min(camY,this.maxY);   // stay under ceiling
    camY=Math.max(camY,0.7);                              // never below floor
    if(this.bound){                                       // keep camera inside walls
      camX=Math.max(this.bound.minX,Math.min(this.bound.maxX,camX));
      camZ=Math.max(this.bound.minZ,Math.min(this.bound.maxZ,camZ));
    }
    // occlusie: blokkeert een groot object het zicht, trek de camera er dan vóór
    if(camOccluders.length && typeof THREER!=='undefined' && camera){
      this._ray=this._ray||new THREER.Raycaster();
      const ox=Player.x, oy=Player.y0+this.lookH, oz=Player.z;
      const dx=camX-ox, dy=camY-oy, dz=camZ-oz;
      const len=Math.hypot(dx,dy,dz)||1;
      this._ray.set(new THREER.Vector3(ox,oy,oz), new THREER.Vector3(dx/len,dy/len,dz/len));
      this._ray.far=len;
      const hits=this._ray.intersectObjects(camOccluders,false);
      if(hits.length){ const d=Math.max(1.2,hits[0].distance-0.45);
        camX=ox+dx/len*d; camY=Math.max(0.8,oy+dy/len*d); camZ=oz+dz/len*d; }
    }
    camera.position.set(camX,camY,camZ);
    camera.lookAt(Player.x,Player.y0+this.lookH,Player.z);
  },
  forward(){ // ground-plane forward (toward where camera looks)
    return {x:-Math.sin(this.yaw), z:-Math.cos(this.yaw)};
  },
  right(){
    const f=this.forward(); return {x:-f.z, z:f.x};
  }
};
Player.y0=0;

// ============================================================
//  INPUT
// ============================================================
const Input = {
  keys:{up:false,down:false,left:false,right:false,run:false},
  joy:{x:0,y:0,active:false,id:null,cx:0,cy:0,r:50},
  look:{active:false,id:null,lx:0,ly:0},

  init(){
    if(this._inited)return; this._inited=true;
    document.addEventListener('keydown',e=>{
      const k=e.key.toLowerCase();
      if(k==='arrowup'||k==='w'){this.keys.up=true;e.preventDefault();}
      if(k==='arrowdown'||k==='s'){this.keys.down=true;e.preventDefault();}
      if(k==='arrowleft'||k==='a'){this.keys.left=true;e.preventDefault();}
      if(k==='arrowright'||k==='d'){this.keys.right=true;e.preventDefault();}
      if(k==='shift'){this.keys.run=true;}
      if(k==='q'){Cam.yaw+=0.08;}
      if(k===' '||k==='enter'){Player.interact();e.preventDefault();}
      if(k==='f'){Player.interact();}
    });
    document.addEventListener('keyup',e=>{
      const k=e.key.toLowerCase();
      if(k==='arrowup'||k==='w')this.keys.up=false;
      if(k==='arrowdown'||k==='s')this.keys.down=false;
      if(k==='arrowleft'||k==='a')this.keys.left=false;
      if(k==='arrowright'||k==='d')this.keys.right=false;
      if(k==='shift')this.keys.run=false;
    });

    // joystick
    const joy=document.getElementById('joystick'), knob=document.getElementById('joy-knob');
    const setKnob=(dx,dy)=>{ knob.style.transform=`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`; };
    const jStart=e=>{ const t=e.changedTouches?e.changedTouches[0]:e; const r=joy.getBoundingClientRect();
      this.joy.active=true; this.joy.id=t.identifier!==undefined?t.identifier:'m';
      this.joy.cx=r.left+r.width/2; this.joy.cy=r.top+r.height/2; jMove(e); e.preventDefault(); };
    const jMove=e=>{ if(!this.joy.active)return;
      let t; if(e.changedTouches){ for(const x of e.changedTouches){ if(x.identifier===this.joy.id)t=x; } if(!t)return; } else t=e;
      let dx=t.clientX-this.joy.cx, dy=t.clientY-this.joy.cy; const d=Math.hypot(dx,dy);
      if(d>this.joy.r){ dx=dx/d*this.joy.r; dy=dy/d*this.joy.r; }
      setKnob(dx,dy); this.joy.x=dx/this.joy.r; this.joy.y=dy/this.joy.r; e.preventDefault(); };
    const jEnd=e=>{ this.joy.active=false; this.joy.x=0; this.joy.y=0; setKnob(0,0); };
    joy.addEventListener('touchstart',jStart,{passive:false});
    joy.addEventListener('touchmove',jMove,{passive:false});
    joy.addEventListener('touchend',jEnd); joy.addEventListener('touchcancel',jEnd);
    joy.addEventListener('mousedown',jStart);
    window.addEventListener('mousemove',e=>{ if(this.joy.active&&this.joy.id==='m')jMove(e); });
    window.addEventListener('mouseup',e=>{ if(this.joy.active&&this.joy.id==='m')jEnd(e); });

    // look drag (canvas, anywhere not on a control)
    const cv=document.getElementById('screen-game');
    const isCtrl=el=>el&&(el.closest('#joystick')||el.closest('.btn-action')||el.closest('.hud')||el.closest('.task-bar')||el.closest('.modal')||el.closest('.next-bar'));
    const lStart=e=>{ const t=e.changedTouches?e.changedTouches[0]:e; if(isCtrl(e.target))return;
      this.look.active=true; this.look.id=t.identifier!==undefined?t.identifier:'m'; this.look.lx=t.clientX; this.look.ly=t.clientY;
      hideLookHint(); };
    const lMove=e=>{ if(!this.look.active)return; let t;
      if(e.changedTouches){ for(const x of e.changedTouches){ if(x.identifier===this.look.id)t=x; } if(!t)return; } else t=e;
      const dx=t.clientX-this.look.lx, dy=t.clientY-this.look.ly;
      Cam.yaw-=dx*0.005; Cam.pitch=Math.max(-0.15,Math.min(0.95,Cam.pitch+dy*0.004));
      this.look.lx=t.clientX; this.look.ly=t.clientY; };
    const lEnd=e=>{ this.look.active=false; this.look.id=null; };
    cv.addEventListener('touchstart',lStart,{passive:false});
    cv.addEventListener('touchmove',lMove,{passive:false});
    cv.addEventListener('touchend',lEnd); cv.addEventListener('touchcancel',lEnd);
    cv.addEventListener('mousedown',lStart);
    window.addEventListener('mousemove',e=>{ if(this.look.active&&this.look.id==='m')lMove(e); });
    window.addEventListener('mouseup',e=>{ if(this.look.active&&this.look.id==='m')lEnd(e); });
  },

  moveVector(){
    let ix=0,iz=0;
    if(this.keys.up)iz+=1; if(this.keys.down)iz-=1;
    if(this.keys.left)ix-=1; if(this.keys.right)ix+=1;
    if(Math.abs(this.joy.x)>0.08||Math.abs(this.joy.y)>0.08){ ix+=this.joy.x; iz+=-this.joy.y; }
    return {ix,iz};
  }
};
let lookHintTimer;
function hideLookHint(){ const h=document.getElementById('look-hint'); if(h)h.style.opacity='0'; }
