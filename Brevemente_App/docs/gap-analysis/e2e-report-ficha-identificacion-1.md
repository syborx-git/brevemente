# E2E Report: Módulo Expedientes — Ficha de Identificación (SDD-FI-1)

- **Fecha**: 2026-11-02
- **Código**: `SDD-FI-1` (Ficha de Identificación — alineación al PDF)
- **Módulo**: `expediente-clinico` (Angular 18 standalone) — sub-pestaña *Datos de Admisión e Historia Clínica → Ficha de identificación*
- **Oráculo**: Spring Boot 3.3.3 (context-path `/api/v1`, puerto 8080) + PostgreSQL 17 (`brevemente_db`, Flyway **v22**)
- **Frontend**: Angular 18 standalone (dev server `http://localhost:4200`, proxy `/api` → 8080)
- **Framework**: Playwright 1.63 (chromium, 1 worker)
- **Spec**: `frontend/tests/e2e/expediente.spec.ts`
- **Resultado global**: ✅ **22/22 PASSED** (1.0m) — sin errores de consola inesperados, sin excepciones JS, sin HTTP 500 no controlados

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
| Idempotencia | `test.beforeAll` restaura el estado "Sin datos" del examen mental (SDD-HC-3) y el seed de la Ficha de identificación (SDD-FI-1: fuente `psicoterapeuta`, historiales `[]`, tratamientos previos `[]`) |

> Las aserciones de monitoreo se ejecutan en el `afterEach`: **cada test falla automáticamente** si detecta un error de consola, una excepción JS o un HTTP 500 durante su ejecución.

---

## 2. Matriz de pruebas ejecutadas

### 2.1 Casos reescritos / nuevos — Ficha de identificación (SDD-FI-1)

| ID | Prueba | Verificación (oráculo real) | Resultado |
| :--- | :--- | :--- | :---: |
| TC-EXP-18 | Ficha de identificación con 7 secciones | Headings de las 7 secciones + identificación (CURP, nombre) + `startDate` (`10 de agosto de 2026`) + fuente de referencia (`psicoterapeuta` → "Psicoterapeuta") + botón "Editar" | ✅ |
| TC-EXP-18B | Editar fuente, fármacos y guardar (persistencia) | `PATCH /expedientes/paciente/{id}` con `fuenteReferencia='otro'` + `fuenteReferenciaOtro` + `historialFarmacos` → la vista de lectura refleja "Derivado por familiar" y "Paracetamol 500mg" | ✅ |

### 2.2 Casos preexistentes (regresión)

| ID | Prueba | Resultado |
| :--- | :--- | :---: |
| TC-EXP-01 … TC-EXP-15 | Carga/oráculo, sesiones, pagos, constancias, bitácoras, auditoría, VC/VG, mutaciones y manejo de errores | ✅ (15/15) |
| TC-EXP-16 | Datos Generales (oráculo) | ✅ |
| TC-EXP-17 / 17B / 17C | Historia clínica — 5 cards + examen mental | ✅ |
| TC-EXP-19 | Esquema Psico-Farmacológico | ✅ |

---

## 3. Monitoreo de errores de consola y HTTP 500

- **0 errores de consola inesperados** en las 22 ejecuciones.
- **0 excepciones JS** no capturadas.
- **0 respuestas HTTP 500 no controladas**.
- Única respuesta 500 **esperada y controlada**: TC-EXP-15 (folio de constancia duplicado → violación del índice único `ux_constancias_folio`), que el frontend maneja con `alert` y el test limpia del monitor antes del `afterEach`.

---

## 4. Regresión visual

- **Baseline**: `tests/e2e/expediente.spec.ts-snapshots/expediente-paciente-chromium-win32.png`.
- **Parámetro**: `maxDiffPixelRatio: 0.01` (1%), `fullPage: true`, viewport 1280×720.
- **Resultado**: sin diferencias → ✅. La pantalla principal (tab TBE) no se ve afectada por el cambio en la sub-pestaña *Ficha de identificación*.

---

## 5. Hallazgos y correcciones durante la validación

1. **Coincidencia múltiple por substring en `getByRole`** — el localizador `getByRole('radiogroup', { name: 'Fármacos' })` resolvía a **2 elementos** porque `name` es matching de substring por defecto y "Fármacos" está contenido en "Psicofármacos" (strict mode violation). Se corrigió con `{ name: 'Fármacos', exact: true }`.
2. **Idempotencia ampliada (SDD-FI-1)** — `TC-EXP-18B` muta `fuenteReferencia`, `fuenteReferenciaOtro` y `historialFarmacos` de `exp-001`. El `test.beforeAll` se amplió para restaurar el seed (`psicoterapeuta`, `''`, `[]`, `[]`, `[]`) y vaciar `tratamientos-previos` vía `PUT`, de modo que `TC-EXP-18` (lectura) sea determinista entre ejecuciones.
3. **`name` consumido por `NgModel`** — para localizar en E2E los campos editables se usó `[attr.name]` (`fuente-referencia`, `fuente-referencia-otro`, `farmaco-{i}`), lección ya documentada en SDD-HC-3.
4. **Toggle No/Sí derivado vs booleano de borrador** — en edición, el radio No/Sí se enlaza al booleano de borrador (`farmacosSi`, etc.), no a la longitud de la lista; esto permitió validar el flujo "Sí → Agregar → Guardar" sin que el radio rebotara.

> **Nota de datos**: los tests de mutación (TC-EXP-10..14, TC-EXP-17B, TC-EXP-18B) crean/actualizan registros reales en la BD. El `beforeAll` restaura el estado de `exp-001` antes de cada ejecución de la suite, por lo que los casos de lectura (TC-EXP-16/17/18) permanecen deterministas.

---

## 6. Conclusión

La implementación de **SDD-FI-1** (sub-pestaña *Ficha de identificación* con 7 secciones, sin cambios de backend) **cumple los criterios de aceptación E2E**. La vista renderiza datos reales del oráculo Spring Boot/PostgreSQL (`fecha_inicio`, `fuente_referencia`, historiales JSONB y `tratamientos_previos`), el flujo de edición persiste correctamente vía `PATCH`/`PUT`, la regresión visual se mantiene estable y no se registraron errores de consola, excepciones JS ni HTTP 500 no controlados. La suite completa (22 casos) queda como evidencia de regresión del módulo.
