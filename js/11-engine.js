'use strict';
// ============================================================
//  ENGINE — init + render loop
// ============================================================
function initThree(){
  THREER=window.THREE;
  Player.pos=new THREER.Vector3();
  const canvas=el('gl-canvas');
  renderer=new THREER.WebGLRenderer({canvas,antialias:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  renderer.setSize(window.innerWidth,window.innerHeight);
  renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREER.PCFSoftShadowMap;
  // v4: filmische tone mapping + sRGB output → rijkere kleuren, zachtere highlights
  renderer.outputEncoding=THREER.sRGBEncoding;
  renderer.toneMapping=THREER.ACESFilmicToneMapping;
  renderer.toneMappingExposure=0.72;
  scene=new THREER.Scene();
  camera=new THREER.PerspectiveCamera(55,window.innerWidth/window.innerHeight,0.1,400);
  world=new THREER.Group(); scene.add(world);
  ambLight=new THREER.AmbientLight(0x334466,0.6); scene.add(ambLight);
  hemiLight=new THREER.HemisphereLight(0x8899bb,0x4a3a2c,0.3); scene.add(hemiLight);
  dirLight=new THREER.DirectionalLight(0xffffff,0.8); dirLight.position.set(6,12,4);
  dirLight.castShadow=true; dirLight.shadow.mapSize.set(2048,2048);
  dirLight.shadow.camera.near=1; dirLight.shadow.camera.far=60;
  dirLight.shadow.camera.left=-18; dirLight.shadow.camera.right=18;
  dirLight.shadow.camera.top=18; dirLight.shadow.camera.bottom=-18;
  scene.add(dirLight);
  clock=new THREER.Clock();
  window.addEventListener('resize',()=>{ camera.aspect=window.innerWidth/window.innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth,window.innerHeight); });
  animate();
}

function animate(){
  requestAnimationFrame(animate);
  if(!renderer)return;
  const dt=Math.min(clock.getDelta(),0.05);
  if(el('screen-game').classList.contains('active') && Player.obj){
    // movement
    const mv=Input.moveVector();
    let mag=Math.hypot(mv.ix,mv.iz);
    if((Player.simOrbit||Player.simLine) && !paused){
      // automatic ritual simulation
      if(Player.simOrbit){
        Player.simAngle+=Player.simDir*Player.simSpeed*dt;
        Player.x=Math.cos(Player.simAngle)*Player.simR;
        Player.z=Math.sin(Player.simAngle)*Player.simR;
        const tx=-Math.sin(Player.simAngle)*Player.simDir, tz=Math.cos(Player.simAngle)*Player.simDir;
        Player.faceY=Math.atan2(-tx,-tz);
      } else { // simLine (sa'i)
        Player.x+=Player.simDir*Player.simSpeed*dt;
        if(Player.x>6.8){Player.x=6.8;Player.simDir=-1;}
        if(Player.x<-6.8){Player.x=-6.8;Player.simDir=1;}
        Player.z=0; Player.faceY=Player.simDir>0?-Math.PI/2:Math.PI/2;
      }
      Player.moving=true; Player.updateTransform();
      Cam.yaw+=((Player.faceY-Cam.yaw))*Math.min(1,dt*4); // trail behind
      Zone.check();
    } else {
      Player.moving = !paused && !Player.sitting && mag>0.08 && Player.pose!=='dua' && Player.pose!=='salat';
      Player.running = Player.moving && Input.keys.run;            // ⇧ shift = rennen
      if(Player.moving){
        const f=Cam.forward(), r=Cam.right();
        let dx=f.x*mv.iz + r.x*mv.ix;
        let dz=f.z*mv.iz + r.z*mv.ix;
        const dl=Math.hypot(dx,dz)||1; dx/=dl; dz/=dl;
        const sp=Player.speed*Math.min(1,mag)*(Player.running?1.7:1);
        let nx=Math.max(Player.bounds.minX,Math.min(Player.bounds.maxX,Player.x+dx*sp*dt));
        let nz=Math.max(Player.bounds.minZ,Math.min(Player.bounds.maxZ,Player.z+dz*sp*dt));
        if(!blocked(nx,Player.z))Player.x=nx;   // axis-separated sliding
        if(!blocked(Player.x,nz))Player.z=nz;
        const target=Math.atan2(-dx,-dz);
        let diff=target-Player.faceY; while(diff>Math.PI)diff-=Math.PI*2; while(diff<-Math.PI)diff+=Math.PI*2;
        Player.faceY+=diff*Math.min(1,dt*12);
        Player.updateTransform();
        Zone.check();
      }
    }
    Player.animate(dt);
    updateEncounter(dt);
    if(frameHook && !paused)frameHook();
    Cam.update();
    updateLabelPositions();
    // ambient life: orbiting crowd (tawaf), walkers (sai), swaying pilgrims
    world.traverse(o=>{
      const u=o.userData; if(!u)return;
      if(u.orbit){ u.orbit.a+=u.orbit.sp*dt; o.position.x=Math.cos(u.orbit.a)*u.orbit.r; o.position.z=Math.sin(u.orbit.a)*u.orbit.r; o.rotation.y=-u.orbit.a; o.position.y=Math.abs(Math.sin(clock.elapsedTime*4.6+u.orbit.r))*0.05; if(u.arms)u.arms.rotation.x=Math.sin(clock.elapsedTime*4.6+u.orbit.r)*0.35; }
      else if(u.cloud){ o.position.z-=u.cloud.sp*dt; if(o.position.z<-14)o.position.z=14; }
      else if(u.walk){ u.walk.x+=u.walk.dir*u.walk.sp*dt; if(u.walk.x>u.walk.max){u.walk.x=u.walk.max;u.walk.dir=-1;} if(u.walk.x<u.walk.min){u.walk.x=u.walk.min;u.walk.dir=1;} o.rotation.y=u.walk.dir>0?-Math.PI/2:Math.PI/2; o.position.x=u.walk.x; o.position.y=Math.abs(Math.sin(clock.elapsedTime*6+u.walk.ph))*0.07; if(u.arms)u.arms.rotation.x=Math.sin(clock.elapsedTime*6+u.walk.ph)*0.5; }
      else if(u.wander){
        const w=u.wander; const t=clock.elapsedTime;
        if(w.greetCd>0)w.greetCd-=dt;
        const pdx=Player.x-o.position.x, pdz=Player.z-o.position.z, pd=Math.hypot(pdx,pdz);
        if(pd<1.8){ // pause, face the player, greet
          o.rotation.y=Math.atan2(-pdx,-pdz);
          if(w.greetCd<=0){ spawnTextAt('السَّلَامُ عَلَيكُم', o.position.x, 2.3, o.position.z, '#bfe8c0'); Sound.blip(720,0.14,'sine',0.07); w.greetCd=9; }
          if(u.arms)u.arms.rotation.x=Math.sin(t*2)*0.08;
        } else {
          let dx=w.tx-o.position.x, dz=w.tz-o.position.z; const d=Math.hypot(dx,dz);
          if(d<0.25){ if(w.wait>0)w.wait-=dt; else { w.tx=w.area.minX+Math.random()*(w.area.maxX-w.area.minX); w.tz=w.area.minZ+Math.random()*(w.area.maxZ-w.area.minZ); w.wait=0.8+Math.random()*2.5; } }
          else { dx/=d; dz/=d; o.position.x+=dx*w.sp*dt; o.position.z+=dz*w.sp*dt; o.rotation.y=Math.atan2(-dx,-dz);
            o.position.y=Math.abs(Math.sin(t*5.4+w.ph))*0.06; if(u.arms)u.arms.rotation.x=Math.sin(t*5.4+w.ph)*0.45; }
        }
      }
      else if(u.ph!==undefined){ const t=clock.elapsedTime; o.rotation.z=Math.sin(t*1.4+u.ph)*0.06; o.position.y=Math.abs(Math.sin(t*1.1+u.ph))*0.04; if(u.arms)u.arms.rotation.x=Math.sin(t*1.0+u.ph)*0.12; }
    });
    // pillar shake (jamarat)
    if(jamPillar){ if(jamPillarShake>0){ jamPillarShake-=dt; jamPillar.position.x=Math.sin(clock.elapsedTime*40)*jamPillarShake*0.5; } else jamPillar.position.x=0; }
  }
  renderer.render(scene,camera);
}
