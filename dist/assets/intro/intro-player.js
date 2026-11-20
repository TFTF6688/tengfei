
(async () => {
  'use strict';

  const mount = document.getElementById('valley');
  const loader = document.getElementById('loader');
  const ui = document.getElementById('ui');
  const sound = document.getElementById('sound');
  const go = document.getElementById('go');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let scene;
  let loaded = false;
  let timedOut = false;
  let introShown = false;
  let pointerOverArrow = false;
  let arrowFocused = false;
  let hovering = false;

  function revealInterface() {
    if (introShown) return;
    introShown = true;
    ui.inert = false;
    ui.classList.add('on');
  }

  function showStill() {
    mount.classList.add('scene-unavailable');
    loader.classList.add('gone');
    revealInterface();
  }

  const loadTimeout = setTimeout(() => {
    if (loaded) return;
    timedOut = true;
    showStill();
    scene?.destroy();
  }, 12000);

  if (reducedMotion.matches || navigator.connection?.saveData) {
    clearTimeout(loadTimeout);
    showStill();
    return;
  }

  try {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'intro-runtime.js?v=2';
      script.onload = resolve;
      script.onerror = reject;
      document.head.append(script);
    });
    if (timedOut) return;
    self.webpackChunk_N_E.push([[90001], {}, (require) => { window.__req = require; }]);
    window.__req(889);
    const Valley = window.__GE.et();
    const audioStore = window.__GE.Y();

    scene = new Valley(mount, () => {
      loaded = true;
      clearTimeout(loadTimeout);
      loader.classList.add('gone');
      mount.classList.remove('scene-loading');
      revealInterface();
    }, revealInterface);

    sound.addEventListener('click', async () => {
      const audio = audioStore();
      if (sound.disabled) return;
      if (!audio.isInitialized) {
        sound.disabled = true;
        sound.setAttribute('aria-busy', 'true');
        try {
          const initializing = audio.initAudio();
          await audioStore().audioManager?.audioContext?.resume();
          await initializing;
        } finally {
          sound.disabled = false;
          sound.removeAttribute('aria-busy');
        }
        if (!audioStore().isInitialized) return;
      }
      const context = audioStore().audioManager?.audioContext;
      if (audio.isMuted && context?.state === 'suspended') {
        sound.disabled = true;
        try {
          await context.resume();
        } catch (error) {
          console.warn('Ambient audio could not resume.', error);
          return;
        } finally {
          sound.disabled = false;
        }
      }
      sound.setAttribute('aria-pressed', String(!audioStore().toggleMute()));
    });
  } catch (error) {
    clearTimeout(loadTimeout);
    console.warn('The animated valley could not start.', error);
    showStill();
    return;
  }

  function updateHover() {
    const shouldHover = !reducedMotion.matches && (pointerOverArrow || arrowFocused);
    if (hovering !== shouldHover) {
      hovering = shouldHover;
      if (hovering) scene.startHoverTransition();
      else scene.stopHoverTransition();
    }
    if (reducedMotion.matches) scene.valleyScene.toggleAutoScroll(false);
  }

  if (reducedMotion.matches) scene.valleyScene.toggleAutoScroll(false);
  const valley = scene.valleyScene;
  let touchDrag = null;
  function moveOverFlowers(event) {
    valley.uniforms.uBrightnessOnTouch.value = valley.settings.uBrightnessOnTouch;
    scene.onMouseMove(event);
  }
  window.removeEventListener('pointermove', scene.onMouseMove);
  window.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'touch' || reducedMotion.matches) return;
    if (!event.isPrimary) { finishTouch(); return; }
    if (event.target.closest('button, a')) return;
    touchDrag = {id:event.pointerId,x:event.clientX,y:event.clientY,lastY:event.clientY,axis:null};
    valley.toggleAutoScroll(false);
    mount.setPointerCapture(event.pointerId);
  });
  window.addEventListener('pointermove', event => {
    if (event.pointerType !== 'touch') {
      moveOverFlowers(event);
      return;
    }
    if (!touchDrag || event.pointerId !== touchDrag.id) return;
    const dx=event.clientX-touchDrag.x,dy=event.clientY-touchDrag.y;
    if (!touchDrag.axis && Math.hypot(dx,dy)>=7) touchDrag.axis=Math.abs(dx)>=Math.abs(dy)*.85?'horizontal':'vertical';
    if (!touchDrag.axis) return;
    if (event.cancelable) event.preventDefault();
    if (touchDrag.axis === 'horizontal') {
      moveOverFlowers(event);
    } else {
      valley.uniforms.uBrightnessOnTouch.value = 0;
      mount.dispatchEvent(new WheelEvent('wheel',{deltaY:-(event.clientY-touchDrag.lastY)*20}));
    }
    touchDrag.lastY=event.clientY;
  },{passive:false});
  function finishTouch(event) {
    if (!touchDrag || (event && event.pointerId!==touchDrag.id)) return;
    touchDrag=null;
    valley.toggleAutoScroll(!reducedMotion.matches);
  }
  window.addEventListener('pointerup',finishTouch);
  window.addEventListener('pointercancel',finishTouch);
  reducedMotion.addEventListener('change', () => {
    if (!reducedMotion.matches) scene.valleyScene.toggleAutoScroll(true);
    updateHover();
  });

  go.addEventListener('pointerenter', (event) => {
    if (event.pointerType === 'touch') return;
    pointerOverArrow = true;
    updateHover();
  });
  go.addEventListener('pointerleave', () => {
    pointerOverArrow = false;
    updateHover();
  });
  go.addEventListener('focus', () => {
    arrowFocused = go.matches(':focus-visible');
    updateHover();
  });
  go.addEventListener('blur', () => {
    arrowFocused = false;
    updateHover();
  });
  go.addEventListener('click', () => {
    if (reducedMotion.matches) return;
    pointerOverArrow = false;
    arrowFocused = false;
    updateHover();
    mount.dispatchEvent(new WheelEvent('wheel', { deltaY: 960 }));
  });
})();

  
