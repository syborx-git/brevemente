# GAP Analysis Report: Módulo Dashboard (Centro de Control)

- **Fecha**: 2026-10-12
- **Módulo**: `dashboard` (Angular) / `Dashboard.tsx` (demo React — **fuente de verdad**)
- **Estado**: AUDITADO (READ-ONLY)
- **Rutas auditadas**:
  - Demo: `brevemente_demo/src/pages/Dashboard.tsx`
  - Angular: `Brevemente_App/frontend/src/app/modules/dashboard/` (componente, puerto, adapters HTTP/localStorage)
  - Backend: sin controlador de dashboard (verificado)

> **Contexto**: el dashboard Angular está **hardcodeado** (`dashboardBackend: false` → adapter localStorage con `mockData.ts`, `horasSupervisadas = 34` literal) y su adapter HTTP apunta a `/api/v1/dashboard/*`, que **no existe en el backend**. Este informe contrasta la demo (fuente de verdad) contra la app real y define qué implementar.

> **Decisiones del equipo (2026-10-12)**:
> 1. **NO se implementa** el selector de doctor (era solo para la demo).
> 2. **NO se implementa** el botón "Demo Guiada".
> 3. El botón **LEVA ya existe** en la app → no se cuenta como faltante.
> 4. **SE QUITA** la card "Horas Supervisión" (sin fuente de datos real).
> 5. **SE MANTIENEN** los botones de cabecera "Nuevo Paciente" y "Agendar Cita".

---

## 1. Inventario de componentes auditados

| Componente | Estado |
| :--- | :--- |
| Demo `Dashboard.tsx` | Centro de Control completo: cabecera + filtros + gráfica clínica + alerta de mayoría de edad + 4 KPIs + acción dominante + drilldowns + **3 vistas por rol** (paciente, alumno, terapeuta/admin) |
| Angular `dashboard.component.html/.ts` | Versión mínima: cabecera (2 botones) + 1 banner de alerta + 4 cards + agenda inmediata + pacientes recientes. **Una sola vista para todos los roles.** |
| `ports/dashboard.repository.ts` | Puerto hexagonal correcto (`obtenerStats`, `obtenerCitasHoy`, `obtenerAlertasUrgentes`, `obtenerPacientesRecientes`) |
| `adapters/dashboard-localstorage.adapter.ts` | Mock: calcula stats desde `mockData.ts`; `horasSupervisadas: 34` hardcodeado |
| `adapters/dashboard-http.adapter.ts` | Apunta a `/api/v1/dashboard/{stats,citas-hoy,alertas,pacientes-recientes}` |
| Backend | ❌ Sin `DashboardController` ni endpoints |

---

## 2. Contraste demo vs Angular

### 2.1 ✅ Lo que tenemos (coincide con la demo)

| Angular | Demo |
| :--- | :--- |
| Card "Pacientes Activos" | "Pacientes Activos" |
| Card "Citas Programadas" | "Citas Programadas" |
| Banner de alerta de consentimiento | Alertas (consentimiento/riesgo) |
| "Agenda Inmediata" | Listado de citas |
| "Pacientes con Actividad Reciente" | Listado de pacientes |

> ⚠️ Aunque coinciden en nombre, varias métricas se calculan **distinto** (ver §2.5).

### 2.2 ❌ Lo que falta (a implementar)

| # | Funcionalidad demo | Nota / dependencia |
| :---: | :--- | :--- |
| 1 | **Filtros del Centro de Control**: modalidad, sede, periodo (hoy/semana/mes), terapeuta, protocolo + "Limpiar filtros" | ⚠️ `sede` y `protocolo` dependen de datos que aún no existen en backend (ver §4) |
| 2 | **Perspectiva Clínica Unificada** (gráficas con selector): citas por mes, distribución por fase TBE, casos por protocolo | ⚠️ "fase TBE" y "protocolo" dependen del Motor de Protocolos (Bloque C) |
| 3 | **Alerta de Mayoría de Edad** (reconsentimiento autónomo al cumplir 18) | Depende del Bloque B (reconsentimiento diferido) |
| 4 | **Drilldowns**: clic en KPI → modal de detalle (citas, pacientes, consentimientos, riesgo) | |
| 5 | **Acción Operativa Dominante**: próxima consulta destacada (protocolo, modalidad, duración, intake) | |
| 6 | **Anillo de progreso** (capacidad %) + **semáforo de riesgo** + badge "REQUERIDO" | |
| 7 | **Vistas por rol**: paciente (Botón de Crisis, tareas, evolución, LEVA Paciente), alumno (campus), terapeuta/admin (Centro de Control) | Angular tiene **una sola vista** |

> **Excluidos por decisión del equipo**: selector de doctor (demo-only), botón "Demo Guiada". El botón LEVA ya existe.

### 2.3 ➕ Lo que sobra (a eliminar)

| # | Elemento Angular | Razón |
| :---: | :--- | :--- |
| 1 | Card **"Horas Supervisión"** | No existe en el panel del terapeuta de la demo y **no tiene fuente de datos** (el `34` es inventado) |

### 2.4 🟢 Lo que se mantiene (decisión del equipo)

- Botones de cabecera **"Nuevo Paciente"** y **"Agendar Cita"**: se conservan (funcionan bien en el dashboard, enlazan a `/pacientes` y `/agenda`).

### 2.5 ⚠️ Mismatches semánticos (mismo nombre, cálculo distinto)

| Métrica | Angular hoy | Demo (verdad) |
| :--- | :--- | :--- |
| Pacientes Activos | `patients.length` (todos) | solo `status === 'activo'` |
| Citas Programadas | todas las no-canceladas | **solo las de hoy** (`fecha = hoy`) |
| Alertas | "Normativas" = consentimiento pendiente | separa **"Pendientes Clínicos"** (`status = pendiente`) y **"Alertas de Riesgo"** (riesgo medio/alto) |

---

## 3. Matriz de brechas (GAPs)

| ID | Tipo | Descripción | Impacto | Acción propuesta |
| :--- | :--- | :--- | :--- | :--- |
| GAP-DASH-01 | **MISSING** | No existe backend de dashboard; el frontend usa mock (`dashboardBackend: false`). | **Alto** | Crear módulo hexagonal `dashboard` + `DashboardController` (stats/citas-hoy/alertas/pacientes-recientes) y activar `dashboardBackend: true`. |
| GAP-DASH-02 | **MISSING** | Filtros del Centro de Control (modalidad, sede, periodo, terapeuta, protocolo). | **Medio** | Añadir filtros; `modalidad` y `periodo` listos ya; `sede` y `protocolo` requieren datos nuevos (§4). |
| GAP-DASH-03 | **MISSING** | Perspectiva Clínica Unificada (3 gráficas). | **Medio** | "Citas por mes" listo ya; "fase TBE" y "casos por protocolo" dependen del Motor de Protocolos. |
| GAP-DASH-04 | **MISSING** | Alerta de Mayoría de Edad (reconsentimiento). | **Medio** | Depende del Bloque B (reconsentimiento autónomo). |
| GAP-DASH-05 | **MISSING** | Drilldowns (detalle por KPI). | **Bajo** | Modales de detalle. |
| GAP-DASH-06 | **MISSING** | Acción Operativa Dominante (próxima consulta). | **Medio** | Derivar de `citas` (primera confirmada/pendiente de hoy). |
| GAP-DASH-07 | **MISSING** | Vistas por rol (paciente/alumno/terapeuta). | **Medio** | Segregar el dashboard por `roleService` (la vista de paciente y alumno son fases futuras). |
| GAP-DASH-08 | **INCORRECT** | Métricas con semántica distinta a la demo (activos, citas hoy, alertas). | **Alto** | Alinear el cálculo a la demo. |
| GAP-DASH-09 | **SCOPE** | Card "Horas Supervisión" a eliminar. | **Nulo** | Quitar la card (decisión del equipo). |
| GAP-DASH-10 | **SCOPE** | Selector de doctor y "Demo Guiada": NO se implementan. | **Nulo** | Fuera de alcance (decisión del equipo). |

---

## 4. Recomendaciones para implementación (orden priorizado)

### Fase inmediata (tiene fuente de datos real)
1. **Backend `dashboard`** (GAP-DASH-01): endpoints con datos reales:
   - `stats`: `totalPacientes` (COUNT), `citasHoyCount` (citas de hoy), `alertasPendientes` (consentimiento pendiente — regla ya existente en `PacienteConsentimientoAdapter`), `pacientesRecientes` (últimos N por `created_at`). **Sin** `horasSupervisadas`.
   - `citas-hoy`, `alertas`, `pacientes-recientes`.
2. **Alinear métricas** a la demo (GAP-DASH-08): activos = `status='activo'`, citas = hoy, alertas separadas (pendientes clínicos vs riesgo).
3. **Activar** `dashboardBackend: true` (dev + prod).
4. **Quitar** la card "Horas Supervisión" (GAP-DASH-09).
5. **Añadir** la "Acción Operativa Dominante" (GAP-DASH-06) y el anillo/semáforo (parte de GAP-DASH-06/GAP-DASH-08).

### Fase posterior (depende de otros bloques)
6. **Filtros** (GAP-DASH-02): `modalidad` y `periodo` ya son viables; `sede` (requiere columna `sede` en pacientes/terapeutas) y `protocolo` (requiere Motor de Protocolos).
7. **Gráficas de fase/protocolo** (GAP-DASH-03) y **alerta de mayoría de edad** (GAP-DASH-04) — dependen de los Bloques B/C.
8. **Vistas por rol** (GAP-DASH-07): la del paciente conecta con `MiConsulta`; la del alumno con `Campus` (módulos aún no portados).

> **Regla**: el dashboard debe construirse sobre el **backend real** (principio de reutilización hexagonal), no sobre mocks. Las métricas sin fuente de datos se posponen hasta que existan sus dominios.
