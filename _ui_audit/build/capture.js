/**
 * Captura de figuras del Manual de Usuario.
 *
 * Requisitos:
 *   1. Playwright instalado en Brevemente_App/frontend (node_modules/playwright)
 *   2. El sistema corriendo en http://localhost:5199  (npm run dev -- --port 5199)
 *
 * Uso:  node capture.js [prefijo-de-id]
 * Salida: Brevemente_App/docs/manual/figuras/NN_slug.png
 */
const { chromium } = require('C:/proyectos_Syborx/Brevemente_Demo/brevemente/Brevemente_App/frontend/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:5199';
const OUT = path.join(__dirname, '..', '..', 'Brevemente_App', 'docs', 'manual', 'figuras');
const ONLY = (process.argv[2] || '').trim();

const ROLE_LABEL = {
  admin_platform: 'Administrador Plataforma',
  admin_clinical: 'Administrador Clinico',
  therapist: 'Terapeuta (Especialista)',
  assistant: 'Asistente / Secretaria',
  supervisor: 'Supervisor Clinico',
  patient: 'Paciente (Vistas de Ingreso)',
  student: 'Alumno (En Formacion)',
};

// Términos que no deben aparecer en ninguna captura del manual
const BANNED_SRC = 'demo|demostrac|simul\\w*|prototip|mock';

async function sanitize(page) {
  await page.evaluate((bannedSrc) => {
    const banned = new RegExp(bannedSrc, 'i');
    const killExact = ['iniciar demo', 'demo guiado', 'simular whatsapp'];
    document.querySelectorAll('button, a').forEach((el) => {
      const t = (el.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
      if (killExact.includes(t)) el.remove();
    });
    document.querySelectorAll('p, li, div').forEach((el) => {
      const t = el.textContent || '';
      if (/prácticas clínicas en el|ha sido actualizado con el caso/i.test(t) && el.querySelectorAll('p,div,li').length <= 1) el.remove();
    });
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const targets = [];
    let n;
    while ((n = walker.nextNode())) if (banned.test(n.nodeValue || '')) targets.push(n);
    targets.forEach((node) => {
      const t = node.nodeValue.trim();
      if (t.length <= 45) { node.nodeValue = ''; return; }
      let v = node.nodeValue.replace(/\(\s*(demo|simul\w*|demostrac\w*)[^)]*\)/gi, '');
      v = v.replace(/simulaciones con IA y /gi, '');
      v = v.replace(/paciente simulado o real/gi, 'paciente');
      v = v.replace(/demo|demostrac\w*|simul\w*|prototip\w*|mock/gi, '');
      v = v.replace(/\s{2,}/g, ' ').replace(/\s+([,.;:])/g, '$1').replace(/,\s*,/g, ',');
      node.nodeValue = v;
    });
    document.querySelectorAll('span, button, li').forEach((el) => {
      if (!el.textContent.trim() && !el.querySelector('svg,img') && !el.querySelector('input')) el.remove();
    });
    document.querySelectorAll('[title],[aria-label],[alt],[placeholder]').forEach((el) => {
      ['title', 'aria-label', 'alt', 'placeholder'].forEach((attr) => {
        const v = el.getAttribute(attr);
        if (v && banned.test(v)) el.setAttribute(attr, '');
      });
    });
  }, BANNED_SRC);
  return page.evaluate(() => {
    const t = document.body.innerText || '';
    const m = t.match(/demo|demostrac|simul\w*|prototip|mock/gi);
    return m ? [...new Set(m)] : [];
  });
}

const goto = async (page, route) => {
  await page.goto(BASE + '/#' + route, { waitUntil: 'load' });
  await page.waitForTimeout(1700);
};

const click = (loc) => loc.first().click({ force: true, timeout: 9000 });

async function setRole(page, role) {
  await page.locator('[data-tour="demo-roles"] > button').first().click({ timeout: 8000, force: true });
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: ROLE_LABEL[role], exact: false }).first().click({ timeout: 8000, force: true });
  await page.waitForTimeout(1300);
}

const SHOTS = [
  { id: '01', slug: 'barra-superior-perfil', route: '/', actions: async (p) => { await p.locator('[data-tour="demo-roles"] > button').first().click({ force: true }); await p.waitForTimeout(600); } },
  { id: '02', slug: 'menu-terapeuta', route: '/', clip: 'aside' },
  { id: '03', slug: 'menu-admin-plataforma', route: '/', role: 'admin_platform', clip: 'aside' },
  { id: '04', slug: 'menu-asistente', route: '/', role: 'assistant', clip: 'aside' },
  { id: '05', slug: 'panel-principal', route: '/' },
  { id: '06', slug: 'mi-consulta', route: '/mi-consulta', role: 'therapist' },
  { id: '07', slug: 'mi-consulta-supervision', route: '/mi-consulta', role: 'supervisor' },
  { id: '08', slug: 'mi-consulta-operacion', route: '/mi-consulta', role: 'admin_clinical' },
  { id: '09', slug: 'directorio-pacientes', route: '/pacientes', role: 'therapist' },
  { id: '10', slug: 'pacientes-busqueda', route: '/pacientes', role: 'therapist', actions: async (p) => { await p.locator('input[placeholder*="Buscar"]').first().fill('Sofía'); await p.waitForTimeout(700); } },
  { id: '11', slug: 'pacientes-alta', route: '/pacientes', role: 'therapist', actions: async (p) => { await click(p.getByRole('button', { name: /Crear Paciente/i })); await p.waitForTimeout(1000); } },
  { id: '12', slug: 'pacientes-historia-clinica', route: '/intake', role: 'therapist' },
  { id: '13', slug: 'agenda-dia', route: '/agenda', role: 'therapist' },
  { id: '14', slug: 'agenda-nueva-cita', route: '/agenda', role: 'therapist', actions: async (p) => { await click(p.getByRole('button', { name: /Nueva Cita/i })); await p.waitForTimeout(1000); } },
  { id: '15', slug: 'agenda-detalle-cita', route: '/agenda', role: 'therapist', actions: async (p) => { await click(p.getByText('Sofía Martínez')); await p.waitForTimeout(1100); } },
  { id: '16', slug: 'expedientes-general', route: '/expedientes', role: 'therapist' },
  { id: '17', slug: 'expedientes-psicoterapia', route: '/expedientes', role: 'therapist', actions: async (p) => { await click(p.getByText('Tratamiento Psicoterapéutico TBE')); await p.waitForTimeout(1100); } },
  { id: '18', slug: 'expedientes-pagos', route: '/expedientes', role: 'therapist', actions: async (p) => { await click(p.getByText('Pagos', { exact: true })); await p.waitForTimeout(1000); } },
  { id: '19', slug: 'expedientes-auditoria', route: '/expedientes', role: 'therapist', actions: async (p) => { await click(p.getByText('Auditoría del Expediente')); await p.waitForTimeout(1000); } },
  { id: '20', slug: 'biblioteca-catalogo', route: '/biblioteca', role: 'therapist' },
  { id: '21', slug: 'biblioteca-filtro-protocolos', route: '/biblioteca', role: 'therapist', actions: async (p) => { await click(p.getByRole('button', { name: 'Protocolos Clínicos', exact: true })); await p.waitForTimeout(900); } },
  { id: '22', slug: 'biblioteca-documento', route: '/biblioteca', role: 'therapist', actions: async (p) => { await click(p.getByRole('button', { name: 'Consultar', exact: true })); await p.waitForTimeout(1400); } },
  { id: '23', slug: 'leva-general', route: '/leva', role: 'therapist' },
  { id: '24', slug: 'leva-sugerencia', route: '/leva', role: 'therapist', actions: async (p) => { await click(p.getByRole('button', { name: /Prescripciones Ataque de Pánico/i })); await p.waitForTimeout(1800); } },
  { id: '25', slug: 'leva-alerta-riesgo', route: '/leva', role: 'therapist', actions: async (p) => { await click(p.getByRole('button', { name: /Probar alerta de riesgo/i })); await p.waitForTimeout(2000); } },
  { id: '26', slug: 'campus-dashboard', route: '/campus', role: 'therapist' },
  { id: '27', slug: 'campus-ruta-curricular', route: '/campus', role: 'therapist', actions: async (p) => { await click(p.getByRole('button', { name: /Ruta Curricular/i })); await p.waitForTimeout(1000); } },
  { id: '28', slug: 'campus-certificaciones', route: '/campus', role: 'therapist', actions: async (p) => { await click(p.getByRole('button', { name: /Certificaciones/i })); await p.waitForTimeout(1000); } },
  { id: '29', slug: 'campus-alumno', route: '/campus', role: 'student' },
  { id: '30', slug: 'desempeno-resultados', route: '/desempeno', role: 'therapist' },
  { id: '31', slug: 'desempeno-fidelidad', route: '/desempeno', role: 'therapist', actions: async (p) => { await click(p.getByRole('button', { name: /Fidelidad al Modelo/i })); await p.waitForTimeout(1000); } },
  { id: '32', slug: 'desempeno-formacion', route: '/desempeno', role: 'therapist', actions: async (p) => { await click(p.getByRole('button', { name: /Formación y Competencias/i })); await p.waitForTimeout(1000); } },
  { id: '33', slug: 'desempeno-supervisiones', route: '/desempeno', role: 'therapist', actions: async (p) => { await click(p.getByRole('button', { name: /Supervisiones Recibidas/i })); await p.waitForTimeout(1000); } },
  { id: '34', slug: 'configuracion', route: '/configuracion', role: 'therapist' },
  { id: '35', slug: 'auditoria-seguridad', route: '/auditoria', role: 'admin_clinical' },
  { id: '36', slug: 'reportes-formulario', route: '/reportes', role: 'therapist' },
  { id: '37', slug: 'reportes-vista-previa', route: '/reportes', role: 'therapist', actions: async (p) => { await click(p.getByRole('button', { name: /Generar Vista Previa/i })); await p.waitForTimeout(1400); } },
  { id: '38', slug: 'supervision-info-secundaria', route: '/mi-consulta', role: 'supervisor', actions: async (p) => { await click(p.getByText(/Información Secundaria/i)); await p.waitForTimeout(1100); } },
  { id: '39', slug: 'contra-referencias', route: '/', role: 'therapist', actions: async (p) => { await click(p.getByRole('button', { name: /Contra-referencias/i })); await p.waitForTimeout(1100); } },
  { id: '40', slug: 'portal-paciente', route: '/', role: 'patient' },
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1800 }, deviceScaleFactor: 1.5 });
  const log = [];
  let page = null;
  let currentRole = null;

  async function ensureRole(role) {
    if (currentRole === role && page && !page.isClosed()) return;
    if (page && !page.isClosed()) await page.close();
    page = await ctx.newPage();
    page.setDefaultTimeout(9000);
    await goto(page, '/');
    if (role && role !== 'therapist') await setRole(page, role);
    currentRole = role || 'therapist';
  }

  for (const s of SHOTS) {
    if (ONLY && !s.id.startsWith(ONLY)) continue;
    const file = path.join(OUT, `${s.id}_${s.slug}.png`);
    const role = s.role || 'therapist';
    try {
      await ensureRole(role);
      await goto(page, s.route);
      if (s.actions) await s.actions(page);
      const leftovers = await sanitize(page);
      if (leftovers.length) throw new Error('TEXTO PROHIBIDO: ' + leftovers.join(','));
      if (s.clip) await page.locator(s.clip).first().screenshot({ path: file, timeout: 15000 });
      else await page.screenshot({ path: file, fullPage: true });
      log.push({ id: s.id, slug: s.slug, ok: true, file, role });
    } catch (e) {
      log.push({ id: s.id, slug: s.slug, ok: false, error: String(e.message).split('\n')[0].slice(0, 160), role });
    }
  }

  fs.writeFileSync(path.join(__dirname, '_capture-log.json'), JSON.stringify(log, null, 1));
  console.log(log.filter((l) => !l.ok).map((l) => `${l.id} ${l.slug}: ${l.error}`).join('\n') || 'TODAS OK');
  console.log('OK:', log.filter((l) => l.ok).length, '/', log.length);
  await browser.close();
})();
