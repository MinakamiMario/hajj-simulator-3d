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
  // ---- animatie-engine: doelhoudingen + vloeiend blenden ----
  _bl:null,
  _resetBlend(){ this._bl={legL:0,legR:0,kneeL:0,kneeR:0,armLx:0,armRx:0,armLz:0,armRz:0,elbL:0,elbR:0,bodyY:0,bodyRz:0,bodyRy:0}; },
  animate(dt){
    if(!this.obj)return;
    const pa=this.obj.userData.parts;
    if(!this._bl)this._resetBlend();
    const b=this._bl, t={};
    const now=clock?clock.elapsedTime:0;
    // 1) bepaal DOEL-houding
    if(this.pose==='dua'){
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
    pa.body.position.y=b.bodyY;  pa.body.rotation.z=b.bodyRz; pa.body.rotation.y=b.bodyRy;
  },
  interact(){ Sound.init(); Zone.trigger(); }
};

// ============================================================
//  CAMERA RIG
// ============================================================
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
    camera.position.set(camX,camY,camZ);
    camera.lookAt(Player.x,this.lookH,Player.z);
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
