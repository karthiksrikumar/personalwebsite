import { chromium } from '@playwright/test';
import { createServer } from 'vite';
import { readFile, writeFile } from 'node:fs/promises';
const server=await createServer({configFile:false,server:{host:'127.0.0.1',port:5195},logLevel:'error'});
await server.listen();
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||chromium.executablePath()});
try{
 const page=await browser.newPage();
 await page.goto('http://127.0.0.1:5195/film/output/model-inventory.json');
 const playback=await page.evaluate(async()=>{
  const video=document.createElement('video');video.muted=true;video.preload='auto';
  document.body.replaceChildren(video);
  video.src='/film/output/political-sculptures-60s.mp4';
  await new Promise((resolve,reject)=>{video.onloadedmetadata=resolve;video.onerror=()=>reject(new Error('Video metadata failed'));});
  const metadata={duration:video.duration,width:video.videoWidth,height:video.videoHeight};
  video.playbackRate=4;
  const ended=new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>reject(new Error('Playback timed out')),60000);
   video.onended=()=>{clearTimeout(timer);resolve();};
   video.onerror=()=>{clearTimeout(timer);reject(new Error(`Playback error: ${video.error?.message}`));};
  });
  await video.play();await ended;
  return {...metadata,ended:video.ended,finalTime:video.currentTime,error:video.error?.message||null};
 });
 if(playback.duration!==60||playback.width!==1920||playback.height!==1080||!playback.ended||playback.error)throw new Error(JSON.stringify(playback));
 const file='film/output/verification.json', report=JSON.parse(await readFile(file,'utf8'));
 report.browserPlayback=playback;
 await writeFile(file,JSON.stringify(report,null,2)+'\n');
 console.log(playback);
}finally{await browser.close();await server.close();}
