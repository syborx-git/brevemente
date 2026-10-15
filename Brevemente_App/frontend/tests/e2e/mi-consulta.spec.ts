import { test, expect, Page } from '@playwright/test';

/** Localiza el input inmediatamente siguiente a una etiqueta. */
function inputByLabel(page: Page, label: string) {
  return page.locator('label', { hasText: label }).locator('xpath=following-sibling::input');
}

/** Localiza el select inmediatamente siguiente a una etiqueta. */
function selectByLabel(page: Page, label: string) {
  return page.locator('label', { hasText: label }).locator('xpath=following-sibling::select');
}

test.describe('Módulo Mi Consulta — Validación E2E de Oráculo, CRUD y Regresión Visual', () => {
  const consoleErrors: string[] = [];
  const http500Errors: string[] = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors.length = 0;
    http500Errors.length = 0;

    // 1. Monitoreo de errores de consola y excepciones de JavaScript.
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

    // 2. Monitoreo de respuestas HTTP 500 o superiores.
    page.on('response', (response) => {
      if (response.status() >= 500) {
        http500Errors.push(`[HTTP ${response.status()}] ${response.url()}`);
      }
    });

    // 3. Autenticación previa contra el oráculo real (Spring Boot + PostgreSQL).
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.locator('#email').fill('sofia.ramirez@brevemente.org');
    await page.locator('#password').fill('demo123');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/dashboard', { timeout: 15000 });
  });

  test.afterEach(() => {
    expect(
      consoleErrors,
      `Errores detectados en la consola del navegador: ${consoleErrors.join(' | ')}`
    ).toHaveLength(0);
    expect(
      http500Errors,
      `Errores de servidor HTTP 500 detectados: ${http500Errors.join(' | ')}`
    ).toHaveLength(0);
  });

  test('TC-MC-01: Carga de configuración desde el oráculo (Spring Boot + PostgreSQL)', async ({ page }) => {
    await page.goto('/mi-consulta');
    await page.waitForLoadState('networkidle');

    // Encabezado del módulo.
    await expect(page.getByRole('heading', { name: /Mi Consulta/ })).toBeVisible();

    // Identidad proveniente de `usuarios` (oráculo), no del mock local.
    await expect(inputByLabel(page, 'Nombre Completo')).toHaveValue(/Sofía/);
    await expect(inputByLabel(page, 'Cédula Profesional')).toHaveValue('CED-782190-PSIC');

    // Parámetros de configuración provenientes de `terapeutas` (V13).
    await expect(inputByLabel(page, 'Duración Habitual')).toHaveValue('50');
    await expect(inputByLabel(page, 'Costo Primera Sesión')).toHaveValue('1200');
    await expect(inputByLabel(page, 'Costo Seguimiento')).toHaveValue('1000');
    await expect(inputByLabel(page, 'Edad Mínima de Atención')).toHaveValue('0');

    // Sede principal sembrada en V14.
    await expect(page.getByText('Sede Centro BreveMente')).toBeVisible();
    await expect(page.getByText('PRINCIPAL', { exact: true })).toBeVisible();
  });

  test('TC-MC-02: Guardar configuración persiste y se audita', async ({ page }) => {
    await page.goto('/mi-consulta');
    await page.waitForLoadState('networkidle');

    // Editar un parámetro editable y guardar.
    await inputByLabel(page, 'Duración Habitual').fill('60');
    await page.getByRole('button', { name: 'Guardar Configuración' }).click();

    // Notificación reactiva de éxito.
    await expect(page.getByText(/Cambios guardados/)).toBeVisible();

    // Persistencia real: recargar y leer el valor desde PostgreSQL.
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(inputByLabel(page, 'Duración Habitual')).toHaveValue('60');

    // Auditoría: el cambio queda registrado en el historial visible.
    await expect(page.getByText('Duración de sesión').first()).toBeVisible();

    // Limpieza: restaurar el valor original.
    await inputByLabel(page, 'Duración Habitual').fill('50');
    await page.getByRole('button', { name: 'Guardar Configuración' }).click();
    await expect(page.getByText(/Cambios guardados/)).toBeVisible();
  });

  test('TC-MC-03: Gestión de sedes (agregar, guardar, quitar)', async ({ page }) => {
    await page.goto('/mi-consulta');
    await page.waitForLoadState('networkidle');

    // Agregar una sede desde el catálogo de sedes disponibles.
    await selectByLabel(page, 'Agregar sede').selectOption('sede-norte');
    await page.getByRole('button', { name: 'Agregar', exact: true }).click();
    await expect(page.getByText('Sede Norte BreveMente')).toBeVisible();

    // Guardar la lista de sedes.
    await page.getByRole('button', { name: 'Guardar Sedes' }).click();
    await expect(page.getByText(/Cambios guardados/)).toBeVisible();

    // Persistencia real.
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Sede Norte BreveMente')).toBeVisible();

    // Limpieza: quitar la sede agregada y guardar.
    await page.getByText('Sede Norte BreveMente').locator('xpath=..').getByRole('button', { name: 'Quitar' }).click();
    await page.getByRole('button', { name: 'Guardar Sedes' }).click();
    await expect(page.getByText(/Cambios guardados/)).toBeVisible();
  });

  test('TC-MC-04: Regresión Visual de la pantalla Mi Consulta', async ({ page }) => {
    await page.goto('/mi-consulta');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: /Mi Consulta/ })).toBeVisible();
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('mi-consulta-pantalla.png');
  });
});
