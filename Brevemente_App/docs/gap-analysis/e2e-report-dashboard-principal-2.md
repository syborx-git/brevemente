# E2E Report: Módulo Dashboard — Centro de Control (Terapeuta) — Paridad Completa

- **Fecha**: 2026-10-14
- **Módulo**: `dashboard` (Centro de Control) — **solo vista de terapeuta** (paciente/alumno fuera de alcance)
- **Suite**: `Brevemente_App/frontend/tests/e2e/dashboard-principal-2.spec.ts`
- **Oráculo**: Angular 18 (`http://localhost:3000`) → Spring Boot 3.3.3 (`/api/v1`, puerto 8080) → PostgreSQL 17 (`brevemente_db`)
- **Estado**: ✅ **APROBADO**

---

## 1. Resumen de ejecución

| Métrica | Resultado |
| :--- | :--- |
| Casos de prueba | 5 |
| Pasaron | **5 / 5 (100%)** |
| Fallaron | 0 |
| Errores de consola (JS) | 0 |
| Excepciones JS no capturadas | 0 |
| Errores HTTP 500 | 0 |
| Regresión visual | ✅ Sin diferencias (`maxDiffPixelRatio: 0.01`) |
| Duración total | ~11.8 s (1 worker, Chromium) |

Se ejecutó en **dos pasadas**: la primera con `--update-snapshots` para generar el baseline de regresión visual (y corregir un selector ambiguo en strict mode); la segunda con comparación directa contra el baseline ya generado. Resultado final: **5/5 aprobados**.

---

## 2. Oráculo de datos reales (verificado vía API antes del E2E)

Autenticación `sofia.ramirez@brevemente.org` (terapeuta `ter-001`, scope SCOPED). Respuestas reales de `/api/v1/dashboard/*`:

| Endpoint | Valor real |
| :--- | :--- |
| `stats` | `pacientesActivos: 2` · `citasHoyCount: 0` · `alertasConsentimiento: 1` · `alertasRiesgo: 2` · `pendientesClinicos: 0` |
| `citas-por-mes` | `Oct → 7` (sin filtro) · `sede-centro → 4` · `sede-norte → 3` |
| `distribucion-fases` | Fase 2 (Desbloqueo) → 2 · resto → 0 |
| `casos-por-protocolo` | Ataque de Pánico → 1 · Fobia Social → 1 |
| `pendientes-prioritarios` | `[]` (ter-001 sin pacientes `pendiente`) |
| `alertas-mayoria-edad` | `[]` (sin pacientes 18+ con `REPRESENTADO_POR_EDAD`) |
| `accion-dominante` | `204 No Content` (sin citas hoy en semilla) |

---

## 3. Detalle de casos de prueba

### TC-DASH2-01 — Carga completa del Centro de Control ✅
- Verifica el encabezado **"Centro de Control BreveMente"** (`h2`).
- Verifica los **4 KPIs**: `Citas Programadas`, `Pacientes Activos`, `Pendientes Clínicos`, `Alertas de Riesgo`.
- Verifica las **5 secciones de paridad con la demo**: `Perspectiva Clínica Unificada`, `Acción Operativa Dominante`, `Agenda del Día`, `Pendientes Prioritarios` y la barra `Filtros:`.

### TC-DASH2-02 — Valores reales del oráculo (scoped a ter-001) ✅
- `Pacientes Activos` = **2**.
- `Alertas de Riesgo` = **2** + badge **`REQUERIDO`**.
- `Citas Programadas` = **0** (semilla sin citas para hoy).
- `Pendientes Clínicos` = **0** + pie **`Límite semanal: 5`**.
- Acción dominante en estado **`Sin Consultas`** (backend devolvió 204).
- Gráfica de citas por mes renderiza la etiqueta del mes real **`Oct`**.

### TC-DASH2-03 — Drilldown desde el KPI "Pacientes Activos" ✅
- Clic en el KPI abre el modal **`Detalle del Centro de Control`**.
- Subtítulo **`Pacientes Filtrados — 2`**.
- Filas reales: **`Mateo Herrera Santos`** y **`Valeria Gómez Fuentes`** (pacientes scoped de ter-001).
- Cierre del modal verificado (el modal desaparece del DOM).

### TC-DASH2-04 — Filtro por sede acota KPIs y agregaciones ✅
- Valor inicial del KPI `Pacientes Activos` = **2** (scoped a ter-001, sede centro).
- Selección de **`Sede Norte BreveMente`** en el segundo `select` de filtros.
- Se intercepta la respuesta de `/api/v1/dashboard/stats?sedeId=sede-norte` → **HTTP 200**.
- **GAP-DASH2-01 corregido**: el KPI `Pacientes Activos` baja a **0** con sede Norte (ter-001 sin pacientes en esa sede).

### TC-DASH2-05 — Regresión visual del Centro de Control (full page) ✅
- Captura `dashboard-principal-2.png` a `fullPage`.
- Comparación contra baseline con `maxDiffPixelRatio: 0.01` → **sin diferencias**.

---

## 4. Monitoreo de errores de consola y red

Siguiendo el protocolo de la suite:

- **`page.on('console')`**: registra errores de tipo `error`, ignorando `favicon.ico` y los `Failed to load resource` 4xx (p. ej. 401/404 esperados).
- **`page.on('pageerror')`**: registra excepciones JavaScript no capturadas.
- **`page.on('response')`**: registra cualquier respuesta HTTP ≥ 500.

**Resultado**: 0 errores de consola, 0 excepciones JS y 0 respuestas 5xx durante toda la ejecución. El `afterEach` fallaría la suite ante cualquier incidencia.

---

## 5. Regresión visual

- **Baseline**: `tests/e2e/dashboard-principal-2.spec.ts-snapshots/dashboard-principal-2-chromium-win32.png` (generado en la primera pasada con `--update-snapshots`).
- **Comparación**: sin diferencias de píxeles (`maxDiffPixelRatio: 0.01`, `fullPage: true`).

---

## 6. Observaciones

- **Ajuste de selector (no es bug de app)**: `getByRole('button', { name: 'Cerrar' })` violaba strict mode porque coincidía con el botón `Cerrar sesión` del sidebar y con el botón `Cerrar` del modal. Se resolvió con `{ name: 'Cerrar', exact: true }`.
- **✅ GAP-DASH2-01 RESUELTO — propagación de filtros a KPIs/agenda/acción dominante**: se extendió el contrato de los 5 casos de uso (`stats`, `citas-hoy`, `alertas`, `pacientes-recientes`, `accion-dominante`) para recibir `DashboardFiltros`, y el controller ahora expone los `@RequestParam` (`modalidad`, `sedeId`, `periodo`, `terapeutaId`, `protocoloId`). Los puertos de repositorio aplican `sedeId`/`protocoloId` en pacientes (filtrado sobre `Paciente` con `getSedeId`/`getProtocoloId`) y `sedeId`/`protocoloId`/`modalidad` en citas (consultas nativas con `JOIN pacientes`). Verificado en runtime: `stats?sedeId=sede-norte` → todo en 0; `stats?sedeId=sede-centro` → 2 activos/1 consentimiento/2 riesgo; `pacientes-recientes?sedeId=sede-norte` → `[]`; `alertas?sedeId=sede-norte` → `[]`. `periodo` sigue siendo exclusivo de la gráfica `citas-por-mes` (los KPIs son instantáneas del día actual).
- **"Citas de hoy" en 0**: la semilla contiene citas fechadas para otros días (no 2026-10-14), por lo que el KPI "Citas Programadas", la "Agenda del Día" y la "Acción Operativa Dominante" muestran vacío/`Sin Consultas`. Comportamiento correcto; se recomienda semilla dinámica de citas para el día actual.
- **Alerta de Mayoría de Edad no renderizada**: `alertas-mayoria-edad` devuelve `[]` porque ningún paciente en estado `REPRESENTADO_POR_EDAD` ha cumplido 18 años. El componente `majority-age-alert` se oculta correctamente.
- **Scope excluido**: las vistas de paciente y alumno quedan fuera de alcance por decisión explícita; además el `permissionGuard` las redirige (`patient → /mi-consulta`, `student → /`) antes de montar el dashboard.
- **Codificación**: los acentos (`Ataque de Pánico`, `Valeria Gómez`) se ven como mojibake únicamente en la consola de PowerShell (cp850); en el navegador se decodifican en UTF-8 correctamente (validado al aseverar `Mateo Herrera Santos` y `/Valeria/` en el DOM).
- **Entorno**: backend corriendo en 8080 (PID 13068) con migraciones Flyway al día (`v12`), frontend en `http://localhost:3000` con proxy `/api` → 8080.

---

## 7. Veredicto final

✅ **APROBADO** — El Centro de Control del terapeuta opera end-to-end contra el oráculo real (Angular → Spring Boot → PostgreSQL), con los 4 KPIs, las 5 secciones de paridad, el drilldown, el filtrado integral por sede/terapeuta/protocolo/modalidad y la regresión visual estables, sin errores de consola, sin excepciones JS y sin respuestas 5xx.
