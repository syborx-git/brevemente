# GAP Analysis Report: Unificación de Roles Admin + Onboarding de Identidad Clínica

- **Fecha**: 2026-11-25
- **Rama**: `feature/jp-pagos-reembolso` (base de trabajo actual)
- **Alcance**: roles/permisos (PBAC) · `auth` + `usuario` + `cita` + `paciente` + `expediente` + `dashboard` + `leva` (backend hexagonal) · `core` (guards, role-state, sidebar, header) y módulos `admin/*` (frontend Angular)
- **Estado**: AUDITADO (READ-ONLY)
- **Premisa de negocio**: los únicos administradores serán los **doctores dueños del sistema** (~2). Deben poder **gestionar usuarios**, **entrenar LEVA** y **atender pacientes** (son doctores). El acceso clínico se desbloquea al **completar su identidad como terapeuta**.

---

## 1. Contexto y problema

Hoy existen dos roles de administración con fronteras difusas:

- `admin_platform` (rol-001): superadmin con **todos** los permisos.
- `admin_clinical` (rol-002): "gestión operativa clínica", pero **sin** `AGENDA_GESTIONAR`, `ADMIN_USUARIOS`, `ADMIN_DASHBOARD_LEER`, `CONFIGURACION_SISTEMA`, `EXPEDIENTE_*`, `PACIENTES_ELIMINAR`.

El objetivo es **un solo rol** `admin_platform` (unificado; se conserva el código existente), con un matiz clave: ser **administrador** y ser **terapeuta** son dos cosas distintas. El rol unificado da poderes de plataforma; el rol de terapeuta (que hoy ya existe) da poderes clínicos. El dueño-doctor obtiene ambos al **auto-registrarse como terapeuta**.

Flujo objetivo:

```text
Login como admin (unificado)
   │  ve tabs de plataforma (usuarios, sedes, entrenar LEVA, config, reportes)
   │  y ve tabs clínicos BLOQUEADOS con CTA "Completa tu identidad de terapeuta"
   ▼
Entra a un módulo clínico → CTA de registro de identidad
   ▼
Completa: cédula, especialidad, honorarios, duración, sede, edad mínima
   ▼
Backend crea terapeutas + TerapeutaConfig + asigna rol therapist (multi-rol admin+therapist)
   ▼
Refresh de token → terapeutaIds llega → módulos clínicos desbloqueados
```

---

## 2. Estado actual verificado

| Elemento | Estado |
| :--- | :--- |
| Roles (V4) | 6 roles: `admin_platform`, `admin_clinical`, `therapist`, `assistant`, `supervisor`, `patient`. |
| `admin_platform` (rol-001) | Tiene **todos** los permisos (V5: `SELECT id FROM permisos`). Incluye clínicos (`EXPEDIENTE_*`, `AGENDA_GESTIONAR`, `PACIENTES_*`). |
| `admin_clinical` (rol-002) | Subset operativo; V6 **revoca** `AGENDA_GESTIONAR`; sin `ADMIN_USUARIOS`, `ADMIN_DASHBOARD_LEER`, `CONFIGURACION_SISTEMA`, `EXPEDIENTE_*`, `PACIENTES_ELIMINAR`. |
| Usuarios seed | `admin@brevemente.org` → rol-001; `patricia.ortiz@brevemente.org` → rol-002. |
| JWT / authorities | `JwtAuthFilter` mapea roles a `ROLE_<ROL>` y permisos a authorities planos; `JwtService` emite `roles`, `permissions` y `terapeutaIds`. |
| Vínculo terapeuta | `terapeutaIds` sale de `VinculoJpaProjection`: `terapeutas.usuario_id = :usuarioId` UNION `asignaciones_terapeuta`. **Independiente del rol.** |
| Alta de terapeuta | **Implícita** en `UsuarioAdminPersistenceAdapter.insertarUsuario`: si `roles` contiene `therapist`, inserta fila `terapeutas` (cédula, especialidad, activo, usuario_id). Config (honorarios/duración/edad/sede) por separado vía `TerapeutaConfigApplicationService.actualizarConfig`. |
| Scope por rol | `resolverAlcanceTerapeutas` / `DashboardScopeResolver`: admin ⇒ **GLOBAL**; therapist/assistant ⇒ `terapeutaIds` propios; supervisor ⇒ supervisados. |
| Checks duros backend | ~8 archivos con `tieneRol("admin_platform") || tieneRol("admin_clinical")` + `hasAnyRole('ADMIN_PLATFORM','ADMIN_CLINICAL')` en `LevaCaseSourceController`. |
| Bypass expediente | `ExpedienteRestController` (~L228) deja pasar a `ROLE_ADMIN_PLATFORM || ROLE_ADMIN_CLINICAL` sin `EXPEDIENTE_LEER`. |
| `resolverTerapeutaId` | Si el usuario tiene **1** `terapeutaId`, devuelve ese siempre (ignora explícito); admin sin vínculo debe pasar `terapeutaId` explícito. |
| Frontend | `Role` union (`admin_platform | admin_clinical | ...`), `esAdmin()` = ambos, `admin-platform.guard` (solo `admin_platform`), `home-redirect` (`admin_platform` → `/admin/dashboard`), `sidebar` arrays, `header` labels, selector de rol en `usuarios.component`, labels en `mi-consulta`/`dashboard-plataforma`. |
| `student` | **Sí existe** (`rol-007`, V4), pero **sin permisos** (`rol_permisos`) ni usuarios seed; aparece en frontend y `ROLES_VALIDOS`. |
| Último admin | `contarAdminsActivos` filtra `r.codigo = 'admin_platform'`. |

---

## 3. Matriz de brechas (GAP-ADMIN)

| ID | Tipo | Brecha | Impacto | Acción propuesta |
| :--- | :--- | :--- | :--- | :--- |
| GAP-ADMIN-01 | INCORRECT | Dos roles admin separados con fronteras difusas. | Doble mantenimiento; semántica ambigua. | Unificar en **un** rol `admin`. |
| GAP-ADMIN-02 | INCORRECT | `admin_platform` tiene **todos** los permisos, incluidos clínicos. | Un admin "puro" podría tocar expedientes/agenda sin ser terapeuta. | Reducir el rol `admin_platform` a permisos de **plataforma**; lo clínico queda en `therapist`. |
| GAP-ADMIN-03 | MISSING | No hay **registro de identidad de terapeuta self-service**. | El dueño no puede "convertirse" en doctor sin que otro admin lo dé de alta. | Nuevo caso de uso `registrarIdentidadTerapeuta` (crea `terapeutas` + `TerapeutaConfig` + asigna rol `therapist` al propio usuario). Reutiliza la lógica de `insertarUsuario`/`actualizarConfig`. |
| GAP-ADMIN-04 | MISSING | No hay **baja** de perfil de terapeuta. | El registro no es reversible. | Caso de uso `darBajaPerfilTerapeuta` (desactiva perfil + quita rol `therapist`), expuesto en Configuración. |
| GAP-ADMIN-05 | INCORRECT | ~8 checks backend `tieneRol("admin_platform") \|\| tieneRol("admin_clinical")` + `hasAnyRole(...)` en LEVA. | Tras unificar, quedan referencias al rol viejo. | Colapsar a `tieneRol("admin_platform")`. |
| GAP-ADMIN-06 | MISSING | Frontend sin concepto de "admin sin perfil" ni CTA/candado por módulo. | El dueño no entiende qué le falta para lo clínico. | CTA por módulo basado en `hasRole('therapist')` / `terapeutaIds` vacío. |
| GAP-ADMIN-07 | DATA | Usuarios con rol-002; `rol_permisos` de ambos; sin revocación de sesiones. | Tras migrar, sesiones viejas conservan roles viejos. | Migración V41: reasignar usuarios, redefinir permisos del rol `admin`, eliminar rol-002, bump `token_version` de afectados. |
| GAP-ADMIN-08 | INCORRECT | `resolverTerapeutaId` con 1 `terapeutaId` ignora el `terapeutaId` explícito. | Un admin-doctor no puede agendar a nombre de otro terapeuta. | Permitir que admin sobreescriba el default (si es admin y pasa explícito, respetarlo). |
| GAP-ADMIN-09 | DATA | Rol `student` (`rol-007`) existe en DB pero sin permisos ni usuarios; referenciado en frontend y `ROLES_VALIDOS`. | Rol sin permisos efectivos. | Decidir: eliminar `rol-007` + limpiar referencias, o sembrar permisos. |
| GAP-ADMIN-10 | INCORRECT | Bypass en `ExpedienteRestController` para `ROLE_ADMIN_*`. | Admin sin perfil leería expedientes sin `EXPEDIENTE_LEER`. | Eliminar el bypass o condicionarlo a "admin **con** perfil de terapeuta". |
| GAP-ADMIN-11 | OK | `contarAdminsActivos` filtra `admin_platform` (código conservado). | Sin impacto. | Sin cambio (solo verificar). |
| GAP-ADMIN-12 | INCORRECT | UI con dos roles: labels, badges, selectores, guard `/admin/*`, `home-redirect`. | UX confusa; dos rutas de aterrizaje. | Colapsar a un solo "Administrador"; `/admin/*` y home-redirect al rol unificado. |
| GAP-ADMIN-13 | MISSING | Sin tests del flujo unificación/onboarding. | Regresión no detectada. | Tests: registrar identidad desbloquea clínico; admin puro no accede a clínico; baja de perfil revierte. |
| GAP-ADMIN-14 | INCORRECT | El alcance **global** del admin está hardcodeado en servicios clínicos (`resolverAlcanceTerapeutas`, `DashboardScopeResolver`, `validarAccesoPaciente`). | El admin-terapeuta vería todo en los tabs clínicos en vez de solo sus pacientes. | Quitar el shortcut `admin → GLOBAL` de los servicios clínicos; el alcance global se sirve desde el nuevo módulo "Visión Global" (solo `admin_platform`). |

---

## 4. Diseño propuesto

### 4.1 Matriz de permisos objetivo (propuesta base, validar en auditoría)

| Permiso | `admin_platform` (plataforma) | `therapist` (clínico) |
| :--- | :---: | :---: |
| ADMIN_USUARIOS, ADMIN_DASHBOARD_LEER, CONFIGURACION_SISTEMA, REPORTES_VER, SEDES_LEER, SEDES_GESTIONAR | ✅ | — |
| DASHBOARD_LEER (global) | ✅ | ✅ |
| LEVA_USAR | ✅ (entrenar LEVA) | ✅ (propuestas clínicas) |
| PAGOS_LEER / PAGOS_GESTIONAR / CONSTANCIAS_EMITIR / ALERTAS_GESTIONAR | ✅ (operativo) | — |
| PACIENTES_LEER/CREAR/EDITAR | — | ✅ |
| EXPEDIENTE_LEER/ESCRIBIR/FIRMAR | — | ✅ |
| AGENDA_LEER/GESTIONAR | — | ✅ |
| MI_CONSULTA_LEER/EDITAR | — | ✅ |
| SUPERVISION_* | — | (según supervisor) |

> **Regla**: el dueño-doctor queda `admin_platform` + `therapist` (multi-rol) al completar su identidad. **Permisos**: unión de ambas columnas. **Alcance**: en tabs clínicos solo sus pacientes (`terapeutaIds`); lo global, en el módulo "Visión Global" (solo `admin_platform`).

### 4.2 Flujo de onboarding de identidad clínica

```text
POST /api/v1/usuario/identidad-terapeuta   (usuario autenticado con rol admin_platform)
   │  body: { cedula, especialidad, honorarios{1a,seguimiento}, duracion, sede, edadMinima }
   ├─ validar cédula única (reutilizar existeCedula)
   ├─ verificar password actual (operación sensible)
   ├─ crear/actualizar fila terapeutas vinculada a usuario_id
   ├─ crear TerapeutaConfig (honorarios/duración/edad/sede)
   ├─ asignar rol therapist al usuario (multi-rol)
   ├─ bump token_version → forzar re-login
   └─ 200 + nuevo perfil
```

### 4.3 Baja de perfil (Configuración)

```text
POST /api/v1/usuario/identidad-terapeuta/baja
   ├─ verificar password
   ├─ quitar rol therapist
   ├─ desactivar perfil terapeutas (activo=false) o anular vínculo
   └─ bump token_version → forzar re-login
```

### 4.4 Migración V41 (borrador)

```sql
-- 0. Crear permisos de sedes y visión global (no existían)
INSERT INTO permisos (id, codigo, modulo, descripcion) VALUES
 ('perm-027','SEDES_LEER','SISTEMA','Ver sedes de atención'),
 ('perm-028','SEDES_GESTIONAR','SISTEMA','Gestionar sedes de atención'),
 ('perm-031','VISION_GLOBAL_LEER','SISTEMA','Ver la información global de la plataforma (auditoría)')
ON CONFLICT (codigo) DO NOTHING;

-- 1. Reasignar usuarios admin_clinical → admin_platform
INSERT INTO usuario_roles (usuario_id, rol_id)
SELECT ur.usuario_id, 'rol-001' FROM usuario_roles ur WHERE ur.rol_id='rol-002'
ON CONFLICT (usuario_id, rol_id) DO NOTHING;
DELETE FROM usuario_roles WHERE rol_id='rol-002';

-- 1b. Eliminar el rol student (D-11)
DELETE FROM usuario_roles WHERE rol_id='rol-007';
DELETE FROM rol_permisos  WHERE rol_id='rol-007';
DELETE FROM roles         WHERE id='rol-007';

-- 2. Redefinir permisos del rol admin_platform (solo plataforma)
DELETE FROM rol_permisos WHERE rol_id='rol-001';
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT 'rol-001', id FROM permisos WHERE codigo IN (
  'ADMIN_USUARIOS','ADMIN_DASHBOARD_LEER','CONFIGURACION_SISTEMA','REPORTES_VER',
  'SEDES_LEER','SEDES_GESTIONAR','DASHBOARD_LEER','LEVA_USAR',
  'PAGOS_LEER','PAGOS_GESTIONAR','CONSTANCIAS_EMITIR','ALERTAS_GESTIONAR','VISION_GLOBAL_LEER')
ON CONFLICT DO NOTHING;

-- 3. Eliminar rol-002
DELETE FROM roles WHERE id='rol-002';

-- 4. Forzar re-login de usuarios afectados
UPDATE usuarios SET token_version = token_version + 1
 WHERE id IN (SELECT ur.usuario_id FROM usuario_roles ur WHERE ur.rol_id='rol-001');
```

### 4.5 Separación de alcance: contexto clínico vs Visión Global

- **Tabs clínicos** (agenda, expedientes, pacientes, mi-consulta): alcance por `terapeutaIds` (pacientes propios), **incluso para el admin-terapeuta**. Se elimina el shortcut `admin → GLOBAL` de los servicios clínicos.
- **Módulo "Visión Global"** (solo `admin_platform`): endpoints globales (directorio completo, agenda completa, expedientes de todos, métricas globales).
- **Dashboard principal** del admin-terapeuta: scoped (propio); lo global se ve en "Visión Global".
- La separación la garantizan los **endpoints** (clínicos = scoped; visión global = admin-only), no un flag del cliente.

---

## 5. Preguntas abiertas

1. ✅ Resuelto: se conserva `admin_platform` (no se renombra).
2. ✅ Resuelto: se **elimina** `student` (`rol-007` + referencias frontend/backend).
3. ✅ Resuelto: `PACIENTES_*` queda solo clínico (admin puro no ve directorio).
4. ✅ Resuelto: la baja de perfil **desactiva** el terapeuta (conserva histórico).

---

## 6. Alcance estimado

| Capa | Esfuerzo |
| :--- | :--- |
| Migración V41 | bajo (1 archivo) |
| Backend (unificación + onboarding + baja + fixes) | medio-alto |
| Frontend (colapsar rol + CTA/candado + selector) | medio-alto |
| Tests + docs | medio |
