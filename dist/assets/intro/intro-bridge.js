
(() => {
  const ui = document.getElementById('ui');
  const frameHost = window.parent;
  const send = action => frameHost.postMessage({channel: 'portfolio-fernhollow', action}, '*');
  const observer = new MutationObserver(() => {
    if (!ui.classList.contains('on')) return;
    observer.disconnect();
    send('ready');
  });
  observer.observe(ui, {attributes: true, attributeFilter: ['class']});
  ui.inert = false;
  ui.classList.add('on');
  document.getElementById('loader').classList.add('gone');
  document.addEventListener('click', event => {
    const action = event.target.closest('[data-portfolio-action]')?.dataset.portfolioAction;
    if (action) send(action);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') send('skip');
  });
})();
  