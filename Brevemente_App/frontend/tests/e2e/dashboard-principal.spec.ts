import { test, expect } from '@playwright/test';

test.describe('Módulo de Dashboard — Validación E2E de Oráculo y Regresión Visual', () => {
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

  test('TC-DASH-01: Carga y oráculo de datos reales desde Spring Boot/PostgreSQL', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Título del Centro de Control e identidad real del terapeuta autenticado
    await expect(page.getByRole('heading', { name: 'Panel Principal' })).toBeVisible();
    await expect(page.getByText('Dra. Sofía Ramírez Lozano').first()).toBeVisible();

    // Los 3 KPIs del panel (la card "Horas Supervisión" fue retirada — GAP-DASH-09)
    await expect(page.getByText('Pacientes Activos').first()).toBeVisible();
    await expect(page.getByText('Citas Programadas').first()).toBeVisible();
    await expect(page.getByText('Alertas Normativas').first()).toBeVisible();
    await expect(page.getByText('Horas Supervisión')).not.toBeVisible();

    // Alerta normativa real: pac-001 (menor) sin firma del representante
    await expect(page.getByText('Consentimiento informado pendiente').first()).toBeVisible();

    // Pacientes recientes servidos por la API real del dashboard
    await expect(page.getByText('Pacientes con Actividad Reciente').first()).toBeVisible();
    await expect(page.getByText('Mateo Herrera Santos').first()).toBeVisible();
  });

  test('TC-DASH-02: Regresión Visual del Panel Principal con Oráculo Real', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Asegurar renderizado completo de fuentes y elementos
    await page.waitForTimeout(500);

    // Captura y comparación de regresión visual (baseline vs actual)
    await expect(page).toHaveScreenshot('dashboard-principal.png', {
      maxDiffPixelRatio: 0.01,
      fullPage: true
    });
  });
});
