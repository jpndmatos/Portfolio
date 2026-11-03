// Optional local Lighthouse audit; install Lighthouse in a tooling directory and
// set LIGHTHOUSE_MODULE to its absolute core/index.js path, or install it locally.
import { chromium } from '../../relay/web/node_modules/@playwright/test/index.mjs';
import { pathToFileURL } from 'node:url';
import { writeFile } from 'node:fs/promises';
const {default:lighthouse}=await import(process.env.LIGHTHOUSE_MODULE ? pathToFileURL(process.env.LIGHTHOUSE_MODULE).href : 'lighthouse');
const base=process.env.PORTFOLIO_URL ?? 'http://127.0.0.1:5181';
const browser=await chromium.launch({args:['--remote-debugging-port=9228']});
try {
 for(const app of (process.env.AUDIT_PROJECTS?.split(',') ?? ['split','image-desk','overlap'])) {
  const {lhr}=await lighthouse(`${base}/demo/${app}/`,{port:9228,logLevel:'error',onlyCategories:['performance','accessibility','best-practices'],throttlingMethod:'simulate'});
  const result={date:new Date().toISOString(),app,url:lhr.finalDisplayedUrl,lighthouseVersion:lhr.lighthouseVersion,formFactor:lhr.configSettings.formFactor,scores:Object.fromEntries(Object.entries(lhr.categories).map(([key,value])=>[key,Math.round(value.score*100)])),metrics:Object.fromEntries(['first-contentful-paint','largest-contentful-paint','total-blocking-time','cumulative-layout-shift','total-byte-weight'].map(key=>[key,{value:lhr.audits[key].numericValue,display:lhr.audits[key].displayValue}]))};
  await writeFile(new URL(`../../${app}/docs/performance.json`,import.meta.url),JSON.stringify(result,null,2)+'\n');
  console.log(app,JSON.stringify(result.scores),result.metrics['largest-contentful-paint'].display);
  for (const category of ['accessibility','best-practices']) {
   for (const ref of lhr.categories[category].auditRefs.filter(ref=>ref.weight>0)) {
    const audit=lhr.audits[ref.id]; if(audit.score !== null && audit.score < 1) console.log(JSON.stringify({app,id:audit.id,title:audit.title,details:audit.details?.items?.slice(0,3)}));
   }
  }
 }
} finally {await browser.close();}
