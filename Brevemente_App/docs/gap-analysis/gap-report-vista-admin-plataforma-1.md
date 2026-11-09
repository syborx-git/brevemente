# GAP Analysis Report: Vista Admin Plataforma — Fase 1

- **Fecha**: 2026-11-05
- **Módulo**: rol `admin_platform` (Administrador de Plataforma)
- **Estado**: PLANEACIÓN — fase 1 (Dashboard, Usuarios, Sedes)
- **Relacionado con**: `gap-report-dashboard-roles.md`, `gap-report-dashboard-mi-consulta.md`, `sdd-dashboard-completo.md`, `sdd-dashboard-mi-consulta.md`
- **Rama de trabajo**: `feature/jp-vista-admin-1`

> **Contexto**: hoy el rol `admin_platform` **no tiene una vista propia**; consume el mismo dashboard y menú que el terapeuta, con alcance GLOBAL. La decisión de esta fase es **reconstruir la vista del admin desde cero**, retirando lo que hoy consume de forma compartida. Antes de borrar, este documento deja **registrado** el consumo actual como respaldo histórico para fases futuras.

---

## 1. Objetivo y alcance de la Fase 1

| Elemento | Detalle |
| :--- | :--- |
| **Rol objetivo** | `admin_platform` (rol-001, "Gestión global de la plataforma") |
| **Módulos de esta fase** | 1) Dashboard de Plataforma · 2) Gestión de Usuarios y Roles · 3) Sedes y Establecimientos |
| **Estrategia** | "Desde cero": la vista admin deja de heredar el dashboard/sidebar del terapeuta. |
| **Prioridad** | Borrar/retirar el consumo actual de la vista admin, dejando el registro de este documento. |

> Fuera de alcance en Fase 1 (se planearán después): Configuración del Sistema, Auditoría ampliada, Reportes de Plataforma, Campus admin, y los módulos operativos (Pacientes, Agenda, Expedientes) — estos últimos ya tienen diseño previsto por el negocio.
>
> **Permisos**: el `admin_platform` **conserva todos sus permisos** (incluidos pagos y operación clínica). **No se revocan**; simplemente no forman parte del shell de esta fase.

---

## 2. Registro del consumo actual (ANTES de borrar)

> ⚠️ **Archivo histórico.** Esto es lo que `admin_platform` consume hoy. Se retira/reestructura en esta fase, pero se conserva aquí como referencia para las próximas planeaciones.

### 2.1 Rutas accesibles (`app.routes.ts`)

| Ruta | Guard | Componente |
| :--- | :--- | :--- |
| `/dashboard` | `permissionGuard` | `DashboardComponent` |
| `/pacientes` | `staffOnlyGuard` | `PacientesComponent` |
| `/expedientes` / `/expedientes/:id` | `staffOnlyGuard` | `ExpedienteClinicoComponent` |
| `/agenda` | `staffOnlyGuard` | `AgendaComponent` |
| `/asistente-leva` (alias `/leva`) | `staffOnlyGuard` | `AsistenteLevaComponent` |
| `/supervision` | `staffOnlyGuard` | `SupervisionComponent` |
| `/biblioteca` | `hasAnyRoleGuard(...)` | `BibliotecaClinicaComponent` |
| `/campus` | `hasAnyRoleGuard(...)` | `CampusComponent` |
| `/desempeno` | `hasAnyRoleGuard(...)` | `DesempenoComponent` |
| `/configuracion` | `hasAnyRoleGuard(...)` | `ConfiguracionComponent` |
| `/auditoria` | `hasAnyRoleGuard(admin_platform, admin_clinical, supervisor)` | `AuditoriaSeguridadComponent` |
| `/mi-consulta` | `hasAnyRoleGuard(...)` | `MiConsultaComponent` |

> No existe ninguna ruta específica del admin (p. ej. `/admin` o `/admin/usuarios`). Además, `path: ''` y `path: '**'` redirigen fijo a `/dashboard`, por lo que el admin aterriza en el dashboard del terapeuta.

### 2.2 Sidebar actual (`sidebar.component.ts`)

Secciones e ítems visibles para `admin_platform`:

| Sección | Ítems |
| :--- | :--- |
| **INICIO** | Panel Principal (`/dashboard`), Mi Consulta (`/mi-consulta`) |
| **OPERACIÓN CLÍNICA** | Pacientes, Agenda, Expedientes, Biblioteca Clínica, LEVA |
| **FORMACIÓN Y DESARROLLO** | Campus BreveMente, Mi Desarrollo Profesional, Supervisión Clínica |
| **ADMINISTRACIÓN** | Configuración, Auditoría y Seguridad |

> El admin ve **todo el menú** (4 secciones, 12 ítems), el mismo que los roles clínicos, sin una sección "Plataforma" dedicada.

### 2.3 Dashboard actual (`dashboard.component.ts`)

- `get vista()` resuelve: `patient` → `student` → **`therapist`** (default). El admin cae en **`therapist`** (Centro de Control del terapeuta).
- Hay branching de UI solo para `patient`/`student`; **no hay branching para admin** (cae en la vista `therapist`).
- Endpoints consumidos (`DashboardRepository`):
  - `obtenerStats`, `obtenerCitasHoy`, `obtenerAccionDominante`, `obtenerAlertasUrgentes`, `obtenerPacientesRecientes`
  - `obtenerCitasPorMes`, `obtenerDistribucionFases`, `obtenerCasosPorProtocolo`
  - `obtenerCatalogos`, `obtenerAlertasMayoriaEdad`, `obtenerPendientesPrioritarios`
- Backend: `DashboardScopeResolver` → `GLOBAL` para `admin_platform`/`admin_clinical`.

### 2.4 Mi Consulta (`mi-consulta.component.ts`)

- Título dinámico por rol: `admin_platform` → **"Operación Clínica"**.
- El admin consume la misma pantalla operativa que terapeuta/supervisor.

### 2.5 Permisos actuales (`V5` y migraciones posteriores)

- `admin_platform` (rol-001) recibe los **16 permisos de V5** y parte de las ampliaciones posteriores (**22 de 25** en total), incluidos los exclusivos de sistema:
  - `ADMIN_USUARIOS` (perm-011, V5)
  - `CONFIGURACION_SISTEMA` (perm-016, V5)
- `admin_clinical` (rol-002) NO tiene esos dos.
- ⚠️ **Drift de catálogo**: el backend tiene **25 permisos** (V5=16, V6=2, V8=4, V13=1, V17=1, V18=1); el frontend/demo maneja **23** (le faltan `MI_CONSULTA_EDITAR` y `ALERTAS_GESTIONAR`). La BD es la fuente de verdad; el ajuste es en frontend (ver §7, ADM1-07).
- `admin_platform` tiene **22 de 25** permisos: no posee `MIS_CITAS_LEER`, `MIS_SESIONES_LEER` ni `SUPERVISION_REGISTRAR` (exclusivos de patient/terapeuta, correcto).
- ⚠️ El `admin_platform` conserva `PAGOS_LEER`/`PAGOS_GESTIONAR` y `MI_CONSULTA_EDITAR` (honorarios). **No se revocan**; solo quedan fuera del shell de esta fase.

### 2.6 Servicios de rol (`role-state.service.ts`)

- `esAdmin()` = `hasRole('admin_platform') || hasRole('admin_clinical')`.
- `roles`, `permissions`, `terapeutaIds` derivados del usuario autenticado.
- `switchActiveRole()` permite alternar contexto en usuarios multi-rol.

### 2.7 Backend — puntos de acceso admin

| Componente | Detalle |
| :--- | :--- |
| `DashboardScopeResolver` | Admin → **GLOBAL** (sin filtro por terapeuta). |
| `TerapeutaConfigApplicationService` | Flag `admin` para `admin_platform`/`admin_clinical`. |
| `AuditoriaConfiguracionApplicationService` | Autoriza `admin_platform`/`admin_clinical`. |
| `SecurityContextIdentidadAdapter` | `tieneAutoridad("ROLE_ADMIN_PLATFORM")`. |
| `SupervisionRestController` | `ROLE_ADMIN_PLATFORM` con acceso a resolución. |

---

## 3. Visión "desde cero" de la vista admin

**Principio rector**: el `admin_platform` **administra la plataforma**. Su shell (sidebar/rutas) deja de ser el del terapeuta. Los módulos operativos (Pacientes/Agenda/Expedientes) se conservan en permisos, pero se integrarán a esta vista en una fase posterior con diseño propio ya previsto por el negocio.

| # | Módulo | Tipo | Estado |
| :--- | :--- | :--- | :--- |
| 1 | Dashboard de Plataforma | Nuevo (reemplaza `/dashboard` para admin) | Planificar |
| 2 | Gestión de Usuarios y Roles | Nuevo | Planificar |
| 3 | Sedes y Establecimientos | Nuevo (extrae sedes de Configuración) | Planificar |
| 4 | Configuración del Sistema | Reestructurar (Fase 2) | — |
| 5 | Auditoría y Seguridad (consola admin) | Ampliar (Fase 2) | — |
| 6 | Reportes de Plataforma | Nuevo (Fase 2) | — |
| 7 | Campus admin | Opcional (Fase 2) | — |

**Shell propuesto para el admin (sidebar):**

- `INICIO`: Dashboard de Plataforma.
- `PLATAFORMA`: Usuarios y Roles, Sedes y Establecimientos.
- `SISTEMA`: Configuración del Sistema, Auditoría y Seguridad.
- `ANALÍTICA`: Reportes de Plataforma.

> Los módulos operativos (Pacientes, Agenda, Expedientes, LEVA, Biblioteca, Campus, Desempeño, Supervisión) dejan de aparecer en el shell admin o pasan a una sección secundaria "Explorar", según decisión de negocio (ver §8).

---

## 4. Módulo 1 — Dashboard de Plataforma

### 4.1 Propósito
Centro de mando global: salud operativa de toda la plataforma, sin foco en un solo paciente.

### 4.2 Zonas propuestas

| Zona | Contenido |
| :--- | :--- |
| KPIs globales | Terapeutas activos, pacientes activos, citas hoy, citas del mes, sesiones completadas. |
| Indicadores clínicos globales | Efectividad TBE (%), índice de fidelidad, tasa de deserción. |
| Actividad reciente | Últimos pacientes creados, últimas citas, últimos accesos. |
| Alertas de sistema | Consentimientos pendientes (menores), riesgos altos, citas bloqueadas por normativa. |
| Salud de plataforma | Estado de módulos, feature flags activos, errores recientes. |

> ⚠️ **SUPERADO por el SDD** (`sdd-vista-admin-plataforma-dashboard.md`, diseño final). El alcance final difiere: solo **2 KPIs** (terapeutas activos, pacientes activos), **actividad reciente sin citas ni pacientes** (solo accesos + usuarios nuevos) y **alertas únicamente administrativas/financieras** (suscripción vencida + pago recibido). Esta tabla NO debe usarse como referencia de implementación.

### 4.3 Datos backend requeridos (por confirmar)
- `usuarios` activos por rol.
- `terapeutas` activos.
- `pacientes` activos + citas/sesiones agregadas.
- Reutilizar `DashboardScopeResolver` solo para las métricas clínicas globales (pacientes activos, citas hoy).
- Crear `PlataformaDashboardApplicationService` + puerto `PlataformaDashboardRepositoryPort` para lo administrativo (usuarios por rol, terapeutas activos, salud de módulos, accesos recientes).

---

## 5. Módulo 2 — Gestión de Usuarios y Roles

### 5.1 Propósito
CRUD de cuentas de la plataforma con asignación de roles, permisos y estados. Materializa el permiso `ADMIN_USUARIOS` (hoy sin pantalla).

### 5.2 Alcance propuesto

| Funcionalidad | Detalle |
| :--- | :--- |
| Listado de usuarios | Filtros por rol, estado, búsqueda. |
| Alta / Edición | Datos de identidad, rol(es) (permisos read-only derivados del rol), terapeuta asociado. |
| Estados | Activo / Suspendido / Inactivo. |
| Validación profesional | Cédula, especialidad (terapeutas). |
| Asignaciones | Terapeuta ↔ asistente (N:M `asignaciones_terapeuta`). |
| Restricciones | El admin no puede auto-suspenderse ni quitar el último admin activo. |

### 5.3 Consideraciones de seguridad (prerequisitos)
- Incrementar `token_version` + revocar refresh tokens al cambiar rol/estado (en la misma transacción).
- Impedir auto-suspensión, auto-remoción del propio `admin_platform` y desactivar al último admin activo (validación server-side transaccional).
- DTO estricto anti mass-assignment: solo identidad + roles whitelisted + estado; nunca aceptar permisos ni `terapeutaIds` desde el cliente.
- Auditoría append-only de cada alta/baja/cambio de rol (tabla `auditoria_gestion`).
- Confirmación por doble factor para cambios de privilegio (recomendado).

---

## 6. Módulo 3 — Sedes y Establecimientos

### 6.1 Propósito
Gestión global del catálogo de sedes/establecimientos (CLUES, licencia sanitaria, tipo) y su vínculo con terapeutas.

### 6.2 Alcance propuesto

| Funcionalidad | Detalle |
| :--- | :--- |
| CRUD de sedes | Nombre, CLUES, licencia sanitaria, tipo (publico/privado/social). |
| Asignación | Terapeutas por sede; sede principal. |
| Consultorios | ⏸️ Fuera de alcance por ahora (se retoma al revisar la Agenda). |
| Semilla actual | `sede-centro`, `sede-norte`, `sede-sur` (base V11; CLUES/licencia/tipo en V20). |

> Nota: hoy las sedes viven solo como catálogo de lectura dentro de Configuración; se extraen a módulo propio.

---

## 7. Matriz de brechas (Fase 1)

| ID | Tipo | Descripción | Impacto | Acción |
| :--- | :--- | :--- | :--- | :--- |
| ADM1-01 | MISSING | No existe vista/dashboard propio del `admin_platform` (cae en `therapist`). | **Alto** | Nuevo `DashboardPlataformaComponent` + ruta `/admin/dashboard`. |
| ADM1-02 | INCORRECT | El sidebar admin muestra el menú completo del terapeuta (12 ítems). | **Alto** | Shell admin con secciones propias. |
| ADM1-03 | MISSING | `ADMIN_USUARIOS` sin pantalla **ni backend** de gestión de usuarios (`auth` solo autentica). | **Alto** | Nuevo módulo Usuarios y Roles + bounded context `usuario`. |
| ADM1-04 | MISSING | Sedes solo como catálogo de lectura en Configuración. | **Medio** | Módulo propio de Sedes y Establecimientos. |
| ADM1-05 | DATA | `admin_platform` hereda rutas operativas (pacientes/agenda/expedientes); se conservan permisos. | **Medio** | Se integrarán en fase posterior (diseño previsto por negocio). |
| ADM1-06 | MISSING | Sin bitácora de auditoría para gestión de usuarios/sedes. | **Medio** | Tabla `auditoria_gestion` (V27). |
| ADM1-07 | INCORRECT | Drift de catálogo de permisos: backend **25** vs frontend **23** (faltan `MI_CONSULTA_EDITAR` y `ALERTAS_GESTIONAR`). | **Alto** | Alinear el frontend (no INSERTs en BD); V26 solo valida. |
| ADM1-08 | MISSING | Estados de usuario (activo/suspendido/inactivo) no modelados (solo `activo BOOLEAN`). | **Alto** | Migración `estado_usuario` (V26). |
| ADM1-09 | MISSING | Landing por rol: el admin cae en `/dashboard` del terapeuta. | **Alto** | `homeRedirectGuard` + `adminPlatformGuard` dedicado. |
| ADM1-10 | MISSING | Invalidación de sesión al cambiar rol/estado. | **Alto** | Bump `token_version` + revocar refresh tokens (invariante del servicio de usuarios). |

---

## 8. Decisiones de negocio

| # | Decisión | Estado |
| :--- | :--- | :--- |
| 1 | Prefijo de rutas | ✅ **Opción A**: `/admin/dashboard`, `/admin/usuarios`, `/admin/sedes` |
| 2 | Módulos operativos (Pacientes/Agenda/Expedientes) | ✅ Se trabajan por separado; **no** se tocan en esta fase |
| 3 | Gestión de permisos | ✅ El admin **solo asigna roles**; los permisos vienen predefinidos por rol (V5) |
| 4 | Sedes | ✅ Ubicación (nombre, CLUES, licencia, tipo) + terapeutas asignados; **sin** tarifas, **sin** consultorios ni vínculo con agenda por ahora |
| 5 | Alcance del CRUD de usuarios | ✅ Solo lo gestiona `admin_platform`; `admin_clinical` queda fuera por ahora |
| 6 | Permisos del admin | ✅ **No se revocan**: conserva todos (incluidos pagos y operación clínica); solo no se usan en el shell de esta fase |
| 7 | Finanzas y operación de pacientes | ✅ Se conservan permisos; su vista/integración se trabaja en fase posterior (diseño ya previsto por negocio) |
| 8 | Fuente de verdad de permisos | ✅ La tabla `permisos` (BD, 25). El frontend se alinea a ella |
| 9 | Autorización backend | ✅ `@PreAuthorize` en MAYÚSCULAS (`ROLE_ADMIN_PLATFORM`, `ADMIN_USUARIOS`); permisos nuevos `SEDES_LEER` (perm-026) y `SEDES_GESTIONAR` (perm-027), creados por migración y otorgados a `rol-001` |
| 10 | Shell por rol activo | ✅ Decisión: el shell se resolverá por `activeRole` y `switchActiveRole()` navegará al landing del rol (pendiente de implementar; hoy solo cambia `activeRoleSubject`) |

---

## 9. Siguientes pasos

1. Reconciliar el catálogo de permisos en el frontend (25 backend → agregar `MI_CONSULTA_EDITAR` y `ALERTAS_GESTIONAR`).
2. Emitir SDD de los 3 módulos (dashboard, usuarios, sedes).
3. Definir migraciones Flyway: V26 (`estado_usuario` + trigger de sincronía `activo` + INSERT de `SEDES_LEER`/`SEDES_GESTIONAR` (perm-026/027) otorgados a `rol-001`), V27 (`auditoria_gestion` inmutable), V28 (índice `sesiones(status='validado')` + unicidad CLUES).
4. Implementar módulo 1 → 2 → 3 (backend + frontend).
5. Retirar del shell admin el consumo heredado del terapeuta (tras migrar lo necesario).
6. Cerrar los hallazgos de seguridad preexistentes que afectan al módulo antes de producción.
7. Frontend: añadir flags en `environment.ts` (`usuariosBackend`, `sedesBackend`) y definir en el SDD el árbol completo de componentes y guards de permiso por ruta.

---

## 10. Retroalimentación de agentes JARVIS (consolidado)

### Primera auditoría (5 agentes)

| Agente | Veredicto |
| :--- | :--- |
| Domain | ⚠️ Aprobado con observaciones |
| Architect | ⚠️ Aprobado con condiciones |
| Database | ⚠️ Viable con migraciones |
| Security | ❌ Rechazado (hallazgos críticos) |
| Frontend | ⚠️ Viable, incompleto |

**Correcciones incorporadas:**
- IDs de permisos: `ADMIN_USUARIOS` = perm-011, `CONFIGURACION_SISTEMA` = perm-016 (V5).
- Sedes: base V11, `terapeuta_sedes` V14, CLUES/licencia/tipo V20.
- CRUD de usuarios es MISSING en backend → nuevo bounded context `usuario`.
- Landing por rol (`homeRedirectGuard`) + `adminPlatformGuard` dedicado (no `esAdmin()`).
- Estados de usuario no modelados → `estado_usuario` tri-estado.
- Invalidación de sesión (`token_version` + revocar refresh) al cambiar rol/estado.
- Auditoría administrativa → `auditoria_gestion`.

### Segunda auditoría (backend, frontend, database)

| Agente | Veredicto |
| :--- | :--- |
| Backend | ⚠️ Aprobado con condiciones |
| Frontend | ⚠️ Viable, incompleto |
| Database | ⚠️ Viable con correcciones |

**Correcciones incorporadas:**
- Drift de permisos al revés de lo original: **backend 25 vs frontend 23** (faltan `MI_CONSULTA_EDITAR` y `ALERTAS_GESTIONAR`). La BD es el superconjunto; no faltan INSERTs.
- `admin_platform` tiene 22 de 25 permisos (sin `MIS_CITAS_LEER`, `MIS_SESIONES_LEER`, `SUPERVISION_REGISTRAR`).
- `@PreAuthorize` en MAYÚSCULAS (`ROLE_ADMIN_PLATFORM`, `ADMIN_USUARIOS`); nuevo permiso `SEDES_GESTIONAR`/`SEDES_LEER`.
- Shell por `activeRole` y `switchActiveRole()` navegante: **decisión registrada, pendiente de implementar** (hoy `switchActiveRole` no navega).
- `estado_usuario` como fuente de verdad con `activo` derivado vía trigger bidireccional (no por convención de app).
- `auditoria_gestion` append-only vía trigger (REVOKE insuficiente; la app conecta como owner).
- V28: los índices de citas ya existen (V1/V9) y `idx_pacientes_status` ya existe (V3); solo falta `sesiones(status='validado')` (`sesiones.status` es `borrador|validado`).
- Filtrar cuentas `patient` por `rol.codigo='patient'` (NOT EXISTS), no por prefijo de id.

### Hallazgos de seguridad preexistentes (afectan al módulo; resolver antes de producción)
- F-06: V5 re-siembra `usr-admin`/`demo123` en cada migración.
- F-07: CORS `*` con `allowCredentials(true)`.
- F-08: JWT secret con valor por defecto commiteado.
- F-09: `/internal/**` permitAll con API key default.
- F-10: Swagger permitAll en cualquier entorno.
