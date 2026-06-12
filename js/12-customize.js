'use strict';
// ============================================================
//  CHARACTER STATE + CUSTOMIZE — live 3D preview + controls
// ============================================================
const Char={ gender:'male', ihram:false, hair:'full' };
const Custom={ gender:'male', skin:0xc18a5e, eyeColor:0x3a2418, hairStyle:'short', hairColor:0x1a0e08, beard:'none', mouth:'neutral', outfit:'thobe', outfitColor:0xeee6cf, headcover:'none', headcoverColor:0x2a2a3a, build:'normaal', height:'normaal' };

let pv={};
function initPreview(){
  THREER=THREER||window.THREE;
  if(pv.renderer)return;
  const c=el('pv-canvas');
  pv.renderer=new THREER.WebGLRenderer({canvas:c,antialias:true,alpha:true});
  pv.renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  pv.renderer.outputEncoding=THREER.sRGBEncoding;
  pv.renderer.toneMapping=THREER.ACESFilmicToneMapping;
  pv.renderer.toneMappingExposure=1.05;
  pv.scene=new THREER.Scene();
  pv.cam=new THREER.PerspectiveCamera(30,1,0.1,50);
  pv.cam.position.set(0,1.5,-3.9); pv.cam.lookAt(0,1.22,0);
  pv.scene.add(new THREER.AmbientLight(0xffffff,0.9));
  const d=new THREER.DirectionalLight(0xffffff,0.85); d.position.set(-1.5,3,-4); pv.scene.add(d);
  const d2=new THREER.DirectionalLight(0xffd9a0,0.45); d2.position.set(3,2,2); pv.scene.add(d2);
  pv.group=new THREER.Group(); pv.scene.add(pv.group);
  const size=()=>{ pv.renderer.setSize(c.clientWidth,c.clientHeight,false); pv.cam.aspect=(c.clientWidth||1)/(c.clientHeight||1); pv.cam.updateProjectionMatrix(); };
  size(); window.addEventListener('resize',()=>{ if(el('screen-char').classList.contains('active'))size(); });
  setTimeout(size,60);
  (function loop(){ pv.raf=requestAnimationFrame(loop);
    if(!el('screen-char').classList.contains('active'))return;
    if(pv.avatar){
      pv.avatar.rotation.y+=0.012;
      const pa=pv.avatar.userData.parts, tt=performance.now()/1000;
      if(pa){ const br=Math.sin(tt*1.7);
        pa.body.position.y=br*0.012;
        pa.armL.rotation.x=br*0.03; pa.armR.rotation.x=-br*0.03;
        if(pa.elbL){ pa.elbL.rotation.x=0.12+br*0.02; pa.elbR.rotation.x=0.12-br*0.02; }
        if(pa.kneeL){ pa.kneeL.rotation.x=0.04; pa.kneeR.rotation.x=0.04; }
      }
    }
    pv.renderer.render(pv.scene,pv.cam); })();
}
function refreshPreview(){
  THREER=THREER||window.THREE; if(!pv.group)return;
  if(pv.avatar) pv.group.remove(pv.avatar);
  pv.avatar=makeAvatar(Object.assign({},Custom,{ihram:false,shaved:'none'}));
  pv.group.add(pv.avatar);
}
function applyGenderDefaults(g){
  if(g==='female'){
    Custom.hairStyle='long'; Custom.headcover='hijab'; Custom.headcoverColor=0x2a2a3a;
    Custom.outfitColor=0x2a1838; Custom.beard='none';
  } else {
    Custom.hairStyle='short'; Custom.headcover='none'; Custom.outfit='thobe';
    Custom.outfitColor=0xeee6cf;
  }
}
function buildControls(){
  const host=el('pv-controls'); if(!host)return; host.innerHTML='';
  const male=Custom.gender==='male';
  const rows=[
    {key:'gender',label:'Geslacht',type:'opt',opts:[['Man','male'],['Vrouw','female']]},
    {key:'build',label:'Postuur',type:'opt',opts:[['Slank','slank'],['Normaal','normaal'],['Breed','breed']]},
    {key:'height',label:'Lengte',type:'opt',opts:[['Klein','klein'],['Normaal','normaal'],['Lang','lang']]},
    {key:'skin',label:'Huidskleur',type:'sw',opts:[0xf3d6b6,0xf0c9a8,0xd9a77c,0xc18a5e,0x9a6a44,0x6e4a30,0x4e3322]},
    {key:'eyeColor',label:'Kleur ogen',type:'sw',opts:[0x3a2418,0x16110c,0x4a6a3a,0x7a6a3a,0x3a5a7a,0x5a7a8a]},
    {key:'hairStyle',label:'Haar',type:'opt',opts: male?[['Kort','short'],['Middel','medium'],['Krullen','curly'],['Lang','long'],['Kaal','bald']]:[['Kort','short'],['Middel','medium'],['Krullen','curly'],['Lang','long']]},
    {key:'hairColor',label:'Haarkleur',type:'sw',opts:[0x14100c,0x2a1a10,0x4a3420,0x6a4a2a,0x8a6a4a,0xb0a89a,0x6a6a6a]}
  ];
  if(male) rows.push({key:'beard',label:'Gezichtsbeharing',type:'opt',opts:[['Geen','none'],['Stoppels','stubble'],['Kort','short'],['Vol','full']]});
  rows.push({key:'mouth',label:'Mond',type:'opt',opts:[['Neutraal','neutral'],['Glimlach','smile']]});
  if(male){
    rows.push({key:'outfit',label:'Kleding (buiten Ihraam)',type:'opt',opts:[['Thobe','thobe'],['Casual','casual']]});
    rows.push({key:'headcover',label:'Hoofdbedekking (buiten Ihraam)',type:'opt',opts:[['Geen','none'],['Kufi','kufi'],['Ghutra','ghutra']]});
  } else {
    rows.push({key:'headcover',label:'Hoofdbedekking (buiten Ihraam)',type:'opt',opts:[['Geen','none'],['Hijab','hijab']]});
  }
  rows.push({key:'outfitColor',label: male?'Kleur thobe':'Kleur abaya (عباية)',type:'sw',opts:[0xeee6cf,0xf6f3ea,0x2a3a6a,0x2a1838,0x355a4a,0x6a2a3a,0x22222a]});
  if((male && Custom.headcover!=='none') || (!male && Custom.headcover==='hijab'))
    rows.push({key:'headcoverColor',label:'Kleur hoofdbedekking',type:'sw',opts:[0xf2efe6,0x2a2a3a,0x3a2a5a,0x5a3a2a,0x2a4a4a,0x6a2a3a]});

  rows.forEach(r=>{
    const row=document.createElement('div'); row.className='ctrl-row';
    const lab=document.createElement('div'); lab.className='ctrl-label'; lab.textContent=r.label; row.appendChild(lab);
    const opts=document.createElement('div'); opts.className='ctrl-opts';
    if(r.type==='opt'){
      r.opts.forEach(pair=>{ const b=document.createElement('button'); b.className='opt'+(Custom[r.key]===pair[1]?' on':''); b.textContent=pair[0];
        b.onclick=()=>{ Custom[r.key]=pair[1]; if(r.key==='gender'){ Char.gender=pair[1]; applyGenderDefaults(pair[1]); } buildControls(); refreshPreview(); };
        opts.appendChild(b); });
    } else {
      r.opts.forEach(col=>{ const b=document.createElement('button'); b.className='sw'+(Custom[r.key]===col?' on':''); b.style.background='#'+col.toString(16).padStart(6,'0');
        b.onclick=()=>{ Custom[r.key]=col; buildControls(); refreshPreview(); };
        opts.appendChild(b); });
    }
    row.appendChild(opts); host.appendChild(row);
  });
}
