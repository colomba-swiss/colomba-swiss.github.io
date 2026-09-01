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

  /* ── the seven Aufgabenbereiche orbit the orb ──────────────────────
     Wording is identical to chapters 03 and 09 — one vocabulary, three
     places. Two are in use today, five are in development; the ring says
     which, and nothing else orbits. Still aria-hidden: chapters 03 and 09
     already state all seven as real text, so this is the picture of it. */
  const AREAS = [
    { label: 'Telefon',           live: true  },
    { label: 'Reservationen',     live: true  },
    { label: 'Büro',              live: false },
    { label: 'Team',              live: false },
    { label: 'Zahlen',            live: false },
    { label: 'Gäste & Marketing', live: false },
    { label: 'Einkauf & Lager',   live: false }
  ];
  const ring = doc.getElementById('ring');
  if (ring) {
    AREAS.forEach((area, i) => {
      const a = (-90 + i * (360 / AREAS.length)) * Math.PI / 180;
      const node = doc.createElement('span');
      node.className = area.live ? 'node live' : 'node';
      node.style.left = `calc(50% + ${Math.cos(a).toFixed(3)} * var(--r))`;
      node.style.top = `calc(50% + ${Math.sin(a).toFixed(3)} * var(--r))`;
      node.textContent = area.label;
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
