import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
let sharp;
try{sharp=require('sharp');}catch{sharp=require(path.join(path.dirname(path.dirname(process.execPath)),'node_modules/sharp'));}
const projects='dist/assets/projects',sliceHeight=2200,widths=[768,1440],report=[];
for(const entry of await fs.readdir(projects,{withFileTypes:true})){
  if(!entry.isDirectory())continue;
  const folder=path.join(projects,entry.name),source=path.join(folder,'portfolio.jpg');
  const metadata=await sharp(source).metadata(),slices=[];
  await sharp(source).resize({width:1440,withoutEnlargement:true}).webp({quality:86,effort:4}).toFile(path.join(folder,'preview.webp'));
  for(let top=0,index=1;top<metadata.height;top+=sliceHeight,index++){
    const height=Math.min(sliceHeight,metadata.height-top),name='slice-'+String(index).padStart(2,'0');
    for(const width of widths)await sharp(source).extract({left:0,top,width:metadata.width,height}).resize({width,withoutEnlargement:true}).webp({quality:84,effort:4}).toFile(path.join(folder,`${name}-${width}.webp`));
    slices.push({name,width:metadata.width,height});
  }
  const manifest={width:metadata.width,height:metadata.height,slices};
  await fs.writeFile(path.join(folder,'slices.json'),JSON.stringify(manifest,null,2)+'\n');
  report.push({project:entry.name,original:(await fs.stat(source)).size,firstMobile:(await fs.stat(path.join(folder,'slice-01-768.webp'))).size,firstDesktop:(await fs.stat(path.join(folder,'slice-01-1440.webp'))).size,slices:slices.length});
}
console.log(JSON.stringify(report,null,2));
