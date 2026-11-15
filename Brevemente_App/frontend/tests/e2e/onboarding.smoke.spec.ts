import { test, expect } from '@playwright/test';

/**
 * Smoke test NO mutante de la pantalla de onboarding y sus guards.
 * Simula el flag `debeCambiarPassword` en la sesión local (sin crear usuarios)
 * para validar: (1) el guard fuerza /onboarding en rutas protegidas y
 * (2) la pantalla renderiza y valida sus campos.
 * El flujo real alta→temporal→cambio ya se valida contra el backend.
 */
test.describe('Onboarding — pantalla y guards (smoke, no mutante)', () => {
  test('TC-ONB-01: Sesión con flag activo es forzada a /onboarding', async ({ page }) => {
    // 1. Login real del admin (sesión válida sin flag)
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.locator('#email').fill('admin@brevemente.org');
    await page.locator('#password').fill('demo123');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/admin/dashboard', { timeout: 15000 });

    // 2. Activar el flag en la sesión local (simula contraseña temporal pendiente)
    await page.evaluate(() => {
      const raw = localStorage.getItem('brevemente_session');
      if (raw) {
        const session = JSON.parse(raw);
        session.debeCambiarPassword = true;
        localStorage.setItem('brevemente_session', JSON.stringify(session));
      }
    });

    // 3. Cualquier ruta protegida debe redirigir a /onboarding
    await page.goto('/admin/usuarios');
    await page.waitForURL('**/onboarding', { timeout: 10000 });

    // 4. La pantalla de onboarding se renderiza
    await expect(page.getByText('Establece tu nueva contraseña')).toBeVisible();
    await expect(page.locator('#passwordActual')).toBeVisible();
    await expect(page.locator('#nuevaPassword')).toBeVisible();
    await expect(page.locator('#confirmarPassword')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Guardar contraseña' })).toBeVisible();
  });

  test('TC-ONB-02: Validación de cliente del formulario de onboarding', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.locator('#email').fill('admin@brevemente.org');
    await page.locator('#password').fill('demo123');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/admin/dashboard', { timeout: 15000 });

    await page.evaluate(() => {
      const raw = localStorage.getItem('brevemente_session');
      if (raw) {
        const session = JSON.parse(raw);
        session.debeCambiarPassword = true;
        localStorage.setItem('brevemente_session', JSON.stringify(session));
      }
    });

    await page.goto('/onboarding');
    await page.waitForURL('**/onboarding');

    // Contraseña nueva corta → error de longitud
    await page.locator('#passwordActual').fill('tempclave123');
    await page.locator('#nuevaPassword').fill('corta');
    await page.locator('#confirmarPassword').fill('corta');
    await page.getByRole('button', { name: 'Guardar contraseña' }).click();
    await expect(page.getByText('La nueva contraseña debe tener al menos 8 caracteres.')).toBeVisible();

    // Confirmación distinta → error de coincidencia
    await page.locator('#nuevaPassword').fill('NuevaClave123!');
    await page.locator('#confirmarPassword').fill('OtraClave456!');
    await page.getByRole('button', { name: 'Guardar contraseña' }).click();
    await expect(page.getByText('Las contraseñas no coinciden.')).toBeVisible();

    // Nueva igual a la actual → error
    await page.locator('#nuevaPassword').fill('tempclave123');
    await page.locator('#confirmarPassword').fill('tempclave123');
    await page.getByRole('button', { name: 'Guardar contraseña' }).click();
    await expect(page.getByText('La nueva contraseña no puede ser igual a la actual.')).toBeVisible();
  });
});
