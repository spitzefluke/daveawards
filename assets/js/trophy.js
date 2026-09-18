import * as THREE from 'https://unpkg.com/three@0.169.0/build/three.module.js';

/* ---------- Studio: bright softboxes + window strips give glass its streak highlights ---------- */
function envScene() {
  const s = new THREE.Scene();
  const panel = (color, intensity, w, h, pos, rot) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide })
    );
    m.position.set(pos[0], pos[1], pos[2]);
    m.rotation.set(rot[0], rot[1], rot[2]);
    return m;
  };
  // overhead softbox
  s.add(panel(0xffffff, 5.0, 13, 7, [0, 8.5, 0.5], [Math.PI / 2, 0, 0]));
  // key + fill side boxes
  s.add(panel(0xffffff, 3.4, 6, 11, [-8.5, 2.2, 1.5], [0, Math.PI / 2, 0]));
  s.add(panel(0xf7fbff, 1.9, 6, 11, [8.5, 1.8, 1.5], [0, -Math.PI / 2, 0]));
  // narrow window strips — the long vertical glints in the glass
  s.add(panel(0xffffff, 9.0, 0.55, 9, [-3.1, 2.4, 8.5], [0, Math.PI, 0]));
  s.add(panel(0xffffff, 6.0, 0.35, 9, [2.4, 2.0, 8.5], [0, Math.PI, 0]));
  s.add(panel(0xffffff, 4.0, 0.25, 7, [4.6, 2.0, 7.0], [0, Math.PI, 0.2]));
  // back bounce + dark floor so the lower half has something to refract
  s.add(panel(0xeef2f5, 1.5, 14, 10, [0, 1.5, -9.5], [0, 0, 0]));
  s.add(panel(0x14181b, 1.0, 18, 18, [0, -7.5, 0], [-Math.PI / 2, 0, 0]));
  return s;
}

/* ---------- Micro-imperfections: real glass is never perfectly smooth ---------- */
function imperfectionMaps() {
  const S = 512;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  g.fillStyle = '#0b0b0b';
  g.fillRect(0, 0, S, S);
  // soft smudge blobs
  for (let i = 0; i < 90; i++) {
    const x = Math.random() * S, y = Math.random() * S, r = 8 + Math.random() * 54;
    const grd = g.createRadialGradient(x, y, 0, x, y, r);
    const a = 0.05 + Math.random() * 0.16;
    grd.addColorStop(0, `rgba(255,255,255,${a})`);
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd;
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }
  // faint fingerprint-ish streaks
  g.globalAlpha = 0.1;
  g.strokeStyle = '#fff';
  for (let i = 0; i < 26; i++) {
    g.lineWidth = 0.6 + Math.random() * 1.6;
    g.beginPath();
    const x = Math.random() * S, y = Math.random() * S;
    g.arc(x, y, 12 + Math.random() * 40, Math.random() * 6, Math.random() * 6 + 1.5);
    g.stroke();
  }
  g.globalAlpha = 1;

  const rough = new THREE.CanvasTexture(c);
  rough.wrapS = rough.wrapT = THREE.RepeatWrapping;
  rough.repeat.set(2, 2);

  // very shallow normal map from the same noise for subtle surface waviness
  const n = document.createElement('canvas');
  n.width = n.height = S;
  const ng = n.getContext('2d');
  ng.drawImage(c, 0, 0);
  const img = ng.getImageData(0, 0, S, S);
  const out = ng.createImageData(S, S);
  const at = (x, y) => img.data[((y + S) % S * S + (x + S) % S) * 4];
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) / 255;
      const dy = (at(x, y + 1) - at(x, y - 1)) / 255;
      const i = (y * S + x) * 4;
      out.data[i] = 128 + dx * 26;
      out.data[i + 1] = 128 + dy * 26;
      out.data[i + 2] = 255;
      out.data[i + 3] = 255;
    }
  }
  ng.putImageData(out, 0, 0);
  const normal = new THREE.CanvasTexture(n);
  normal.wrapS = normal.wrapT = THREE.RepeatWrapping;
  normal.repeat.set(2, 2);

  return { rough, normal };
}

/* ---------- Soft contact shadow so the piece sits on something ---------- */
function shadowTexture() {
  const S = 256;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  grd.addColorStop(0, 'rgba(0,0,0,0.62)');
  grd.addColorStop(0.42, 'rgba(0,0,0,0.3)');
  grd.addColorStop(0.72, 'rgba(0,0,0,0.08)');
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, S, S);
  // a brighter core where the base focuses light — a hint of caustic
  const cg = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S * 0.17);
  cg.addColorStop(0, 'rgba(255,255,255,0.5)');
  cg.addColorStop(1, 'rgba(255,255,255,0)');
  g.globalCompositeOperation = 'lighter';
  g.fillStyle = cg;
  g.fillRect(0, 0, S, S);
  return new THREE.CanvasTexture(c);
}

function boot(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  scene.environment = pmrem.fromScene(envScene(), 0.015).texture;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0.55, 10.2);
  camera.lookAt(0, 0.15, 0);

  const { rough, normal } = imperfectionMaps();

  /* Optical crystal: no clearcoat (real glass has no coating), a whisper of the
     green cast that all thick glass has, and micro-roughness from the maps. */
  const crystal = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transmission: 1,
    thickness: 1.7,
    roughness: 0.035,
    roughnessMap: rough,
    normalMap: normal,
    normalScale: new THREE.Vector2(0.09, 0.09),
    ior: 1.52,
    dispersion: 0.22,
    metalness: 0,
    specularIntensity: 1,
    envMapIntensity: 1.15,
    attenuationColor: new THREE.Color(0xdcefe6),
    attenuationDistance: 9.0,
    side: THREE.DoubleSide
  });

  // Cut base: same glass, thicker body and crisper facets
  const cut = crystal.clone();
  cut.thickness = 3.4;
  cut.roughness = 0.028;
  cut.dispersion = 0.34;
  cut.flatShading = true;
  cut.needsUpdate = true;

  const P = (x, y) => new THREE.Vector2(x, y);

  /* Bowl — outer wall, rounded-over rim, inner wall back down: real wall thickness. */
  const bowl = new THREE.Mesh(new THREE.LatheGeometry([
    P(0.00, 1.32), P(0.38, 1.34), P(0.55, 1.45), P(0.72, 1.72), P(0.89, 2.10),
    P(1.03, 2.52), P(1.12, 2.88), P(1.165, 3.10), P(1.185, 3.20),
    P(1.175, 3.255), P(1.145, 3.275), P(1.105, 3.26),
    P(1.085, 3.20), P(1.055, 3.06), P(0.975, 2.74), P(0.855, 2.34),
    P(0.70, 1.92), P(0.545, 1.60), P(0.43, 1.46), P(0.33, 1.40), P(0.00, 1.39)
  ], 192), crystal);
  bowl.name = 'bowl';

  /* Stem with a faceted knop and a chamfered collar. */
  const stem = new THREE.Mesh(new THREE.LatheGeometry([
    P(0.00, 0.60), P(0.62, 0.62), P(0.58, 0.72), P(0.40, 0.80),
    P(0.325, 0.92), P(0.40, 1.02), P(0.475, 1.085), P(0.44, 1.14),
    P(0.365, 1.20), P(0.40, 1.27), P(0.585, 1.33), P(0.60, 1.39), P(0.00, 1.40)
  ], 32), cut);
  stem.name = 'stem';

  /* Plinth: chamfered, twelve-sided cut-crystal block. */
  const plinth = new THREE.Mesh(new THREE.LatheGeometry([
    P(0.00, 0.00), P(1.12, 0.00), P(1.30, 0.10), P(1.30, 0.44),
    P(1.16, 0.55), P(0.90, 0.58), P(0.74, 0.62), P(0.00, 0.62)
  ], 12), cut);
  plinth.name = 'plinth';

  /* Handles — drawn glass loops, slightly tapered by scale. */
  const handleGeo = new THREE.TorusGeometry(0.5, 0.072, 40, 160, Math.PI * 1.12);
  const hL = new THREE.Mesh(handleGeo, crystal);
  hL.position.set(-1.05, 2.44, 0); hL.rotation.set(0, 0, -0.66); hL.scale.set(1, 1.08, 1); hL.name = 'handle-left';
  const hR = new THREE.Mesh(handleGeo, crystal);
  hR.position.set(1.05, 2.44, 0); hR.rotation.set(0, Math.PI, 0.66); hR.scale.set(1, 1.08, 1); hR.name = 'handle-right';

  const trophy = new THREE.Group();
  trophy.name = 'DaveAwards-Trophy';
  trophy.add(plinth, stem, bowl, hL, hR);
  trophy.position.y = -1.95;

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(4.6, 4.6),
    new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, opacity: 0.55, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -1.97;
  shadow.name = 'contact-shadow';

  const pivot = new THREE.Group();
  pivot.add(trophy);
  scene.add(pivot, shadow);

  /* Specular sparkle — small, bright, moving: reads as a real studio. */
  const l1 = new THREE.PointLight(0xffffff, 26, 26); l1.position.set(3.4, 4.4, 4.6);
  const l2 = new THREE.PointLight(0xfff4e2, 13, 24); l2.position.set(-4.4, 1.6, 3.2);
  const l3 = new THREE.PointLight(0xeaf6ff, 10, 22); l3.position.set(0, -2.2, 4.8);
  scene.add(l1, l2, l3, new THREE.AmbientLight(0xffffff, 0.28));

  let targetScroll = 0, scroll = 0, pxT = 0, pyT = 0, px = 0, py = 0;
  const onScroll = () => { targetScroll = window.scrollY || 0; };
  const onMove = (e) => {
    pxT = (e.clientX / (innerWidth || 1) - 0.5) * 2;
    pyT = (e.clientY / (innerHeight || 1) - 0.5) * 2;
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('pointermove', onMove, { passive: true });
  onScroll();

  let lastW = 0, lastH = 0;
  function sync() {
    const slot = document.getElementById('trophy-slot');
    if (!slot) { canvas.style.opacity = '0'; return; }
    const r = slot.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
    canvas.style.opacity = '1';
    canvas.style.left = (r.left + (window.scrollX || 0)) + 'px';
    canvas.style.top = (r.top + (window.scrollY || 0)) + 'px';
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    if (w !== lastW || h !== lastH) {
      lastW = w; lastH = h;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.fov = w > 520 ? 30 : 38;
      camera.updateProjectionMatrix();
    }
  }
  sync();

  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    sync();
    const t = clock.getElapsedTime();
    scroll += (targetScroll - scroll) * 0.08;
    px += (pxT - px) * 0.06;
    py += (pyT - py) * 0.06;

    /* Turntable: scroll drives rotation, mouse tilts, plus a slow idle spin.
       The piece stays seated — only a fraction of a millimetre of settle. */
    pivot.rotation.y = scroll * 0.0032 + t * 0.12 + px * 0.3;
    pivot.rotation.x = -py * 0.09 + Math.sin(t * 0.5) * 0.012;
    pivot.rotation.z = Math.sin(t * 0.37) * 0.008;
    pivot.position.y = Math.sin(t * 0.7) * 0.035 - scroll * 0.0005;

    shadow.position.y = -1.985 + pivot.position.y * 0.1;
    const lift = 1 + Math.max(0, pivot.position.y) * 0.5;
    shadow.scale.setScalar(lift);
    shadow.material.opacity = 0.55 / lift;

    l1.position.x = Math.cos(t * 0.4) * 4.6;
    l1.position.z = Math.sin(t * 0.4) * 4.6 + 1;
    l2.position.x = Math.cos(t * 0.27 + 2) * 4.8;
    l2.position.z = Math.sin(t * 0.27 + 2) * 3.8 + 1;

    renderer.render(scene, camera);
  });
}

function mount() {
  if (window.__trophyMounted) return true;
  const slot = document.getElementById('trophy-slot');
  if (!document.body || !slot || slot.getBoundingClientRect().width === 0) return false;
  const canvas = document.createElement('canvas');
  canvas.id = 'trophy-canvas';
  canvas.setAttribute('data-engine', 'three.js r169');
  canvas.style.cssText = 'position:absolute;left:0;top:0;pointer-events:none;z-index:2;opacity:0;transition:opacity .6s ease';
  document.body.appendChild(canvas);
  window.__trophyMounted = true;
  window.__trophyCanvas = canvas;
  boot(canvas);
  return true;
}

if (!mount()) {
  const iv = setInterval(() => { if (mount()) clearInterval(iv); }, 80);
  setTimeout(() => clearInterval(iv), 30000);
}

setInterval(() => {
  const c = window.__trophyCanvas;
  if (c && document.body && !c.isConnected) document.body.appendChild(c);
}, 1000);
