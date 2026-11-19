/* Light-theme rain. The original pixel snow remains dedicated to dark mode. */
(() => {
  'use strict';
  const root=document.querySelector('.minimal'),layer=root?.querySelector('.rain-container');
  if(!layer)return;
  const canvas=layer.querySelector('canvas'),ctx=canvas.getContext('2d');
  if(!ctx){layer.hidden=true;return;}
  const motion=matchMedia('(prefers-reduced-motion: reduce)'),mobile=matchMedia('(max-width:720px)');
  let width=1,height=1,raf=0,last=0,time=0,intro=0,disposed=false;
  const drops=[];
  function spawn(drop,top=false){
    const depth=Math.random();
    Object.assign(drop,{x:Math.random()*(width+60)-30,y:top?-30-Math.random()*70:Math.random()*height,length:8+depth*18,speed:150+depth*190,alpha:.18+depth*.23,width:depth>.72?1.1:.7});
  }
  function allowed(){return !disposed&&document.documentElement.dataset.theme!=='dark'&&!motion.matches&&!document.hidden&&!document.querySelector('dialog[open]');}
  function draw(now){
    raf=0;if(!allowed())return;
    if(last&&now-last<1000/30){raf=requestAnimationFrame(draw);return;}
    const dt=last?Math.min((now-last)/1000,.06):1/30;last=now;time+=dt;intro=Math.min(1,intro+dt);
    ctx.clearRect(0,0,width,height);ctx.lineCap='butt';ctx.strokeStyle=root.classList.contains('focused')?'#f2f5f4':'#60777d';
    const wind=.15+Math.sin(time*.32)*.025,fade=intro*intro*(3-2*intro);
    for(const drop of drops){
      drop.y+=drop.speed*dt;drop.x+=drop.speed*wind*dt;
      if(drop.y>height+30)spawn(drop,true);if(drop.x>width+30)drop.x=-30;
      ctx.globalAlpha=drop.alpha*fade;ctx.lineWidth=drop.width;ctx.beginPath();ctx.moveTo(drop.x,drop.y);ctx.lineTo(drop.x+drop.length*wind,drop.y+drop.length);ctx.stroke();
    }
    ctx.globalAlpha=1;layer.dataset.ready='true';raf=requestAnimationFrame(draw);
  }
  function sync(){
    const active=allowed();layer.hidden=!active;
    if(!active){if(raf)cancelAnimationFrame(raf);raf=0;last=0;return;}
    if(!raf){last=0;raf=requestAnimationFrame(draw);}
  }
  function resize(){
    width=Math.max(1,root.clientWidth);height=Math.max(1,root.clientHeight);const ratio=Math.min(devicePixelRatio||1,1.5);
    canvas.width=Math.ceil(width*ratio);canvas.height=Math.ceil(height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);
    const count=Math.min(mobile.matches?70:280,Math.round(width*height/(mobile.matches?8500:6500)));
    while(drops.length<count){const drop={};spawn(drop);drops.push(drop);}drops.length=count;
    for(const drop of drops){if(drop.x>width||drop.y>height)spawn(drop);}sync();
  }
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(root);
  const observer=new MutationObserver(sync);observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});observer.observe(root,{attributes:true,attributeFilter:['class']});
  document.querySelectorAll('dialog').forEach(d=>observer.observe(d,{attributes:true,attributeFilter:['open']}));
  motion.addEventListener('change',sync);mobile.addEventListener('change',resize);document.addEventListener('visibilitychange',sync);
  function destroy(){if(disposed)return;disposed=true;if(raf)cancelAnimationFrame(raf);resizeObserver.disconnect();observer.disconnect();motion.removeEventListener('change',sync);mobile.removeEventListener('change',resize);document.removeEventListener('visibilitychange',sync);layer.hidden=true;}
  window.addEventListener('pagehide',e=>{if(!e.persisted)destroy();});resize();
})();
