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
  },
  cache: {}, started: false,
  preload(){
    if(this.started) return; this.started = true;
    if(!window.THREE || !THREE.GLTFLoader){
      console.warn('GLTFLoader niet beschikbaar — procedurele fallback blijft actief');
      return;
    }
    const loader = new THREE.GLTFLoader();
    for(const key in this.defs){
      loader.load(this.defs[key], g => {
        g.scene.traverse(o => { if(o.isMesh){ o.castShadow = false; o.receiveShadow = false; } });
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
  }
};
