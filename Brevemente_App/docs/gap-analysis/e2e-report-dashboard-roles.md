# E2E Report: Módulo Dashboard — Scoping por Rol (Validación de Oráculo y Regresión Visual)

- **Fecha**: 2026-10-12
- **Módulo**: `dashboard` (Centro de Control — scoping por rol)
- **Suite**: `Brevemente_App/frontend/tests/e2e/dashboard-roles.spec.ts`
- **Oráculo**: Angular 18 (`http://localhost:3000`) → Spring Boot 3.3.3 (`/api/v1`, puerto 8080) → PostgreSQL 17 (`brevemente_db`)
- **Estado**: ✅ **APROBADO**

---

## 1. Resumen de ejecución

| Métrica | Resultado |
| :--- | :--- |
| Casos de prueba | 4 |
| Pasaron | **4 / 4 (100%)** |
| Fallaron | 0 |
| Errores de consola (JS) | 0 |
| Excepciones JS no capturadas | 0 |
| Errores HTTP 500 | 0 |
| Regresión visual | ✅ Sin diferencias (`maxDiffPixelRatio: 0.01`) |
| Duración total | ~12 s (1 worker, Chromium) |

Se ejecutó en **dos pasadas**: la primera con `--update-snapshots` (genera el baseline de regresión visual); la segunda con comparación contra el baseline. Ambas **4/4**.

---

## 2. Detalle de casos de prueba

### TC-ROLE-01 — Terapeuta (rol-003) ve solo sus pacientes y sus alertas ✅
- Login `sofia.ramirez@brevemente.org` (ter-001).
- Ve los KPIs `Pacientes Activos` y `Alertas Normativas`.
- Ve la alerta de consentimiento **"Consentimiento informado pendiente"** (pac-001, en su scope).
- Pacientes recientes: **solo los suyos** → `Mateo Herrera Santos` visible; **`Roberto Valdés Garza` (ter-002) NO visible** → scoping correcto.

### TC-ROLE-02 — Asistente (rol-004) ve solo KPIs operativos, sin alertas clínicas ✅
- Login `asistente.agenda@brevemente.org`.
- Ve los KPIs operativos `Pacientes Activos` y `Citas Programadas`.
- **Sin** card `Alertas Normativas` ni banner de consentimiento → modo operativo correcto.

### TC-ROLE-03 — Supervisor (rol-005) ve métricas de sus terapeutas asignados ✅
- Login `isabel.cardenas@brevemente.org` (supervisa ter-001 y ter-002).
- Ve KPIs + alertas (el supervisor sí ve clínica).
- Ve pacientes de **ambos** terapeutas: `Mateo Herrera Santos` (ter-001) y `Roberto Valdés Garza` (ter-002) → ámbito por supervisión correcto.

### TC-ROLE-04 — Regresión Visual del estado Asistente ✅
- Captura `dashboard-assistant.png` a `fullPage` (banner oculto + grid reducida a 2 cards).
- Compara contra baseline con `maxDiffPixelRatio: 0.01` (sin diferencias).

---

## 3. Monitoreo de errores de consola y red

Protocolo estándar de la suite:
- `page.on('console')` → errores de tipo `error`, ignorando `favicon.ico` y 4xx.
- `page.on('pageerror')` → excepciones JS no capturadas.
- `page.on('response')` → respuestas HTTP ≥ 500.

**Resultado**: 0 errores de consola, 0 excepciones JS, 0 respuestas 5xx. El `afterEach` fallaría la suite ante cualquier incidencia.

---

## 4. Regresión visual

- **Baseline**: `tests/e2e/dashboard-roles.spec.ts-snapshots/dashboard-assistant-chromium-win32.png` (generado en la primera pasada).
- **Comparación**: sin diferencias (`maxDiffPixelRatio: 0.01`, `fullPage: true`).

---

## 5. Observaciones

- **Scoping por rol operativo**: la resolución de ámbito (`DashboardScopeResolver`) filtra por `terapeuta_id` en backend; el terapeuta ya no ve pacientes de otros terapeutas.
- **Asistente operativo**: `obtenerStats()` devuelve 0 en alertas y `listarAlertas()` vacío; el frontend oculta la card y el banner vía `esAsistenteOperativo()`.
- **Supervisión scoped**: la nueva tabla `asignaciones_supervision` (V10) alimenta el ámbito del supervisor. Flyway aplicó V10 durante el arranque (`Migrating schema "public" to version "10 - introduce asignaciones supervision"`).
- **Identidad por rol verificada**: therapist (`sofia`), assistant (`asistente.agenda`), supervisor (`isabel`), todos con `demo123`.
- El backend quedó **corriendo en el puerto 8080** (PID 29284, 18 repos JPA) y el frontend en **http://localhost:3000**.

---

## 6. Veredicto final

✅ **APROBADO** — El scoping por rol del dashboard opera end-to-end contra el oráculo real: terapeuta (solo sus pacientes), supervisor (sus terapeutas asignados) y asistente (solo operativo, sin clínica), sin errores de consola, sin 5xx y con regresión visual estable.
