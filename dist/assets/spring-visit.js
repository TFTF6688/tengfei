/* One fifteen-second visit per light-theme entry. All artwork is decorative. */
(() => {
  'use strict';
  const root=document.querySelector('.minimal'),title=root?.querySelector('.m-title'),stage=root?.querySelector('.m-stage');
  if(!root||!title||!stage)return;
  const motion=matchMedia('(prefers-reduced-motion: reduce)'),mobile=matchMedia('(max-width:720px)');
  const clamp=v=>Math.max(0,Math.min(1,v)),smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
  const mix=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
  const bezier=(a,b,c,d,t)=>{const s=1-t;return{x:s*s*s*a.x+3*s*s*t*b.x+3*s*t*t*c.x+t*t*t*d.x,y:s*s*s*a.y+3*s*s*t*b.y+3*s*t*t*c.y+t*t*t*d.y};};
  const scene=document.createElement('div'),backdrop=document.createElement('div');
  scene.className='spring-visit';backdrop.className='spring-backdrop';
  for(const el of [scene,backdrop]){el.setAttribute('aria-hidden','true');el.hidden=true;root.append(el);}
  const blossom=`<g fill="currentColor"><ellipse cy="-17" rx="9" ry="17"/><ellipse cy="-17" rx="9" ry="17" transform="rotate(72)"/><ellipse cy="-17" rx="9" ry="17" transform="rotate(144)"/><ellipse cy="-17" rx="9" ry="17" transform="rotate(216)"/><ellipse cy="-17" rx="9" ry="17" transform="rotate(288)"/></g><circle r="5" fill="#ddd1b3"/>`;
  const motifs=[[11,12,140],[34,58,180],[73,5,110],[88,67,155],[3,71,110],[53,82,95],[45,20,70]];
  backdrop.innerHTML=motifs.map(([x,y,size],i)=>`<div class="spring-motif" style="--x:${x}%;--y:${y}%;--size:${size}px;--delay:-${i*1.7}s"><svg viewBox="-40 -40 80 80">${blossom}</svg></div>`).join('');
  scene.innerHTML=`<canvas class="spring-smoke"></canvas><div class="spring-butterfly"><svg viewBox="-60 -90 120 105" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="spring-upper" x1="0" y1="1" x2="1" y2="0"><stop stop-color="#84b9c7"/><stop offset=".42" stop-color="#a39ccc"/><stop offset=".76" stop-color="#d5a0ba"/><stop offset="1" stop-color="#e8bb8f"/></linearGradient>
      <linearGradient id="spring-lower" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#91c7ba"/><stop offset=".48" stop-color="#b9cfa5"/><stop offset="1" stop-color="#e1b9c9"/></linearGradient>
    </defs>
    <g class="spring-wings" stroke="#687d8a" stroke-width=".8" stroke-linejoin="round">
      <g id="spring-wing-half">
        <path d="M-2-29C-10-49-30-78-48-74C-62-68-49-34-30-24C-41-25-49-14-43-3C-36 11-12 1-2-25Z" fill="url(#spring-lower)"/>
        <path d="M-2-29C-11-51-31-80-49-74C-61-65-48-38-33-30C-24-24-13-25-2-26Z" fill="url(#spring-upper)"/>
        <g fill="none" stroke="#f6f1e3" stroke-width=".65" opacity=".65"><path d="M-3-28Q-22-40-47-68M-3-28Q-22-29-49-51M-3-28Q-21-13-38-2M-3-28Q-22-19-43-15"/></g>
        <path d="M-47-64Q-39-47-26-37M-39-2Q-25-4-16-17" fill="none" stroke="#647e8b" opacity=".4"/>
        <g fill="#fff5dc" stroke="none" opacity=".9"><ellipse cx="-46" cy="-65" rx="2" ry="3" transform="rotate(-30 -46 -65)"/><circle cx="-44" cy="-54" r="1.5"/><circle cx="-38" cy="-43" r="1.2"/><circle cx="-38" cy="-9" r="1.5"/><circle cx="-29" cy="-4" r="1.2"/></g>
      </g><use href="#spring-wing-half" transform="scale(-1 1)"/>
    </g>
    <g stroke="#52646c" stroke-linecap="round" fill="none"><path d="M-2-16L-7-3L-4 0M2-16L7-3L4 0" stroke-width=".85"/><path d="M-1-37Q-12-51-8-55M1-37Q12-51 8-55" stroke-width=".8"/></g>
    <ellipse cy="-24" rx="2.7" ry="14" fill="#536a72"/><path d="M0-31V-13" stroke="#bfd2c0" stroke-width="1.1"/><circle cy="-38" r="3.2" fill="#586e74"/>
  </svg></div>`;
  const butterfly=scene.querySelector('.spring-butterfly'),wings=scene.querySelector('.spring-wings'),canvas=scene.querySelector('canvas'),ctx=canvas.getContext('2d');
  if(!ctx){scene.remove();backdrop.remove();return;}
  // Keep the atmospheric trail behind the typography; flowers and butterfly sit above it.
  root.append(canvas);canvas.hidden=true;
  const markers=[[0,0],[100,0],[100,100],[0,100]].map(([x,y])=>{const el=document.createElement('i');el.setAttribute('aria-hidden','true');el.style.cssText=`position:absolute;left:${x}%;top:${y}%;width:0;height:0;pointer-events:none`;stage.append(el);return el;});
  const gardens={title:[],image:[]};
  function makeSprig(i){
    const el=document.createElement('div');el.className='spring-sprig';el.style.setProperty('--delay',`${-i*.43}s`);
    const color=['#c9aabb','#b8b4cd','#dbc8a6','#bbcad2'][i%4];
    el.innerHTML=`<svg viewBox="0 0 52 82" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke="#94aa96" stroke-width="1.1" stroke-linecap="round"><path d="M26 82Q19 54 29 26M25 78Q10 64 6 49M25 78Q39 66 45 51"/></g><g fill="#a6b9a0" opacity=".85"><path d="M24 64Q8 68 13 53Q23 52 24 64M25 54Q39 55 38 41Q27 42 25 54M18 67Q4 67 4 57Q14 56 18 67M33 69Q47 69 48 59Q37 57 33 69"/></g><g transform="translate(29 25) scale(.32)" style="color:${color}">${blossom}</g><g transform="translate(7 48) scale(.18)" style="color:${color}">${blossom}</g><g transform="translate(45 50) scale(.14)" style="color:${color}">${blossom}</g></svg>`;
    scene.append(el);return el;
  }
  for(let i=0;i<5;i++)gardens.title.push(makeSprig(i));
  for(let i=0;i<8;i++)gardens.image.push(makeSprig(i+5));
  const particles=[],colors=['191,212,179','212,182,206','173,205,216','225,207,163'];
  let width=1,height=1,raf=0,last=0,elapsed=0,wait=1.5,played=false,disposed=false,inView=true,emission=0,previousTheme=document.documentElement.dataset.theme;
  const fontCanvas=document.createElement('canvas'),fontContext=fontCanvas.getContext('2d');
  function geometry(){
    const r=root.getBoundingClientRect(),bounds=title.getBoundingClientRect(),node=title.querySelector('b')?.firstChild;
    if(!node||node.nodeType!==Node.TEXT_NODE||node.length<6)return null;
    const range=document.createRange();range.setStart(node,5);range.setEnd(node,6);const letter=range.getBoundingClientRect(),style=getComputedStyle(node.parentElement);
    fontContext.font=`${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;const metrics=fontContext.measureText('l');
    const l={x:letter.left-r.left+metrics.width*.5,y:letter.top-r.top+(metrics.fontBoundingBoxAscent??parseFloat(style.fontSize)*.9)-(metrics.actualBoundingBoxAscent??parseFloat(style.fontSize)*.72)};
    const quad=markers.map(el=>{const p=el.getBoundingClientRect();return{x:p.left-r.left,y:p.top-r.top};});
    return{l,quad,image:mix(quad[0],quad[1],.62),title:{left:bounds.left-r.left,top:bounds.top-r.top,right:bounds.right-r.left,bottom:bounds.bottom-r.top}};
  }
  function sprig(el,p,angle,grow,index){
    const s=(mobile.matches?.72:1)*(.7+(index%3)*.15),w=mobile.matches?34:52,h=mobile.matches?54:82;
    el.style.transform=`translate(${p.x-w/2}px,${p.y-h}px) rotate(${angle}deg) scale(${s},${s*grow})`;el.style.opacity=String(grow*.7);
  }
  function flowers(g,t){
    const a=g.title,pad=mobile.matches?5:10,points=[{x:a.left+pad,y:a.top+14},{x:a.left-5,y:a.top+(a.bottom-a.top)*.6},{x:a.left+25,y:a.bottom+4},{x:a.right-3,y:a.bottom+3},{x:g.l.x+13,y:g.l.y+2}];
    gardens.title.forEach((el,i)=>sprig(el,points[i],[-32,-60,-14,34,18][i],smooth((t-3.3-i*.075)/.75),i));
    const q=g.quad,anchors=[q[0],mix(q[0],q[1],.3),mix(q[0],q[1],.82),q[1],mix(q[1],q[2],.58),q[2],mix(q[3],q[2],.24),q[3]];
    gardens.image.forEach((el,i)=>sprig(el,anchors[i],[-35,-10,22,38,85,145,174,-145][i],smooth((t-9.1-i*.055)/.8),i));
  }
  function trail(p,dt,emit){
    ctx.clearRect(0,0,width,height);
    if(!emit){particles.length=0;emission=0;return;}
    emission+=dt*24;while(emission>=1){emission--;particles.push({x:p.x+(Math.random()-.5)*10,y:p.y-17+(Math.random()-.5)*9,age:0,life:.8+Math.random()*.35,r:15+Math.random()*12,color:colors[Math.floor(Math.random()*colors.length)],drift:(Math.random()-.5)*17});}
    for(let i=particles.length-1;i>=0;i--){const s=particles[i];s.age+=dt;if(s.age>s.life){particles.splice(i,1);continue;}s.x+=s.drift*dt;s.y-=12*dt;const f=s.age/s.life,r=s.r*(.65+f),gradient=ctx.createRadialGradient(s.x,s.y,0,s.x,s.y,r);gradient.addColorStop(0,`rgba(${s.color},${(1-f)*.16})`);gradient.addColorStop(.55,`rgba(${s.color},${(1-f)*.06})`);gradient.addColorStop(1,`rgba(${s.color},0)`);ctx.fillStyle=gradient;ctx.fillRect(s.x-r,s.y-r,r*2,r*2);}
  }
  function pose(t,g,dt){
    let p,phase,flight=true,progress=0,open,bank=0;
    if(t<3.3){phase='arriving';progress=t/3.3;p=bezier({x:width+80,y:height*.24},{x:width*.7,y:height*.04},{x:g.l.x+60,y:g.l.y-80},g.l,smooth(progress));bank=-13*Math.sin(progress*Math.PI);}
    else if(t<5.8){phase='title';flight=false;p=g.l;const flap=clamp((t-3.9)/1.45);open=.22+.72*Math.sin(flap*Math.PI*2)**2;}
    else if(t<9.1){phase='crossing';progress=(t-5.8)/3.3;p=bezier(g.l,{x:g.l.x+70,y:g.l.y-130},{x:g.image.x-130,y:g.image.y-95},g.image,smooth(progress));bank=16*Math.sin(progress*Math.PI);}
    else if(t<12){phase='image';flight=false;p=g.image;const flap=clamp((t-9.65)/1.9);open=.22+.72*Math.sin(flap*Math.PI*3)**2;}
    else{phase='departing';progress=(t-12)/3;p=bezier(g.image,{x:g.image.x+80,y:g.image.y-115},{x:width-30,y:height*.12},{x:width+100,y:height*.2},smooth(progress));bank=17*Math.sin(progress*Math.PI);}
    if(flight){open=.18+.82*(.5+.5*Math.sin(t*Math.PI*13));p.y+=Math.sin(t*5)*5*Math.sin(progress*Math.PI);}
    const scale=mobile.matches?62/120:88/120;butterfly.style.transform=`translate(${p.x-60*scale}px,${p.y-90*scale}px) rotate(${bank}deg)`;butterfly.style.transformOrigin=`${60*scale}px ${90*scale}px`;
    wings.setAttribute('transform',`translate(0 -27) scale(${open} 1) translate(0 27)`);
    const holdTitle=t>=2.8&&t<5.8;if(root.hasAttribute('data-title-perch')!==holdTitle)root.toggleAttribute('data-title-perch',holdTitle);
    const active=t>=3.3||p.x<=width+(mobile.matches?28:40);if(root.hasAttribute('data-spring-active')!==active){root.toggleAttribute('data-spring-active',active);root.classList.toggle('spring-garden',active);}
    scene.dataset.phase=phase;scene.classList.toggle('is-leaving',t>14.35);flowers(g,t);trail(p,dt,flight&&(phase==='departing'||progress<.85));
  }
  function cancel(){
    root.removeAttribute('data-spring-active');root.removeAttribute('data-title-perch');if(root.classList.contains('spring-garden'))root.classList.remove('spring-garden');scene.hidden=true;backdrop.hidden=true;canvas.hidden=true;scene.classList.remove('is-leaving');scene.dataset.phase='idle';particles.length=0;ctx.clearRect(0,0,width,height);elapsed=0;wait=1.5;emission=0;
  }
  function eligible(){return !disposed&&!motion.matches&&document.documentElement.dataset.theme!=='dark'&&!root.classList.contains('focused');}
  function running(){return eligible()&&!played&&!document.hidden&&inView&&!document.querySelector('dialog[open]');}
  function draw(now){
    raf=0;if(!running())return;
    const delta=last?(now-last)/1000:0,dt=Math.min(delta,.06);last=now;
    if(wait>0)wait-=delta;
    else{const g=geometry();if(g){elapsed+=delta;scene.hidden=false;backdrop.hidden=false;canvas.hidden=false;pose(Math.min(elapsed,15),g,dt);if(elapsed>=15){played=true;cancel();scene.dataset.phase='complete';return;}}}
    raf=requestAnimationFrame(draw);
  }
  function sync(){
    const theme=document.documentElement.dataset.theme;if(theme!==previousTheme){previousTheme=theme;played=false;cancel();}
    if(!eligible()){cancel();if(raf)cancelAnimationFrame(raf);raf=0;last=0;return;}
    if(!running()){if(raf)cancelAnimationFrame(raf);raf=0;last=0;scene.hidden=true;backdrop.hidden=true;canvas.hidden=true;return;}
    if(!raf){last=0;raf=requestAnimationFrame(draw);}
  }
  function resize(){width=root.clientWidth;height=root.clientHeight;const ratio=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.ceil(width*ratio);canvas.height=Math.ceil(height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);}
  const ro=new ResizeObserver(resize);ro.observe(root);
  const io=new IntersectionObserver(([entry])=>{inView=entry.isIntersecting;sync();});io.observe(root);
  const observer=new MutationObserver(sync);observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});observer.observe(root,{attributes:true,attributeFilter:['class']});document.querySelectorAll('dialog').forEach(el=>observer.observe(el,{attributes:true,attributeFilter:['open']}));
  motion.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);
  window.addEventListener('pagehide',e=>{if(e.persisted)return;disposed=true;if(raf)cancelAnimationFrame(raf);observer.disconnect();ro.disconnect();io.disconnect();motion.removeEventListener('change',sync);document.removeEventListener('visibilitychange',sync);cancel();scene.remove();backdrop.remove();canvas.remove();markers.forEach(el=>el.remove());});
  resize();sync();
})();
