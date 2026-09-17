(() => {
'use strict';

const $ = (id) => document.getElementById(id);
const DEG = Math.PI / 180;
const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
const lerp = (a,b,t) => a+(b-a)*t;

const systemData = {
  'Engine Block': {icon:'▰', color:0x3b89a9, short:'Block & cylinder bores', text:'The rigid aluminum/iron structure that locates both cylinder banks, crankshaft mains and coolant/oil passages. This model uses a 90° bank angle.'},
  'Cylinder Heads': {icon:'▤', color:0x7a93a6, short:'Heads & combustion chambers', text:'Each head seals four cylinders and carries the valves, ports, spark plugs and rocker gear that control combustion breathing.'},
  'Pistons & Rods': {icon:'↕', color:0xc7d0d8, short:'8 pistons · 8 rods', text:'Eight pistons receive combustion pressure. Connecting rods transmit that force to offset crank journals, converting reciprocating motion into torque.'},
  'Crankshaft': {icon:'⟲', color:0x8ebbd2, short:'Main rotating assembly', text:'The crankshaft collects force from all eight connecting rods. Counterweights balance rotating and reciprocating masses while the journals run in main bearings.'},
  'Valvetrain': {icon:'⌁', color:0xa5b5c0, short:'Cam · pushrods · rockers · valves', text:'A central camshaft coordinates sixteen valves through lifters, pushrods and rocker arms. Intake and exhaust valves open at different parts of the 720° cycle.'},
  'Intake System': {icon:'⇣', color:0x39b8ff, short:'Throttle · plenum · runners', text:'The throttle body meters airflow into the plenum. Eight runners distribute air toward the intake ports, one path for each cylinder.'},
  'Fuel System': {icon:'◆', color:0xf0a43a, short:'Rails · 8 injectors', text:'Twin fuel rails feed eight injectors. The injectors meter fuel near each intake port so the correct mixture can enter the cylinders.'},
  'Ignition': {icon:'ϟ', color:0x5fd7ff, short:'8 spark plugs', text:'Spark plugs create the ignition event near the end of each compression stroke. Cylinder firing events are phased across two crank revolutions.'},
  'Exhaust Headers': {icon:'≈', color:0xb86d45, short:'8 primaries · 2 collectors', text:'Four primary tubes on each bank carry hot combustion gases away from the exhaust ports and merge them into left and right collectors.'},
  'Cooling System': {icon:'❄', color:0x28aee8, short:'Water pump & passages', text:'The water pump circulates coolant through the engine block and cylinder heads, carrying combustion heat toward the radiator circuit.'},
  'Lubrication': {icon:'◒', color:0xd9a62e, short:'Oil pan · pickup · pump', text:'Engine oil is stored in the sump and circulated under pressure to bearings and valvetrain surfaces, reducing friction and removing heat.'},
  'Timing Drive': {icon:'◉', color:0x9db3c0, short:'Crank gear · cam gear · chain', text:'The timing drive keeps the camshaft synchronized to the crankshaft at half crank speed so valve events remain aligned with piston position.'},
  'Accessories': {icon:'⌘', color:0x7f9bad, short:'Belt · alternator · pulleys', text:'The front accessory drive uses crankshaft power to spin the alternator and water pump through pulleys and a serpentine-style belt path.'},
  'Flywheel': {icon:'◎', color:0x778d9c, short:'Rear inertia mass', text:'The flywheel adds rotational inertia, smooths speed fluctuations between firing events and provides the mechanical interface toward the drivetrain.'}
};

const phaseInfo = [
  {name:'INTAKE', title:'1. Intake Stroke', desc:'The intake valve opens while the piston travels down. The pressure drop draws fresh air-fuel mixture into the cylinder.', intake:'OPEN', exhaust:'CLOSED', spark:'OFF', color:0x39c3ff},
  {name:'COMPRESSION', title:'2. Compression Stroke', desc:'Both valves close. The rising piston compresses the trapped mixture, increasing pressure and temperature before ignition.', intake:'CLOSED', exhaust:'CLOSED', spark:'ARMED', color:0x70b9ff},
  {name:'POWER', title:'3. Power Stroke', desc:'Near top dead center the spark plug ignites the compressed mixture. Rapid pressure rise pushes the piston down and delivers torque to the crankshaft.', intake:'CLOSED', exhaust:'CLOSED', spark:'FIRE', color:0xff8b3d},
  {name:'EXHAUST', title:'4. Exhaust Stroke', desc:'The exhaust valve opens while the piston travels upward, forcing spent combustion gases out through the exhaust port and header.', intake:'CLOSED', exhaust:'OPEN', spark:'OFF', color:0xff6547}
];

// ---------- MAIN ENGINE SCENE ----------
let scene, camera, renderer, labelRenderer, controls, raycaster, pointer;
let engineRoot, floor, running = false, exploded = false, xray = false, cutaway = false, labelsVisible = false;
let selectedSystem = null, isolated = false, engineCycle = 0, rpm = 0, targetRpm = 0;
let systemGroups = {}, selectableMeshes = [], shells = [], pistonUnits = [], valveUnits = [], sparkUnits = [];
let crankGroup, camGroup, timingCrank, timingCam, beltGroup, flywheelGroup;
let clock = new THREE.Clock();

const baseMats = {
  darkMetal: {color:0x151c21, metalness:.84, roughness:.31},
  cast: {color:0x2a353d, metalness:.58, roughness:.46},
  alloy: {color:0x7f8d95, metalness:.78, roughness:.28},
  silver: {color:0xbac4ca, metalness:.9, roughness:.2},
  black: {color:0x080b0d, metalness:.32, roughness:.72},
  blue: {color:0x1d87b8, metalness:.44, roughness:.34},
  amber: {color:0xa97116, metalness:.45, roughness:.34},
  copper: {color:0x8f4d2f, metalness:.67, roughness:.33}
};
function material(key, overrides={}){
  const p = Object.assign({}, baseMats[key] || baseMats.cast, overrides);
  const m = new THREE.MeshStandardMaterial(p);
  m.userData.baseOpacity = p.opacity == null ? 1 : p.opacity;
  m.userData.baseTransparent = !!p.transparent;
  return m;
}
function physical(color, metalness=.7, roughness=.25, opacity=1){
  const m = new THREE.MeshPhysicalMaterial({color,metalness,roughness,clearcoat:.45,clearcoatRoughness:.16,transparent:opacity<1,opacity,side:THREE.DoubleSide});
  m.userData.baseOpacity=opacity; m.userData.baseTransparent=opacity<1; return m;
}
function register(obj, system, opts={}){
  obj.userData.system = system;
  obj.traverse?.(c=>{ if(c.isMesh){c.userData.system=system; selectableMeshes.push(c); if(opts.shell) shells.push(c);} });
  return obj;
}
function groupFor(name, explodeVec){
  const g = new THREE.Group(); g.name=name; g.userData.explode=(explodeVec||new THREE.Vector3()).clone();
  engineRoot.add(g); systemGroups[name]=g; return g;
}
function addMesh(parent, geometry, mat, pos=[0,0,0], rot=[0,0,0], system, opts={}){
  const mesh = new THREE.Mesh(geometry, mat); mesh.position.set(...pos); mesh.rotation.set(...rot); mesh.castShadow=true; mesh.receiveShadow=true; parent.add(mesh); register(mesh,system,opts); return mesh;
}
function pipe(parent, a, b, radius, mat, system, segments=12){
  const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b), mid=va.clone().add(vb).multiplyScalar(.5);
  const len=va.distanceTo(vb); const g=new THREE.CylinderGeometry(radius,radius,len,segments,1,false); const m=new THREE.Mesh(g,mat);
  m.position.copy(mid); m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),vb.clone().sub(va).normalize()); m.castShadow=true; parent.add(m); register(m,system); return m;
}
function ring(parent, r, tube, pos, rot, mat, system){
  return addMesh(parent,new THREE.TorusGeometry(r,tube,10,48),mat,pos,rot,system);
}
function disc(parent,r,depth,pos,mat,system){
  return addMesh(parent,new THREE.CylinderGeometry(r,r,depth,48),mat,pos,[Math.PI/2,0,0],system);
}
function roundedBoxGeometry(x,y,z){ return new THREE.BoxGeometry(x,y,z,2,2,2); }

function setupMainScene(){
  const host=$('stage');
  scene=new THREE.Scene(); scene.fog=new THREE.FogExp2(0x03080d,.029);
  camera=new THREE.PerspectiveCamera(36,Math.max(1,host.clientWidth)/Math.max(1,host.clientHeight),.05,100);
  camera.position.set(10.2,6.3,11.5);
  renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2)); renderer.setSize(host.clientWidth,host.clientHeight); renderer.outputEncoding=THREE.sRGBEncoding; renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.32; renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap; host.appendChild(renderer.domElement);
  labelRenderer=new THREE.CSS2DRenderer(); labelRenderer.setSize(host.clientWidth,host.clientHeight); labelRenderer.domElement.className='label-layer'; host.appendChild(labelRenderer.domElement);
  controls=new THREE.OrbitControls(camera,renderer.domElement); controls.enableDamping=true; controls.dampingFactor=.055; controls.target.set(0,.4,0); controls.minDistance=6.2; controls.maxDistance=23; controls.autoRotate=true; controls.autoRotateSpeed=.45;
  raycaster=new THREE.Raycaster(); pointer=new THREE.Vector2();

  scene.add(new THREE.HemisphereLight(0xc7edff,0x061019,2.15));
  const key=new THREE.DirectionalLight(0xffffff,3.2); key.position.set(6,10,8); key.castShadow=true; key.shadow.mapSize.set(1024,1024); scene.add(key);
  const rim=new THREE.PointLight(0x1aaeff,3.6,28); rim.position.set(-6,4,3); scene.add(rim);
  const warm=new THREE.PointLight(0xff7a3d,1.65,20); warm.position.set(5,2,-6); scene.add(warm);
  const fill=new THREE.PointLight(0x7edfff,1.2,24); fill.position.set(0,-2,7); scene.add(fill);

  floor=new THREE.Mesh(new THREE.CircleGeometry(8.7,96),new THREE.MeshStandardMaterial({color:0x071017,metalness:.42,roughness:.72,transparent:true,opacity:.95})); floor.rotation.x=-Math.PI/2; floor.position.y=-2.55; floor.receiveShadow=true; scene.add(floor);
  const floorRing=new THREE.Mesh(new THREE.RingGeometry(5.8,5.85,96),new THREE.MeshBasicMaterial({color:0x1d8fc5,transparent:true,opacity:.32,side:THREE.DoubleSide})); floorRing.rotation.x=-Math.PI/2; floorRing.position.y=-2.535; scene.add(floorRing);

  engineRoot=new THREE.Group(); engineRoot.rotation.y=-.22; engineRoot.scale.setScalar(.93); scene.add(engineRoot);
  createEngine(); createLabels();
  renderer.domElement.addEventListener('pointerdown',onPick);
  window.addEventListener('resize',resizeMain);
  setTimeout(()=>$('loading').classList.add('done'),400);
}

function createEngine(){
  const block=groupFor('Engine Block',new THREE.Vector3(0,-.15,0));
  const heads=groupFor('Cylinder Heads',new THREE.Vector3(0,.7,0));
  const pistons=groupFor('Pistons & Rods',new THREE.Vector3(0,.2,0));
  const crank=groupFor('Crankshaft',new THREE.Vector3(0,-.65,0));
  const valve=groupFor('Valvetrain',new THREE.Vector3(0,.9,0));
  const intake=groupFor('Intake System',new THREE.Vector3(0,1.35,0));
  const fuel=groupFor('Fuel System',new THREE.Vector3(0,1.75,0));
  const ignition=groupFor('Ignition',new THREE.Vector3(0,2.0,0));
  const exhaust=groupFor('Exhaust Headers',new THREE.Vector3(2.1,.25,0));
  const cooling=groupFor('Cooling System',new THREE.Vector3(0,.15,1.2));
  const lube=groupFor('Lubrication',new THREE.Vector3(0,-1.25,0));
  const timing=groupFor('Timing Drive',new THREE.Vector3(0,0,1.45));
  const accessories=groupFor('Accessories',new THREE.Vector3(0,.2,2.35));
  const flywheel=groupFor('Flywheel',new THREE.Vector3(0,0,-1.65));

  // Main block / crankcase
  const blockMat=material('cast',{color:0x252e34});
  addMesh(block,roundedBoxGeometry(2.55,2.1,6.1),blockMat.clone(),[0,-.45,0],[0,0,0],'Engine Block',{shell:true});
  addMesh(block,new THREE.BoxGeometry(1.85,.72,5.9),material('darkMetal'),[0,-1.28,0],[0,0,0],'Engine Block',{shell:true});
  // bank walls and cylinder liners
  [-1,1].forEach(sign=>{
    const bg=new THREE.Group(); bg.rotation.z=sign*45*DEG; block.add(bg);
    addMesh(bg,new THREE.BoxGeometry(1.72,1.55,6.12),material('cast',{color:0x344049}),[0,.72,0],[0,0,0],'Engine Block',{shell:true});
    [-2.25,-.75,.75,2.25].forEach(z=>{
      const liner=addMesh(bg,new THREE.CylinderGeometry(.43,.43,1.82,28,1,true),material('alloy',{color:0x69767d,transparent:true,opacity:.34,side:THREE.DoubleSide}),[0,1.02,z],[0,0,0],'Engine Block',{shell:true});
      liner.material.depthWrite=false;
    });
  });

  // Cylinder heads and valve covers
  [-1,1].forEach(sign=>{
    const hg=new THREE.Group(); hg.rotation.z=sign*45*DEG; heads.add(hg);
    addMesh(hg,new THREE.BoxGeometry(1.78,.58,6.3),material('alloy',{color:0x738087}),[0,1.95,0],[0,0,0],'Cylinder Heads',{shell:true});
    addMesh(hg,new THREE.BoxGeometry(1.52,.45,6.05),physical(sign<0?0x27343c:0x2e3a41,.74,.24),[0,2.47,0],[0,0,0],'Cylinder Heads',{shell:true});
    // cover ribs / bolts
    for(let z=-2.55;z<=2.55;z+=.85) addMesh(hg,new THREE.BoxGeometry(1.25,.06,.06),material('silver'),[0,2.72,z],[0,0,0],'Cylinder Heads');
    [-.56,.56].forEach(x=>[-2.6,-1.3,0,1.3,2.6].forEach(z=>addMesh(hg,new THREE.CylinderGeometry(.045,.045,.09,12),material('silver'),[x,2.74,z],[0,0,0],'Cylinder Heads')));
  });

  // Crankshaft
  crankGroup=new THREE.Group(); crank.add(crankGroup);
  const crankMat=material('silver',{color:0x7d8f99});
  addMesh(crankGroup,new THREE.CylinderGeometry(.22,.22,6.55,28),crankMat.clone(),[0,-.72,0],[Math.PI/2,0,0],'Crankshaft');
  const journalZ=[-2.7,-1.8,-.9,0,.9,1.8,2.7];
  journalZ.forEach((z,i)=>{
    disc(crankGroup,.43,.18,[0,-.72,z],material('alloy',{color:0x6c7c86}),'Crankshaft');
    if(i<journalZ.length-1){
      const cw=addMesh(crankGroup,new THREE.BoxGeometry(.95,.19,.34),material('darkMetal',{color:0x36444e}),[0,-.72,z+.45],[0,0,(i%2?35:-35)*DEG],'Crankshaft');
      cw.geometry.translate(.22,0,0);
    }
  });
  // rod journals / throws
  [-2.25,-.75,.75,2.25].forEach((z,i)=>{
    const a=(i%2?90:0)*DEG;
    const x=.34*Math.cos(a), y=-.72+.34*Math.sin(a);
    disc(crankGroup,.18,.48,[x,y,z],material('silver',{color:0xaab8bf}),'Crankshaft');
  });

  // Pistons and rods - four per bank
  const firingOrder=[1,8,4,3,6,5,7,2];
  const cylMap=[];
  let cyl=1;
  [-1,1].forEach(sign=>{
    const pg=new THREE.Group(); pg.rotation.z=sign*45*DEG; pistons.add(pg);
    [-2.25,-.75,.75,2.25].forEach((z,idx)=>{
      const piston=addMesh(pg,new THREE.CylinderGeometry(.38,.39,.48,28),physical(0xa8b2b8,.85,.18),[0,1.2,z],[0,0,0],'Pistons & Rods');
      addMesh(piston,new THREE.TorusGeometry(.38,.022,7,30),material('darkMetal'),[0,.11,0],[Math.PI/2,0,0],'Pistons & Rods');
      addMesh(piston,new THREE.TorusGeometry(.38,.018,7,30),material('darkMetal'),[0,.02,0],[Math.PI/2,0,0],'Pistons & Rods');
      const pin=addMesh(pg,new THREE.CylinderGeometry(.075,.075,.68,18),material('silver'),[0,1.12,z],[0,0,Math.PI/2],'Pistons & Rods');
      const rod=addMesh(pg,new THREE.BoxGeometry(.17,1.22,.13),material('silver',{color:0x8d9aa1}),[0,.48,z],[0,0,0],'Pistons & Rods');
      const cap=addMesh(pg,new THREE.CylinderGeometry(.18,.18,.15,20),material('silver'),[0,-.1,z],[Math.PI/2,0,0],'Pistons & Rods');
      const cylinderNumber = sign<0 ? idx+1 : idx+5;
      const firingIndex=firingOrder.indexOf(cylinderNumber);
      pistonUnits.push({piston,pin,rod,cap,sign,z,offset:(720-firingIndex*90)%720,bankGroup:pg});
      cylMap.push(cylinderNumber); cyl++;
    });
  });

  // Camshaft and valvetrain
  camGroup=new THREE.Group(); valve.add(camGroup);
  addMesh(camGroup,new THREE.CylinderGeometry(.14,.14,6.25,24),material('silver',{color:0x63747f}),[0,.32,0],[Math.PI/2,0,0],'Valvetrain');
  for(let i=0;i<16;i++){
    const z=-2.65+i*.35; const lobe=addMesh(camGroup,new THREE.SphereGeometry(.22,14,10),material('silver',{color:0x71838e}),[0,.32,z],[0,0,(i%4)*Math.PI/4],'Valvetrain'); lobe.scale.set(1.45,.72,1);
  }
  [-1,1].forEach(sign=>{
    const vg=new THREE.Group(); vg.rotation.z=sign*45*DEG; valve.add(vg);
    [-2.25,-.75,.75,2.25].forEach((z,idx)=>{
      // pushrods
      pipe(vg,[-.35,.45,z-.14],[-.45,2.18,z-.14],.035,material('silver'),'Valvetrain',10);
      pipe(vg,[.35,.45,z+.14],[.45,2.18,z+.14],.035,material('silver'),'Valvetrain',10);
      // rocker arms
      addMesh(vg,new THREE.BoxGeometry(.44,.08,.11),material('silver'),[-.26,2.28,z-.14],[0,0,-8*DEG],'Valvetrain');
      addMesh(vg,new THREE.BoxGeometry(.44,.08,.11),material('silver'),[.26,2.28,z+.14],[0,0,8*DEG],'Valvetrain');
      // valves stems and heads
      const intakeValve=new THREE.Group(), exhaustValve=new THREE.Group(); vg.add(intakeValve,exhaustValve);
      const ivStem=addMesh(intakeValve,new THREE.CylinderGeometry(.035,.035,.65,12),material('silver'),[-.26,1.88,z-.16],[0,0,0],'Valvetrain');
      addMesh(intakeValve,new THREE.CylinderGeometry(.14,.14,.055,18),material('silver'),[-.26,1.56,z-.16],[0,0,0],'Valvetrain');
      const evStem=addMesh(exhaustValve,new THREE.CylinderGeometry(.035,.035,.65,12),material('silver'),[.26,1.88,z+.16],[0,0,0],'Valvetrain');
      addMesh(exhaustValve,new THREE.CylinderGeometry(.14,.14,.055,18),material('silver'),[.26,1.56,z+.16],[0,0,0],'Valvetrain');
      const cylinderNumber = sign<0 ? idx+1 : idx+5;
      const firingIndex=firingOrder.indexOf(cylinderNumber);
      valveUnits.push({intakeValve,exhaustValve,offset:(720-firingIndex*90)%720});
    });
  });

  // Intake manifold: plenum, throttle, runners
  addMesh(intake,new THREE.BoxGeometry(1.65,.72,4.9),physical(0x4b5c66,.7,.27),[0,2.2,0],[0,0,0],'Intake System',{shell:true});
  addMesh(intake,new THREE.BoxGeometry(1.15,.38,5.3),material('alloy',{color:0x62727c}),[0,2.69,0],[0,0,0],'Intake System',{shell:true});
  disc(intake,.62,.52,[0,2.38,3.23],material('alloy',{color:0x85959d}),'Intake System');
  ring(intake,.52,.055,[0,2.38,3.51],[0,0,0],material('black'),'Intake System');
  [-1,1].forEach(sign=>[-2.25,-.75,.75,2.25].forEach(z=>{
    const x=sign*.94; pipe(intake,[sign*.45,2.08,z],[x,1.55,z],.12,material('alloy',{color:0x52626b}),'Intake System',18);
  }));

  // Fuel rails and injectors
  [-1,1].forEach(sign=>{
    pipe(fuel,[sign*1.02,2.53,-2.75],[sign*1.02,2.53,2.75],.075,material('amber',{color:0x9e7025}),'Fuel System',16);
    [-2.25,-.75,.75,2.25].forEach(z=>{
      const inj=pipe(fuel,[sign*1.02,2.48,z],[sign*.9,2.05,z],.052,material('amber',{color:0xbf7b20}),'Fuel System',12);
    });
  });

  // Spark plugs
  [-1,1].forEach(sign=>{
    const ig=new THREE.Group(); ig.rotation.z=sign*45*DEG; ignition.add(ig);
    [-2.25,-.75,.75,2.25].forEach((z,idx)=>{
      const plug=new THREE.Group(); plug.position.set(0,2.06,z); ig.add(plug); register(plug,'Ignition');
      addMesh(plug,new THREE.CylinderGeometry(.065,.065,.42,14),material('silver'),[0,0,0],[0,0,0],'Ignition');
      addMesh(plug,new THREE.CylinderGeometry(.1,.1,.12,6),physical(0xe6ecef,.1,.5),[0,.16,0],[0,0,0],'Ignition');
      const tip=addMesh(plug,new THREE.SphereGeometry(.06,12,8),new THREE.MeshStandardMaterial({color:0x78dfff,emissive:0x2cbcff,emissiveIntensity:0}),[0,-.25,0],[0,0,0],'Ignition');
      const cylinderNumber=sign<0?idx+1:idx+5; const firingIndex=firingOrder.indexOf(cylinderNumber);
      sparkUnits.push({tip,offset:(720-firingIndex*90)%720});
    });
  });

  // Exhaust headers - segmented primaries and collectors
  [-1,1].forEach(sign=>{
    const eg=new THREE.Group(); eg.rotation.z=sign*45*DEG; exhaust.add(eg);
    [-2.25,-.75,.75,2.25].forEach((z,idx)=>{
      const outer=sign*1.35;
      pipe(eg,[sign*.72,1.8,z],[outer,1.45,z],.085,material('copper',{color:0x765044}),'Exhaust Headers',16);
      pipe(eg,[outer,1.45,z],[sign*1.63,.55,z+(idx-1.5)*.14],.085,material('copper',{color:0x684239}),'Exhaust Headers',16);
      pipe(eg,[sign*1.63,.55,z+(idx-1.5)*.14],[sign*1.55,.1,-2.7],.1,material('copper',{color:0x5b3932}),'Exhaust Headers',16);
    });
    pipe(eg,[sign*1.55,.1,-2.7],[sign*1.55,.0,-3.65],.21,material('copper',{color:0x4b302d}),'Exhaust Headers',20);
  });

  // Cooling: pump + crossover pipes
  disc(cooling,.7,.48,[0,.18,3.38],material('alloy',{color:0x566a76}),'Cooling System');
  disc(cooling,.42,.18,[0,.18,3.7],material('silver',{color:0x7d929d}),'Cooling System');
  pipe(cooling,[-.42,.45,3.2],[-1.1,1.1,2.6],.12,material('blue',{color:0x176f9a}),'Cooling System',18);
  pipe(cooling,[.42,.45,3.2],[1.1,1.1,2.6],.12,material('blue',{color:0x176f9a}),'Cooling System',18);

  // Lubrication
  addMesh(lube,new THREE.BoxGeometry(2.18,.75,5.5),physical(0x20272c,.72,.34),[0,-1.9,0],[0,0,0],'Lubrication',{shell:true});
  addMesh(lube,new THREE.BoxGeometry(1.75,.42,2.1),physical(0x151b1f,.76,.34),[0,-2.28,-1.2],[0,0,0],'Lubrication',{shell:true});
  pipe(lube,[0,-2.0,-1.0],[0,-1.15,1.8],.07,material('amber',{color:0x9a741f}),'Lubrication',14);
  addMesh(lube,new THREE.SphereGeometry(.18,14,10),material('amber',{color:0xa87b18}),[0,-2.15,-1.2],[0,0,0],'Lubrication');

  // Timing drive on front (+Z)
  timingCrank=disc(timing,.58,.16,[0,-.72,3.35],material('silver',{color:0x657985}),'Timing Drive');
  timingCam=disc(timing,.92,.16,[0,.32,3.35],material('silver',{color:0x657985}),'Timing Drive');
  ring(timing,.58,.045,[0,-.72,3.45],[0,0,0],material('darkMetal'),'Timing Drive');
  ring(timing,.92,.045,[0,.32,3.45],[0,0,0],material('darkMetal'),'Timing Drive');
  // visual chain sides
  pipe(timing,[-.56,-.72,3.47],[-.86,.32,3.47],.035,material('silver',{color:0x5b6d76}),'Timing Drive',10);
  pipe(timing,[.56,-.72,3.47],[.86,.32,3.47],.035,material('silver',{color:0x5b6d76}),'Timing Drive',10);

  // Accessories
  disc(accessories,1.0,.28,[0,-.72,3.85],material('darkMetal',{color:0x24333c}),'Accessories');
  ring(accessories,.88,.055,[0,-.72,4.02],[0,0,0],material('black'),'Accessories');
  const alt=new THREE.Group(); alt.position.set(1.72,.45,3.72); accessories.add(alt); register(alt,'Accessories');
  addMesh(alt,new THREE.CylinderGeometry(.5,.5,.72,28),material('alloy',{color:0x657681}),[0,0,0],[Math.PI/2,0,0],'Accessories');
  for(let i=0;i<10;i++){const fin=addMesh(alt,new THREE.BoxGeometry(.05,.68,.55),material('silver',{color:0x72838d}),[0,0,0],[0,0,i*Math.PI/5],'Accessories');}
  disc(accessories,.34,.16,[1.72,.45,4.16],material('darkMetal'),'Accessories');
  // idler
  disc(accessories,.42,.15,[-1.52,.72,4.02],material('darkMetal'),'Accessories');
  // belt path as torus hints + connecting spans
  beltGroup=new THREE.Group(); accessories.add(beltGroup);
  ring(beltGroup,.93,.045,[0,-.72,4.13],[0,0,0],material('black'),'Accessories');
  ring(beltGroup,.32,.045,[1.72,.45,4.24],[0,0,0],material('black'),'Accessories');
  ring(beltGroup,.4,.045,[-1.52,.72,4.11],[0,0,0],material('black'),'Accessories');
  pipe(beltGroup,[.62,-.05,4.17],[1.45,.26,4.17],.035,material('black'),'Accessories',8);
  pipe(beltGroup,[-.62,-.05,4.17],[-1.25,.45,4.17],.035,material('black'),'Accessories',8);

  // Flywheel rear (-Z)
  flywheelGroup=new THREE.Group(); flywheel.add(flywheelGroup);
  disc(flywheelGroup,1.38,.28,[0,-.72,-3.6],material('darkMetal',{color:0x384650}),'Flywheel');
  disc(flywheelGroup,.62,.31,[0,-.72,-3.79],material('alloy',{color:0x687983}),'Flywheel');
  ring(flywheelGroup,1.28,.07,[0,-.72,-3.78],[0,0,0],material('silver',{color:0x798b94}),'Flywheel');
  for(let i=0;i<8;i++){const a=i*Math.PI/4; addMesh(flywheelGroup,new THREE.CylinderGeometry(.07,.07,.34,12),material('silver'),[Math.cos(a)*.9,-.72+Math.sin(a)*.9,-3.86],[Math.PI/2,0,0],'Flywheel');}

  // Small starter detail attached to accessories category
  const starter=new THREE.Group(); starter.position.set(-1.72,-1.18,-2.55); accessories.add(starter); register(starter,'Accessories');
  addMesh(starter,new THREE.CylinderGeometry(.31,.31,.9,24),material('darkMetal',{color:0x2d3b43}),[0,0,0],[Math.PI/2,0,0],'Accessories');
  addMesh(starter,new THREE.CylinderGeometry(.17,.17,.55,20),material('alloy'),[.32,.1,.1],[Math.PI/2,0,0],'Accessories');
}

function createLabels(){
  const specs={
    'Engine Block':[0,-.3,1.2], 'Cylinder Heads':[1.55,2.1,1.5], 'Pistons & Rods':[-1.2,.9,.5], 'Crankshaft':[0,-.8,1.5],
    'Valvetrain':[-1.25,2.4,-1.4], 'Intake System':[0,3.1,.2], 'Fuel System':[1.55,2.7,-.6], 'Ignition':[-1.55,2.4,.6],
    'Exhaust Headers':[2.3,.7,-.3], 'Cooling System':[0,.7,3.8], 'Lubrication':[0,-2.4,.4], 'Timing Drive':[-1.1,.1,3.6],
    'Accessories':[1.8,.8,4.0], 'Flywheel':[0,-.6,-3.8]
  };
  Object.entries(specs).forEach(([name,pos])=>{
    const div=document.createElement('div'); div.className='engine-label hidden'; div.textContent=name;
    const lab=new THREE.CSS2DObject(div); lab.position.set(...pos); lab.userData.system=name; engineRoot.add(lab);
  });
}

function updateMechanicalAnimation(dt){
  targetRpm = running ? 900 : 0;
  rpm = lerp(rpm,targetRpm,1-Math.exp(-dt*3.3));
  $('rpmReadout').textContent=Math.round(rpm);
  if(rpm>1) engineCycle=(engineCycle + rpm/60*360*dt)%720;
  const crankRad=(engineCycle%360)*DEG;
  if(crankGroup) crankGroup.rotation.z=-crankRad;
  if(flywheelGroup) flywheelGroup.rotation.z=-crankRad;
  if(timingCrank) timingCrank.rotation.z=-crankRad;
  if(timingCam) timingCam.rotation.z=-crankRad*.5;
  if(camGroup) camGroup.rotation.z=-crankRad*.5;
  if(beltGroup) beltGroup.rotation.z=0;

  pistonUnits.forEach(u=>{
    const cyc=(engineCycle+u.offset)%720; const a=(cyc%360)*DEG;
    const top=1.63, stroke=.88; const py=top-stroke*(1-Math.cos(a))/2;
    u.piston.position.y=py; u.pin.position.y=py-.08;
    u.rod.position.y=(py-.02+.02)/2; u.rod.scale.y=(py+.25)/1.35; u.rod.rotation.z=Math.sin(a)*.14*u.sign;
    u.cap.position.y=.02+.08*Math.sin(a); u.cap.position.x=.15*Math.cos(a);
  });
  valveUnits.forEach(v=>{
    const cyc=(engineCycle+v.offset)%720;
    const intakeOpen = cyc<190 || cyc>710; const exhaustOpen=cyc>525 && cyc<715;
    v.intakeValve.position.y=lerp(v.intakeValve.position.y,intakeOpen?-.16:0,.2);
    v.exhaustValve.position.y=lerp(v.exhaustValve.position.y,exhaustOpen?-.16:0,.2);
  });
  sparkUnits.forEach(s=>{
    const cyc=(engineCycle+s.offset)%720; const fire=cyc>346&&cyc<370;
    s.tip.material.emissiveIntensity=fire?4.5:0;
    const k=fire?1.6:1; s.tip.scale.setScalar(lerp(s.tip.scale.x,k,.3));
  });
  Object.values(systemGroups).forEach(g=>{
    const t=exploded?1:0; const e=g.userData.explode||new THREE.Vector3();
    g.position.lerp(new THREE.Vector3(e.x*t,e.y*t,e.z*t),1-Math.exp(-dt*6));
  });
}

function applyVisualModes(){
  shells.forEach(m=>{
    const isOuter = ['Engine Block','Cylinder Heads','Intake System','Lubrication'].includes(m.userData.system);
    if(cutaway && isOuter){m.visible=false;return;} m.visible=true;
    if(xray && isOuter){m.material.transparent=true;m.material.opacity=.13;m.material.depthWrite=false;}
    else{m.material.transparent=m.material.userData.baseTransparent||false;m.material.opacity=m.material.userData.baseOpacity??1;m.material.depthWrite=!(m.material.transparent&&m.material.opacity<.5);}
  });
  Object.values(systemGroups).forEach(g=>{if(isolated&&selectedSystem)g.visible=g===systemGroups[selectedSystem];else g.visible=true;});
  document.querySelectorAll('.engine-label').forEach(el=>el.classList.toggle('hidden',!labelsVisible));
  $('explodeBtn').classList.toggle('active',exploded); $('xrayBtn').classList.toggle('active',xray); $('cutawayBtn').classList.toggle('active',cutaway); $('labelsBtn').classList.toggle('active',labelsVisible);
}

function selectSystem(name){
  selectedSystem=name; isolated=false;
  const d=systemData[name]; if(!d)return;
  $('partTitle').textContent=name; $('partText').textContent=d.text; $('techSelected').textContent=name.replace(' System','');
  document.querySelectorAll('.system-card').forEach(c=>c.classList.toggle('active',c.dataset.system===name));
  selectableMeshes.forEach(m=>{
    const hit=m.userData.system===name;
    if(m.material && 'emissive' in m.material){m.material.emissive.setHex(hit?d.color:0x000000);m.material.emissiveIntensity=hit?.32:0;}
  });
  applyVisualModes();
}
function clearSelection(){
  selectedSystem=null; isolated=false; $('partTitle').textContent='V8 Engine Assembly'; $('partText').textContent='A 90-degree V8 uses two banks of four cylinders driving one crankshaft. Select a highlighted system or click a visible component to inspect it.'; $('techSelected').textContent='Assembly';
  document.querySelectorAll('.system-card').forEach(c=>c.classList.remove('active')); selectableMeshes.forEach(m=>{if(m.material&&'emissive'in m.material){m.material.emissive.setHex(0);m.material.emissiveIntensity=0;}}); applyVisualModes();
}
function onPick(e){
  const rect=renderer.domElement.getBoundingClientRect(); pointer.x=((e.clientX-rect.left)/rect.width)*2-1; pointer.y=-((e.clientY-rect.top)/rect.height)*2+1; raycaster.setFromCamera(pointer,camera);
  const hits=raycaster.intersectObjects(selectableMeshes.filter(m=>m.visible),false); if(hits.length){const name=hits[0].object.userData.system;if(name)selectSystem(name);}
}
function resetView(){
  clearSelection(); exploded=false;xray=false;cutaway=false;isolated=false; controls.target.set(0,.4,0); camera.position.set(10.2,6.3,11.5); controls.autoRotate=!running; applyVisualModes();
}
function resizeMain(){const host=$('stage'); if(!renderer)return; camera.aspect=Math.max(1,host.clientWidth)/Math.max(1,host.clientHeight);camera.updateProjectionMatrix();renderer.setSize(host.clientWidth,host.clientHeight);labelRenderer.setSize(host.clientWidth,host.clientHeight);resizeCombustion();}

function buildSystemCards(){
  const host=$('systemCards');
  Object.entries(systemData).forEach(([name,d])=>{const b=document.createElement('button');b.className='system-card';b.dataset.system=name;b.innerHTML=`<span class="sys-icon">${d.icon}</span><b>${name}</b><small>${d.short}</small>`;b.onclick=()=>selectSystem(name);host.appendChild(b);});
}

// ---------- COMBUSTION CUTAWAY ----------
let cScene,cCamera,cRenderer,cControls,cPiston,cRod,cCrank,cIntakeValve,cExhaustValve,cSpark,cFlame,cParticles,cParticleMat;
let combAuto=true, combDegree=0, combTarget=null, cClock=new THREE.Clock();
function setupCombustion(){
  const host=$('combustionStage'); cScene=new THREE.Scene(); cCamera=new THREE.PerspectiveCamera(34,Math.max(1,host.clientWidth)/Math.max(1,host.clientHeight),.05,50);cCamera.position.set(5.4,3.4,7.2);
  cRenderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});cRenderer.setPixelRatio(Math.min(devicePixelRatio,2));cRenderer.setSize(host.clientWidth,host.clientHeight);cRenderer.outputEncoding=THREE.sRGBEncoding;cRenderer.toneMapping=THREE.ACESFilmicToneMapping;cRenderer.toneMappingExposure=1.42;host.appendChild(cRenderer.domElement);
  cControls=new THREE.OrbitControls(cCamera,cRenderer.domElement);cControls.enableDamping=true;cControls.enablePan=false;cControls.minDistance=5;cControls.maxDistance=11;cControls.target.set(0,.65,0);
  cScene.add(new THREE.HemisphereLight(0xd7f3ff,0x071019,2.25));const k=new THREE.DirectionalLight(0xffffff,2.6);k.position.set(4,7,5);cScene.add(k);const warm=new THREE.PointLight(0xff7b39,2.6,10);warm.position.set(0,2,1);cScene.add(warm);
  createCutawayCylinder();
}
function createCutawayCylinder(){
  const root=new THREE.Group();root.rotation.y=-.16;cScene.add(root);
  // crankcase and transparent liner
  const base=addC(root,new THREE.BoxGeometry(2.5,1.25,2.1),physical(0x27343c,.7,.35,.82),[0,-1.15,0]);
  const linerMat=new THREE.MeshPhysicalMaterial({color:0x7b9bad,metalness:.1,roughness:.18,transparent:true,opacity:.2,side:THREE.DoubleSide,depthWrite:false});
  addC(root,new THREE.CylinderGeometry(.86,.86,3.3,46,1,true,0,Math.PI*1.55),linerMat,[0,.82,0],[0,0,0]);
  // head / chamber roof
  addC(root,new THREE.BoxGeometry(2.4,.48,2.0),physical(0x6f7d84,.72,.27,.64),[0,2.48,0]);
  // piston
  cPiston=new THREE.Group();root.add(cPiston);addC(cPiston,new THREE.CylinderGeometry(.78,.8,.52,40),physical(0xb9c2c7,.84,.17),[0,0,0]);ringC(cPiston,.77,.026,[0,.11,0]);ringC(cPiston,.77,.02,[0,.02,0]);
  cRod=addC(root,new THREE.BoxGeometry(.18,1.75,.18),material('silver',{color:0x8c9ca4}),[0,-.1,0]);
  cCrank=new THREE.Group();cCrank.position.set(0,-1.45,0);root.add(cCrank);addC(cCrank,new THREE.CylinderGeometry(.18,.18,1.65,22),material('silver'),[0,0,0],[Math.PI/2,0,0]);addC(cCrank,new THREE.BoxGeometry(.95,.16,.3),material('darkMetal',{color:0x45545d}),[0,0,0],[0,0,25*DEG]);
  // valves
  cIntakeValve=new THREE.Group();cExhaustValve=new THREE.Group();root.add(cIntakeValve,cExhaustValve);
  addC(cIntakeValve,new THREE.CylinderGeometry(.045,.045,.85,14),material('silver'),[-.42,2.25,0]);addC(cIntakeValve,new THREE.CylinderGeometry(.23,.23,.07,22),material('silver'),[-.42,1.83,0]);
  addC(cExhaustValve,new THREE.CylinderGeometry(.045,.045,.85,14),material('silver'),[.42,2.25,0]);addC(cExhaustValve,new THREE.CylinderGeometry(.23,.23,.07,22),material('silver'),[.42,1.83,0]);
  // ports
  pipeC(root,[-.42,2.32,0],[-1.65,2.62,0],.19,0x2d9bd1);pipeC(root,[.42,2.32,0],[1.65,2.62,0],.19,0x9f5134);
  // spark plug
  cSpark=new THREE.Group();cSpark.position.set(0,2.43,0);root.add(cSpark);addC(cSpark,new THREE.CylinderGeometry(.09,.09,.58,14),physical(0xe7ecef,.25,.4),[0,0,0]);addC(cSpark,new THREE.CylinderGeometry(.15,.15,.13,6),material('silver'),[0,.13,0]);
  cFlame=addC(root,new THREE.SphereGeometry(.28,20,14),new THREE.MeshStandardMaterial({color:0xff8c36,emissive:0xff5a17,emissiveIntensity:3,transparent:true,opacity:.9}),[0,1.92,0]);cFlame.scale.setScalar(.01);
  // particles
  const count=130,pos=new Float32Array(count*3);for(let i=0;i<count;i++){pos[i*3]=(Math.random()-.5)*1.25;pos[i*3+1]=1+Math.random();pos[i*3+2]=(Math.random()-.5)*.75;}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));cParticleMat=new THREE.PointsMaterial({color:0x45c7ff,size:.065,transparent:true,opacity:.82,depthWrite:false,blending:THREE.AdditiveBlending});cParticles=new THREE.Points(geo,cParticleMat);root.add(cParticles);
  const floorC=addC(root,new THREE.CircleGeometry(3.4,64),new THREE.MeshStandardMaterial({color:0x061019,roughness:.72,metalness:.3}),[0,-1.82,0],[-Math.PI/2,0,0]);
}
function addC(parent,geo,mat,pos=[0,0,0],rot=[0,0,0]){const m=new THREE.Mesh(geo,mat);m.position.set(...pos);m.rotation.set(...rot);parent.add(m);return m;}
function ringC(parent,r,t,pos){return addC(parent,new THREE.TorusGeometry(r,t,8,36),material('darkMetal'),pos,[Math.PI/2,0,0]);}
function pipeC(parent,a,b,r,color){const va=new THREE.Vector3(...a),vb=new THREE.Vector3(...b),mid=va.clone().add(vb).multiplyScalar(.5);const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,va.distanceTo(vb),18),material('alloy',{color}));m.position.copy(mid);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),vb.clone().sub(va).normalize());parent.add(m);return m;}
function resizeCombustion(){if(!cRenderer)return;const host=$('combustionStage');cCamera.aspect=Math.max(1,host.clientWidth)/Math.max(1,host.clientHeight);cCamera.updateProjectionMatrix();cRenderer.setSize(host.clientWidth,host.clientHeight);}
function phaseFromDegree(d){return Math.min(3,Math.floor(((d%720)+720)%720/180));}
function setCombPhase(index){combAuto=false;combTarget=index*180+25;$('combPlay').classList.remove('active');$('combPlay').textContent='▶ Auto';updatePhaseUI(index,index*180+25);}
function updatePhaseUI(index,degree){const p=phaseInfo[index];$('phaseIndex').textContent=String(index+1).padStart(2,'0');$('phaseName').textContent=p.name;$('phaseTitle').textContent=p.title;$('phaseDescription').textContent=p.desc;$('metricIntake').textContent=p.intake;$('metricExhaust').textContent=p.exhaust;$('metricSpark').textContent=p.spark;$('cycleDegrees').textContent=`${Math.round(degree)%720}°`;document.querySelector('.cycle-ring').style.setProperty('--progress',`${((degree%720)/720)*100}%`);document.querySelectorAll('.phase-tabs button').forEach((b,i)=>b.classList.toggle('active',i===index));}
function updateCombustion(dt){
  if(combAuto){combDegree=(combDegree+dt*62)%720;}else if(combTarget!=null){let diff=combTarget-combDegree;if(Math.abs(diff)>360)diff-=Math.sign(diff)*720;combDegree=(combDegree+diff*(1-Math.exp(-dt*5))+720)%720;if(Math.abs(diff)<.5)combTarget=null;}
  const d=combDegree%720, phase=phaseFromDegree(d), local=d-phase*180, a=(d%360)*DEG;
  const top=1.62,stroke=1.65,py=top-stroke*(1-Math.cos(a))/2;cPiston.position.y=py;
  cRod.position.y=(py-1.22)/2;cRod.scale.y=clamp((py+1.55)/2.1,.62,1.3);cRod.rotation.z=Math.sin(a)*.18;cCrank.rotation.z=-a;
  const intakeOpen=phase===0, exhaustOpen=phase===3;cIntakeValve.position.y=lerp(cIntakeValve.position.y,intakeOpen?-.22:0,.18);cExhaustValve.position.y=lerp(cExhaustValve.position.y,exhaustOpen?-.22:0,.18);
  const powerProgress=phase===2?local/180:0;const fire=phase===2&&local<42;cFlame.scale.setScalar(fire?(.4+powerProgress*2.7):.01);cFlame.material.opacity=fire?(.96-powerProgress*.4):0;
  updateParticles(phase,local,py);updatePhaseUI(phase,d);cControls.update();cRenderer.render(cScene,cCamera);
}
function updateParticles(phase,local,py){
  const arr=cParticles.geometry.attributes.position.array, t=local/180;cParticleMat.color.setHex(phaseInfo[phase].color);cParticleMat.opacity=phase===1?.58:.82;
  const n=arr.length/3;for(let i=0;i<n;i++){
    const seed=i/n, wob=Math.sin(seed*37+performance.now()*.001)*.08;
    if(phase===0){arr[i*3]=-1.8+((seed*3.3+t*1.8)%3.3);arr[i*3+1]=2.58-((seed+t)%1)*1.2+wob;arr[i*3+2]=(Math.sin(i*2.3)*.45);}
    else if(phase===1){const r=(1-t*.55)*(.65*(.2+((i*17)%100)/100));const ang=i*.74;arr[i*3]=Math.cos(ang)*r;arr[i*3+1]=py+.35+((i%13)/13)*(1.5-py)*(.9-t*.2);arr[i*3+2]=Math.sin(ang)*r*.65;}
    else if(phase===2){const exp=.18+t*1.35;const ang=i*.83;arr[i*3]=Math.cos(ang)*Math.min(.72,exp*(.2+(i%17)/17));arr[i*3+1]=1.92-t*1.25+Math.sin(i*1.7)*.35*exp;arr[i*3+2]=Math.sin(ang)*Math.min(.65,exp*(.15+(i%11)/11));}
    else{arr[i*3]=.2+((seed*2.2+t*2.4)%2.2);arr[i*3+1]=1.5+((seed+t)%1)*1.3+wob;arr[i*3+2]=Math.sin(i*1.4)*.4;}
  }cParticles.geometry.attributes.position.needsUpdate=true;
}

// ---------- UI ----------
function bindUI(){
  buildSystemCards();
  $('startEngine').onclick=()=>{running=true;controls.autoRotate=false;$('toggleRun').classList.add('active');$('toggleRun').textContent='❚❚ Running';$('explorer').scrollIntoView({behavior:'smooth',block:'start'});};
  $('toggleRun').onclick=()=>{running=!running;controls.autoRotate=!running;$('toggleRun').classList.toggle('active',running);$('toggleRun').textContent=running?'❚❚ Running':'▶ Run';};
  $('explodeBtn').onclick=()=>{exploded=!exploded;$('explodeBtn').classList.toggle('active',exploded);};
  $('xrayBtn').onclick=()=>{xray=!xray;if(xray)cutaway=false;applyVisualModes();};
  $('cutawayBtn').onclick=()=>{cutaway=!cutaway;if(cutaway)xray=false;applyVisualModes();};
  $('labelsBtn').onclick=toggleLabels;$('labelsTop').onclick=toggleLabels;
  $('resetBtn').onclick=resetView;$('resetTop').onclick=resetView;
  $('focusInternals').onclick=()=>{cutaway=true;xray=false;controls.autoRotate=false;camera.position.set(7.2,4.5,8.2);controls.target.set(0,.2,0);applyVisualModes();};
  $('isolateBtn').onclick=()=>{if(!selectedSystem)return;isolated=!isolated;$('isolateBtn').textContent=isolated?'Show All':'Isolate';applyVisualModes();};
  $('combPlay').onclick=()=>{combAuto=!combAuto;combTarget=null;$('combPlay').classList.toggle('active',combAuto);$('combPlay').textContent=combAuto?'❚❚ Auto':'▶ Auto';};
  $('combPrev').onclick=()=>{const p=(phaseFromDegree(combDegree)+3)%4;setCombPhase(p);};$('combNext').onclick=()=>{const p=(phaseFromDegree(combDegree)+1)%4;setCombPhase(p);};
  document.querySelectorAll('.phase-tabs button').forEach(b=>b.onclick=()=>setCombPhase(+b.dataset.phase));
}
function toggleLabels(){labelsVisible=!labelsVisible;applyVisualModes();}

function animate(){requestAnimationFrame(animate);const dt=Math.min(.033,clock.getDelta());updateMechanicalAnimation(dt);controls.update();renderer.render(scene,camera);labelRenderer.render(scene,camera);const cdt=Math.min(.033,cClock.getDelta());updateCombustion(cdt);}

function failGracefully(err){console.error(err);const load=$('loading');if(load){load.innerHTML='<strong>3D ENGINE COULD NOT START</strong><span>Reload the page or enable WebGL in your browser.</span>';load.style.color='#ff8e8e';}}

try{
  if(!window.THREE)throw new Error('Three.js failed to load');setupMainScene();setupCombustion();bindUI();applyVisualModes();animate();
}catch(err){failGracefully(err);}
})();