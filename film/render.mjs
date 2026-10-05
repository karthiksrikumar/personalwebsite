import { chromium } from '@playwright/test';
import { createServer } from 'vite';
import { mkdir, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
const preview=process.argv.includes('--preview');
const rangeArg=process.argv.find(arg=>arg.startsWith('--only='));
const ranges=rangeArg?.slice(7).split(',').map(range=>range.split(':').map(Number));
if(ranges?.some(([a,b])=>!Number.isFinite(a)||!Number.isFinite(b)||a<0||b>60||b<=a))throw new Error('Use --only=start:end[,start:end] with seconds between 0 and 60');
const width=preview?1280:1920,height=preview?720:1080;
const directory=path.resolve(preview?'.cache/film-preview':'.cache/film-frames');
await mkdir(directory,{recursive:true});await mkdir('film/output',{recursive:true});
const server=await createServer({configFile:false,server:{host:'127.0.0.1',port:5194,hmr:false},logLevel:'error'});
await server.listen();
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||chromium.executablePath(),args:['--enable-webgl','--ignore-gpu-blocklist']});
try{
 const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
 page.on('pageerror',error=>console.error(error));
 await page.goto(`http://127.0.0.1:5194/film/index.html?width=${width}&height=${height}`);
 await page.waitForFunction(()=>window.filmReady,{},{timeout:180000});
 const inventory=await page.evaluate(()=>window.inventory);
 await writeFile('film/output/model-inventory.json',JSON.stringify(inventory,null,2));
 await writeFile('film/output/assembly-parts.json',JSON.stringify(await page.evaluate(()=>window.assemblyParts),null,2));
 await writeFile('film/output/assembly-events.json',JSON.stringify(await page.evaluate(()=>window.assemblyEvents),null,2));
 console.log(JSON.stringify(inventory.map(({id,triangles,height,parts})=>({id,triangles,height,parts}))));
 const times=preview?[3,7.8,10,14,18,22,27,31,36.5,38,41,47,56]:Array.from({length:1440},(_,i)=>i/24);
 const started=Date.now();
 for(let i=0;i<times.length;i++){
  if(ranges&&!ranges.some(([a,b])=>times[i]>=a&&times[i]<b))continue;
  const file=path.join(directory,`${String(i).padStart(5,'0')}.jpg`);
  if(!preview&&!ranges){try{await access(file);continue;}catch{}}
  const data=await page.evaluate(({t,preview})=>{
   const canvas=document.querySelector('canvas');
   if(preview){window.renderFrame(t);return canvas.toDataURL('image/jpeg',.96).split(',')[1];}
   // Two shutter samples (180 degree shutter), accumulated in linear display time.
   const accumulator=window.accumulator||(window.accumulator=document.createElement('canvas'));
   accumulator.width=canvas.width;accumulator.height=canvas.height;
   const ctx=accumulator.getContext('2d');
   const cuts=[0,8,12,16,20,25,33.5,38,44,50,60];
   const index=cuts.findIndex((cut,i)=>t>=cut && t<cuts[i+1]);
   window.renderFrame(Math.max(cuts[index],t-1/192));ctx.globalAlpha=1;ctx.drawImage(canvas,0,0);
   window.renderFrame(Math.min(cuts[index+1]-.000001,t+1/192));ctx.globalAlpha=.5;ctx.drawImage(canvas,0,0);
   return accumulator.toDataURL('image/jpeg',.96).split(',')[1];
  },{t:times[i],preview});
  await writeFile(file,Buffer.from(data,'base64'));
  if(preview||i%24===0)console.log(`frame ${i+1}/${times.length} time=${times[i].toFixed(2)} elapsed=${((Date.now()-started)/1000).toFixed(1)}s`);
 }
}finally{await browser.close();await server.close();}
