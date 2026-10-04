import * as THREE from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

const colors = { blue: '#0075F2', aqua: '#51D6FF', gold: '#C5A059', charcoal: '#1F2421', mahogany: '#5C2C23', paper: '#f3f0e8' };
const base = import.meta.env.BASE_URL;
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const mat = (color, metalness = 0, roughness = .55) => new THREE.MeshStandardMaterial({ color, metalness, roughness });
function mesh(geometry, material, parent, position = [0, 0, 0]) {
  const m = new THREE.Mesh(geometry, material); m.position.set(...position); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}
function studio(container, dark = false) {
  const scene = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(dark ? colors.charcoal : colors.paper, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = dark ? 1.1 : 1.2;
  container.prepend(renderer.domElement);
  renderer.domElement.setAttribute('aria-hidden', 'true');
  scene.add(new THREE.HemisphereLight('#fff9e8', dark ? '#626b76' : '#b3bac1', dark ? 1.5 : 2.2));
  const key = new THREE.DirectionalLight('#fff5db', dark ? 2.6 : 4.5); key.position.set(-4, 8, 6); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); key.shadow.camera.left = -15; key.shadow.camera.right = 15; key.shadow.camera.top = 15; key.shadow.camera.bottom = -15;
  key.shadow.normalBias = .04; key.shadow.bias = -.0001; scene.add(key);
  const fill = new THREE.DirectionalLight('#cbdfff', 2.3); fill.position.set(5, 2, -4); scene.add(fill);
  let camera, frame, disposed = false;
  const observer = new ResizeObserver(() => {
    if (!camera) return;
    const w = container.clientWidth, h = container.clientHeight;
    renderer.setSize(w, h);
    if (camera.isPerspectiveCamera) camera.aspect = w / h;
    else { const size = camera.userData.size || 10; camera.left = -size * w / h; camera.right = size * w / h; camera.top = size; camera.bottom = -size; }
    camera.updateProjectionMatrix();
  });
  observer.observe(container);
  return { scene, renderer, setCamera(c) { camera = c; observer.unobserve(container); observer.observe(container); },
    loop(fn) { let last = 0; function tick(time) { if (disposed) return; frame = requestAnimationFrame(tick); if (document.hidden || time - last < 30) return; const dt = Math.min((time - last) / 1000, .05); last = time; fn(time / 1000, dt); renderer.render(scene, camera); } frame = requestAnimationFrame(tick); },
    dispose() { disposed = true; cancelAnimationFrame(frame); observer.disconnect(); scene.traverse(o => { o.geometry?.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose()); }); renderer.dispose(); renderer.domElement.remove(); },
    get disposed() { return disposed; }
  };
}

function orbitObject(type) {
  const group = new THREE.Group(), blue = mat(colors.blue, .18, .3), gold = mat(colors.gold, .72, .28), paper = mat('#fffaf0');
  if (type === 'projects') {
    for (let i = 0; i < 3; i++) { const cube = mesh(new THREE.BoxGeometry(.46, .46, .46), blue, group, [(i - 1) * .28, i * .22, 0]); cube.rotation.set(.2, .2 + i * .3, .2); }
    mesh(new THREE.SphereGeometry(.16, 24, 24), gold, group, [.5, .15, .2]);
  } else if (type === 'research') {
    for (let i = 0; i < 4; i++) { const page = mesh(new THREE.BoxGeometry(.7, .045, .92), i === 0 ? blue : paper, group, [i * .045, i * .08, 0]); page.rotation.y = -.25 + i * .12; }
    for (let i = 0; i < 5; i++) mesh(new THREE.BoxGeometry(.44 - i * .035, .009, .013), mat('#7c8e9c'), group, [.1, .269, -.27 + i * .09]);
    group.rotation.x = .6;
  } else if (type === 'equity') {
    const ring = mesh(new THREE.TorusGeometry(.36, .085, 18, 64), gold, group); ring.rotation.y = .45;
    const ring2 = mesh(new THREE.TorusGeometry(.36, .085, 18, 64), blue, group, [.35, .06, 0]); ring2.rotation.y = -.6;
  } else {
    mesh(new THREE.CylinderGeometry(.48, .52, .14, 48), mat(colors.mahogany), group, [0, -.25, 0]);
    mesh(new THREE.TorusKnotGeometry(.26, .085, 80, 12, 2, 3), gold, group, [0, .18, 0]);
  }
  return group;
}

export async function createPortrait(container, { onReady, onError } = {}) {
  let s;
  try { s = studio(container); } catch (error) { onError?.(error); return { dispose() {} }; }
  const camera = new THREE.PerspectiveCamera(36, 1, .1, 80); camera.position.set(0, 4.4, innerWidth < 760 ? 14.8 : 13.2); camera.lookAt(0, .45, 0); s.setCamera(camera);
  const world = new THREE.Group(); s.scene.add(world);
  mesh(new THREE.CylinderGeometry(1.44, 1.5, .18, 96), mat('#e1dace', .05, .75), world, [0, -1.8, 0]);
  mesh(new THREE.CylinderGeometry(1.46, 1.46, .025, 96), mat(colors.gold, .65, .32), world, [0, -1.685, 0]);
  const shadow = mesh(new THREE.PlaneGeometry(70, 70), new THREE.ShadowMaterial({ opacity: .13 }), s.scene, [0, -1.91, 0]); shadow.rotation.x = -Math.PI / 2;
  const links = [...container.querySelectorAll('.orbit-link')];
  const paths = [
    { route: 'projects', a: 4.5, b: 2.4, phase: 3.7, tilt: .55 },
    { route: 'research', a: 4.5, b: 2.4, phase: 5.65, tilt: -.55 },
    { route: 'equity', a: 5.1, b: 3.2, phase: 2.45, tilt: -.3 },
    { route: 'gala', a: 5, b: 3.2, phase: .6, tilt: .5 },
  ];
  const orbits = paths.map((p, i) => {
    const points = Array.from({ length: 181 }, (_, k) => { const t = k / 180 * Math.PI * 2; return new THREE.Vector3(Math.cos(t) * p.a, Math.sin(t) * p.tilt, Math.sin(t) * p.b); });
    const ring = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: i % 2 ? '#b4b7ad' : colors.gold, transparent: true, opacity: .4 }));
    ring.position.y = -.3; world.add(ring);
    const object = orbitObject(p.route); world.add(object);
    return { ...p, object, link: links.find(l => l.dataset.route === p.route) };
  });
  let head, isPaused = reduced(), elapsed = 0, hover = false, dragging = false, previousX = 0, rotation = -.28;
  const rotationButton = container.parentElement.querySelector('[data-pause]');
  const updateButton = () => { rotationButton.textContent = isPaused ? '↻ Resume motion' : 'Ⅱ Pause motion'; rotationButton.setAttribute('aria-pressed', String(isPaused)); };
  updateButton(); rotationButton.onclick = () => { isPaused = !isPaused; updateButton(); };
  const onPointerDown = e => { if (e.target !== s.renderer.domElement) return; dragging = true; previousX = e.clientX; s.renderer.domElement.setPointerCapture(e.pointerId); };
  const onPointerMove = e => { if (dragging) { rotation += (e.clientX - previousX) * .009; previousX = e.clientX; } };
  const onPointerUp = () => { dragging = false; };
  s.renderer.domElement.addEventListener('pointerdown', onPointerDown); s.renderer.domElement.addEventListener('pointermove', onPointerMove); s.renderer.domElement.addEventListener('pointerup', onPointerUp); s.renderer.domElement.addEventListener('pointercancel', onPointerUp);
  links.forEach(link => { link.addEventListener('mouseenter', () => hover = true); link.addEventListener('mouseleave', () => hover = false); link.addEventListener('focus', () => hover = true); link.addEventListener('blur', () => hover = false); });
  const projection = new THREE.Vector3();
  s.loop((t, dt) => {
    const mobile = innerWidth < 760;
    world.scale.setScalar(1);
    camera.position.z = mobile ? 14.8 : 13.2; camera.lookAt(0, .45, 0);
    if (!isPaused && !hover && !dragging) { elapsed += dt; rotation += dt * .095; }
    if (head) head.rotation.y = rotation;
    for (const p of orbits) {
      const angle = p.phase + elapsed * .027;
      p.object.position.set(Math.cos(angle) * p.a * (mobile ? .65 : 1), Math.sin(angle) * p.tilt + .25, Math.sin(angle) * p.b * (mobile ? 1.12 : 1));
      p.object.scale.setScalar(mobile ? .87 : 1.28);
      p.object.rotation.y = elapsed * .18;
      p.object.updateWorldMatrix(true, false); p.object.getWorldPosition(projection); projection.project(camera);
      if (p.link) {
        const rect = container.getBoundingClientRect(), half = p.link.offsetWidth / 2;
        const x = (projection.x * .5 + .5) * rect.width;
        const minX = Math.max(half + 12, half + 12 - rect.left);
        const maxX = Math.min(rect.width - half - 12, innerWidth - rect.left - half - 12);
        p.link.style.left = `${Math.max(minX, Math.min(maxX, x))}px`;
        p.link.style.top = `${(-projection.y * .5 + .5) * 100}%`;
      }
    }
  });
  new STLLoader().load(`${base}head.stl`, geometry => {
    if (s.disposed) { geometry.dispose(); return; }
    geometry.deleteAttribute('normal'); geometry = mergeVertices(geometry); geometry.computeVertexNormals(); geometry.center(); geometry.computeBoundingBox();
    const size = geometry.boundingBox.getSize(new THREE.Vector3());
    // The supplied scan uses Z as its vertical axis.
    if (size.z > size.y * 1.12) geometry.rotateX(-Math.PI / 2);
    geometry.computeBoundingBox(); const corrected = geometry.boundingBox.getSize(new THREE.Vector3()); geometry.scale(5.05 / corrected.y, 5.05 / corrected.y, 5.05 / corrected.y);
    head = mesh(geometry, mat('#a9bfd0', .16, .42), world, [0, .85, 0]);
    head.name = 'Karthik original head.stl'; onReady?.(); container.dataset.loaded = 'true';
  }, undefined, onError);
  return { dispose: () => s.dispose(), reset() { rotation = -.28; elapsed = 0; } };
}

async function loadSculpture(id) {
  const materials = await new MTLLoader().setPath(`${base}models/`).loadAsync(`${id}.mtl`); materials.preload();
  const object = await new OBJLoader().setMaterials(materials).setPath(`${base}models/`).loadAsync(`${id}.obj`);
  // Batch meshes sharing a material. Large OBJ exports otherwise produce thousands of draw calls.
  object.updateMatrixWorld(true); const batches = new Map();
  object.traverse(child => {
    if (!child.isMesh || Array.isArray(child.material)) return;
    const geometry = child.geometry.clone().applyMatrix4(child.matrixWorld);
    geometry.deleteAttribute('uv');
    if (!geometry.attributes.normal) geometry.computeVertexNormals();
    const key = child.material.uuid;
    if (!batches.has(key)) batches.set(key, { geometries: [], material: child.material });
    batches.get(key).geometries.push(geometry);
  });
  const model = new THREE.Group();
  for (const { geometries, material } of batches.values()) {
    const merged = mergeGeometries(geometries.map(g => g.index ? g.toNonIndexed() : g));
    if (merged) mesh(merged, material, model);
    geometries.forEach(g => g.dispose());
  }
  object.traverse(child => child.geometry?.dispose());
  const bounds = new THREE.Box3().setFromObject(model), size = bounds.getSize(new THREE.Vector3()), center = bounds.getCenter(new THREE.Vector3());
  const factor = 3.3 / Math.max(size.x, size.y, size.z);
  model.scale.setScalar(factor); model.position.set(-center.x * factor, -bounds.min.y * factor, -center.z * factor);
  const group = new THREE.Group(); group.add(model); return group;
}

export async function createGallery(container, sculptures, onSelect) {
  let s;
  try { s = studio(container, true); } catch { container.querySelector('.scene-status').textContent = 'The 3D room needs WebGL. You can still read every piece below.'; return { dispose() {}, select() {}, overview() {} }; }
  const narrow = container.clientWidth < 650;
  const overviewPosition = narrow ? new THREE.Vector3(0, 36, 31) : new THREE.Vector3(0, 16.5, 16.5);
  const camera = new THREE.PerspectiveCamera(38, 1, .1, 100); camera.position.copy(overviewPosition); camera.lookAt(0, 0, 0); s.setCamera(camera);
  const controls = new OrbitControls(camera, s.renderer.domElement); controls.enableDamping = true; controls.enablePan = true; controls.maxPolarAngle = Math.PI / 2.15; controls.minDistance = 4; controls.maxDistance = 55; controls.target.set(0, 0, 0);
  const floor = mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshBasicMaterial({ color: colors.charcoal, toneMapped: false }), s.scene, [0, -.22, 0]); floor.rotation.x = -Math.PI / 2;
  const shadows = mesh(new THREE.PlaneGeometry(100, 100), new THREE.ShadowMaterial({ opacity: .25 }), s.scene, [0, -.21, 0]); shadows.rotation.x = -Math.PI / 2;
  const positions = [[-6.6, 0, -3.8], [-.5, 0, -5.3], [6.1, 0, -3.2], [8, 0, 2.8], [2.4, 0, 5.7], [-4.2, 0, 5.4], [-8, 0, 1.1]];
  const heights = [.85, 1.15, .55, 1.35, .65, .45, 1.6];
  const platforms = [], groups = [], rims = [], labels = [...container.querySelectorAll('.gallery-label')];
  const beamMat = mat(colors.gold, .7, .4);
  // An open rotunda: one continuous path, freestanding stone plinths, and low curved walls.
  const room = mesh(new THREE.CylinderGeometry(13.6, 13.8, .1, 128), mat('#354238', .1, .92), s.scene, [0, -.14, 0]);
  const routePoints = Array.from({ length: 100 }, (_, i) => { const a = i / 99 * Math.PI * 2; return new THREE.Vector3(Math.cos(a) * 11.4, -.075, Math.sin(a) * 8.7); });
  const pathLine = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(routePoints), new THREE.LineBasicMaterial({ color: colors.gold, transparent: true, opacity: .65 })); s.scene.add(pathLine);
  const wall = mesh(new THREE.CylinderGeometry(12.6, 12.6, 1.9, 90, 1, true, Math.PI * .62, Math.PI * .85), mat('#617165', .08, .9), s.scene, [0, .82, 0]); wall.material.side = THREE.DoubleSide;
  const wallCap = new THREE.CatmullRomCurve3(Array.from({ length: 65 }, (_, i) => { const a = Math.PI * .62 + i / 64 * Math.PI * .85; return new THREE.Vector3(Math.sin(a) * 12.6, 1.8, Math.cos(a) * 12.6); }));
  mesh(new THREE.TubeGeometry(wallCap, 100, .025, 8, false), beamMat, s.scene);
  const inscription = document.createElement('canvas'); inscription.width = 1024; inscription.height = 1024;
  const ctx = inscription.getContext('2d'); ctx.textAlign = 'center'; ctx.fillStyle = '#c5a059'; ctx.font = '24px Georgia'; ctx.fillText('K A R T H I K   S R I K U M A R', 512, 375); ctx.font = '92px Georgia'; ctx.fillText('Sculpture', 512, 510); ctx.fillText('studies', 512, 610); ctx.font = '22px Georgia'; ctx.fillText('S E V E N   O B J E C T S', 512, 695);
  const inscriptionTexture = new THREE.CanvasTexture(inscription); inscriptionTexture.colorSpace = THREE.SRGBColorSpace;
  const floorType = mesh(new THREE.PlaneGeometry(6.8, 6.8), new THREE.MeshBasicMaterial({ map: inscriptionTexture, transparent: true, depthWrite: false, toneMapped: false }), s.scene, [0, -.07, 0]); floorType.rotation.x = -Math.PI / 2;
  const glow = document.createElement('canvas'); glow.width = glow.height = 128; const gctx = glow.getContext('2d'), gradient = gctx.createRadialGradient(64, 64, 0, 64, 64, 64); gradient.addColorStop(0, 'rgba(230,210,161,.24)'); gradient.addColorStop(.6, 'rgba(230,210,161,.1)'); gradient.addColorStop(1, 'rgba(230,210,161,0)'); gctx.fillStyle = gradient; gctx.fillRect(0, 0, 128, 128); const poolTexture = new THREE.CanvasTexture(glow);
  positions.forEach((position, index) => {
    const height = heights[index], radius = index === 6 ? 1.65 : 2.06;
    const plinth = mesh(new THREE.CylinderGeometry(radius, radius + .07, height, index < 3 ? 8 : 72), mat(index % 2 ? '#bcb9a8' : '#d3cbb5', .08, .78), s.scene, [position[0], height / 2 - .075, position[2]]); plinth.userData.index = index; platforms.push(plinth);
    const rim = mesh(new THREE.TorusGeometry(radius + .015, .022, 8, 96), beamMat.clone(), s.scene, [position[0], height - .07, position[2]]); rim.rotation.x = -Math.PI / 2; rims.push(rim);
    const pool = mesh(new THREE.PlaneGeometry(7, 7), new THREE.MeshBasicMaterial({ map: poolTexture, transparent: true, depthWrite: false, toneMapped: false }), s.scene, [position[0], -.065, position[2]]); pool.rotation.x = -Math.PI / 2;
    const spot = new THREE.SpotLight('#ffe9b9', 40, 16, .43, .85, 1.5); spot.position.set(position[0] - 1.5, 8, position[2] + 2); spot.target.position.set(position[0], height, position[2]); s.scene.add(spot, spot.target);
  });
  let focusIndex = -1, destination = null, targetDestination = null;
  function select(index) {
    focusIndex = index; const p = new THREE.Vector3(...positions[index]);
    destination = p.clone().add(new THREE.Vector3(narrow ? 5.3 : 4.7, heights[index] + 4, narrow ? 8.4 : 6.3)); targetDestination = p.clone().add(new THREE.Vector3(0, heights[index] + 1.3, 0));
    rims.forEach((rim, i) => { rim.material.emissive.set(i === index ? colors.gold : '#000000'); rim.material.emissiveIntensity = i === index ? .12 : 0; });
    onSelect(index); labels.forEach((l, i) => l.classList.toggle('selected', i === index));
  }
  controls.addEventListener('start', () => { destination = null; });
  labels.forEach((label, i) => label.addEventListener('click', () => select(i)));
  const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2(); let down;
  s.renderer.domElement.addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; });
  s.renderer.domElement.addEventListener('pointerup', e => {
    if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) return;
    const box = container.getBoundingClientRect(); pointer.set((e.clientX - box.left) / box.width * 2 - 1, -(e.clientY - box.top) / box.height * 2 + 1); raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects([...platforms, ...groups], true)[0];
    if (hit) { let o = hit.object; while (o && o.userData.index === undefined) o = o.parent; if (o) select(o.userData.index); }
  });
  const v = new THREE.Vector3();
  s.loop(() => {
    if (destination) { camera.position.lerp(destination, reduced() ? 1 : .075); controls.target.lerp(targetDestination, reduced() ? 1 : .075); if (camera.position.distanceTo(destination) < .02) destination = null; }
    controls.update();
    labels.forEach((label, i) => { v.set(positions[i][0], heights[i] * .45, positions[i][2] + 2.25).project(camera); label.style.left = `${(v.x * .5 + .5) * 100}%`; label.style.top = `${(-v.y * .5 + .5) * 100}%`; label.hidden = v.z > 1 || (focusIndex !== -1 && focusIndex !== i); });
  });
  (async () => {
    let loaded = 0;
    for (let i = 0; i < sculptures.length; i++) {
      if (s.disposed) break;
      try {
        const group = await loadSculpture(sculptures[i].id);
        if (s.disposed) { group.traverse(o => o.geometry?.dispose()); break; }
        group.position.set(...positions[i]); group.position.y = heights[i] - .065; group.userData.index = i; s.scene.add(group); groups.push(group); loaded++;
        container.querySelector('.scene-status').textContent = loaded === 7 ? '' : `Placing sculptures · ${loaded} of 7`;
        container.dataset.loaded = String(loaded);
      } catch { container.querySelector('.scene-status').textContent = `Could not load ${sculptures[i].title}. The other pieces remain available.`; }
    }
  })();
  return { select, overview() { focusIndex = -1; destination = overviewPosition.clone(); targetDestination = new THREE.Vector3(0, 0, 0); labels.forEach(l => l.classList.remove('selected')); rims.forEach(rim => rim.material.emissiveIntensity = 0); }, dispose() { controls.dispose(); inscriptionTexture.dispose(); poolTexture.dispose(); s.dispose(); } };
}
