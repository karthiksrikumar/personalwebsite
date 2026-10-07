import { chromium } from '@playwright/test';
import { createServer } from 'vite';
import { writeFile } from 'node:fs/promises';
const server=await createServer({configFile:false,server:{host:'127.0.0.1',port:5196},logLevel:'error'});
await server.listen();
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||chromium.executablePath(),args:['--enable-webgl','--ignore-gpu-blocklist']});
try{
 const page=await browser.newPage({viewport:{width:640,height:360}});
 const errors=[];page.on('pageerror',error=>errors.push(String(error)));
 page.on('response',response=>{if(response.status()>=400)errors.push(`${response.status()} ${response.url()}`);});
 await page.goto('http://127.0.0.1:5196/film/index.html?width=640&height=360');
 await page.waitForFunction(()=>window.filmReady,{},{timeout:180000});
 const result=await page.evaluate(()=>{
  const problems=[],croppedGeometry=[],collectionOverlaps=[];
  for(let frame=0;frame<2880;frame+=12){
   window.renderFrame(frame/24);
   const hits=window.checkCameraClearance();
   const composition=window.checkComposition();
   if(composition.cropped.length)croppedGeometry.push({time:frame/24,items:composition.cropped});
   if(composition.overlaps.length)collectionOverlaps.push({time:frame/24,items:composition.overlaps});
   if(hits.length)problems.push({time:frame/24,hits});
  }
  return {sampledTimes:240,intervalSeconds:.5,nearPlaneRaySamples:5,nearPlaneIntersections:problems,croppedGeometry,collectionOverlaps};
 });
 if(errors.length||result.nearPlaneIntersections.length||result.croppedGeometry.length||result.collectionOverlaps.length)throw new Error(JSON.stringify({errors,...result}));
 await writeFile('film/output/scene-verification.json',JSON.stringify({...result,loadingErrors:errors},null,2)+'\n');
 console.log(result);
}finally{await browser.close();await server.close();}
