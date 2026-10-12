# SDD-004: Software Design Document — Dashboard: Scoping por Rol y Permisos

- **Módulo**: `dashboard` (Centro de Control)
- **Código SDD**: `SDD-004`
- **Versión**: 1.0.0 *(diseño técnico, pendiente de implementación)*
- **Fecha**: 2026-10-12
- **Estado**: DISEÑADO — basado en `gap-report-dashboard-roles.md` (AUDITADO Y RECONCILIADO)
- **Alineación Normativa**: ADR-001 (Hexagonal/SDOP), ADR-002 (Dual Adapters), ADR-003 (Flyway), `gap-report-dashboard-roles.md` (GAP-ROLE-01..06), `sdd-dashboard.md` (SDD-003)
- **Fuente de negocio**: decisiones del equipo (2026-10-12)

> **Regla de Oro**: integrar vía adaptador/puerto. El scoping vive en el backend (no bypasseable); el frontend solo **oculta** visualmente según rol.

> **Decisiones del equipo (2026-10-12)**:
> 1. **Supervisor scoped**: el supervisor (rol-005) ve solo las métricas de sus **terapeutas asignados** (nueva tabla `asignaciones_supervision`).
> 2. **Asistente operativo**: el asistente (rol-004) ve **solo KPIs operativos**; sin alertas clínicas (consentimiento/riesgo/pendiente).
> 3. **Multi-rol = unión**: el ámbito es la **unión** de los conjuntos de terapeutas de todos los roles; los roles admin prevalecen como **global**.

> Foco de implementación: dashboard de **terapeuta**; el resto de roles quedan con la lógica **lista** para activarse por fase.

---

## 0. Propósito y alcance

Cerrar el scoping por rol del dashboard: hoy las métricas son **globales** (todo terapeuta ve todos los pacientes/citas) y hay **una sola vista** para todos los roles con `DASHBOARD_LEER`. Este SDD define la resolución de ámbito por rol, la relación supervisor→terapeuta, el filtrado de queries, el modo operativo del asistente y la ocultación en UI.

### Alcance por fases

| Fase | Contenido |
| :--- | :--- |
| **A** (datos + backend) | Migración V10, `SupervisionAsignacionPort`, `DashboardScopeResolver`, scoping de queries, asistente operativo, tests |
| **B** (frontend) | Helpers de rol, ocultación de alertas para asistente, guard de ruta `/dashboard`, E2E por rol |
| **C** (posterior) | Vistas paciente/alumno (dependen de `MiConsulta`/`Campus`, no portados) |

---

## 1. Capa de datos — `jarvis-database`

### 1.1 Migración Flyway `V10__introduce_asignaciones_supervision.sql`

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

Semilla (IDs verificados en V4; **confirmada por el equipo**):

```sql
INSERT INTO asignaciones_supervision (id, supervisor_usuario_id, terapeuta_id) VALUES
    ('as-sup-001', 'usr-003', 'ter-001'),  -- Isabel Cárdenas (supervisor) → Dra. Sofía
    ('as-sup-002', 'usr-003', 'ter-002'),  -- Isabel Cárdenas (supervisor) → Mtro. Alejandro
    ('as-sup-003', 'usr-004', 'ter-001')   -- Mtro. Alejandro (terapeuta+supervisor) → Dra. Sofía
ON CONFLICT (supervisor_usuario_id, terapeuta_id) DO NOTHING;
```

> Notas: la FK es por `usuarios.id` (Isabel es supervisor puro sin perfil terapeuta). No hay guarda anti auto-supervisión en BD (se controla por semilla/negocio). Pacientes con `terapeuta_id NULL` quedan fuera de toda vista scoped (solo GLOBAL).

---

## 2. Backend — `jarvis-backend`

### 2.1 Resolución de ámbito

Nuevo componente `DashboardScopeResolver` (`@Component`, módulo `dashboard`) que produce:

```text
AlcanceDashboard {
    TipoAlcance tipo;            // GLOBAL | SCOPED
    List<String> terapeutaIds;   // vacío cuando GLOBAL
    boolean puedeVerAlertasClinicas;
}
```

**Acceso a identidad** (el resolver no lee `SecurityContextHolder` directamente — ADR-001): extender `IdentidadAutenticadaPort` con `String sub()` y `boolean tieneRol(String rol)`, o crear un `DashboardIdentidadPort` propio que exponga `sub()`, `tieneRol(...)` y `terapeutaIds()`.

Lógica (por `authorities` del principal — coinciden con `ROLE_*` del `JwtAuthFilter`):

| Condición | Ámbito | `terapeutaIds` |
| :--- | :--- | :--- |
| `ROLE_ADMIN_PLATFORM` **o** `ROLE_ADMIN_CLINICAL` | **GLOBAL** | — |
| en otro caso | **SCOPED** | unión **deduplicada** (`Set`) de: `principal.terapeutaIds()` (si therapist/assistant) ∪ `findTerapeutasSupervisados(sub)` (si supervisor) |

`puedeVerAlertasClinicas` = tiene `ROLE_THERAPIST` **o** `ROLE_SUPERVISOR` **o** `ROLE_ADMIN_PLATFORM` **o** `ROLE_ADMIN_CLINICAL`.

> **No** se define como "tiene `ROLE_ASSISTANT`": un usuario therapist+assistant sí ve alertas. Si es SCOPED y la unión queda vacía → devolver métricas 0/vacío (sin ejecutar `IN`). Cualquier rol fuera de {admin, therapist, assistant, supervisor} → SCOPED vacío.

### 2.2 Puerto de salida `SupervisionAsignacionRepositoryPort`

```text
// dashboard/application/ports/out/SupervisionAsignacionRepositoryPort.java
List<String> findTerapeutasSupervisados(String supervisorUsuarioId);
```

Implementado por `SupervisionAsignacionPersistenceAdapter` sobre la tabla V10:
- `SupervisionAsignacionJpaEntity` (`@Entity`, `@Table("asignaciones_supervision")`).
- `SpringDataSupervisionAsignacionRepository` con query derivada `findBySupervisorUsuarioId(...)`.

> Ubicación: puerto/entidad en el módulo `dashboard` (válido en hexagonal). Si `supervision` necesita la misma relación en el futuro, extraer a un puerto compartido.

### 2.3 Scoping de queries (extensión de puertos)

Se extienden los puertos existentes con variantes scoped; la rama **GLOBAL** reutiliza los métodos actuales (sin filtro) y la rama **SCOPED** filtra por terapeuta:

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

En JPA (rama SCOPED):
- `pacientes`: `PacienteJpaEntity` expone `@ManyToOne TerapeutaJpaEntity terapeuta` → filtro `p.terapeuta.id IN :ids` (JPQL) o derivada `...AndTerapeuta_IdIn(...)`.
- `citas`: `CitaJpaEntity.terapeutaId` (plano) → `e.terapeutaId IN :ids`.

### 2.4 Servicio de aplicación

`DashboardApplicationService` resuelve el `AlcanceDashboard` **una vez por request** y lo aplica a los 5 casos de uso:

- `obtenerStats()`: si `puedeVerAlertasClinicas == false` → `alertasConsentimiento/alertasRiesgo/pendientesClinicos = 0`.
- `listarAlertas()`: si `puedeVerAlertasClinicas == false` → lista vacía.
- `citas-hoy`, `pacientes-recientes`, `accion-dominante`: filtradas por `terapeutaIds` (si SCOPED).

### 2.5 Asistente operativo — DTO sin fuga clínica

`PacienteResponseDTO` y `AccionDominanteResponseDTO` exponen campos clínicos. Para `puedeVerAlertasClinicas == false`:

- `/pacientes-recientes` → `PacienteResumenOperativoDTO { id, name, curp, edadCalculada }` (sin `riskLevel`, `motif`, `sessionFrequency`, `capacidadConsentimiento`, `consentimientoRepresentanteFirmado`).
- `/accion-dominante` → `consentimientoFirmado = null` y `intakeListo = null` (o DTO operativo equivalente).

> ⚠️ **Dependencia de contrato con frontend** (§3.4): `Patient.capacidadConsentimiento` es **obligatorio** en `clinical.types.ts` y `dashboard.component.html` accede a `p.capacidadConsentimiento.estado` sin guarda. El DTO lean exige a la vez: (a) render defensivo en el template y (b) el tipo dedicado `PacienteResumen` (no debilitar `Patient`).
> Nota: `/accion-dominante` **no** lo consume hoy el frontend (`DashboardRepository` solo expone 4 métodos); la máscara es backend-only en esta fase.

---

## 3. Frontend — `jarvis-frontend`

### 3.1 Helpers de rol en `RoleStateService`

Basados en **`roles`** (conjunto completo, no `activeRole`):

```text
esTerapeuta()  { hasRole('therapist') }
esSupervisor() { hasRole('supervisor') }
esAsistente()  { hasRole('assistant') }
esAdmin()      { hasRole('admin_platform') || hasRole('admin_clinical') }
esAsistenteOperativo() { esAsistente() && !esTerapeuta() && !esSupervisor() && !esAdmin() }
```

### 3.2 Ocultación en `dashboard.component.html` (SCSS intacto)

- Banner de alertas: envolver el `*ngFor` en `<ng-container *ngIf="!roleService.esAsistenteOperativo()">`.
- Card "Alertas Normativas": añadir `*ngIf="!roleService.esAsistenteOperativo()"`.
- Card "Pacientes Recientes": renderizar el badge de consentimiento **solo si existe el campo** (`*ngIf="p.capacidadConsentimiento"` defensivo) — **obligatorio** para que el DTO lean del asistente no lance `TypeError`.
- Ajustar `lg:grid-cols-4` → `lg:grid-cols-3` (o condicional) cuando el asistente oculte la card de alertas.
- CTAs "Nuevo Paciente"/"Agendar Cita" quedan fuera de este SDD (dependen de `PACIENTES_CREAR`/`AGENDA_GESTIONAR`).

### 3.3 Guard de ruta `/dashboard`

`app.routes.ts` hoy solo aplica `authGuard` (autenticación). Crear un guard nuevo (p. ej. `permission.guard.ts`, `CanActivateFn`) que verifique `hasPermission('DASHBOARD_LEER')`.

- Si tiene el permiso → permite.
- Si no (patient/student) → redirigir a `/mi-consulta` (patient) o a `/` (fallback 403). Destino definitivo: `/mi-consulta` para patient y `Campus` para student cuando esos módulos se porten (Fase C).

### 3.4 Contrato compartido (sync)

- `DashboardStats` se mantiene (5 campos); el asistente recibe 0 en los 3 de alertas.
- Tipo dedicado (no debilitar `Patient`):

```ts
export interface PacienteResumen {
  id: string;
  name: string;
  curp: string;
  edadCalculada: number;
  capacidadConsentimiento?: CapacidadConsentimiento; // solo roles clínicos
}
```

- Puerto + componente: `obtenerPacientesRecientes(): Observable<PacienteResumen[]>` y `pacientesRecientes: PacienteResumen[]`.
- `Patient` es estructuralmente asignable a `PacienteResumen` → el adapter localStorage solo cambia la anotación de retorno; el HTTP adapter tipa la respuesta como `PacienteResumen[]`.

---

## 4. Matriz de visibilidad (v1)

| Sección / KPI | admin | admin_clinical | therapist | supervisor | assistant |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Pacientes Activos | ✅ global | ✅ global | ✅ propio | ✅ supervisados | ✅ asignados |
| Citas Programadas (hoy) | ✅ global | ✅ global | ✅ propio | ✅ supervisados | ✅ asignados |
| Alertas Normativas / Riesgo / Pendiente | ✅ | ✅ | ✅ propio | ✅ supervisados | ❌ |
| Banner de alertas | ✅ | ✅ | ✅ | ✅ | ❌ |
| Agenda Inmediata | ✅ global | ✅ global | ✅ propio | ✅ supervisados | ✅ asignados |
| Pacientes Recientes | ✅ global | ✅ global | ✅ propio | ✅ supervisados | ✅ asignados (lean) |
| Acción Operativa Dominante | ✅ global | ✅ global | ✅ propio | ✅ supervisados | ✅ asignados (mascado) |

---

## 5. Riesgos

| # | Riesgo | Mitigación |
| :--- | :--- | :--- |
| 1 | Supervisor puro (`usr-003`) con `terapeutaIds` vacío en JWT | Ámbito resuelto **exclusivamente** desde `asignaciones_supervision`. |
| 2 | `IN ()` con lista vacía → error SQL | Rama SCOPED + ids vacío → devolver 0/vacío sin ejecutar query. |
| 3 | Fuga clínica al asistente vía DTO | DTO lean / máscara (§2.5). |
| 4 | `puedeVerAlertasClinicas` en multi-rol | Definido por rol clínico/admin, no por "ser asistente". |
| 5 | Pacientes `terapeuta_id NULL` fuera de scope | Comportamiento esperado (solo GLOBAL los ve). |
| 6 | Auto-supervisión sin guarda en BD | Control por semilla/negocio (documentado). |
| 7 | `@PreAuthorize` solo exige `DASHBOARD_LEER` | Scoping vive en el servicio (no bypasseable); todo endpoint futuro pasa por el resolver. |

---

## 6. Plan de pruebas

**Backend**
- `DashboardScopeResolverTest` (unit): GLOBAL por admin_platform y admin_clinical (explícitos); SCOPED unión therapist+supervisor **con deduplicación**; asistente puro; therapist+assistant → `puedeVerAlertasClinicas=true`; supervisor puro **con** asignaciones; supervisor sin asignaciones → lista vacía; rol desconocido → SCOPED vacío.
- `DashboardApplicationServiceTest`: stats scoped; alertas vacías para asistente; `accion-dominante`/`citas-hoy` scoped; `accion-dominante` con máscara (`consentimientoFirmado=null`) para asistente; shape del DTO lean en `/pacientes-recientes`.
- `SpringDataSupervisionAsignacionRepositoryTest` + repos de paciente/cita: queries scoped y guarda de ids vacío (no ejecuta `IN`).
- `DashboardRestControllerTest` (`@WebMvcTest` + security): patient/student → 403 en los **5** endpoints; 200 con rol autorizado.

**Frontend**
- Unit `RoleStateService`: helpers y `esAsistenteOperativo()` en multi-rol (therapist+assistant, admin+assistant → no operativo; assistant puro → sí).
- Test del guard de ruta: sin `DASHBOARD_LEER` / patient / student → redirección.
- E2E por rol: therapist (scoped), supervisor (scoped), asistente (operativo, sin alertas, grid reducida), admin (global); E2E multi-rol (unión).
- Regresión visual del estado asistente (banner oculto + 2 cards).
- Test de contrato del shape del DTO por rol (`/pacientes-recientes` lean; `/accion-dominante` máscara).
- Validación de la migración V10 (FK + `ON CONFLICT`).

---

## 7. Trazabilidad de brechas

| GAP | Resuelto en fase | Capa |
| :--- | :--- | :--- |
| GAP-ROLE-01 (métricas globales) | A | backend + BD |
| GAP-ROLE-02 (relación supervisor→terapeuta) | A | BD |
| GAP-ROLE-03 (asistente sin alertas clínicas) | A + B | backend + frontend |
| GAP-ROLE-04 (vistas/ocultación por rol) | B | frontend |
| GAP-ROLE-05 (multi-rol unión) | A | backend |
| GAP-ROLE-06 (acción dominante scoped) | A | backend |
