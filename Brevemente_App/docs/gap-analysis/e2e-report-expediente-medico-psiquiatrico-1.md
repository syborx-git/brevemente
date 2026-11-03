# E2E Report: Módulo Expedientes — Expediente Médico Psiquiátrico (SDD-EMP-1)

- **Fecha**: 2026-11-02
- **Código**: `SDD-EMP-1` (Expediente Médico Psiquiátrico — alineación al PDF)
- **Módulo**: `expediente-clinico` (Angular 18 standalone) — sub-pestaña *Tratamiento Psiquiátrico → Expediente Médico Psiquiátrico*
- **Oráculo**: Spring Boot 3.3.3 (context-path `/api/v1`, puerto 8080) + PostgreSQL 17 (`brevemente_db`, Flyway **v23**)
- **Frontend**: Angular 18 standalone (dev server `http://localhost:4200`, proxy `/api` → 8080)
- **Framework**: Playwright 1.63 (chromium, 1 worker)
- **Spec**: `frontend/tests/e2e/expediente.spec.ts`
- **Resultado global**: ✅ **25/25 PASSED** (1.1m) — sin errores de consola inesperados, sin excepciones JS, sin HTTP 500 no controlados

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
| Migración Flyway | `V23__esquema_farmacos_drogas.sql` aplicada (v22 → v23): `farmacos_esquema`/`drogas_esquema` (JSONB), `uso_drogas` (VARCHAR 15 + CHECK), backfill de `categoria` en `esquema_farmacologico` |
| Idempotencia | `test.beforeAll` restaura: examen mental (SDD-HC-3), Ficha de identificación (SDD-FI-1), los 4 campos clínicos de `exp-001` (GAP-EMP-10) y los esquemas Fármacos/Drogas de `exp-002` (SDD-EMP-1) |

> Las aserciones de monitoreo se ejecutan en el `afterEach`: **cada test falla automáticamente** si detecta un error de consola, una excepción JS o un HTTP 500 durante su ejecución.

---

## 2. Matriz de pruebas ejecutadas

### 2.1 Casos nuevos — Expediente Médico Psiquiátrico (SDD-EMP-1)

| ID | Prueba | Verificación (oráculo real) | Resultado |
| :--- | :--- | :--- | :---: |
| TC-EXP-20 | 8 secciones de la lámina del PDF | Los 8 `data-testid` (`emp-seccion-motivo` … `emp-seccion-drogas`) visibles; encabezados "Motivo de Consulta", "DX. Nosológico", "DX.DIF", "Plan de tratamiento", "Pronóstico", "Fármacos", "Psicofármacos", "Drogas"; los 6 grupos (BZD / Antidepresivos / Neurolépticos / Psicoestabilizadores / Inductores del sueño / Otros); "Comorbilidad" oculta (D-6); botón "Editar expediente médico psiquiátrico" | ✅ |
| TC-EXP-20B | Fármacos/Drogas — toggle Sí + persistencia | `PATCH /expedientes/paciente/{id}` con `farmacosEsquema=[{nombre:"Losartan 50mg"}]`, `drogasEsquema=[{nombre:"Cannabis"}]`, `usoDrogas='SI'` → la vista de lectura refleja ambos nombres | ✅ |
| TC-EXP-20C | `guardarExpedientePsiquiatrico` persiste los 4 campos clínicos (GAP-EMP-10) | `motif`, `firstAppearance`, `precipitatingFactors` y `evolutionType` se persisten vía `PATCH` y sobreviven a un `page.reload()` | ✅ |

### 2.2 Casos preexistentes (regresión)

| ID | Prueba | Resultado |
| :--- | :--- | :---: |
| TC-EXP-01 … TC-EXP-15 | Carga/oráculo, sesiones, pagos, constancias, bitácoras, auditoría, VC/VG, mutaciones y manejo de errores | ✅ (15/15) |
| TC-EXP-16 | Datos Generales (oráculo) | ✅ |
| TC-EXP-17 / 17B / 17C | Historia clínica — 5 cards + examen mental | ✅ |
| TC-EXP-18 / 18B | Ficha de identificación — 7 secciones + edición | ✅ |
| TC-EXP-19 | Esquema Psico-Farmacológico (sub-tab intacto, fuente de la sección 7) | ✅ |

---

## 3. Validación de backend (fuera del runner Playwright)

| Verificación | Resultado |
| :--- | :---: |
| `mvn test-compile` | ✅ limpio |
| Unit tests `ExpedienteApplicationServiceTest` | ✅ 6/6 (2 nuevos: fusión de `farmacosEsquema`/`drogasEsquema`/`usoDrogas` con guard `!= null`; `[]` limpia, `null` no toca) |
| Smoke test `PATCH /expedientes/paciente/pac-002` | ✅ escribe/lee `farmacosEsquema`, `drogasEsquema`, `usoDrogas`; restaurado |
| Backfill de categoría (V23) | ✅ `drug-1` (Sertralina) → `isrs`, `drug-2` (Alprazolam) → `bzd` |

---

## 4. Monitoreo de errores de consola y HTTP 500

- **0 errores de consola inesperados** en las 25 ejecuciones.
- **0 excepciones JS** no capturadas.
- **0 respuestas HTTP 500 no controladas**.
- Única respuesta 500 **esperada y controlada**: TC-EXP-15 (folio de constancia duplicado → violación del índice único `ux_constancias_folio`), que el frontend maneja con `alert` y el test limpia del monitor antes del `afterEach`.

---

## 5. Regresión visual

- **Baseline**: `tests/e2e/expediente.spec.ts-snapshots/expediente-paciente-chromium-win32.png`.
- **Parámetro**: `maxDiffPixelRatio: 0.01` (1%), `fullPage: true`, viewport 1280×720.
- **Resultado**: sin diferencias → ✅. La pantalla principal (tab TBE) no se ve afectada por el cambio en la sub-pestaña *Expediente Médico Psiquiátrico*.

---

## 6. Hallazgos y correcciones durante la validación

1. **Colisión de estado con la Ficha de identificación** — `farmacosSi`/`drogasSi` ya existían en el componente (Ficha). La sub-pestaña EMP usa prefijo `emp` (`empFarmacosSi`, `empDrogasSi`, `empFarmacosDraft`, `empDrogasDraft`) para no pisar el estado de la Ficha.
2. **Contrato de naming** — el flag de Fármacos es `drugsUsage` (frontend, `ClinicalRecord`) ↔ columna `uso_farmacos` (backend). **No existe** `usoFarmacos` en el frontend; se evitó esa referencia.
3. **Handler compartido sin sobrescritura** — `guardarExpedientePsiquiatrico()` (renombrado de `guardarPsiquiatria()`) es el handler de ambos botones ("Guardar Expediente Psiquiátrico" y "Guardar Esquema"). Los 4 campos EMP (`drugsUsage`, `farmacosEsquema`, `usoDrogas`, `drogasEsquema`) solo se envían cuando `editandoEMP === true`, evitando que "Guardar Esquema" sobrescriba datos vigentes con vacíos.
4. **Backfill idempotente y no-destructivo** — V23 etiqueta `categoria` clavando por `id` (no por índice) y con guard `elem->>'categoria' IS NOT NULL` para no sobrescribir una categoría preexistente.
5. **Idempotencia ampliada (SDD-EMP-1)** — `TC-EXP-20B` muta `farmacosEsquema`/`drogasEsquema`/`usoDrogas` de `exp-002` y `TC-EXP-20C` muta `motif`/`firstAppearance`/`precipitatingFactors`/`evolutionType` de `exp-001`. El `test.beforeAll` restaura ambos seeds para que los casos de lectura permanezcan deterministas.
6. **Localizadores estables** — las 8 secciones usan `data-testid` (`emp-seccion-*`); los radios No/Sí usan `name="emp-farmacos"` / `name="emp-drogas"` y los inputs editables `[attr.name]="emp-farmaco-{i}"` / `emp-droga-{i}` (lección de `[attr.name]` vs `name` ya documentada en SDD-HC-3/SDD-FI-1).

> **Nota de datos**: los tests de mutación (TC-EXP-10..14, TC-EXP-17B, TC-EXP-18B, TC-EXP-20B, TC-EXP-20C) crean/actualizan registros reales en la BD. El `beforeAll` restaura el estado de `exp-001` y `exp-002` antes de cada ejecución de la suite, por lo que los casos de lectura permanecen deterministas.

---

## 7. Conclusión

La implementación de **SDD-EMP-1** (sub-pestaña *Expediente Médico Psiquiátrico* con 8 secciones + backend V23) **cumple los criterios de aceptación E2E**. La vista renderiza datos reales del oráculo Spring Boot/PostgreSQL (`motivo_consulta`, `primera_aparicion`, `factores_precipitantes`, `tipo_evolucion`, `farmacos_esquema`, `drogas_esquema`, `uso_drogas` y `esquema_farmacologico`), el flujo de edición persiste correctamente vía `PATCH`, la migración V23 se aplicó con backfill de categorías verificado y no se registraron errores de consola, excepciones JS ni HTTP 500 no controlados. La suite completa (25 casos) queda como evidencia de regresión del módulo.
