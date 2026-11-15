import { test, expect, Page } from '@playwright/test';

const consoleErrors: string[] = [];
const http500Errors: string[] = [];

async function login(page: Page, email: string): Promise<void> {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill('demo123');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('**/dashboard', { timeout: 15000 });
}

test.describe('Módulo Educar LEVA — Scoping por Rol y Carga de Documentos (Playwright E2E)', () => {
  test.beforeEach(async ({ page }) => {
    consoleErrors.length = 0;
    http500Errors.length = 0;

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('favicon.ico') && !/the server responded with a status of 4\d\d/.test(text)) {
          consoleErrors.push(`[Console Error] ${text}`);
        }
      }
    });

    page.on('pageerror', (exception) => {
      consoleErrors.push(`[Uncaught JS Exception] ${exception.message}`);
    });

    page.on('response', (response) => {
      if (response.status() >= 500) {
        http500Errors.push(`[HTTP ${response.status()}] ${response.url()}`);
      }
    });
  });

  test.afterEach(() => {
    expect(consoleErrors, `Errores de consola: ${consoleErrors.join(' | ')}`).toHaveLength(0);
    expect(http500Errors, `Errores HTTP 500+: ${http500Errors.join(' | ')}`).toHaveLength(0);
  });

  test('TC-EL-01: Admin Clínico (patricia.ortiz@brevemente.org) ve "Entrenar LEVA" y accede a la gestión de protocolos', async ({ page }) => {
    await login(page, 'patricia.ortiz@brevemente.org');

    // 1. Verificar visibilidad en el sidebar bajo sección ADMINISTRACIÓN
    const entrenarLevaNav = page.locator('app-sidebar a[href*="admin/educar-leva"]');
    await expect(entrenarLevaNav).toBeVisible();
    await expect(entrenarLevaNav.getByText('Entrenar LEVA')).toBeVisible();

    // 2. Navegar a /admin/educar-leva dando clic en el enlace del sidebar
    await entrenarLevaNav.click();
    await page.waitForURL('**/admin/educar-leva');

    // 3. Validar elementos clave de la vista EducarLevaComponent
    await expect(page.getByText('Gestión de Protocolos Clínicos & Ingesta a LEVA')).toBeVisible();
    await expect(page.getByText('Arrastra tu archivo aquí o haz clic para examinar')).toBeVisible();
    await expect(page.getByText('Formatos: PDF, Word DOCX/DOC, TXT o Markdown')).toBeVisible();

    // 4. Validar alias /admin/protocolos
    await page.goto('/admin/protocolos');
    await page.waitForURL('**/admin/educar-leva');
    await expect(page.getByText('Gestión de Protocolos Clínicos & Ingesta a LEVA')).toBeVisible();
  });

  test('TC-EL-02: Terapeuta (sofia.ramirez@brevemente.org) NO ve "Entrenar LEVA" y es bloqueado por hasAnyRoleGuard', async ({ page }) => {
    await login(page, 'sofia.ramirez@brevemente.org');

    // 1. "Entrenar LEVA" NO debe existir en el menú de navegación
    const entrenarLevaNav = page.locator('app-sidebar a[href*="admin/educar-leva"]');
    await expect(entrenarLevaNav).not.toBeVisible();

    // 2. Intento de navegación directa a /admin/educar-leva debe ser interceptado por hasAnyRoleGuard
    await page.goto('/admin/educar-leva');
    await page.waitForLoadState('networkidle');

    // Debe ser redirigido a /dashboard y no permitir visualización del componente
    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.getByText('Gestión de Protocolos Clínicos & Ingesta a LEVA')).not.toBeVisible();

    // 3. Intento de navegación a /admin/protocolos también debe ser bloqueado
    await page.goto('/admin/protocolos');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/.*\/dashboard/);
  });

  test('TC-EL-03: Asistente (asistente.agenda@brevemente.org) NO ve "Entrenar LEVA" y es bloqueado por hasAnyRoleGuard', async ({ page }) => {
    await login(page, 'asistente.agenda@brevemente.org');

    const entrenarLevaNav = page.locator('app-sidebar a[href*="admin/educar-leva"]');
    await expect(entrenarLevaNav).not.toBeVisible();

    await page.goto('/admin/educar-leva');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.getByText('Gestión de Protocolos Clínicos & Ingesta a LEVA')).not.toBeVisible();
  });

  test('TC-EL-04: Carga y previsualización de documento .doc en modo Split-Screen (Humano al Mando)', async ({ page }) => {
    await login(page, 'patricia.ortiz@brevemente.org');
    await page.goto('/admin/educar-leva');
    await page.waitForLoadState('networkidle');

    // Mock de la respuesta de previsualización determinista para archivo .doc
    await page.route('**/leva/corpus/documents/preview-convert', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          filename: 'Protocolo_TBE_Ataques_Panico.doc',
          extension: '.doc',
          pageCount: 4,
          wordCount: 820,
          markdown: '# Protocolo Clínico TBE - Ataque de Pánico\n\n## 1. Sistema Perceptivo Reactivo (SPR)\nEl paciente intenta controlar sus sensaciones fisiológicas espontáneas.\n\n## 2. Prescripciones TBE\n| Fase | Prescripción | Frecuencia |\n| --- | --- | --- |\n| 1 | Diario de a bordo | En cada conato de crisis |\n| 2 | La peor fantasía | 30 min diarios |',
          sections: ['1. Sistema Perceptivo Reactivo (SPR)', '2. Prescripciones TBE'],
          chunkCount: 2,
          chunks: [
            {
              chunkIndex: 0,
              title: '1. Sistema Perceptivo Reactivo (SPR)',
              content: 'El paciente intenta controlar sus sensaciones fisiológicas espontáneas provocando la escalada hacia el pánico.',
              wordCount: 15
            },
            {
              chunkIndex: 1,
              title: '2. Prescripciones TBE',
              content: '| Fase | Prescripción | Frecuencia |\n| --- | --- | --- |\n| 1 | Diario de a bordo | En cada conato de crisis |',
              wordCount: 16
            }
          ]
        })
      });
    });

    // Simular subida de archivo .doc mediante input file de Angular
    await page.locator('input[type="file"]').setInputFiles({
      name: 'Protocolo_TBE_Ataques_Panico.doc',
      mimeType: 'application/msword',
      buffer: Buffer.from('Contenido simulado de protocolo clínico en formato Word')
    });

    // Validar activación del modo revisión Humano al Mando
    await expect(page.getByText('Revisión de Protocolo Clínico Extraído')).toBeVisible();
    await expect(page.getByText('Protocolo_TBE_Ataques_Panico.doc')).toBeVisible();

    // Validar pestañas del visor Split-Screen
    await expect(page.getByText('Editor Markdown (.md)')).toBeVisible();
    await expect(page.getByText('Fragmentos Semánticos (2 Chunks)')).toBeVisible();

    // Validar presencia del botón de publicación médica
    const btnPublicar = page.getByRole('button', { name: 'Aprobar y Publicar en Base de Conocimiento' });
    await expect(btnPublicar).toBeVisible();
  });
});
