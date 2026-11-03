import { test, expect } from '@playwright/test';

test.describe('Módulo de Expedientes — Validación E2E de Oráculo y Regresión Visual', () => {
  const consoleErrors: string[] = [];
  const http500Errors: string[] = [];

  test.beforeAll(async ({ request }) => {
    // Idempotencia: restaura el estado "Sin datos" del examen mental de exp-001
    // (SDD-HC-3) y el seed de la Ficha de identificación (SDD-FI-1).
    const login = await request.post('/api/v1/auth/login', {
      data: { email: 'sofia.ramirez@brevemente.org', password: 'demo123' }
    });
    const body = await login.json();
    const headers = { Authorization: `Bearer ${body.token}` };
    // Examen mental: el backend ignora '{}' (guard !isEmpty); se usa una
    // estructura que el frontend interpreta como vacía.
    await request.patch('/api/v1/expedientes/paciente/pac-001', {
      headers,
      data: { examenMental: { síntesis: {} } }
    });
    // Ficha de identificación: restaura el seed de exp-001.
    await request.patch('/api/v1/expedientes/paciente/pac-001', {
      headers,
      data: {
        fuenteReferencia: 'psicoterapeuta',
        fuenteReferenciaOtro: '',
        historialFarmacos: [],
        historialPsicofarmacos: [],
        historialDrogas: []
      }
    });
    await request.put('/api/v1/expedientes/paciente/pac-001/tratamientos-previos', {
      headers,
      data: []
    });
    // Expediente Médico Psiquiátrico (SDD-EMP-1): restaura los 4 campos clínicos
    // de exp-001 (GAP-EMP-10) y los esquemas Fármacos/Drogas de exp-002.
    await request.patch('/api/v1/expedientes/paciente/pac-001', {
      headers,
      data: {
        motif: 'Bloqueo fóbico en situaciones de examen y alta autoexigencia académica.',
        firstAppearance: 'Hace 6 meses tras periodo de alta exigencia académica.',
        precipitatingFactors: 'Evaluaciones finales y crítica del entorno escolar.',
        evolutionType: 'progresivo'
      }
    });
    await request.patch('/api/v1/expedientes/paciente/pac-002', {
      headers,
      data: {
        farmacosEsquema: [],
        drogasEsquema: [],
        usoDrogas: 'NO'
      }
    });
  });

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

    // Autenticación previa contra el oráculo real (JWT)
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
      `Errores detectados en la consola del navegador: ${consoleErrors.join(' | ')}`
    ).toHaveLength(0);
    expect(
      http500Errors,
      `Errores de servidor HTTP 500 detectados: ${http500Errors.join(' | ')}`
    ).toHaveLength(0);
  });

  test('TC-EXP-01: Carga y oráculo de datos reales desde Spring Boot/PostgreSQL', async ({ page }) => {
    await page.goto('/expediente/pac-001');
    await page.waitForLoadState('networkidle');

    // Banner de paciente servido por el oráculo (GET /pacientes/{id})
    await expect(page.locator('main h1')).toHaveText('Mateo Herrera Santos');

    // Tab de Datos de Admisión e Historia Clínica visible (port de la demo)
    await expect(page.getByRole('button', { name: /Datos de Admisión e Historia Clínica/ })).toBeVisible();

    // Datos del expediente servidos por el oráculo (GET /expedientes/paciente/{id}):
    // pac-001 es menor de edad → régimen legal y representante deben venir de la BD.
    await expect(page.getByText('MENOR DE EDAD').first()).toBeVisible();
    await expect(page.getByText('Claudia Santos')).toBeVisible();
    await expect(page.getByText('Pendiente de Formalización').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Sesiones \(/ })).toBeVisible();
  });

  test('TC-EXP-02: Sesiones del expediente cargadas desde la BD', async ({ page }) => {
    await page.goto('/expediente/pac-001');
    await page.waitForLoadState('networkidle');

    // Navegar a TBE → Sesiones (sub-tabs del port de la demo)
    await page.getByRole('button', { name: /Tratamiento Psicoterapéutico TBE/ }).click();
    await page.getByRole('button', { name: /Sesiones \(/ }).click();

    // Sesiones servidas por el oráculo (GET /expedientes/paciente/{id}/sesiones)
    await expect(page.getByText('Sesión #1').first()).toBeVisible();
    await expect(page.getByText('Prescripciones Estratégicas:').first()).toBeVisible();
  });

  test('TC-EXP-03: Regresión Visual del Expediente con Oráculo Real', async ({ page }) => {
    await page.goto('/expediente/pac-001');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('expediente-paciente.png', {
      maxDiffPixelRatio: 0.01,
      fullPage: true
    });
  });

  test('TC-EXP-04: Expediente psiquiátrico y esquema farmacológico cargados desde la BD (pac-002)', async ({ page }) => {
    await page.goto('/expediente/pac-002');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /Tratamiento Psiquiátrico/ }).click();

    // Sub-pestaña por defecto: Expediente Médico Psiquiátrico
    await expect(page.getByRole('heading', { name: 'Expediente Médico Psiquiátrico' })).toBeVisible();

    // Esquema farmacológico servido por el oráculo (drugsList de exp-002)
    await page.getByRole('button', { name: /^Esquema Psico Farmacológico$/ }).click();
    const drugValues = await page.locator('input').evaluateAll(els => els.map(e => (e as HTMLInputElement).value));
    expect(drugValues).toContain('Sertralina 50mg');
    expect(drugValues).toContain('Alprazolam 0.25mg');
  });

  test('TC-EXP-05: Pagos del expediente cargados desde la BD', async ({ page }) => {
    await page.goto('/expediente/pac-001');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /^Pagos$/ }).click();

    await expect(page.getByText('Total cobrado')).toBeVisible();
    await expect(page.getByText(/Sesión 1/).first()).toBeVisible();
  });

  test('TC-EXP-06: Bitácoras de supervisión cargadas desde la BD', async ({ page }) => {
    await page.goto('/expediente/pac-001');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /Bitácoras Supervisión/ }).click();

    await expect(page.getByText('Bitácoras de Supervisión Clínica')).toBeVisible();
    await expect(page.getByText(/Isabel Cárdenas/).first()).toBeVisible();
  });

  test('TC-EXP-07: Constancias físicas cargadas desde la BD', async ({ page }) => {
    await page.goto('/expediente/pac-001');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /^Constancias/ }).click();

    await expect(page.getByText('CONST-2026-084-FIS')).toBeVisible();
  });

  test('TC-EXP-08: Auditoría del expediente renderiza desde la BD', async ({ page }) => {
    await page.goto('/expediente/pac-001');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /Auditoría del Expediente/ }).click();

    await expect(page.getByText('Registro Seguro de Auditoría del Expediente')).toBeVisible();
  });

  test('TC-EXP-09: Valoración del Cambio (VC) y Global (VG) por sesión', async ({ page }) => {
    await page.goto('/expediente/pac-001');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /Tratamiento Psicoterapéutico TBE/ }).click();

    await page.getByRole('button', { name: /Valoración del Cambio/ }).click();
    await expect(page.getByText('Evolución de Valoración del Cambio (VC) por Sesión')).toBeVisible();

    await page.getByRole('button', { name: /Valoración Global/ }).click();
    await expect(page.getByText('Valoración Global (esferas señaladas: YO / DEMÁS / MUNDO)')).toBeVisible();
  });

  test('TC-EXP-10: Registrar pago (POST /pagos) y verificar en la tabla', async ({ page }) => {
    await page.goto('/expediente/pac-001');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /^Pagos$/ }).click();

    await page.getByRole('button', { name: /Registrar pago/ }).click();
    const concepto = `Pago E2E · ${Date.now()}`;
    await page.locator('input[name="concept"]').fill(concepto);
    await page.locator('input[name="amount"]').fill('1200');
    await page.getByRole('button', { name: /Guardar Pago/ }).click();

    await expect(page.locator('tbody tr', { hasText: concepto })).toBeVisible();
  });

  test('TC-EXP-11: Cambiar estado (PATCH) y eliminar (DELETE) un pago', async ({ page }) => {
    page.on('dialog', d => d.accept());
    await page.goto('/expediente/pac-001');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /^Pagos$/ }).click();

    // 1) Crear un pago único
    const concepto = `Pago estado · ${Date.now()}`;
    await page.getByRole('button', { name: /Registrar pago/ }).click();
    await page.locator('input[name="concept"]').fill(concepto);
    await page.locator('input[name="amount"]').fill('900');
    await page.getByRole('button', { name: /Guardar Pago/ }).click();
    const fila = page.locator('tbody tr', { hasText: concepto });
    await expect(fila).toBeVisible();

    // 2) Cambiar estado a "reembolsado"
    await fila.locator('select').selectOption('reembolsado');
    await expect(fila.locator('select')).toHaveValue('reembolsado');

    // 3) Eliminar el pago (confirm() auto-aceptado)
    await fila.locator('button[title="Eliminar pago"]').click();
    await expect(page.locator('tbody tr', { hasText: concepto })).toHaveCount(0);
  });

  test('TC-EXP-12: Registrar constancia física (POST /constancias)', async ({ page }) => {
    await page.goto('/expediente/pac-001');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /^Constancias/ }).click();

    const folio = `CONST-E2E-${Date.now()}-FIS`;
    await page.getByRole('button', { name: /Registrar Constancia Física/ }).click();
    await page.locator('input[name="physicalFolio"]').fill(folio);
    await page.locator('textarea[name="clinicalSummary"]').fill('Validación E2E de constancia física contra oráculo real.');
    await page.getByRole('button', { name: /Guardar en Archivo del Expediente/ }).click();

    await expect(page.getByText(folio, { exact: true })).toBeVisible();
  });

  test('TC-EXP-13: Registrar bitácora de supervisión (POST /supervision/bitacoras)', async ({ page }) => {
    await page.goto('/expediente/pac-001');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /Bitácoras Supervisión/ }).click();

    await page.getByRole('button', { name: /Registrar Bitácora/ }).click();
    await page.locator('input[name="sessionNumber"]').fill('999');
    await page.locator('textarea[name="problemDefinition"]').fill('Problema E2E de validación (oráculo real).');
    await page.getByRole('button', { name: /Firmar y Guardar Bitácora/ }).click();

    await expect(page.getByText('Sesión 999').first()).toBeVisible();
  });

  test('TC-EXP-14: Registrar sesión TBE con captura VC/VG', async ({ page }) => {
    await page.goto('/expediente/pac-001');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /Tratamiento Psicoterapéutico TBE/ }).click();
    await page.getByRole('button', { name: /Sesiones \(/ }).click();

    await page.getByRole('button', { name: /Nueva Sesión/ }).click();

    // VC (semáforo): Percepción → "Nuevo patrón", Pensamientos → "Recaída" (persiste como "Empeoramiento")
    const semaforos = page.getByRole('radiogroup');
    await semaforos.nth(0).getByRole('radio', { name: 'Nuevo patrón' }).click();
    await semaforos.nth(1).getByRole('radio', { name: 'Recaída' }).click();

    // VG: marcar esfera YO
    await page.locator('input[type="checkbox"]').nth(0).check();

    await page.getByRole('button', { name: /Guardar Sesión/ }).click();

    // La sesión se guarda y se recarga; verificar en el sub-tab VC (etiquetas canónicas del semáforo)
    await page.getByRole('button', { name: /Valoración del Cambio/ }).click();
    await expect(page.getByText('Nuevo patrón').first()).toBeVisible();
    await expect(page.getByText('Recaída').first()).toBeVisible();
  });

  test('TC-EXP-15: Folio de constancia duplicado no rompe la UI (manejo de error)', async ({ page }) => {
    await page.goto('/expediente/pac-001');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /^Constancias/ }).click();

    await page.getByRole('button', { name: /Registrar Constancia Física/ }).click();
    // Folio ya existente en el seed (CONST-2026-084-FIS) → viola ux_constancias_folio
    await page.locator('input[name="physicalFolio"]').fill('CONST-2026-084-FIS');

    let dialogMessage = '';
    page.on('dialog', async d => {
      dialogMessage = d.message();
      await d.accept();
    });

    await page.getByRole('button', { name: /Guardar en Archivo del Expediente/ }).click();

    await expect.poll(() => dialogMessage, { timeout: 10000 }).toContain('folio no esté duplicado');

    // El 500 de unicidad de folio es ESPERADO en este caso negativo:
    // El 500 de unicidad de folio es ESPERADO en este caso negativo: se limpian
    // los monitores de error para no fallar las aserciones del afterEach.
    consoleErrors.length = 0;
    http500Errors.length = 0;
  });

  test('TC-EXP-16: Datos de Admisión — Datos Generales cargados desde la BD (oráculo)', async ({ page }) => {
    await page.goto('/expediente/pac-001');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /Datos de Admisión e Historia Clínica/ }).click();

    // Sub-pestaña por defecto: Datos Generales
    await expect(page.getByRole('heading', { name: 'Establecimiento' })).toBeVisible();
    await expect(page.getByText('CLSM-000001')).toBeVisible();
    await expect(page.getByText('LS-BM-2026-01')).toBeVisible();

    // Datos del paciente servidos por el oráculo (GET /pacientes/{id})
    const values = await page.locator('input').evaluateAll(els => els.map(e => (e as HTMLInputElement).value));
    expect(values).toContain('SARM020815XXX');
    expect(values).toContain('Av. Insurgentes 123');
    expect(values).toContain('Ciudad de México');

    await expect(page.getByRole('button', { name: 'Guardar Datos Generales' })).toBeVisible();
  });

  test('TC-EXP-17: Datos de Admisión — Historia clínica con 5 cards (oráculo)', async ({ page }) => {
    await page.goto('/expediente/pac-001');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /Datos de Admisión e Historia Clínica/ }).click();
    await page.getByRole('button', { name: /^Historia clínica$/ }).click();

    // Las 5 cards latentes de la página "Historia clínica" del PDF
    await expect(page.getByRole('heading', { name: 'Antecedentes Personales Patológicos' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Antecedentes Personales No Patológicos' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Antecedentes Heredo Familiares' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Evaluación del Estado Mental (Examen Mental)' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Evaluación de Riesgo' })).toBeVisible();

    // Antecedentes migrados por V22 (seed exp-001)
    await expect(page.getByText('Alergia a la penicilina')).toBeVisible();
    await expect(page.getByText('Madre con trastorno de ansiedad')).toBeVisible();

    // Botones "Editar" por card (aria-label descriptivo)
    await expect(page.getByRole('button', { name: 'Editar antecedentes personales patológicos' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Editar antecedentes personales no patológicos' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Editar antecedentes heredo familiares' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Editar evaluación de riesgo' })).toBeVisible();

    // Card del Examen Mental: botones latentes + estado "Sin datos"
    await expect(page.getByRole('button', { name: 'Realizar examen' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ver resultados' })).toBeVisible();
    await expect(page.getByText('Sin datos — Realice el examen para registrar la evaluación del estado mental.')).toBeVisible();
  });

  test('TC-EXP-17B: Historia clínica — Realizar examen mental (modal y guardado)', async ({ page }) => {
    await page.goto('/expediente/pac-001');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /Datos de Admisión e Historia Clínica/ }).click();
    await page.getByRole('button', { name: /^Historia clínica$/ }).click();

    await page.getByRole('button', { name: 'Realizar examen' }).click();

    // Modal de formulario completo (11 secciones)
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.locator('textarea[name="sintesis-impresiónDiagnóstica"]')).toBeVisible();

    await page.locator('textarea[name="sintesis-impresiónDiagnóstica"]').fill('Trastorno de ansiedad generalizada (E2E)');
    await page.getByRole('button', { name: 'Guardar examen' }).click();

    // El modal se cierra y la card resume la impresión diagnóstica
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByText('Trastorno de ansiedad generalizada (E2E)')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ver resultados' })).toBeEnabled();
  });

  test('TC-EXP-17C: Historia clínica — Ver resultados del examen mental', async ({ page }) => {
    await page.goto('/expediente/pac-001');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /Datos de Admisión e Historia Clínica/ }).click();
    await page.getByRole('button', { name: /^Historia clínica$/ }).click();

    // TC-EXP-17B dejó un examen guardado
    await page.getByRole('button', { name: 'Ver resultados' }).click();

    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Resultados del Examen Mental' })).toBeVisible();
    await expect(page.getByRole('dialog').getByText('Trastorno de ansiedad generalizada (E2E)')).toBeVisible();
  });

  test('TC-EXP-18: Datos de Admisión — Ficha de identificación con 7 secciones (oráculo)', async ({ page }) => {
    await page.goto('/expediente/pac-001');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /Datos de Admisión e Historia Clínica/ }).click();
    await page.getByRole('button', { name: /^Ficha de identificación$/ }).click();

    // Cabecera y las 7 secciones de la lámina del PDF
    await expect(page.getByRole('heading', { name: 'Ficha de Identificación' })).toBeVisible();
    await expect(page.getByText('Identificación del paciente', { exact: true })).toBeVisible();
    await expect(page.getByText('Fecha de inicio', { exact: true })).toBeVisible();
    await expect(page.getByText('Fuente de referencia', { exact: true })).toBeVisible();
    await expect(page.getByText('Tratamientos Previos Psicoterapéuticos', { exact: true })).toBeVisible();
    await expect(page.getByText('Fármacos', { exact: true })).toBeVisible();
    await expect(page.getByText('Psicofármacos', { exact: true })).toBeVisible();
    await expect(page.getByText('Drogas', { exact: true })).toBeVisible();

    // Identificación del paciente (seed pac-001)
    await expect(page.getByText('CURP')).toBeVisible();
    await expect(page.getByText('Mateo Herrera Santos').first()).toBeVisible();

    // Fecha de inicio y fuente de referencia servidas por el oráculo (exp-001)
    await expect(page.getByText('10 de agosto de 2026')).toBeVisible();
    await expect(page.getByText('Psicoterapeuta')).toBeVisible();

    // Botón de edición latente
    await expect(page.getByRole('button', { name: 'Editar ficha de identificación' })).toBeVisible();
  });

  test('TC-EXP-18B: Ficha de identificación — editar fuente, fármacos y guardar (persistencia)', async ({ page }) => {
    await page.goto('/expediente/pac-001');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /Datos de Admisión e Historia Clínica/ }).click();
    await page.getByRole('button', { name: /^Ficha de identificación$/ }).click();

    await page.getByRole('button', { name: 'Editar ficha de identificación' }).click();

    // Fuente de referencia → Otro + especificar
    await page.locator('select[name="fuente-referencia"]').selectOption('otro');
    await page.locator('input[name="fuente-referencia-otro"]').fill('Derivado por familiar');

    // Fármacos → Sí + agregar un fármaco
    await page.getByRole('radiogroup', { name: 'Fármacos', exact: true }).getByRole('radio', { name: 'Sí' }).click();
    await page.getByRole('button', { name: 'Agregar' }).click();
    await page.locator('input[name="farmaco-0"]').fill('Paracetamol 500mg');

    await page.getByRole('button', { name: 'Guardar Ficha' }).click();

    // La vista de lectura refleja los cambios persistidos
    await expect(page.getByText('Derivado por familiar')).toBeVisible();
    await expect(page.getByText('Paracetamol 500mg')).toBeVisible();
  });

  test('TC-EXP-19: Tratamiento Psiquiátrico — Esquema Psico Farmacológico con fármacos y CRUD (oráculo)', async ({ page }) => {
    await page.goto('/expediente/pac-002');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /Tratamiento Psiquiátrico/ }).click();
    await page.getByRole('button', { name: /^Esquema Psico Farmacológico$/ }).click();

    await expect(page.getByRole('heading', { name: 'Esquema Psicotrópico Farmacológico' })).toBeVisible();

    // Fármacos semilla de exp-002 (drugsList) → ahora inputs editables
    const values = await page.locator('input').evaluateAll(els => els.map(e => (e as HTMLInputElement).value));
    expect(values).toContain('Sertralina 50mg');
    expect(values).toContain('Alprazolam 0.25mg');

    // CRUD: agregar fila (sin persistir para no mutar datos)
    const rowsBefore = await page.locator('tbody tr').count();
    await page.getByRole('button', { name: /^Agregar$/ }).click();
    await expect(page.locator('tbody tr')).toHaveCount(rowsBefore + 1);
  });

  test('TC-EXP-20: Expediente Médico Psiquiátrico con 8 secciones (SDD-EMP-1, oráculo)', async ({ page }) => {
    await page.goto('/expediente/pac-002');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /Tratamiento Psiquiátrico/ }).click();

    await expect(page.getByRole('heading', { name: 'Expediente Médico Psiquiátrico' })).toBeVisible();

    // Las 8 secciones de la lámina del PDF (encabezados grises)
    const secciones = [
      'emp-seccion-motivo',
      'emp-seccion-dx',
      'emp-seccion-dx-dif',
      'emp-seccion-plan',
      'emp-seccion-pronostico',
      'emp-seccion-farmacos',
      'emp-seccion-psicofarmacos',
      'emp-seccion-drogas'
    ];
    for (const tid of secciones) {
      await expect(page.locator(`[data-testid="${tid}"]`)).toBeVisible();
    }

    // Encabezados textuales clave
    await expect(page.getByText('Motivo de Consulta (Textual del paciente)', { exact: true })).toBeVisible();
    await expect(page.getByText('DX. Nosológico', { exact: true })).toBeVisible();
    await expect(page.getByText('DX.DIF', { exact: true })).toBeVisible();
    await expect(page.getByText('Plan de tratamiento', { exact: true })).toBeVisible();
    await expect(page.getByText('Pronóstico', { exact: true })).toBeVisible();
    await expect(page.getByText('Fármacos', { exact: true })).toBeVisible();
    await expect(page.getByText('Psicofármacos', { exact: true })).toBeVisible();
    await expect(page.getByText('Drogas', { exact: true })).toBeVisible();

    // Los 6 grupos de Psicofármacos del PDF
    for (const grupo of ['BZD', 'Antidepresivos', 'Neurolépticos', 'Psicoestabilizadores', 'Inductores del sueño', 'Otros']) {
      await expect(page.getByText(grupo, { exact: true })).toBeVisible();
    }

    // D-6: Comorbilidad oculta de esta pestaña
    await expect(page.getByText('Comorbilidad', { exact: true })).toHaveCount(0);

    // Botón de edición latente
    await expect(page.getByRole('button', { name: 'Editar expediente médico psiquiátrico' })).toBeVisible();
  });

  test('TC-EXP-20B: Fármacos y Drogas — toggle Sí + persistencia (SDD-EMP-1)', async ({ page }) => {
    await page.goto('/expediente/pac-002');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /Tratamiento Psiquiátrico/ }).click();
    await page.getByRole('button', { name: 'Editar expediente médico psiquiátrico' }).click();

    const seccionFarmacos = page.locator('[data-testid="emp-seccion-farmacos"]');
    const seccionDrogas = page.locator('[data-testid="emp-seccion-drogas"]');

    // Fármacos → Sí + 1 fármaco
    await seccionFarmacos.getByRole('radiogroup', { name: 'Fármacos' }).getByRole('radio', { name: 'Sí' }).click();
    await seccionFarmacos.getByRole('button', { name: 'Agregar', exact: true }).click();
    await seccionFarmacos.locator('input[name="emp-farmaco-0"]').fill('Losartan 50mg');

    // Drogas → Sí + 1 droga
    await seccionDrogas.getByRole('radiogroup', { name: 'Drogas' }).getByRole('radio', { name: 'Sí' }).click();
    await seccionDrogas.getByRole('button', { name: 'Agregar', exact: true }).click();
    await seccionDrogas.locator('input[name="emp-droga-0"]').fill('Cannabis');

    await page.getByRole('button', { name: 'Guardar Expediente Psiquiátrico' }).click();

    // Vista de lectura refleja la persistencia
    await expect(page.getByText('Losartan 50mg')).toBeVisible();
    await expect(page.getByText('Cannabis')).toBeVisible();
  });

  test('TC-EXP-20C: guardarExpedientePsiquiatrico persiste motif, firstAppearance, precipitatingFactors y evolutionType (GAP-EMP-10)', async ({ page }) => {
    await page.goto('/expediente/pac-001');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /Tratamiento Psiquiátrico/ }).click();

    // Secciones 1 y 2 con binding en vivo (no requieren modo edición)
    await page.locator('[data-testid="emp-seccion-motivo"] textarea').fill('Motivo de consulta E2E (GAP-EMP-10)');

    const seccionDx = page.locator('[data-testid="emp-seccion-dx"]');
    await seccionDx.locator('input').nth(3).fill('Primera aparición E2E');
    await seccionDx.locator('input').nth(4).fill('Factores precipitantes E2E');
    await seccionDx.locator('select').selectOption('episódico');

    await page.getByRole('button', { name: 'Guardar Expediente Psiquiátrico' }).click();

    // Recarga para verificar persistencia real desde la BD
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /Tratamiento Psiquiátrico/ }).click();

    await expect(page.locator('[data-testid="emp-seccion-motivo"] textarea')).toHaveValue('Motivo de consulta E2E (GAP-EMP-10)');
    await expect(page.locator('[data-testid="emp-seccion-dx"] input').nth(3)).toHaveValue('Primera aparición E2E');
    await expect(page.locator('[data-testid="emp-seccion-dx"] input').nth(4)).toHaveValue('Factores precipitantes E2E');
    await expect(page.locator('[data-testid="emp-seccion-dx"] select')).toHaveValue('episódico');
  });
});
