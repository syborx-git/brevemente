# GAP Analysis Report: Roles y Permisos del Dashboard (Scoping por Rol)

- **Fecha**: 2026-10-12
- **Módulo**: `dashboard` (Centro de Control)
- **Estado**: AUDITADO Y RECONCILIADO — validado por backend/frontend/BD, pendiente de implementación
- **Relacionado con**: `gap-report-dashboard.md`, `sdd-dashboard.md` (SDD-003), `e2e-report-dashboard-principal.md`

> **Contexto**: el dashboard actual se implementó con métricas **globales** y una **única vista** para todos los roles con `DASHBOARD_LEER`. Este informe define cómo cerrar el scoping por rol (quién ve qué), con las decisiones de negocio del equipo.

---

## 1. Decisiones de negocio (2026-10-12)

| # | Decisión | Detalle |
| :--- | :--- | :--- |
| 1 | **Supervisor scoped** | El supervisor (rol-005) ve las métricas **solo de sus terapeutas asignados**. Requiere crear la relación `supervisor → terapeuta` (hoy no existe). |
| 2 | **Asistente operativo** | El asistente (rol-004) ve **solo KPIs operativos** (pacientes activos, citas del día, agenda, recientes, acción dominante). **No** ve alertas clínicas (consentimiento / riesgo / pendiente clínico). |
| 3 | **Multi-rol = unión** | Un usuario multi-rol combina los ámbitos de todos sus roles (unión de conjuntos de terapeutas). Los roles administrativos prevalecen como **global**. |

> Foco actual: dashboard de **terapeuta**. Se deja **preparada** la lógica para los demás roles (no necesariamente visible en UI todavía).

---

## 2. Estado actual (inventario)

| Elemento | Estado |
| :--- | :--- |
| Permiso `DASHBOARD_LEER` (perm-012, V5) | Otorgado a rol-001, 002, 003, 004, 005. **No** a rol-006 (patient) ni rol-007 (student) → 403. |
| Métricas (`/dashboard/stats`, `/citas-hoy`, `/alertas`, `/pacientes-recientes`, `/accion-dominante`) | **Globales**: `COUNT`/listados sobre toda la clínica, sin filtro por `terapeuta_id`. |
| `DashboardApplicationService` | Inyecta `PacienteRepositoryPort` + `CitaRepositoryPort`; sin conocimiento de identidad/rol. |
| `IdentidadAutenticadaPort` (módulo `cita`) | Expone `terapeutaIds()`, `pacienteId()`, `esAdminPlataforma()`, `puedeVerAgendaCompleta()`. |
| `UsuarioAutenticado` (JWT) | Claims `sub`, `terapeutaIds`, `pacienteId`, `authorities` (roles → `ROLE_*`, permisos → códigos). |
| `terapeutaIds` en JWT | = `terapeutas.usuario_id` UNION `asignaciones_terapeuta.usuario_id` (perfil tratante + asistencias). |
| Relación supervisor→terapeuta | ❌ **No existe** en BD. La supervisión actual trata al supervisor como *evaluador global* (`SUPERVISION_EVALUAR`). |
| Frontend `dashboard.component` | `roleService` solo se usa para `currentUserName`; **sin** branching de UI por rol. |

---

## 3. Matriz de brechas (GAPs)

| ID | Tipo | Descripción | Impacto | Acción |
| :--- | :--- | :--- | :--- | :--- |
| GAP-ROLE-01 | **INCORRECT** | Métricas globales: el terapeuta ve pacientes/citas de toda la clínica. | **Alto** | Scoping por `terapeuta_id IN (terapeutaIds)` en todas las queries del dashboard. |
| GAP-ROLE-02 | **MISSING** | No existe relación supervisor → terapeuta. | **Alto** | Migración V10: tabla `asignaciones_supervision` + semilla. |
| GAP-ROLE-03 | **INCORRECT** | El asistente ve alertas clínicas (consentimiento/riesgo/pendiente). | **Medio** | Ocultar fuentes clínicas de `/alertas` y de las cards para rol-004. |
| GAP-ROLE-04 | **MISSING** | Sin vistas/ocultación por rol en frontend. | **Medio** | `roleService` debe ocultar secciones según rol (asistente sin alertas; paciente/alumno → otras vistas). |
| GAP-ROLE-05 | **MISSING** | Multi-rol sin combinación de ámbitos (unión). | **Medio** | Resolver ámbito como unión de conjuntos de terapeutas; roles admin → global. |
| GAP-ROLE-06 | **INCORRECT** | "Acción Operativa Dominante" es global (primera cita de hoy de cualquier terapeuta). | **Medio** | Scoped igual que `citas-hoy`. |

---

## 4. Diseño propuesto

### 4.1 Migración Flyway `V10__introduce_asignaciones_supervision.sql`

```sql
CREATE TABLE IF NOT EXISTS asignaciones_supervision (
    id                      VARCHAR(36) PRIMARY KEY,
    supervisor_usuario_id   VARCHAR(36) NOT NULL REFERENCES usuarios(id)  ON DELETE CASCADE,
    terapeuta_id            VARCHAR(36) NOT NULL REFERENCES terapeutas(id) ON DELETE CASCADE,
    created_at              TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ux_asignacion_supervision UNIQUE (supervisor_usuario_id, terapeuta_id)
);
-- El UNIQUE compuesto ya sirve el lookup por supervisor (columna líder); solo se añade el inverso.
CREATE INDEX IF NOT EXISTS idx_asignaciones_supervision_terapeuta
    ON asignaciones_supervision (terapeuta_id);
```

Semilla (IDs verificados en V4):

```sql
INSERT INTO asignaciones_supervision (id, supervisor_usuario_id, terapeuta_id) VALUES
    ('as-sup-001', 'usr-003', 'ter-001'),  -- Isabel Cárdenas (supervisor) → Dra. Sofía
    ('as-sup-002', 'usr-003', 'ter-002'),  -- Isabel Cárdenas (supervisor) → Mtro. Alejandro
    ('as-sup-003', 'usr-004', 'ter-001')   -- Mtro. Alejandro (terapeuta+supervisor) → Dra. Sofía
ON CONFLICT (supervisor_usuario_id, terapeuta_id) DO NOTHING;
```

### 4.2 Resolución de ámbito (backend)

Nuevo puerto/componente en `dashboard` (o reutilizar `supervision`), que produce un `AlcanceDashboard`:

```text
AlcanceDashboard { tipo: GLOBAL | SCOPED, terapeutaIds: List<String>, puedeVerAlertasClinicas: boolean }
```

Lógica de resolución (por authorities del principal):

| Rol detectado | Ámbito | `terapeutaIds` visibles |
| :--- | :--- | :--- |
| `ROLE_ADMIN_PLATFORM` o `ROLE_ADMIN_CLINICAL` | **GLOBAL** | — (sin filtro) |
| `ROLE_THERAPIST` | scoped | `principal.terapeutaIds()` (propios) |
| `ROLE_SUPERVISOR` | scoped | `findTerapeutasSupervisados(principal.sub())` (tabla V10) |
| `ROLE_ASSISTANT` | scoped | `principal.terapeutaIds()` (asignados) |
| multi-rol | unión | unión de los conjuntos anteriores; admin → global |

> Regla: si el usuario es multi-rol **sin** rol admin pero con `ROLE_SUPERVISOR` + `ROLE_THERAPIST`, el conjunto visible = `terapeutaIds propios ∪ terapeutas supervisados`.
> `puedeVerAlertasClinicas` = tiene `ROLE_THERAPIST` **o** `ROLE_SUPERVISOR` **o** `ROLE_ADMIN_PLATFORM` **o** `ROLE_ADMIN_CLINICAL`. **No** se define como "tiene ROLE_ASSISTANT" (un usuario therapist+assistant sí ve alertas).

### 4.3 Queries scoped (extensión de puertos)

Extender las firmas existentes para aceptar filtro opcional de terapeutas (`null`/vacío = global):

```text
PacienteRepositoryPort +=
  long countByStatus(String status, Collection<String> terapeutaIds)
  long countByRiskLevelIn(Collection<String> niveles, Collection<String> terapeutaIds)
  List<Paciente> findByRiskLevelIn(Collection<String> niveles, Collection<String> terapeutaIds)
  List<Paciente> findByStatus(String status, Collection<String> terapeutaIds)
  List<Paciente> findRecientes(int limit, Collection<String> terapeutaIds)
  long countConConsentimientoPendiente(Collection<String> terapeutaIds)
  List<Paciente> findConConsentimientoPendiente(Collection<String> terapeutaIds)

CitaRepositoryPort +=
  long countByDia(LocalDate dia, Collection<String> estados, Collection<String> terapeutaIds)
  List<Cita> findByDia(LocalDate dia, Collection<String> estados, Collection<String> terapeutaIds)
  Optional<Cita> findProximaDeHoy(LocalDate dia, Collection<String> estados, Collection<String> terapeutaIds)
```

En JPA, con **rama explícita** GLOBAL vs SCOPED (evitar `IN ()` con lista vacía, que genera error SQL):
- `pacientes`: `PacienteJpaEntity` expone `@ManyToOne TerapeutaJpaEntity terapeuta` (no hay campo plano `terapeutaId`) → filtro `p.terapeuta.id IN :ids` (JPQL) o derivada `...AndTerapeuta_IdIn(...)`.
- `citas`: `CitaJpaEntity.terapeutaId` (plano) → `e.terapeutaId IN :ids`.
- Si `SCOPED` con `ids` vacío → devolver `0`/lista vacía directamente, sin ejecutar la query.

### 4.4 Asistente operativo (GAP-ROLE-03)

- En `DashboardApplicationService.listarAlertas()`: si `puedeVerAlertasClinicas == false`, devolver **lista vacía**.
- En `obtenerStats()`: si `puedeVerAlertasClinicas == false`, poner a **0** `alertasConsentimiento`, `alertasRiesgo` y `pendientesClinicos`.
- **Fuga clínica por DTO**: `PacienteResponseDTO` expone `riskLevel`, `motif`, `sessionFrequency`, `capacidadConsentimiento`, `consentimientoRepresentanteFirmado`; `AccionDominanteResponseDTO.consentimientoFirmado`. Para el asistente, usar **DTO operativo** (o enmascarar esos campos a `null`) en `/pacientes-recientes` y `/accion-dominante`.
- Mantiene: `pacientesActivos`, `citasHoyCount`, `citas-hoy`, `pacientes-recientes` (mascado), `accion-dominante` (mascado) — todos scoped a sus terapeutas asignados.

### 4.5 Frontend: vistas/ocultación por rol

- `RoleStateService` ya expone `roles`, `activeRole`, `hasRole()`; añadir helpers basados en **`roles`** (conjunto completo, no `activeRole`): `esTerapeuta()`, `esSupervisor()`, `esAsistente()`, `esAdmin()`.
- Añadir `esAsistenteOperativo()` = `hasRole('assistant') && !esTerapeuta() && !esSupervisor() && !esAdmin()` (asistente puro, sin rol clínico/admin).
- `dashboard.component.html/.ts`: ocultar la card "Alertas Normativas" y el banner de alertas cuando `esAsistenteOperativo()` (envolver el `*ngFor` del banner en `<ng-container *ngIf>`; ajustar `lg:grid-cols` si quedan menos cards).
- **Guard de ruta**: `/dashboard` hoy solo tiene `authGuard` (autenticación, no autorización). Añadir verificación `DASHBOARD_LEER` (o redirigir patient/student) para que un deep link no renderice el dashboard con 403.
- Nota: `alertasRiesgo` y `pendientesClinicos` existen en `DashboardStats` pero hoy no alimentan ninguna card (campos muertos en UI); se conservan en el contrato.
- Vistas paciente/alumno (`dashboard-patient-view`, `dashboard-student-view`) quedan **fuera de esta fase** (dependen de `MiConsulta`/`Campus`), pero la rama por rol queda lista.

---

## 5. Matriz rol → visibilidad (v1)

| Sección / KPI | admin | admin_clinical | therapist | supervisor | assistant |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Pacientes Activos | ✅ global | ✅ global | ✅ propio | ✅ supervisados | ✅ asignados |
| Citas Programadas (hoy) | ✅ global | ✅ global | ✅ propio | ✅ supervisados | ✅ asignados |
| Alertas Normativas (consentimiento) | ✅ | ✅ | ✅ propio | ✅ supervisados | ❌ |
| Alertas Riesgo / Pendiente Clínico | ✅ | ✅ | ✅ propio | ✅ supervisados | ❌ |
| Banner de alertas | ✅ | ✅ | ✅ | ✅ | ❌ |
| Agenda Inmediata (citas hoy) | ✅ global | ✅ global | ✅ propio | ✅ supervisados | ✅ asignados |
| Pacientes Recientes | ✅ global | ✅ global | ✅ propio | ✅ supervisados | ✅ asignados |
| Acción Operativa Dominante | ✅ global | ✅ global | ✅ propio | ✅ supervisados | ✅ asignados |

> patient (rol-006) y student (rol-007): sin `DASHBOARD_LEER` → 403; sus vistas viven en `MiConsulta`/`Campus` (módulos no portados).

---

## 6. Plan de implementación (fases)

### Fase A — Datos y scoping backend (núcleo)
1. Migración `V10__introduce_asignaciones_supervision.sql` + semilla (`ON CONFLICT` sobre el par único).
2. Puerto driven `SupervisionAsignacionPort` + adapter JPA (`findTerapeutasSupervisados`).
3. `DashboardScopeResolver` → `AlcanceDashboard { tipo, terapeutaIds, puedeVerAlertasClinicas }` (unión/global, guarda de lista vacía).
4. Extender puertos/repos JPA con variantes scoped (pacientes por `terapeuta.id`, citas por `terapeutaId`; rama GLOBAL vs SCOPED).
5. Asistente: `obtenerStats()` a 0 en alertas + `listarAlertas()` vacío + DTO operativo/mascado.
6. Tests unit de la resolución de ámbito (multi-rol, lista vacía) + scoping de queries.

### Fase B — Frontend
7. Helpers de rol en `RoleStateService` (basados en `roles`) + `esAsistenteOperativo()`.
8. Ocultar banner/card de alertas para asistente operativo + guard de ruta `/dashboard` (`DASHBOARD_LEER`).
9. E2E por rol (login therapist/supervisor/asistente) + regresión visual.

### Fase C — Vistas paciente/alumno (posterior)
10. Depende de `MiConsulta` y `Campus` (Bloques no portados).

---

## 7. Riesgos y decisiones pendientes

| # | Riesgo / pendiente | Nota |
| :--- | :--- | :--- |
| 1 | El supervisor puro (`usr-003`) tiene `terapeutaIds` vacío en el JWT | Su alcance se resuelve **exclusivamente** desde `asignaciones_supervision` (V10), no desde el claim. |
| 2 | Semilla de supervisión debe coincidir con la realidad de negocio | Verificar qué terapeutas supervisa cada supervisor antes de sembrar (propuesta: usr-003 → ter-001/002; usr-004 → ter-001). |
| 3 | El asistente y "contenido clínico" | `pacientes-recientes` muestra nombres/CURP (administrativo, permitido). Si se decide ocultar también eso, es un ajuste menor. |
| 4 | Multi-rol administrador | `ROLE_ADMIN_PLATFORM`/`ROLE_ADMIN_CLINICAL` siempre = global (mayor privilegio). |
| 5 | Rendimiento de `IN (:ids)` con listas grandes | Índices `idx_pacientes_terapeuta` e `idx_citas_terapeuta_fecha` ya existen (V3/V6). |
| 6 | `IN ()` con lista vacía genera error SQL | Rama explícita: SCOPED + ids vacío → devolver `0`/vacío sin ejecutar `IN`. |
| 7 | Fuga clínica al asistente vía DTO | `PacienteResponseDTO`/`AccionDominanteResponseDTO` exponen campos clínicos → DTO operativo o máscara para rol-004. |
| 8 | `puedeVerAlertasClinicas` en multi-rol | Se determina por tener rol clínico/admin (therapist/supervisor/admin), no por "ser asistente". |
| 9 | Pacientes con `terapeuta_id NULL` (V3 lo permite) | Quedan fuera de toda vista scoped; solo GLOBAL los ve. Comportamiento esperado a documentar. |
| 10 | Auto-supervisión (`usr-004 → ter-002`) | Sin guarda en BD (requeriría trigger/CHECK con join); se controla por semilla y regla de negocio. |
| 11 | `@PreAuthorize` solo exige `DASHBOARD_LEER` | El scoping vive en el servicio y es no-bypasseable; todo endpoint futuro pasa por el resolver. |

---

## 8. Veredicto

✅ **PROPUESTA ACEPTADA** — Se documenta el scoping por rol del dashboard con 6 brechas (GAP-ROLE-01..06), la migración V10 y la matriz de visibilidad. El foco de implementación inmediata es el **terapeuta**; el resto de roles quedan con la lógica lista para activarse por fase.
