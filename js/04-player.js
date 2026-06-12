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
    this.obj=makeAvatar(Object.assign({}, Custom, { gender:Char.gender, ihram:Char.ihram, shaved:Char.hair }));
    this.obj.scale.setScalar((this.scaleVal||1)*(this.obj.userData.baseScale||1));
    world.add(this.obj);
    this.setPose(this.pose);
    this.updateTransform();
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
    this.obj.rotation.y=this.faceY;
  },
  setPose(p){
    const was=this.pose;
    this.pose=p;
    if(p==='dua' && was!=='dua' && typeof duaGlow==='function') duaGlow(this.x,this.z);
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
  _resetBlend(){ this._bl={legL:0,legR:0,kneeL:0,kneeR:0,armLx:0,armRx:0,armLz:0,armRz:0,elbL:0,elbR:0,bodyY:0,bodyRz:0,bodyRy:0,bodyRx:0,rootY:0}; },
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
      const KNEEL={legL:-1.35,legR:-1.35,kneeL:2.4,kneeR:2.4};   // zittend op de hielen
      const P={
        qiyam:    {armLx:-1.25,armRx:-1.25,elbL:1.4,elbR:1.4,armLz:-0.12,armRz:0.12},
        ruku:     {bodyRx:-0.92,armLx:-0.5,armRx:-0.5,elbL:0.05,elbR:0.05,kneeL:0.12,kneeR:0.12},
        itidal:   {elbL:0.12,elbR:0.12},
        sujud:    Object.assign({rootY:-0.5,bodyRx:-1.32,armLx:-0.3,armRx:-0.3,elbL:0.35,elbR:0.35},KNEEL),
        julus:    Object.assign({rootY:-0.6,bodyRx:-0.06,armLx:-0.55,armRx:-0.55,elbL:0.85,elbR:0.85},KNEEL),
        tashahhud:Object.assign({rootY:-0.6,bodyRx:-0.06,armLx:-0.55,armRx:-0.55,elbL:0.85,elbR:0.85},KNEEL),
        salamR:   Object.assign({rootY:-0.6,bodyRx:-0.05,bodyRy:-0.62,armLx:-0.55,armRx:-0.55,elbL:0.85,elbR:0.85},KNEEL),
        salamL:   Object.assign({rootY:-0.6,bodyRx:-0.05,bodyRy:0.62,armLx:-0.55,armRx:-0.55,elbL:0.85,elbR:0.85},KNEEL),
      }[st]||{};
      for(const k in b) t[k]=0;
      Object.assign(t,P);
    } else if(this.pose==='dua'){
      const br=Math.sin(now*1.6)*0.015;                                  // rustige ademhaling
      t.armLx=-2.05; t.armRx=-2.05; t.armLz=-0.32; t.armRz=0.32;
      t.elbL=0.85; t.elbR=0.85;                                          // ellebogen gebogen, handpalmen omhoog
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
      const amp=this.running?1.25:1;
      t.legL=S*0.55*amp;            t.legR=-S*0.55*amp;
      t.kneeL=lift(-C)*0.75*amp;    t.kneeR=lift(C)*0.75*amp;            // knie buigt in de zwaaifase
      t.armLx=-S*0.42*amp;          t.armRx=S*0.42*amp;
      t.elbL=0.25+lift(S)*0.35;     t.elbR=0.25+lift(-S)*0.35;           // elleboog veert mee
      t.armLz=-0.04; t.armRz=0.04;
      t.bodyY=Math.abs(S)*0.045*amp;
      t.bodyRz=S*0.035;                                                  // heupzwaai
      t.bodyRy=S*0.06;                                                   // schouders draaien licht tegen
    } else {
      const br=Math.sin(now*1.7);                                        // idle: ademen + microbeweging
      t.legL=0; t.legR=0; t.kneeL=0.04; t.kneeR=0.04;
      t.armLx=br*0.025; t.armRx=-br*0.025; t.armLz=-0.03; t.armRz=0.03;
      t.elbL=0.12; t.elbR=0.12;
      t.bodyY=br*0.012; t.bodyRz=0; t.bodyRy=Math.sin(now*0.6)*0.02;
    }
    // 2) blend huidig → doel
    const k=Math.min(1,dt*(this.moving?14:7));
    for(const key in t) b[key]+= (t[key]-b[key])*k;
    // 3) pas toe op het skelet
    pa.legL.rotation.x=b.legL;   pa.legR.rotation.x=b.legR;
    if(pa.kneeL){ pa.kneeL.rotation.x=b.kneeL; pa.kneeR.rotation.x=b.kneeR; }
    pa.armL.rotation.x=b.armLx;  pa.armR.rotation.x=b.armRx;
    pa.armL.rotation.z=b.armLz;  pa.armR.rotation.z=b.armRz;
    if(pa.elbL){ pa.elbL.rotation.x=b.elbL; pa.elbR.rotation.x=b.elbR; }
    pa.body.rotation.z=b.bodyRz; pa.body.rotation.y=b.bodyRy;
    // buigen (ruku/sujud) om een HEUP-scharnier: romp kantelt, heupen blijven boven de voeten
    const hipH=0.45;
    pa.body.rotation.x=b.bodyRx;
    pa.body.position.y=b.bodyY + hipH*(1-Math.cos(b.bodyRx));
    pa.body.position.z=-hipH*Math.sin(b.bodyRx);
    const ty=(typeof terrainFn==='function'&&terrainFn)?terrainFn(this.x,this.z):0;   // heuvels (Jabal al-Rahma)
    Player.y0=ty;
    this.obj.position.y=(this.sitting?-0.42:0)+b.rootY+ty;     // zakken naar de grond + terreinhoogte
  },
  interact(){ Sound.init(); Zone.trigger(); }
};

// ============================================================
//  CAMERA RIG
// ============================================================
let camOccluders=[];   // grote objecten waar de camera niet achter mag verdwijnen
const Cam = {
  yaw:0, pitch:0.32, dist:6.2, height:2.4, lookH:1.4, maxY:null, bound:null,
  update(){
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
