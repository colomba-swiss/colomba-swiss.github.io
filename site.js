/* colomba-swiss.ch — progressive layer.
   Everything here is enhancement: the page is complete without JS.
   The orb (WebGL, three.js) loads only after idle and never for
   prefers-reduced-motion — the static ember is the resting state. */
(() => {
  const doc = document;
  doc.documentElement.classList.add('js');

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── reveal on scroll ─────────────────────────────────────────────── */
  const rv = [...doc.querySelectorAll('.rv')];
  if ('IntersectionObserver' in window && !reduced) {
    const io = new IntersectionObserver(es => {
      es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    rv.forEach(el => io.observe(el));
  } else {
    rv.forEach(el => el.classList.add('in'));
  }

  /* ── capability ring around the orb (decorative, aria-hidden) ─────── */
  const MARKS = [
    'M4 6h16v14H4z M4 10h16 M9 3v4 M15 3v4',
    'M6 4l3 3-2 3a11 11 0 005 5l3-2 3 3-2 2A16 16 0 014 6z',
    'M3 10h18 M12 10v9 M8 19h8',
    'M4 5h16v11H8l-4 4z',
    'M3 11v2 M7 8v8 M11 4v16 M15 7v10 M19 10v4',
    'M4 8h16v11H4z M4 8l2.5-3h11L20 8'
  ];
  const ring = doc.getElementById('ring');
  if (ring) {
    MARKS.forEach((d, i) => {
      const a = (-90 + i * (360 / MARKS.length)) * Math.PI / 180;
      const node = doc.createElement('div');
      node.className = 'node';
      node.style.left = `calc(50% + ${Math.cos(a).toFixed(3)} * var(--r))`;
      node.style.top = `calc(50% + ${Math.sin(a).toFixed(3)} * var(--r))`;
      node.innerHTML = `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="rgba(166,179,156,.95)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;
      ring.appendChild(node);
    });
  }

  /* ── status chip + orb state: listening <-> speaking breath ────────
     Terracotta appears ONLY while «Heidi spricht.» (design-bar §3). */
  const chipText = doc.getElementById('status-text');
  const chipDot = doc.getElementById('status-dot');
  let orbEl = null;
  let speaking = false;
  const applyState = () => {
    if (chipText) chipText.textContent = speaking ? 'Heidi spricht.' : 'Heidi hört zu.';
    if (chipDot) chipDot.style.background = speaking ? '#C89B7B' : '#9DBE86';
    if (orbEl) orbEl.setAttribute('state', speaking ? 'speaking' : 'listening');
  };
  if (!reduced) {
    setInterval(() => { speaking = !speaking; applyState(); }, 5200);
  }

  /* ── the real orb, lazily ─────────────────────────────────────────────
     Boots once: after load, on an idle slot, and only while the hero is on
     screen. Off screen the render loop pauses (attribute `paused`), so the
     page never spends GPU/CPU on light nobody is looking at. */
  const mount = doc.getElementById('orb-mount');
  const ember = doc.getElementById('ember');
  let booted = false;
  const bootOrb = () => {
    if (booted) return;
    booted = true;
    const s = doc.createElement('script');
    s.src = 'assets/orb.js';
    s.onload = () => {
      orbEl = doc.createElement('heidi-orb');
      orbEl.setAttribute('state', speaking ? 'speaking' : 'listening');
      orbEl.setAttribute('motion', 'full');
      mount.appendChild(orbEl);
      /* fade the ember only once the orb actually renders */
      let tries = 0;
      const watch = setInterval(() => {
        tries += 1;
        if (orbEl.querySelector('canvas')) {
          clearInterval(watch);
          setTimeout(() => ember && ember.classList.add('faded'), 900);
        } else if (tries > 50) {
          clearInterval(watch); /* WebGL unavailable — the ember stays */
        }
      }, 200);
    };
    doc.head.appendChild(s);
  };
  if (mount && !reduced) {
    const idle = window.requestIdleCallback || (fn => setTimeout(fn, 1200));
    const whenVisible = () => {
      if (!('IntersectionObserver' in window)) { idle(bootOrb); return; }
      const vo = new IntersectionObserver(es => {
        es.forEach(e => {
          if (e.isIntersecting) { idle(bootOrb); }
          if (orbEl) orbEl.toggleAttribute('paused', !e.isIntersecting);
        });
      }, { threshold: 0.15 });
      vo.observe(mount);
    };
    if (doc.readyState === 'complete') whenVisible();
    else addEventListener('load', whenVisible, { once: true });
  }

  /* ── paper-hero: plays once, crossfades back to the still (V1.3) ─────
     No <source> ships in the markup at all — they're only appended here,
     and only once both gates pass, so a mobile / reduced-motion visitor
     never triggers a byte of video request (verify via network log, not
     the absence of an autoplay attribute). */
  const heroVideo = doc.getElementById('paper-hero-video');
  const wide = matchMedia('(min-width: 881px)').matches;
  if (heroVideo && wide && !reduced) {
    const webm = doc.createElement('source');
    webm.src = heroVideo.dataset.webm; webm.type = 'video/webm';
    const mp4 = doc.createElement('source');
    mp4.src = heroVideo.dataset.mp4; mp4.type = 'video/mp4';
    heroVideo.append(webm, mp4);
    heroVideo.addEventListener('ended', () => heroVideo.classList.remove('is-active'));
    heroVideo.load();
    const p = heroVideo.play();
    if (p && p.then) { p.then(() => heroVideo.classList.add('is-active')).catch(() => {}); }
    else heroVideo.classList.add('is-active');
  }

  /* ── the call scene plays itself into view ────────────────────────── */
  const scene = doc.getElementById('scene');
  if (scene) {
    scene.classList.add('armed');
    if ('IntersectionObserver' in window && !reduced) {
      const so = new IntersectionObserver(es => {
        es.forEach(e => {
          if (e.isIntersecting) { scene.classList.add('play'); so.disconnect(); }
        });
      }, { threshold: 0.3 });
      so.observe(scene);
    } else {
      scene.classList.add('play');
    }
  }
})();
