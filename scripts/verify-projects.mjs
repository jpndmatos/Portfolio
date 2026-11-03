// Run after building/exporting demos and starting the portfolio static server.
// Browser test dependencies come from the independent Relay project's web folder.
import { chromium, expect } from '../../relay/web/node_modules/@playwright/test/index.mjs';
import AxeBuilder from '../../relay/web/node_modules/@axe-core/playwright/dist/index.mjs';
import assert from 'node:assert/strict';
const base = process.env.PORTFOLIO_URL ?? 'http://127.0.0.1:5181';
const browser = await chromium.launch();
async function check(page, label) {
 const result = await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa','best-practice']).analyze();
 assert.deepEqual(result.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})),[],label);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth),true,`${label}: horizontal overflow`);
}
async function download(page, action) {
 const pending = page.waitForEvent('download'); await action(); const file = await pending;
 assert.equal(await file.failure(),null);
 const stream=await file.createReadStream(); const chunks=[]; for await(const part of stream) chunks.push(part);
 return {name:file.suggestedFilename(),bytes:Buffer.concat(chunks)};
}
try {
 for (const width of [1440,390]) {
  const context=await browser.newContext({viewport:{width,height:1000}, reducedMotion:'reduce'});
  const page=await context.newPage(); const failures=[];
  page.on('pageerror',e=>failures.push(e.message));
  const apiRequests=[]; page.on('request',r=>{if(new URL(r.url()).pathname.startsWith('/api/')) apiRequests.push(r.url());});
  await page.goto(`${base}/demo/split/`);
  await expect(page.getByRole('heading',{name:'Birthday dinner'})).toBeVisible();
  await check(page,`Split ${width}`);
  await page.getByRole('button',{name:'Add expense',exact:true}).click();
  const form=page.getByRole('dialog',{name:'Add expense'});
  await form.getByLabel('Description').fill('Browser check coffee');
  await form.getByLabel('Amount').fill('1.01');
  await check(page,`Split expense form ${width}`);
  await form.getByRole('button',{name:'Add expense',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Browser check coffee'})).toBeVisible();
  await page.reload(); await expect(page.getByRole('heading',{name:'Browser check coffee'})).toBeVisible();
  await page.getByRole('tab',{name:'Balances'}).click();
  await expect(page.locator('.balance-row')).toHaveCount(4);
  await page.getByRole('tab',{name:/Expenses/}).click();
  await page.getByRole('button',{name:'Mark paid'}).first().click();
  await page.getByText('Recorded payments (1)',{exact:true}).click();
  await page.getByRole('button',{name:/Undo payment/}).click();
  await expect(page.getByText('Recorded payments (1)',{exact:true})).toHaveCount(0);
  const csv=await download(page,()=>page.getByRole('button',{name:'Export CSV'}).click());
  assert.match(csv.bytes.toString(),/Browser check coffee/);
  await page.getByRole('button',{name:'New event'}).click();
  const event=page.getByRole('dialog',{name:'New event'});
  await event.getByLabel('Event name').fill('Weekend lunch');
  await event.getByLabel('Members').fill('Ana, Bruno, Carla');
  await event.getByRole('button',{name:'Create event'}).click();
  await expect(page.getByRole('heading',{name:'Weekend lunch'})).toBeVisible();
  assert.equal(apiRequests.length,0,'Split demo must work without a backend');

  await page.goto(`${base}/demo/image-desk/`);
  await check(page,`Image Desk empty ${width}`);
  await page.getByRole('button',{name:'Load sample'}).click();
  await expect(page.locator('.studio-stage img')).toBeVisible();
  await page.getByRole('button',{name:'Transform',exact:true}).click();
  await page.getByLabel('Image rotation').selectOption('90');
  await page.getByLabel('Flip horizontally').check();
  await page.getByRole('button',{name:'Process images'}).click();
  await expect(page.getByRole('button',{name:'Download sample-landscape.png',exact:true})).toBeVisible();
  await expect(page.locator('.stage-caption')).toContainText('Processed');
  await check(page,`Image Desk processed ${width}`);
  const image=await download(page,()=>page.getByRole('button',{name:'Download sample-landscape.png',exact:true}).click());
  assert.match(image.name,/\.webp$/); assert.equal(image.bytes.subarray(8,12).toString(),'WEBP');
  const zip=await download(page,()=>page.getByRole('button',{name:/Download ZIP/}).click());
  assert.equal(zip.bytes.subarray(0,2).toString(),'PK');
  await page.getByRole('button',{name:/Open full preview/}).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await check(page,`Image Desk preview ${width}`);
  await page.getByRole('button',{name:'Close preview'}).click();

  await page.goto(`${base}/demo/overlap/`);
  await check(page,`Overlap ${width}`);
  await page.getByRole('button',{name:/Add a city/}).click();
  await page.getByLabel('Search cities and timezones').fill('Tokyo');
  await check(page,`Overlap city picker ${width}`);
  await page.locator('.city-results button').first().click();
  await expect(page.locator('.city-row')).toHaveCount(4);
  await page.getByLabel('Planning date').fill('2026-03-29');
  await page.getByLabel('Meeting duration').selectOption('30');
  await page.getByRole('button',{name:/Saved times/}).click();
  await page.getByLabel('Meeting name').fill('Team sync');
  await page.getByRole('button',{name:'Save current time'}).click();
  await expect(page.locator('.saved-open')).toContainText('Team sync');
  await page.reload();
  await page.getByRole('button',{name:/Saved times/}).click();
  await expect(page.locator('.saved-open')).toContainText('Team sync');
  const calendar=await download(page,()=>page.getByRole('button',{name:'Calendar file'}).click());
  assert.match(calendar.bytes.toString(),/BEGIN:VEVENT/); assert.match(calendar.bytes.toString(),/DTSTART:\d{8}T\d{6}Z/);
  await check(page,`Overlap saved meeting ${width}`);
  assert.deepEqual(failures,[]);
  console.log(`PASS ${width}px: Split create/persist/settle/undo/CSV, Image Desk transform/encode/ZIP/preview, Overlap cities/save/calendar; accessibility and overflow.`);
  await context.close();
 }
 const context=await browser.newContext();
 const page=await context.newPage();
 await page.goto(`${base}/demo/image-desk/`);
 await page.getByRole('button',{name:'Load sample'}).click();
 await page.getByRole('button',{name:'Process images'}).click();
 await expect(page.getByRole('button',{name:/Download ZIP/})).toBeVisible();
 await page.route('**/assets/browser-*.js',route=>route.abort());
 await page.getByRole('button',{name:/Download ZIP/}).click();
 await expect(page.getByRole('alert')).toContainText('Could not create the ZIP');
 const individual=await download(page,()=>page.getByRole('button',{name:'Download sample-landscape.png',exact:true}).click());
 assert.equal(individual.bytes.subarray(8,12).toString(),'WEBP');
 console.log('PASS archive network failure: error is visible and individual image download still works.');
 await context.close();
} finally { await browser.close(); }
