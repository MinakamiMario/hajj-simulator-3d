'use strict';
// ============================================================
//  CHARACTER (customizable avatar)
// ============================================================
function makeAvatar(o){
  o=o||{};
  const gender=o.gender||'male';
  const ihram=!!o.ihram;
  const skin=o.skin!==undefined?o.skin:0xc18a5e;
  const eyeC=o.eyeColor!==undefined?o.eyeColor:0x3a2418;
  const hairCol=o.hairColor!==undefined?o.hairColor:0x1a0e08;
  const shaved=o.shaved||'none';
  const white=0xf7f4ec;
  const bw=o.build==='slank'?0.92:(o.build==='breed'?1.12:1);
  const hf=o.height==='klein'?0.94:(o.height==='lang'?1.06:1);
  const g=new THREER.Group(); g.userData.baseScale=hf;
  const parts={};
  const skinM={roughness:.45,metalness:.02};
  const hairM={roughness:.6,metalness:.04};
  const clothM={roughness:.85};
  const shade=(c,k)=>{k=k||0.84;return((((c>>16)&255)*k|0)<<16)|((((c>>8)&255)*k|0)<<8)|((c&255)*k|0);};
  const cloth = (gender==='female')?(o.outfitColor!==undefined?o.outfitColor:0x2a1838):(ihram?white:(o.outfitColor!==undefined?o.outfitColor:0xeee6cf));
  const headY=1.99, hr=0.16;

  // één vloeiend, gedraaid oppervlak — géén losse segmenten of naden
  function lathe(pts,col,opts,seg){
    const geo=new THREER.LatheGeometry(pts.map(q=>new THREER.Vector2(q[0],q[1])),seg||44);
    const m=new THREER.Mesh(geo,mat(col,opts)); m.castShadow=true; m.receiveShadow=true; return m;
  }

  // ===== ROMP + KLEDING (doorlopend profiel van zoom tot hals) =====
  const bodyG=new THREER.Group(); g.add(bodyG); parts.body=bodyG;
  const B=r=>r*bw;
  if(ihram && gender!=='female'){
    // izar (heuptot knie) + blote romp, beide als glad profiel
    bodyG.add(lathe([[0,0.5],[B(0.17),0.5],[B(0.178),0.72],[B(0.158),1.0],[B(0.152),1.2],[0,1.2]],white,{roughness:.92}));
    bodyG.add(lathe([[0,1.19],[B(0.15),1.19],[B(0.158),1.34],[B(0.168),1.47],[B(0.158),1.57],[B(0.112),1.66],[0.066,1.715],[0,1.715]],skin,skinM));
    const rida=box(B(0.3),0.66,B(0.24),white,{roughness:.9}); rida.position.set(B(0.04),1.42,0); rida.rotation.z=0.24; bodyG.add(rida);
    const ridaB=box(B(0.15),0.46,0.06,white,{roughness:.9}); ridaB.position.set(B(-0.1),1.52,0.12); ridaB.rotation.z=-0.34; bodyG.add(ridaB);
  } else if(gender==='female'){
    const c=cloth; // ihraam van de vrouw = haar gewone bedekkende kleding
    bodyG.add(lathe([[0,0.07],[B(0.26),0.07],[B(0.24),0.5],[B(0.178),0.95],[B(0.14),1.2],[B(0.15),1.36],[B(0.158),1.5],[B(0.138),1.6],[B(0.095),1.675],[0.06,1.72],[0,1.72]],c,{roughness:.88}));
  } else if(o.outfit==='casual'){
    bodyG.add(lathe([[0,1.02],[B(0.158),1.02],[B(0.163),1.2],[B(0.168),1.45],[B(0.158),1.56],[B(0.11),1.655],[0.068,1.715],[0,1.715]],cloth,{roughness:.8}));
    const hem2=cyl(B(0.159),B(0.159),0.022,shade(cloth,0.9),clothM,24); hem2.position.y=1.03; bodyG.add(hem2);
    for(let i=0;i<3;i++){ const btn=sph(0.011,0xe9e5db,{},6); btn.position.set(0,1.5-i*0.12,-B(0.168)+0.004); bodyG.add(btn); }
  } else { // thobe
    bodyG.add(lathe([[0,0.1],[B(0.2),0.1],[B(0.193),0.5],[B(0.168),0.92],[B(0.148),1.18],[B(0.155),1.34],[B(0.17),1.48],[B(0.162),1.58],[B(0.113),1.665],[0.07,1.715],[0,1.715]],cloth,{roughness:.85}));
    const plk=box(0.028,0.4,0.008,shade(cloth,0.92)); plk.position.set(0,1.47,-B(0.168)); bodyG.add(plk);
    for(let i=0;i<3;i++){ const btn=sph(0.0105,shade(cloth,0.7),{},6); btn.position.set(0,1.58-i*0.115,-B(0.172)); bodyG.add(btn); }
    const collar=cyl(0.085,0.098,0.07,shade(cloth,0.93),clothM,18); collar.position.y=1.71; bodyG.add(collar);
  }

  // ===== BENEN (onder de kleding; alleen zichtbaar wat hoort) =====
  const pantCol = ihram?skin:(gender==='female'?shade(cloth,0.85):(o.outfit==='casual'?0x32323e:shade(cloth,0.97)));
  function leg(side){
    const lg=new THREER.Group(); lg.position.set(side*0.075,0.95,0);
    const kn=new THREER.Group(); kn.position.y=-0.47; lg.add(kn);              // KNIE-gewricht
    if(ihram){
      const jb=sph(0.06,skin,skinM,10); kn.add(jb);
      const calf=cyl(0.048,0.062,0.36,skin,skinM,14); calf.position.y=-0.2; kn.add(calf);
      const sole=box(0.115,0.03,0.27,0x5a4630); sole.position.set(0,-0.455,0.04); kn.add(sole);
      const foot=sph(0.062,skin,skinM,10); foot.position.set(0,-0.42,0.05); foot.scale.set(.85,.5,1.5); kn.add(foot);
      const strap=box(0.12,0.018,0.045,0x3c2e1e); strap.position.set(0,-0.405,0.09); kn.add(strap);
    } else if(o.outfit==='casual' && gender==='male' && !ihram){
      const thigh=cyl(0.073,0.095,0.46,pantCol,clothM,14); thigh.position.y=-0.235; lg.add(thigh);
      const jb=sph(0.072,pantCol,clothM,10); kn.add(jb);
      const shin=cyl(0.06,0.073,0.4,pantCol,clothM,14); shin.position.y=-0.21; kn.add(shin);
      const shoe=box(0.125,0.075,0.26,0x2a1c14); shoe.position.set(0,-0.445,0.035); kn.add(shoe);
      const toe=sph(0.06,0x2a1c14,{roughness:.55},8); toe.position.set(0,-0.435,0.15); toe.scale.set(.95,.6,1); kn.add(toe);
    } else {
      const shin=cyl(0.04,0.048,0.42,pantCol,clothM,10); shin.position.y=-0.2; kn.add(shin);
      const shoe=box(0.115,0.07,0.24,gender==='female'?0x1c1418:0x2a1c14); shoe.position.set(0,-0.44,0.03); kn.add(shoe);
    }
    lg.userData.knee=kn;
    g.add(lg); return lg;
  }
  parts.legL=leg(1); parts.legR=leg(-1);
  parts.kneeL=parts.legL.userData.knee; parts.kneeR=parts.legR.userData.knee;

  // ===== HALS + HOOFD (schoon: features liggen óp het hoofd) =====
  const neck=cyl(0.054,0.068,0.15,skin,skinM,14); neck.position.y=1.8; bodyG.add(neck);
  const skull=sph(hr,skin,skinM,32); skull.position.y=headY; skull.scale.set(0.96,1.08,1.0); bodyG.add(skull); parts.head=skull;
  const fem=(gender==='female');
  const jaw=sph(fem?0.111:0.118,skin,skinM,24); jaw.position.set(0,headY-(fem?0.078:0.082),-0.006); jaw.scale.set(fem?0.86:0.9,0.8,0.97); bodyG.add(jaw);
  [-1,1].forEach(sd=>{ const ear=sph(0.032,skin,skinM,10); ear.position.set(sd*0.152,headY-0.005,-0.002); ear.scale.set(0.5,0.95,0.8); bodyG.add(ear); });
  // ogen
  [-0.056,0.056].forEach(ex=>{
    const eyeW=sph(fem?0.028:0.025,0xf6f3ec,{roughness:.25},12); eyeW.position.set(ex,headY+0.01,-0.142); eyeW.scale.set(1,fem?0.8:0.75,0.3); bodyG.add(eyeW);
    if(fem){ const lash=box(0.056,0.009,0.008,0x14100c); lash.position.set(ex,headY+0.034,-0.151); bodyG.add(lash); }
    const iris=sph(0.0138,eyeC,{roughness:.2},10); iris.position.set(ex,headY+0.009,-0.152); bodyG.add(iris);
    const pupil=sph(0.0072,0x070707,{roughness:.15},8); pupil.position.set(ex,headY+0.009,-0.159); bodyG.add(pupil);
    const glint=sph(0.0032,0xffffff,{emissive:0xffffff,emissiveIntensity:.7},6); glint.position.set(ex+0.006,headY+0.015,-0.161); bodyG.add(glint);
    const eb=box(0.052,fem?0.008:0.011,0.01,hairCol,hairM); eb.position.set(ex,headY+0.058,-0.149); eb.rotation.z=(ex<0?-1:1)*0.1; bodyG.add(eb);
  });
  // neus: één zachte vorm
  const nose=sph(0.019,skin,skinM,12); nose.position.set(0,headY-0.026,-0.155); nose.scale.set(0.72,1.25,0.95); bodyG.add(nose);
  // lippen: dun, plat op het gezicht
  const lipC=fem?0xb06060:0x9a5a52;
  const lipTop=box(fem?0.052:0.05,fem?0.011:0.009,0.008,shade(lipC,0.85)); lipTop.position.set(0,headY-0.082,-0.152); bodyG.add(lipTop);
  const lipBot=box(fem?0.046:0.044,fem?0.012:0.009,0.008,lipC); lipBot.position.set(0,headY-0.093,-0.151); bodyG.add(lipBot);
  if((o.mouth||'neutral')==='smile'){ [-1,1].forEach(sd=>{ const cn=box(0.014,0.014,0.008,shade(lipC,0.85)); cn.position.set(sd*0.036,headY-0.079,-0.149); bodyG.add(cn); }); }

  // ===== HOOFDBEDEKKING =====
  let covered=false;
  if(gender==='female' && (ihram || o.headcover!=='none')){
    const hc=(o.headcoverColor!==undefined?o.headcoverColor:0x2a2a3a);
    // schil zit ACHTER het gezichtsvlak: kruin/achterhoofd/zijkanten bedekt, gezicht volledig open
    const shell=sph(hr+0.038,hc,{roughness:1},24); shell.position.set(0,headY+0.012,0.072); shell.scale.set(1.07,1.12,1.0); bodyG.add(shell);
    // voorhoofdband net boven de wenkbrauwen
    const band=sph(hr*0.95,hc,{roughness:1},20); band.position.set(0,headY+0.108,-0.018); band.scale.set(1.06,0.32,0.92); bodyG.add(band);
    // zijwangen: omlijsting links/rechts van het gezicht
    [-1,1].forEach(sd=>{ const cheekW=box(0.05,0.2,0.1,hc,{roughness:1}); cheekW.position.set(sd*0.138,headY-0.04,-0.066); cheekW.rotation.y=sd*0.18; bodyG.add(cheekW); });
    // kinwikkel onder de kaak
    const chinW=box(0.16,0.055,0.09,hc,{roughness:1}); chinW.position.set(0,headY-0.178,-0.052); bodyG.add(chinW);
    // valt over schouders en borst
    const drape=lathe([[0.1,headY-0.62],[0.21,headY-0.62],[0.16,headY-0.3],[0.115,headY-0.13]],hc,{roughness:1},20); bodyG.add(drape);
    covered=true;
  } else if(!ihram && gender==='male' && o.headcover==='kufi'){
    const kc=o.headcoverColor!==undefined?o.headcoverColor:0xf2efe6;
    const dome2=sph(hr*1.01,kc,{roughness:.95},24); dome2.position.set(0,headY+0.085,0.008); dome2.scale.set(1.0,0.52,1.0); bodyG.add(dome2);
    const ring=cyl(hr*1.0,hr*1.02,0.055,shade(kc,0.94),{roughness:.95},24); ring.position.set(0,headY+0.068,0.008); bodyG.add(ring);
  } else if(!ihram && gender==='male' && o.headcover==='ghutra'){
    const gc=o.headcoverColor!==undefined?o.headcoverColor:0xf8f6f0;
    const dome3=sph(hr+0.032,gc,{roughness:1},24); dome3.position.set(0,headY+0.028,0.015); dome3.scale.set(1.1,1.0,1.14); bodyG.add(dome3);
    [-1,1].forEach(sd=>{ const fall=box(0.12,0.46,0.12,gc,{roughness:1}); fall.position.set(sd*0.17,headY-0.27,0.03); fall.rotation.z=sd*0.05; bodyG.add(fall); });
    const back=box(0.3,0.42,0.13,gc,{roughness:1}); back.position.set(0,headY-0.21,0.115); bodyG.add(back);
    const agal1=cyl(hr*1.08,hr*1.08,0.026,0x141414,{roughness:.4},22); agal1.position.set(0,headY+0.125,0.01); bodyG.add(agal1);
    const agal2=cyl(hr*1.06,hr*1.06,0.026,0x141414,{roughness:.4},22); agal2.position.set(0,headY+0.097,0.01); bodyG.add(agal2);
    covered=true;
  }

  // ===== HAAR (rond gevormd; altijd boven de wenkbrauwen) =====
  if(!covered && shaved!=='bald'){
    let style=(shaved==='short')?'short':(o.hairStyle||'short');
    if(style!=='bald'){
      const dome=sph(hr+0.011,hairCol,hairM,28); dome.position.set(0,headY+0.05,0.03); dome.scale.set(1.02,style==='short'?0.88:0.97,1.02); bodyG.add(dome);
      const fringe=sph(hr*0.98,hairCol,hairM,24); fringe.position.set(0,headY+0.125,-0.052); fringe.scale.set(0.95,0.34,0.62); bodyG.add(fringe);
      [-1,1].forEach(sd=>{ const tmp=sph(0.046,hairCol,hairM,12); tmp.position.set(sd*0.147,headY+0.03,0.012); tmp.scale.set(0.48,0.95,0.95); bodyG.add(tmp); });
      if(style==='curly'){
        for(let i=0;i<8;i++){ const a=(i/8)*Math.PI*2; const c2=sph(0.046,hairCol,hairM,8);
          c2.position.set(Math.cos(a)*0.105,headY+0.105+((i%3)-1)*0.018,0.03+Math.sin(a)*0.105); bodyG.add(c2); }
      }
      if(style==='medium'||style==='long'){
        const backM=sph(0.13,hairCol,hairM,16); backM.position.set(0,headY-0.02,0.105); backM.scale.set(1.15,0.95,0.7); bodyG.add(backM);
      }
      if(style==='long'){
        const fall2=lathe([[0.06,headY-0.52],[0.15,headY-0.52],[0.17,headY-0.25],[0.13,headY+0.02]],hairCol,hairM,18); fall2.position.z=0.06; bodyG.add(fall2);
      }
    }
  }

  // ===== BAARD (één zachte massa rond de kaak; lippen blijven zichtbaar) =====
  if(gender==='male' && o.beard && o.beard!=='none'){
    const full=o.beard==='full';
    if(o.beard==='stubble'){
      const st=sph(0.122,hairCol,hairM,18); st.position.set(0,headY-0.1,-0.018); st.scale.set(0.95,0.72,0.95);
      st.material.transparent=true; st.material.opacity=0.35; bodyG.add(st);
    } else {
      const bd=sph(full?0.132:0.124,hairCol,hairM,20); bd.position.set(0,headY-(full?0.118:0.108),-0.016);
      bd.scale.set(full?1.0:0.94,full?0.85:0.68,0.97); bodyG.add(bd);
      if(full){ const chinB=sph(0.055,hairCol,hairM,12); chinB.position.set(0,headY-0.215,-0.075); chinB.scale.set(1.1,1.2,0.9); bodyG.add(chinB); }
      const mst=box(0.05,0.013,0.01,hairCol,hairM); mst.position.set(0,headY-0.078,-0.152); bodyG.add(mst);
    }
  }

  // ===== ARMEN (één vloeiende taps toelopende mouw, hand met duim) =====
  function arm(side){
    const ag=new THREER.Group(); ag.position.set(side*B(0.155),1.63,0);
    const capCol=ihram?skin:cloth;
    const cap=sph(0.052,capCol,ihram?skinM:clothM,12); cap.position.y=0.012; ag.add(cap); // ronde schouderkap
    const inner=new THREER.Group(); inner.rotation.z=side*0.13; ag.add(inner); // lichte spreiding
    const isCas=(!ihram&&gender==='male'&&o.outfit==='casual');
    const el=new THREER.Group(); el.position.y=-0.3; inner.add(el);            // ELLEBOOG-gewricht
    if(ihram){
      const up=cyl(0.044,0.052,0.3,skin,skinM,14); up.position.y=-0.15; inner.add(up);
      const jb=sph(0.044,skin,skinM,10); el.add(jb);
      const fo=cyl(0.036,0.044,0.26,skin,skinM,14); fo.position.y=-0.13; el.add(fo);
    } else if(isCas){
      const up=cyl(0.05,0.057,0.3,cloth,clothM,14); up.position.y=-0.15; inner.add(up);
      const jb=sph(0.044,skin,skinM,10); el.add(jb);
      const fo=cyl(0.035,0.044,0.26,skin,skinM,14); fo.position.y=-0.13; el.add(fo);
    } else {
      const up=cyl(0.047,0.058,0.3,cloth,clothM,14); up.position.y=-0.15; inner.add(up);
      const jb=sph(0.047,cloth,clothM,10); el.add(jb);
      const fo=cyl(0.04,0.047,0.26,cloth,clothM,14); fo.position.y=-0.13; el.add(fo);
      const cuff=cyl(0.041,0.041,0.035,shade(cloth,0.9),clothM,12); cuff.position.y=-0.275; el.add(cuff);
    }
    const palm=sph(0.047,skin,skinM,10); palm.position.y=-0.335; palm.scale.set(0.8,1.12,0.58); el.add(palm);
    const thumb=sph(0.017,skin,skinM,6); thumb.position.set(-side*0.036,-0.318,-0.01); el.add(thumb);
    ag.userData.elbow=el;
    bodyG.add(ag); return ag;
  }
  parts.armL=arm(1); parts.armR=arm(-1);
  parts.elbL=parts.armL.userData.elbow; parts.elbR=parts.armR.userData.elbow;

  g.userData.parts=parts; g.userData.gender=gender; g.userData.ihram=ihram;
  return g;
}
