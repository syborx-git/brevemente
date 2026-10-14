import { test, expect } from '@playwright/test';

/**
 * E2E del Centro de Control (paridad completa SDD-005) para el rol TERAPEUTA.
 * Oráculo real: Angular 18 (3000) → Spring Boot (/api/v1, 8080) → PostgreSQL.
 * Enfoque exclusivo en la vista de terapeuta (sin paciente ni alumno).
 */
test.describe('Módulo de Dashboard — Centro de Control (terapeuta)', () => {
  const consoleErrors: string[] = [];
  const http500Errors: string[] = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors.length = 0;
    http500Errors.length = 0;

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

    page.on('response', response => {
      if (response.status() >= 500) {
        http500Errors.push(`[HTTP ${response.status()}] ${response.url()}`);
      }
    });

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

  test('TC-DASH2-01: Carga completa del Centro de Control', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Centro de Control BreveMente' })).toBeVisible();

    // Los 4 KPIs del Centro de Control
    await expect(page.getByText('Citas Programadas', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Pacientes Activos', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Pendientes Clínicos', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Alertas de Riesgo', { exact: true }).first()).toBeVisible();

    // Secciones de paridad con la demo
    await expect(page.getByText('Perspectiva Clínica Unificada', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Acción Operativa Dominante', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Agenda del Día', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Pendientes Prioritarios', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Filtros:', { exact: true }).first()).toBeVisible();
  });

  test('TC-DASH2-02: Valores reales del oráculo (scoped a ter-001)', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const kpiPacientes = page.locator('app-kpi-card').filter({ hasText: 'Pacientes Activos' });
    await expect(kpiPacientes.getByText('2', { exact: true }).first()).toBeVisible();

    const kpiRiesgo = page.locator('app-kpi-card').filter({ hasText: 'Alertas de Riesgo' });
    await expect(kpiRiesgo.getByText('2', { exact: true }).first()).toBeVisible();
    await expect(kpiRiesgo.getByText('REQUERIDO', { exact: true })).toBeVisible();

    const kpiCitas = page.locator('app-kpi-card').filter({ hasText: 'Citas Programadas' });
    await expect(kpiCitas.getByText('0', { exact: true }).first()).toBeVisible();

    const kpiPendientes = page.locator('app-kpi-card').filter({ hasText: 'Pendientes Clínicos' });
    await expect(kpiPendientes.getByText('0', { exact: true }).first()).toBeVisible();
    await expect(kpiPendientes.getByText('Límite semanal: 5', { exact: true })).toBeVisible();

    // Acción dominante vacía (no hay citas hoy en semilla) → estado "Sin Consultas"
    await expect(page.getByText('Sin Consultas', { exact: true }).first()).toBeVisible();

    // Gráfica de citas por mes muestra el mes real (Oct)
    await expect(page.getByText('Oct', { exact: true }).first()).toBeVisible();
  });

  test('TC-DASH2-03: Drilldown desde el KPI "Pacientes Activos"', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    await page.locator('app-kpi-card').filter({ hasText: 'Pacientes Activos' }).click();

    await expect(page.getByText('Detalle del Centro de Control', { exact: true })).toBeVisible();
    await expect(page.getByText('Pacientes Filtrados — 2', { exact: true })).toBeVisible();
    await expect(page.getByText('Mateo Herrera Santos', { exact: true }).first()).toBeVisible();
    await expect(page.getByText(/Valeria/).first()).toBeVisible();

    await page.getByRole('button', { name: 'Cerrar', exact: true }).click();
    await expect(page.getByText('Detalle del Centro de Control', { exact: true })).not.toBeVisible();
  });

  test('TC-DASH2-04: Filtro por sede acota KPIs y agregaciones', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const kpiPacientes = page.locator('app-kpi-card').filter({ hasText: 'Pacientes Activos' });

    // Valor inicial scoped a ter-001: 2 pacientes activos (sede centro)
    await expect(kpiPacientes.getByText('2', { exact: true }).first()).toBeVisible();

    const respPromise = page.waitForResponse(
      r => r.url().includes('/stats') && r.url().includes('sedeId=sede-norte')
    );

    await page
      .locator('app-dashboard-filters select')
      .nth(1)
      .selectOption({ label: 'Sede Norte BreveMente' });

    const resp = await respPromise;
    expect(resp.status()).toBe(200);

    // GAP-DASH2-01 corregido: el KPI se acota al filtro de sede (ter-001 sin pacientes en Norte → 0)
    await expect(kpiPacientes.getByText('0', { exact: true }).first()).toBeVisible();
  });

  test('TC-DASH2-05: Regresión visual del Centro de Control (full page)', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('dashboard-principal-2.png', {
      maxDiffPixelRatio: 0.01,
      fullPage: true
    });
  });
});
