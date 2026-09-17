(() => {
'use strict';

if (!window.THREE || !THREE.WebGLRenderer) return;

const DEG = Math.PI / 180;
const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
const lerp = (a,b,t) => a+(b-a)*t;

// Deliberately slow educational playback. A real idling V8 at ~900 RPM is too
// fast to study visually; the mechanics below run in slow motion instead.
const DEMO_RPM = 12;
const FIRING_ORDER = [1,8,4,3,6,5,7,2];
const THROW_PHASES = [0,90,180,270].map(v => v * DEG);
const SYSTEM_NAMES = [
  'Engine Block','Cylinder Heads','Pistons & Rods','Crankshaft','Valvetrain',
  'Intake System','Fuel System','Ignition','Exhaust Headers','Cooling System',
  'Lubrication','Timing Drive','Accessories','Flywheel'
];

const state = {
  scene:null,
  initialized:false,
  lastTime:performance.now(),
  rpm:0,
  cycle:0,
  crankRotor:null,
  flywheelRotor:null,
  camRotor:null,
  timingCrank:null,
  timingCam:null,
  pistonUnits:[],
  valveUnits:[],
  sparkUnits:[],
  labelBindings:[],
  labelsBound:false
};

function findNamed(scene,name){
  let hit=null;
  scene.traverse(o=>{ if(!hit && o.name===name) hit=o; });
  return hit;
}

function recenterRotor(group,pivotY,childShiftY){
  if(!group || group.userData.v8PivotFixed) return;
  group.children.forEach(child=>{ child.position.y += childShiftY; });
  group.position.y = pivotY;
  group.userData.v8PivotFixed = true;
}

function rephaseCrankThrows(group){
  if(!group || group.userData.v8ThrowsRephased) return;
  const throws = group.children
    .filter(o => {
      if(!o.isMesh || o.geometry?.type !== 'CylinderGeometry') return false;
      const p=o.geometry.parameters || {};
      return Math.abs((p.radiusTop ?? 0)-0.18)<0.025 && Math.abs((p.height ?? 0)-0.48)<0.06;
    })
    .sort((a,b)=>a.position.z-b.position.z);

  if(throws.length>=4){
    throws.slice(0,4).forEach((mesh,idx)=>{
      const a=THROW_PHASES[idx];
      mesh.position.x=0.34*Math.cos(a);
      mesh.position.y=0.34*Math.sin(a);
    });
  }
  group.userData.v8ThrowsRephased=true;
}

function valveLift(cycle,start,span){
  const rel=(cycle-start+720)%720;
  if(rel>=span) return 0;
  const s=Math.sin(Math.PI*(rel/span));
  return s*s;
}

function bindTrackingLabels(scene){
  const systems={};
  scene.traverse(o=>{ if(SYSTEM_NAMES.includes(o.name)) systems[o.name]=o; });

  const labels=[];
  scene.traverse(o=>{
    if(o.element?.classList?.contains('engine-label')) labels.push(o);
  });

  state.labelBindings=[];
  labels.forEach(label=>{
    const target=systems[label.userData.system];
    if(!target) return;

    // Keep the label's current world-space anchor, then make it a child of the
    // real system group. CSS2DRenderer will now continuously project that
    // anchor while the user rotates, zooms, pans or explodes the engine.
    scene.updateMatrixWorld(true);
    if(label.parent!==target) target.attach(label);

    label.userData.trackingTarget=target.name;
    label.userData.v8Tracking=true;
    if(label.element){
      label.element.dataset.tracking='true';
      label.element.style.willChange='transform';
    }
    state.labelBindings.push({label,target});
  });

  state.labelsBound = state.labelBindings.length === labels.length && labels.length>0;
}

function keepLabelsBound(){
  let valid=state.labelBindings.length>0;
  for(const b of state.labelBindings){
    if(!b.label || !b.target || b.label.parent!==b.target){ valid=false; break; }
  }
  if(!valid) bindTrackingLabels(state.scene);
}

function initMainScene(scene){
  const crankSystem=findNamed(scene,'Crankshaft');
  const pistonSystem=findNamed(scene,'Pistons & Rods');
  const flywheelSystem=findNamed(scene,'Flywheel');
  const valveSystem=findNamed(scene,'Valvetrain');
  const timingSystem=findNamed(scene,'Timing Drive');
  const ignitionSystem=findNamed(scene,'Ignition');
  if(!crankSystem || !pistonSystem || !flywheelSystem || !valveSystem) return false;

  state.scene=scene;
  state.crankRotor=crankSystem.children.find(o=>o.isGroup) || null;
  state.flywheelRotor=flywheelSystem.children.find(o=>o.isGroup) || null;
  state.camRotor=valveSystem.children.find(o=>o.isGroup) || null;

  // Rotate each shaft about its own physical centreline instead of orbiting
  // the whole shaft around the scene origin.
  recenterRotor(state.crankRotor,-0.72,+0.72);
  recenterRotor(state.flywheelRotor,-0.72,+0.72);
  recenterRotor(state.camRotor,+0.32,-0.32);
  rephaseCrankThrows(state.crankRotor);

  if(timingSystem){
    const discs=timingSystem.children.filter(o=>o.isMesh && o.geometry?.type==='CylinderGeometry');
    state.timingCrank=discs[0] || null;
    state.timingCam=discs[1] || null;
  }

  const pistonBanks=pistonSystem.children.filter(o=>o.isGroup && Math.abs(o.rotation.z)>0.5);
  pistonBanks.forEach(bank=>{
    const sign=Math.sign(bank.rotation.z)||1;
    for(let idx=0;idx<4;idx++){
      const base=idx*4;
      const piston=bank.children[base];
      const pin=bank.children[base+1];
      const rod=bank.children[base+2];
      const cap=bank.children[base+3];
      if(!piston||!pin||!rod||!cap) continue;
      state.pistonUnits.push({
        bank,sign,idx,z:[-2.25,-0.75,0.75,2.25][idx],piston,pin,rod,cap,
        rodBaseLength:rod.geometry?.parameters?.height || 1.22
      });
    }
  });

  const valveBanks=valveSystem.children.filter(o=>o.isGroup && o!==state.camRotor && Math.abs(o.rotation.z)>0.5);
  valveBanks.forEach(bank=>{
    const sign=Math.sign(bank.rotation.z)||1;
    for(let idx=0;idx<4;idx++){
      const base=idx*6;
      const intakeRocker=bank.children[base+2];
      const exhaustRocker=bank.children[base+3];
      const intakeValve=bank.children[base+4];
      const exhaustValve=bank.children[base+5];
      if(!intakeValve?.isGroup || !exhaustValve?.isGroup) continue;
      const cyl=sign<0?idx+1:idx+5;
      const firingIndex=FIRING_ORDER.indexOf(cyl);
      state.valveUnits.push({
        offset:(720-firingIndex*90)%720,
        intakeValve,exhaustValve,intakeRocker,exhaustRocker,
        intakeRockerBase:intakeRocker?.rotation?.z||0,
        exhaustRockerBase:exhaustRocker?.rotation?.z||0
      });
    }
  });

  if(ignitionSystem){
    ignitionSystem.children.filter(o=>o.isGroup && Math.abs(o.rotation.z)>0.5).forEach(bank=>{
      const sign=Math.sign(bank.rotation.z)||1;
      bank.children.filter(o=>o.isGroup).forEach((plug,idx)=>{
        const tip=plug.children.find(o=>o.isMesh && o.material && 'emissiveIntensity' in o.material);
        if(!tip) return;
        const cyl=sign<0?idx+1:idx+5;
        const firingIndex=FIRING_ORDER.indexOf(cyl);
        state.sparkUnits.push({tip,offset:(720-firingIndex*90)%720});
      });
    });
  }

  bindTrackingLabels(scene);
  state.lastTime=performance.now();
  state.initialized=true;
  return true;
}

function updateMainScene(){
  const now=performance.now();
  const dt=Math.min(0.04,Math.max(0,(now-state.lastTime)/1000));
  state.lastTime=now;

  const runButton=document.getElementById('toggleRun');
  const running=!!runButton && /Running/i.test(runButton.textContent||'');
  const target=running?DEMO_RPM:0;

  // Soft acceleration/deceleration avoids the abrupt, mechanical-looking snap
  // that made the previous motion difficult to read.
  state.rpm=lerp(state.rpm,target,1-Math.exp(-dt*1.05));
  if(state.rpm>0.005) state.cycle=(state.cycle+state.rpm/60*360*dt)%720;

  const rpmReadout=document.getElementById('rpmReadout');
  if(rpmReadout) rpmReadout.textContent=String(Math.round(state.rpm));

  const crankAngle=(state.cycle%360)*DEG;
  if(state.crankRotor) state.crankRotor.rotation.z=-crankAngle;
  if(state.flywheelRotor) state.flywheelRotor.rotation.z=-crankAngle;
  if(state.camRotor) state.camRotor.rotation.z=-(state.cycle*0.5)*DEG;
  if(state.timingCrank) state.timingCrank.rotation.z=-crankAngle;
  if(state.timingCam) state.timingCam.rotation.z=-(state.cycle*0.5)*DEG;

  const crankCenterY=-0.72;
  const throwRadius=0.34;
  const rodLength=1.75;

  state.pistonUnits.forEach(u=>{
    const bankAngle=u.sign*45*DEG;
    const throwAngle=THROW_PHASES[u.idx]-crankAngle;

    // Crank-pin position in engine-root coordinates.
    const crankX=throwRadius*Math.cos(throwAngle);
    const crankY=crankCenterY+throwRadius*Math.sin(throwAngle);

    // Convert the crank pin into the bank's local coordinate frame. The piston
    // is constrained to x=0, so the wrist-pin height comes from the exact
    // slider-crank triangle instead of a fake sinusoidal translation.
    const c=Math.cos(bankAngle),s=Math.sin(bankAngle);
    const pinX=c*crankX+s*crankY;
    const pinY=-s*crankX+c*crankY;
    const lateral=clamp(pinX,-rodLength+0.001,rodLength-0.001);
    const wristY=pinY+Math.sqrt(Math.max(0.001,rodLength*rodLength-lateral*lateral));
    const pistonY=clamp(wristY+0.08,0.87,1.61);
    const wristClamped=pistonY-0.08;

    u.piston.position.set(0,pistonY,u.z);
    u.pin.position.set(0,wristClamped,u.z);

    // Give the two rods sharing each journal a small fore/aft offset so their
    // big ends do not occupy the same volume.
    const crankZ=u.z+u.sign*0.09;
    const top=new THREE.Vector3(0,wristClamped,u.z);
    const bottom=new THREE.Vector3(pinX,pinY,crankZ);
    const dir=top.clone().sub(bottom);
    const length=Math.max(0.001,dir.length());

    u.rod.position.copy(top.clone().add(bottom).multiplyScalar(0.5));
    u.rod.scale.set(1,clamp(length/u.rodBaseLength,0.9,1.65),1);
    u.rod.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());

    u.cap.position.set(pinX,pinY,crankZ);
    u.cap.rotation.set(Math.PI/2,0,0);
  });

  state.valveUnits.forEach(v=>{
    const cyc=(state.cycle+v.offset)%720;
    const intake=valveLift(cyc,710,200);
    const exhaust=valveLift(cyc,525,190);
    v.intakeValve.position.y=-0.16*intake;
    v.exhaustValve.position.y=-0.16*exhaust;
    if(v.intakeRocker) v.intakeRocker.rotation.z=v.intakeRockerBase-intake*5.5*DEG;
    if(v.exhaustRocker) v.exhaustRocker.rotation.z=v.exhaustRockerBase+exhaust*5.5*DEG;
  });

  state.sparkUnits.forEach(s=>{
    const cyc=(state.cycle+s.offset)%720;
    const distance=Math.min(Math.abs(cyc-358),720-Math.abs(cyc-358));
    const pulse=clamp(1-distance/12,0,1);
    s.tip.material.emissiveIntensity=pulse*4.5;
    s.tip.scale.setScalar(1+pulse*0.55);
  });

  keepLabelsBound();
}

const OriginalRenderer=THREE.WebGLRenderer;
function PatchedRenderer(...args){
  const renderer=new OriginalRenderer(...args);
  const originalRender=renderer.render.bind(renderer);
  renderer.render=function(scene,camera){
    try{
      if(!state.initialized) initMainScene(scene);
      if(state.initialized && scene===state.scene) updateMainScene();
    }catch(err){
      console.warn('[V8 core fix v6]',err);
    }
    return originalRender(scene,camera);
  };
  return renderer;
}
PatchedRenderer.prototype=OriginalRenderer.prototype;
Object.setPrototypeOf(PatchedRenderer,OriginalRenderer);
THREE.WebGLRenderer=PatchedRenderer;
})();
