# E2E Report: Módulo Expedientes — Historia Clínica Estructurada (SDD-HC-3)

- **Fecha**: 2026-10-29
- **Código**: `SDD-HC-3` (Historia Clínica — antecedentes estructurados, Examen Mental y Evaluación de Riesgo)
- **Módulo**: `expediente-clinico` (Angular 18 standalone) — sub-pestaña *Datos de Admisión e Historia Clínica → Historia clínica*
- **Oráculo**: Spring Boot 3.3.3 (context-path `/api/v1`, puerto 8080) + PostgreSQL 17 (`brevemente_db`, Flyway **v22** — `V22__historia_clinica_estructurada.sql`)
- **Frontend**: Angular 18 standalone (dev server `http://localhost:4200`, proxy `/api` → 8080)
- **Framework**: Playwright 1.63 (chromium, 1 worker)
- **Spec**: `frontend/tests/e2e/expediente.spec.ts`
- **Resultado global**: ✅ **21/21 PASSED** (51.0s) — sin errores de consola inesperados, sin excepciones JS, sin HTTP 500 no controlados

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
| Idempotencia | `test.beforeAll` restaura el estado "Sin datos" del examen mental de `exp-001` vía `PATCH /expedientes/paciente/pac-001` antes de la suite |

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
| TC-EXP-16 | Datos Generales cargados desde la BD | `GET /sedes/{id}` (CLUES `CLSM-000001`, licencia `LS-BM-2026-01`) + `GET /pacientes/{id}` (RFC `SARM020815XXX`, domicilio) | ✅ |

### 2.2 Casos nuevos / reescritos — Historia Clínica Estructurada (SDD-HC-3)

| ID | Prueba | Verificación (oráculo real) | Resultado |
| :--- | :--- | :--- | :---: |
| TC-EXP-17 | Historia clínica con 5 cards latentes | Headings de las 5 cards + seed migrado de `V22` (`Alergia a la penicilina`, `Madre con trastorno de ansiedad`) + 4 botones "Editar" (aria-label) + botones "Realizar examen"/"Ver resultados" + estado "Sin datos" | ✅ |
| TC-EXP-17B | Realizar examen mental (modal y guardado) | Modal `role="dialog"` con formulario de 11 secciones → `PATCH /expedientes/paciente/{id}` con `examenMental` + `fechaExamenMental` → la card resume la impresión diagnóstica y "Ver resultados" se habilita | ✅ |
| TC-EXP-17C | Ver resultados del examen mental | Modal de lectura con tablas `Parámetro | Hallazgo` (o `Sección | Parámetro | Hallazgo`) y síntesis con la impresión diagnóstica guardada | ✅ |
| TC-EXP-18 | Ficha de identificación | Cabecera + CURP + nombre del paciente | ✅ |
| TC-EXP-19 | Esquema Psico-Farmacológico con fármacos y CRUD | `drugsList` de `exp-002` + `GET /catalogos/categorias-psicofarmacos` + botón "Agregar" | ✅ |

---

## 3. Monitoreo de errores de consola y HTTP 500

- **0 errores de consola inesperados** en las 21 ejecuciones.
- **0 excepciones JS** no capturadas.
- **0 respuestas HTTP 500 no controladas**.
- Única respuesta 500 **esperada y controlada**: TC-EXP-15 (folio de constancia duplicado → violación del índice único `ux_constancias_folio`), que el frontend maneja con `alert` y el test limpia del monitor antes del `afterEach`.

---

## 4. Regresión visual

- **Baseline**: `tests/e2e/expediente.spec.ts-snapshots/expediente-paciente-chromium-win32.png`.
- **Parámetro**: `maxDiffPixelRatio: 0.01` (1%), `fullPage: true`, viewport 1280×720.
- **Resultado**: sin diferencias → ✅. La pantalla principal (tab TBE, cabecera y tarjeta de representación legal) permanece intacta tras la reestructuración de la sub-pestaña *Historia clínica*.

---

## 5. Hallazgos y correcciones durante la validación

1. **Reescritura de TC-EXP-17 (UI reestructurada, D-1/D-2/D-3)** — el modelo genérico (`antecedentes_expediente` + lista dinámica) fue sustituido por 5 cards latentes con estructura fija. Se eliminaron de la sub-pestaña *Fuente de Referencia*, *Tratamientos Previos* e historiales (D-3, datos conservados en BD). El test ahora valida los 5 headings, los antecedentes migrados por `V22` y los botones "Editar" (aria-label descriptivo).
2. **Nuevos flujos de Examen Mental (D-2)** — se añadieron `TC-EXP-17B` (apertura del formulario completo de 11 secciones, guardado vía `PATCH` con `examenMental` + `fechaExamenMental` y resumen en la card) y `TC-EXP-17C` (modal de resultados con tabla `Parámetro | Hallazgo` y síntesis).
3. **Idempotencia del estado "Sin datos"** — el `PATCH` no permite vaciar `examen_mental` con `{}` (guard `!isEmpty()` en `ExpedienteApplicationService.aplicar`). Se añadió un `test.beforeAll` que restaura el estado vacío enviando `{ síntesis: {} }`, estructura que el frontend interpreta como "Sin datos", garantizando que `TC-EXP-17` sea re-ejecutable.
4. **Nomenclatura JSONB con acentos — verificación de encoding** — las claves JSONB (`personalesPatológicos`, `alérgicos`, …) se validaron a nivel de bytes (`encode(convert_to(k,'UTF8'),'hex')`): `ó` = `c3b3` correcto en BD y en la respuesta HTTP. El mojibake observado durante el desarrollo provenía del tooling de verificación (psql/PowerShell en CP850), no del backend. Se añadió `charSet=UTF-8` explícito a la URL JDBC como endurecimiento.
5. **Limitación del parser de templates de Angular** — el parser no admite acentos en identificadores de expresiones (`{{ obj.claveAcéntuada }}` falla). Se resolvió con accesores ASCII por clave string del componente (`antPat('médicos')`, `habitoResumen(...)`), manteniendo las claves con acento en los tipos TS y en el JSONB.
6. **Atributo `name` consumido por `NgModel`** — `name="x"` en un control con `ngModel` se enlaza al input `NgModel.name` (queda `ng-reflect-name` sin atributo DOM). Para que los campos del formulario de examen sean localizables en E2E, se usó `[attr.name]="'sintesis-' + s.clave"`.

> **Nota de datos**: los tests de mutación (TC-EXP-10..14, TC-EXP-17B) crean registros reales en la BD (pagos, constancias, bitácoras, sesiones y examen mental). No existe `DELETE` de sesión en el puerto actual; las aserciones usan `.first()` para tolerar la acumulación, y el `beforeAll` restaura el examen mental de `exp-001` antes de cada ejecución de la suite.

---

## 6. Conclusión

La implementación de **SDD-HC-3** (migración `V22`, backend hexagonal y sub-pestaña *Historia clínica* con 5 cards latentes y formulario de Examen Mental) **cumple los criterios de aceptación E2E**. Las 5 cards renderizan datos reales del oráculo Spring Boot/PostgreSQL, los flujos "Realizar examen" y "Ver resultados" persisten y leen el examen mental estructurado, la regresión visual se mantiene estable y no se registraron errores de consola, excepciones JS ni HTTP 500 no controlados. La suite queda como evidencia de regresión para el módulo de expedientes.
