import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
const root=path.resolve(process.argv[2]||'dist'),missing=[],syntax=[];let count=0;
async function walk(dir){for(const e of await fs.readdir(dir,{withFileTypes:true})){const file=path.join(dir,e.name);if(e.isDirectory()){await walk(file);continue;}if(!/\.(html|css|js)$/.test(e.name))continue;const s=await fs.readFile(file,'utf8');count++;
 if(e.name.endsWith('.js')){try{new vm.Script(s);}catch(e){syntax.push({file,error:e.message});}}
 if(e.name.endsWith('.html')){for(const m of s.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)){if(/src=|application\/json|importmap/.test(m[1])||!m[2].trim())continue;try{new vm.Script(m[2]);}catch(e){syntax.push({file,error:e.message});}}}
 const markup=e.name.endsWith('.js')?'':e.name.endsWith('.html')?s.replace(/(<script\b[^>]*>)[\s\S]*?<\/script>/g,'$1</script>'):s;
 for(const m of markup.matchAll(/(?:src|href|poster|data-page)\s*=\s*(["'])(.*?)\1/g)){let ref=m[2];if(!ref||/^(#|data:|https?:|mailto:|tel:|javascript:)/.test(ref)||ref.includes('${'))continue;ref=ref.split(/[?#]/)[0];if(!ref)continue;const target=ref.startsWith('/')?path.join(root,ref):path.resolve(path.dirname(file),ref);try{await fs.access(target);}catch{missing.push({file:path.relative(root,file),ref});}}
}}
await walk(root);console.log(JSON.stringify({filesChecked:count,missing,syntax},null,2));if(missing.length||syntax.length)process.exitCode=1;
