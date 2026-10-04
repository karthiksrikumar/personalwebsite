import { chromium } from '@playwright/test';
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({viewport:{width:1507,height:616}});
await page.goto('http://127.0.0.1:5173/');
await page.locator('.portrait-stage[data-loaded="true"]').waitFor();
const states = {};
for(let i=0;i<42;i++) {
 const values=await page.locator('.orbit-link').evaluateAll(els=>els.map(el=>({route:el.dataset.route,hidden:el.dataset.occluded==='true',visibility:getComputedStyle(el).visibility,tab:el.tabIndex,x:el.style.left})));
 for(const v of values){states[v.route]??={hidden:false,visible:false,positions:new Set()};states[v.route][v.hidden?'hidden':'visible']=true;states[v.route].positions.add(v.x);if(v.hidden&&(v.visibility!=='hidden'||v.tab!==-1))throw Error('Occluded link remains visible or focusable');}
 await page.waitForTimeout(1000);
}
for(const [route,s] of Object.entries(states)){if(!s.hidden||!s.visible||s.positions.size<5)throw Error(route+' did not orbit, disappear, and return');console.log(route+': moved, hidden behind head, returned');}
await browser.close();
