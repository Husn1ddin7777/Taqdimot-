import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/700.css';
import './style.css';
import imgErp from './img/erp.jpg';
import imgWaiter from './img/waiter.jpg';
import imgB2b from './img/b2b.jpg';
import imgIt from './img/it.jpg';

const V3 = THREE.Vector3;
const params = new URLSearchParams(location.search);
let lite = params.has('lite');

/* ---------- Renderer ---------- */
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;
const pr = () => (lite ? 1 : Math.min(window.devicePixelRatio || 1, 1.75));
renderer.setPixelRatio(pr());
renderer.setSize(innerWidth, innerHeight);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#160304');
scene.fog = new THREE.FogExp2('#1a0406', 0.022);

const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 700);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.75, 0.55, 0.86);
composer.addPass(bloom);
composer.addPass(new OutputPass());

/* ---------- Helpers ---------- */
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.05, ...o });
const hdr = (r, g, b, o = {}) => new THREE.MeshBasicMaterial({ color: new THREE.Color(r, g, b), ...o });
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const easeBack = (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const clamp01 = (x) => Math.max(0, Math.min(1, x));

function texFrom(c) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function wrap(g, text, maxW) { const out = []; let line = ''; for (const w of text.split(' ')) { const t = line ? line + ' ' + w : w; if (g.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t; } if (line) out.push(line); return out; }
function glowTex(inner = 'rgba(255,224,160,1)', mid = 'rgba(255,200,120,0.35)', outer = 'rgba(255,190,110,0)') {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, inner); gr.addColorStop(0.35, mid); gr.addColorStop(1, outer);
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return texFrom(c);
}
function panelTexture(title, desc) {
  const W = 768, H = 440, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 0, H); grd.addColorStop(0, 'rgba(84,16,22,0.94)'); grd.addColorStop(1, 'rgba(32,5,7,0.94)');
  rr(g, 6, 6, W - 12, H - 12, 36); g.fillStyle = grd; g.fill(); g.lineWidth = 4; g.strokeStyle = 'rgba(240,211,160,0.9)'; g.stroke();
  g.fillStyle = '#F0D3A0'; rr(g, 52, 56, 96, 10, 5); g.fill();
  g.fillStyle = '#FAF6F1'; g.font = '700 66px "DM Sans"'; g.fillText(title, 52, 156);
  g.fillStyle = '#E9DCD3'; g.font = '400 40px "DM Sans"'; wrap(g, desc, W - 104).forEach((l, i) => g.fillText(l, 52, 240 + i * 56));
  return texFrom(c);
}
function pillTexture(text, size = 72, fg = '#F0D3A0') {
  const c = document.createElement('canvas'), g = c.getContext('2d'); g.font = `700 ${size}px "DM Sans"`;
  const w = Math.ceil(g.measureText(text).width + size * 1.3), h = Math.ceil(size * 1.75); c.width = w; c.height = h;
  g.font = `700 ${size}px "DM Sans"`; rr(g, 4, 4, w - 8, h - 8, h / 2 - 4); g.fillStyle = 'rgba(42,7,9,0.8)'; g.fill();
  g.lineWidth = 3; g.strokeStyle = 'rgba(240,211,160,0.75)'; g.stroke(); g.fillStyle = fg; g.textBaseline = 'middle'; g.textAlign = 'center'; g.fillText(text, w / 2, h / 2 + 3);
  const t = texFrom(c); t.userData.aspect = w / h; return t;
}
function plainText(text, size, fg, spacing = 0) {
  const c = document.createElement('canvas'), g = c.getContext('2d'); const setF = () => { g.font = `700 ${size}px "DM Sans"`; if (spacing) g.letterSpacing = spacing + 'px'; };
  setF(); const w = Math.ceil(g.measureText(text).width + spacing * text.length + 24), h = Math.ceil(size * 1.4); c.width = w; c.height = h; setF();
  g.fillStyle = fg; g.textBaseline = 'middle'; g.textAlign = 'center'; g.fillText(text, w / 2, h / 2 + 2);
  const t = texFrom(c); t.userData.aspect = w / h; return t;
}
function textSprite(tex, height, opacity = 1) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, opacity, depthWrite: false }));
  s.scale.set(height * tex.userData.aspect, height, 1); return s;
}
function glowSprite(tex, scale, color = '#ffffff', opacity = 1) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }));
  s.scale.set(scale, scale, 1); return s;
}
function glowDecal(tex, size, pos, opacity) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.copy(pos); scene.add(m); return m;
}

/* ---------- Stations ---------- */
const H = new V3(0, 3.8, -18);                                    // hook frame (ERP picture)
const F = [new V3(24, 3.9, -20), new V3(48, 3.9, -20), new V3(72, 3.9, -20)]; // lesson frames
const E = new V3(96, 3.0, -20);                                   // ERP core
const U = new V3(120, 0, -20);                                    // foreign university

const lesson = (x) => ({ pos: new V3(x, 4.1, -3.4), tgt: new V3(x, 3.9, -20), shift: 0.22, fog: 0.02 });
const SLIDES = [
  { pos: new V3(0, 4.5, 24), tgt: new V3(0, 4.6, 0), shift: 0.22, fog: 0.022 },
  { pos: new V3(0, 4.1, -1.2), tgt: H.clone(), shift: 0.22, fog: 0.02 },
  { pos: new V3(48, 22, 24), tgt: new V3(48, 2.5, -20), shift: 0, fog: 0.007 },
  lesson(24), lesson(48), lesson(72),
  { pos: new V3(96, 5.6, -3.2), tgt: E.clone(), shift: 0.2, fog: 0.026 },
  { pos: new V3(3, 3.9, 19.5), tgt: new V3(0, 4.7, 0), shift: -0.2, fog: 0.022 },
  { pos: new V3(118.2, 3.0, -6), tgt: new V3(119.4, 2.6, -20), shift: 0, fog: 0.02 },
  { pos: new V3(60, 48, 66), tgt: new V3(60, -2, -18), shift: 0, fog: 0.005 },
];
const DOOR_VIA = [new V3(0, 2.9, 7), new V3(0, 2.6, 1.6), new V3(0, 2.8, -0.4)];

const anchors = {
  isft: new V3(0, 0.05, 3.6),
  m1: new V3(24, 0.6, -19.4), m2: new V3(48, 0.6, -19.4), m3: new V3(72, 0.6, -19.4),
  knock: new V3(117.4, 3.55, -18.9),
};

/* ---------- World ---------- */
const GLOW = glowTex();
const anim = {};
const stations = {};
const ALL = ['gate', 'hero', 'f1', 'f2', 'f3', 'erp', 'univ', 'path'];
const VIS = [['gate', 'path'], ['hero'], ['f1', 'f2', 'f3', 'path'], ['f1'], ['f2'], ['f3'], ['erp'], ['gate'], ['univ'], ALL];
function setVis(list) { for (const k in stations) stations[k].visible = list.includes(k); if (anim.path) anim.path.visible = list.includes('path'); }

function buildWorld() {
  scene.add(new THREE.HemisphereLight('#ffd9b0', '#1a0406', 0.5));
  const moon = new THREE.DirectionalLight('#a9bcd8', 0.7); moon.position.set(-20, 30, 25); scene.add(moon);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(800, 800), std('#2a0a0c', { roughness: 0.9, metalness: 0.15 }));
  ground.rotation.x = -Math.PI / 2; ground.position.set(48, 0, -20); scene.add(ground);
  const grid = new THREE.GridHelper(800, 400, '#D9B26A', '#D9B26A'); grid.material.transparent = true; grid.material.opacity = 0.045; grid.position.set(48, 0.01, -20); scene.add(grid);

  // stars
  {
    const n = 2000, p = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const r = 180 + Math.random() * 60, th = Math.random() * Math.PI * 2, ph = Math.random() * 1.35;
      p[i * 3] = 48 + r * Math.sin(ph) * Math.cos(th); p[i * 3 + 1] = 8 + r * Math.cos(ph); p[i * 3 + 2] = -20 + r * Math.sin(ph) * Math.sin(th); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    anim.stars = new THREE.Points(g, new THREE.PointsMaterial({ size: 1.3, map: GLOW, color: '#F6E4C6', transparent: true, opacity: 0.85, fog: false, depthWrite: false, blending: THREE.AdditiveBlending }));
    scene.add(anim.stars);
  }
  // dust
  {
    const n = 1100, p = new Float32Array(n * 3), s = new Float32Array(n);
    for (let i = 0; i < n; i++) { p[i * 3] = -20 + Math.random() * 135; p[i * 3 + 1] = Math.random() * 13; p[i * 3 + 2] = -36 + Math.random() * 68; s[i] = 0.12 + Math.random() * 0.35; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    anim.dust = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.14, map: GLOW, color: '#FFD99A', transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending }));
    anim.dustSpeed = s; scene.add(anim.dust);
  }

  const grab = (fn) => {
    const n = scene.children.length; fn(); const g = new THREE.Group();
    scene.children.slice(n).filter((k) => !k.isLight).forEach((k) => g.add(k)); scene.add(g); return g;
  };
  stations.gate = grab(buildGate);
  stations.hero = grab(() => buildFrame(H, imgErp, 0));
  stations.f1 = grab(() => buildFrame(F[0], imgWaiter, 1));
  stations.f2 = grab(() => buildFrame(F[1], imgB2b, 2));
  stations.f3 = grab(() => buildFrame(F[2], imgIt, 3));
  stations.erp = grab(buildERP);
  stations.univ = grab(buildUniversity);
  buildPath();

  [new V3(0, 0.02, -16), new V3(24, 0.02, -18), new V3(48, 0.02, -18), new V3(72, 0.02, -18), new V3(96, 0.02, -20), new V3(120, 0.02, -17), new V3(0, 0.95, 1.2)]
    .forEach((p, i) => glowDecal(GLOW, i === 6 ? 7 : 16, p, i === 6 ? 0.55 : 0.26));
}

function buildGate() {
  const gate = new THREE.Group(); scene.add(gate);
  const stone = std('#EDE2D8', { roughness: 0.55 });
  const stone2 = std('#CDBAB0', { roughness: 0.7 });
  const red = std('#7A1820', { roughness: 0.6 });
  const redDark = std('#5E141B', { roughness: 0.75 });
  const add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); gate.add(m); return m; };

  add(new THREE.BoxGeometry(11.6, 0.9, 3.75), stone2, 0, 0.45, -0.025);
  add(new THREE.BoxGeometry(10.8, 0.6, 0.7), stone2, 0, 0.3, 2.2);
  add(new THREE.BoxGeometry(11.4, 0.3, 0.7), std('#B9A39B', { roughness: 0.75 }), 0, 0.15, 2.9);

  const colGeo = new THREE.CylinderGeometry(0.32, 0.36, 5.0, 18, 1);
  const colMat = std('#F1E7DD', { roughness: 0.45, flatShading: true });
  for (const x of [-4.4, -2.9, 2.9, 4.4]) {
    add(new THREE.BoxGeometry(0.95, 0.25, 0.95), stone, x, 1.025, 1.1);
    add(colGeo, colMat, x, 3.65, 1.1);
    add(new THREE.BoxGeometry(1.02, 0.28, 1.02), stone, x, 6.29, 1.1);
  }
  add(new THREE.BoxGeometry(11.6, 1.0, 3.6), red, 0, 6.93, -0.1);
  add(new THREE.BoxGeometry(12.2, 0.25, 3.9), stone, 0, 7.555, -0.1);
  // pediment
  const tri = new THREE.Shape(); tri.moveTo(-6.1, 0); tri.lineTo(6.1, 0); tri.lineTo(0, 2.3); tri.lineTo(-6.1, 0);
  const ped = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: 3.4, bevelEnabled: false }), red); ped.position.set(0, 7.68, -1.8); gate.add(ped);
  const tri2 = new THREE.Shape(); tri2.moveTo(-4.9, 0); tri2.lineTo(4.9, 0); tri2.lineTo(0, 1.75); tri2.lineTo(-4.9, 0);
  const ped2 = new THREE.Mesh(new THREE.ExtrudeGeometry(tri2, { depth: 0.08, bevelEnabled: false }), std('#8E2530')); ped2.position.set(0, 7.86, 1.6); gate.add(ped2);
  const emblem = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.05, 12, 48), hdr(1.8, 1.35, 0.7)); emblem.position.set(0, 8.55, 1.72); gate.add(emblem);
  // plaque text
  const pt = plainText('ISFT', 120, '#F0D3A0', 36);
  const plaque = new THREE.Mesh(new THREE.PlaneGeometry(0.75 * pt.userData.aspect, 0.75), new THREE.MeshBasicMaterial({ map: pt, transparent: true, color: new THREE.Color(1.5, 1.4, 1.2) }));
  plaque.position.set(0, 6.93, 1.712); gate.add(plaque);

  // wall with arched notch
  const w = new THREE.Shape();
  w.moveTo(-5.2, 0); w.lineTo(-1.45, 0); w.lineTo(-1.45, 3); w.absarc(0, 3, 1.45, Math.PI, 0, true); w.lineTo(1.45, 0); w.lineTo(5.2, 0); w.lineTo(5.2, 5.6); w.lineTo(-5.2, 5.6); w.lineTo(-5.2, 0);
  const wall = new THREE.Mesh(new THREE.ExtrudeGeometry(w, { depth: 0.6, bevelEnabled: false }), redDark); wall.position.set(0, 0.9, -1.6); gate.add(wall);
  // arch trim
  const ap = new THREE.Path(); ap.moveTo(-1.45, 0); ap.lineTo(-1.45, 3); ap.absarc(0, 3, 1.45, Math.PI, 0, true); ap.lineTo(1.45, 0);
  const pts = ap.getSpacedPoints(140).map((p) => new V3(p.x, p.y + 0.9, -0.97));
  gate.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 220, 0.07, 8, false), hdr(2.0, 1.5, 0.75)));
  // door glow
  const gs = new THREE.Shape(); gs.moveTo(-1.45, 0); gs.lineTo(1.45, 0); gs.lineTo(1.45, 3); gs.absarc(0, 3, 1.45, 0, Math.PI, false); gs.lineTo(-1.45, 0);
  anim.doorGlow = new THREE.Mesh(new THREE.ShapeGeometry(gs, 32), hdr(2.0, 1.4, 0.68, { transparent: true }));
  anim.doorGlow.position.set(0, 0.9, -1.35); gate.add(anim.doorGlow);
  // open leaves
  const leafMat = std('#6B3A1F', { emissive: '#4a2208', emissiveIntensity: 0.6, roughness: 0.7 });
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group(); pivot.position.set(s * 1.45, 0.9, -1.05); pivot.rotation.y = s * -1.12; gate.add(pivot);
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(1.42, 3.9, 0.1), leafMat); leaf.position.set(-s * 0.71, 1.95, 0); pivot.add(leaf);
  }
  const l1 = new THREE.PointLight('#FFC46B', 55, 22, 1.8); l1.position.set(0, 2.6, -0.2); scene.add(l1);
  const l2 = new THREE.PointLight('#FFB04D', 30, 14, 2); l2.position.set(0, 2.2, 2.8); scene.add(l2);
  anim.gateHalo = glowSprite(GLOW, 15, '#FFC870', 0.55); anim.gateHalo.position.set(0, 3.4, -1.7); gate.add(anim.gateHalo);
}

function buildERP() {
  const g = new THREE.Group(); g.position.copy(E); scene.add(g);
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.75, 32, 32), hdr(2.4, 1.7, 0.8)); g.add(core);
  anim.erpIco = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.5, 1)), new THREE.LineBasicMaterial({ color: '#F0D3A0', transparent: true, opacity: 0.7 }));
  g.add(anim.erpIco);
  anim.erpRing = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.03, 8, 128), hdr(1.6, 1.2, 0.6)); anim.erpRing.rotation.x = Math.PI / 2.3; g.add(anim.erpRing);
  g.add(glowSprite(GLOW, 7, '#FFC870', 0.5));
  const lbl = textSprite(plainText('ERP', 96, '#FAF6F1', 18), 0.8); lbl.position.set(0, 2.3, 0); g.add(lbl);
  const items = [
    ['Savdo', 'Buyurtmalar, yetkazish, distribyutor narxlari'],
    ['Ombor', '2 ta ombor, partiyalar, qoldiq, inventarizatsiya'],
    ['Moliya', 'Nasiya limitlari, qarz va to‘lovlar nazorati'],
    ['Hisob-kitob', 'Distribyutorlar bilan akt sverki'],
    ['Rollar', 'Rahbar, menejer, omborchi, yetkazuvchi'],
    ['Integratsiya', 'Telegram bot va mobil versiya (PWA)'],
  ];
  anim.erpPanels = items.map(([t, d], i) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 3.2 * 440 / 768), new THREE.MeshBasicMaterial({ map: panelTexture(t, d), transparent: true, side: THREE.DoubleSide, depthWrite: false }));
    m.userData.a = (i / items.length) * Math.PI * 2; g.add(m); return m;
  });
  const lp = new Float32Array(items.length * 6);
  const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.BufferAttribute(lp, 3));
  anim.erpLines = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: '#D9B26A', transparent: true, opacity: 0.45 })); g.add(anim.erpLines);
  anim.erpFlow = items.map(() => { const s = glowSprite(GLOW, 0.5, '#FFE2A8', 1); g.add(s); return s; });
  const ring = new THREE.Mesh(new THREE.RingGeometry(4.9, 4.96, 160), hdr(1.4, 1.05, 0.5, { transparent: true, opacity: 0.6, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2; ring.position.set(E.x, 0.03, E.z); scene.add(ring);
  const l = new THREE.PointLight('#FFC46B', 40, 18, 2); l.position.copy(E); scene.add(l);
}

function buildFrame(c, url, k) {
  const g = new THREE.Group(); g.position.copy(c); scene.add(g); g.userData = { base: c.y, k };
  const W = 9.6, Hh = W / (1376 / 768), t = 0.17;
  const tex = new THREE.TextureLoader().load(url); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const pic = new THREE.Mesh(new THREE.PlaneGeometry(W, Hh), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, color: new THREE.Color(0.84, 0.84, 0.84) }));
  pic.position.z = 0.01; g.add(pic);
  const back = new THREE.Mesh(new THREE.BoxGeometry(W + 0.9, Hh + 0.9, 0.3), std('#2a0709', { roughness: 0.45, metalness: 0.4 }));
  back.position.z = -0.17; g.add(back);
  const gold = std('#E2BE7E', { metalness: 0.85, roughness: 0.3, emissive: '#5a3a10', emissiveIntensity: 0.7 });
  [[0, Hh / 2 + t / 2, W + 2 * t, t], [0, -Hh / 2 - t / 2, W + 2 * t, t], [-W / 2 - t / 2, 0, t, Hh], [W / 2 + t / 2, 0, t, Hh]].forEach(([x, y, w, h]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.14), gold); m.position.set(x, y, 0.03); g.add(m);
  });
  const edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(W + 2 * t + 0.08, Hh + 2 * t + 0.08)), new THREE.LineBasicMaterial({ color: new THREE.Color(2.2, 1.6, 0.8), toneMapped: false, transparent: true }));
  edge.position.z = 0.11; g.add(edge); g.userData.edge = edge;
  const halo = glowSprite(GLOW, 17, '#FFC870', 0.32); halo.position.z = -0.8; g.add(halo);
  const hgt = c.y - Hh / 2 - t;
  for (const sx of [-1, 1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, hgt, 12), gold); p.position.set(sx * W * 0.34, -Hh / 2 - t - hgt / 2, -0.1); g.add(p); }
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(W * 0.86, 0.22, 1.2), std('#3a1013', { roughness: 0.6 })); plinth.position.set(0, -c.y + 0.11, -0.1); g.add(plinth);
  const l = new THREE.PointLight('#FFD39A', 14, 14, 2); l.position.set(c.x, c.y + 1, c.z + 4); scene.add(l);
  (anim.frames ||= []).push(g);
}

function buildUniversity() {
  const add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); scene.add(m); return m; };
  const stone = std('#4A3C4E', { roughness: 0.92 });
  const stoneDark = std('#2E2533', { roughness: 0.95 });
  add(new THREE.BoxGeometry(9, 11, 6), stone, U.x, 5.5, U.z - 3);
  add(new THREE.BoxGeometry(0.8, 9.5, 6.6), stoneDark, U.x - 4.9, 4.75, U.z - 3);
  add(new THREE.BoxGeometry(0.8, 9.5, 6.6), stoneDark, U.x + 4.9, 4.75, U.z - 3);
  for (let i = 0; i < 9; i++) add(new THREE.BoxGeometry(0.62, 0.8, 0.62), stone, U.x - 4.19 + i * 1.047, 11.4, U.z - 0.31);
  for (let i = 0; i < 9; i++) add(new THREE.BoxGeometry(0.62, 0.8, 0.62), stone, U.x - 4.19 + i * 1.047, 11.4, U.z - 5.69);
  // rose window
  add(new THREE.CircleGeometry(0.92, 48), hdr(0.55, 0.85, 1.5), U.x, 8.2, U.z + 0.02);
  add(new THREE.TorusGeometry(0.95, 0.1, 12, 64), std('#8FA3B8', { metalness: 0.6, roughness: 0.4 }), U.x, 8.2, U.z + 0.05);
  for (let k = 0; k < 4; k++) { const sp = add(new THREE.BoxGeometry(1.9, 0.06, 0.06), std('#2E2533'), U.x, 8.2, U.z + 0.08); sp.rotation.z = (k * Math.PI) / 4; }
  add(new THREE.CircleGeometry(0.22, 24), std('#8FA3B8', { metalness: 0.6, roughness: 0.4 }), U.x, 8.2, U.z + 0.1);
  for (const s of [-1, 1]) add(new THREE.PlaneGeometry(0.34, 1.7), hdr(0.22, 0.36, 0.62), U.x + s * 3, 6.0, U.z + 0.02);
  // pointed door
  const ds = new THREE.Shape(); ds.moveTo(-1.6, 0); ds.lineTo(-1.6, 3.2); ds.quadraticCurveTo(-1.6, 4.6, 0, 5.4); ds.quadraticCurveTo(1.6, 4.6, 1.6, 3.2); ds.lineTo(1.6, 0); ds.lineTo(-1.6, 0);
  const door = new THREE.Mesh(new THREE.ExtrudeGeometry(ds, { depth: 0.25, bevelEnabled: false }), std('#4B2A1C', { roughness: 0.75 }));
  door.position.set(U.x, 0, U.z); scene.add(door);
  const dp = new THREE.Path(); dp.moveTo(-1.6, 0); dp.lineTo(-1.6, 3.2); dp.quadraticCurveTo(-1.6, 4.6, 0, 5.4); dp.quadraticCurveTo(1.6, 4.6, 1.6, 3.2); dp.lineTo(1.6, 0);
  const fp = dp.getSpacedPoints(140).map((p) => new V3(U.x + p.x, p.y, U.z + 0.28));
  scene.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(fp), 200, 0.09, 8, false), std('#8FA3B8', { metalness: 0.7, roughness: 0.35, emissive: '#22303f', emissiveIntensity: 0.6 })));
  const iron = std('#1F120C', { metalness: 0.6, roughness: 0.45 });
  for (const dx of [-0.8, 0, 0.8]) add(new THREE.BoxGeometry(0.05, 4.6, 0.04), std('#2E180F'), U.x + dx, 2.3, U.z + 0.27);
  for (const y of [1.2, 3.1]) { add(new THREE.BoxGeometry(3.2, 0.16, 0.06), iron, U.x, y, U.z + 0.29); for (const dx of [-1.4, -0.7, 0, 0.7, 1.4]) add(new THREE.SphereGeometry(0.05, 10, 10), std('#8FA3B8', { metalness: 0.8, roughness: 0.3 }), U.x + dx, y, U.z + 0.33); }
  const gm = std('#E2BE7E', { metalness: 0.9, roughness: 0.25, emissive: '#3a2508', emissiveIntensity: 0.5 });
  add(new THREE.TorusGeometry(0.3, 0.06, 12, 40), gm, U.x, 2.15, U.z + 0.36);
  add(new THREE.SphereGeometry(0.09, 16, 16), gm, U.x, 2.47, U.z + 0.32);
  add(new THREE.PlaneGeometry(3.1, 0.07), hdr(2.6, 1.9, 0.9), U.x, 0.05, U.z + 0.3);
  add(new THREE.BoxGeometry(4.4, 0.3, 1.3), std('#5A4B55', { roughness: 0.9 }), U.x, 0.15, U.z + 0.9);
  const bl = new THREE.PointLight('#8FA3B8', 30, 22, 2); bl.position.set(U.x + 1, 8, U.z + 4); scene.add(bl);
  const wl = new THREE.PointLight('#FFD9A0', 22, 9, 2); wl.position.set(U.x - 2.5, 3.2, U.z + 2.2); scene.add(wl);
  { const gs = glowSprite(GLOW, 9, '#8FA3B8', 0.35); gs.position.set(U.x, 8.2, U.z - 0.5); scene.add(gs); }

  // student
  const skin = std('#F0D3A0', { roughness: 0.55, emissive: '#3a2508', emissiveIntensity: 0.25 });
  const accent = std('#C79A3B', { roughness: 0.45, metalness: 0.3 });
  const fig = new THREE.Group(); fig.position.set(U.x - 1.9, 0.3, U.z + 0.55); fig.rotation.y = 2.065; scene.add(fig);
  const part = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); fig.add(m); return m; };
  part(new THREE.CapsuleGeometry(0.12, 0.6, 6, 12), skin, 0.12, 0.42, 0);
  part(new THREE.CapsuleGeometry(0.12, 0.6, 6, 12), skin, -0.12, 0.42, 0);
  part(new THREE.CapsuleGeometry(0.3, 0.62, 8, 16), skin, 0, 1.38, 0);
  part(new THREE.BoxGeometry(0.42, 0.6, 0.22), accent, 0, 1.45, -0.33);
  part(new THREE.SphereGeometry(0.25, 24, 24), skin, 0, 2.15, 0);
  const board = part(new THREE.BoxGeometry(0.62, 0.05, 0.62), accent, 0, 2.42, 0); board.rotation.y = Math.PI / 4;
  part(new THREE.CylinderGeometry(0.2, 0.22, 0.14, 16), accent, 0, 2.34, 0);
  part(new THREE.CapsuleGeometry(0.07, 0.42, 4, 8), skin, 0.33, 1.32, 0.02);
  fig.updateMatrixWorld(true);
  anim.shoulder = fig.localToWorld(new V3(-0.26, 1.72, 0.05));
  anim.arm = new THREE.Group(); anim.arm.position.copy(anim.shoulder); scene.add(anim.arm);
  const armMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.42, 4, 10), skin); armMesh.rotation.x = Math.PI / 2; armMesh.position.z = 0.29; anim.arm.add(armMesh);
  const fist = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), skin); fist.position.z = 0.6; anim.arm.add(fist);
  anim.knockAt = new V3(U.x - 1.15, 2.05, U.z + 0.36);
  anim.knockBack = anim.knockAt.clone().add(new V3(-0.18, -0.12, 0.3));
  anim.ripples = [0, 1, 2].map(() => { const m = new THREE.Mesh(new THREE.TorusGeometry(1, 0.022, 8, 64), hdr(2.4, 1.8, 0.9, { transparent: true, opacity: 0 })); m.position.copy(anim.knockAt).add(new V3(0, 0, 0.04)); scene.add(m); m.userData.t = 9; return m; });
  anim.rippleIdx = 0; anim.lastKnock = -1;
}

function buildPath() {
  const curve = new THREE.CatmullRomCurve3([
    new V3(0, 0.06, 5.2), new V3(7, 0.06, 4.5), new V3(9, 0.06, -8), new V3(16, 0.06, -14), new V3(24, 0.06, -15),
    new V3(36, 0.06, -13.5), new V3(48, 0.06, -15), new V3(60, 0.06, -13.5), new V3(72, 0.06, -15), new V3(84, 0.06, -13),
    new V3(96, 0.06, -14), new V3(108, 0.06, -12.5), new V3(116, 0.06, -16.5), new V3(120, 0.06, -18.4),
  ], false, 'centripetal');
  const n = Math.floor(curve.getLength() / 0.85);
  const mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.045, 8, 8), new THREE.MeshBasicMaterial({ color: '#ffffff' }), n);
  const m = new THREE.Matrix4();
  for (let i = 0; i < n; i++) { m.setPosition(curve.getPointAt(i / (n - 1))); mesh.setMatrixAt(i, m); mesh.setColorAt(i, new THREE.Color(1, 0.8, 0.4)); }
  scene.add(mesh); anim.path = mesh; anim.pathN = n;
}

/* ---------- Slides / DOM ---------- */
const slides = [...document.querySelectorAll('.slide')];
const labelEls = [...document.querySelectorAll('.lbl')];
const progress = document.getElementById('progress');
const countEl = document.getElementById('count');
const notesEl = document.getElementById('notes');
const helpEl = document.getElementById('help');
slides.forEach(() => progress.appendChild(document.createElement('i')));
const pad = (n) => String(n).padStart(2, '0');

let cur = 0, tr = null, arrivedAt = 0;
const rest = { pos: SLIDES[0].pos.clone(), tgt: SLIDES[0].tgt.clone(), shift: SLIDES[0].shift, fog: SLIDES[0].fog };
const camTgt = rest.tgt.clone();
let curShift = rest.shift;

let domTimer = 0;
function setDom(delay = 0) {
  clearTimeout(domTimer);
  if (delay > 0) { slides.forEach((s) => s.classList.remove('active')); const k = cur; domTimer = setTimeout(() => { if (cur === k) slides[k].classList.add('active'); }, delay); }
  else slides.forEach((s, i) => s.classList.toggle('active', i === cur));
  [...progress.children].forEach((b, i) => b.classList.toggle('on', i === cur));
  countEl.textContent = `${pad(cur + 1)} / ${pad(slides.length)}`;
  notesEl.textContent = slides[cur].dataset.notes || '';
}

function go(i, instant = false) {
  if (i < 0 || i >= slides.length || (i === cur && !instant)) return;
  const prev = cur; cur = i;
  setDom(!instant && ((prev === 0 && i === 1) || (prev === 1 && i === 0)) ? 2000 : 0);
  const now = performance.now() / 1000;
  const dst = SLIDES[i];
  if (instant) {
    tr = null; rest.pos.copy(dst.pos); rest.tgt.copy(dst.tgt); rest.shift = dst.shift; rest.fog = dst.fog;
    camTgt.copy(dst.tgt); curShift = dst.shift; scene.fog.density = dst.fog; camera.position.copy(dst.pos); arrivedAt = now - 30; setVis(VIS[i]); return;
  }
  const from = camera.position.clone();
  let pts, fly = false;
  if (prev === 0 && i === 1) { pts = [from, ...DOOR_VIA, dst.pos]; fly = true; }
  else if (prev === 1 && i === 0) { pts = [from, ...DOOR_VIA.slice().reverse(), dst.pos]; fly = true; }
  else {
    const d = from.distanceTo(dst.pos);
    const mid = from.clone().lerp(dst.pos, 0.5).add(new V3(0, 1.5 + d * 0.06, 2 + d * 0.12));
    pts = [from, mid, dst.pos];
  }
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  const dur = fly ? 3.4 : Math.min(3.4, 2.1 + from.distanceTo(dst.pos) * 0.02);
  tr = { curve, fly, start: now, dur, fromT: camTgt.clone(), toT: dst.tgt.clone(), fromS: curShift, toS: dst.shift, fromF: scene.fog.density, toF: dst.fog };
  arrivedAt = now + dur;
  setVis([...VIS[prev], ...VIS[i]]);
  rest.pos.copy(dst.pos); rest.tgt.copy(dst.tgt); rest.shift = dst.shift; rest.fog = dst.fog;
}

/* counters */
const countEls = [...document.querySelectorAll('[data-count]')].map((el) => ({ el, i: slides.indexOf(el.closest('.slide')), to: +el.dataset.count, from: +(el.dataset.from || 0), dec: +(el.dataset.dec || 0) }));

/* ---------- Input ---------- */
addEventListener('keydown', (e) => {
  const k = e.key;
  if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].includes(k)) { e.preventDefault(); go(cur + 1); }
  else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(k)) { e.preventDefault(); go(cur - 1); }
  else if (k === 'Home') go(0);
  else if (k === 'End') go(slides.length - 1);
  else if (k === 'f' || k === 'F') { if (!document.fullscreenElement) document.documentElement.requestFullscreen?.()?.catch?.(() => {}); else document.exitFullscreen?.()?.catch?.(() => {}); }
  else if (k === 'n' || k === 'N') notesEl.classList.toggle('on');
  else if (k === 'l' || k === 'L') setLite(!lite);
  else if (k === 'h' || k === 'H') helpEl.classList.toggle('hide');
});
addEventListener('click', (e) => { if (e.button === 0) go(cur + 1); });
addEventListener('contextmenu', (e) => { e.preventDefault(); go(cur - 1); });
let tx = null;
addEventListener('touchstart', (e) => { tx = e.touches[0].clientX; }, { passive: true });
addEventListener('touchend', (e) => { if (tx === null) return; const dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 40) go(cur + (dx < 0 ? 1 : -1)); tx = null; });
let hideT; addEventListener('mousemove', () => { document.body.style.cursor = 'default'; clearTimeout(hideT); hideT = setTimeout(() => (document.body.style.cursor = 'none'), 2000); });
setTimeout(() => helpEl.classList.add('hide'), 7000);

function setLite(v) {
  lite = v; bloom.enabled = !lite; renderer.setPixelRatio(pr()); composer.setPixelRatio(pr());
  if (anim.dust) anim.dust.visible = !lite; resize();
}

function applyShift(s) {
  const w = innerWidth, h = innerHeight;
  if (Math.abs(s) < 1e-4) camera.clearViewOffset(); else camera.setViewOffset(w, h, -s * w, 0, w, h);
}
function resize() {
  renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight; applyShift(curShift); camera.updateProjectionMatrix();
}
addEventListener('resize', resize);

/* ---------- Loop ---------- */
const clock = new THREE.Clock();
const tmp = new V3(), tmp2 = new V3(), col = new THREE.Color();
let frames = 0, ftime = 0, perfChecked = false;

function frame() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  const now = performance.now() / 1000;

  // perf guard: drop to lite mode on weak GPUs
  if (!perfChecked && !params.has('noguard') && t > 1.5) { frames++; ftime += dt; if (ftime > 3) { perfChecked = true; if (frames / ftime < 24 && !lite) setLite(true); } }

  // camera
  if (tr) {
    const e = ease(clamp01((now - tr.start) / tr.dur));
    const p = tr.curve.getPoint(e); camera.position.copy(p);
    camTgt.copy(tr.fromT).lerp(tr.toT, e);
    if (tr.fly) {
      const ahead = tr.curve.getPoint(Math.min(1, e + 0.05));
      tmp.subVectors(ahead, p); if (tmp.lengthSq() > 1e-6) { tmp.normalize().multiplyScalar(8).add(p); camTgt.lerp(tmp, Math.sin(Math.PI * e) * 0.9); }
    }
    curShift = tr.fromS + (tr.toS - tr.fromS) * e;
    scene.fog.density = tr.fromF + (tr.toF - tr.fromF) * e;
    if (e >= 1) { tr = null; setVis(VIS[cur]); }
  } else {
    camera.position.set(rest.pos.x + Math.sin(t * 0.35) * 0.18, rest.pos.y + Math.sin(t * 0.27) * 0.1, rest.pos.z);
    camTgt.copy(rest.tgt); curShift = rest.shift;
  }
  applyShift(curShift); camera.updateProjectionMatrix(); camera.lookAt(camTgt);

  // dust
  if (anim.dust.visible) {
    const a = anim.dust.geometry.attributes.position, s = anim.dustSpeed;
    for (let i = 0; i < s.length; i++) { let y = a.array[i * 3 + 1] + s[i] * dt; if (y > 13) y = 0; a.array[i * 3 + 1] = y; a.array[i * 3] += Math.sin(t * 0.5 + i) * 0.003; }
    a.needsUpdate = true;
  }
  anim.stars.material.opacity = 0.7 + Math.sin(t * 0.8) * 0.12;

  // gate
  anim.gateHalo.material.opacity = 0.45 + Math.sin(t * 1.4) * 0.12;
  anim.doorGlow.material.opacity = clamp01((camera.position.z - 0.2) / 3.2);

  // ERP
  anim.erpIco.rotation.y += dt * 0.25; anim.erpIco.rotation.x += dt * 0.1; anim.erpRing.rotation.z += dt * 0.4;
  const lp = anim.erpLines.geometry.attributes.position;
  anim.erpPanels.forEach((m, i) => {
    const a = m.userData.a + t * 0.16;
    m.position.set(Math.cos(a) * 4.9, Math.sin(t * 0.8 + i) * 0.3 + (i % 2 ? 0.65 : -0.55), Math.sin(a) * 4.9);
    tmp2.copy(camera.position); m.parent.worldToLocal(tmp2); m.lookAt(tmp2);
    lp.setXYZ(i * 2, 0, 0, 0); lp.setXYZ(i * 2 + 1, m.position.x, m.position.y, m.position.z);
    const f = (t * 0.45 + i / 6) % 1; anim.erpFlow[i].position.copy(m.position).multiplyScalar(f); anim.erpFlow[i].material.opacity = Math.sin(Math.PI * f);
  });
  lp.needsUpdate = true;

  // frames
  anim.frames.forEach((g) => { g.position.y = g.userData.base + Math.sin(t * 0.6 + g.userData.k) * 0.06; g.userData.edge.material.opacity = 0.65 + Math.sin(t * 1.5 + g.userData.k) * 0.3; });

  // knocking
  {
    const cyc = 2.2, ph = t % cyc;
    let hit = 0; for (const tk of [0.25, 0.55]) hit = Math.max(hit, Math.exp(-Math.pow((ph - tk) / 0.07, 2)));
    tmp.copy(anim.knockBack).lerp(anim.knockAt, hit); anim.arm.lookAt(tmp);
    const idx = Math.floor(t / cyc) * 2 + (ph > 0.55 ? 2 : ph > 0.25 ? 1 : 0);
    if (idx !== anim.lastKnock && (ph > 0.25 && ph < 0.3 || ph > 0.55 && ph < 0.6)) { anim.lastKnock = idx; const r = anim.ripples[anim.rippleIdx++ % 3]; r.userData.t = 0; }
    anim.ripples.forEach((r) => { r.userData.t += dt; const p = clamp01(r.userData.t / 0.9); r.scale.setScalar(0.15 + p * 1.2); r.material.opacity = p >= 1 ? 0 : (1 - p) * 0.95; });
  }

  // path pulse
  if (anim.path.visible) for (let i = 0; i < anim.pathN; i++) {
    const w = Math.pow(Math.max(0, Math.sin((i * 0.08 - t * 2.2))), 12);
    col.setRGB(0.9 + w * 2.2, 0.68 + w * 1.6, 0.32 + w * 0.8); anim.path.setColorAt(i, col);
  }
  if (anim.path.visible) anim.path.instanceColor.needsUpdate = true;

  // counters
  countEls.forEach((c) => {
    const p = c.i === cur ? (tr ? 0 : easeOut(clamp01((now - arrivedAt + 0.1) / 1.6))) : 1;
    c.el.textContent = (c.from + (c.to - c.from) * p).toFixed(c.dec);
  });

  // labels
  const arrived = !tr;
  labelEls.forEach((el) => {
    const k = +el.dataset.slide; const on = k === cur && arrived; el.classList.toggle('on', on);
    if (k !== cur && !el.classList.contains('on') && Math.abs(k - cur) > 1) return;
    tmp.copy(anchors[el.dataset.anchor]).project(camera);
    const x = (tmp.x * 0.5 + 0.5) * innerWidth, y = (-tmp.y * 0.5 + 0.5) * innerHeight;
    el.style.transform = `translate(${x}px, ${y}px) translate(-50%, ${el.classList.contains('knock') ? '-100%' : '0'})`;
  });

  if (lite) renderer.render(scene, camera); else composer.render();
  requestAnimationFrame(frame);
}

/* ---------- Boot ---------- */
(async () => {
  try { await Promise.all([document.fonts.load('700 40px "DM Sans"'), document.fonts.load('400 40px "DM Sans"'), document.fonts.load('500 40px "DM Sans"')]); } catch (e) {}
  buildWorld();
  if (lite) setLite(true);
  setVis(VIS[0]);
  const s = parseInt(params.get('s') || '0', 10);
  camera.position.copy(SLIDES[0].pos); camTgt.copy(SLIDES[0].tgt);
  setDom();
  if (s > 0) go(Math.min(s, slides.length - 1), true);
  resize();
  window.__go = go;
  requestAnimationFrame(frame);
})();
