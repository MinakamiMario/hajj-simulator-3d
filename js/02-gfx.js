'use strict';
// ============================================================
//  GFX v4 — procedurele texturen, luchtkoepel, sterren, skyline
// ============================================================
function hex2css(c){ return '#'+c.toString(16).padStart(6,'0'); }
function lighten(c,k){ // k>1 lichter, k<1 donkerder (per kanaal, geclamped)
  const r=Math.min(255,((c>>16)&255)*k|0), g=Math.min(255,((c>>8)&255)*k|0), b=Math.min(255,(c&255)*k|0);
  return (r<<16)|(g<<8)|b;
}
function mixHex(a,b,t){
  const ar=(a>>16)&255, ag=(a>>8)&255, ab=a&255, br=(b>>16)&255, bg=(b>>8)&255, bb=b&255;
  return ((ar+(br-ar)*t|0)<<16)|((ag+(bg-ag)*t|0)<<8)|(ab+(bb-ab)*t|0);
}
function lum(c){ return (((c>>16)&255)*0.299+((c>>8)&255)*0.587+(c&255)*0.114)/255; }

// ---- canvas-textuur cache ----
const TexCache={};
function canvasTex(key,sz,draw,repeat){
  if(TexCache[key])return TexCache[key];
  const c=document.createElement('canvas'); c.width=c.height=sz;
  draw(c.getContext('2d'),sz);
  const t=new THREER.CanvasTexture(c); t.wrapS=t.wrapT=THREER.RepeatWrapping;
  t.repeat.set(repeat||1,repeat||1); t.anisotropy=8;
  TexCache[key]=t; return t;
}
// wit marmer met tegels en subtiele aders (Haram / mas'a / Nabawi)
function texMarble(rep){
  return canvasTex('marble',512,(x,s)=>{
    x.fillStyle='#ece6d8'; x.fillRect(0,0,s,s);
    for(let i=0;i<46;i++){ // aders
      x.strokeStyle=`rgba(${165+Math.random()*40|0},${155+Math.random()*40|0},${135+Math.random()*40|0},${.08+Math.random()*.14})`;
      x.lineWidth=.8+Math.random()*1.8; x.beginPath();
      let px=Math.random()*s, py=Math.random()*s; x.moveTo(px,py);
      for(let k=0;k<5;k++){ px+=(Math.random()-.5)*100; py+=(Math.random()-.5)*100; x.lineTo(px,py); }
      x.stroke(); }
    for(let i=0;i<900;i++){ // korrel
      x.fillStyle=`rgba(120,110,95,${Math.random()*.06})`;
      x.fillRect(Math.random()*s,Math.random()*s,1.5,1.5); }
    x.strokeStyle='rgba(110,100,85,.4)'; x.lineWidth=2; // voegen
    const n=4; for(let i=0;i<=n;i++){ const p=i*s/n;
      x.beginPath();x.moveTo(p,0);x.lineTo(p,s);x.stroke();
      x.beginPath();x.moveTo(0,p);x.lineTo(s,p);x.stroke(); }
  },rep||16);
}
// zand / aarde (Arafat, Muzdalifah, Mina)
function texSand(rep){
  return canvasTex('sand',256,(x,s)=>{
    x.fillStyle='#c8a878'; x.fillRect(0,0,s,s);
    for(let i=0;i<2600;i++){ const v=Math.random();
      x.fillStyle=v<.5?`rgba(90,70,45,${.05+Math.random()*.12})`:`rgba(255,235,200,${.04+Math.random()*.1})`;
      const r=.6+Math.random()*1.8; x.fillRect(Math.random()*s,Math.random()*s,r,r); }
    for(let i=0;i<14;i++){ // vage windribbels
      x.strokeStyle=`rgba(100,80,55,${.05+Math.random()*.05})`; x.lineWidth=2+Math.random()*3;
      x.beginPath(); const y0=Math.random()*s; x.moveTo(0,y0);
      for(let px=0;px<=s;px+=32){ x.lineTo(px,y0+Math.sin(px*.04+i)*6); } x.stroke(); }
  },rep||20);
}
// asfalt met lichte slijtage
function texAsphalt(rep){
  return canvasTex('asphalt',256,(x,s)=>{
    x.fillStyle='#3c3c42'; x.fillRect(0,0,s,s);
    for(let i=0;i<2000;i++){ const v=Math.random();
      x.fillStyle=v<.5?`rgba(0,0,0,${Math.random()*.16})`:`rgba(200,200,210,${Math.random()*.08})`;
      x.fillRect(Math.random()*s,Math.random()*s,1.4,1.4); }
  },rep||12);
}
// getextureerde grond (vervangt vlakke kleur)
function groundTex(tex,size,tint){
  const g=new THREER.PlaneGeometry(size||60,size||60);
  const m=new THREER.MeshStandardMaterial({color:tint!==undefined?tint:0xffffff,map:tex,roughness:.94,metalness:0});
  const me=new THREER.Mesh(g,m); me.rotation.x=-Math.PI/2; me.receiveShadow=true; world.add(me); return me;
}

// ---- luchtkoepel: verticaal verloop van zenit naar horizon ----
function makeSky(skyHex){
  const top=skyHex, hor=lighten(mixHex(skyHex,0xffffff,0.22),1.25);
  const c=document.createElement('canvas'); c.width=8; c.height=256;
  const x=c.getContext('2d');
  const g=x.createLinearGradient(0,0,0,256);
  g.addColorStop(0,hex2css(top));
  g.addColorStop(0.55,hex2css(mixHex(top,hor,0.45)));
  g.addColorStop(0.78,hex2css(hor));
  g.addColorStop(1,hex2css(lighten(hor,1.06)));
  x.fillStyle=g; x.fillRect(0,0,8,256);
  const tex=new THREER.CanvasTexture(c);
  const m=new THREER.MeshBasicMaterial({map:tex,side:THREER.BackSide,fog:false,depthWrite:false});
  const dome=new THREER.Mesh(new THREER.SphereGeometry(150,28,14),m);
  dome.renderOrder=-20; dome.frustumCulled=false;
  return {dome, horizon:hor};
}
// sterrenhemel als puntenwolk (nachtscènes)
function makeStarField(n){
  const geo=new THREER.BufferGeometry(); const pos=new Float32Array((n||320)*3);
  for(let i=0;i<(n||320);i++){
    const a=Math.random()*Math.PI*2, e=0.12+Math.random()*1.35, r=142;
    pos[i*3]=Math.cos(a)*Math.cos(e)*r; pos[i*3+1]=Math.sin(e)*r; pos[i*3+2]=Math.sin(a)*Math.cos(e)*r;
  }
  geo.setAttribute('position',new THREER.BufferAttribute(pos,3));
  const m=new THREER.PointsMaterial({color:0xfff6dc,size:1.6,sizeAttenuation:false,transparent:true,opacity:.85,fog:false,depthWrite:false});
  const pts=new THREER.Points(geo,m); pts.renderOrder=-19; pts.frustumCulled=false;
  return pts;
}

// ---- skyline van Mekka (zichtbaar boven de Haram-muren) ----
function texWindows(base,lit){
  return canvasTex('win'+base,128,(x,s)=>{
    x.fillStyle=hex2css(base); x.fillRect(0,0,s,s);
    for(let r=6;r<s;r+=14){ for(let c2=6;c2<s;c2+=12){
      x.fillStyle=Math.random()<(lit||.45)?'rgba(255,214,140,.92)':'rgba(20,24,38,.85)';
      x.fillRect(c2,r,7,9); } }
  },1);
}
function hotelTower(x,z,w,h,base){
  const m=new THREER.MeshBasicMaterial({map:texWindows(base||0x2a3046,.4)});
  m.map=m.map.clone(); m.map.needsUpdate=true; m.map.repeat.set(Math.max(2,w/3|0),Math.max(4,h/3|0));
  const t=new THREER.Mesh(new THREER.BoxGeometry(w,h,w*0.8),m);
  t.position.set(x,h/2,z); t.castShadow=false; t.receiveShadow=false; world.add(t);
  const cap=box(w*1.04,0.8,w*0.84,0x1c2030); cap.position.set(x,h+0.4,z); cap.castShadow=false; world.add(cap);
  return t;
}
// Abraj al-Bait klokkentoren (icoon van de Mekkaanse skyline)
function clockTower(x,z){
  const wm=new THREER.MeshBasicMaterial({map:texWindows(0x32384e,.4).clone()});
  wm.map.needsUpdate=true; wm.map.repeat.set(5,13);
  const base=new THREER.Mesh(new THREER.BoxGeometry(14,34,11),wm);
  base.position.set(x,17,z); base.castShadow=false; world.add(base);
  const shaft=box(7,16,7,0x3a4058); shaft.position.set(x,42,z); shaft.castShadow=false; world.add(shaft);
  // klok aan 4 zijden
  const face=canvasTex('clock',128,(c2,s)=>{
    c2.fillStyle='#101626'; c2.fillRect(0,0,s,s);
    c2.beginPath(); c2.arc(s/2,s/2,s*0.42,0,6.28); c2.fillStyle='#f4ecd2'; c2.fill();
    c2.strokeStyle='#16331f'; c2.lineWidth=6; c2.stroke();
    c2.strokeStyle='#1a1a1a'; c2.lineWidth=4;
    c2.beginPath(); c2.moveTo(s/2,s/2); c2.lineTo(s/2,s*0.2); c2.stroke();
    c2.beginPath(); c2.moveTo(s/2,s/2); c2.lineTo(s*0.68,s*0.55); c2.stroke();
  },1);
  [[0,0,3.6,0],[0,0,-3.6,Math.PI],[3.6,0,0,Math.PI/2],[-3.6,0,0,-Math.PI/2]].forEach(p=>{
    const f=new THREER.Mesh(new THREER.PlaneGeometry(6,6),
      new THREER.MeshBasicMaterial({map:face,fog:false}));
    f.position.set(x+p[0],44,z+p[2]); f.rotation.y=p[3]; world.add(f);
  });
  const spireB=cyl(2.2,3.4,3,0x2e4836,{roughness:.7}); spireB.position.set(x,51.5,z); spireB.castShadow=false; world.add(spireB);
  const cres=cyl(0.12,0.9,7,0xc9a84c,{emissive:0x6b5012,emissiveIntensity:.7}); cres.position.set(x,56.5,z); cres.castShadow=false; world.add(cres);
  const glowL=new THREER.PointLight(0xffe7b0,0.5,60); glowL.position.set(x,44,z); world.add(glowL);
}
// rijen witte Mina-tenten als achtergrond
function minaTentField(cx,cz,rows,cols,gap){
  const grp=new THREER.Group();
  for(let r=0;r<rows;r++){ for(let c2=0;c2<cols;c2++){
    const tx=cx+(c2-cols/2)*(gap||2.4)+(Math.random()-.5)*.4;
    const tz=cz-r*(gap||2.4)+(Math.random()-.5)*.4;
    const t=cyl(0.55,1.05,1.15,0xf3efe4,{roughness:1},4); t.rotation.y=Math.PI/4;
    t.position.set(tx,0.57,tz); t.castShadow=false; t.receiveShadow=false; grp.add(t);
  } }
  world.add(grp); return grp;
}
// verre bergrand rond de vallei van Mekka
function mountainRange(r,col,n){
  const grp=new THREER.Group();
  for(let i=0;i<(n||14);i++){
    const a=(i/(n||14))*Math.PI*2+Math.random()*.2;
    const h=8+Math.random()*14, w=14+Math.random()*16;
    const m=cyl(0.5,w,h,col||0x4a3b30,{roughness:1,fog:true},5);
    m.position.set(Math.cos(a)*r,h/2-1.5,Math.sin(a)*r);
    m.castShadow=false; m.receiveShadow=false; grp.add(m);
  }
  world.add(grp); return grp;
}
