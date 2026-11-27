import { test, expect, Page } from '@playwright/test';

async function login(page: Page, email: string, urlPattern: string): Promise<void> {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill('demo123');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(urlPattern, { timeout: 15000 });
}

test.describe('Unificación de roles admin (V41) — sidebar unificado y Visión Global', () => {
  test('TC-UNIF-01: Admin puro aterriza en Dashboard de Plataforma con sección PLATAFORMA', async ({ page }) => {
    await login(page, 'admin@brevemente.org', '**/admin/dashboard');

    await expect(page.getByRole('link', { name: 'Visión Global' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Dashboard de Plataforma' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Usuarios y Roles' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sedes y Establecimientos' })).toBeVisible();
  });

  test('TC-UNIF-02: Visión Global muestra tabs de datos clínicos globales', async ({ page }) => {
    await login(page, 'admin@brevemente.org', '**/admin/dashboard');

    await page.getByRole('link', { name: 'Visión Global' }).click();
    await page.waitForURL('**/admin/vision-global');

    await expect(page.getByRole('button', { name: /Pacientes/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Citas/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Expedientes/ })).toBeVisible();
  });

  test('TC-UNIF-03: Admin puro ve candado clínico en Pacientes', async ({ page }) => {
    await login(page, 'admin@brevemente.org', '**/admin/dashboard');

    await page.getByRole('link', { name: 'Pacientes' }).click();
    await page.waitForURL('**/pacientes');

    await expect(page.getByText('Complete su información clínica')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Ir a Configuración' })).toBeVisible();
  });

  test('TC-UNIF-04: Terapeuta puro no ve la sección PLATAFORMA', async ({ page }) => {
    await login(page, 'sofia.ramirez@brevemente.org', '**/dashboard');

    await expect(page.getByRole('link', { name: 'Visión Global' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Dashboard de Plataforma' })).toHaveCount(0);
  });
});
