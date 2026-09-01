// orb-worker.js — renders the canonical Heidi orb on an OffscreenCanvas, off the
// main thread. Driven by orb.js: {init, state, resize} messages in, frames out.
import * as THREE from './three.module.min.js';
import { buildOrb } from './orb-scene.js';

let renderer = null, orb = null;

const loop = () => {
  if (!orb) return;
  orb.frame();
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(loop);
  else setTimeout(loop, 16);
};

self.onmessage = (ev) => {
  const m = ev.data;
  if (m.type === 'init') {
    renderer = new THREE.WebGLRenderer({ canvas: m.canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(m.dpr || 1);
    renderer.setSize(m.w, m.h, false);
    orb = buildOrb(THREE, renderer, m.w, m.h);
    orb.S.speaking = !!m.speaking; orb.S.motion = m.motion || 'full'; orb.S.paused = !!m.paused;
    loop();
  } else if (m.type === 'state' && orb) {
    orb.S.speaking = !!m.speaking; orb.S.motion = m.motion || 'full'; orb.S.paused = !!m.paused;
  } else if (m.type === 'resize' && orb) {
    orb.fit(m.w, m.h);
  }
};
