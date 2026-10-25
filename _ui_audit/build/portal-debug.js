const { chromium } = require('C:/proyectos_Syborx/Brevemente_Demo/brevemente/Brevemente_App/frontend/node_modules/playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const bad = [];
  page.on('response', (r) => {
    if (r.status() >= 400) bad.push(`HTTP ${r.status()} ${r.request().method()} ${r.url()}`);
  });
  page.on('console', (m) => { if (m.type() === 'error') bad.push('CONSOLE: ' + m.text().slice(0, 200)); });

  await page.goto('http://localhost:4200/login', { waitUntil: 'networkidle' });
  await page.locator('#email').fill('contacto.mateo@familia.mx');
  await page.locator('#password').fill('demo123');
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(6000);

  console.log('URL final:', page.url());
  console.log('HASH:', await page.evaluate(() => location.hash));
  console.log('SESSION:', await page.evaluate(() => localStorage.getItem('brevemente_session')?.slice(0, 200)));
  console.log('TEXTO:', (await page.evaluate(() => document.body.innerText)).replace(/\n{2,}/g, '\n').slice(0, 500));
  console.log('--- errores ---');
  console.log([...new Set(bad)].join('\n'));
  await page.screenshot({ path: 'c:/proyectos_Syborx/Brevemente_Demo/brevemente/_ui_audit/build/portal-debug.png', fullPage: false });
  await browser.close();
})();

