const { chromium } = require('C:/proyectos_Syborx/Brevemente_Demo/brevemente/Brevemente_App/frontend/node_modules/playwright');

const BASE = 'http://localhost:3000';
const API = 'http://localhost:8080';
const USERS = [
  ['therapist', 'sofia.ramirez@brevemente.org', '/dashboard'],
  ['assistant', 'asistente.agenda@brevemente.org', '/dashboard'],
  ['supervisor', 'isabel.cardenas@brevemente.org', '/dashboard'],
  ['therapist', 'sofia.ramirez@brevemente.org', '/expedientes'],
];

(async () => {
  const browser = await chromium.launch();
  for (const [role, email, route] of USERS) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    let session = null;
    try {
      const res = await fetch(API + '/api/v1/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'demo123' }),
      });
      session = await res.json();
      if (!res.ok) throw new Error('HTTP ' + res.status);
    } catch (e) {
      console.log(`\n### ${role} ${email} ${route} â†’ LOGIN FALLÃ“: ${e.message}`);
      await ctx.close();
      continue;
    }
    await ctx.addInitScript((s) => localStorage.setItem('brevemente_session', JSON.stringify(s)), { token: session.token, user: session.user });
    const page = await ctx.newPage();
    await page.goto(BASE + route, { waitUntil: 'load' });
    await page.waitForTimeout(4000);
    const text = (await page.evaluate(() => document.body.innerText)).replace(/\n{2,}/g, '\n').trim();
    console.log(`\n===== ${role} | ${session.user.name} | ${route} =====`);
    console.log(text);
    const labels = ['Panel Principal', 'Centro de Control BreveMente', 'Alertas Normativas', 'Alertas de Riesgo', 'Consentimiento informado pendiente', 'Pacientes con Actividad Reciente', 'Pendientes ClÃ­nicos', 'Fobia'];
    const found = {};
    for (const l of labels) found[l] = await page.getByText(l, { exact: false }).count();
    console.log('CONTEO:', JSON.stringify(found));
    await ctx.close();
  }
  await browser.close();
})();


