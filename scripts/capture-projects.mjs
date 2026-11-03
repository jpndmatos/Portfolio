import { chromium, expect } from '../../relay/web/node_modules/@playwright/test/index.mjs';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const base=process.env.PORTFOLIO_URL ?? 'http://127.0.0.1:5181';
const root=fileURLToPath(new URL('../',import.meta.url));
const browser=await chromium.launch();
try {
 for (const app of (process.env.CAPTURE_PROJECTS?.split(',') ?? ['relay','split','image-desk','overlap'])) {
  const docs=fileURLToPath(new URL(`../../${app}/docs/`,import.meta.url));
  await mkdir(docs,{recursive:true}); await mkdir(`${root}/tmp/covers`,{recursive:true});
  const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  const page=await context.newPage();
  await page.goto(app==='relay' ? (process.env.RELAY_CAPTURE_URL ?? 'http://localhost:5180') : `${base}/demo/${app}/`);
  await page.getByRole('heading',{level:1}).waitFor();
  if(app==='relay') {await page.getByRole('button',{name:'Explore as commander'}).click(); await page.getByRole('table').first().waitFor();}
  if(app==='split') await page.getByRole('heading',{name:'Birthday dinner'}).waitFor();
  if(app==='image-desk') {await page.getByRole('button',{name:'Load sample'}).click(); await page.locator('.studio-stage img').waitFor(); await expect(page.locator('.toast')).not.toBeVisible();}
  await page.evaluate(()=>document.fonts.ready);
  await page.screenshot({path:`${docs}/workspace.png`,fullPage:true});
  const region=await page.locator({relay:'.workspace-grid',split:'.summary','image-desk':'.workspace',overlap:'.timeline-table'}[app]).boundingBox();
  const height=region.width*360/960;
  await page.screenshot({path:`${root}/tmp/covers/${app}.png`,clip:{x:region.x,y:region.y,width:region.width,height}});
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:`${docs}/mobile.png`,fullPage:true});
  await context.close();
 }
} finally {await browser.close();}
