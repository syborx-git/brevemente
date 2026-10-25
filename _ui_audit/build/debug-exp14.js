const { chromium } = require('C:/proyectos_Syborx/Brevemente_Demo/brevemente/Brevemente_App/frontend/node_modules/playwright');

const BASE = 'http://localhost:3000';
const API = 'http://localhost:8080';

(async () => {
  const res = await fetch(API + '/api/v1/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'sofia.ramirez@brevemente.org', password: 'demo123' }),
  });
  const session = await res.json();

  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.addInitScript((s) => localStorage.setItem('brevemente_session', JSON.stringify(s)), { token: session.token, user: session.user });
  const page = await ctx.newPage();

  page.on('response', async (r) => {
    if (r.status() >= 400) {
      let body = '';
      try { body = (await r.text()).slice(0, 300); } catch {}
      console.log('>>> HTTP ' + r.status() + ' ' + r.request().method() + ' ' + r.url());
      console.log('    BODY: ' + body.replace(/\s+/g, ' '));
      console.log('    REQ: ' + ((r.request().postData() || '').slice(0, 700)));
    }
  });

  await page.goto(BASE + '/expediente/pac-001', { waitUntil: 'load' });
  await page.waitForTimeout(3000);

  await page.getByRole('button', { name: /Tratamiento Psicoterap/ }).click();
  await page.waitForTimeout(600);
  await page.getByRole('button', { name: /Sesiones \(/ }).click();
  await page.waitForTimeout(800);
  await page.getByRole('button', { name: /Nueva Sesión/ }).click();
  await page.waitForTimeout(1200);

  console.log('--- Modal abierto. Selects: ' + (await page.locator('select').count()) + ' | checkboxes: ' + (await page.locator('input[type="checkbox"]').count()));

  await page.locator('select').nth(0).selectOption('Nuevo patrón').catch((e) => console.log('sel0 err ' + e.message.split('\n')[0]));
  await page.locator('select').nth(1).selectOption('Empeoramiento').catch((e) => console.log('sel1 err ' + e.message.split('\n')[0]));
  await page.locator('input[type="checkbox"]').nth(0).check().catch((e) => console.log('chk err ' + e.message.split('\n')[0]));

  console.log('--- Guardando sesion (sin prescripcion) ---');
  await page.getByRole('button', { name: /Guardar Sesión/ }).click();
  await page.waitForTimeout(4000);

  console.log('Dialogs abiertos tras guardar: ' + (await page.locator('[role="dialog"]').count()));

  await browser.close();
})();
