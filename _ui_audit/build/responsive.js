const { chromium } = require('C:/proyectos_Syborx/Brevemente_Demo/brevemente/Brevemente_App/frontend/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.argv[2] || 'http://localhost:5199';
const OUT = path.join(__dirname, 'responsive');
const ROUTES = ['/', '/mi-consulta', '/pacientes', '/agenda', '/expedientes', '/biblioteca', '/leva', '/campus', '/desempeno', '/configuracion'];
const WIDTHS = [
  { name: 'mobile', w: 390, h: 844 },
  { name: 'tablet', w: 768, h: 1024 },
  { name: 'laptop', w: 1366, h: 768 },
  { name: 'desktop', w: 1440, h: 900 },
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const rows = [];

  for (const vp of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.goto(BASE + '/#/', { waitUntil: 'load', timeout: 45000 });
    await page.waitForTimeout(2500);

    for (const route of ROUTES) {
      await page.goto(BASE + '/#' + route, { waitUntil: 'load' });
      await page.waitForTimeout(1400);
      const m = await page.evaluate(() => {
        const de = document.documentElement;
        const aside = document.querySelector('aside');
        const main = document.querySelector('main') || document.querySelector('main, [class*="flex-1"]');
        const overflowing = Array.from(document.querySelectorAll('body *'))
          .filter((el) => {
            const r = el.getBoundingClientRect();
            const st = getComputedStyle(el);
            if (st.display === 'none' || st.visibility === 'hidden' || r.width === 0) return false;
            return r.right > window.innerWidth + 2 || r.left < -2;
          })
          .slice(0, 25)
          .map((el) => (el.tagName + '.' + (el.className || '').toString().split(' ').slice(0, 3).join('.')).slice(0, 90));
        return {
          innerWidth: window.innerWidth,
          scrollWidth: de.scrollWidth,
          overflowX: de.scrollWidth - window.innerWidth,
          asideWidth: aside ? Math.round(aside.getBoundingClientRect().width) : 0,
          mainWidth: main ? Math.round(main.getBoundingClientRect().width) : 0,
          bodyOverflowX: getComputedStyle(document.body).overflowX,
          overflowingCount: overflowing.length,
          sample: overflowing.slice(0, 5),
        };
      });
      rows.push({ vp: vp.name, w: vp.w, route, ...m });
      const slug = route === '/' ? 'home' : route.replace(/^\//, '').replace(/\//g, '_');
      if (route === '/' || route === '/pacientes' || route === '/agenda') {
        await page.screenshot({ path: path.join(OUT, `${vp.name}_${slug}.png`), fullPage: false });
      }
    }
    await ctx.close();
  }

  await browser.close();
  fs.writeFileSync(path.join(OUT, '_metrics.json'), JSON.stringify(rows, null, 1));
  console.log('vp      w     ruta                  aside  main  overflowX  elemsFuera');
  rows.forEach((r) =>
    console.log(
      `${r.vp.padEnd(7)} ${String(r.w).padEnd(5)} ${r.route.padEnd(21)} ${String(r.asideWidth).padEnd(6)} ${String(r.mainWidth).padEnd(5)} ${String(r.overflowX).padEnd(10)} ${r.overflowingCount}`
    )
  );
})();
