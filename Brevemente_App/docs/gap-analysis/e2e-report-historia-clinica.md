# E2E Report: Módulo Expedientes — Historia Clínica (Datos Generales · Historia · Esquema)

- **Fecha**: 2026-10-29
- **Módulo**: `expediente-clinico` (Angular 18 standalone) — sub-pestañas *Datos de Admisión e Historia Clínica* y *Tratamiento Psiquiátrico*
- **Oráculo**: Spring Boot 3.3.3 (context-path `/api/v1`, puerto 8080) + PostgreSQL 17 (`brevemente_db`, Flyway **v20** — `V20__historia_clinica.sql`)
- **Frontend**: Angular 18 standalone (dev server `http://localhost:4200`, proxy `/api` → 8080)
- **Framework**: Playwright 1.63 (chromium, 1 worker)
- **Spec**: `frontend/tests/e2e/expediente.spec.ts`
- **Resultado global**: ✅ **19/19 PASSED** (52.1s) — sin errores de consola inesperados, sin excepciones JS, sin HTTP 500 no controlados

---

## 1. Configuración de la validación

| Aspecto | Valor |
| :--- | :--- |
| Autenticación | Login real contra `POST /auth/login` (JWT) con `sofia.ramirez@brevemente.org` / `demo123` |
| Monitoreo de consola | `page.on('console')` → falla ante `type === 'error'` (filtrando `favicon.ico` y respuestas 4xx) |
| Excepciones JS | `page.on('pageerror')` → falla ante cualquier excepción no capturada |
| Errores de servidor | `page.on('response')` → falla ante cualquier `status >= 500` |
| Regresión visual | `toHaveScreenshot('expediente-paciente.png', { maxDiffPixelRatio: 0.01, fullPage: true })` |
| Base URL | `http://localhost:4200` (dev server con `proxy.conf.json` → `/api` → `http://localhost:8080`) |

> Las aserciones de monitoreo se ejecutan en el `afterEach`: **cada test falla automáticamente** si detecta un error de consola, una excepción JS o un HTTP 500 durante su ejecución.

---

## 2. Matriz de pruebas ejecutadas

### 2.1 Casos preexistentes (regresión)

| ID | Prueba | Verificación (oráculo real) | Resultado |
| :--- | :--- | :--- | :---: |
| TC-EXP-01 | Carga y oráculo de datos reales | `GET /pacientes/{id}` + `GET /expedientes/paciente/{id}` (pac-001, menor de edad + representante) | ✅ |
| TC-EXP-02 | Sesiones cargadas desde la BD | `GET .../sesiones` → "Sesión #1" + prescripciones | ✅ |
| TC-EXP-03 | Regresión visual (pantalla principal) | Screenshot `expediente-paciente.png` con `maxDiffPixelRatio: 0.01` | ✅ |
| TC-EXP-04 | Expediente psiquiátrico y esquema farmacológico (pac-002) | `drugsList` de `exp-002` (`Sertralina 50mg`, `Alprazolam 0.25mg`) | ✅ |
| TC-EXP-05 | Pagos cargados desde la BD | Resumen "Total cobrado" + registro (`GET /pagos`) | ✅ |
| TC-EXP-06 | Bitácoras de supervisión desde la BD | `GET /supervision/bitacoras` → "Isabel Cárdenas" | ✅ |
| TC-EXP-07 | Constancias físicas desde la BD | Folio `CONST-2026-084-FIS` (`GET /constancias`) | ✅ |
| TC-EXP-08 | Auditoría del expediente | `GET .../auditoria` → cabecera de auditoría | ✅ |
| TC-EXP-09 | Valoración del Cambio y Global | Tablas VC/VG derivadas de `sesiones.valoracion_cambio/global` (JSONB) | ✅ |
| TC-EXP-10 | Registrar pago | `POST /pagos` → el pago aparece en la tabla | ✅ |
| TC-EXP-11 | Cambiar estado + eliminar pago | `PATCH /pagos/{id}/estado` + `DELETE /pagos/{id}` | ✅ |
| TC-EXP-12 | Registrar constancia física | `POST /constancias` → folio en el listado | ✅ |
| TC-EXP-13 | Registrar bitácora de supervisión | `POST /supervision/bitacoras` → "Sesión 999" | ✅ |
| TC-EXP-14 | Registrar sesión TBE con captura VC/VG | `POST .../sesiones` con `valoracionCambio`/`valoracionGlobal` | ✅ |
| TC-EXP-15 | Folio duplicado no rompe la UI | `ux_constancias_folio` → 500 esperado, manejo de error en frontend | ✅ |

### 2.2 Casos nuevos — Historia Clínica (sub-pestañas del port de la demo)

| ID | Prueba | Verificación (oráculo real) | Resultado |
| :--- | :--- | :--- | :---: |
| TC-EXP-16 | Datos Generales cargados desde la BD | `GET /sedes/{id}` (CLUES `CLSM-000001`, licencia `LS-BM-2026-01`) + `GET /pacientes/{id}` (RFC `SARM020815XXX`, domicilio) | ✅ |
| TC-EXP-17 | Historia clínica con riesgo y antecedentes | Riesgo suicida `bajo`, fuente `psicoterapeuta` + `GET .../antecedentes` (3 seed: ant-001..003) | ✅ |
| TC-EXP-18 | Ficha de identificación | Cabecera + CURP + nombre del paciente | ✅ |
| TC-EXP-19 | Esquema Psico-Farmacológico con fármacos y CRUD | `drugsList` de `exp-002` + `GET /catalogos/categorias-psicofarmacos` + botón "Agregar" | ✅ |

---

## 3. Monitoreo de errores de consola y HTTP 500

- **0 errores de consola inesperados** en las 19 ejecuciones.
- **0 excepciones JS** no capturadas.
- **0 respuestas HTTP 500 no controladas**.
- Única respuesta 500 **esperada y controlada**: TC-EXP-15 (folio de constancia duplicado → violación del índice único `ux_constancias_folio`), que el frontend maneja con `alert` y el test limpia del monitor antes del `afterEach`.

---

## 4. Regresión visual

- **Baseline**: `tests/e2e/expediente.spec.ts-snapshots/expediente-paciente-chromium-win32.png`.
- **Parámetro**: `maxDiffPixelRatio: 0.01` (1%), `fullPage: true`, viewport 1280×720.
- **Resultado**: sin diferencias → ✅. La pantalla principal (tab TBE, cabecera y tarjeta de representación legal) permanece intacta tras la reestructuración de las pestañas `datos` y `psiquiatria`.

---

## 5. Hallazgos y correcciones durante la validación

1. **Adaptación de TC-EXP-04 (UI reestructurada)** — el esquema farmacológico dejó de renderizarse dentro de la pestaña *Tratamiento Psiquiátrico* y pasó a la sub-pestaña **Esquema Psico-Farmacológico**. Además, los psicofármacos dejaron de ser celdas de texto y ahora son **inputs editables** (con categoría en `select`). La aserción se actualizó para navegar a la sub-pestaña y verificar los valores de los inputs (`Sertralina 50mg`, `Alprazolam 0.25mg`).
2. **Adaptación de TC-EXP-14 (semáforo VC, issue #105)** — la captura de Valoración del Cambio cambió de `<select>` a `app-vc-semaphore` (botones `role="radio"` con las etiquetas canónicas de `VC_ESCALA`). El test se actualizó para interactuar por `radiogroup`/`radio`, y la aserción final usa la etiqueta canónica **"Recaída"** (persistida legado como "Empeoramiento").
3. **Datos seed de antecedentes** — el PUT de antecedentes (`guardarAntecedentes`) es de reemplazo total; el smoke test previo sobrescribió el seed de `V20` (ant-001..003). Se **reinsertó el seed** antes de la ejecución final para que TC-EXP-17 valide el oráculo de forma determinista.
4. **Nuevos casos de oráculo** — se añadieron TC-EXP-16..19 para cubrir las tres sub-pestañas de *Datos de Admisión e Historia Clínica* y la sub-pestaña *Esquema Psico-Farmacológico*, verificando datos reales de `sedes`, `pacientes`, `expedientes`, `antecedentes_expediente` y `catalogo_categorias_psicofarmacos`.

> **Nota de datos**: los tests de mutación (TC-EXP-10..14) crean registros reales en la BD (pagos, constancias, bitácoras y sesiones). No existe `DELETE` de sesión en el puerto actual, por lo que las sesiones se acumulan entre ejecuciones; las aserciones usan `.first()` para tolerarlo.

---

## 6. Conclusión

La implementación de **Historia Clínica** (migración `V20`, backend hexagonal y UI de sub-pestañas) **cumple los criterios de aceptación E2E**. Las nuevas sub-pestañas — *Datos Generales*, *Historia clínica*, *Ficha de identificación* y *Esquema Psico-Farmacológico* — renderizan datos reales del oráculo Spring Boot/PostgreSQL, la regresión visual de la pantalla principal se mantiene estable y no se registraron errores de consola, excepciones JS ni HTTP 500 no controlados. La suite queda como evidencia de regresión para futuros cambios del módulo.
