(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const hero = $('.gallery'), stage = $('.gallery-stage');
  const data = JSON.parse($('#portfolio-data').textContent);
  const ids = new Set(['air','ai-model','kv-domestic','charger','packaging-a']);
  const projects = data.projects.filter(p => ids.has(p.id));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const cards = [], thumbs = [];
  let selected = 0, position = 0, destination = 0, drag = null, blocked = 0, wheelTime = -1000, raf = 0, last = 0;
  let theme = 'dark';
  try { theme = localStorage.getItem('portfolio-gallery-theme') === 'light' ? 'light' : 'dark'; } catch {}
  function setTheme() {
    document.documentElement.dataset.theme = theme;
    $('.gallery-theme').setAttribute('aria-pressed', String(theme === 'dark'));
    $('.gallery-theme').setAttribute('aria-label', theme === 'dark' ? '切换到浅色模式' : '切换到深色模式');
    $('meta[name=theme-color]').content = theme === 'dark' ? '#111310' : '#e9e9e0';
    try { localStorage.setItem('portfolio-gallery-theme', theme); } catch {}
  }
  setTheme(); $('.gallery-theme').addEventListener('click', () => { theme = theme === 'dark' ? 'light' : 'dark'; setTheme(); });
  projects.forEach((p, i) => {
    const card = document.createElement('a');
    card.className = 'gallery-card';card.dataset.project = p.id;card.href = `work/${p.id}/index.html`;
    card.setAttribute('aria-label', `查看${p.title}`);
    const img = document.createElement('img');img.src = p.coverThumb.replace(/^\//,'');img.alt = p.title;img.draggable = false;img.width = 900;img.height = 600;
    if(i === 0)img.fetchPriority = 'high';
    const label = document.createElement('span');label.className = 'gallery-card-label';label.textContent = `${String(i+1).padStart(2,'0')} / SELECTED WORK`;
    const action = document.createElement('span');action.className = 'gallery-card-action';action.innerHTML = 'VIEW PROJECT <b aria-hidden="true">↗</b>';
    card.append(img,label,action);stage.append(card);cards.push(card);
    const li = document.createElement('li'), thumb = document.createElement('button');thumb.className = 'gallery-thumb';thumb.type = 'button';thumb.setAttribute('aria-label',`切换到${p.title}`);
    const preview = img.cloneNode();preview.alt = '';preview.removeAttribute('fetchpriority');thumb.append(preview);thumb.addEventListener('click',()=>goTo(i));li.append(thumb);$('.gallery-thumbs').append(li);thumbs.push(thumb);
    card.addEventListener('click', e => { if(performance.now() < blocked){e.preventDefault();return;}if(i !== selected){e.preventDefault();goTo(i);} });
  });
  const mod = n => (n % projects.length + projects.length) % projects.length;
  function update() {
    const p = projects[selected];
    $('.gallery-project-title').textContent = p.title;
    $('.gallery-project-title').href = `work/${p.id}/index.html`;
    $('.gallery-project-subtitle').textContent = p.subtitle;
    $('.gallery-current').textContent = String(selected+1).padStart(2,'0');
    $('.gallery-watermark').textContent = String(selected+1).padStart(2,'0');
    $('.gallery-category').textContent = `SELECTED ${String(selected+1).padStart(2,'0')} / ${data.categories.find(c=>c[0]===p.category)?.[1] || ''}`;
    thumbs.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===selected)));
    cards.forEach((c,i)=>{c.classList.toggle('is-current',i===selected);c.tabIndex = i===selected?0:-1;c.setAttribute('aria-label',i===selected?`查看${projects[i].title}`:`切换到${projects[i].title}`);});
  }
  function move(delta) { destination = Math.round(destination) + delta;selected = mod(destination);update();wake(); }
  function goTo(i) { let d = mod(i-mod(Math.round(destination)));if(d>projects.length/2)d-=projects.length;move(d); }
  function draw(now) {
    const dt = Math.min((now-last)/16.67 || 1,3);last=now;
    position = reduced.matches ? destination : position + (destination-position)*(1-Math.pow(.88,dt));
    const width = cards[0].offsetWidth;
    cards.forEach((card,i)=>{
      let d = ((i-position+projects.length*100+.5*projects.length)%projects.length)-.5*projects.length;
      const distance=Math.abs(d), x=d*width*.79, z=-distance*240, rotation=Math.max(-48,Math.min(48,-d*36));
      card.style.setProperty('--x',`${x.toFixed(2)}px`);card.style.setProperty('--z',`${z.toFixed(2)}px`);card.style.setProperty('--r',`${rotation.toFixed(2)}deg`);card.style.setProperty('--s',String(1-distance*.055));
      card.style.opacity=String(Math.max(0,1-distance*.38));card.style.filter=`brightness(${Math.max(.35,1-distance*.37)})`;card.style.zIndex=String(10-Math.round(distance*3));card.style.visibility=distance>2.25?'hidden':'visible';
      card.style.pointerEvents=distance>1.65?'none':'auto';
    });
    if(Math.abs(position-destination)>.0005 || drag)raf=requestAnimationFrame(draw);else{position=destination;raf=0;}
  }
  function wake(){if(!raf){last=performance.now();raf=requestAnimationFrame(draw);}}
  $('.gallery-prev').addEventListener('click',()=>move(-1));$('.gallery-next').addEventListener('click',()=>move(1));
  hero.addEventListener('wheel',e=>{if(document.querySelector('dialog[open]')||e.ctrlKey)return;const value=Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY;if(Math.abs(value)<5)return;e.preventDefault();const now=performance.now();if(now-wheelTime<650)return;wheelTime=now;move(value>0?1:-1);},{passive:false});
  document.addEventListener('keydown',e=>{if(document.querySelector('dialog[open]')||e.ctrlKey||e.altKey||e.metaKey||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;if(['ArrowRight','ArrowDown','ArrowLeft','ArrowUp'].includes(e.key)){e.preventDefault();move(['ArrowRight','ArrowDown'].includes(e.key)?1:-1);}});
  stage.addEventListener('pointerdown',e=>{if(e.button!==0)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,start:destination,moved:false,captured:false};stage.classList.add('dragging');});
  stage.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;const delta=Math.abs(dx)>Math.abs(dy)?dx:-dy;
    if(Math.abs(delta)>7){drag.moved=true;if(!drag.captured){stage.setPointerCapture(e.pointerId);drag.captured=true;}}
    if(drag.moved){destination=drag.start-delta/(cards[0].offsetWidth*.8);wake();}
  });
  function end(e){if(!drag||e.pointerId!==drag.id)return;const old=drag;drag=null;stage.classList.remove('dragging');if(old.moved){blocked=performance.now()+350;const delta=destination-old.start;destination=old.start+(Math.abs(delta)>.15?(delta>0?Math.max(1,Math.round(delta)):Math.min(-1,Math.round(delta))):0);}else destination=Math.round(destination);selected=mod(destination);update();wake();}
  stage.addEventListener('pointerup',end);stage.addEventListener('pointercancel',end);stage.addEventListener('lostpointercapture',end);
  hero.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse'||reduced.matches)return;hero.style.setProperty('--px',String((e.clientX/innerWidth-.5)*2));hero.style.setProperty('--py',String((e.clientY/innerHeight-.5)*2));});
  hero.addEventListener('pointerleave',()=>{hero.style.setProperty('--px','0');hero.style.setProperty('--py','0');});
  window.addEventListener('resize',wake);reduced.addEventListener('change',wake);update();wake();
})();
