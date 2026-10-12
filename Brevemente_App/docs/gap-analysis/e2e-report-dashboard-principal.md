# E2E Report: Módulo Dashboard — Centro de Control (Validación de Oráculo y Regresión Visual)

- **Fecha**: 2026-10-12
- **Módulo**: `dashboard` (Centro de Control / Panel Principal)
- **Suite**: `Brevemente_App/frontend/tests/e2e/dashboard-principal.spec.ts`
- **Oráculo**: Angular 18 (`http://localhost:3000`) → Spring Boot 3.3.3 (`/api/v1`, puerto 8080) → PostgreSQL 17 (`brevemente_db`)
- **Estado**: ✅ **APROBADO**

---

## 1. Resumen de ejecución

| Métrica | Resultado |
| :--- | :--- |
| Casos de prueba | 2 |
| Pasaron | **2 / 2 (100%)** |
| Fallaron | 0 |
| Errores de consola (JS) | 0 |
| Excepciones JS no capturadas | 0 |
| Errores HTTP 500 | 0 |
| Regresión visual | ✅ Sin diferencias (`maxDiffPixelRatio: 0.01`) |
| Duración total | ~7.5 s (1 worker, Chromium) |

Se ejecutó en **dos pasadas**: la primera con `--update-snapshots` para generar el baseline de regresión visual (y corregir un selector ambiguo en strict mode); la segunda con comparación directa contra el baseline ya generado. Resultado final: **2/2 aprobados**.

---

## 2. Detalle de casos de prueba

### TC-DASH-01 — Carga y oráculo de datos reales desde Spring Boot/PostgreSQL ✅
- Navega a `/dashboard` con sesión JWT autenticada (`sofia.ramirez@brevemente.org`).
- Verifica el título **"Panel Principal"** y la identidad real del terapeuta (**Dra. Sofía Ramírez Lozano**).
- Verifica los **3 KPIs** del Centro de Control: `Pacientes Activos`, `Citas Programadas`, `Alertas Normativas`.
- Verifica la **retirada de la card "Horas Supervisión"** (GAP-DASH-09): el texto ya no existe en el DOM.
- Verifica la **alerta normativa real** servida por `/api/v1/dashboard/alertas`: *"Consentimiento informado pendiente"* (pac-001, menor sin firma del representante).
- Verifica los **pacientes recientes** servidos por `/api/v1/dashboard/pacientes-recientes`: aparece `Mateo Herrera Santos`.

### TC-DASH-02 — Regresión Visual del Panel Principal con Oráculo Real ✅
- Captura `dashboard-principal.png` a `fullPage`.
- Compara contra el baseline con `maxDiffPixelRatio: 0.01` (sin diferencias).

---

## 3. Monitoreo de errores de consola y red

Siguiendo el protocolo de la suite:

- **`page.on('console')`**: registra errores de tipo `error`, ignorando `favicon.ico` y los "Failed to load resource" 4xx (p. ej. 401 esperados).
- **`page.on('pageerror')`**: registra excepciones JavaScript no capturadas.
- **`page.on('response')`**: registra cualquier respuesta HTTP ≥ 500.

**Resultado**: 0 errores de consola, 0 excepciones JS y 0 respuestas 5xx durante toda la ejecución. El `afterEach` fallaría la suite ante cualquier incidencia.

---

## 4. Regresión visual

- **Baseline**: `tests/e2e/dashboard-principal.spec.ts-snapshots/dashboard-principal-chromium-win32.png` (generado en la primera pasada con `--update-snapshots`).
- **Comparación**: sin diferencias de píxeles (`maxDiffPixelRatio: 0.01`, `fullPage: true`).

---

## 5. Observaciones

- **Integración backend real**: el dashboard consume los endpoints `/api/v1/dashboard/{stats,citas-hoy,alertas,pacientes-recientes}` con `dashboardBackend: true` (feature flag activado en `environment.ts`). Ya no depende del mock de localStorage.
- **Contrato unificado**: `DashboardStats` quedó alineado con `DashboardStatsResponseDTO` (`pacientesActivos`, `citasHoyCount`, `alertasConsentimiento`, `alertasRiesgo`, `pendientesClinicos`) y `UrgentAlert.tipo` sin `SUPERVISION`.
- **Migración Flyway V9** (`idx_pacientes_created_at`, `idx_citas_fecha_estado`) aplicada durante el arranque del backend (validado en logs: `Migrating schema "public" to version "9 - dashboard indexes"`).
- **"Citas de hoy" en 0**: la semilla V6 contiene citas fechadas 2026-10-07/08 (no hoy 2026-10-12), por lo que el KPI "Citas Programadas" y la "Agenda Inmediata" muestran 0/vacío. Comportamiento correcto; se recomienda una semilla dinámica de citas para el día actual en una iteración futura.
- **Zona horaria**: el backend calcula "hoy" con `ZoneId.of("America/Mexico_City")` y filtra por rango `[hoy, mañana)` sobre la columna cruda (sin `AT TIME ZONE` en el `WHERE`).
- **Ajuste de selector (no es bug de app)**: en la primera pasada, `getByText('Panel Principal')` provocó violación de strict mode (2 coincidencias: enlace del sidebar e `h1`). Se resolvió usando `getByRole('heading', ...)` y `.first()` en los textos ambiguos.
- El backend quedó **corriendo en el puerto 8080** (PID 26696) y el frontend en **http://localhost:3000** (dev server con proxy `/api` → 8080).

---

## 6. Veredicto final

✅ **APROBADO** — El módulo Dashboard opera end-to-end contra el oráculo real (Angular → Spring Boot → PostgreSQL), sin errores de consola, sin excepciones JS, sin respuestas 5xx y con regresión visual estable.
