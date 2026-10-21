import { test, expect } from '@playwright/test';

test.describe('Módulo de Log In — Validación E2E de Oráculo y Regresión Visual', () => {
  const consoleErrors: string[] = [];
  const http500Errors: string[] = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors.length = 0;
    http500Errors.length = 0;

    // 1. Monitoreo de errores de consola y excepciones de JavaScript.
    //    Se ignoran los "Failed to load resource" con status 4xx (p. ej. el 401
    //    esperado en el login inválido); los 5xx se capturan aparte vía
    //    page.on('response') en http500Errors.
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

  test('TC-LOG-01: Redirección a /login sin sesión activa (authGuard)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // El guard debe redirigir a /login (fuera del shell)
    await page.waitForURL('**/login');

    // Formulario de acceso visible
    await expect(page.locator('h2', { hasText: 'Iniciar sesión' })).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('button[type="submit"]', { hasText: 'Ingresar' })).toBeVisible();
  });

  test('TC-LOG-02: Login exitoso contra el oráculo real (Spring Boot + PostgreSQL)', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Credenciales reales sembradas por Flyway V4 (usuarios.usr-001)
    await page.locator('#email').fill('sofia.ramirez@brevemente.org');
    await page.locator('#password').fill('demo123');
    await page.locator('button[type="submit"]').click();

    // Navegación a la aplicación autenticada
    await page.waitForURL('**/dashboard', { timeout: 15000 });

    // La sesión se persiste (token JWT del backend)
    const session = await page.evaluate(() => localStorage.getItem('brevemente_session'));
    expect(session).not.toBeNull();
    const parsed = JSON.parse(session as string);
    expect(parsed.token).toBeTruthy();
    expect(parsed.user.email).toBe('sofia.ramirez@brevemente.org');
    expect(parsed.user.roles).toContain('therapist');

    // El formulario de login desapareció (shell autenticado visible)
    await expect(page.locator('#email')).not.toBeVisible();
    await expect(page.locator('button:has-text("Cerrar sesión")')).toBeVisible();

    // El header muestra la identidad real del usuario (no el nombre simulado por rol)
    await expect(page.locator('header').getByText('Dra. Sofía Ramírez Lozano')).toBeVisible();
  });

  test('TC-LOG-03: Login inválido muestra error y no navega', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await page.locator('#email').fill('sofia.ramirez@brevemente.org');
    await page.locator('#password').fill('clave-incorrecta');
    await page.locator('button[type="submit"]').click();

    // Mensaje de credenciales inválidas (401 del backend)
    await expect(page.locator('text=Credenciales inválidas')).toBeVisible();

    // Permanece en /login
    await expect(page).toHaveURL(/\/login/);
  });

  test('TC-LOG-04: Cierre de sesión retorna a /login', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await page.locator('#email').fill('sofia.ramirez@brevemente.org');
    await page.locator('#password').fill('demo123');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/dashboard', { timeout: 15000 });

    // Cerrar sesión desde el header
    await page.locator('button:has-text("Cerrar sesión")').click();
    await page.waitForURL('**/login');

    // La sesión fue descartada del cliente
    const session = await page.evaluate(() => localStorage.getItem('brevemente_session'));
    expect(session).toBeNull();

    await expect(page.locator('h2', { hasText: 'Iniciar sesión' })).toBeVisible();
  });

  test('TC-LOG-05: Regresión Visual de la pantalla de Log In', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Asegurar renderizado completo de fuentes y elementos
    await page.waitForTimeout(500);

    // Captura y comparación de regresión visual (baseline vs actual)
    await expect(page).toHaveScreenshot('login-pantalla.png', {
      maxDiffPixelRatio: 0.01,
      fullPage: true
    });
  });
});
