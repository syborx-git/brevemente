# SDD: Mi Consulta — Vista Privada del Terapeuta

- **Fecha**: 2026-10-21
- **Autor**: JARVIS Lead Architect
- **Módulo**: Mi Consulta (`/mi-consulta`) — espacio operativo privado del terapeuta
- **Referencias**:
  - Gap report: `docs/gap-analysis/gap-report-dashboard-mi-consulta.md` (validado 2 rondas por jarvis-backend/frontend/database).
  - ADR-001 (hexagonal), ADR-002 (adapters duales), ADR-003 (backend hexagonal + OpenAPI).
  - Oráculo: `brevemente_demo/src/pages/MiConsulta.tsx`.

---

## 1. Contexto y alcance

El módulo actual `/mi-consulta` es un placeholder vacío (su contenido anterior de configuración se migró a `configuracion`). Este SDD define la reconstrucción de la **vista privada del terapeuta** fiel a la demo:

- Cabecera (título dinámico por rol + sede activa).
- Próxima Sesión Clínico-Estratégica (ficha del paciente + parámetros de admisión).
- Agenda de Hoy.
- Requieren Atención Urgente (alertas de crisis + resolver).
- Solicitudes de supervisión pendientes.
- Borradores de LEVA pendientes.
- Información secundaria colapsable.

**No-objetivos (fuera de alcance)**: generación IA de LEVA (GAP-MC-06 IA), Campus/capacitación (GAP-MC-07), modelado de estado de sesión `en_curso` (GAP-MC-03 se resuelve como simulación de UI).

**Estrategia SDOP**: reutilizar y extender backend existente; no crear tablas nuevas.

---

## 2. Decisiones de arquitectura (resumen)

| Decisión | Elección |
| :--- | :--- |
| Módulo frontend | `modules/mi-consulta/` con patrón hexagonal `ports/` + `adapters/` (http + localstorage). |
| Guard de ruta | `hasAnyRoleGuard('admin_platform','admin_clinical','therapist','supervisor')` (GAP-MC-01). |
| Alertas staff | Nuevo controller `AlertasStaffRestController` en módulo `portalpaciente` (reutiliza `alerta_paciente`). |
| Permiso de resolución | Nuevo permiso `ALERTAS_GESTIONAR` (V18, módulo `CONSULTA`) — reutilizar `MI_CONSULTA_LEER` solo para lectura. |
| Estado de sesión | `signal` local de UI (simulación), sin persistencia backend. |
| Próxima sesión | Extender `AccionDominante` con `motivoConsulta` + `numeroSesion` (sin migración). |

---

## 3. Plan de Reutilización (Backend)

### 3.1 Entidades JPA / modelos de dominio a EXTENDER

| Componente | Ubicación | Cambio |
| :--- | :--- | :--- |
| `AccionDominante` (POJO `@Value @Builder`) | `dashboard/domain/model/AccionDominante.java` | Añadir `String motivoConsulta` y `Integer numeroSesion`. |
| `AlertaPaciente` (dominio) | `portalpaciente/domain/model/AlertaPaciente.java` | **Sin cambios de schema**; se reutiliza tal cual (resolver = `estado='resuelta'` + `resueltaPor` + `resueltaEn`). |
| `AlertaPacienteJpaEntity` | `portalpaciente/.../entity/AlertaPacienteJpaEntity.java` | Sin cambios (columnas `tipo`, `estado`, `resuelta_por`, `resuelta_en` ya existen en V17). |
| `SupervisionSolicitud` | `supervision/domain/model/SupervisionSolicitud.java` | Sin cambios de entidad; solo nuevo caso de uso de listado agregado. |
| `Sesion` / `SesionJpaEntity` | `expediente/...` | **EXTENDER**: mapear `cita_id` (V17) en `SesionJpaEntity` + `SesionPersistenceMapper` y añadir `findByCitaId` a `SesionRepositoryPort`/`SpringDataSesionRepository` (o query nativa) para derivar `numeroSesion` desde la sesión vinculada a la cita. |

### 3.2 DTOs a EXTENDER / CREAR

| DTO | Ubicación | Cambio |
| :--- | :--- | :--- |
| `AccionDominanteResponseDTO` | `dashboard/.../dto/` | Añadir campos `motivoConsulta`, `numeroSesion`. |
| `AlertaStaffResponseDTO` (NUEVO) | `portalpaciente/.../dto/` | `{ id, pacienteId, pacienteNombre, tipo, estado, mensaje, createdAt, resueltaPor?, resueltaEn? }`. |
| `ResolverAlertaRequestDTO` (NUEVO) | `portalpaciente/.../dto/` | `{ resueltaPor }` (o derivar del SecurityContext). |
| `SupervisionSolicitudPendienteDTO` (NUEVO/reutilizar) | `supervision/.../dto/` | Reutilizar el DTO existente de solicitud; el listado agregado devuelve `List<...>` sin `pacienteId` obligatorio. |
| `SesionBorradorDTO` (NUEVO/reutilizar) | `expediente/.../dto/` | Reutilizar `SesionResponseDTO` + campos `pacienteNombre`/`pacienteId`. |

### 3.3 Repositorios / queries a EXTENDER (sin migración de schema)

| Repositorio | Cambio |
| :--- | :--- |
| `SpringDataCitaRepository` (`findProximaDeHoyGlobal`/`Scoped`) | **Sin cambios SQL**: `motivoConsulta` ya se obtiene del `Paciente` cargado en `toAccionDominante`; `numeroSesion` se deriva en servicio = número de la sesión vinculada a la cita (`sesiones.cita_id`, V17) o `SesionRepositoryPort.ultimoNumero(expedienteId)+1` si no existe. |
| `SpringDataAlertaPacienteRepository` | Nueva query nativa `findActivasPorTerapeutaIds(:terapeutaIds)` con `JOIN pacientes p ON p.id = a.paciente_id` y `WHERE a.estado='activa' AND p.terapeuta_id IN :terapeutaIds`. Para `admin_platform`/`admin_clinical`/`supervisor` (sin un único `terapeuta_id`) replicar el patrón Global/Scoped de `SpringDataCitaRepository` + `DashboardScopeResolver`. |
| `SpringDataSupervisionSolicitudRepository` | Nueva query agregada `findPendientes` (evaluador → global; terapeuta → propios). |
| `SpringDataSesionRepository` | Nueva query `findBorradoresPorTerapeuta(:terapeutaId)` vía `expedientes_clinicos.terapeuta_asignado_id` (índice `idx_expedientes_terapeuta`, V7). |

---

## 4. Migración Flyway (V18 — inmutable)

**Consecutivo correcto**: el último aplicado es **V17**, por lo que el siguiente es **V18**.

**Nombre**: `V18__mi_consulta_staff_demo.sql`

**Contenido especificado** (idempotente, `ON CONFLICT DO NOTHING` / `IF NOT EXISTS`):

1. **Permiso nuevo** `perm-025 ALERTAS_GESTIONAR` (módulo `CONSULTA`) + grant a `rol-001`, `rol-002`, `rol-003`, `rol-005` (no a `rol-004 assistant` ni `rol-006 patient`). El grant a `rol-001` debe ser explícito (el "todos" de V5 es un snapshot, no recoge permisos futuros). Nota: otorgar a `rol-005` (supervisor) es una decisión nueva que no contradice V16 (que solo revocó `MI_CONSULTA_EDITAR`).
2. **Índices parciales**: se **omiten** — son redundantes con `idx_alerta_paciente_paciente` (V17) e `idx_sesiones_expediente` (V7). El acceso a borradores ya está indexado vía `idx_expedientes_terapeuta` (V7).
3. **Seed de citas "hoy"** (GAP-MC-09): `cit-200` (09:00–09:45, `confirmada`, PRESENCIAL, consultorio A) y `cit-201` (11:00–11:30, `pendiente`, ONLINE, `consultorio=NULL`) para `pac-002`/`ter-001`/`exp-002`, fecha `2026-10-21T...-06:00`, con `tipo_cita='seguimiento'`, `duracion_minutos∈{45,30}`, `payment_status='pendiente'`, `bloqueada_por_normativa=FALSE` — respetando los CHECKs de V6 (`tipo_cita`, `duracion_minutos`, `payment_status`, `consultorio`, `modalidad`, `estado_cita`). No usar `pac-001` (bloqueo normativo). Las dos citas no se solapan entre sí.
4. **Seed de alerta de crisis activa** (GAP-MC-04 testability): `alerta-pac-002` (`tipo='crisis'`, `estado='activa'`, `paciente_id='pac-002'`, `mensaje='ALERTA ROJA: ...'` — columna NOT NULL) para que "Requieren Atención Urgente" tenga datos.
5. **Seed de sesión borrador** (GAP-MC-06): `ses-005` (`exp-002`, `numero=3`, `status='borrador'`, `creado_por_id='ter-001'`, `cita_id='cit-200'`) — respeta `ux_sesiones_expediente_numero`.

> Regla: la migración NO toca `terapeutas.nombre/apellidos` (eliminados en V4; la identidad vive en `usuarios`).

---

## 5. Spring Boot (Controllers, DTOs, Mappers, Services)

### 5.1 `AlertasStaffRestController` (NUEVO — GAP-MC-04/10)
- **Paquete**: `portalpaciente/infrastructure/adapters/in/rest/`.
- **Ruta base**: `@RequestMapping("/alertas")`.
- **Endpoints**:
  - `GET /alertas/activas` → `@PreAuthorize("hasAuthority('MI_CONSULTA_LEER')")` → lista alertas activas (`crisis`/`seguridad_clinica`) de los pacientes del terapeuta autenticado (JOIN `alerta_paciente → pacientes.terapeuta_id`). Respuesta: `List<AlertaStaffResponseDTO>`.
  - `PATCH /alertas/{id}/resolver` → `@PreAuthorize("hasAuthority('ALERTAS_GESTIONAR')")` → resuelve (`estado='resuelta'`, `resuelta_por` desde SecurityContext, `resuelta_en=now`). Respuesta: `AlertaStaffResponseDTO`.
- **Service**: `AlertaStaffApplicationService` (nuevo, con identidad por terapeuta). **No** extender `PacientePortalApplicationService` (su identidad es el paciente, no el terapeuta).
- **Ports out**: nuevo `AlertaStaffRepositoryPort` (no contaminar el patient-scoped `PortalPacienteRepositoryPort`).

### 5.2 `DashboardRestController` / `AccionDominante` (EXTENDER — GAP-MC-02)
- Añadir `motivoConsulta` y `numeroSesion` a `AccionDominante`, `AccionDominanteResponseDTO`, `DashboardRestMapper` y `DashboardApplicationService.toAccionDominante` (tercer punto de mapeo; es donde se construye el dominio desde `Cita`+`Paciente`).
- `motivoConsulta` se toma del `Paciente` ya cargado en `toAccionDominante` (sin tocar SQL). `numeroSesion` = número de la sesión vinculada a la cita (`sesiones.cita_id`, V17) o `ultimoNumero(expedienteId)+1` si no existe.
- En `toResponseOperativo` decidir si se enmascaran los campos nuevos (mantener `intakeListo`/`consentimientoFirmado` enmascarados como hoy; `motivoConsulta`/`numeroSesion` visibles).

### 5.3 `SupervisionRestController` (EXTENDER — GAP-MC-05)
- Nuevo endpoint `GET /supervision/solicitudes/pendientes` → `@PreAuthorize("hasAuthority('SUPERVISION_LEER')")` → listado agregado (evaluador/supervisor → global; terapeuta → solo propias). El terapeuta (rol-003) sí tiene `SUPERVISION_LEER` (otorgado en V8).
- Extender `SupervisionSolicitudApplicationService.listarPendientes` y `SpringDataSupervisionSolicitudRepository`.

### 5.4 `ExpedienteRestController` (EXTENDER — GAP-MC-06, fase opcional)
- Nuevo endpoint `GET /expedientes/sesiones/borradores` → `@PreAuthorize("hasAuthority('EXPEDIENTE_LEER')")` → borradores del terapeuta.
- Extender `SesionApplicationService` y `SpringDataSesionRepository`.

### 5.5 Mappers
- `DashboardRestMapper`: mapear `motivoConsulta`/`numeroSesion` en `toResponse`/`toResponseOperativo`.
- Nuevo `AlertaStaffRestMapper`: `AlertaPaciente → AlertaStaffResponseDTO` (incluye `pacienteNombre` vía join).

---

## 6. Angular (estructura del módulo y adapters)

### 6.1 Estructura del módulo

```
modules/mi-consulta/
├── mi-consulta.component.ts          # vista privada (signals + estado de sesión simulado)
├── ports/mi-consulta.repository.ts   # puerto (`abstract class`) + tipos
└── adapters/
    ├── mi-consulta-http.adapter.ts       # backend real (environment.features.miConsultaBackend)
    └── mi-consulta-localstorage.adapter.ts # mock demo (paridad con la demo)
```

### 6.2 `MiConsultaRepository` (puerto)

Métodos abstractos (`Observable<T>`):
- `obtenerAccionDominante(): Observable<AccionDominante>`
- `listarCitasHoy(): Observable<CitaHoy[]>`
- `listarAlertasActivas(): Observable<AlertaStaff[]>`
- `resolverAlerta(id: string): Observable<AlertaStaff>`
- `listarSolicitudesPendientes(): Observable<SolicitudPendiente[]>`
- `listarBorradores(): Observable<BorradorSesion[]>`
- `obtenerSedePrincipal(): Observable<TerapeutaSede | null>` (reutiliza catálogo/config de `configuracion`)

### 6.3 `MiConsultaHttpAdapter` — estructura de la clase

Sigue el patrón de `configuracion-http.adapter.ts` (hexagonal, inyección de `HttpClient`, `environment.apiBaseUrl`, mapeo `wire → dominio` y manejo de errores en el `subscribe` del componente):

```
@Injectable({ providedIn: 'root' })
export class MiConsultaHttpAdapter implements MiConsultaRepository {
  private readonly baseUrl = `${environment.apiBaseUrl}`; // endpoints en /dashboard, /alertas, /supervision, /expedientes, /mi-consulta

  constructor(private readonly http: HttpClient) {}

  obtenerAccionDominante(): Observable<AccionDominante> {
    // GET /dashboard/accion-dominante → map(wire => this.toAccion(wire))
  }
  listarCitasHoy(): Observable<CitaHoy[]> { /* GET /dashboard/citas-hoy */ }
  listarAlertasActivas(): Observable<AlertaStaff[]> { /* GET /alertas/activas */ }
  resolverAlerta(id: string): Observable<AlertaStaff> { /* PATCH /alertas/{id}/resolver */ }
  listarSolicitudesPendientes(): Observable<SolicitudPendiente[]> { /* GET /supervision/solicitudes/pendientes */ }
  listarBorradores(): Observable<BorradorSesion[]> { /* GET /expedientes/sesiones/borradores */ }
  obtenerSedePrincipal(): Observable<TerapeutaSede | null> { /* GET /dashboard/catalogos + /mi-consulta (config) */ }

  // interfaces wire privadas + métodos privados toAccion/toCita/toAlerta/toSolicitud/toBorrador
  // manejo de error en el subscribe del componente (patrón de configuracion-http.adapter), no catchError/throwError
}
```

### 6.4 `MiConsultaLocalStorageAdapter`

Replica la demo con datos simulados (fecha "hoy", sede "Sede Centro", próxima sesión "Ataque de Pánico • Sesión #3", 1 alerta activa, 1 solicitud de supervisión, 1 borrador LEVA) para paridad offline.

**Flag + DI**: añadir `miConsultaBackend` a `environment.ts` (dev, `false`) y `environment.prod.ts` (`true`). Conmutación por provider con `useFactory` (idéntico a `configuracion.component.ts`): `environment.features.miConsultaBackend ? new MiConsultaHttpAdapter(http) : new MiConsultaLocalStorageAdapter()` con `deps: [HttpClient]`.

### 6.5 Componente y guard
- `mi-consulta.component.ts`: título dinámico por rol (`supervisor→Mi Supervisión`, `admin_clinical→Mi Operación`, `admin_platform→Operación Clínica`, default→Mi Consulta`), estado de sesión como `signal` local con badge "Simulación", acciones inertes/CTA mapeadas a `/expedientes/{id}`, `aria-pressed`, `type="button"`, `prefers-reduced-motion`. Auditoría: el Angular actual **no tiene** `auditLogService` (el módulo `auditoria-seguridad` es una tabla hardcodeada); registrar el cambio de estado de sesión y la resolución de crisis requerirá un mecanismo de escritura nuevo (endpoint `POST /auditoria` + puerto/adapter). Queda como deuda; documentar alcance al implementar.
- `app.routes.ts`: reemplazar `staffOnlyGuard` por `hasAnyRoleGuard('admin_platform','admin_clinical','therapist','supervisor')` (GAP-MC-01).

---

## 7. Contratos API (resumen)

| Método | Ruta | Permiso | Consumido por |
| :--- | :--- | :--- | :--- |
| GET | `/dashboard/accion-dominante` | `DASHBOARD_LEER` | Próxima Sesión |
| GET | `/dashboard/citas-hoy` | `DASHBOARD_LEER` | Agenda de Hoy |
| GET | `/alertas/activas` | `MI_CONSULTA_LEER` | Requieren Atención Urgente |
| PATCH | `/alertas/{id}/resolver` | `ALERTAS_GESTIONAR` (nuevo) | Resolver Caso |
| GET | `/supervision/solicitudes/pendientes` | `SUPERVISION_LEER` | Solicitudes de supervisión |
| GET | `/expedientes/sesiones/borradores` | `EXPEDIENTE_LEER` | Borradores LEVA |
| GET | `/dashboard/catalogos` | `DASHBOARD_LEER` | Sede activa (header) |

---

## 8. Secuencia de implementación (fases)

1. **Fase 0 — Flyway V18** (permiso `ALERTAS_GESTIONAR`, seed citas/alerta/sesión).
2. **Fase 1 — GAP-MC-04/10**: `AlertasStaffRestController` + service + repositorio (backend).
3. **Fase 2 — GAP-MC-02**: extender `AccionDominante`/DTO/mapper/query.
4. **Fase 3 — GAP-MC-05/06**: endpoints agregados de supervisión pendientes y borradores.
4. **Fase 4 — Frontend**: guard (GAP-MC-01, frontend-only, puede adelantarse/paralelizarse) + puerto + adapters + componente (fidelidad visual §4.1 del gap report).
6. **Fase 5 — E2E**: spec `dashboard-mi-consulta.spec.ts` + reporte en `docs/gap-analysis/e2e-dashboard-mi-consulta.md`.

---

## 9. Criterios de aceptación

- Los **4** roles staff (`admin_platform`, `admin_clinical`, `therapist`, `supervisor`) ven la vista; `assistant`/`student`/`patient` no.
- "Próxima Sesión" muestra motivo y sesión # desde `accion-dominante` extendido.
- "Requieren Atención Urgente" lista alertas activas de `alerta_paciente` y permite resolverlas (cierra el ciclo paciente→equipo→paciente).
- "Agenda de Hoy" refleja las citas seed V18.
- Build Angular ✅ y `mvn test` ✅, con las vistas mapeadas a tokens `clinical.*` (sin clases Tailwind inválidas de la demo).
