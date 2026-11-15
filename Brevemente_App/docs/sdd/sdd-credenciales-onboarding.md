# SDD: Credenciales Temporales y Onboarding de Cambio de Contraseña

- **Fecha**: 2026-11-09
- **Módulo transversal**: `auth` (credenciales) + consumo desde Módulo 2 Usuarios (admin) y módulo Pacientes (terapeuta)
- **Relacionado**: ADR-005 (decisión), gap-report-vista-admin-plataforma-1 §5.3, SDD Módulo 2 Usuarios (pendiente)
- **Estado**: DISEÑO — listo para implementación
- **Rama de trabajo**: `feature/jp-vista-admin-1` (la misma de la Vista Admin)

---

## 1. Propósito

Definir un **mecanismo único** de credenciales para todo el sistema, basado en la decisión ADR-005:

- Toda cuenta nueva nace con **contraseña temporal** generada por el sistema y el flag `debe_cambiar_password = true`.
- En el **primer login** con la temporal, el sistema detecta el flag y **obliga** al usuario a pasar por un **onboarding de cambio de contraseña**.
- El onboarding es **un solo componente reutilizable** para staff (app principal) y pacientes (portal del paciente).

**Alcance de este SDD**: la infraestructura compartida (flag, generación de temporal, enforcement, onboarding y auditoría). Los casos de negocio que la consumen son:

1. Alta de staff por el admin (Módulo 2 Usuarios).
2. Restablecimiento de contraseña de staff por el admin (Módulo 2 Usuarios).
3. Alta de paciente por el terapeuta (módulo Pacientes).

---

## 2. Decisiones de diseño

| # | Decisión | Detalle |
| :--- | :--- | :--- |
| D1 | Flag en BD | Columna `debe_cambiar_password BOOLEAN NOT NULL DEFAULT FALSE` en `usuarios`. |
| D2 | Regla de seguridad | **Nunca** permitir llegar al onboarding sin una credencial previa válida (prohibido "login sin contraseña"). |
| D3 | Temporal | Generada con `SecureRandom` (12+ caracteres, sin ambiguos), **mostrada una sola vez**, guardada como hash BCrypt, con **TTL** configurable (default 7 días). |
| D4 | Enforcement server-side | Filtro de seguridad que bloquea con `403` toda petición autenticada de un usuario con flag activo, excepto las rutas permitidas (`/auth/cambiar-password`, `/auth/me`, `/auth/logout`, `/auth/refresh`). |
| D5 | Login | `POST /auth/login` sigue emitiendo token, pero la respuesta incluye `debeCambiarPassword`; el frontend redirige al onboarding. El bloqueo real lo hace el filtro (D4), no la UI. |
| D6 | Cambio de contraseña | `POST /auth/cambiar-password` (autenticado): valida contraseña actual, política de la nueva, actualiza el hash, **limpia el flag y anula `password_temporal_vence_en`**, y registra auditoría. No revoca la sesión actual. |
| D7 | Generación de temporal | Endpoint de admin (`ADMIN_USUARIOS`) para staff y de terapeuta (`PACIENTES_CREAR`/`PACIENTES_EDITAR`) para pacientes. Ambos delegan en el caso de uso de credenciales del contexto `auth`. |
| D8 | Auditoría | Tabla `auditoria_gestion` (append-only): quién generó la temporal, a quién, cuándo y cuándo se completó el onboarding. |
| D9 | Revocación en reset | Al generar una temporal sobre un usuario existente (reset), se incrementa `token_version` y se revocan sus refresh tokens en la misma transacción. |

---

## 3. Backend (hexagonal)

### 3.1 Paquete

```
com.syborx.brevemente.auth/                    // el mecanismo vive en el contexto auth (ya posee credenciales)
  domain/model/          Usuario (+ debeCambiarPassword), PasswordTemporal
  application/
    ports/in/            CambiarPasswordUseCase, GenerarPasswordTemporalUseCase, RevocarSesionesUsuarioUseCase,
                         VerificarPasswordActualUseCase
    ports/out/           AutenticacionRepositoryPort (ampliado), AuditoriaGestionPort (nuevo)
    service/             CredencialApplicationService
  infrastructure/
    adapters/in/rest/    CredencialController (o endpoints en AuthController)
    security/            CredencialPendienteFilter (OncePerRequestFilter)
    adapters/out/...     persistencia de Usuario (ampliada) + AuditoriaGestionPersistenceAdapter
```

> La lógica de credenciales se mantiene en `auth` porque ya es dueño de `password_hash` y `token_version`. El módulo Usuarios (Módulo 2) y el módulo Pacientes **consumen** `GenerarPasswordTemporalUseCase` sin duplicar lógica.
>
> **Ubicación de los endpoints de generación**: los controladores de generación (`/admin/usuarios/{id}/password-temporal` y `/pacientes/{id}/password-temporal`) viven en sus respectivos módulos como **adaptadores delgados** que solo invocan `GenerarPasswordTemporalUseCase`; NO contienen lógica de credenciales ni se mezclan con el dominio clínico de `PacienteRestController`.

### 3.2 Casos de uso (devuelven dominio, no DTO)

| Caso de uso | Entrada | Salida (dominio) | Efecto |
| :--- | :--- | :--- | :--- |
| `CambiarPasswordUseCase` | `usuarioId`, `passwordActual`, `nuevaPassword` | `void` | valida, actualiza hash, limpia flag y anula TTL, audita |
| `GenerarPasswordTemporalUseCase` | `usuarioId`, `actorId`, `motivo` (`ALTA` / `RESET`) | `PasswordTemporal` (valor en claro, se retorna una sola vez) | fija temporal + flag, bump token_version + revoca refresh si `RESET`, audita |
| `RevocarSesionesUsuarioUseCase` | `usuarioId`, `motivo`, `actorId`, `ip` | `void` | `token_version++` + revoca refresh tokens + auditoría (`REVOCACION_ADMIN`). Consumido por el Módulo 2 (cambio de rol/estado). |
| `VerificarPasswordActualUseCase` | `usuarioId`, `password` | `boolean` (o excepción) | compara con `PasswordEncoder`. Debe aplicar rate-limit/bloqueo (reutiliza `LoginAttemptPort`) para no abrir fuerza bruta. Consumido por el Módulo 2 (D12: reautenticación). |

### 3.3 Endpoints REST (context-path `/api/v1`)

| Método | Ruta | `@PreAuthorize` / auth | Respuesta |
| :--- | :--- | :--- | :--- |
| POST | `/auth/login` | pública | `TokenResponse` **+ `debeCambiarPassword`** |
| GET | `/auth/me` | autenticado | `UserResponseDTO` **+ `debeCambiarPassword`** |
| POST | `/auth/cambiar-password` | autenticado | `204 No Content` |
| POST | `/admin/usuarios/{id}/password-temporal` | `hasAuthority('ADMIN_USUARIOS')` | `PasswordTemporalResponse` (una sola vez) |
| POST | `/pacientes/{id}/password-temporal` | `hasAnyAuthority('PACIENTES_CREAR','PACIENTES_EDITAR')` | `PasswordTemporalResponse` (una sola vez) |

> Reglas de negocio:
> - El admin **no puede** generarse una temporal a sí mismo (endpoint de admin).
> - El endpoint de pacientes exige que el paciente esté vinculado al alcance del terapeuta (igual que el resto de operaciones de `paciente`).
> - `PasswordTemporalResponse` solo se devuelve en la respuesta de creación; nunca se persiste en claro.

### 3.4 DTOs de respuesta / petición

```java
// Extiende el contrato EXISTENTE (TokenResponse.token / TokenResponse.user),
// sin renombrar campos para no romper el frontend actual.
public record TokenResponse(
    String token,
    UserResponseDTO user,
    boolean debeCambiarPassword
) {}

public record UserResponseDTO(
    // ...campos existentes (id, name, roles, permissions, email, license, terapeutaIds, pacienteId)
    boolean debeCambiarPassword
) {}

public record CambiarPasswordRequest(
    @NotBlank String passwordActual,
    @NotBlank String nuevaPassword
) {}

public record PasswordTemporalResponse(String passwordTemporal) {}
```

> `debeCambiarPassword` se incluye también en `POST /auth/refresh` (mismo `TokenResponse`).

### 3.5 Flujo de login y enforcement

1. `POST /auth/login` autentica normalmente (`AuthApplicationService.autenticar`); dentro de `autenticar`, tras validar la contraseña, se valida la **caducidad** de la temporal (`password_temporal_vence_en IS NULL OR now() < password_temporal_vence_en`); si expiró → `401` genérico (`CredencialesInvalidasException`).
2. El servicio incluye `debe_cambiar_password` en la respuesta **sin** bloquear la emisión del token (necesario: `/auth/cambiar-password` es autenticado).
3. `CredencialPendienteFilter` (`OncePerRequestFilter`) se registra **después** de `JwtAuthFilter` y **solo actúa si existe `Authentication`**:
   - **Fuente del flag**: lee `debeCambiarPassword` desde **BD** (ampliando `EstadoSesion`/`findEstadoSesion`), **no** desde un claim JWT (un claim quedaría obsoleto porque D6 no revoca la sesión).
   - Si `debe_cambiar_password = true` y la ruta **no** está en la lista blanca (`/auth/cambiar-password`, `/auth/me`, `/auth/logout`, `/auth/refresh`), responde `403` con `ProblemDetail` (RFC 7807: `title`/`detail` + `setProperty("code", "DEBE_CAMBIAR_PASSWORD")`), escrito por el propio filtro (misma convención que `AuthExceptionHandler`).
   - Ignora `OPTIONS` (preflight CORS) y rutas públicas sin autenticación; compara la URI **sin** el context-path `/api/v1`.
4. El frontend, al recibir `debeCambiarPassword = true`, enruta al onboarding; el filtro garantiza que no pueda usar el resto de la app.

> **Semántica de "un solo uso"**: la temporal sigue siendo válida para re-autenticarse y completar el onboarding hasta que este se complete o venza el TTL (el usuario puede cerrar el navegador a mitad del onboarding). El "un solo uso" efectivo se garantiza porque el filtro impide cualquier uso distinto al cambio de contraseña.

### 3.6 Errores

- `401` credenciales inválidas (incluida temporal expirada → mismo mensaje genérico, sin revelar el motivo).
- `403 DEBE_CAMBIAR_PASSWORD` para cualquier ruta no permitida con flag activo.
- `400` si la nueva contraseña no cumple la política (longitud/complejidad).
- `409` si `passwordActual` no coincide al cambiar.

> **Política de contraseña**: se define un value object único `PasswordPolicy` (longitud mínima, complejidad y prohibición de reutilizar la contraseña actual), compartido por la generación de temporales y el cambio. La temporal generada con `SecureRandom` debe cumplir esa misma política. Se reutiliza el `BCryptPasswordEncoder` existente.

---

## 4. Base de datos (migración V27)

```sql
-- V27__credenciales_temporales_onboarding.sql

-- 1. Flag de cambio obligatorio + TTL de la contraseña temporal
ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS debe_cambiar_password BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS password_temporal_vence_en TIMESTAMP WITH TIME ZONE;

-- Coherencia: solo puede haber TTL si hay contraseña temporal (flag activo)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
                   WHERE c.conname = 'ck_usuarios_temporal_coherente' AND t.relname = 'usuarios') THEN
        ALTER TABLE usuarios ADD CONSTRAINT ck_usuarios_temporal_coherente
            CHECK (password_temporal_vence_en IS NULL OR debe_cambiar_password = TRUE);
    END IF;
END $$;

-- 2. Auditoría de gestión (append-only)
CREATE TABLE IF NOT EXISTS auditoria_gestion (
    id         VARCHAR(36) PRIMARY KEY,
    actor_id   VARCHAR(36),
    accion     VARCHAR(50) NOT NULL,          -- ALTA_USUARIO | EDICION_USUARIO | CAMBIO_ESTADO_USUARIO | ASIGNACION_TERAPEUTA
                                              -- RESET_PASSWORD | ALTA_PACIENTE | REVOCACION_ADMIN
                                              -- LOGIN_TEMPORAL | CAMBIO_PASSWORD | ONBOARDING_COMPLETADO
    entidad    VARCHAR(50) NOT NULL,          -- USUARIO | PACIENTE
    entidad_id VARCHAR(36),
    detalle    JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_auditoria_gestion_actor FOREIGN KEY (actor_id)
        REFERENCES usuarios(id) ON DELETE SET NULL,
    CONSTRAINT ck_auditoria_gestion_accion CHECK (accion IN (
        'ALTA_USUARIO','EDICION_USUARIO','CAMBIO_ESTADO_USUARIO','ASIGNACION_TERAPEUTA',
        'RESET_PASSWORD','ALTA_PACIENTE','REVOCACION_ADMIN',
        'LOGIN_TEMPORAL','CAMBIO_PASSWORD','ONBOARDING_COMPLETADO')),
    CONSTRAINT ck_auditoria_gestion_entidad CHECK (entidad IN ('USUARIO','PACIENTE'))
);

CREATE INDEX IF NOT EXISTS idx_auditoria_gestion_actor ON auditoria_gestion (actor_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_gestion_accion_fecha ON auditoria_gestion (accion, created_at);
CREATE INDEX IF NOT EXISTS idx_auditoria_gestion_entidad_id ON auditoria_gestion (entidad, entidad_id);
```

> - `debe_cambiar_password` empieza en `FALSE`; las cuentas existentes (semilla demo123) no se ven afectadas. ⚠️ Para entornos no-demo, considerar forzar el cambio (`debe_cambiar_password = TRUE`) en `usr-admin` y las cuentas semilla.
> - `password_temporal_vence_en` es `NULL` cuando la contraseña no es temporal; en el login se valida **`vence_en IS NULL OR now() < vence_en`** (la forma `now() < vence_en` a secas rechazaría las cuentas normales por `NULL`).
> - Al completar el onboarding se anula `password_temporal_vence_en` además de limpiar el flag.
> - **V26** debe crearse (permiso `ADMIN_DASHBOARD_LEER` + índices de actividad del Dashboard, ver SDD del Módulo 1) **antes o en el mismo commit** que V27, para evitar que Flyway detecte una migración resuelta sin aplicar.

---

## 5. Frontend (Angular 18 standalone)

### 5.1 Tipos / contrato

```ts
// Extiende el contrato EXISTENTE (AuthSession.token / AuthSession.user), sin redefinirlo.
interface AuthSession {
  token: string;
  user: User;
  debeCambiarPassword: boolean;   // NUEVO: persistido en sesión/localStorage
}

interface User {
  // ...campos existentes (id, name, roles, permissions, email, ...)
  debeCambiarPassword: boolean;   // NUEVO
}

export interface CambiarPasswordRequest {
  passwordActual: string;
  nuevaPassword: string;          // la confirmación se valida en cliente; no viaja en el DTO
}
```

> `TokenResponseBackend` del adapter (`login-http.adapter.ts`) y `AuthSession` (`login.repository.ts`) se extienden con `debeCambiarPassword`; `persistSession()` debe guardarlo.

### 5.2 Componentes

```
modules/login/
└─ onboarding-cambio-password/     // componente ÚNICO (un solo SPA); junto al login existente
   ├─ onboarding-cambio-password.component.ts|html|scss
   │    formulario: contraseña actual + nueva + confirmar (validación en cliente)
   │    llama POST /auth/cambiar-password; al recibir 204 limpia el flag local
   │    (RoleStateService.setUser({...user, debeCambiarPassword:false}) o re-fetch de /auth/me)
   │    y luego navega a '/' (homeRedirectGuard resuelve el landing)
```

- **Login** (`login.component.ts`): al recibir `debeCambiarPassword = true`, persiste el flag y navega a `/cambiar-password` en lugar de `/`.
- **Un solo SPA**: no existe login separado para pacientes; el portal (`/mi-historial`) usa el mismo login. La ruta de onboarding es única y **fuera de `MainLayout`** (pantalla completa, como `/login`).
- **Escape**: incluye botón "Cerrar sesión" (llama a `cerrarSesion()` y navega a `/login`) para no dejar al usuario atrapado si no puede completar el cambio.
- **Anti-bucle**: es **obligatorio** limpiar el flag local antes de navegar; de lo contrario `cambioPasswordGuard` re-redirige a `/cambiar-password` y el usuario queda atrapado en el formulario.

### 5.3 Rutas y guard

```ts
// app.routes.ts — ruta fuera de MainLayout (pantalla completa, lazy como el resto)
{ path: 'cambiar-password',
  canActivate: [authGuard, cambioPasswordGuard],
  loadComponent: () => import('./modules/login/onboarding-cambio-password/onboarding-cambio-password.component').then(m => m.OnboardingCambioPasswordComponent) }
```

- **`cambioPasswordGuard`** (funcional, como los existentes):
  - En rutas protegidas (`''` padre y rama `admin`): si el flag está activo → `createUrlTree(['/cambiar-password'])`.
  - En `/cambiar-password`: si el flag ya no está activo → redirige al landing (`/`).
- El flag se expone vía `RoleStateService` (p. ej. `debeCambiarPassword$`) para que los guards lo lean sin re-parsear `localStorage`.
- El backend (filtro 403) sigue siendo la fuente de verdad; el guard evita la navegación rota en la SPA.
- **Comodín `**`**: la ruta existente `{ path: '**', canActivate: [homeRedirectGuard] }` no lleva `authGuard`; documentar que `cambioPasswordGuard` (o `authGuard`) también se evalúe ahí para cerrar el hueco de navegación con flag activo.

### 5.4 UX y accesibilidad

- **Validación en cliente**: coincidencia `nueva ≠ confirmar`, política visible (longitud/complejidad), `autocomplete="current-password"` / `"new-password"`.
- **Estados**: carga (`aria-busy`), error mapeado (`409` contraseña actual incorrecta, `400` política, `403` → redirigir), éxito.
- **A11y**: `aria-invalid`/`aria-describedby` en campos con error, `aria-live` para mensajes, toggle mostrar/ocultar contraseña, foco inicial en el primer campo.
- **Tokens visuales**: cabeceras `colors.clinical.dark` (#304768), acción primaria `colors.clinical.accent` (#75AFBC), error `clinical.risk`, éxito `clinical.teal`.

---

## 6. Criterios de aceptación

1. El admin genera una temporal para un staff: la respuesta la muestra **una sola vez**; en BD solo queda el hash.
2. El terapeuta genera una temporal para un paciente nuevo: mismo mecanismo, con auditoría del terapeuta.
3. Login con la temporal devuelve `debeCambiarPassword = true` y redirige al onboarding.
4. Mientras el flag está activo, cualquier endpoint distinto de `/auth/cambiar-password`, `/auth/me`, `/auth/logout` y `/auth/refresh` responde `403 DEBE_CAMBIAR_PASSWORD`.
5. Completar el onboarding limpia el flag y permite el acceso normal.
6. Una temporal expirada se rechaza en el login (401 genérico) y obliga a generar otra.
7. No se puede llegar al onboarding sin credencial previa válida (regla ADR-005).
8. El admin no puede generarse una temporal a sí mismo.
9. `auditoria_gestion` registra generación y cambio (quién, a quién, cuándo).
10. Generar temporal sobre un usuario existente (reset) revoca sus sesiones (`token_version` + refresh tokens).
11. En la SPA, el usuario con flag activo es redirigido a `/cambiar-password` aunque intente navegar a `/dashboard` o `/admin` (guard de confinamiento).

---

## 7. Pruebas

- **Backend (unit)**: `CredencialApplicationService` (generar/cambiar) con puertos mockeados; `CredencialPendienteFilter` (bloquea/permite según flag y ruta); política de contraseña.
- **Backend (integration)**: `403 DEBE_CAMBIAR_PASSWORD` para ruta no permitida con flag; login con temporal expirada → 401; reset revoca refresh token.
- **Frontend (component)**: formulario de onboarding (validaciones y a11y), redirección de login según flag, `cambioPasswordGuard` (redirige a `/cambiar-password` o al landing).
- **E2E (Playwright)**: alta de staff → login con temporal → onboarding → acceso normal; paciente creado por terapeuta → mismo flujo.

---

## 8. Orden de implementación

1. Migración V27 (flag + TTL + `auditoria_gestion`).
2. Backend: dominio + puertos + `CredencialApplicationService` + persistencia.
3. Backend: `CredencialPendienteFilter` (enforcement 403).
4. Backend: endpoints `/auth/cambiar-password` y generación de temporal (admin + paciente).
5. Frontend: tipos + componente `onboarding-cambio-password` + redirección de login.
6. Pruebas unitarias, de integración y E2E.

---

## 9. Relación con otros artefactos

- **ADR-005**: decisión y justificación (qué y por qué).
- **SDD Módulo 2 Usuarios** (pendiente): referencia este SDD para su funcionalidad de "Restablecer contraseña".
- **Módulo Pacientes**: referencia este SDD para el alta de paciente con contraseña temporal.
- **SDD Módulo 1 Dashboard**: no se modifica.
