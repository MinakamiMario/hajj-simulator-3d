'use strict';
// ============================================================
//  HELPERS
// ============================================================
function mat(color, opts){ return new THREER.MeshStandardMaterial(Object.assign({color:color, roughness:.85, metalness:.05}, opts||{})); }
function box(w,h,d,color,opts){
  const g=new THREER.BoxGeometry(w,h,d);
  const m=mat(color,opts); const me=new THREER.Mesh(g,m);
  me.castShadow=true; me.receiveShadow=true; return me;
}
function cyl(rt,rb,h,color,opts,seg){
  const g=new THREER.CylinderGeometry(rt,rb,h,seg||16);
  const me=new THREER.Mesh(g,mat(color,opts)); me.castShadow=true; me.receiveShadow=true; return me;
}
function sph(r,color,opts,seg){
  const s=seg||18;
  const g=new THREER.SphereGeometry(r,s,Math.max(10,Math.round(s*0.78)));
  const me=new THREER.Mesh(g,mat(color,opts)); me.castShadow=true; me.receiveShadow=true; return me;
}
function add(obj,x,y,z){ if(x!==undefined){obj.position.set(x,y,z);} world.add(obj); return obj; }

// emoji sprite (for items / pickups)
function emojiTexture(emoji){
  const c=document.createElement('canvas'); c.width=c.height=128;
  const ctx=c.getContext('2d');
  ctx.font='96px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(emoji,64,72);
  const t=new THREER.CanvasTexture(c); t.anisotropy=4; return t;
}
function emojiSprite(emoji,size){
  const m=new THREER.SpriteMaterial({map:emojiTexture(emoji),transparent:true,depthWrite:false});
  const s=new THREER.Sprite(m); s.scale.set(size||.6,size||.6,1); return s;
}

// flat glowing ground ring (for action zones)
function glowRing(r,color){
  const g=new THREER.RingGeometry(r*0.78,r,40);
  const m=new THREER.MeshBasicMaterial({color:color||0xc9a84c,transparent:true,opacity:.55,side:THREER.DoubleSide});
  const me=new THREER.Mesh(g,m); me.rotation.x=-Math.PI/2; return me;
}

// crowd of simple white-cloth pilgrims
function pilgrimMesh(col,skinCol){
  const p=new THREER.Group();
  const skins=[0xead0b0,0xd4ab7d,0xc9a06a,0xa9764a,0x8a5a34,0x6e4526];
  const sk=skinCol||skins[Math.floor(Math.random()*skins.length)];
  const hairC=[0x161009,0x2a1c10,0x3a2a18,0x4a4a4a][Math.floor(Math.random()*4)];
  const female=!col && Math.random()<0.35;            // mix of women in the crowd
  const ihramStyle=!col && !female && Math.random()<0.6;
  const robeCol = col || (female
    ? [0x2a2a34,0x1f2630,0x3a2a3e,0x26323a,0x141418][Math.floor(Math.random()*5)]
    : (ihramStyle?0xf6f3ea:[0xf2efe6,0xe8e2d4,0xded6c2,0xcfd6dd][Math.floor(Math.random()*4)]));
  const dk=c=>((((c>>16)&255)*0.8|0)<<16)|((((c>>8)&255)*0.8|0)<<8)|((c&255)*0.8|0);
  const lowS=10;
  // robe: flared skirt + waist + chest (tapered, not a tube)
  const skirt=cyl(0.17,0.31,0.92,robeCol,{roughness:.92},lowS); skirt.position.y=0.46; skirt.castShadow=false; p.add(skirt);
  const waist=cyl(0.155,0.175,0.34,robeCol,{roughness:.92},lowS); waist.position.y=1.06; waist.castShadow=false; p.add(waist);
  const chest=sph(0.185,robeCol,{roughness:.9},lowS); chest.position.set(0,1.3,0.01); chest.scale.set(1.08,0.92,0.82); chest.castShadow=false; p.add(chest);
  // sloped shoulders
  const sh=cyl(0.062,0.062,0.44,robeCol,{roughness:.9},lowS); sh.rotation.z=Math.PI/2; sh.position.y=1.43; sh.castShadow=false; p.add(sh);
  // ihram: bare shoulder + diagonal rida
  if(ihramStyle){
    const arm0=sph(0.075,sk,{roughness:.6},8); arm0.position.set(0.21,1.43,0); arm0.castShadow=false; p.add(arm0);
    const rida=box(0.34,0.5,0.24,0xffffff,{roughness:.92}); rida.position.set(-0.04,1.28,0); rida.rotation.z=0.3; rida.castShadow=false; p.add(rida);
  }
  // neck + head + ears
  const neck=cyl(0.05,0.062,0.1,sk,{roughness:.6},8); neck.position.y=1.54; neck.castShadow=false; p.add(neck);
  const head=sph(0.135,sk,{roughness:.55},14); head.position.y=1.69; head.scale.set(0.95,1.08,0.97); head.castShadow=false; p.add(head);
  [-1,1].forEach(s=>{ const ear=sph(0.026,sk,{roughness:.6},6); ear.position.set(s*0.128,1.69,-0.005); ear.scale.set(0.6,1,0.85); ear.castShadow=false; p.add(ear); });
  // simple face: eyes + brows + mouth (front = -z)
  [-0.048,0.048].forEach(ex=>{
    const eye=sph(0.016,0x1c1410,{roughness:.3},6); eye.position.set(ex,1.715,-0.118); eye.castShadow=false; p.add(eye);
    const br=box(0.045,0.012,0.02,hairC); br.position.set(ex,1.75,-0.112); br.castShadow=false; p.add(br);
  });
  const nose=sph(0.02,dk(sk),{roughness:.6},6); nose.position.set(0,1.685,-0.128); nose.castShadow=false; p.add(nose);
  const mouth=box(0.05,0.012,0.015,0x8a4f48); mouth.position.set(0,1.64,-0.118); mouth.castShadow=false; p.add(mouth);
  // headwear / hair
  if(female){
    const hij=sph(0.155,dk(robeCol),{roughness:1},12); hij.position.set(0,1.71,0.018); hij.scale.set(1.08,1.12,1.12); hij.castShadow=false; p.add(hij);
    const drape=cyl(0.14,0.24,0.42,dk(robeCol),{roughness:1},lowS); drape.position.set(0,1.4,0.03); drape.castShadow=false; p.add(drape);
  } else {
    const r=Math.random();
    if(ihramStyle || r<0.3){ // bare head with short hair
      const hr2=sph(0.138,hairC,{roughness:.9},12); hr2.position.set(0,1.74,0.03); hr2.scale.set(1.0,0.8,1.02); hr2.castShadow=false; p.add(hr2);
    } else if(r<0.65){ // ghutra
      const gh=sph(0.15,0xf8f6f0,{roughness:1},12); gh.position.set(0,1.72,0.015); gh.scale.set(1.1,1.0,1.12); gh.castShadow=false; p.add(gh);
      const back=box(0.3,0.36,0.14,0xf8f6f0,{roughness:1}); back.position.set(0,1.52,0.1); back.castShadow=false; p.add(back);
      const cord=cyl(0.142,0.142,0.035,0x1a1a1a,{},lowS); cord.position.set(0,1.79,0.015); cord.castShadow=false; p.add(cord);
    } else { // kufi
      const kuf=sph(0.14,[0xf2efe6,0xe5dfd0,0xd8e0e6][Math.floor(Math.random()*3)],{roughness:1},12);
      kuf.position.set(0,1.77,0.01); kuf.scale.set(1.0,0.5,1.0); kuf.castShadow=false; p.add(kuf);
    }
    // beard on some men
    if(Math.random()<0.45){ const bd=sph(0.085,hairC,{roughness:.95},8); bd.position.set(0,1.6,-0.06); bd.scale.set(1.1,0.85,0.8); bd.castShadow=false; p.add(bd); }
  }
  // arms with elbows + hands (animatable group)
  const arms=new THREER.Group(); p.add(arms); p.userData.arms=arms;
  [-1,1].forEach(s=>{
    const ag=new THREER.Group(); ag.position.set(s*0.21,1.42,0); arms.add(ag);
    const up=cyl(0.045,0.052,0.26,ihramStyle?sk:robeCol,{roughness:.85},8); up.position.y=-0.14; up.rotation.z=s*0.1; up.castShadow=false; ag.add(up);
    const fo=cyl(0.038,0.045,0.24,ihramStyle?sk:robeCol,{roughness:.8},8); fo.position.set(s*0.035,-0.39,0); fo.castShadow=false; ag.add(fo);
    const hand=sph(0.045,sk,{roughness:.6},6); hand.position.set(s*0.04,-0.53,0); hand.scale.set(0.9,1.1,0.7); hand.castShadow=false; ag.add(hand);
  });
  return p;
}
function makeCrowd(n,cx,cz,spread,radial){
  const grp=new THREER.Group();
  for(let i=0;i<n;i++){
    let x,z;
    if(radial){ const a=(i/n)*Math.PI*2+Math.random()*.3; const rr=radial.min+Math.random()*(radial.max-radial.min);
      x=cx+Math.cos(a)*rr; z=cz+Math.sin(a)*rr; }
    else { x=cx+(Math.random()-.5)*spread; z=cz+(Math.random()-.5)*spread; }
    const p=pilgrimMesh();
    p.position.set(x,0,z); p.rotation.y=Math.random()*Math.PI*2; p.userData.ph=Math.random()*Math.PI*2;
    grp.add(p);
  }
  return grp;
}
// single named pilgrim (for encounters), optional floating emoji
function makePilgrim(col,emoji){
  const p=pilgrimMesh(col);
  if(emoji){ const s=emojiSprite(emoji,0.55); s.position.y=2.2; p.add(s); p.userData.emoji=s; }
  return p;
}

// ---------- char preview SVGs (select screen only) ----------
const PREVIEW = {
  male:`<svg viewBox="0 0 100 200" xmlns="http://www.w3.org/2000/svg"><ellipse cx="50" cy="196" rx="30" ry="3" fill="rgba(0,0,0,.35)"/><path d="M28,58 Q30,55 36,55 L64,55 Q70,55 72,58 L82,190 L18,190 Z" fill="#f0e8d0" stroke="#c8bc98" stroke-width="1.2"/><rect x="44" y="46" width="12" height="12" fill="#c89770"/><ellipse cx="50" cy="30" rx="20" ry="22" fill="#1a0e08"/><ellipse cx="50" cy="36" rx="15" ry="14" fill="#c89770"/></svg>`,
  female:`<svg viewBox="0 0 100 200" xmlns="http://www.w3.org/2000/svg"><ellipse cx="50" cy="196" rx="32" ry="3" fill="rgba(0,0,0,.35)"/><path d="M22,70 Q26,65 34,63 L66,63 Q74,65 78,70 L88,190 L12,190 Z" fill="#2a1535" stroke="#150820" stroke-width="1.2"/><path d="M20,52 Q24,30 50,18 Q76,30 80,52 L86,105 Q76,112 70,112 Q60,115 50,115 Q40,115 30,112 Q24,112 14,105 Z" fill="#1a0a25" stroke="#0d0518" stroke-width="1.2"/></svg>`
};
