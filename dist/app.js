const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const menu = $('.mobile-nav');
const menuToggle = $('.menu-toggle');
function closeMenu() {
  menuToggle?.setAttribute('aria-expanded','false');
  menu?.classList.remove('is-open');
  if(menu) menu.inert = true;
  document.body.classList.remove('menu-open');
}
menuToggle?.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') !== 'true';
  menuToggle.setAttribute('aria-expanded',String(open));
  menu.classList.toggle('is-open',open);
  menu.inert = !open;
  document.body.classList.toggle('menu-open',open);
});
$$('a',menu).forEach(link=>link.addEventListener('click',closeMenu));
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});

let toastTimer;
function toast(text) {
  const box = $('.toast');
  box.textContent = text;
  box.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>box.classList.remove('is-visible'),2600);
}
$$('[data-copy]').forEach(button=>button.addEventListener('click',async()=>{
  const text = button.dataset.copy;
  try {
    if(navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(text);
    else {
      const input=document.createElement('textarea');
      input.value=text; input.style.cssText='position:fixed;opacity:0'; document.body.append(input); input.select();
      const copied=document.execCommand('copy'); input.remove();
      if(!copied) throw Error('copy failed');
    }
    toast('邮箱已复制');
  } catch { toast('请长按或选中邮箱进行复制'); }
}));

const grid=$('.project-grid');
if(grid){
  const cards=$$('.project-card',grid), filters=$$('.filter-button');
  const more=$('.show-more');
  const status=$('.filter-status');
  function filter(category){
    filters.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===category)));
    cards.forEach(card=>{card.hidden=category!=='all' && card.dataset.category!==category;});
    grid.classList.toggle('has-filter',category!=='all');
    if(category==='all' && !grid.dataset.expanded){grid.setAttribute('data-limited','');more.hidden=false;}
    else {grid.removeAttribute('data-limited');more.hidden=true;}
    const count=cards.filter(c=>!c.hidden).length;
    status.textContent=`显示 ${category==='all'&&!grid.dataset.expanded?8:count} 个项目，共 ${count} 个`;
  }
  filters.forEach(button=>button.addEventListener('click',()=>filter(button.dataset.filter)));
  more.addEventListener('click',()=>{grid.dataset.expanded='true';grid.removeAttribute('data-limited');more.hidden=true;status.textContent=`已显示全部 ${cards.length} 个项目`;});
  filter('all');
}

const hero=$('.hero');
const frame=$('.focus-frame');
if(hero&&frame){
  let dragging=false, point=null;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function move(x,y){
    const rect=hero.getBoundingClientRect(), f=frame.getBoundingClientRect();
    point={x:Math.max(f.width/2+12,Math.min(rect.width-f.width/2-12,x)),y:Math.max(f.height/2+100,Math.min(rect.height-f.height/2-110,y))};
    hero.style.setProperty('--focus-x',point.x+'px');hero.style.setProperty('--focus-y',point.y+'px');
  }
  frame.addEventListener('pointerdown',e=>{
    if(e.pointerType!=='mouse' || matchMedia('(max-width:700px)').matches)return;
    dragging=true;frame.classList.add('is-dragging');frame.setPointerCapture(e.pointerId);e.preventDefault();
  });
  frame.addEventListener('pointermove',e=>{if(!dragging)return;const r=hero.getBoundingClientRect();move(e.clientX-r.left,e.clientY-r.top);});
  const release=()=>{dragging=false;frame.classList.remove('is-dragging');};
  frame.addEventListener('pointerup',release);frame.addEventListener('pointercancel',release);
  frame.addEventListener('keydown',e=>{
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;
    e.preventDefault();const r=hero.getBoundingClientRect(),f=frame.getBoundingClientRect();
    move(f.x-r.x+f.width/2+(e.key==='ArrowLeft'?-16:e.key==='ArrowRight'?16:0),f.y-r.y+f.height/2+(e.key==='ArrowUp'?-16:e.key==='ArrowDown'?16:0));
  });
  window.addEventListener('resize',()=>{hero.style.removeProperty('--focus-x');hero.style.removeProperty('--focus-y');point=null;});
  if(!reduced)hero.classList.add('is-ready');
}

$$('video').forEach(video=>video.addEventListener('play',()=>{$$('video').forEach(other=>{if(other!==video)other.pause();});}));

const viewer=$('.case-viewer');
if(viewer){
  const buttons=$$('[data-view-mode]');
  const stage=$('.board-stage',viewer), canvas=$('.figma-canvas',viewer);
  function sizeBoard(){
    if(!stage || !canvas)return;
    if(stage.clientWidth===0)return;
    const width=Number(stage.dataset.width),height=Number(stage.dataset.height),scale=stage.clientWidth/width;
    canvas.style.transform=`scale(${scale})`;
    stage.style.height=height*scale+'px';
  }
  function changeView(mode){viewer.dataset.view=mode;buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.viewMode===mode)));if(mode==='original')sizeBoard();}
  buttons.forEach(button=>button.addEventListener('click',()=>changeView(button.dataset.viewMode)));
  changeView(matchMedia('(max-width:700px)').matches?'reading':'original');
  if(stage)new ResizeObserver(sizeBoard).observe(stage);
  const progress=$('.case-progress');
  let scheduled=false;
  const updateProgress=()=>{const box=viewer.getBoundingClientRect();const ratio=Math.max(0,Math.min(1,-box.top/(viewer.offsetHeight-innerHeight)));if(progress)progress.style.width=ratio*100+'%';scheduled=false;};
  addEventListener('scroll',()=>{if(!scheduled){scheduled=true;requestAnimationFrame(updateProgress);}},{passive:true});
  updateProgress();
}

const compare=$('.compare-frame');
if(compare){
  const input=$('input',compare);
  input.addEventListener('input',()=>compare.style.setProperty('--reveal',input.value+'%'));
  $$('[data-before]').forEach(button=>button.addEventListener('click',()=>{
    $('.compare-before').src=button.dataset.before;$('.compare-after').src=button.dataset.after;
    $('.compare-before').alt=button.textContent+'处理前';$('.compare-after').alt=button.textContent+'处理后';
    $('.compare-copy h3').textContent=button.textContent;
    $$('[data-before]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  }));
}

const lightbox=$('.lightbox');
let pictures=[], pictureIndex=0, previousFocus=null;
function displayPicture(index){
  if(!pictures.length)return;
  pictureIndex=(index+pictures.length)%pictures.length;
  const source=pictures[pictureIndex];
  const img=$('.lightbox-stage img',lightbox);
  img.src=source.dataset.preview || source.currentSrc || source.src;
  img.alt=source.dataset.caption || source.alt || '作品细节';
  $('.lightbox-caption',lightbox).textContent=`${pictureIndex+1} / ${pictures.length}  ·  ${img.alt}`;
  lightbox.classList.remove('is-original');$('.lightbox-size',lightbox).setAttribute('aria-pressed','false');$('.lightbox-size',lightbox).textContent='原尺寸';
}
function openPicture(target){
  const area=target.closest('.case-reading,.figma-canvas') || document;
  const visible=$$('img[data-zoom]',area).filter(img=>img.getClientRects().length);
  pictures=visible.filter((img,index)=>!img.dataset.original||visible.findIndex(other=>other.dataset.original===img.dataset.original)===index);
  pictureIndex=pictures.findIndex(img=>img===target||(target.dataset.original&&img.dataset.original===target.dataset.original));
  if(pictureIndex<0)return;
  previousFocus=target;displayPicture(pictureIndex);lightbox.showModal();document.documentElement.style.overflow='hidden';
}
function closeLightbox(){
  lightbox.close();document.documentElement.style.overflow='';
  if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});
}
document.addEventListener('click',e=>{const target=e.target.closest?.('img[data-zoom]');if(target)openPicture(target);});
document.addEventListener('keydown',e=>{
  if(e.key==='Enter' && e.target.matches?.('img[data-zoom]'))openPicture(e.target);
  if(!lightbox.open)return;
  if(e.key==='ArrowLeft'){e.preventDefault();displayPicture(pictureIndex-1);}
  if(e.key==='ArrowRight'){e.preventDefault();displayPicture(pictureIndex+1);}
});
$('.lightbox-close',lightbox)?.addEventListener('click',closeLightbox);
lightbox?.addEventListener('cancel',e=>{e.preventDefault();closeLightbox();});
$('.lightbox-prev',lightbox)?.addEventListener('click',()=>displayPicture(pictureIndex-1));
$('.lightbox-next',lightbox)?.addEventListener('click',()=>displayPicture(pictureIndex+1));
$('.lightbox-stage',lightbox)?.addEventListener('click',e=>{if(e.target.classList.contains('lightbox-stage'))closeLightbox();});
$('.lightbox-size',lightbox)?.addEventListener('click',()=>{const original=lightbox.classList.toggle('is-original');const source=pictures[pictureIndex];if(source?.dataset.original)$('.lightbox-stage img',lightbox).src=original?source.dataset.original:source.dataset.preview;$('.lightbox-size',lightbox).setAttribute('aria-pressed',String(original));$('.lightbox-size',lightbox).textContent=original?'适合屏幕':'原尺寸';});

$$('.back-top').forEach(link=>link.addEventListener('click',e=>{e.preventDefault();window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}));
