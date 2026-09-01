// orb.js — <heidi-orb state="listening|speaking" motion="full|reduced" [paused]>
// WEBSITE-ELITE-1 host for the canonical Heidi orb (colomba/design/heidi-orb).
// The scene itself is orb-scene.js, GENERATED from the design lane's widget so
// the shaders are byte-identical; this file is only the host:
//   · renders in a Worker on an OffscreenCanvas when the browser can, so
//     three.js parse, shader compile and every frame stay off the main thread
//   · falls back to the main thread where OffscreenCanvas is unavailable
//   · `paused` skips frames while the hero is off screen
//   · pixel ratio capped at 1.5 on narrow screens
// three@0.184.0 (MIT) is vendored next to this file; zero external requests.
(() => {
  // resolved NOW: document.currentScript is null again by the time an element connects
  const BASE = (document.currentScript && document.currentScript.src) || location.href;

  class HeidiOrb extends HTMLElement {
    static get observedAttributes() { return ['state', 'motion', 'paused']; }

    connectedCallback() {
      if (this._booted) return;
      this._booted = true;
      this.style.cssText = 'display:block;position:relative;width:100%;height:100%';
      this._canvas = document.createElement('canvas');
      this._canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
      this.appendChild(this._canvas);
      this._boot().catch(e => console.warn('heidi-orb', e));
    }

    _box() {
      const r = this.getBoundingClientRect();
      const p = this.parentElement ? this.parentElement.getBoundingClientRect() : null;
      return {
        w: Math.round(r.width || (p && p.width) || 320),
        h: Math.round(r.height || (p && p.height) || 320)
      };
    }

    _state() {
      return {
        speaking: this.getAttribute('state') === 'speaking',
        motion: this.getAttribute('motion') === 'reduced' ? 'reduced' : 'full',
        paused: this.hasAttribute('paused')
      };
    }

    attributeChangedCallback() { this._push(); }

    _push() {
      const s = this._state();
      if (this._worker) this._worker.postMessage({ type: 'state', ...s });
      else if (this._S) Object.assign(this._S, s);
    }

    disconnectedCallback() {
      if (this._worker) { this._worker.terminate(); this._worker = null; }
      if (this._renderer) this._renderer.setAnimationLoop(null);
      if (this._ro) this._ro.disconnect();
    }

    async _boot() {
      const { w, h } = this._box();
      const dpr = Math.min(devicePixelRatio || 1, w < 480 ? 1.5 : 2);
      const canWork = 'transferControlToOffscreen' in this._canvas && typeof Worker === 'function';

      if (canWork) {
        const off = this._canvas.transferControlToOffscreen();
        const url = new URL('orb-worker.js', BASE);
        this._worker = new Worker(url, { type: 'module' });
        this._worker.onerror = (e) => {
          // worker could not start (module workers unsupported, CSP…) → main thread
          console.warn('heidi-orb: worker fell back to main thread —', e && e.message);
          this._worker.terminate(); this._worker = null;
          this._canvas.remove();
          this._canvas = document.createElement('canvas');
          this._canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
          this.appendChild(this._canvas);
          this._bootMain(dpr);
        };
        this._worker.postMessage({ type: 'init', canvas: off, w, h, dpr, ...this._state() }, [off]);
      } else {
        await this._bootMain(dpr);
      }

      const fit = () => {
        const b = this._box();
        if (!b.w || !b.h) return;
        if (this._worker) this._worker.postMessage({ type: 'resize', w: b.w, h: b.h });
        else if (this._orb) this._orb.fit(b.w, b.h);
      };
      this._ro = new ResizeObserver(fit);
      this._ro.observe(this);
      if (this.parentElement) this._ro.observe(this.parentElement);
    }

    async _bootMain(dpr) {
      const THREE = await import('./three.module.min.js');
      const { buildOrb } = await import('./orb-scene.js');
      const { w, h } = this._box();
      const renderer = new THREE.WebGLRenderer({ canvas: this._canvas, antialias: true, alpha: true });
      renderer.setPixelRatio(dpr);
      renderer.setSize(w, h, false);
      this._renderer = renderer;
      const orb = buildOrb(THREE, renderer, w, h);
      this._orb = orb; this._S = orb.S;
      Object.assign(orb.S, this._state());
      orb.frame();
      renderer.setAnimationLoop(orb.frame);
    }
  }

  if (!customElements.get('heidi-orb')) customElements.define('heidi-orb', HeidiOrb);
})();
