'use strict';
// ============================================================
//  ENVIRONMENT BUILDERS
// ============================================================
function ground(color,size,opts){
  const g=new THREER.PlaneGeometry(size||40,size||40);
  const m=new THREER.MeshStandardMaterial(Object.assign({color:color,roughness:.95,metalness:0},opts||{}));
  const me=new THREER.Mesh(g,m); me.rotation.x=-Math.PI/2; me.receiveShadow=true; world.add(me); return me;
}
function room(w,d,h,wallCol,floorCol){
  ground(floorCol,Math.max(w,d)+4);
  const back=box(w,h,0.2,wallCol,{roughness:1}); back.position.set(0,h/2,-d/2); world.add(back);
  const left=box(0.2,h,d,wallCol,{roughness:1}); left.position.set(-w/2,h/2,0); world.add(left);
  const right=box(0.2,h,d,wallCol,{roughness:1}); right.position.set(w/2,h/2,0); world.add(right);
  // subtle baseboard
  return {w,d,h};
}
function windowOnWall(x,z,col){
  const frame=box(2.2,1.6,0.12,0x10101c); frame.position.set(x,2.0,z); world.add(frame);
  const glass=box(2.0,1.4,0.06,col||0x10204a,{emissive:col||0x10204a,emissiveIntensity:.5,roughness:.4});
  glass.position.set(x,2.0,z+0.05); world.add(glass);
}
function bed(x,z,rot){
  const g=new THREER.Group();
  const frame=box(1.5,0.35,2.2,0x3a2a18); frame.position.y=0.2; g.add(frame);
  const mat1=box(1.42,0.22,2.1,0x6b5a8a); mat1.position.y=0.45; g.add(mat1);
  const pillow=box(1.2,0.14,0.45,0xe8e2d4); pillow.position.set(0,0.6,-0.75); g.add(pillow);
  const blanket=box(1.42,0.1,1.2,0x35506a); blanket.position.set(0,0.56,0.35); g.add(blanket);
  g.position.set(x,0,z); if(rot)g.rotation.y=rot; world.add(g);
  g.userData.topY=0.56; return g;
}
function nightstand(x,z){
  const g=new THREER.Group();
  const b=box(0.55,0.55,0.45,0x4a3422); b.position.y=0.28; g.add(b);
  g.position.set(x,0,z); world.add(g); g.userData.topY=0.56; return g;
}
function desk(x,z,rot){
  const g=new THREER.Group();
  const top=box(1.4,0.08,0.6,0x5a4028); top.position.y=0.78; g.add(top);
  [[-.62,-.24],[.62,-.24],[-.62,.24],[.62,.24]].forEach(p=>{ const lgm=box(0.08,0.78,0.08,0x3a2a18); lgm.position.set(p[0],0.39,p[1]); g.add(lgm); });
  g.position.set(x,0,z); if(rot)g.rotation.y=rot; world.add(g); g.userData.topY=0.82; return g;
}
function rugMat(x,z,col){
  const g=new THREER.Group();
  const r=box(1.1,0.04,1.8,col||0x3a1d55); r.position.y=0.02; g.add(r);
  const border=box(1.16,0.02,1.86,0xc9a84c); border.position.y=0.005; g.add(border);
  const arch=box(0.5,0.02,0.5,0xc9a84c); arch.position.set(0,0.05,-0.55); g.add(arch);
  g.position.set(x,0,z); world.add(g); return g;
}
function suitcase(x,z){
  const g=new THREER.Group();
  const base=box(1.0,0.18,0.7,0x143a2a); base.position.y=0.09; g.add(base);
  const lid=box(1.0,0.5,0.04,0x1d5a43); lid.position.set(0,0.34,-0.33); lid.rotation.x=-0.5; g.add(lid);
  g.position.set(x,0,z); world.add(g); return g;
}
function chair(x,z,rot,col){
  const g=new THREER.Group();
  const seat=box(0.5,0.08,0.5,col||0x6a4a30); seat.position.y=0.46; g.add(seat);
  const back=box(0.5,0.55,0.08,col||0x6a4a30); back.position.set(0,0.74,-0.21); g.add(back);
  [[-.2,-.2],[.2,-.2],[-.2,.2],[.2,.2]].forEach(p=>{ const l=box(0.06,0.46,0.06,0x3a2a18); l.position.set(p[0],0.23,p[1]); g.add(l); });
  g.position.set(x,0,z); if(rot)g.rotation.y=rot; world.add(g); g.userData.topY=0.5; return g;
}
function dresser(x,z,rot,col){
  const g=new THREER.Group();
  const b=box(1.1,0.85,0.5,col||0x4a3422); b.position.y=0.43; g.add(b);
  [0.2,0.5,0.8].forEach(yy=>{ const dr=box(1.0,0.22,0.04,0x5a4430); dr.position.set(0,yy,0.26); g.add(dr);
    const h=box(0.12,0.04,0.04,0xc9a84c); h.position.set(0,yy,0.29); g.add(h); });
  g.position.set(x,0,z); if(rot)g.rotation.y=rot; world.add(g); g.userData.topY=0.88; return g;
}
function shelf(x,y,z,w,col){
  const g=new THREER.Group();
  const board=box(w||1.4,0.06,0.3,col||0x5a4028); board.position.set(0,0,0); g.add(board);
  const b1=box(0.05,0.2,0.28,0x3a2a18); b1.position.set(-(w||1.4)/2+0.1,-0.12,0); g.add(b1);
  const b2=box(0.05,0.2,0.28,0x3a2a18); b2.position.set((w||1.4)/2-0.1,-0.12,0); g.add(b2);
  g.position.set(x,y,z); world.add(g); g.userData.topY=y+0.03; return g;
}
function bookshelf(x,z,rot){
  const g=new THREER.Group();
  const frame=box(1.4,2.2,0.4,0x3a2a1c); frame.position.y=1.1; g.add(frame);
  for(let i=0;i<4;i++){ const sh=box(1.3,0.05,0.36,0x2a1e14); sh.position.set(0,0.5+i*0.5,0); g.add(sh);
    let bx=-0.55; while(bx<0.55){ const h=0.28+Math.random()*0.12; const bk=box(0.08+Math.random()*0.05,h,0.3,[0x8a3a2a,0x2a5a6a,0x3a6a3a,0x6a5a2a,0x5a3a6a][Math.floor(Math.random()*5)]);
      bk.position.set(bx,0.5+i*0.5+h/2+0.03,0.02); g.add(bk); bx+=0.13; } }
  g.position.set(x,0,z); if(rot)g.rotation.y=rot; world.add(g); return g;
}
function potplant(x,z,s){
  const pot=cyl(0.16*(s||1),0.2*(s||1),0.36*(s||1),0x8a4a2a); pot.position.set(x,0.18*(s||1),z); world.add(pot);
  const leaf=sph(0.42*(s||1),0x2a7a3a,{roughness:1}); leaf.position.set(x,0.72*(s||1),z); leaf.scale.set(1,1.35,1); world.add(leaf);
}
function house(x,z,col){
  const w=1.6+Math.random()*0.9, d=1.5+Math.random()*0.6, h=1.6+Math.random()*1.1;
  const g=new THREER.Group();
  const body=box(w,h,d,col); body.position.y=h/2; body.castShadow=false; g.add(body);
  const roof=cyl(0.02,Math.max(w,d)*0.78,0.7,0x7a3a2a,{},4); roof.rotation.y=Math.PI/4; roof.position.y=h+0.33; roof.castShadow=false; g.add(roof);
  const win=box(0.4,0.45,0.04,0xffe6a0,{emissive:0xffcc66,emissiveIntensity:.5}); win.position.set(-w*0.2,h*0.55,d/2+0.02); g.add(win);
  const win2=box(0.4,0.45,0.04,0xffe6a0,{emissive:0xffcc66,emissiveIntensity:.5}); win2.position.set(w*0.2,h*0.55,d/2+0.02); g.add(win2);
  const door=box(0.42,0.7,0.05,0x4a2e1e); door.position.set(0,0.35,d/2+0.02); g.add(door);
  g.position.set(x,0,z); world.add(g); return g;
}
function lampPost(x,z){
  const pole=cyl(0.06,0.08,2.4,0x2a2a30); pole.position.set(x,1.2,z); pole.castShadow=false; world.add(pole);
  const lamp=sph(0.16,0xffe6a0,{emissive:0xffcc66,emissiveIntensity:1}); lamp.position.set(x,2.45,z); world.add(lamp);
  const pl=new THREER.PointLight(0xffd9a0,0.35,5); pl.position.set(x,2.45,z); world.add(pl);
}
function taxi(x,z){
  const g=new THREER.Group();
  const body=box(1.9,0.5,0.92,0xf0c000); body.position.y=0.42; g.add(body);
  const cab=box(1.0,0.42,0.84,0xf6d83a); cab.position.set(-0.1,0.8,0); g.add(cab);
  [[-.62,.47],[.62,.47],[-.62,-.47],[.62,-.47]].forEach(p=>{ const w=cyl(0.18,0.18,0.16,0x141414); w.rotation.x=Math.PI/2; w.position.set(p[0],0.2,p[1]); g.add(w); });
  const sign=box(0.3,0.14,0.2,0x111111); sign.position.set(-0.1,1.08,0); g.add(sign);
  g.position.set(x,0,z); g.rotation.y=Math.PI/2; world.add(g); return g;
}
function kaaba(x,z){
  const g=new THREER.Group();
  const c=box(3.2,3.6,3.2,0x080808,{roughness:.6,metalness:.1}); c.position.y=1.8; g.add(c);
  const band=box(3.26,0.5,3.26,0xc9a84c,{emissive:0x6b5012,emissiveIntensity:.6,metalness:.4,roughness:.4});
  band.position.y=2.55; g.add(band);
  const door=box(0.9,1.4,0.06,0x8a6a1c,{metalness:.5,roughness:.4}); door.position.set(0.6,1.0,1.61); g.add(door);
  const light=new THREER.PointLight(0xffd070,0.8,16); light.position.set(0,4,0); g.add(light);
  g.position.set(x,0,z); world.add(g); return g;
}
// surrounding mosque: mataf floor, two-tier arcade ring, tall minarets, floodlights
function haramSurround(cx,cz,r){
  r=r||16;
  // witte mataf-vloer rond de Ka'ba (met marmer-textuur)
  const mataf=cyl(r-3.5,r-3.5,0.06,0xffffff,{roughness:.85,map:texMarble(Math.max(8,r-6))},48);
  mataf.position.set(cx,0.04,cz); mataf.receiveShadow=true; mataf.castShadow=false; world.add(mataf);
  // onderste arcade
  const nPil=Math.max(30,Math.round(r*2.1));
  for(let i=0;i<nPil;i++){ const a=(i/nPil)*Math.PI*2;
    const px=cx+Math.cos(a)*r, pz=cz+Math.sin(a)*r;
    const pil=cyl(0.3,0.36,4.6,0xd9d2c2,{roughness:.9}); pil.position.set(px,2.3,pz); pil.castShadow=false; world.add(pil);
    const arch=sph(0.58,0xd9d2c2,{roughness:.9},10); arch.position.set(px,4.7,pz); arch.scale.set(1,0.7,1); arch.castShadow=false; world.add(arch);
  }
  const beam=cyl(r+0.5,r+0.5,0.4,0xcfc8b6,{roughness:.95},48); beam.position.set(cx,5.1,cz); beam.castShadow=false; world.add(beam);
  // tweede verdieping: kortere zuilen + dakrand
  for(let i=0;i<nPil;i++){ const a=((i+0.5)/nPil)*Math.PI*2;
    const px=cx+Math.cos(a)*r, pz=cz+Math.sin(a)*r;
    const pil2=cyl(0.22,0.26,2.6,0xe2dccb,{roughness:.9}); pil2.position.set(px,6.6,pz); pil2.castShadow=false; world.add(pil2);
  }
  const beam2=cyl(r+0.4,r+0.4,0.35,0xd6cfbc,{roughness:.95},48); beam2.position.set(cx,8.05,cz); beam2.castShadow=false; world.add(beam2);
  // buitenwand achter de arcade (ring van wandsegmenten met verlichte vensters)
  for(let i=0;i<24;i++){ const a=(i/24)*Math.PI*2;
    const w=box(((r+2.2)*2*Math.PI)/24+0.1,8.2,0.3,0xd3ccb9,{roughness:.95});
    w.position.set(cx+Math.cos(a)*(r+2.2),4.1,cz+Math.sin(a)*(r+2.2)); w.rotation.y=-a+Math.PI/2; w.castShadow=false; world.add(w);
    const win=box(1.0,1.6,0.08,0x6a604a,{emissive:0xffd9a0,emissiveIntensity:.25});
    win.position.set(cx+Math.cos(a)*(r+2.0),5.6,cz+Math.sin(a)*(r+2.0)); win.rotation.y=-a+Math.PI/2; win.castShadow=false; world.add(win);
  }
  // hoge minaretten met balkon en gouden spits
  [[r+4,r+4],[-r-4,r+4],[r+4,-r-4],[-r-4,-r-4]].forEach(p=>{
    const m=cyl(0.55,0.75,14,0xe6e0d0,{roughness:.9}); m.position.set(cx+p[0],7,cz+p[1]); m.castShadow=false; world.add(m);
    const balc=cyl(0.95,0.95,0.35,0xd6cfbc,{roughness:.9},14); balc.position.set(cx+p[0],11.5,cz+p[1]); balc.castShadow=false; world.add(balc);
    const top=cyl(0.4,0.55,2.4,0xe6e0d0,{roughness:.9}); top.position.set(cx+p[0],13.0,cz+p[1]); top.castShadow=false; world.add(top);
    const tip=cyl(0.02,0.45,1.8,0xc9a84c,{emissive:0x6b5012,emissiveIntensity:.5}); tip.position.set(cx+p[0],15.2,cz+p[1]); tip.castShadow=false; world.add(tip);
    const lamp=sph(0.22,0xffe6a0,{emissive:0xffd070,emissiveIntensity:1}); lamp.position.set(cx+p[0],12.2,cz+p[1]); world.add(lamp);
  });
  // schijnwerpermasten
  [[0,r-2],[0,-r+2],[r-2,0],[-r+2,0]].forEach(p=>{
    const fl=new THREER.PointLight(0xfff2d8,0.55,30); fl.position.set(cx+p[0],9,cz+p[1]); world.add(fl);
  });
}
// skyline van Mekka buiten de Haram: klokkentoren + hotels + bergen
function meccaSkyline(cx,cz,r){
  clockTower(cx, cz+r+40);
  hotelTower(cx-r-22, cz+r+18, 8, 22, 0x2a3046);
  hotelTower(cx+r+20, cz+r+14, 9, 26, 0x343a52);
  hotelTower(cx-r-28, cz-8,    7, 18, 0x2e3448);
  hotelTower(cx+r+26, cz-12,   8, 20, 0x262c40);
  mountainRange(Math.max(62,r+46),0x37291f,16);
}
