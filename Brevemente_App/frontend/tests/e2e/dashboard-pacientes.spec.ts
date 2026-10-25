import { test, expect } from '@playwright/test';

test.describe('Portal del Paciente (/mi-historial) — Validación E2E contra oráculo', () => {
  const consoleErrors: string[] = [];
  const http500Errors: string[] = [];

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

    // Autenticación como paciente (usr-pac-001 → pac-001, citas y sesiones sembradas).
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.locator('#email').fill('contacto.mateo@familia.mx');
    await page.locator('#password').fill('demo123');
    await page.locator('button[type="submit"]').click();

    // El patient no tiene DASHBOARD_LEER → permissionGuard redirige a /mi-historial.
    await page.waitForURL('**/mi-historial', { timeout: 15000 });
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

  test('TC-DP-01: El patient aterriza en su portal sin shell de staff (role-gating)', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Encabezado del portal con el nombre real del paciente (oráculo).
    await expect(page.getByText(/Hola, Mateo/)).toBeVisible();
    await expect(page.getByText('Terapeuta asignado:')).toBeVisible();

    // Fidelidad con la demo: el patient NO ve sidebar, risk-banner ni LEVA.
    await expect(page.locator('app-sidebar')).toHaveCount(0);
    await expect(page.locator('app-risk-banner')).toHaveCount(0);
    await expect(page.locator('app-leva-button')).toHaveCount(0);
    await expect(page.locator('app-leva-drawer')).toHaveCount(0);

    // Botón de Crisis presente.
    await expect(page.getByRole('button', { name: /Botón de Crisis/ })).toBeVisible();
  });

  test('TC-DP-02: Próxima cita con badges de asistencia y pago + aviso de seguridad clínica', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Alerta de seguridad clínica sembrada en V17 (alerta-pac-001).
    await expect(page.getByText('Aviso de seguridad clínica')).toBeVisible();

    // cit-001 (confirmada) → badge "Próxima cita".
    await expect(page.getByText('Próxima cita', { exact: true }).first()).toBeVisible();

    // Pago denormalizado desde citas.payment_status (pendiente).
    await expect(page.getByText('Pendiente de pago').first()).toBeVisible();
  });

  test('TC-DP-03: Historial con empty-state cuando no hay citas pasadas', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // pac-001 solo tiene citas confirmada/pendiente → historial vacío.
    await expect(page.getByText('Historial de Citas')).toBeVisible();
    await expect(page.getByText(/Aún no hay citas en el historial/)).toBeVisible();
  });

  test('TC-DP-04: Prescripciones por sesión expandibles (ses-001 → cit-001)', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // cit-001 tiene ses-001 vinculada (2 prescripciones).
    await page.getByText('2 prescripciones', { exact: false }).first().click();

    await expect(page.getByText('Prescripciones asignadas en esta sesión')).toBeVisible();
    await expect(page.getByText('Cómo empeorar')).toBeVisible();
  });
});
