'use strict';
// ============================================================
//  ZONES & WORLD LABELS
// ============================================================
const Zone = {
  list:[], current:null,
  clear(){ this.list.forEach(z=>{ if(z.ring)world.remove(z.ring); if(z.sprite)world.remove(z.sprite); });
    this.list=[]; this.current=null; clearLabels(); updatePrompt(); Guide.refresh(); },
  add(z){
    z.done=false; z.y=z.y||0;
    if(z.pickup){
      z.sprite=emojiSprite(z.icon||'⬤',z.spriteSize||0.55);
      z.sprite.position.set(z.x,(z.y)+ (z.lift||0.28), z.z);
      world.add(z.sprite);
      if(z.glow){ z.ring=glowRing((z.r||0.6),0xc9a84c); z.ring.position.set(z.x,z.y+0.02,z.z); z.ring.scale.set(.7,.7,.7); world.add(z.ring); }
    } else {
      z.ring=glowRing(z.r||1.1,z.color||0xc9a84c);
      z.ring.position.set(z.x,z.y+0.03,z.z); world.add(z.ring);
    }
    this.list.push(z);
    if(z.guide) Guide.refresh();
  },
  check(){
    let near=null,bestD=1e9;
    for(const z of this.list){ if(z.done)continue;
      const dx=z.x-Player.x, dz=z.z-Player.z; const d=Math.hypot(dx,dz);
      const rr=(z.trigR||z.r||1.2);
      if(d<rr && d<bestD){ bestD=d; near=z; }
    }
    if(near!==this.current){ this.current=near; updatePrompt(); }
    // auto-trigger zones (tawaf/sai handled via frameHook); pickup auto on contact if z.auto
    if(this.current && this.current.auto){ const z=this.current; this.markDone(z); if(z.action)z.action(z); }
  },
  trigger(){ if(this.current&&this.current.action){ const z=this.current; if(!z.noConsume)this.markDone(z); z.action(z);} },
  markDone(z){
    z.done=true;
    if(z.sprite){ // fade out + rise + sparkle
      Sound.pickup(); sparkle(z.x,(z.y||0)+0.4,z.z);
      const s=z.sprite; let t=0; const iv=setInterval(()=>{ t+=0.06; s.scale.multiplyScalar(0.9); s.position.y+=0.04; s.material.opacity=Math.max(0,1-t*2);
        if(t>0.5){clearInterval(iv); world.remove(s);} },16);
    }
    if(z.ring){ z.ring.material.color.set(0x27ae60); z.ring.material.opacity=0.3; }
    if(this.current===z)this.current=null; updatePrompt();
    Guide.refresh();
  }
};

// ============================================================
//  GUIDE — gouden baken + randpijl naar het actieve doel
// ============================================================
const Guide = {
  grp:null, tip:null, ring:null, target:null,
  refresh(){
    // wijs naar de eerste niet-afgeronde zone met guide:true
    const t=Zone.list.find(z=>z.guide && !z.done) || null;
    if(t===this.target && this.grp) return;
    this.clear();
    if(!t || !world) return;
    this.target=t;
    const g=new THREER.Group();
    const beam=new THREER.Mesh(new THREER.CylinderGeometry(0.14,0.4,6,12,1,true),
      new THREER.MeshBasicMaterial({color:0xffd870,transparent:true,opacity:.26,depthWrite:false,side:THREER.DoubleSide}));
    beam.position.y=3.2; g.add(beam);
    const tip=new THREER.Mesh(new THREER.ConeGeometry(0.32,0.6,12),
      new THREER.MeshBasicMaterial({color:0xffd870}));
    tip.rotation.x=Math.PI; tip.position.y=2.3; g.add(tip); this.tip=tip;
    const ring=glowRing(0.95,0xffd870); ring.position.y=0.06; g.add(ring); this.ring=ring;
    g.position.set(t.x,(t.y||0),t.z); world.add(g); this.grp=g;
  },
  clear(){
    if(this.grp && world) world.remove(this.grp);
    this.grp=null; this.tip=null; this.ring=null; this.target=null;
    const a=document.getElementById('guide-arrow'); if(a)a.style.display='none';
  },
  update(){
    const a=document.getElementById('guide-arrow');
    if(!this.grp || !this.target){ if(a)a.style.display='none'; return; }
    const now=clock?clock.elapsedTime:0;
    if(this.tip) this.tip.position.y=2.3+Math.sin(now*3.2)*0.3;
    if(this.ring){ const s=1+Math.sin(now*3.2)*0.14; this.ring.scale.set(s,s,s); }
    if(!a) return;
    // randpijl: alleen tonen als het doel niet (goed) in beeld is
    const t=this.target;
    const v=new THREER.Vector3(t.x,(t.y||0)+1.2,t.z); v.project(camera);
    const behind=v.z>1;
    let sx=(v.x*0.5+0.5)*window.innerWidth, sy=(-v.y*0.5+0.5)*window.innerHeight;
    if(behind){ sx=window.innerWidth-sx; sy=window.innerHeight*0.96; }
    const m=52, W=window.innerWidth, H=window.innerHeight;
    const inView=!behind && sx>=m && sx<=W-m && sy>=m && sy<=H-m;
    if(inView){ a.style.display='none'; return; }
    const cx=W/2, cy=H/2;
    let dx=sx-cx, dy=sy-cy; const len=Math.hypot(dx,dy)||1; dx/=len; dy/=len;
    const tE=Math.min((cx-m)/Math.max(1e-6,Math.abs(dx)), (cy-m)/Math.max(1e-6,Math.abs(dy)));
    const d=Math.hypot(t.x-Player.x,t.z-Player.z);
    a.style.display='flex';
    a.style.left=(cx+dx*tE)+'px'; a.style.top=(cy+dy*tE)+'px';
    a.querySelector('.ga-rot').style.transform=`rotate(${Math.atan2(dy,dx)}rad)`;
    a.querySelector('.ga-dist').textContent=Math.round(d)+'m';
  }
};
// small burst of glowing particles
function sparkle(x,y,z,color){
  for(let i=0;i<8;i++){ const p=sph(0.05,color||0xffe08a,{emissive:color||0xffd060,emissiveIntensity:1});
    p.position.set(x,y,z); world.add(p);
    const a=Math.random()*Math.PI*2, sp=0.6+Math.random()*0.8, vy=1+Math.random()*1.2;
    let t=0; const iv=setInterval(()=>{ t+=0.03; p.position.x+=Math.cos(a)*sp*0.04; p.position.z+=Math.sin(a)*sp*0.04;
      p.position.y+=vy*0.03; p.material.opacity=Math.max(0,1-t*1.5); p.material.transparent=true; p.scale.multiplyScalar(0.95);
      if(t>0.7){clearInterval(iv); world.remove(p);} },16);
  }
}

// world->screen labels
let labelEls=[];
function clearLabels(){ const c=document.getElementById('labels'); c.querySelectorAll('.world-label,.world-prompt').forEach(e=>e.remove()); labelEls=[]; }
function projectToScreen(x,y,z){
  const v=new THREER.Vector3(x,y,z); v.project(camera);
  return { x:(v.x*0.5+0.5)*window.innerWidth, y:(-v.y*0.5+0.5)*window.innerHeight, vis:v.z<1 };
}
let promptEl=null;
function updatePrompt(){
  const btn=document.getElementById('btn-action');
  const labels=document.getElementById('labels');
  if(promptEl){promptEl.remove();promptEl=null;}
  if(Zone.current){
    btn.classList.add('ready'); btn.querySelector('.ba-hint').textContent=(Zone.current.label||'actie').toLowerCase();
    if(!Zone.current.auto){
      promptEl=document.createElement('div'); promptEl.className='world-prompt';
      promptEl.innerHTML=`<div class="wp-key">A</div><div class="wp-label">${Zone.current.label||'Actie'}</div>`;
      labels.appendChild(promptEl);
    }
  } else { btn.classList.remove('ready'); btn.querySelector('.ba-hint').textContent='—'; }
}
function updateLabelPositions(){
  if(promptEl && Zone.current){
    const z=Zone.current; const p=projectToScreen(z.x,(z.y||0)+1.9,z.z);
    if(p.vis){ promptEl.style.display='flex'; promptEl.style.left=p.x+'px'; promptEl.style.top=p.y+'px'; }
    else promptEl.style.display='none';
  }
}
