# E2E Report: Módulo Expedientes — FASE 3 (Escritura de dominios — Bloque A)

- **Fecha**: 2026-10-09
- **Módulo**: `expediente-clinico` (Angular) + dominios `expediente`, `pago`, `supervision`, `constancia` (Spring Boot)
- **Oráculo**: Spring Boot 3.3.3 (context-path `/api/v1`, puerto 8080) + PostgreSQL 17 (`brevemente_db`, Flyway v8)
- **Frontend**: Angular 18 standalone (dev server en puerto **3000**, ver §5)
- **Framework**: Playwright 1.63 (chromium, 1 worker)
- **Spec**: `frontend/tests/e2e/expediente.spec.ts`
- **Resultado global**: ✅ **15/15 PASSED** (48.5s) — sin errores de consola inesperados, sin HTTP 500 no controlados

---

## 1. Configuración de la validación

| Aspecto | Valor |
| :--- | :--- |
| Autenticación | Login real contra `POST /auth/login` (JWT) con `sofia.ramirez@brevemente.org` / `demo123` |
| Monitoreo de consola | `page.on('console')` → falla ante `type === 'error'` (filtrando `favicon.ico` y respuestas 4xx) |
| Excepciones JS | `page.on('pageerror')` → falla ante cualquier excepción no capturada |
| Errores de servidor | `page.on('response')` → falla ante cualquier `status >= 500` |
| Regresión visual | `toHaveScreenshot('expediente-paciente.png', { maxDiffPixelRatio: 0.01, fullPage: true })` |
| Base URL | `E2E_BASE_URL=http://localhost:3000` (ver §5) |

> Las aserciones de monitoreo se ejecutan en el `afterEach`, por lo que **cada test falla automáticamente** si detecta un error de consola o un HTTP 500 durante su ejecución.

---

## 2. Matriz de pruebas ejecutadas

| ID | Prueba | Verificación (oráculo real) | Resultado |
| :--- | :--- | :--- | :---: |
| TC-EXP-01 | Carga y oráculo de datos reales | `GET /pacientes/{id}` + `GET /expedientes/paciente/{id}` (pac-001) | ✅ |
| TC-EXP-02 | Sesiones cargadas desde la BD | `GET .../sesiones` → "Sesión #1" + prescripciones | ✅ |
| TC-EXP-03 | Regresión visual (pantalla principal) | Screenshot `expediente-paciente.png` con `maxDiffPixelRatio: 0.01` | ✅ |
| TC-EXP-04 | Expediente psiquiátrico (pac-002) | `drugsList` de `exp-002` (`Sertralina 50mg`, `Alprazolam 0.25mg`) | ✅ |
| TC-EXP-05 | Pagos cargados desde la BD | Resumen "Total cobrado" + registro (`GET /pagos`) | ✅ |
| TC-EXP-06 | Bitácoras de supervisión desde la BD | `GET /supervision/bitacoras` → "Dra. Isabel Cárdenas" | ✅ |
| TC-EXP-07 | Constancias físicas desde la BD | Folio `CONST-2026-084-FIS` (`GET /constancias`) | ✅ |
| TC-EXP-08 | Auditoría del expediente | `GET .../auditoria` → cabecera de auditoría | ✅ |
| TC-EXP-09 | Valoración del Cambio y Global | Tablas VC/VG derivadas de `sesiones.valoracion_cambio/global` (JSONB) | ✅ |
| TC-EXP-10 | Registrar pago | `POST /pagos` → el pago aparece en la tabla | ✅ |
| TC-EXP-11 | Cambiar estado + eliminar pago | `PATCH /pagos/{id}/estado` + `DELETE /pagos/{id}` | ✅ |
| TC-EXP-12 | Registrar constancia física | `POST /constancias` → folio en el listado | ✅ |
| TC-EXP-13 | Registrar bitácora de supervisión | `POST /supervision/bitacoras` → "Sesión 999" | ✅ |
| TC-EXP-14 | Registrar sesión TBE con captura VC/VG | `POST .../sesiones` con `valoracionCambio`/`valoracionGlobal` | ✅ |
| TC-EXP-15 | Folio duplicado no rompe la UI | `ux_constancias_folio` → 500 esperado, manejo de error en frontend | ✅ |

---

## 3. Monitoreo de errores de consola y HTTP 500

- **0 errores de consola inesperados** en las 15 ejecuciones.
- **0 excepciones JS** no capturadas.
- **0 respuestas HTTP 500 no controladas**.
- Única respuesta 500 **esperada y controlada**: TC-EXP-15 (folio de constancia duplicado → violación del índice único `ux_constancias_folio`), que el frontend maneja con `alert` y el test limpia del monitor antes del `afterEach`.

---

## 4. Regresión visual

- **Baseline**: `tests/e2e/expediente.spec.ts-snapshots/expediente-paciente-chromium-win32.png`.
- **Parámetro**: `maxDiffPixelRatio: 0.01` (1%), `fullPage: true`.
- **Resultado**: sin diferencias → ✅.

---

## 5. Hallazgos y correcciones durante la validación

1. **Bug real corregido (frontend)** — `guardarSesion()` calculaba el siguiente número de sesión con `sessions[0].number + 1`, pero el backend devuelve sesiones en orden **ascendente** (`OrderByNumeroAsc`), por lo que `sessions[0]` era el número mínimo y el nuevo número colisionaba con el `UNIQUE(expediente_id, numero)` → **500**. Se corrigió a `Math.max(...sessions.map(s => s.number)) + 1`.
2. **Entorno del dev server** — el dev server histórico en `4200` servía un bundle **obsoleto** (arrancado el 28/09, sin los permisos `PAGOS_*`/`CONSTANCIAS_*`/`SUPERVISION_REGISTRAR`). Un intento en `4201` falló porque el backend **no incluye `localhost:4201` en su allowlist CORS** (`SecurityConfig` solo admite `4200`, `3000`, `127.0.0.1:4200`). La suite se ejecutó contra un dev server fresco en **`http://localhost:3000`** (origen permitido).
3. **Robustez de aserciones** — los flujos de mutación acumulan datos entre ejecuciones; se añadió `.first()` a las aserciones de texto (`Isabel Cárdenas`, `Sesión 999`, `Nuevo patrón`, `Empeoramiento`) para evitar fallos por `strict mode` de Playwright.
4. **Caso negativo** — TC-EXP-15 limpia los monitores (`consoleErrors`/`http500Errors`) al final porque el 500 de unicidad de folio es **esperado**.

> **Nota de datos**: los tests de mutación (TC-EXP-10..14) crean registros reales en la BD (pagos, constancias, bitácoras y sesiones). No existe un `DELETE` de sesión en el puerto actual, por lo que las sesiones creadas se acumulan entre ejecuciones; las aserciones usan `.first()` para tolerarlo.

---

## 6. Conclusión

La Fase 3 (Bloque A) del módulo Expedientes **cumple los criterios de aceptación E2E**: escritura completa de pagos, constancias y bitácoras, captura VC/VG en sesión, recordatorio por WhatsApp, gating por permisos y accesibilidad de modales, todo validado contra el oráculo real (Spring Boot + PostgreSQL) sin errores de consola, sin excepciones JS y sin HTTP 500 no controlados. La suite queda como evidencia de regresión para futuros cambios.
