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
  },
  cache: {}, started: false,
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
    for(const key in this.defs){
      loader.load(this.defs[key], g => {
        g.scene.traverse(o => { if(o.isMesh){ o.castShadow = false; o.receiveShadow = false;
          // verwijder null-attributen (bv. lege uv) — die laten renderer.render crashen in three r128
          if(o.geometry && o.geometry.attributes){ for(const a in o.geometry.attributes){ if(!o.geometry.attributes[a]) delete o.geometry.attributes[a]; } }
        }});
        this.cache[key] = g.scene;
      }, undefined, () => console.warn('Asset laden mislukt (fallback actief):', key));
    }
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
    // cabinevloer = 2e omlaag-hit in 't gangpad (1e = plafond)
    const ray = new THREE.Raycaster(); ray.set(new THREE.Vector3(cx, b.max.y+0.5, cz), new THREE.Vector3(0,-1,0)); ray.far = b.max.y+2;
    const hits = ray.intersectObject(m,true);
    const floorY = hits.length>1 ? hits[1].point.y : (hits[0] ? hits[0].point.y : 0);
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
  }
};
