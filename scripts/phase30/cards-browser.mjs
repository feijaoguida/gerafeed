import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const { chromium } = await import(process.env.PHASE30_PLAYWRIGHT || '/tmp/phase30-browser/node_modules/playwright/index.mjs');
const browser = await chromium.launch({headless:true});
try {
 const page=await browser.newPage();
 await page.route('https://placehold.co/**',route=>route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="240" height="200"><rect width="240" height="200" fill="#e2e8f0"/><text x="50" y="100">Foto do produto</text></svg>'}));
 const html=await readFile('/tmp/phase30-cards.html','utf8');
 for(const width of [390,1280]) for(const dark of [false,true]) {
  await page.setViewportSize({width,height:900});await page.setContent(html);
  if(dark)await page.evaluate(()=>{document.body.style.background='#0f172a';document.body.style.color='#fff';});
  assert.equal(await page.locator('.gerafeed-product-group').count(),5);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  for(const img of await page.locator('img').all()) { await img.scrollIntoViewIfNeeded(); await img.evaluate(i=>i.loading='eager'); }
  await page.waitForFunction(()=>[...document.images].every(i=>i.complete && i.naturalWidth>0));
  assert.equal(await page.locator('img').evaluateAll(imgs=>imgs.every(i=>i.complete && i.naturalWidth>0)),true);
  const carousel=page.getByRole('region');await carousel.focus();
  assert.equal(await carousel.evaluate(e=>document.activeElement===e),true);
  await page.keyboard.press('ArrowRight');
  await page.screenshot({path:`/tmp/phase30-cards-${width}-${dark?'dark':'light'}.png`,fullPage:true});
 }
 console.log('PASS: five models, 390/1280px, light/dark surrounds, images, no horizontal page overflow, keyboard carousel.');
}finally{await browser.close();}
