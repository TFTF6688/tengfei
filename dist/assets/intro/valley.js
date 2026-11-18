(() => {
  const intro = document.getElementById('valley-intro');
  if (!intro?.showModal || location.hash) return;
  const replay = new URLSearchParams(location.search).get('intro') === '1';
  const sessionKey = 'portfolio-fernhollow-seen';
  try {
    if (!replay && sessionStorage.getItem(sessionKey)) return;
  } catch {
    // The intro remains usable when browser storage is disabled.
  }

  const frame = document.createElement('iframe');
  frame.className = 'valley-frame';
  frame.setAttribute('sandbox', 'allow-scripts');
  frame.title = 'Fernhollow · 互动花谷';
  frame.src = intro.dataset.page;
  const skip = document.getElementById('valley-skip');
  const lifetime = new AbortController();
  const {signal} = lifetime;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const direct = new Set(['works','about','contact']);
  let closing = false;
  let timer;

  function cleanup() {
    clearTimeout(timer);
    lifetime.abort();
    frame.remove();
  }

  function closeNow() {
    if (intro.open) intro.close();
    cleanup();
  }

  function leave(enter) {
    if (closing || !intro.open) return;
    closing = true;
    if (reduce.matches) {
      closeNow();
      return;
    }
    intro.dataset.closing = enter ? 'enter' : 'skip';
    timer = setTimeout(closeNow, enter ? 1020 : 320);
  }

  window.addEventListener('message', event => {
    if (event.source !== frame.contentWindow || event.origin !== 'null') return;
    const data = event.data;
    if (!data || data.channel !== 'portfolio-fernhollow' || closing) return;
    if (data.action === 'ready') {
      skip.hidden = true;
    } else if (data.action === 'enter' || data.action === 'skip') {
      leave(data.action === 'enter');
    } else if (direct.has(data.action)) {
      closeNow();
      location.hash = data.action;
    }
  }, {signal});
  skip.addEventListener('click', () => leave(false), {signal});
  intro.addEventListener('cancel', event => {
    event.preventDefault();
    leave(false);
  }, {signal});
  intro.addEventListener('close', cleanup, {once:true,signal});
  window.addEventListener('hashchange', closeNow, {capture:true,signal});

  intro.showModal();
  intro.querySelector('.valley-scene').append(frame);
  try {
    sessionStorage.setItem(sessionKey, '1');
  } catch {
    // The intro may be shown again during a later visit.
  }
})();
