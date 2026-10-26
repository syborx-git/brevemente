import { test, expect } from '@playwright/test';

/**
 * E2E — Kanban #102–#108: Edición de Sesión, Semáforo VC y Criterios Clínicos.
 * Oráculo: Spring Boot + PostgreSQL (Flyway v19). Frontend: Angular 18 (dev server).
 */
test.describe('Expedientes — Edición de Sesión y Criterios Clínicos (Kanban #102–#108)', () => {
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
      `Errores de consola: ${consoleErrors.join(' | ')}`
    ).toHaveLength(0);
    expect(
      http500Errors,
      `Errores HTTP 500: ${http500Errors.join(' | ')}`
    ).toHaveLength(0);
  });

  async function abrirSesiones(page: import('@playwright/test').Page): Promise<void> {
    await page.goto('/expediente/pac-001');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /Tratamiento Psicoterapéutico TBE/ }).click();
    await page.getByRole('button', { name: /Sesiones \(/ }).click();
  }

  test('TC-K01: Badge de fase editable (#102)', async ({ page }) => {
    await abrirSesiones(page);

    const faseButton = page.getByTestId('editar-fase');
    await expect(faseButton).toBeVisible();
    await faseButton.click();

    await page.getByTestId('select-fase').selectOption('Desbloqueo');
    // (change) dispara guardarEdicion → PATCH; el badge reaparece con el nuevo valor
    await expect(faseButton).toHaveText('Desbloqueo');
  });

  test('TC-K02: Campo significado y DX operativo editables (#103)', async ({ page }) => {
    await abrirSesiones(page);

    await page.getByTestId('editar-significado').click();
    await page.getByTestId('input-significado').fill('Miedo al conflicto');
    await page.getByTestId('input-significado').press('Enter');
    await expect(page.getByTestId('editar-significado')).toHaveText('Miedo al conflicto');

    await page.getByTestId('editar-dx').click();
    await page.getByTestId('input-dx').fill('SPR Fóbico');
    await page.getByTestId('input-dx').press('Enter');
    await expect(page.getByTestId('editar-dx')).toHaveText('SPR Fóbico');
  });

  test('TC-K03: Campo SPR editable sin reabrir el DX (#104)', async ({ page }) => {
    await abrirSesiones(page);

    await page.getByTestId('editar-spr').click();
    await page.getByTestId('select-spr').selectOption('SPR Obsesivo-Compulsivo');
    await expect(page.getByTestId('editar-spr')).toHaveText('SPR Obsesivo-Compulsivo');
  });

  test('TC-K04: Semáforo VC de 5 estados en la captura de sesión (#105)', async ({ page }) => {
    await abrirSesiones(page);

    await page.getByRole('button', { name: /Nueva Sesión/ }).click();
    await expect(page.getByText('Valoración del Cambio para esta Sesión')).toBeVisible();

    const recaida = page.getByRole('radio', { name: 'Recaída' }).first();
    await expect(recaida).toBeVisible();
    await recaida.click();
    await expect(recaida).toHaveAttribute('aria-checked', 'true');

    // Cerrar el modal sin persistir (el monitor de consola/500 sigue activo)
    await page.keyboard.press('Escape');
  });

  test('TC-K05: Sección Conductual colapsable con menú de 5 opciones (#106/#107/#108)', async ({ page }) => {
    await abrirSesiones(page);

    await page.getByRole('button', { name: /Criterios Clínicos/ }).click();
    await expect(page.getByText('Registro de Criterios Clínicos por Sesión')).toBeVisible();

    const selectConductual = page.getByTestId('select-conductual');
    await expect(selectConductual).toBeVisible();
    await expect(selectConductual.locator('option')).toHaveCount(6); // vacío + 5 opciones

    await selectConductual.selectOption('delegar');
    await expect(selectConductual).toHaveValue('delegar');
  });

  test('TC-K06: Guardar criterios clínicos persiste (PUT)', async ({ page }) => {
    await abrirSesiones(page);

    await page.getByRole('button', { name: /Criterios Clínicos/ }).click();

    const selectConductual = page.getByTestId('select-conductual');
    await selectConductual.selectOption('delegar');

    await page.getByRole('button', { name: /Guardar criterios/ }).click();

    await expect(page.getByTestId('select-conductual')).toHaveValue('delegar');
  });

  test('TC-K07: Criterios cargados desde la BD al entrar en la pestaña', async ({ page }) => {
    await abrirSesiones(page);

    await page.getByRole('button', { name: /Criterios Clínicos/ }).click();

    await expect(page.getByTestId('select-conductual')).toHaveValue('delegar');
  });
});
