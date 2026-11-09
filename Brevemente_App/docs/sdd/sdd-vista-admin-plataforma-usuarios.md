# SDD: Módulo 2 — Gestión de Usuarios y Roles (Vista Admin)

- **Fecha**: 2026-11-09
- **Módulo**: `admin/usuarios` (Gestión de Usuarios y Roles)
- **Rol**: `admin_platform` (rol-001)
- **Estado**: DISEÑO — listo para implementación
- **Relacionado**: gap-report-vista-admin-plataforma-1 §5, ADR-005 (credenciales), sdd-credenciales-onboarding.md, SDD Módulo 1 Dashboard
- **Rama de trabajo**: `feature/jp-vista-admin-1`

---

## 1. Propósito

CRUD de cuentas de la plataforma (staff) con asignación de **roles**, **permisos derivados** y **estados de acceso**. Materializa el permiso existente `ADMIN_USUARIOS` (perm-011), que hoy no tiene pantalla.

**Principios**:
- El admin gestiona **cuentas de staff** (admin_platform, admin_clinical, supervisor, therapist, assistant, student). **NO** crea pacientes (eso corresponde al terapeuta, vía módulo Pacientes + ADR-005).
- Los **permisos se derivan del rol** (matriz `rol_permisos`); el admin nunca los asigna directamente.
- **Restricciones de negocio**: el admin no puede suspenderse a sí mismo, ni desactivar/suspender al último `admin_platform` activo.
- Toda alta/baja/cambio de rol o estado queda **auditada** en `auditoria_gestion`.
- El alta de un usuario nuevo **genera contraseña temporal** (ADR-005 / SDD credenciales).

---

## 2. Decisiones de diseño

| # | Decisión | Detalle |
| :--- | :--- | :--- |
| D1 | Contexto | Nuevo bounded context `usuario` (gestión admin). El contexto `auth` sigue siendo dueño de credenciales/contraseñas. |
| D2 | Permiso | Se reutiliza `ADMIN_USUARIOS` (perm-011) en todos los endpoints del módulo. Sin permisos nuevos. |
| D3 | Roles asignables | Solo roles de staff: `admin_platform`, `admin_clinical`, `supervisor`, `therapist`, `assistant`, `student`. `patient` NO es asignable aquí. |
| D4 | Estados | `usuarios.estado` con 3 valores: `activo`, `suspendido`, `inactivo`. El flag `activo` (boolean) se mantiene **sincronizado** para no tocar el login actual. |
| D5 | Alta + credencial | `POST /admin/usuarios` crea la identidad y, en la misma transacción, delega en `GenerarPasswordTemporalUseCase` (auth) para fijar la temporal + flag. La respuesta incluye la temporal **una sola vez**. |
| D6 | Restricciones | No auto-suspensión; no desactivar/suspender al último `admin_platform` activo. Validación **server-side transaccional**. |
| D7 | Anti mass-assignment | El DTO solo acepta identidad + roles whitelisted + estado (+ cédula/especialidad para therapist). Nunca acepta permisos ni `terapeutaIds`/`usuarioId` desde el cliente. |
| D8 | Revocación | Cambio de rol o estado → `token_version++` + revocación de refresh tokens en la misma transacción (reutiliza el patrón de auth). |
| D9 | Auditoría | Alta, edición, cambio de estado y reset se registran en `auditoria_gestion` (V27). |
| D10 | Terapeuta asociado | Si el rol incluye `therapist`, se crea/actualiza el perfil `terapeutas` vinculado (cédula, especialidad). |
| D11 | Asignaciones | Terapeuta ↔ asistente se gestiona sobre `asignaciones_terapeuta` (N:M, V6), vía endpoint dedicado `PUT /admin/usuarios/{id}/asignaciones`. |
| D12 | Reautenticación en privilegios | **En alcance**: antes de cambios de privilegio/acceso (rol, estado, reset), el admin **re-ingresa su contraseña** (`passwordConfirmacion`). Es *step-up* por contraseña (mismo factor, sin canal externo); protege contra sesión robada. |

---

## 3. Backend (hexagonal)

### 3.1 Paquete

```
com.syborx.brevemente.usuario                // bounded context de administración de usuarios
  domain/model/          UsuarioAdmin, EstadoUsuario, RolAsignable, ResumenUsuarios, AsignacionTerapeuta
  domain/exception/      UsuarioNoEncontradoException, UsuarioConflictException
  application/
    ports/in/            ListarUsuariosUseCase, ObtenerUsuarioUseCase, CrearUsuarioUseCase,
                         EditarUsuarioUseCase, CambiarEstadoUsuarioUseCase, GestionarAsignacionesUseCase
    ports/out/           UsuarioAdminRepositoryPort
    service/             UsuarioAdminApplicationService
  infrastructure/
    adapters/in/rest/    AdminUsuarioController, dto/, mapper/UsuarioAdminRestMapper
    adapters/in/rest/advice/ UsuarioExceptionHandler
    adapters/out/persistence/ UsuarioAdminPersistenceAdapter
```

> **Límites de contexto y propiedad de columnas**: `usuario` administra identidad/roles/estado sobre `usuarios`, `usuario_roles` y `terapeutas`. Para contraseñas, revocación de sesión y reautenticación, **consume** los puertos de `auth` (`GenerarPasswordTemporalUseCase`, `RevocarSesionesUsuarioUseCase`, `VerificarPasswordActualUseCase`).
>
> - `auth` es dueño de `password_hash`, `debe_cambiar_password`, `password_temporal_vence_en` y `token_version`; `usuario` **no** los escribe directamente (solo vía puertos de `auth`).
> - `usuario` es dueño de `nombre`, `apellidos`, `email`, `estado`, `activo`, `usuario_roles` y del perfil `terapeutas` vinculado.

### 3.2 Casos de uso (devuelven dominio, no DTO)

| Caso de uso | Entrada | Salida (dominio) | Efecto |
| :--- | :--- | :--- | :--- |
| `ListarUsuariosUseCase` | `q`, `rol`, `estado`, `page`, `size` | `ResumenUsuarios` (pagina + total) | lectura |
| `ObtenerUsuarioUseCase` | `usuarioId` | `UsuarioAdmin` | lectura |
| `CrearUsuarioUseCase` | `CrearUsuarioCommand`, `actorId` | `UsuarioCreado` (usuario + temporal) | alta + roles + terapeuta + temporal + auditoría |
| `EditarUsuarioUseCase` | `usuarioId`, `EditarUsuarioCommand`, `actorId` | `UsuarioAdmin` | identidad/roles/estado + revocación si cambió rol/estado + auditoría |
| `CambiarEstadoUsuarioUseCase` | `usuarioId`, `estado`, `actorId` | `UsuarioAdmin` | valida restricciones + revocación + sincroniza `terapeutas.activo` + auditoría |
| `GestionarAsignacionesUseCase` | `usuarioId` (assistant), `terapeutaIds`, `actorId` | `UsuarioAdmin` | reemplaza asignaciones en `asignaciones_terapeuta` + auditoría |

> `RevocarSesionesUsuarioUseCase` y `GenerarPasswordTemporalUseCase` son **puertos de entrada de `auth`** (ver SDD credenciales §3.2); `usuario` los consume, no los implementa.

### 3.3 Endpoints REST (context-path `/api/v1`)

| Método | Ruta | `@PreAuthorize` | Respuesta |
| :--- | :--- | :--- | :--- |
| GET | `/admin/usuarios?q=&rol=&estado=&page=&size=` | `hasAuthority('ADMIN_USUARIOS')` | `ResumenUsuariosDTO` |
| GET | `/admin/usuarios/{id}` | `hasAuthority('ADMIN_USUARIOS')` | `UsuarioAdminDTO` |
| POST | `/admin/usuarios` | `hasAuthority('ADMIN_USUARIOS')` | `UsuarioCreadoDTO` (usuario + `passwordTemporal`) |
| PUT | `/admin/usuarios/{id}` | `hasAuthority('ADMIN_USUARIOS')` | `UsuarioAdminDTO` |
| PATCH | `/admin/usuarios/{id}/estado` | `hasAuthority('ADMIN_USUARIOS')` | `UsuarioAdminDTO` |
| GET | `/admin/usuarios/{id}/asignaciones` | `hasAuthority('ADMIN_USUARIOS')` | `List<String>` (terapeutaIds) |
| PUT | `/admin/usuarios/{id}/asignaciones` | `hasAuthority('ADMIN_USUARIOS')` | `UsuarioAdminDTO` |
| POST | `/admin/usuarios/{id}/password-temporal` | `hasAuthority('ADMIN_USUARIOS')` | `PasswordTemporalResponse` (delega en credenciales) |

> `POST /admin/usuarios/{id}/password-temporal` está documentado en el SDD de credenciales; aquí es un **adaptador delgado** que invoca `GenerarPasswordTemporalUseCase` con motivo `RESET`.
>
> **Reautenticación (D12)**: `PUT /admin/usuarios/{id}` (edición), `PATCH /admin/usuarios/{id}/estado` y `POST /admin/usuarios/{id}/password-temporal` exigen `passwordConfirmacion` (la contraseña del admin que ejecuta), validada vía `VerificarPasswordActualUseCase` de `auth` antes de ejecutar.

### 3.4 DTOs

```java
public record UsuarioAdminDTO(
    String id,
    String nombre,
    String apellidos,
    String email,
    List<String> roles,          // códigos de rol (snake_case)
    String estado,               // activo | suspendido | inactivo
    String cedulaProfesional,    // solo therapist
    String especialidad,         // solo therapist
    List<String> terapeutaIds,   // solo assistant (asignaciones_terapeuta)
    LocalDateTime ultimoAcceso,  // ISO-8601
    LocalDateTime creadoEn       // ISO-8601
) {}

public record ResumenUsuariosDTO(
    List<UsuarioAdminDTO> items,
    long total,
    int page,
    int size
) {}

public record UsuarioCreadoDTO(
    UsuarioAdminDTO usuario,
    String passwordTemporal      // se muestra UNA sola vez (alta)
) {}

public record CrearUsuarioRequest(
    @NotBlank String nombre,
    @NotBlank String apellidos,
    @NotBlank @Email String email,
    @NotEmpty List<String> roles,
    @NotBlank String estado,     // estado inicial (default activo)
    String cedulaProfesional,
    String especialidad
) {}

public record EditarUsuarioRequest(
    @NotBlank String nombre,
    @NotBlank String apellidos,
    @NotBlank @Email String email,
    @NotEmpty List<String> roles,       // SIN estado: el estado va por PATCH /estado
    String cedulaProfesional,
    String especialidad,
    @NotBlank String passwordConfirmacion   // D12: reautenticación
) {}

public record CambiarEstadoRequest(
    @NotBlank String estado,
    @NotBlank String passwordConfirmacion   // D12: reautenticación
) {}

public record AsignacionesRequest(@NotNull List<String> terapeutaIds) {}

public record ResetPasswordRequest(@NotBlank String passwordConfirmacion) {}   // D12: reautenticación para reset
```

### 3.5 Reglas de negocio (server-side, transaccionales)

1. **No auto-suspensión / auto-remoción**: si `usuarioId == actorId`, rechazar cualquier cambio de estado a `suspendido`/`inactivo` o la remoción del rol `admin_platform`.
2. **Último admin**: si el usuario es `admin_platform` con `estado='activo'` y el cambio lo lleva a `suspendido`/`inactivo`, contar los `admin_platform` activos; si es el último → rechazar (`409`).
3. **Roles válidos**: validar contra el catálogo `roles` (solo staff); `patient` rechazado.
4. **Cédula/especialidad**: requeridas solo si `roles` contiene `therapist`; ignoradas para otros roles. Cédula duplicada → `409` (`ux_terapeutas_cedula`).
5. **Email único** (case-insensitive): `409` si ya existe (usa el índice `ux_usuarios_email_lower`).
6. **Permisos**: nunca se aceptan del cliente; se derivan de `rol_permisos`. El frontend NO mantiene un mapa estático (evita el drift ADM1-07); los permisos derivados los expone el backend (en el DTO o vía catálogo).
7. **Revocación**: cambio de rol o estado ⇒ `token_version++` + revocar refresh tokens en la misma transacción (vía `RevocarSesionesUsuarioUseCase` de `auth`).
8. **Auditoría**: escribir en `auditoria_gestion` (`ALTA_USUARIO`, `EDICION_USUARIO`, `CAMBIO_ESTADO_USUARIO`, `ASIGNACION_TERAPEUTA`), con `actor_id`, `entidad='USUARIO'`, `entidad_id`, `detalle` JSONB.
9. **Asignaciones**: `terapeutaIds` solo válido si `roles` contiene `assistant`; se reemplazan en `asignaciones_terapeuta` (transacción) y se auditan.
10. **Ciclo de vida del perfil `terapeutas`**: al quitar el rol `therapist`, conservar el perfil pero desvincularlo (o rechazar si tiene citas/pacientes referenciados). Al suspender/reactivar, sincronizar `terapeutas.activo` con `usuarios.estado`.

> **Reautenticación en cambios de privilegio (D12)**: antes de cambiar roles, estado o resetear contraseña, se valida `passwordConfirmacion` (la contraseña del admin que ejecuta) vía `VerificarPasswordActualUseCase` de `auth`. Si no coincide → `401`/`403`. Es *step-up* por contraseña (mismo factor); protege contra sesión robada, no es MFA estricto.

### 3.6 Errores

- `401` sin autenticación, `403` sin `ADMIN_USUARIOS`.
- `401` (o `403`) si `passwordConfirmacion` no coincide (D12).
- `400` validación (roles inválidos, estado inválido, campos requeridos, cédula faltante para therapist).
- `409` conflicto de regla (auto-suspensión, último admin, email duplicado, cédula duplicada).
- `404` usuario inexistente.
- `500` genérico sin exponer `ex.getMessage()`.

---

## 4. Base de datos (migración V28)

```sql
-- V28__usuarios_estado.sql

-- 1. Estado de ciclo de vida (activo | suspendido | inactivo)
ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS estado VARCHAR(20) NOT NULL DEFAULT 'activo';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
                   WHERE c.conname = 'ck_usuarios_estado' AND t.relname = 'usuarios') THEN
        ALTER TABLE usuarios ADD CONSTRAINT ck_usuarios_estado
            CHECK (estado IN ('activo','suspendido','inactivo'));
    END IF;
END $$;

-- 2. Backfill re-run-safe ANTES de la restricción de sincronía
UPDATE usuarios SET estado = 'inactivo' WHERE activo = FALSE AND estado = 'activo';

-- 3. Restricción de sincronía activo ⇔ estado (se añade DESPUÉS del backfill)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
                   WHERE c.conname = 'ck_usuarios_estado_activo' AND t.relname = 'usuarios') THEN
        ALTER TABLE usuarios ADD CONSTRAINT ck_usuarios_estado_activo
            CHECK ((estado = 'activo') = activo);
    END IF;
END $$;
```

> - `activo` (boolean) se mantiene **sincronizado** con `estado`; el CHECK `ck_usuarios_estado_activo` lo garantiza a nivel BD (`(estado='activo') = activo`). El login sigue usando `activo` sin cambios.
> - El servicio sincroniza además `terapeutas.activo` con `usuarios.estado` al suspender/reactivar (evita contar terapeutas suspendidos como activos en el dashboard).
> - **V26** (Dashboard) y **V27** (credenciales) deben existir antes que V28.
> - La distinción `suspendido` vs `inactivo` es de negocio (temporal vs definitiva); ambas dejan de autenticar.

---

## 5. Frontend (Angular 18 standalone)

### 5.1 Tipos / contrato

```ts
export type EstadoUsuario = 'activo' | 'suspendido' | 'inactivo';
export type RolStaff = 'admin_platform' | 'admin_clinical' | 'supervisor' | 'therapist' | 'assistant' | 'student';

export interface UsuarioAdmin {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  roles: RolStaff[];
  estado: EstadoUsuario;
  cedulaProfesional?: string;
  especialidad?: string;
  terapeutaIds?: string[];       // solo assistant (asignaciones_terapeuta)
  ultimoAcceso?: string;         // ISO-8601; el adapter formatea a "hace X"
  creadoEn?: string;             // ISO-8601
}

export interface ResumenUsuarios {
  items: UsuarioAdmin[];
  total: number;
  page: number;
  size: number;
}

export interface UsuarioCreado {
  usuario: UsuarioAdmin;
  passwordTemporal: string;      // se muestra una sola vez
}

export interface CrearUsuarioPayload {
  nombre: string;
  apellidos: string;
  email: string;
  roles: RolStaff[];
  estado: EstadoUsuario;
  cedulaProfesional?: string;
  especialidad?: string;
}

export interface EditarUsuarioPayload {
  nombre: string;
  apellidos: string;
  email: string;
  roles: RolStaff[];             // SIN estado (el estado va por PATCH /estado)
  cedulaProfesional?: string;
  especialidad?: string;
  passwordConfirmacion: string;  // D12
}

export interface CambiarEstadoPayload { estado: EstadoUsuario; passwordConfirmacion: string; }
export interface AsignacionesPayload { terapeutaIds: string[]; }
```

> **Transformaciones al conectar el mock** (el mock actual diverge): `rol` (único) → `roles[]` (multi-rol); `cedula` → `cedulaProfesional`; `nombre` completo → `nombre` + `apellidos`; `ultimaActividad` relativa → `ultimoAcceso` ISO; eliminar `patient` del selector (D3); resolver "Tú" por el `id` de sesión (no por email hardcodeado).

### 5.2 Componentes y wiring

- El mock actual (`modules/admin/usuarios/usuarios.component.ts`) se **extrae a un adapter** y se sustituye por la capa hexagonal, igual que el Dashboard:
  ```
  modules/admin/usuarios/
  ├─ usuarios.component.ts|html|scss      // consume el repository
  ├─ ports/usuarios.repository.ts         // UsuariosAdminRepository (abstract)
  └─ adapters/
     ├─ usuarios-http.adapter.ts          // AdminUsuariosHttpAdapter (backend real)
     └─ usuarios-localstorage.adapter.ts  // mock extraído (paridad Dashboard)
  ```
- **Feature flag**: añadir `environment.features.usuariosBackend` y el `providers` con `useFactory`, siguiendo el patrón hexagonal real de `modules/dashboard/dashboard.component.ts` (no el mock de `dashboard-plataforma.component.ts`).
- **Alta**: tras `201`, renderiza `UsuarioCreadoDTO.passwordTemporal` **una sola vez** (botón copiar + aviso fuera de banda); NO generarla en el cliente (eliminar `generarTemporal()`).
- **Restablecer**: renderiza `PasswordTemporalResponse.passwordTemporal`; misma regla de "una sola vez".
- **Regla "una sola vez"**: el valor no se persiste en estado/logs, no es re-obtenible por lectura, y se limpia al cerrar el modal.

### 5.3 UX y accesibilidad

- Filtros por rol y estado + búsqueda con `debounceTime` + botón "limpiar filtros"; paginación (controles page/size).
- Badge de estado: `activo` verde, `suspendido` ámbar, `inactivo` gris.
- Fila del admin actual marcada "Tú" y **no editable** (resuelto por `id` de sesión, no por email).
- **Multi-rol**: selector multi (chips/checkboxes); cédula/especialidad aparecen si **alguno** de los roles es `therapist`.
- **Permisos derivados**: no usar un mapa estático en frontend (reincidiría en el drift ADM1-07). El backend los expone (en el DTO o vía catálogo `GET /admin/permisos`); los chips son de solo lectura.
- **Reautenticación (D12)**: antes de editar, suspender/cambiar estado o resetear, mostrar modal que pide **re-ingresar la contraseña del admin** (`passwordConfirmacion` en el payload) y que actúa como **confirmación** de la acción destructiva. En error `401`, mostrar "contraseña incorrecta" y permitir reintento.
- **Estados**: skeleton/spinner, error inline con reintento, vacío ilustrado.
- **A11y**: focus-trap y foco inicial en modales, `aria-live`/`role="alert"` para errores y "Copiado", `aria-describedby` en errores de formulario, `sr-only` para "Tú"/"No editable", labels en los filtros.

---

## 6. Criterios de aceptación

1. El admin lista usuarios con filtros por búsqueda, rol y estado.
2. Al dar de alta un staff, el sistema crea la identidad, asigna roles y devuelve la **contraseña temporal una sola vez**; en BD queda el hash + flag `debe_cambiar_password`.
3. Si el rol es `therapist`, se crea/actualiza el perfil `terapeutas` con cédula y especialidad.
4. El admin no puede suspenderse/desactivarse a sí mismo (409).
5. El admin no puede desactivar/suspender al último `admin_platform` activo (409).
6. Los permisos se derivan del rol; el DTO nunca acepta permisos directos.
7. Cambio de rol o estado revoca las sesiones (`token_version` + refresh tokens).
8. Cada alta/edición/cambio de estado queda en `auditoria_gestion`.
9. El restablecimiento de contraseña genera temporal (delegando al SDD de credenciales).
10. Todos los endpoints responden `403` sin `ADMIN_USUARIOS`.
11. El admin puede asignar/desasignar terapeutas a un asistente (`asignaciones_terapeuta`), solo cuando el usuario tiene rol `assistant`.
12. Cambiar roles, estado o resetear contraseña exige `passwordConfirmacion`; una contraseña incorrecta se rechaza (401/403).

---

## 7. Pruebas

- **Backend (unit)**: casos de uso con puertos mockeados; reglas de negocio (auto-suspensión, último admin, roles válidos, cédula para therapist, asignaciones solo assistant); revocación en cambio de rol/estado; sincronía `terapeutas.activo`; reautenticación D12 (passwordConfirmacion válida/inválida).
- **Backend (integration)**: listado paginado (`ResumenUsuariosDTO`), `403` sin permiso, email/cédula duplicados → `409`.
- **Backend (integration)**: `403` sin `ADMIN_USUARIOS`; email duplicado → 409; alta crea usuario + roles + temporal.
- **Frontend (component)**: filtros, modal alta/edición, mostrar temporal una vez, badge de estados, fila "Tú" no editable.
- **E2E (Playwright)**: login admin → alta de terapeuta con temporal → cierre de flujo; intento de auto-suspensión → error.

---

## 8. Orden de implementación

1. Migraciones V26, V27 y V28 (en orden).
2. Backend credenciales (auth) — ver SDD credenciales.
3. Backend Módulo 2: dominio + puertos + `UsuarioAdminApplicationService` + persistencia.
4. Backend: `AdminUsuarioController` + DTOs + mapper (incluye adaptador delgado de `password-temporal`).
5. Frontend: capa de datos (`ports`/`adapters`) y conexión del mock a los endpoints reales.
6. Pruebas unitarias, de integración y E2E.

---

## 9. Relación con otros artefactos

- **ADR-005 + SDD credenciales**: fuente del mecanismo de contraseña temporal y del flag `debe_cambiar_password`.
- **SDD Módulo 1 Dashboard**: comparte el patrón hexagonal y los tokens visuales del shell admin.
- **gap-report-vista-admin-plataforma-1 §5**: alcance y consideraciones de seguridad originales.
- **SDD Módulo 3 Sedes** (pendiente): compartirá el mismo patrón de implementación.
