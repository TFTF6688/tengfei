/* Uses the vertex/fragment shaders supplied by the user. Native WebGL2 adapter retains the existing semantic heading and layout. */
(() => {
'use strict';
const vertex = `#version 300 es
in vec2 position;
in vec2 uv;
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragment = `#version 300 es
precision highp float;

uniform sampler2D uTextTexture;
uniform vec2 uResolution;
uniform vec2 uPointer;
uniform float uPointerActive;
uniform float uTime;
uniform float uWarpStrength;
uniform float uWarpScale;
uniform float uSpeed;
uniform float uPointerInfluence;
uniform float uPointerStrength;
uniform float uRefraction;
uniform float uChromatic;
uniform float uRipple;
uniform float uMotion;
uniform float uLens;
uniform float uIntro;
uniform float uReveal;
uniform float uBackdrop;
uniform vec4 uClicks[4];

in vec2 vUv;
out vec4 fragColor;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);

  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));

  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 4; i++) {
    value += amplitude * noise(p);
    p *= 2.02;
    amplitude *= 0.5;
  }
  return value;
}

vec4 sampleText(vec2 uv) {
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    return vec4(0.0);
  }
  return texture(uTextTexture, uv);
}

void main() {
  vec2 uv = vUv;
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  float time = uTime * uSpeed;
  float scale = max(uWarpScale, 0.001);

  vec2 drift = vec2(time * 0.055, -time * 0.045);
  float n1 = fbm(uv * scale * 3.1 + drift);
  float n2 = fbm((uv + 19.17) * scale * 3.4 - drift.yx);
  vec2 ambient = (vec2(n1, n2) - 0.5) * (uWarpStrength * 0.045 * uMotion + uIntro * 0.18);

  vec2 pointerDelta = uv - uPointer;
  vec2 aspectDelta = vec2(pointerDelta.x * aspect, pointerDelta.y);
  float dist = length(aspectDelta);
  float radius = max(uPointerInfluence, 0.001);
  float t = clamp(dist / radius, 0.0, 1.0);
  float lens = smoothstep(radius, 0.0, dist) * uPointerActive;
  float bulge = t * (1.0 - t) * (1.0 - t) * 6.75 * uPointerActive;
  vec2 dir = dist > 0.0001 ? vec2(aspectDelta.x / aspect, aspectDelta.y) / dist : vec2(0.0);

  float rippleWave = sin(dist * 28.0 - time * 4.2) * 0.5 + 0.5;
  float rippleRing = (rippleWave - 0.5) * uRipple;
  vec2 pointerWarp = dir * rippleRing * bulge * uPointerStrength * 0.016;

  if (uLens > 1.5) {
    float twist = (1.0 - t) * (1.0 - t) * uPointerActive * uPointerStrength * 2.4;
    float s = sin(twist);
    float c = cos(twist);
    vec2 turned = vec2(aspectDelta.x * c - aspectDelta.y * s, aspectDelta.x * s + aspectDelta.y * c);
    pointerWarp += vec2(turned.x / aspect, turned.y) - pointerDelta;
  } else {
    float side = uLens > 0.5 ? -1.0 : 1.0;
    pointerWarp -= dir * side * bulge * uPointerStrength * 0.045;
  }

  vec2 shock = vec2(0.0);
  float shockLight = 0.0;
  for (int i = 0; i < 4; i++) {
    vec4 click = uClicks[i];
    if (click.w <= 0.0) continue;
    vec2 clickDelta = uv - click.xy;
    vec2 clickAspect = vec2(clickDelta.x * aspect, clickDelta.y);
    float clickDist = length(clickAspect);
    float age = click.z;
    float offset = (clickDist - age * 0.9) / (0.06 + age * 0.06);
    float fade = 1.0 - smoothstep(0.0, 1.6, age);
    float energy = exp(-offset * offset) * fade * smoothstep(0.0, 0.08, age) * click.w;
    vec2 clickDir = clickDist > 0.0001 ? vec2(clickAspect.x / aspect, clickAspect.y) / clickDist : vec2(0.0);
    shock -= clickDir * offset * energy * 0.09;
    shockLight += energy;
  }

  vec2 bend = pointerWarp + shock;
  vec2 rest = uv + ambient;
  vec2 splitDir = ambient + bend;
  float splitLen = length(splitDir);
  splitDir = splitLen > 0.00001 ? splitDir / splitLen : vec2(0.7071, 0.7071);
  vec2 split = splitDir * uRefraction * 0.16 * (0.35 + lens * 1.65 + uIntro * 3.0);
  float dispersion = uChromatic * 0.5;

  vec3 ink = vec3(0.0);
  vec3 cover = vec3(0.0);
  vec3 weight = vec3(0.0);
  for (int i = 0; i < 7; i++) {
    float k = 1.0 - float(i) / 3.0;
    vec4 tap = sampleText(rest + bend * (1.0 + dispersion * k) + split * k);
    vec3 band = vec3(max(k, 0.0), 1.0 - abs(k), max(-k, 0.0));
    ink += tap.rgb * band;
    cover += tap.a * band;
    weight += band;
  }
  ink /= weight;
  cover /= weight;
  float a = max(max(cover.r, cover.g), cover.b);
  vec3 color = ink + (a - cover) * uBackdrop;
  color = min(color + (lens + shockLight * 0.5) * cover.g * 0.055, vec3(a));
  fragColor = vec4(color, a) * uReveal;
}
`;


const heading=document.querySelector('.minimal .m-title'),root=document.querySelector('.minimal');
if(!heading)return;
const motion=matchMedia('(prefers-reduced-motion: reduce)'),canvas=document.createElement('canvas');
canvas.className='warp-text-canvas';canvas.setAttribute('aria-hidden','true');heading.classList.add('warp-title');heading.append(canvas);
const gl=canvas.getContext('webgl2',{alpha:true,premultipliedAlpha:true,antialias:true,preserveDrawingBuffer:true,depth:false});
if(!gl){canvas.remove();heading.classList.remove('warp-title');return;}
let program,buffer,texture,disposed=false,lost=false,raf=0,last=0,time=0,intro=0,ready=false,visible=true,lastColor='',frames=0;
const pad=24,clicks=new Float32Array(16),pointer={x:.5,y:.5,tx:.5,ty:.5,active:0,target:0};let slot=0;
try{
  const compile=(type,src)=>{const shader=gl.createShader(type);gl.shaderSource(shader,src);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error('WarpText shader compilation failed');return shader;};
  program=gl.createProgram();const vs=compile(gl.VERTEX_SHADER,vertex),fs=compile(gl.FRAGMENT_SHADER,fragment);gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('WarpText link failed');
  gl.useProgram(program);buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
  for(const name of ['position','uv']){const a=gl.getAttribLocation(program,name);if(a<0)continue;if(name==='position'){gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);}else{const uvBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,uvBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([0,0,2,0,0,2]),gl.STATIC_DRAW);gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl._warpUvBuffer=uvBuffer;}}
  texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
}catch{if(program)gl.deleteProgram(program);canvas.remove();heading.classList.remove('warp-title');return;}
const names=['uTextTexture','uResolution','uPointer','uPointerActive','uTime','uWarpStrength','uWarpScale','uSpeed','uPointerInfluence','uPointerStrength','uRefraction','uChromatic','uRipple','uMotion','uLens','uIntro','uReveal','uBackdrop','uClicks[0]'];
const uniforms=Object.fromEntries(names.map(n=>[n,gl.getUniformLocation(program,n)]));
gl.useProgram(program);gl.uniform1i(uniforms.uTextTexture,0);
const values={uWarpStrength:.08,uWarpScale:1.7,uSpeed:.55,uPointerInfluence:.42,uPointerStrength:.38,uRefraction:.018,uChromatic:0,uRipple:1,uMotion:1,uLens:0};
for(const [key,val] of Object.entries(values))gl.uniform1f(uniforms[key],val);
gl.clearColor(0,0,0,0);
function allowed(){return !disposed&&!lost&&!motion.matches&&!document.hidden&&visible&&!document.querySelector('dialog[open]');}
function rasterize(){
  if(disposed||lost)return;
  const bounds=heading.getBoundingClientRect(),width=bounds.width+pad*2,height=bounds.height+pad*2;if(width<=pad*2||height<=pad*2)return;
  const ratio=Math.min(devicePixelRatio||1,1.5),image=document.createElement('canvas');image.width=Math.ceil(width*ratio);image.height=Math.ceil(height*ratio);
  const ctx=image.getContext('2d');if(!ctx)return;ctx.setTransform(ratio,0,0,ratio,0,0);ctx.textBaseline='alphabetic';ctx.textAlign='left';
  const walker=document.createTreeWalker(heading,NodeFilter.SHOW_TEXT);let node;
  while(node=walker.nextNode()){
    if(node.parentElement.closest('canvas'))continue;const style=getComputedStyle(node.parentElement);const size=parseFloat(style.fontSize);ctx.font=`${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;ctx.fillStyle=style.color;
    const metrics=ctx.measureText('H'),ascent=metrics.fontBoundingBoxAscent??size*.9;
    for(let i=0;i<node.textContent.length;){const letter=String.fromCodePoint(node.textContent.codePointAt(i)),range=document.createRange();range.setStart(node,i);range.setEnd(node,i+letter.length);const r=range.getBoundingClientRect();ctx.fillText(letter,r.left-bounds.left+pad,r.top-bounds.top+pad+ascent);i+=letter.length;}
  }
  canvas.width=image.width;canvas.height=image.height;gl.viewport(0,0,canvas.width,canvas.height);gl.useProgram(program);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);gl.uniform2f(uniforms.uResolution,canvas.width,canvas.height);
  lastColor=getComputedStyle(heading).color;const rgb=lastColor.match(/[\d.]+/g)?.map(Number)||[0,0,0];gl.uniform1f(uniforms.uBackdrop,(rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722)/255<.5?1:0);
  ready=true;heading.dataset.warpReady='true';wake();
}
function draw(now){
  raf=0;if(!allowed())return;
  if(last&&now-last<1000/30){raf=requestAnimationFrame(draw);return;}
  const delta=last?Math.min(now-last,60):33;last=now;time+=delta/1000;frames++;
  if(ready)intro=Math.min(1,intro+delta/1600);
  const engaged=pointer.target>0,drift=matchMedia('(max-width:720px)').matches?.12:.2,follow=1-Math.exp(-delta/(engaged?130:470));
  pointer.x+=((engaged?pointer.tx:.5+Math.sin(time*.33)*(.08+drift*.2))-pointer.x)*follow;pointer.y+=((engaged?pointer.ty:.5+Math.cos(time*.27)*(.06+drift*.2))-pointer.y)*follow;pointer.active+=((engaged?1:drift)-pointer.active)*(1-Math.exp(-delta/270));
  for(let i=0;i<4;i++){if(clicks[i*4+3]>0){clicks[i*4+2]+=delta/1000;if(clicks[i*4+2]>1.6)clicks[i*4+3]=0;}}
  if(frames%6===0&&getComputedStyle(heading).color!==lastColor)rasterize();
  gl.useProgram(program);gl.uniform2f(uniforms.uPointer,pointer.x,pointer.y);gl.uniform1f(uniforms.uPointerActive,pointer.active);gl.uniform1f(uniforms.uTime,time);gl.uniform1f(uniforms.uIntro,Math.pow(1-intro,3));const reveal=Math.min(1,intro/.45);gl.uniform1f(uniforms.uReveal,ready?reveal*reveal*(3-2*reveal):0);gl.uniform4fv(uniforms['uClicks[0]'],clicks);gl.clear(gl.COLOR_BUFFER_BIT);if(ready){gl.drawArrays(gl.TRIANGLES,0,3);if(intro>=.45)heading.classList.add('warp-ready');}
  raf=requestAnimationFrame(draw);
}
function wake(){if(!raf&&allowed()){last=0;raf=requestAnimationFrame(draw);}}
function sync(){
  if(!allowed()){if(raf)cancelAnimationFrame(raf);raf=0;last=0;if(motion.matches)heading.classList.remove('warp-ready');return;}
  rasterize();wake();
}
function move(e){if(e.pointerType==='touch')return;const r=canvas.getBoundingClientRect();pointer.tx=(e.clientX-r.left)/r.width;pointer.ty=1-(e.clientY-r.top)/r.height;pointer.target=1;wake();}
function leave(){pointer.target=0;wake();}
function click(e){if(motion.matches||e.button!==0)return;const r=canvas.getBoundingClientRect(),i=(slot++%4)*4;clicks[i]=(e.clientX-r.left)/r.width;clicks[i+1]=1-(e.clientY-r.top)/r.height;clicks[i+2]=0;clicks[i+3]=1;wake();}
heading.addEventListener('pointermove',move,{passive:true});heading.addEventListener('pointerleave',leave);heading.addEventListener('pointerdown',click,{passive:true});
const resize=new ResizeObserver(rasterize);resize.observe(heading);
const intersection=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;sync();});intersection.observe(heading);
const observer=new MutationObserver(sync);observer.observe(root,{attributes:true,attributeFilter:['class']});observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});document.querySelectorAll('dialog').forEach(d=>observer.observe(d,{attributes:true,attributeFilter:['open']}));
document.addEventListener('visibilitychange',sync);motion.addEventListener('change',sync);
function destroy(){if(disposed)return;disposed=true;if(raf)cancelAnimationFrame(raf);resize.disconnect();intersection.disconnect();observer.disconnect();document.removeEventListener('visibilitychange',sync);motion.removeEventListener('change',sync);heading.removeEventListener('pointermove',move);heading.removeEventListener('pointerleave',leave);heading.removeEventListener('pointerdown',click);heading.classList.remove('warp-ready','warp-title');if(!lost){gl.deleteTexture(texture);gl.deleteProgram(program);gl.deleteBuffer(buffer);if(gl._warpUvBuffer)gl.deleteBuffer(gl._warpUvBuffer);}canvas.remove();}
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;destroy();},{once:true});window.addEventListener('pagehide',e=>{if(!e.persisted)destroy();});
if(document.fonts?.ready)document.fonts.ready.then(()=>{if(!disposed)rasterize();});rasterize();sync();

})();

