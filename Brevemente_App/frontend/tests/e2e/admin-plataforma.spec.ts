import { test, expect, Page } from '@playwright/test';

const consoleErrors: string[] = [];
const http500Errors: string[] = [];

async function loginStaff(page: Page, email: string): Promise<void> {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill('demo123');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('**/dashboard', { timeout: 15000 });
}

async function loginAdmin(page: Page): Promise<void> {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.locator('#email').fill('admin@brevemente.org');
  await page.locator('#password').fill('demo123');
  await page.locator('button[type="submit"]').click();
  // homeRedirectGuard: admin_platform → /admin/dashboard
  await page.waitForURL('**/admin/dashboard', { timeout: 15000 });
}

test.describe('Zona Admin — Plataforma (Dashboard + Usuarios) E2E contra el oráculo real', () => {
  test.beforeEach(async ({ page }) => {
    consoleErrors.length = 0;
    http500Errors.length = 0;

    // 1. Monitoreo de errores de consola y excepciones JS (ignora favicon y 4xx)
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

  test('TC-ADM-01: Rol no-admin no accede a la zona /admin (adminPlatformGuard)', async ({ page }) => {
    await loginStaff(page, 'sofia.ramirez@brevemente.org');

    await page.goto('/admin/dashboard');
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // El guard lo devuelve al dashboard clínico, sin shell admin.
    await expect(page.getByRole('heading', { name: 'Dashboard de Plataforma' })).not.toBeVisible();
    await expect(page.getByText('Sedes y Establecimientos')).not.toBeVisible();
  });

  test('TC-ADM-02: Login admin → shell admin y redirección a /admin/dashboard', async ({ page }) => {
    await loginAdmin(page);

    await expect(page.getByRole('heading', { name: 'Dashboard de Plataforma' })).toBeVisible();

    // Sidebar de administración con navegación de plataforma
    await expect(page.getByText('Administración', { exact: true })).toBeVisible();
    await expect(page.locator('nav a', { hasText: 'Usuarios y Roles' })).toBeVisible();
    await expect(page.locator('nav a', { hasText: 'Sedes y Establecimientos' })).toBeVisible();

    // Identidad del administrador en el pie del sidebar
    await expect(page.getByText('Administrador Plataforma', { exact: true })).toBeVisible();
  });

  test('TC-ADM-03: Dashboard de Plataforma carga KPIs reales y secciones', async ({ page }) => {
    await loginAdmin(page);
    await page.waitForLoadState('networkidle');

    // KPIs reales (contadores desde PostgreSQL vía /admin/dashboard/resumen)
    await expect(page.getByText('Terapeutas activos').first()).toBeVisible();
    await expect(page.getByText('Pacientes activos').first()).toBeVisible();

    // Secciones renderizadas
    await expect(page.getByText('Indicadores clínicos globales')).toBeVisible();
    await expect(page.getByText('Actividad reciente')).toBeVisible();
    await expect(page.getByText('Alertas administrativas', { exact: true })).toBeVisible();
    await expect(page.getByText('Salud de la plataforma')).toBeVisible();
    await expect(page.getByText('Feature flags')).toBeVisible();
  });

  test('TC-ADM-04: Desglose por terapeuta de un indicador clínico', async ({ page }) => {
    await loginAdmin(page);
    await page.waitForLoadState('networkidle');

    await page.getByText('Efectividad TBE').first().click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal.getByText('desglose por terapeuta')).toBeVisible();
    await expect(modal.getByText('Dra. Sofía Ramírez Lozano').first()).toBeVisible();
    await expect(modal.getByText('Mtro. Alejandro Mendoza Garza').first()).toBeVisible();
    await expect(modal.getByText('Dra. Isabel Cárdenas').first()).toBeVisible();

    // Cerrar desglose
    await modal.getByRole('button', { name: 'Cerrar' }).click();
    await expect(modal).not.toBeVisible();
  });

  test('TC-ADM-05: Usuarios — listado real desde el backend', async ({ page }) => {
    await loginAdmin(page);

    await page.locator('nav a', { hasText: 'Usuarios y Roles' }).click();
    await page.waitForURL('**/admin/usuarios');

    await expect(page.getByRole('heading', { name: 'Gestión de Usuarios y Roles' })).toBeVisible();

    // Usuarios reales sembrados por Flyway (V4/V5)
    await expect(page.getByText('admin@brevemente.org')).toBeVisible();
    await expect(page.getByText('sofia.ramirez@brevemente.org')).toBeVisible();

    // La propia cuenta admin se marca como "Tú" y no es editable
    const adminRow = page.locator('tr').filter({ hasText: 'admin@brevemente.org' });
    await expect(adminRow.getByText('Tú')).toBeVisible();
    await expect(adminRow.getByText('No editable')).toBeVisible();
  });

  test('TC-ADM-06: Usuarios — filtro por rol', async ({ page }) => {
    await loginAdmin(page);

    await page.locator('nav a', { hasText: 'Usuarios y Roles' }).click();
    await page.waitForURL('**/admin/usuarios');

    // Primer select = filtro de rol
    await page.locator('select').first().selectOption('therapist');

    await expect(page.getByText('sofia.ramirez@brevemente.org')).toBeVisible();
    // El admin (admin_platform) queda fuera del filtro therapist
    await expect(page.getByText('admin@brevemente.org')).not.toBeVisible();
  });

  test('TC-ADM-07: Usuarios — edición requiere contraseña de confirmación (D12)', async ({ page }) => {
    await loginAdmin(page);

    await page.locator('nav a', { hasText: 'Usuarios y Roles' }).click();
    await page.waitForURL('**/admin/usuarios');

    const row = page.locator('tr').filter({ hasText: 'sofia.ramirez@brevemente.org' });
    await row.getByText('Editar').click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal.getByRole('heading', { name: 'Editar usuario' })).toBeVisible();

    // D12: el campo de confirmación de contraseña está presente en edición
    await expect(modal.getByPlaceholder('Reescribe tu contraseña para confirmar')).toBeVisible();

    // Sin confirmación no se guarda: la validación del cliente lo impide
    await modal.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(modal.getByText('Escribe tu contraseña para confirmar los cambios.')).toBeVisible();

    await modal.getByRole('button', { name: 'Cancelar' }).click();
    await expect(modal).not.toBeVisible();
  });

  test('TC-ADM-08: Usuarios — reset en dos pasos con confirmación (D12)', async ({ page }) => {
    await loginAdmin(page);

    await page.locator('nav a', { hasText: 'Usuarios y Roles' }).click();
    await page.waitForURL('**/admin/usuarios');

    const row = page.locator('tr').filter({ hasText: 'sofia.ramirez@brevemente.org' });
    await row.getByText('Restablecer').click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal.getByRole('heading', { name: 'Restablecer contraseña' })).toBeVisible();

    // Paso 1: confirmación (sin generar todavía)
    const generarBtn = modal.getByRole('button', { name: 'Generar temporal' });
    await expect(generarBtn).toBeVisible();

    // Confirmación vacía → error, no llama al backend
    await generarBtn.click();
    await expect(modal.getByText('Escribe tu contraseña para confirmar.')).toBeVisible();

    await modal.getByRole('button', { name: 'Cancelar' }).click();
    await expect(modal).not.toBeVisible();
  });

  test('TC-ADM-09: Usuarios — alta con email duplicado es rechazada (409, sin mutación)', async ({ page }) => {
    await loginAdmin(page);

    await page.locator('nav a', { hasText: 'Usuarios y Roles' }).click();
    await page.waitForURL('**/admin/usuarios');

    await page.getByRole('button', { name: '+ Nuevo usuario' }).click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal.getByRole('heading', { name: 'Nuevo usuario' })).toBeVisible();

    // Usar un email existente (semilla Flyway) → backend responde 409
    await modal.locator('input[type="text"]').first().fill('Duplicado Prueba');
    await modal.locator('input[type="email"]').fill('sofia.ramirez@brevemente.org');
    await modal.getByRole('button', { name: 'Crear usuario' }).click();

    await expect(modal.getByText('No se pudo crear el usuario (revisa correo o cédula).')).toBeVisible();

    await modal.getByRole('button', { name: 'Cancelar' }).click();
    await expect(modal).not.toBeVisible();
  });

  test('TC-ADM-10: Cerrar sesión desde el sidebar de administración', async ({ page }) => {
    await loginAdmin(page);

    const logoutBtn = page.locator('aside').getByRole('button', { name: 'Cerrar sesión' });
    await expect(logoutBtn).toBeVisible();
    await logoutBtn.click();

    await page.waitForURL('**/login', { timeout: 10000 });

    const session = await page.evaluate(() => localStorage.getItem('brevemente_session'));
    expect(session).toBeNull();
    await expect(page.locator('h2', { hasText: 'Iniciar sesión' })).toBeVisible();
  });
});
