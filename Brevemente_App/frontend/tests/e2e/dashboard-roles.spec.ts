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

test.describe('Módulo de Dashboard — Scoping por Rol (Validación E2E de Oráculo)', () => {
  test.beforeEach(async ({ page }) => {
    consoleErrors.length = 0;
    http500Errors.length = 0;

    // 1. Monitoreo de errores de consola y excepciones JS
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

    // 2. Monitoreo de respuestas HTTP 500+
    page.on('response', response => {
      if (response.status() >= 500) {
        http500Errors.push(`[HTTP ${response.status()}] ${response.url()}`);
      }
    });
  });

  test.afterEach(() => {
    expect(consoleErrors, `Errores de consola: ${consoleErrors.join(' | ')}`).toHaveLength(0);
    expect(http500Errors, `Errores HTTP 500+: ${http500Errors.join(' | ')}`).toHaveLength(0);
  });

  test('TC-ROLE-01: Terapeuta (rol-003) ve solo sus pacientes y sus alertas', async ({ page }) => {
    await login(page, 'sofia.ramirez@brevemente.org');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // KPIs visibles
    await expect(page.getByText('Pacientes Activos').first()).toBeVisible();
    await expect(page.getByText('Alertas de Riesgo').first()).toBeVisible();

    // Aviso normativo de su paciente pac-001 (en su scope)
    await expect(page.getByText('Aviso Normativo TBE')).toBeVisible();

    // Pacientes recientes: SOLO los suyos (ter-001 → Mateo y Valeria)
    await expect(page.getByText('Mateo Herrera Santos').first()).toBeVisible();
    // pac-004 (Roberto) es de ter-002 → fuera del scope del terapeuta
    await expect(page.getByText('Roberto Valdés Garza')).not.toBeVisible();
  });

  test('TC-ROLE-02: Asistente (rol-004) ve solo KPIs operativos, sin alertas clínicas', async ({ page }) => {
    await login(page, 'asistente.agenda@brevemente.org');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // KPIs operativos visibles
    await expect(page.getByText('Pacientes Activos').first()).toBeVisible();
    await expect(page.getByText('Citas Programadas').first()).toBeVisible();

    // El KPI clínico existe pero NO expone el conteo: muestra "—" y "NO AUTORIZADO"
    const riesgo = page.locator('app-kpi-card', { hasText: 'Alertas de Riesgo' });
    await expect(riesgo).toBeVisible();
    await expect(riesgo.getByText('NO AUTORIZADO')).toBeVisible();
    await expect(page.getByText('Consentimiento informado pendiente')).not.toBeVisible();
  });

  test('TC-ROLE-03: Supervisor (rol-005) ve métricas de sus terapeutas asignados', async ({ page }) => {
    await login(page, 'isabel.cardenas@brevemente.org');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // KPIs + alertas (el supervisor sí ve clínica)
    await expect(page.getByText('Pacientes Activos').first()).toBeVisible();
    await expect(page.getByText('Alertas de Riesgo').first()).toBeVisible();

    // Supervisa ter-001 y ter-002: el filtro por terapeuta (solo para roles superiores)
    // lista ambos profesionales, evidencia del alcance cross-terapeuta.
    const terapeutaSelect = page.locator('select').filter({ hasText: 'Todos los Terapeutas' }).first();
    await expect(terapeutaSelect).toBeVisible();
    await expect(terapeutaSelect.locator('option', { hasText: 'Sofía Ramírez' })).toHaveCount(1);
    await expect(terapeutaSelect.locator('option', { hasText: 'Alejandro Mendoza' })).toHaveCount(1);
    await expect(page.getByText('Mateo Herrera Santos').first()).toBeVisible();
  });

  test('TC-ROLE-04: Regresión Visual del estado Asistente (sin alertas, grid reducida)', async ({ page }) => {
    await login(page, 'asistente.agenda@brevemente.org');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('dashboard-assistant.png', {
      maxDiffPixelRatio: 0.01,
      fullPage: true
    });
  });
});
