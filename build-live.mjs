import fs from 'node:fs/promises';import path from 'node:path';
// Keep the complete historical source in dist; publish the current catalog and its dependencies.
const main=await fs.readFile('dist/index.html','utf8'),pattern=/(<script id="portfolio-data" type="application\/json">)([\s\S]*?)(<\/script>)/,data=JSON.parse(main.match(pattern)[2]);
await fs.mkdir('out',{recursive:true});
// Remove retired versions from an existing build output as well as fresh builds.
for(const file of ['gallery-v2.html','kinetic-v4.html','assets/gallery.css','assets/gallery.js','assets/kinetic.css','assets/kinetic.js'])await fs.rm(path.join('out',file),{force:true});
for(const entry of await fs.readdir('dist',{withFileTypes:true})){
 if(entry.isFile())await fs.copyFile('dist/'+entry.name,'out/'+entry.name);
}
await fs.mkdir('out/assets',{recursive:true});
for(const entry of await fs.readdir('dist/assets',{withFileTypes:true})){
 if(['design','figma','local'].includes(entry.name))continue;
 await fs.cp('dist/assets/'+entry.name,'out/assets/'+entry.name,{recursive:true});
}
for(const p of data.projects)await fs.cp(`dist/work/${p.id}`,`out/work/${p.id}`,{recursive:true});
for(const file of ['index.html','showcase-v3.html','title-warp-original.html','classic.html']){
 let html=await fs.readFile('out/'+file,'utf8');html=html.replace(pattern,(_,a,b,c)=>a+JSON.stringify(data)+c).replaceAll("['air','ai-model','kv-domestic','charger','packaging-a']","['maestri-s2','zhiyue-projector','ai-application','cinema4d-octane','kv-domestic']");
 for(const [old,current] of Object.entries({air:'maestri-s2','ai-model':'ai-application',charger:'cinema4d-octane','packaging-a':'domestic-campaigns'}))html=html.replaceAll(`work/${old}/index.html`,`work/${current}/index.html`);
 await fs.writeFile('out/'+file,html);
}
let bytes=0;async function size(dir){for(const e of await fs.readdir(dir,{withFileTypes:true})){const f=path.join(dir,e.name);if(e.isDirectory())await size(f);else bytes+=(await fs.stat(f)).size;}}await size('out');console.log('Current site output:',(bytes/1048576).toFixed(1),'MiB');
