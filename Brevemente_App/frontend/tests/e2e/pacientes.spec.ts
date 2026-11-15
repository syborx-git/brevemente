import { test, expect } from '@playwright/test';

test.describe('Módulo de Pacientes — Validación E2E de Oráculo y Regresión Visual', () => {
  const consoleErrors: string[] = [];
  const http500Errors: string[] = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors.length = 0;
    http500Errors.length = 0;

    // 1. Monitoreo de errores de consola y excepciones de JavaScript
    page.on('console', msg => {
      if (msg.type() === 'error') {
        if (!msg.text().includes('favicon.ico')) {
          consoleErrors.push(`[Console Error] ${msg.text()}`);
        }
      }
    });

    page.on('pageerror', exception => {
      consoleErrors.push(`[Uncaught JS Exception] ${exception.message}`);
    });

    // 2. Monitoreo de respuestas HTTP 500 o fallos de red
    page.on('response', response => {
      if (response.status() >= 500) {
        http500Errors.push(`[HTTP ${response.status()}] ${response.url()}`);
      }
    });

    // 3. Autenticación previa: el módulo de pacientes requiere sesión y token JWT
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.locator('#email').fill('sofia.ramirez@brevemente.org');
    await page.locator('#password').fill('demo123');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/dashboard', { timeout: 15000 });
  });

  test.afterEach(() => {
    // Falla inmediatamente si se detectaron errores 500 o excepciones JS
    expect(consoleErrors, `Errores detectados en la consola del navegador: ${consoleErrors.join(' | ')}`).toHaveLength(0);
    expect(http500Errors, `Errores de servidor HTTP 500 detectados: ${http500Errors.join(' | ')}`).toHaveLength(0);
  });

  test('TC-PAC-01: Scoping por terapeuta — Sofía solo ve sus 2 pacientes', async ({ page }) => {
    await page.goto('/pacientes');
    await page.waitForLoadState('networkidle');

    const title = page.locator('main h1');
    await expect(title).toHaveText('Directorio Clínico de Pacientes');

    // La terapeuta ter-001 (Sofía) solo ve pac-001 y pac-002
    const rows = page.locator('table tbody tr');
    await expect(rows).toHaveCount(2);

    const table = page.locator('table');
    await expect(table.getByText('Mateo Herrera Santos')).toBeVisible();
    await expect(table.getByText('Valeria Gómez Fuentes')).toBeVisible();

    // pac-003 (Emiliano) y pac-004 (Roberto) son de ter-002 → fuera del scope
    await expect(table.getByText('Emiliano Díaz Corona')).not.toBeVisible();
    await expect(table.getByText('Roberto Valdés Garza')).not.toBeVisible();

    await expect(table.getByText('(Menor)')).toBeVisible();
    await expect(table.getByText('Representado por edad')).toBeVisible();
  });

  test('TC-PAC-02: Búsqueda reactiva por Nombre y CURP dentro del scope', async ({ page }) => {
    await page.goto('/pacientes');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[placeholder*="Buscar por nombre"]');
    const table = page.locator('table');

    await searchInput.fill('Mateo');
    await expect(page.locator('table tbody tr')).toHaveCount(1);
    await expect(table.getByText('Mateo Herrera Santos')).toBeVisible();

    await searchInput.fill('GOFV950412MDFRRR03');
    await expect(page.locator('table tbody tr')).toHaveCount(1);
    await expect(table.getByText('Valeria Gómez Fuentes')).toBeVisible();

    // CURP de un paciente fuera del scope → sin resultados
    await searchInput.fill('VARR791201');
    await expect(page.getByText('No se encontraron pacientes con los criterios de búsqueda.')).toBeVisible();

    await searchInput.fill('');
    await expect(page.locator('table tbody tr')).toHaveCount(2);
  });

  test('TC-PAC-03: Filtrado dinámico por Estado y Consentimiento dentro del scope', async ({ page }) => {
    await page.goto('/pacientes');
    await page.waitForLoadState('networkidle');

    const statusSelect = page.locator('select').first();
    const consentSelect = page.locator('select').nth(1);
    const table = page.locator('table');

    // Los 2 pacientes de Sofía están activos
    await statusSelect.selectOption('activo');
    await expect(page.locator('table tbody tr')).toHaveCount(2);

    // Estado sin pacientes en su scope → sin resultados
    await statusSelect.selectOption('completado');
    await expect(page.getByText('No se encontraron pacientes con los criterios de búsqueda.')).toBeVisible();

    await statusSelect.selectOption('todos');
    await expect(page.locator('table tbody tr')).toHaveCount(2);

    // Consentimiento representado por edad → solo Mateo
    await consentSelect.selectOption('REPRESENTADO_POR_EDAD');
    await expect(page.locator('table tbody tr')).toHaveCount(1);
    await expect(table.getByText('Mateo Herrera Santos')).toBeVisible();
  });

  test('TC-PAC-04: Apertura y cálculo de minoría de edad en Modal de Registro', async ({ page }) => {
    await page.goto('/pacientes');
    await page.waitForLoadState('networkidle');

    // Abrir modal de nuevo paciente
    await page.locator('button:has-text("Registrar Nuevo Paciente")').click();
    await expect(page.locator('h2:has-text("Registrar Paciente")')).toBeVisible();

    // Ingresar fecha de nacimiento de menor (14 años)
    const fechaInput = page.locator('input[type="date"]');
    await fechaInput.fill('2012-04-10');
    await fechaInput.dispatchEvent('change');

    // Debe mostrar la advertencia y sección de persona de apoyo
    await expect(page.locator('text=Requiere designación de persona de apoyo')).toBeVisible();
    await expect(page.locator('text=Persona de Apoyo Designada (Obligatorio en menores)')).toBeVisible();

    // Cerrar modal
    await page.locator('button:has-text("Cancelar")').click();
    await expect(page.locator('h2:has-text("Registrar Paciente")')).not.toBeVisible();
  });

  test('TC-PAC-05: Regresión Visual del Directorio Clínico con Oráculo Real', async ({ page }) => {
    await page.goto('/pacientes');
    await page.waitForLoadState('networkidle');

    // Asegurar renderizado completo de las fuentes y elementos
    await page.waitForTimeout(500);

    // Captura y comparación de regresión visual
    await expect(page).toHaveScreenshot('directorio-clinico-pacientes.png', {
      maxDiffPixelRatio: 0.01,
      fullPage: true
    });
  });

  test('TC-PAC-06: CURP obligatoria bloquea el alta de paciente', async ({ page }) => {
    await page.goto('/pacientes');
    await page.waitForLoadState('networkidle');

    // Abrir modal de nuevo paciente
    await page.locator('button:has-text("Registrar Nuevo Paciente")').click();
    await expect(page.locator('h2:has-text("Registrar Paciente")')).toBeVisible();

    // Llenar nombre y fecha, pero dejar CURP vacía
    await page.locator('input[placeholder*="Santiago Morales Vega"]').fill('Paciente Sin CURP');
    const fechaInput = page.locator('input[type="date"]');
    await fechaInput.fill('2000-01-01');
    await fechaInput.dispatchEvent('change');

    // Intentar guardar sin CURP → bloqueo con mensaje, el modal NO se cierra
    await page.getByRole('button', { name: 'Guardar Paciente' }).click();
    await expect(page.getByText(/CURP es obligatoria/)).toBeVisible();
    await expect(page.locator('h2:has-text("Registrar Paciente")')).toBeVisible();
  });
});
