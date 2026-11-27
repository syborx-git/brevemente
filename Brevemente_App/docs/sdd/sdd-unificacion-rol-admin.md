# SDD-ADMIN-1: Software Design Document — Unificación de Roles Admin + Onboarding de Identidad Clínica

- **Módulos**: `auth` + `usuario` + `paciente` + `cita` + `expediente` + `dashboard` + `leva` (backend Spring Boot, hexagonal) · `core` + `admin/*` + `login` (frontend Angular 18) · PostgreSQL/Flyway
- **Código SDD**: `SDD-ADMIN-1`
- **Versión**: 1.0.0
- **Fecha**: 2026-11-25
- **Estado**: AUDITADO — jarvis-database ✅ APROBADO · jarvis-backend ✅ APROBADO · jarvis-frontend ✅ APROBADO (correcciones incorporadas)
- **Sucede a**: `V40__reembolso_citas.sql` (última migración)
- **Migración nueva**: `V41__unificar_roles_admin.sql`
- **Origen**: diagnóstico de unificación de `admin_platform` + `admin_clinical` con premisa "dueños-doctores" (2026-11-25)
- **Fuente de verdad**: `docs/gap-analysis/gap-report-unificacion-rol-admin.md`
- **Alineación**: ADR-001 (Hexagonal/SDOP), ADR-002 (Dual Adapters), ADR-003 (Backend hexagonal y OpenAPI)

> **Regla de Oro**: integrar vía adaptador/puerto, reutilizando lo existente. Este documento **no** escribe código fuente; es la especificación que consumirá la implementación.

---

## 0. Propósito y alcance

Hoy hay dos roles de administración (`admin_platform` con todos los permisos y `admin_clinical` con un subset) y **no existe** la posibilidad de que un administrador se convierta en terapeuta por sí mismo. Se unifican los dos roles en **uno** (`admin`) y se añade un **onboarding de identidad clínica**: el administrador completa su registro como terapeuta para desbloquear las funciones clínicas.

### 0.1 Resultado esperado

1. Existe **un** rol `admin_platform` (plataforma): usuarios, sedes, entrenar LEVA, configuración, reportes, dashboard admin.
2. Las funciones clínicas (agenda, expediente, mi consulta, honorarios, LEVA clínico) pertenecen al rol `therapist`.
3. Un `admin_platform` **sin perfil** de terapeuta no puede usar módulos clínicos (CTA "Completa tu identidad de terapeuta").
4. Al **registrarse como terapeuta**, el admin queda **multi-rol `admin_platform` + `therapist`** y se desbloquea lo clínico.
5. El registro es **on-demand** (no obligatorio en el primer login) y **reversible** desde Configuración.
6. `therapist`, `supervisor`, `assistant` y `patient` no cambian.
7. El admin-terapeuta opera en los tabs clínicos con alcance **propio** (sus pacientes); la información **global** se consulta en el módulo "Visión Global".

### 0.2 Decisiones adoptadas

| # | Decisión |
| :-- | :-- |
| D-1 | **Un rol** `admin_platform` (se conserva el código existente de rol-001) absorbe `admin_clinical` (rol-002). No se renombra. |
| D-2 | El rol `admin_platform` tiene **solo permisos de plataforma** (incluye operativos `PAGOS_*`/`CONSTANCIAS_EMITIR`/`ALERTAS_GESTIONAR`); los clínicos viven en `therapist`. |
| D-3 | El **desbloqueo clínico** se logra asignando el rol `therapist` al completar el registro de identidad de terapeuta (multi-rol `admin` + `therapist`). El rol `therapist` es el que otorga los permisos clínicos; el perfil `terapeutas` es el dato (cédula, honorarios, vínculo). |
| D-4 | El registro es **on-demand**: varios logins sin registrar; CTA al entrar a un módulo clínico. |
| D-5 | **Reversible**: "Dar de baja mi perfil de terapeuta" en Configuración quita el rol `therapist` y desactiva el perfil. |
| D-6 | `therapist`/`supervisor`/`assistant`/`patient` **no cambian**. |
| D-7 | Migración `V41`: **consolidar** el rol (sin renombrar, D-1), reasignar usuarios, redefinir permisos de `admin_platform`, eliminar `rol-002` y `rol-007`, forzar re-login. |
| D-8 | Los checks `tieneRol("admin_platform") \|\| tieneRol("admin_clinical")` se simplifican a `tieneRol("admin_platform")`. |
| D-9 | El "interruptor" de UI es `hasRole('therapist')` (o `terapeutaIds` no vacío). |
| D-10 | `resolverTerapeutaId`: un admin con perfil único **sí** puede agendar para otro terapeuta pasando `terapeutaId` explícito. |
| D-11 | `student` **se elimina**: borrar `rol-007` (V41) + limpiar `ROLES_VALIDOS` y frontend. |
| D-12 | `contarAdminsActivos` ya filtra `admin_platform`; no cambia (solo verificar). |
| D-13 | **Separación de contextos**: los tabs clínicos se resuelven por `terapeutaIds` (scoped, aplica al admin-terapeuta); el alcance **global** vive en el módulo nuevo "Visión Global" (solo `admin_platform`). |
| D-14 | El **dashboard principal** del admin-terapeuta es **scoped** (sus métricas); lo global se ve en "Visión Global". |

---

## 1. Diagnóstico (hallazgos)

| ID | Hallazgo | Ubicación |
| :-- | :-- | :-- |
| H-ADMIN-01 | Dos roles admin; `admin_platform` = todos los permisos, `admin_clinical` = subset sin agenda/usuarios/panel. | `V4`, `V5`, `V6` |
| H-ADMIN-02 | El alta de terapeuta **ya existe** implícita en `insertarUsuario` (si rol `therapist` → INSERT en `terapeutas`). Config por separado. | `UsuarioAdminPersistenceAdapter.insertarUsuario` |
| H-ADMIN-03 | `terapeutaIds` proviene del vínculo `terapeutas.usuario_id`, **independiente del rol**. | `VinculoJpaProjection` |
| H-ADMIN-04 | ~8 archivos backend con `tieneRol("admin_platform") \|\| tieneRol("admin_clinical")` + `hasAnyRole` en LEVA. | `CitaApplicationService`, `DashboardScopeResolver`, `PacienteApplicationService`, `TerapeutaConfigApplicationService`, `AuditoriaConfiguracionApplicationService`, `ExpedienteRestController`, `SupervisionRestController`, `LevaCaseSourceController` |
| H-ADMIN-05 | Bypass en `ExpedienteRestController` (ROLE_ADMIN_*) sin `EXPEDIENTE_LEER`. | `ExpedienteRestController` ~L228 |
| H-ADMIN-06 | `resolverTerapeutaId` con 1 `terapeutaId` ignora el explícito. | `CitaApplicationService` ~L476 |
| H-ADMIN-07 | Rol `student` (`rol-007`) existe en DB pero sin permisos ni usuarios. | `clinical.types.ts`, `UsuarioAdminApplicationService.ROLES_VALIDOS`, `V4` |
| H-ADMIN-08 | Frontend con dos roles (labels, badges, selectores, guards, rutas). | `role-state`, `admin-platform.guard`, `home-redirect.guard`, `sidebar`, `header`, `usuarios.component` |

---

## 2. Modelo de datos — `V41__unificar_roles_admin.sql`

```sql
-- =============================================================================
-- V41: Unificación de roles admin + onboarding de identidad clínica (SDOP)
-- Sucede a V40. Idempotente.
-- =============================================================================

-- 0. Crear permisos de sedes y visión global (no existían) ---------------------
INSERT INTO permisos (id, codigo, modulo, descripcion) VALUES
    ('perm-027', 'SEDES_LEER',        'SISTEMA', 'Ver sedes de atención'),
    ('perm-028', 'SEDES_GESTIONAR',   'SISTEMA', 'Gestionar sedes de atención'),
    ('perm-031', 'VISION_GLOBAL_LEER','SISTEMA', 'Ver la información global de la plataforma (auditoría)')
ON CONFLICT (codigo) DO NOTHING;

-- 1. Reasignar usuarios admin_clinical → admin_platform y eliminar rol-002 ------
INSERT INTO usuario_roles (usuario_id, rol_id)
SELECT ur.usuario_id, 'rol-001' FROM usuario_roles ur WHERE ur.rol_id = 'rol-002'
ON CONFLICT (usuario_id, rol_id) DO NOTHING;

DELETE FROM usuario_roles WHERE rol_id = 'rol-002';
DELETE FROM rol_permisos  WHERE rol_id = 'rol-002';
DELETE FROM roles         WHERE id = 'rol-002';

-- 1b. Eliminar el rol student (D-11) -------------------------------------------
DELETE FROM usuario_roles WHERE rol_id = 'rol-007';
DELETE FROM rol_permisos  WHERE rol_id = 'rol-007';
DELETE FROM roles         WHERE id = 'rol-007';

-- 2. Redefinir permisos del rol admin_platform: solo plataforma ----------------
DELETE FROM rol_permisos WHERE rol_id = 'rol-001';
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT 'rol-001', id FROM permisos WHERE codigo IN (
    'ADMIN_USUARIOS', 'ADMIN_DASHBOARD_LEER', 'CONFIGURACION_SISTEMA',
    'REPORTES_VER', 'SEDES_LEER', 'SEDES_GESTIONAR', 'DASHBOARD_LEER', 'LEVA_USAR',
    'PAGOS_LEER', 'PAGOS_GESTIONAR', 'CONSTANCIAS_EMITIR', 'ALERTAS_GESTIONAR',
    'VISION_GLOBAL_LEER')
ON CONFLICT DO NOTHING;

-- 3. Forzar re-login de los administradores (roles cambiaron) ------------------
UPDATE usuarios SET token_version = token_version + 1
 WHERE id IN (SELECT DISTINCT usuario_id FROM usuario_roles WHERE rol_id = 'rol-001');
```

**Notas**:
- Los permisos clínicos **no se tocan en el rol `therapist`** (ya los tiene desde V5/V6/V8).
- `SEDES_LEER`/`SEDES_GESTIONAR` **no existían**: V41 los crea (`perm-027`/`perm-028`) y los otorga a `admin_platform`; `SedeRestController` se re-apunta a `hasAnyAuthority('EXPEDIENTE_LEER','SEDES_LEER')` (el terapeuta entra por `EXPEDIENTE_LEER`, el admin puro por `SEDES_LEER`).
- El bump de `token_version` invalida las sesiones emitidas con el rol viejo.

---

## 3. Backend (hexagonal)

### 3.1 Simplificar checks de rol

Sustituir en todos los sitios:

```text
tieneRol("admin_platform") || tieneRol("admin_clinical")   →   tieneRol("admin_platform")
hasAnyRole('ADMIN_PLATFORM','ADMIN_CLINICAL')              →   hasRole('ADMIN_PLATFORM')
```

Archivos: `CitaApplicationService`, `DashboardScopeResolver`, `PacienteApplicationService`, `TerapeutaConfigApplicationService`, `AuditoriaConfiguracionApplicationService`, `ExpedienteRestController`, `SupervisionRestController`, `LevaCaseSourceController`, `SecurityContextIdentidadAdapter` (`puedeVerAgendaCompleta`, `esAdminPlataforma`).
- `SedeRestController`: re-apuntar `@PreAuthorize` a `hasAnyAuthority('EXPEDIENTE_LEER','SEDES_LEER')` (el terapeuta entra por `EXPEDIENTE_LEER`, el admin puro por `SEDES_LEER`; no rompe D-6).

### 3.2 Bypass de expediente y alcance (H-ADMIN-05)

- La **autorización** de expediente ya la da `@PreAuthorize("hasAuthority('EXPEDIENTE_LEER')")`; el bypass `ROLE_ADMIN_PLATFORM || ROLE_ADMIN_CLINICAL` en `ExpedienteRestController.validarAccesoPaciente` controla el **alcance IDOR** (admin ⇒ cualquier paciente).
- Con D-13, ese shortcut **se elimina**: `validarAccesoPaciente` resuelve alcance por `terapeutaIds` (scoped). El admin **puro** queda bloqueado por el `@PreAuthorize` (403, sin `EXPEDIENTE_LEER`); el admin-terapeuta queda **scoped** a sus pacientes.
- El acceso **global** a cualquier expediente se sirve en el módulo "Visión Global" (§3.8), no en los endpoints clínicos.

### 3.3 `resolverTerapeutaId` (D-10)

Ajustar `CitaApplicationService.resolverTerapeutaId` **preservando** la rama actual de admin sin vínculo:

```text
if (ids.size() == 1 && (explicito == null || ids.get(0).equals(explicito))) → ids.get(0)
if (esAdminPlataforma() && explicito != null && !explicito.isBlank()) → explicito   // admin (con o sin perfil)
if (ids.size() >= 1 && explicito != null && ids.contains(explicito)) → explicito
throw SinTerapeutaVinculadoException
```

Reglas:
- Terapeuta normal (1 id): solo el propio; si pasa id ajeno → excepción (antes lo ignoraba; cambio documentado).
- Admin puro (0 vínculos): debe pasar `terapeutaId` explícito.
- Admin con perfil: puede agendar para sí (default) o para cualquier terapeuta (explícito).

### 3.4 Caso de uso nuevo — `RegistrarIdentidadTerapeutaUseCase`

Puerto de entrada (contexto `usuario` o `paciente`):

```text
IdentidadTerapeutaRegistrada registrar(String usuarioId, RegistroIdentidadRequest datos, String actorId)
```

Implementación (`@Transactional`):

1. Validar que el actor es el propio usuario o admin (pertenencia).
2. `verificarPasswordActualUseCase.verificar(actorId, datos.passwordConfirmacion())` (operación sensible).
3. Validar cédula única (`existeCedula`).
4. Crear/actualizar fila `terapeutas` **por `usuario_id` (upsert)**, reutilizando la lógica de `UsuarioAdminPersistenceAdapter.actualizarUsuario` (que ya hace upsert de terapeuta) o un nuevo método de puerto `crearVinculoTerapeuta(usuarioId, cedula, especialidad)` — **nunca** INSERT ciego (violaría `ux_terapeutas_usuario_id`).
5. Config (honorarios/duración/edad/sede): tras crear el terapeuta, usar `TerapeutaConfigRepositoryPort.update` + `updateSedes` (no existe CREATE; el terapeuta debe existir primero).
6. Asignar rol `therapist` de forma **aditiva** (nuevo `asignarRol(usuarioId, 'therapist')` idempotente; no usar `actualizarUsuario`, que borra y reinserta todos los roles).
7. Revocar sesiones vía `RevocarSesionesUsuarioUseCase.revocar(id, "REGISTRO_TERAPEUTA", ...)` (invalida access + refresh), no solo bump manual.
8. Auditoría: "Registro de identidad de terapeuta".

Endpoint (unificar ruta gap/SDD):

```text
POST /api/v1/usuario/identidad-terapeuta   @PreAuthorize("hasAuthority('ADMIN_USUARIOS')")
```

- **Anti-IDOR**: el caso de uso actúa sobre el **propio** usuario autenticado (`usuarioId == actorId`). Si se quiere registrar a terceros, se decide explícitamente (alcance admin).

### 3.5 Caso de uso nuevo — `DarBajaPerfilTerapeutaUseCase`

```text
POST /api/v1/usuario/identidad-terapeuta/baja   @PreAuthorize("hasAuthority('ADMIN_USUARIOS')")
```

1. `verificarPasswordActualUseCase.verificar`.
2. Quitar rol `therapist` de forma aditiva-inversa (nuevo `quitarRol(usuarioId, 'therapist')`).
   - Guard: si el usuario es **solo** `therapist` (sin `admin_platform`), bloquear o decidir explícitamente (para no dejar al usuario sin roles).
3. Desactivar perfil vía `UsuarioAdminPersistenceAdapter.sincronizarTerapeutaActivo(usuarioId, false)` (conserva histórico; la FK `ON DELETE RESTRICT` impide borrar).
4. Revocar sesiones vía `RevocarSesionesUsuarioUseCase.revocar`.
5. Auditoría: "Baja de perfil de terapeuta".

### 3.6 `contarAdminsActivos` (D-12)

Sin cambio: el filtro ya es `r.codigo = 'admin_platform'` (D-12).

### 3.7 `ROLES_VALIDOS` y `student` (D-11)

- `UsuarioAdminApplicationService.ROLES_VALIDOS`: quitar `admin_clinical` y `student` (D-11: se elimina).

### 3.8 Separación de alcance clínico vs Visión Global (D-13/D-14)

- **Servicios clínicos** (`CitaApplicationService.resolverAlcanceTerapeutas`, `PacienteApplicationService`, `DashboardScopeResolver`, `ExpedienteRestController.validarAccesoPaciente`): quitar el shortcut `admin → GLOBAL`. El alcance se resuelve **siempre** por `terapeutaIds` (scoped), incluso para el admin-terapeuta. Un admin **puro** (sin perfil) no llega a estos endpoints (403 por permisos clínicos, D-2).
- **Nuevo módulo "Visión Global"** (solo `admin_platform`): endpoints globales — directorio completo, agenda completa, expedientes de todos, métricas globales. Protección: permiso nuevo `VISION_GLOBAL_LEER` (perm-031), otorgado solo a `admin_platform`.
- **Dashboard principal** del admin-terapeuta: scoped (sus métricas); lo global, en "Visión Global".
- La separación la garantizan los **endpoints**, no un flag del cliente.

---

## 4. Frontend

> ⚠️ **Nota de proceso**: hay cambios de markup (CTA/candado, labels, selector de rol). Eximir puntualmente la regla "no tocar HTML" de `demo-gap-implementation` para `usuarios.component.html`, `sidebar`, `header` y el nuevo flujo de registro.

### 4.1 Tipos y estado de rol

- `core/types/clinical.types.ts`: `Role = 'admin_platform' | 'therapist' | 'assistant' | 'supervisor' | 'patient'` (quitar `admin_clinical` y `student`, D-11).
- `core/services/role-state.service.ts`: `esAdmin()` → `hasRole('admin_platform')`; añadir helper `esTerapeuta()` ya existente y `tienePerfilTerapeuta()` (derivado de `terapeutaIds` no vacío).

### 4.2 Guards y rutas

- `admin-platform.guard.ts`: se conserva (ya valida `admin_platform`).
- `home-redirect.guard.ts`: **bifurcar** — `admin_platform` **puro** → `/admin/dashboard`; `admin_platform` **+ `therapist`** → `/dashboard` (scoped, D-14).
- `app.routes.ts` — roles finales por ruta (solo se **quita** `admin_clinical` y `student`; nadie gana ni pierde acceso, D-6):
  - `/admin/educar-leva`: `hasAnyRoleGuard('admin_platform')`.
  - `/auditoria`: `hasAnyRoleGuard('admin_platform','supervisor')`.
  - `/mi-consulta`: `hasAnyRoleGuard('admin_platform','therapist','supervisor')` (sin `assistant`).
  - `biblioteca`/`campus`/`desempeno`: `hasAnyRoleGuard('admin_platform','therapist','supervisor')`.
  - `configuracion`: `hasAnyRoleGuard('admin_platform','therapist','assistant','supervisor')`.
  - Rutas con `staffOnlyGuard` (agenda/expedientes/pacientes/supervision): **sin cambio** (solo bloquean `patient`).
  - Nueva ruta `vision-global`: `admin-platform.guard` (solo `admin_platform`).
- El **candado para admin puro** NO se hace con guards de ruta: se hace a nivel de componente (§4.4, CTA), porque el backend ya devuelve 403 a quien no tiene el permiso clínico (D-2).

### 4.3 UI

- `sidebar.component.ts`: los ítems clínicos se muestran con los **mismos roles de sus rutas** (§4.2), quitando solo `admin_clinical`/`student`; el admin puro sin perfil ve candado/CTA (§4.4). Añadir ítem "Visión Global" (solo `admin_platform`).
- `header.component.ts`: un solo label "Administrador" (quitar badge de "Administrador Clínico").
- `usuarios.component.ts`: eliminar `admin_clinical` del union local `RolPlataforma` y del array `roles`; el guard de "último admin" debe usar `roles.includes('admin_platform')` (soporta multi-rol); la visualización de rol usa precedencia (`admin_platform` primero), no `roles[0]`.
- `mi-consulta.component.ts` / `dashboard-plataforma.component.ts`: títulos/labels unificados.

### 4.4 CTA / candado por módulo (D-9)

- En los módulos clínicos, si `esAdmin() && !esTerapeuta() && terapeutaIds.length === 0` (admin puro sin perfil) → estado bloqueado + CTA "Completa tu identidad de terapeuta". **No** usar `!hasRole('therapist')` (bloquearía a asistentes/supervisores).
- El CTA navega a **Configuración** (sección "Perfil de terapeuta"), reutilizando el formulario existente (cédula, especialidad, honorarios, duración, edad, sedes) — no crear un componente nuevo.
- **Flujo de registro**: reutiliza el formulario de Configuración ("Perfil de terapeuta") con confirmación de contraseña → `POST /usuario/identidad-terapeuta`. No se crea un componente nuevo.
- **Configuración**: sección "Perfil de terapeuta" con datos y botón "Dar de baja".

### 4.5 Módulo "Visión Global" (D-13/D-14)

- Nueva ruta `vision-global` (en el shell `admin`) protegida por `admin-platform.guard` (solo `admin_platform`).
- Consume los endpoints globales (§3.8): directorio completo, agenda completa, expedientes de todos, métricas globales.
- **Distinto de** `/admin/dashboard` (Dashboard Plataforma): este mantiene los KPIs de plataforma; "Visión Global" es la consulta global de datos clínicos.
- **Aterrizaje**: el admin-terapeuta aterriza en su **dashboard scoped** (D-14); "Visión Global" es una entrada del menú admin.
- Los tabs clínicos (agenda/expedientes/pacientes/mi-consulta) consumen los endpoints **scoped** (§3.8); para el admin-terapeuta muestran solo sus pacientes.

---

## 5. Verificación

- **Backend**: compilación limpia; Flyway aplica `V41`; checks de rol simplificados.
- **API**:
  1. Login `admin_platform` unificado → authorities `ROLE_ADMIN_PLATFORM` (no `ROLE_ADMIN_CLINICAL`).
  2. Admin sin perfil: `GET /expedientes` ⇒ 403 (sin `EXPEDIENTE_LEER`).
  3. `POST /usuario/identidad-terapeuta` ⇒ crea `terapeutas` + config + rol `therapist`; token inválido ⇒ re-login.
  4. Tras re-login: `terapeutaIds` poblado; `GET /expedientes` y agendar funcionan.
  5. `POST /usuario/identidad-terapeuta/baja` ⇒ quita rol `therapist`, desactiva perfil; clínico vuelve a 403.
  6. Protección "último admin": suspender al último admin activo ⇒ 409.
  7. Admin-terapeuta: en tabs clínicos solo sus pacientes; en "Visión Global" ve todo.
  8. `GET /sedes/{id}` funciona para terapeuta (por `EXPEDIENTE_LEER`) y para admin puro (por `SEDES_LEER`) tras re-apuntar `SedeRestController` a `hasAnyAuthority('EXPEDIENTE_LEER','SEDES_LEER').
- **Frontend**: `ng build` limpio; tabs clínicos con CTA si no hay perfil; desbloqueo tras registro; selector de rol con un solo admin.
- **E2E**: unificar roles → login admin → CTA → registro de identidad → desbloqueo clínico → atender paciente → baja de perfil.
- **Tests unitarios**: `RegistrarIdentidadTerapeuta` / `DarBajaPerfilTerapeuta` / `resolverTerapeutaId`.

---

## 6. Riesgos y observaciones

1. **Reducción de permisos de `admin`**: hoy `admin_platform` lo tiene todo; tras V41 pierde los clínicos hasta registrarse como terapeuta. Confirmar con negocio (D-2).
2. **Sesiones activas**: el bump de `token_version` invalida sesiones; los usuarios afectados deben re-login.
3. **Bypass de expediente**: quitarlo puede romper a un admin que "audita" expedientes sin ser terapeuta; decidir si se crea un permiso explícito de auditoría.
4. **`resolverTerapeutaId`**: el cambio debe preservar el comportamiento de terapeutas normales (solo propio) y asistentes.
5. **`student`**: se elimina (D-11); limpiar `VALID_ROLES`, sidebar, guards de biblioteca/campus/desempeno, labels del header y `dashboard-student-view`.
6. **Naming**: decidido conservar `admin_platform`; solo se elimina `admin_clinical` (los literales del rol unificado ya existen).
7. **Histórico**: la baja de perfil debe **desactivar**, no borrar, la fila `terapeutas` (las sesiones/citas ya creadas la referencian).
8. **Inventario de permisos**: V41 redefine la lista de `rol-001`; confirmar que `PAGOS_*`/`CONSTANCIAS_EMITIR`/`ALERTAS_GESTIONAR` (operativos) permanecen en plataforma y que los clínicos (`EXPEDIENTE_*`, `AGENDA_*`, `MI_CONSULTA_EDITAR`, `SUPERVISION_*`, `PACIENTES_*`) quedan en `therapist`.
9. **Refresh tokens**: el bump de `token_version` invalida access tokens, pero no `refresh_tokens` (TTL 7 días). Para re-login real usar `RevocarSesionesUsuarioUseCase.revocar` en los casos de uso nuevos.

---

## 7. Estado documental y plan de ejecución

- [x] Gap-analysis (`gap-report-unificacion-rol-admin.md`)
- [x] Especificación backend (sección 3)
- [x] Especificación frontend (sección 4)
- [x] Migración `V41` especificada (sección 2)
- [x] Auditoría por `jarvis-database`, `jarvis-backend` y `jarvis-frontend` (✅ APROBADO los tres)
- [ ] Implementación
- [ ] E2E y reporte

### Checkpoints de ejecución (JARVIS)

```text
JVS-20251125-001 | jarvis-database  → V41__unificar_roles_admin.sql
JVS-20251125-002 | jarvis-backend   → simplificar checks de rol + bypass expediente + resolverTerapeutaId
JVS-20251125-003 | jarvis-backend   → RegistrarIdentidadTerapeutaUseCase + DarBajaPerfilTerapeutaUseCase
JVS-20251125-004 | jarvis-frontend  → colapsar rol admin + CTA/candado + flujo de registro + Configuración
JVS-20251125-005 | jarvis-security  → PBAC tras unificar (sin escalada indebida de clínico a admin puro)
JVS-20251125-006 | jarvis-qa        → tests + E2E del flujo completo
```
