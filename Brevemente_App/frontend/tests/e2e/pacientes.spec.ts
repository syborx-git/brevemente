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
  });

  test.afterEach(() => {
    // Falla inmediatamente si se detectaron errores 500 o excepciones JS
    expect(consoleErrors, `Errores detectados en la consola del navegador: ${consoleErrors.join(' | ')}`).toHaveLength(0);
    expect(http500Errors, `Errores de servidor HTTP 500 detectados: ${http500Errors.join(' | ')}`).toHaveLength(0);
  });

  test('TC-PAC-01: Carga y oráculo de datos reales desde Spring Boot/PostgreSQL', async ({ page }) => {
    await page.goto('/pacientes');
    await page.waitForLoadState('networkidle');

    // Validar título clínico principal en la vista
    const title = page.locator('main h1');
    await expect(title).toHaveText('Directorio Clínico de Pacientes');

    // Validar que la tabla contiene exactamente los 4 registros servidos por la API REST
    const rows = page.locator('table tbody tr');
    await expect(rows).toHaveCount(4);

    // Validar nombres específicos del oráculo en PostgreSQL
    const table = page.locator('table');
    await expect(table.getByText('Mateo Herrera Santos')).toBeVisible();
    await expect(table.getByText('Valeria Gómez Fuentes')).toBeVisible();
    await expect(table.getByText('Emiliano Díaz Corona')).toBeVisible();
    await expect(table.getByText('Roberto Valdés Garza')).toBeVisible();

    // Validar visualización de minoría de edad para Mateo (17 años)
    await expect(table.getByText('(Menor)')).toBeVisible();
    await expect(table.getByText('REPRESENTADO_POR_EDAD')).toBeVisible();
  });

  test('TC-PAC-02: Búsqueda reactiva por Nombre y CURP', async ({ page }) => {
    await page.goto('/pacientes');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[placeholder*="Buscar por nombre"]');
    const table = page.locator('table');
    
    // Búsqueda por nombre
    await searchInput.fill('Mateo');
    await expect(page.locator('table tbody tr')).toHaveCount(1);
    await expect(table.getByText('Mateo Herrera Santos')).toBeVisible();

    // Búsqueda por CURP
    await searchInput.fill('VARR791201');
    await expect(page.locator('table tbody tr')).toHaveCount(1);
    await expect(table.getByText('VARR791201HDFZZ01')).toBeVisible();

    // Limpieza de búsqueda
    await searchInput.fill('');
    await expect(page.locator('table tbody tr')).toHaveCount(4);
  });

  test('TC-PAC-03: Filtrado dinámico por Estado Clínico y Consentimiento', async ({ page }) => {
    await page.goto('/pacientes');
    await page.waitForLoadState('networkidle');

    const statusSelect = page.locator('select').first();
    const consentSelect = page.locator('select').nth(1);
    const table = page.locator('table');

    // Filtrar por completados
    await statusSelect.selectOption('completado');
    await expect(page.locator('table tbody tr')).toHaveCount(1);
    await expect(table.getByText('completado', { exact: true })).toBeVisible();

    // Filtrar por pendientes
    await statusSelect.selectOption('pendiente');
    await expect(page.locator('table tbody tr')).toHaveCount(1);
    await expect(table.getByText('pendiente', { exact: true })).toBeVisible();

    // Restaurar a todos
    await statusSelect.selectOption('todos');
    await expect(page.locator('table tbody tr')).toHaveCount(4);

    // Filtrar por Representados por edad
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
});
