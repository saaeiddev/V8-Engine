(() => {
'use strict';

if (!window.THREE || !THREE.WebGLRenderer) return;

const DEG = Math.PI / 180;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const firingOrder = [1, 8, 4, 3, 6, 5, 7, 2];
const DEMO_RPM = 30;

const state = {
  ready: false,
  scene: null,
  lastTime: performance.now(),
  cycle: 0,
  rpm: 0,
  crankRotor: null,
  flywheelRotor: null,
  camRotor: null,
  timingCrank: null,
  timingCam: null,
  pistonUnits: [],
  valveUnits: [],
  sparkUnits: [],
  labelsBound: false
};

function findNamed(scene, name) {
  let hit = null;
  scene.traverse(obj => {
    if (!hit && obj.name === name) hit = obj;
  });
  return hit;
}

function recenterRotor(group, pivotY, childShiftY) {
  if (!group || group.userData.v8PivotFixed) return;
  group.children.forEach(child => { child.position.y += childShiftY; });
  group.position.y = pivotY;
  group.userData.v8PivotFixed = true;
}

function valveLift(cycle, start, span) {
  const rel = (cycle - start + 720) % 720;
  if (rel >= span) return 0;
  const t = rel / span;
  const s = Math.sin(Math.PI * t);
  return s * s;
}

function bindTrackingLabels(scene) {
  if (state.labelsBound) return;
  const systems = {};
  scene.traverse(obj => {
    if (obj.name && [
      'Engine Block','Cylinder Heads','Pistons & Rods','Crankshaft','Valvetrain',
      'Intake System','Fuel System','Ignition','Exhaust Headers','Cooling System',
      'Lubrication','Timing Drive','Accessories','Flywheel'
    ].includes(obj.name)) systems[obj.name] = obj;
  });

  const labels = [];
  scene.traverse(obj => {
    if (obj.element && obj.element.classList && obj.element.classList.contains('engine-label')) labels.push(obj);
  });

  labels.forEach(label => {
    const target = systems[label.userData.system];
    if (!target || label.parent === target) return;
    // attach() preserves the current visual position while making the label inherit
    // every translation/rotation of the corresponding engine system (including Explode).
    target.attach(label);
    label.userData.trackingTarget = target;
    label.element.dataset.tracking = 'true';
  });

  state.labelsBound = true;
}

function initMainScene(scene) {
  const crankSystem = findNamed(scene, 'Crankshaft');
  const pistonSystem = findNamed(scene, 'Pistons & Rods');
  const flywheelSystem = findNamed(scene, 'Flywheel');
  const valveSystem = findNamed(scene, 'Valvetrain');
  const timingSystem = findNamed(scene, 'Timing Drive');
  const ignitionSystem = findNamed(scene, 'Ignition');
  if (!crankSystem || !pistonSystem || !flywheelSystem || !valveSystem) return false;

  state.scene = scene;
  state.crankRotor = crankSystem.children.find(o => o.isGroup) || null;
  state.flywheelRotor = flywheelSystem.children.find(o => o.isGroup) || null;
  state.camRotor = valveSystem.children.find(o => o.isGroup) || null;

  recenterRotor(state.crankRotor, -0.72, +0.72);
  recenterRotor(state.flywheelRotor, -0.72, +0.72);
  recenterRotor(state.camRotor, +0.32, -0.32);

  if (timingSystem) {
    const discs = timingSystem.children.filter(o => o.isMesh && o.geometry && o.geometry.type === 'CylinderGeometry');
    state.timingCrank = discs[0] || null;
    state.timingCam = discs[1] || null;
  }

  const pistonBanks = pistonSystem.children.filter(o => o.isGroup && Math.abs(o.rotation.z) > 0.5);
  pistonBanks.forEach(bank => {
    const sign = Math.sign(bank.rotation.z) || 1;
    for (let idx = 0; idx < 4; idx++) {
      const base = idx * 4;
      const piston = bank.children[base];
      const pin = bank.children[base + 1];
      const rod = bank.children[base + 2];
      const cap = bank.children[base + 3];
      if (!piston || !pin || !rod || !cap) continue;
      state.pistonUnits.push({
        bank, sign, idx,
        z: [-2.25, -0.75, 0.75, 2.25][idx],
        piston, pin, rod, cap,
        rodBaseLength: rod.geometry?.parameters?.height || 1.22
      });
    }
  });

  const valveBanks = valveSystem.children.filter(o => o.isGroup && o !== state.camRotor && Math.abs(o.rotation.z) > 0.5);
  valveBanks.forEach(bank => {
    const sign = Math.sign(bank.rotation.z) || 1;
    for (let idx = 0; idx < 4; idx++) {
      const base = idx * 6;
      const intakeRocker = bank.children[base + 2];
      const exhaustRocker = bank.children[base + 3];
      const intakeValve = bank.children[base + 4];
      const exhaustValve = bank.children[base + 5];
      if (!intakeValve?.isGroup || !exhaustValve?.isGroup) continue;
      const cylinderNumber = sign < 0 ? idx + 1 : idx + 5;
      const firingIndex = firingOrder.indexOf(cylinderNumber);
      state.valveUnits.push({
        offset: (720 - firingIndex * 90) % 720,
        intakeValve,
        exhaustValve,
        intakeRocker,
        exhaustRocker,
        intakeRockerBase: intakeRocker?.rotation?.z || 0,
        exhaustRockerBase: exhaustRocker?.rotation?.z || 0
      });
    }
  });

  if (ignitionSystem) {
    const sparkBanks = ignitionSystem.children.filter(o => o.isGroup && Math.abs(o.rotation.z) > 0.5);
    sparkBanks.forEach(bank => {
      const sign = Math.sign(bank.rotation.z) || 1;
      bank.children.filter(o => o.isGroup).forEach((plug, idx) => {
        const tip = plug.children.find(o => o.isMesh && o.material && 'emissiveIntensity' in o.material);
        if (!tip) return;
        const cylinderNumber = sign < 0 ? idx + 1 : idx + 5;
        const firingIndex = firingOrder.indexOf(cylinderNumber);
        state.sparkUnits.push({tip, offset: (720 - firingIndex * 90) % 720});
      });
    });
  }

  bindTrackingLabels(scene);
  state.lastTime = performance.now();
  state.ready = true;
  return true;
}

function updateMainScene() {
  const now = performance.now();
  const dt = Math.min(0.04, Math.max(0, (now - state.lastTime) / 1000));
  state.lastTime = now;

  const runButton = document.getElementById('toggleRun');
  const running = !!runButton && /Running/i.test(runButton.textContent || '');
  const targetRpm = running ? DEMO_RPM : 0;
  state.rpm = lerp(state.rpm, targetRpm, 1 - Math.exp(-dt * 1.35));
  if (state.rpm > 0.02) state.cycle = (state.cycle + state.rpm / 60 * 360 * dt) % 720;

  const rpmReadout = document.getElementById('rpmReadout');
  if (rpmReadout) rpmReadout.textContent = String(Math.round(state.rpm));

  const crankAngle = (state.cycle % 360) * DEG;
  if (state.crankRotor) state.crankRotor.rotation.z = -crankAngle;
  if (state.flywheelRotor) state.flywheelRotor.rotation.z = -crankAngle;
  if (state.camRotor) state.camRotor.rotation.z = -(state.cycle * 0.5) * DEG;
  if (state.timingCrank) state.timingCrank.rotation.z = -crankAngle;
  if (state.timingCam) state.timingCam.rotation.z = -(state.cycle * 0.5) * DEG;

  const crankCenterY = -0.72;
  const throwRadius = 0.34;
  const rodLength = 1.75;

  state.pistonUnits.forEach(u => {
    const bankAngle = u.sign * 45 * DEG;
    const throwBase = (u.idx % 2 ? 90 : 0) * DEG;
    const throwAngle = throwBase - crankAngle;

    const crankX = throwRadius * Math.cos(throwAngle);
    const crankY = crankCenterY + throwRadius * Math.sin(throwAngle);

    const c = Math.cos(bankAngle), s = Math.sin(bankAngle);
    const pinX = c * crankX + s * crankY;
    const pinY = -s * crankX + c * crankY;

    const horizontal = clamp(pinX, -rodLength + 0.001, rodLength - 0.001);
    const wristY = pinY + Math.sqrt(Math.max(0.001, rodLength * rodLength - horizontal * horizontal));
    const pistonY = wristY + 0.08;

    u.piston.position.set(0, pistonY, u.z);
    u.pin.position.set(0, wristY, u.z);

    // A tiny bank-dependent Z offset keeps opposite-bank rod big ends visually separated.
    const crankZ = u.z + u.sign * 0.075;
    const top = new THREE.Vector3(0, wristY, u.z);
    const bottom = new THREE.Vector3(pinX, pinY, crankZ);
    const dir = top.clone().sub(bottom);
    const length = Math.max(0.001, dir.length());
    const mid = top.clone().add(bottom).multiplyScalar(0.5);

    u.rod.position.copy(mid);
    u.rod.scale.set(1, length / u.rodBaseLength, 1);
    u.rod.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    u.cap.position.set(pinX, pinY, crankZ);
    u.cap.rotation.set(Math.PI / 2, 0, 0);
  });

  state.valveUnits.forEach(v => {
    const cyc = (state.cycle + v.offset) % 720;
    const intake = valveLift(cyc, 710, 200);
    const exhaust = valveLift(cyc, 525, 190);
    v.intakeValve.position.y = -0.16 * intake;
    v.exhaustValve.position.y = -0.16 * exhaust;
    if (v.intakeRocker) v.intakeRocker.rotation.z = v.intakeRockerBase - intake * 5.5 * DEG;
    if (v.exhaustRocker) v.exhaustRocker.rotation.z = v.exhaustRockerBase + exhaust * 5.5 * DEG;
  });

  state.sparkUnits.forEach(s => {
    const cyc = (state.cycle + s.offset) % 720;
    const distance = Math.min(Math.abs(cyc - 358), 720 - Math.abs(cyc - 358));
    const pulse = clamp(1 - distance / 12, 0, 1);
    s.tip.material.emissiveIntensity = pulse * 4.5;
    s.tip.scale.setScalar(1 + pulse * 0.55);
  });

  // Ensure labels stay parented to their actual systems even after resets/mode changes.
  if (!state.labelsBound) bindTrackingLabels(state.scene);
}

const originalRender = THREE.WebGLRenderer.prototype.render;
THREE.WebGLRenderer.prototype.render = function(scene, camera) {
  try {
    if (!state.ready) initMainScene(scene);
    if (state.ready && scene === state.scene) updateMainScene();
  } catch (err) {
    console.warn('[V8 slow motion + tracking labels]', err);
  }
  return originalRender.call(this, scene, camera);
};
})();