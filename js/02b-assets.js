'use strict';
// ============================================================
//  ASSETS — GLTF-modellen met cache en procedurele fallback
//  Modellen worden gegenereerd door tools/make_assets.py
// ============================================================
const Assets = {
  defs: {
    palm:    'assets/models/palm.glb',
    acacia:  'assets/models/acacia.glb',
    parasol: 'assets/models/parasol.glb',
    kaaba:   'assets/models/kaaba.glb',
    dome_nabawi: 'assets/models/dome_nabawi.glb',
    arch_haram:  'assets/models/arch_haram.glb',
    rock1:   'assets/models/rock1.glb',
    rock2:   'assets/models/rock2.glb',
    rock3:   'assets/models/rock3.glb',
    nabawi_interior: 'assets/models/nabawi_interior.glb',
    minaret: 'assets/models/minaret.glb',
    quba:    'assets/models/quba_mosque.glb',
    tent:    'assets/models/tent.glb',
    lantern: 'assets/models/lantern.glb',
    // fotorealistische, gedownloade + geoptimaliseerde modellen (Draco)
    haram:      'assets/models/haram.glb',
    clocktower: 'assets/models/clocktower.glb',
    mina:       'assets/models/mina.glb',
    appartement:'assets/models/appartement.glb',
    airplane:   'assets/models/airplane.glb',
    prayer:     'assets/models/prayer.glb',   // geanimeerde biddende pelgrim op gebedskleed (skinned + salah-clip)
    // kant-en-klare, gerigde personages (skinned GLB → animeren via botten in 04-player.js)
    preset_woman:'assets/models/rigged/woman_rigged.glb',
    preset_man:  'assets/models/rigged/man_rigged.glb',
  },
  cache: {}, failed: {}, started: false,
  preload(){
    if(this.started) return; this.started = true;
    if(!window.THREE || !THREE.GLTFLoader){
      console.warn('GLTFLoader niet beschikbaar — procedurele fallback blijft actief');
      return;
    }
    const loader = new THREE.GLTFLoader();
    if(THREE.DRACOLoader){                                  // Draco-modellen (gecomprimeerd) — lokale decoder (offline)
      const draco = new THREE.DRACOLoader();
      draco.setDecoderPath('assets/draco/');
      draco.setDecoderConfig({type:'wasm'});
      loader.setDRACOLoader(draco);
    }
    this._loader = loader;
    for(const key in this.defs){
      if(key.indexOf('preset_')===0) continue;             // presets lui laden (groot + alleen bij keuze nodig)
      loader.load(this.defs[key], g => {
        g.scene.traverse(o => { if(o.isMesh){ o.castShadow = false; o.receiveShadow = false;
          // verwijder null-attributen (bv. lege uv) — die laten renderer.render crashen in three r128
          if(o.geometry && o.geometry.attributes){ for(const a in o.geometry.attributes){ if(!o.geometry.attributes[a]) delete o.geometry.attributes[a]; } }
        }});
        if(g.animations && g.animations.length) g.scene.userData.clips = g.animations;   // bewaar animatie-clips (bv. gebed)
        this.cache[key] = g.scene;
      }, undefined, () => { this.failed[key]=true; console.warn('Asset laden mislukt:', key); });
    }
  },
  // gerigd preset-personage los inladen (buiten de massale preload → geen race op de grote bestanden)
  loadPreset(preset, cb){
    const key = preset==='man' ? 'preset_man' : 'preset_woman';
    if(this.cache[key]){ if(cb) cb(this.cache[key]); return; }
    this._loadingPreset = this._loadingPreset || {};
    if(this._loadingPreset[key]){ return; }                 // al bezig
    this._loadingPreset[key] = true;
    if(!window.THREE || !THREE.GLTFLoader){ return; }
    const loader = this._loader || new THREE.GLTFLoader();
    if(!this._loader && THREE.DRACOLoader){ const dr=new THREE.DRACOLoader(); dr.setDecoderPath('assets/draco/'); dr.setDecoderConfig({type:'wasm'}); loader.setDRACOLoader(dr); }
    loader.load(this.defs[key], g => {
      g.scene.traverse(o => { if(o.isSkinnedMesh){ o.frustumCulled=false; o.castShadow=false; o.receiveShadow=false; }
        if(o.isMesh && o.geometry && o.geometry.attributes){ for(const a in o.geometry.attributes){ if(!o.geometry.attributes[a]) delete o.geometry.attributes[a]; } } });
      this.cache[key] = g.scene; this._loadingPreset[key]=false; if(cb) cb(g.scene);
    }, undefined, () => { this._loadingPreset[key]=false; console.warn('preset laden mislukt:', key); });
  },
  ready(key){ return !!this.cache[key]; },
  // plaats een kloon in de wereld; null als het model (nog) niet geladen is
  spawn(key, x, z, s, ry, y){
    const src = this.cache[key]; if(!src) return null;
    const m = src.clone(true);
    m.position.set(x, y || 0, z);
    if(s) m.scale.setScalar(s);
    m.rotation.y = (ry !== undefined) ? ry : Math.random() * Math.PI * 2;
    world.add(m); return m;
  },
  // Haram-model met de Ka'ba op (kx,0,kz); zakt de Ka'ba-voet naar y≈0.8 (op de mataf)
  placeHaram(kx, kz, s){
    s = s || 6.5;
    const src = this.cache.haram; if(!src) return null;
    const m = src.clone(true); m.scale.setScalar(s);
    m.position.set(kx + 0.5 * s, 0, kz - 23.3 * s);        // Ka'ba-mesh (keswa) ligt op local (-0.5, 23.3)
    world.add(m); m.updateMatrixWorld(true);
    let minY = Infinity;
    m.traverse(o => { if(o.isMesh && o.name.indexOf('keswa') >= 0){ const b = new THREE.Box3().setFromObject(o); if(b.min.y < minY) minY = b.min.y; } });
    if(isFinite(minY)){ m.position.y += (0.8 - minY); m.updateMatrixWorld(true); }
    return m;
  },
  // appartement-interieur: vloer op y=0; (ox,oz) verschuift het hele model, ry roteert
  // native room-coords (schaal 1): master-bed (-2.5,-1.3) · 2e bed (-1.8,-5.0) · bank (-6,3) · eethoek (-3,2.7) · keuken (-0.7,0.4) · bad (-5.5,-2)
  placeApartment(ox, oz, s, ry){
    const src = this.cache.appartement; if(!src) return null;
    const m = src.clone(true); m.scale.setScalar(s || 1);
    // materialen per instance klonen (clone(true) deelt ze met de cache) → tint/fade lekt niet tussen scènes
    m.traverse(o=>{ if(o.isMesh && o.material){ o.material = Array.isArray(o.material) ? o.material.map(x=>x.clone()) : o.material.clone(); } });
    if(ry !== undefined) m.rotation.y = ry;
    m.position.set(ox || 0, 0, oz || 0); world.add(m); m.updateMatrixWorld(true);
    const b = new THREE.Box3().setFromObject(m); m.position.y -= b.min.y; m.updateMatrixWorld(true);
    return m;
  },
  // dim de unlit/baked materialen van een model (nacht): factor 0..1 op de basiskleur
  tint(model, factor){
    if(!model) return;
    model.traverse(o => { if(o.isMesh && o.material){
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach(mat => { if(!mat.userData.__origColor && mat.color) mat.userData.__origColor = mat.color.clone();
        if(mat.userData.__origColor) mat.color.copy(mat.userData.__origColor).multiplyScalar(factor); }); }});
  },
  // vliegtuig-cabine (airplane_interior): gangpad langs Z op x=0, cabinevloer op y=0 (romp eronder verborgen)
  placeCabin(s){
    const src = this.cache.airplane; if(!src) return null;
    const m = src.clone(true); s = s || 0.85; m.scale.setScalar(s); m.rotation.y = Math.PI/2;   // lange as → Z (gangpad)
    m.traverse(o=>{ if(o.isMesh){ o.castShadow=false; o.receiveShadow=false;
      if(o.material) o.material = Array.isArray(o.material) ? o.material.map(x=>x.clone()) : o.material.clone(); } });  // eigen materialen → fade lekt niet
    world.add(m); m.updateMatrixWorld(true);
    let b = new THREE.Box3().setFromObject(m); m.position.y -= b.min.y; m.updateMatrixWorld(true);
    b = new THREE.Box3().setFromObject(m); const cx=(b.min.x+b.max.x)/2, cz=(b.min.z+b.max.z)/2;
    // cabinevloer = de LAAGSTE omlaag-hit recht onder 't gangpad (geen vracht onder 't gangpad gemodelleerd);
    // de 2e hit pakt bij dit model een plafond/bagagebak → cabine zakt onder de grond, vandaar 't laagste punt
    const ray = new THREE.Raycaster(); let floorY=null;
    [cz-8, cz, cz+8].forEach(zz=>{ ray.set(new THREE.Vector3(cx, b.max.y+1, zz), new THREE.Vector3(0,-1,0)); ray.far = b.max.y+3;
      const h = ray.intersectObject(m,true); if(h.length){ const y=h[h.length-1].point.y; if(floorY===null || y>floorY) floorY=y; } });  // hoogste vloer-kandidaat (vermijdt romp/buik-uitschieters)
    if(floorY===null) floorY=0;
    m.position.y -= floorY; m.position.x -= cx;        // vloer→y0, gangpad→x0
    m.updateMatrixWorld(true); return m;
  },
  // shaders van een (zwaar) model alvast compileren zodat de eerste render in z'n scène niet hapert
  prewarm(key){
    const src = this.cache[key]; if(!src) return;
    if(!this._warm) this._warm = {}; if(this._warm[key]) return;
    if(typeof renderer==='undefined' || !renderer || typeof scene==='undefined' || !scene || typeof camera==='undefined' || !camera) return;
    this._warm[key] = true;
    const m = src.clone(true); scene.add(m);
    try{ renderer.compile(scene, camera); }catch(e){}
    scene.remove(m);
  },
  // willekeurig model: XZ-gecentreerd op (x,z), onderkant op de grond (y=0)
  placeProp(key, x, z, s, ry){
    const src = this.cache[key]; if(!src) return null;
    const m = src.clone(true); m.scale.setScalar(s || 1);
    if(ry !== undefined) m.rotation.y = ry;
    world.add(m); m.updateMatrixWorld(true);
    const b = new THREE.Box3().setFromObject(m), c = b.getCenter(new THREE.Vector3());
    m.position.x += x - c.x; m.position.z += z - c.z; m.position.y -= b.min.y;
    m.updateMatrixWorld(true); return m;
  },
  // ---- biddende pelgrim (skinned mesh + salah-animatie) ----
  // diep-clone die ELKE instance een eigen skelet geeft (gewone clone deelt 't skelet → alle kopieën vervormen samen/kapot)
  _cloneSkinned(src){
    const map = new Map();
    const clone = src.clone(true);
    (function par(a, b){ map.set(a, b); for(let i=0;i<a.children.length;i++) par(a.children[i], b.children[i]); })(src, clone);
    src.traverse(o => { if(o.isSkinnedMesh){ const cm = map.get(o), sk = o.skeleton;
      const bones = sk.bones.map(bn => map.get(bn)); cm.bind(new THREE.Skeleton(bones, sk.boneInverses), cm.matrixWorld); } });
    return clone;
  },
  // de bron-mocap heeft een kapot stuk (~3.5-4.2s) waar een BEEN wegklapt, terwijl 't bovenlichaam dáár
  // wél een echte beweging doet. Fix: bevries ALLEEN de been-botten in dat venster op hun pose net ervóór
  // (de benen staan toch stil) → been-glitch weg, lichaamsbeweging blijft. Eénmalig op de gedeelde clip.
  _fixPrayerGlitch(clip){
    if(!clip || clip.__fixed) return; clip.__fixed = true;
    const A = 3.1, B = 4.9;   // kapot segment (~3.3-4.7s, heel skelet klapt weg) → BRUG alle botten erover
    const qa = new THREE.Quaternion(), qb = new THREE.Quaternion(), qo = new THREE.Quaternion();
    clip.tracks.forEach(tr => {
      const vs = tr.getValueSize(), T = tr.times, V = tr.values, n = T.length;
      let i0 = -1, i1 = -1;
      for(let i = 0; i < n; i++){ if(T[i] < A) i0 = i; }            // laatste schone keyframe vóór A
      for(let i = 0; i < n; i++){ if(T[i] > B){ i1 = i; break; } }  // eerste schone keyframe ná B
      if(i0 < 0 || i1 < 0) return;
      const span = (T[i1] - T[i0]) || 1;
      for(let i = i0 + 1; i < i1; i++){
        const f = (T[i] - T[i0]) / span;
        if(vs === 4){
          qa.set(V[i0*vs],V[i0*vs+1],V[i0*vs+2],V[i0*vs+3]); qb.set(V[i1*vs],V[i1*vs+1],V[i1*vs+2],V[i1*vs+3]);
          qo.copy(qa).slerp(qb, f); V[i*vs]=qo.x; V[i*vs+1]=qo.y; V[i*vs+2]=qo.z; V[i*vs+3]=qo.w;
        } else {
          for(let k = 0; k < vs; k++) V[i*vs+k] = V[i0*vs+k] * (1 - f) + V[i1*vs+k] * f;
        }
      }
    });
  },
  // zet een biddende pelgrim op (x,z), gedraaid ry, en speel de salah-animatie (mixer → userData.prayMixer, geüpdatet in de engine-loop)
  spawnPrayer(x, z, ry, s){
    const src = this.cache.prayer; if(!src) return null;
    const clips = src.userData && src.userData.clips; if(!clips || !clips.length) return null;
    const m = this._cloneSkinned(src);
    m.scale.setScalar((s || 1) * 0.77);   // 't model staat ~2.2m → normaliseer naar ~1.7m (pelgrim-formaat)
    m.rotation.y = (ry === undefined ? 0 : ry) + Math.PI;   // 't model kijkt standaard +Z → +PI zodat ry de speler-conventie volgt (ry=0 → -Z, atan2(px,pz) → naar (0,0))
    m.traverse(o => { if(o.isMesh){ o.castShadow = false; o.receiveShadow = false; o.frustumCulled = false; } });  // skinned-bbox klopt niet altijd → niet cullen
    m.position.set(x, 0, z); world.add(m); m.updateMatrixWorld(true);
    const b = new THREE.Box3().setFromObject(m); if(isFinite(b.min.y)) m.position.y = -b.min.y;   // gebedskleed op de grond
    m.updateMatrixWorld(true);
    const body = clips.reduce((a, c) => c.tracks.length > a.tracks.length ? c : a, clips[0]);     // body-clip = meeste tracks (niet de gezicht-morph)
    this._fixPrayerGlitch(body);
    const mixer = new THREE.AnimationMixer(m); mixer.clipAction(body).play();
    mixer.setTime(Math.random() * body.duration);                                                 // willekeurige fase → niet synchroon
    m.userData.prayMixer = mixer;
    return m;
  }
};
