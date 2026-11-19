/* Light-theme rain. The original pixel snow remains dedicated to dark mode. */
(() => {
  'use strict';
  const root=document.querySelector('.minimal'),layer=root?.querySelector('.rain-container');
  if(!layer)return;
  const canvas=layer.querySelector('canvas'),ctx=canvas.getContext('2d');
  if(!ctx){layer.hidden=true;return;}
  const motion=matchMedia('(prefers-reduced-motion: reduce)'),mobile=matchMedia('(max-width:720px)');
  let width=1,height=1,raf=0,last=0,time=0,intro=0,disposed=false;
  const stage=root.querySelector('.m-stage'),drops=[],splashes=[],beads=[],front=[0,0],flow=[0,0],wave=new Float32Array(56),velocity=new Float32Array(56);
  let water=0,shape=null,ink='#60777d',inkRGB='96,119,125';
  const tint=alpha=>`rgba(${inkRGB},${alpha})`;
  const markers=[[0,0],[100,0],[100,100],[0,100]].map(([x,y])=>{const m=document.createElement('i');m.setAttribute('aria-hidden','true');m.style.cssText=`position:absolute;left:${x}%;top:${y}%;width:0;height:0;pointer-events:none`;stage.append(m);return m;});
  const sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y}),cross=(a,b)=>a.x*b.y-a.y*b.x,mix=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
  function inside(p,polygon){let sign=0;for(let i=0;i<polygon.length;i++){const c=cross(sub(polygon[(i+1)%polygon.length],polygon[i]),sub(p,polygon[i]));if(Math.abs(c)<.001)continue;const next=Math.sign(c);if(sign&&next!==sign)return false;sign=next;}return true;}
  function intersect(a,b,c,d){const r=sub(b,a),s=sub(d,c),den=cross(r,s);if(Math.abs(den)<.00001)return null;const q=sub(c,a),t=cross(q,s)/den,u=cross(q,r)/den;return t>=0&&t<=1&&u>=0&&u<=1?{t,u,point:mix(a,b,t)}:null;}
  function hull(points){const sorted=points.slice().sort((a,b)=>a.x-b.x||a.y-b.y),lower=[],upper=[];for(const p of sorted){while(lower.length>1&&cross(sub(lower.at(-1),lower.at(-2)),sub(p,lower.at(-1)))<=0)lower.pop();lower.push(p);}for(const p of sorted.slice().reverse()){while(upper.length>1&&cross(sub(upper.at(-1),upper.at(-2)),sub(p,upper.at(-1)))<=0)upper.pop();upper.push(p);}return lower.slice(0,-1).concat(upper.slice(0,-1));}
  function path(points){ctx.moveTo(points[0].x,points[0].y);for(const p of points.slice(1))ctx.lineTo(p.x,p.y);ctx.closePath();}
  function geometry(wind){const r=root.getBoundingClientRect(),quad=markers.map(m=>{const b=m.getBoundingClientRect();return{x:b.left-r.left,y:b.top-r.top};}),t=sub(quad[1],quad[0]),length=Math.hypot(t.x,t.y);if(length<2)return null;const tangent={x:t.x/length,y:t.y/length},normal={x:-tangent.y,y:tangent.x};return{quad,tangent,normal,shadow:hull(quad.concat(quad.map(p=>({x:p.x+wind*height*3,y:p.y+height*3}))))};}
  function impact(hit,drop){const i=Math.min(wave.length-1,Math.round(hit.u*(wave.length-1)));water=Math.min(5,water+.065+drop.width*.025);velocity[i]+=3.5+drop.width*2;for(let n=0;n<(mobile.matches?2:3)&&splashes.length<100;n++){const side=(Math.random()-.5)*85,up=32+Math.random()*55;splashes.push({x:hit.point.x-shape.normal.x,y:hit.point.y-shape.normal.y,vx:shape.tangent.x*side-shape.normal.x*up,vy:shape.tangent.y*side-shape.normal.y*up,life:.32+Math.random()*.22,size:.65+Math.random()*.75});}}
  function edge(side){const a=shape.quad[side?1:0],b=shape.quad[side?2:3],v=sub(b,a),length=Math.hypot(v.x,v.y),direction={x:v.x/Math.max(length,1),y:v.y/Math.max(length,1)};return{a,b,length,direction,outward:{x:(side?1:-1)*direction.y,y:(side?-1:1)*direction.x}};}
  function waterEffects(dt,fade){
    const steps=Math.ceil(dt/.016),h=dt/steps;for(let k=0;k<steps;k++){for(let i=0;i<wave.length;i++)velocity[i]+=((wave[Math.max(0,i-1)]+wave[Math.min(wave.length-1,i+1)]-2*wave[i])*95-wave[i]*20-velocity[i]*7)*h;for(let i=0;i<wave.length;i++)wave[i]=Math.max(-1.5,Math.min(1.5,wave[i]+velocity[i]*h));}
    water=Math.max(0,water-water*.16*dt);if(!shape)return;
    const {quad,normal}=shape,level=Math.min(3.2,water),surface=[];
    if(level>.025){for(let i=0;i<wave.length;i++){const t=i/(wave.length-1),b=mix(quad[0],quad[1],t),rise=Math.max(.15,level+wave[i]+Math.sin(t*21+time*1.8)*.18);surface.push({x:b.x-normal.x*rise,y:b.y-normal.y*rise});}
      const p=mix(quad[0],quad[1],.5),gradient=ctx.createLinearGradient(p.x-normal.x*6,p.y-normal.y*6,p.x+normal.x,p.y+normal.y);gradient.addColorStop(0,tint(.06));gradient.addColorStop(.7,tint(.18));gradient.addColorStop(1,tint(.32));ctx.globalAlpha=fade;ctx.fillStyle=gradient;ctx.beginPath();ctx.moveTo(surface[0].x,surface[0].y);for(const p of surface.slice(1))ctx.lineTo(p.x,p.y);ctx.lineTo(quad[1].x+normal.x*.7,quad[1].y+normal.y*.7);ctx.lineTo(quad[0].x+normal.x*.7,quad[0].y+normal.y*.7);ctx.closePath();ctx.fill();ctx.strokeStyle=tint(.38);ctx.lineWidth=.65;ctx.beginPath();ctx.moveTo(surface[0].x,surface[0].y);for(const p of surface.slice(1))ctx.lineTo(p.x,p.y);ctx.stroke();}
    for(let side=0;side<2;side++){const e=edge(side);front[side]=water>.35?Math.min(e.length,front[side]+(60+water*31)*dt):Math.max(0,front[side]-8*dt);flow[side]+=Math.max(0,water-.35)*.8*dt;while(flow[side]>=1&&beads.length<60){flow[side]--;beads.push({side,distance:0,speed:55+Math.random()*35,size:.9+Math.random()*.8,tail:10+Math.random()*16,free:false});}if(front[side]<1)continue;
      ctx.globalAlpha=fade*Math.min(.28,water*.1);ctx.lineWidth=2;ctx.strokeStyle=ink;ctx.lineCap='round';ctx.beginPath();for(let i=0;i<=18;i++){const d=front[side]*i/18,w=Math.sin(d*.065-time*2.5)*.7,x=e.a.x+e.direction.x*d+e.outward.x*(1+w),y=e.a.y+e.direction.y*d+e.outward.y*(1+w);if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);}ctx.stroke();ctx.globalAlpha=fade*.25;ctx.lineWidth=.55;ctx.strokeStyle=ink;ctx.stroke();}
    for(let i=beads.length-1;i>=0;i--){const b=beads[i],e=edge(b.side);b.speed+=110*dt;b.distance+=b.speed*dt;const p={x:e.a.x+e.direction.x*Math.min(b.distance,e.length)+e.outward.x*1.3,y:e.a.y+e.direction.y*Math.min(b.distance,e.length)+e.outward.y*1.3};if(b.distance>e.length){if(!b.free){b.free=true;b.x=p.x;b.y=p.y;b.vy=b.speed;b.life=.8;}b.vy+=350*dt;b.y+=b.vy*dt;b.x+=e.outward.x*9*dt;b.life-=dt;p.x=b.x;p.y=b.y;if(b.life<=0||b.y>height+30){beads.splice(i,1);continue;}}
      ctx.globalAlpha=fade*(b.free?.4:.48);ctx.strokeStyle=ink;ctx.lineWidth=b.size;ctx.beginPath();ctx.moveTo(p.x-(b.free?0:e.direction.x)*b.tail,p.y-(b.free?1:e.direction.y)*b.tail);ctx.lineTo(p.x,p.y);ctx.stroke();ctx.fillStyle=ink;ctx.beginPath();ctx.ellipse(p.x,p.y,b.size*.65,b.size*1.25,0,0,Math.PI*2);ctx.fill();}
    for(let i=splashes.length-1;i>=0;i--){const p=splashes[i];p.life-=dt;p.vy+=230*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.life<=0||inside(p,quad)){splashes.splice(i,1);continue;}ctx.globalAlpha=fade*p.life/.54*.4;ctx.fillStyle=ink;ctx.beginPath();ctx.ellipse(p.x,p.y,p.size*.7,p.size,0,0,Math.PI*2);ctx.fill();}
  }
  function spawn(drop,top=false){
    const depth=Math.random();
    Object.assign(drop,{x:Math.random()*(width+60)-30,y:top?-30-Math.random()*70:Math.random()*height,length:9+depth*14,speed:150+depth*190,alpha:.15+depth*.19,width:depth>.72?.85:.55});
  }
  function allowed(){return !disposed&&document.documentElement.dataset.theme!=='dark'&&!motion.matches&&!document.hidden&&!document.querySelector('dialog[open]');}
  function draw(now){
    raf=0;if(!allowed())return;
    if(last&&now-last<1000/30){raf=requestAnimationFrame(draw);return;}
    const dt=last?Math.min((now-last)/1000,.06):1/30;last=now;time+=dt;intro=Math.min(1,intro+dt);
    ctx.clearRect(0,0,width,height);ctx.lineCap='round';const focused=root.classList.contains('focused');ink=focused?'#f2f5f4':'#60777d';inkRGB=focused?'242,245,244':'96,119,125';ctx.strokeStyle=ink;
    const wind=.15+Math.sin(time*.32)*.025,fade=intro*intro*(3-2*intro);shape=geometry(wind);
    // The obstacle is extruded downwind to leave a dry rain shadow beneath the image.
    ctx.save();if(shape){ctx.beginPath();ctx.rect(0,0,width,height);path(shape.shadow);ctx.clip('evenodd');}
    for(const drop of drops){
      const previous={x:drop.x+drop.length*wind,y:drop.y+drop.length};drop.y+=drop.speed*dt;drop.x+=drop.speed*wind*dt;const next={x:drop.x+drop.length*wind,y:drop.y+drop.length};
      if(shape){let hit=null,edgeIndex=-1;for(let i=0;i<4;i++){const candidate=intersect(previous,next,shape.quad[i],shape.quad[(i+1)%4]);if(candidate&&(!hit||candidate.t<hit.t)){hit=candidate;edgeIndex=i;}}if(hit){if(edgeIndex===0)impact(hit,drop);else if(edgeIndex===1||edgeIndex===3)water=Math.min(5,water+.025);spawn(drop,true);continue;}if(inside(next,shape.quad)){spawn(drop,true);continue;}}
      if(drop.y>height+30)spawn(drop,true);if(drop.x>width+30)drop.x=-30;
      ctx.globalAlpha=drop.alpha*fade;ctx.lineWidth=drop.width;ctx.beginPath();ctx.moveTo(drop.x,drop.y);ctx.lineTo(drop.x+drop.length*wind,drop.y+drop.length);ctx.stroke();
    }
    ctx.restore();waterEffects(dt,fade);ctx.globalAlpha=1;layer.dataset.ready='true';raf=requestAnimationFrame(draw);
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
  function destroy(){if(disposed)return;disposed=true;if(raf)cancelAnimationFrame(raf);resizeObserver.disconnect();observer.disconnect();motion.removeEventListener('change',sync);mobile.removeEventListener('change',resize);document.removeEventListener('visibilitychange',sync);markers.forEach(m=>m.remove());layer.hidden=true;}
  window.addEventListener('pagehide',e=>{if(!e.persisted)destroy();});resize();
})();
