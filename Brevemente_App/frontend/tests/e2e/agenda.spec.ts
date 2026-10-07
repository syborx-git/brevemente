import { test, expect } from '@playwright/test';

test.describe('Módulo de Agenda — Validación E2E de Oráculo y Regresión Visual', () => {
  const consoleErrors: string[] = [];
  const http500Errors: string[] = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors.length = 0;
    http500Errors.length = 0;

    // 1. Monitoreo de errores de consola y excepciones de JavaScript.
    //    Se ignoran el 404 del favicon y los "Failed to load resource" 4xx.
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('favicon.ico') && !/the server responded with a status of 4\d\d/.test(text)) {
          consoleErrors.push(`[Console Error] ${text}`);
        }
      }
    });

    page.on('pageerror', exception => {
      consoleErrors.push(`[Uncaught JS Exception] ${exception.message}`);
    });

    // 2. Monitoreo de respuestas HTTP 500 o superiores
    page.on('response', response => {
      if (response.status() >= 500) {
        http500Errors.push(`[HTTP ${response.status()}] ${response.url()}`);
      }
    });

    // 3. Autenticación previa contra el oráculo real (JWT)
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.locator('#email').fill('sofia.ramirez@brevemente.org');
    await page.locator('#password').fill('demo123');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/dashboard', { timeout: 15000 });
  });

  test.afterEach(() => {
    // Falla inmediatamente si se detectaron errores 500 o excepciones JS
    expect(
      consoleErrors,
      `Errores detectados en la consola del navegador: ${consoleErrors.join(' | ')}`
    ).toHaveLength(0);
    expect(
      http500Errors,
      `Errores de servidor HTTP 500 detectados: ${http500Errors.join(' | ')}`
    ).toHaveLength(0);
  });

  test('TC-AG-01: Carga y oráculo de datos reales desde Spring Boot/PostgreSQL', async ({ page }) => {
    await page.goto('/agenda');
    await page.waitForLoadState('networkidle');

    // Título clínico principal del calendario
    await expect(page.locator('main h1')).toHaveText('Agenda y Calendario Clínico');

    // Banner de control normativo visible
    await expect(page.getByText('Control Normativo:')).toBeVisible();

    // El oráculo sirve citas con nombre de paciente (join SQL) en la vista semanal
    await expect(page.getByText('Mateo Herrera Santos').first()).toBeVisible();
    await expect(page.getByText('Emiliano Díaz Corona').first()).toBeVisible();
  });

  test('TC-AG-02: Navegación del calendario (día/semana/mes/año) y detalle de cita', async ({ page }) => {
    await page.goto('/agenda');
    await page.waitForLoadState('networkidle');

    // Día: el paciente menor (pac-001) aparece bloqueado por normativa
    await page.getByRole('button', { name: 'Día', exact: true }).click();
    await expect(page.getByText('Bloqueada por Normativa').first()).toBeVisible();

    // Mes: cuadrícula mensual
    await page.getByRole('button', { name: 'Mes', exact: true }).click();
    await expect(page.getByText('Lun').first()).toBeVisible();

    // Año: resumen anual
    await page.getByRole('button', { name: 'Año', exact: true }).click();
    await expect(page.getByText('Año 2026')).toBeVisible();

    // Volver a Día y abrir el detalle de la cita
    await page.getByRole('button', { name: 'Día', exact: true }).click();
    await page.getByText('Mateo Herrera Santos', { exact: true }).first().click();
    await expect(page.getByRole('heading', { name: 'Detalle de Consulta' })).toBeVisible();
  });

  test('TC-AG-03: Apertura del modal de agendar con duración, modalidad y consultorio', async ({ page }) => {
    await page.goto('/agenda');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Agendar Cita' }).click();

    const modal = page.locator('div.fixed.inset-0');
    await expect(modal.getByRole('heading', { name: 'Agendar Sesión Clínica' })).toBeVisible();

    // Campos del formulario de programación
    await expect(modal.locator('input[type="date"]')).toBeVisible();
    await expect(modal.locator('input[type="time"]')).toBeVisible();
    await expect(modal.getByText('Duración')).toBeVisible();
    await expect(modal.getByText('Modalidad')).toBeVisible();
    await expect(modal.getByText('Consultorio', { exact: true })).toBeVisible();

    await modal.getByRole('button', { name: 'Cancelar' }).click();
    await expect(modal.getByRole('heading', { name: 'Agendar Sesión Clínica' })).not.toBeVisible();
  });

  test('TC-AG-04: Regresión Visual del Calendario con Oráculo Real', async ({ page }) => {
    await page.goto('/agenda');
    await page.waitForLoadState('networkidle');

    // Asegurar renderizado completo de fuentes y elementos
    await page.waitForTimeout(500);

    // Captura y comparación de regresión visual (baseline vs actual)
    await expect(page).toHaveScreenshot('agenda-calendario.png', {
      maxDiffPixelRatio: 0.01,
      fullPage: true
    });
  });
});
