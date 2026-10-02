# SDD-004: Software Design Document — Módulo Log In (SDOP)

- **Módulo**: `login`
- **Código SDD**: `SDD-004`
- **Versión**: 1.5.0
- **Fecha**: 2026-10-02
- **Estado**: APROBADO (Gate #1) — Fases 3 y 3.5 implementadas y verificadas
- **Alineación Normativa**: ADR-001 (Hexagonal), ADR-002 (Dual Adapters), ADR-003 (Flyway), ADR-004 (DTO/Mapper), ADR-005 (Playwright), `gap-report-login.md`
- **Rol**: Lead Architect

---

## 1. Plan de Reutilización (Adaptar vs Crear)

Conforme al principio rector de SDOP, se extiende el backend existente y se separa la **identidad/autenticación** (multi-rol) del **perfil profesional**.

| Componente | Estado actual | Estrategia |
| :--- | :--- | :--- |
| Tabla `usuarios` | **NO EXISTE** | **CREAR** (V4): identidad, credenciales (sin rol en la tabla). |
| Tabla `roles` | **NO EXISTE** | **CREAR** (V4): catálogo de los 7 roles del sistema. |
| Tabla `usuario_roles` | **NO EXISTE** | **CREAR** (V4): relación M2M usuario ↔ rol (multi-rol). |
| Tabla `terapeutas` (V1) | Tiene `email`, `nombre`, `apellidos`; sin credenciales | **ADAPTAR**: mover identidad a `usuarios`; ganar `usuario_id` FK. |
| `TerapeutaJpaEntity` | JPA con `email`, `nombre`, `apellidos` | **ADAPTAR**: quitar campos de identidad; añadir `usuarioId`. |
| `PacientePersistenceMapper` (módulo paciente) | Usa `terapeuta.getNombre()/getApellidos()` | **ADAPTAR (cross-módulo)**: resolver el nombre del terapeuta por join a `usuarios` (si no, el módulo `paciente` no compila). |
| `SpringDataTerapeutaRepository.findByEmail` | Existe | **REEMPLAZAR** por `SpringDataUsuarioRepository.findByEmail` (auth consulta `usuarios`). |
| `UsuarioJpaEntity` + `SpringDataUsuarioRepository` | **NO EXISTE** | **CREAR** (persistencia del módulo `auth`). |
| `auditoria_accesos.usuario_id` | `VARCHAR(36)` sin FK | **ADAPTAR**: FK → `usuarios(id)`. |
| Patrón hexagonal `paciente` | Existe | **REPLICAR** para el módulo `auth`. |
| `WebCorsConfig`, `OpenApiConfig` | Existente | **REUTILIZAR** (CORS ya permite `localhost:4200`). |
| Frontend `User` (`core/types/clinical.types.ts`) | `role: Role` (único) | **CONTRATO A CAMBIAR**: `User.roles: Role[]` (multi-rol). |
| Frontend `LoginRepository` / `AuthSession` | Puerto y tipos definidos | **CONTRATO**: solo se ajusta `user.roles`. |

---

## 2. Migración Flyway: `V4__introduce_authentication_identity.sql`

- **Consecutivo**: `V4` (sucede a `V1`, `V2`, `V3`).
- **Ubicación**: `Brevemente_App/backend/src/main/resources/db/migration/V4__introduce_authentication_identity.sql`.
- **Propiedades**: idempotente (`IF NOT EXISTS` / `ON CONFLICT DO NOTHING` / `DO $$`), **sin romper** las FKs existentes (`pacientes.terapeuta_id`, `expedientes_clinicos.terapeuta_asignado_id`, `citas.terapeuta_id`, `notas_evolucion.creado_por_id`).

```sql
-- =============================================================================
-- Migración V4: Identidad y Autenticación Multi-rol (SDD-004 — revisión DBA)
-- Separa IDENTIDAD (usuarios) del PERFIL PROFESIONAL (terapeutas).
-- Roles modelados como catálogo + relación M2M (usuario_roles) para multi-rol.
-- Sucede a V1, V2, V3. Idempotente. NO rompe FKs existentes.
-- =============================================================================

-- 1. Catálogo de roles ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
    id          VARCHAR(36)  PRIMARY KEY,
    codigo      VARCHAR(30)  NOT NULL,
    nombre      VARCHAR(100) NOT NULL,
    descripcion VARCHAR(255),
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ux_roles_codigo UNIQUE (codigo)
);

INSERT INTO roles (id, codigo, nombre, descripcion) VALUES
    ('rol-001', 'admin_platform', 'Administrador Plataforma', 'Gestión global de la plataforma'),
    ('rol-002', 'admin_clinical',  'Administrador Clínico',   'Gestión operativa clínica'),
    ('rol-003', 'therapist',       'Terapeuta',               'Profesional clínico tratante'),
    ('rol-004', 'assistant',       'Asistente',               'Apoyo administrativo / secretarial'),
    ('rol-005', 'supervisor',      'Supervisor Clínico',      'Supervisión clínica de casos'),
    ('rol-006', 'patient',         'Paciente',                'Portal del paciente'),
    ('rol-007', 'student',         'Alumno',                  'Formación académica')
ON CONFLICT (codigo) DO NOTHING;

-- 2. Identidad / autenticación -------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
    id            VARCHAR(36)  PRIMARY KEY,
    email         VARCHAR(150) NOT NULL,
    password_hash VARCHAR(100) NOT NULL,           -- BCrypt
    nombre        VARCHAR(100) NOT NULL,
    apellidos     VARCHAR(100) NOT NULL,
    activo        BOOLEAN      NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Unicidad case-insensitive del email (índice funcional único, sirve para login)
CREATE UNIQUE INDEX IF NOT EXISTS ux_usuarios_email_lower ON usuarios (LOWER(email));

-- 3. Relación M2M usuario <-> rol (multi-rol) ---------------------------------
CREATE TABLE IF NOT EXISTS usuario_roles (
    usuario_id VARCHAR(36) NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    rol_id     VARCHAR(36) NOT NULL REFERENCES roles(id)    ON DELETE CASCADE,
    PRIMARY KEY (usuario_id, rol_id)
);
CREATE INDEX IF NOT EXISTS idx_usuario_roles_rol ON usuario_roles (rol_id);

-- 4. Semilla de identidad (coherente con V2; se preservan honoríficos 'Dra.'/'Mtro.') --
--    <BCRYPT_HASH_DEMO123> = hash BCrypt de 'demo123' (se inlina literal en Fase 3).
INSERT INTO usuarios (id, email, password_hash, nombre, apellidos, activo) VALUES
    ('usr-001', 'sofia.ramirez@brevemente.org',    '<BCRYPT_HASH_DEMO123>', 'Dra. Sofía',      'Ramírez Lozano', TRUE),
    ('usr-002', 'patricia.ortiz@brevemente.org',   '<BCRYPT_HASH_DEMO123>', 'Patricia',        'Ortiz',          TRUE),
    ('usr-003', 'isabel.cardenas@brevemente.org',  '<BCRYPT_HASH_DEMO123>', 'Isabel',          'Cárdenas',       TRUE),
    ('usr-004', 'alejandro.mendoza@brevemente.org','<BCRYPT_HASH_DEMO123>', 'Mtro. Alejandro', 'Mendoza Garza',  TRUE)
ON CONFLICT (id) DO NOTHING;

-- 5. Asignación de roles (M2M) -------------------------------------------------
INSERT INTO usuario_roles (usuario_id, rol_id) VALUES
    ('usr-001', 'rol-003'),  -- therapist
    ('usr-002', 'rol-002'),  -- admin_clinical
    ('usr-003', 'rol-005'),  -- supervisor
    ('usr-004', 'rol-003'),  -- therapist (perfil tratante)
    ('usr-004', 'rol-005')   -- supervisor clínico (especialidad "Supervisión Clínica y TBE")
ON CONFLICT (usuario_id, rol_id) DO NOTHING;

-- 6. Vincular perfil profesional -> identidad ---------------------------------
ALTER TABLE terapeutas ADD COLUMN IF NOT EXISTS usuario_id VARCHAR(36);

-- 6a. Relink explícito de la semilla V2 (identidades coherentes con V2)
UPDATE terapeutas SET usuario_id = 'usr-001' WHERE id = 'ter-001' AND usuario_id IS NULL;
UPDATE terapeutas SET usuario_id = 'usr-004' WHERE id = 'ter-002' AND usuario_id IS NULL;

-- 6b. Backfill genérico: cualquier terapeuta sin identidad previa crea su usuario
--     (clave demo123; en onboarding se forzará el cambio de contraseña).
INSERT INTO usuarios (id, email, password_hash, nombre, apellidos, activo)
SELECT
    'usr-' || substr(md5(t.id), 1, 32),   -- 4 + 32 = 36 chars (id VARCHAR(36))
    t.email,
    '<BCRYPT_HASH_DEMO123>',
    t.nombre,
    t.apellidos,
    COALESCE(t.activo, TRUE)
FROM terapeutas t
WHERE t.usuario_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM usuarios u WHERE LOWER(u.email) = LOWER(t.email))
ON CONFLICT DO NOTHING;   -- sin target: absorbe tanto colisión de PK (id) como de ux_usuarios_email_lower

UPDATE terapeutas t
SET usuario_id = (SELECT u.id FROM usuarios u WHERE LOWER(u.email) = LOWER(t.email))
WHERE t.usuario_id IS NULL;

-- 6b-bis. Backfill de roles: todo usuario nacido de un terapeuta recibe rol-003
--         (evita que los backfilleados queden sin authorities en el JWT).
INSERT INTO usuario_roles (usuario_id, rol_id)
SELECT u.id, 'rol-003'
FROM usuarios u
JOIN terapeutas t ON t.usuario_id = u.id
ON CONFLICT (usuario_id, rol_id) DO NOTHING;

-- 6c. Assert: no deben quedar terapeutas huérfanos antes de endurecer NOT NULL
DO $$
DECLARE
    hue BIGINT;
BEGIN
    SELECT COUNT(*) INTO hue FROM terapeutas WHERE usuario_id IS NULL;
    IF hue > 0 THEN
        RAISE EXCEPTION 'V4: existen % terapeutas sin usuario_id', hue;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'terapeutas' AND column_name = 'usuario_id' AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE terapeutas ALTER COLUMN usuario_id SET NOT NULL;
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS ux_terapeutas_usuario_id ON terapeutas (usuario_id);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_terapeutas_usuario') THEN
        ALTER TABLE terapeutas
            ADD CONSTRAINT fk_terapeutas_usuario
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT;
    END IF;
END $$;

-- 7. El perfil deja de almacenar identidad ------------------------------------
ALTER TABLE terapeutas
    DROP COLUMN IF EXISTS email,
    DROP COLUMN IF EXISTS nombre,
    DROP COLUMN IF EXISTS apellidos;

CREATE UNIQUE INDEX IF NOT EXISTS ux_terapeutas_cedula
    ON terapeutas (cedula_profesional) WHERE cedula_profesional IS NOT NULL;

-- 8. Auditoría apunta a la identidad (con índice de soporte) -------------------
--    Precondición: en la cadena fresca V1→V2→V3→V4, auditoria_accesos está vacía
--    (V1 no tiene escritor en el backend actual). Se valida defensivamente:
DO $$
DECLARE
    hue BIGINT;
BEGIN
    SELECT COUNT(*) INTO hue
    FROM auditoria_accesos a
    WHERE NOT EXISTS (SELECT 1 FROM usuarios u WHERE u.id = a.usuario_id);
    IF hue > 0 THEN
        RAISE EXCEPTION 'V4: existen % filas de auditoria_accesos con usuario_id huérfano', hue;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_auditoria_usuario') THEN
        ALTER TABLE auditoria_accesos
            ADD CONSTRAINT fk_auditoria_usuario
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_auditoria_usuario ON auditoria_accesos (usuario_id);
```

> **Nota de semilla**: `<BCRYPT_HASH_DEMO123>` es un token de diseño (Flyway **no** interpreta `<...>`). En **Fase 3** debe sustituirse por el hash BCrypt **literal** de `demo123` generado con `BCryptPasswordEncoder` (formato `$2b$10$...`), en los 4 usuarios de la semilla. **No** usar `${...}` porque Flyway lo trata como placeholder y la migración fallaría.
>
> **Checklist Gate #1 → Fase 3**: sustituir el hash BCrypt **antes** de `mvn flyway:migrate`; si V4 se aplica con el token literal, `password_hash` guardaría `<BCRYPT_HASH_DEMO123>` y ningún login funcionaría (`BCryptPasswordEncoder.matches` falla).

---

## 3. Backend Spring Boot (Arquitectura Hexagonal)

### 3.1 Estructura de Paquetes (módulo `auth`)

```text
com.syborx.brevemente
└── auth
    ├── domain
    │   ├── model
    │   │   └── Usuario.java                     # Modelo de dominio puro (sin JPA)
    │   └── exception
    │       └── CredencialesInvalidasException.java
    ├── application
    │   ├── ports
    │   │   ├── in
    │   │   │   └── AutenticarUseCase.java
    │   │   └── out
    │   │       ├── AutenticacionRepositoryPort.java
    │   │       └── LicenseLookupPort.java
    │   └── service
    │       └── AuthApplicationService.java
    └── infrastructure
        ├── adapters
        │   ├── in
        │   │   └── rest
        │   │       ├── AuthController.java
        │   │       ├── dto
        │   │       │   ├── LoginRequest.java
        │   │       │   ├── TokenResponse.java
        │   │       │   └── UserResponseDTO.java
        │   │       ├── mapper
        │   │       │   └── AuthRestMapper.java
        │   │       └── advice
        │   │           └── AuthExceptionHandler.java
        │   └── out
        │       └── persistence
        │           ├── entity
        │           │   ├── UsuarioJpaEntity.java      # identidad + M2M a roles
        │           │   └── RolJpaEntity.java
        │           ├── repository
        │           │   ├── SpringDataUsuarioRepository.java
        │           │   └── LicenseJpaProjection.java   # read-only: usuarios LEFT JOIN terapeutas
        │           ├── AuthPersistenceAdapter.java      # consulta usuarios (no terapeutas)
        │           ├── LicenseLookupAdapter.java        # resuelve cedula_profesional (license)
        │           └── mapper
        │               └── AuthPersistenceMapper.java
        └── security
            ├── SecurityConfig.java
            ├── JwtService.java
            └── JwtAuthFilter.java
```

### 3.2 Modelo de Dominio

```java
// auth/domain/model/Usuario.java  (POJO puro, sin anotaciones JPA)
public class Usuario {
    private final String id;
    private final String nombre;        // compuesto: nombre + apellidos
    private final String email;
    private final String passwordHash;  // BCrypt
    private final Set<String> roles;    // códigos de rol (multi-rol): therapist, supervisor, ...
    private final String license;       // cedula_profesional (nullable: solo therapist)
    private final boolean activo;
    // getters / constructor (o @Value de Lombok)

    public boolean tieneRol(String codigo) {
        return roles != null && roles.contains(codigo);
    }
}
```

> **Multi-rol**: un usuario puede portar **varios** roles (p. ej. `therapist` + `supervisor`). El JWT y los `GrantedAuthority` de Spring Security se derivan de `roles`.

### 3.3 Puertos

```java
// application/ports/in/AutenticarUseCase.java
public interface AutenticarUseCase {
    Usuario autenticar(String email, String password);
}

// application/ports/out/AutenticacionRepositoryPort.java
public interface AutenticacionRepositoryPort {
    Optional<Usuario> findByEmail(String email);
}

// application/ports/out/LicenseLookupPort.java
public interface LicenseLookupPort {
    String findLicenseByUsuarioId(String usuarioId); // cedula_profesional (nullable)
}
```

### 3.4 Servicio de Aplicación

```java
@Service
@RequiredArgsConstructor
public class AuthApplicationService implements AutenticarUseCase {
    private final AutenticacionRepositoryPort autenticacionRepositoryPort;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional(readOnly = true)
    public Usuario autenticar(String email, String password) {
        Usuario usuario = autenticacionRepositoryPort.findByEmail(email)
                .orElseThrow(() -> new CredencialesInvalidasException());
        if (!usuario.isActivo() || !passwordEncoder.matches(password, usuario.getPasswordHash())) {
            throw new CredencialesInvalidasException();
        }
        return usuario;
    }
}
```

> **Composición de `license`**: `AuthApplicationService` no cambia; el `AuthPersistenceAdapter.findByEmail` invoca `LicenseLookupPort` (implementado por `LicenseLookupAdapter`, proyección read-only `usuarios LEFT JOIN terapeutas`) y compone el `Usuario` completo (identidad + roles + `license`) antes de retornar. Así el servicio de aplicación permanece agnóstico del perfil profesional (`terapeutas`).

### 3.5 DTOs (Java Records + Bean Validation + Swagger)

```java
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank @Email
        @Schema(description = "Correo institucional", example = "sofia.ramirez@brevemente.org")
        String email,
        @NotBlank
        @Schema(description = "Contraseña", example = "demo123")
        String password
) {}

public record UserResponseDTO(
        @Schema(description = "Identificador del usuario", example = "usr-001")
        String id,
        @Schema(description = "Nombre compuesto (nombre + apellidos)", example = "Dra. Sofía Ramírez Lozano")
        String name,
        @Schema(description = "Roles (multi-rol)", example = "[\"therapist\", \"supervisor\"]")
        List<String> roles,
        @Schema(description = "Correo institucional", example = "sofia.ramirez@brevemente.org")
        String email,
        @Schema(description = "Cédula profesional (solo therapist)", example = "CED-782190-PSIC")
        String license
) {}

public record TokenResponse(
        @Schema(description = "Token JWT (Bearer)")
        String token,
        @Schema(description = "Datos del usuario autenticado")
        UserResponseDTO user
) {}
```

### 3.6 Controlador REST

```java
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Auth", description = "Autenticación de personal clínico")
public class AuthController {

    private final AutenticarUseCase autenticarUseCase;
    private final JwtService jwtService;
    private final AuthRestMapper authRestMapper;

    @PostMapping("/login")
    @Operation(summary = "Autentica al usuario y emite un token JWT")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Login exitoso"),
        @ApiResponse(responseCode = "401", description = "Credenciales inválidas")
    })
    public ResponseEntity<TokenResponse> login(@Valid @RequestBody LoginRequest request) {
        Usuario usuario = autenticarUseCase.autenticar(request.email(), request.password());
        String token = jwtService.generarToken(usuario);
        return ResponseEntity.ok(new TokenResponse(token, authRestMapper.toUserResponse(usuario)));
    }

    @PostMapping("/logout")
    @Operation(summary = "Cierra sesión (JWT stateless; el cliente descarta el token)")
    public ResponseEntity<Void> logout() {
        return ResponseEntity.noContent().build();
    }
}
```

> Endpoint completo (context-path `/api/v1`): `POST /api/v1/auth/login` y `POST /api/v1/auth/logout`.
>
> **Logout en JWT stateless**: el mecanismo canónico es descartar el token en el cliente (`localStorage.removeItem('brevemente_session')`). El endpoint `logout` es opcional y, de invocarse, requiere token (lo adjunta el `AuthInterceptor`, §3.10).

### 3.7 Seguridad (Spring Security + JWT)

- **Dependencias a añadir en `pom.xml`**:
  - `spring-boot-starter-security`
  - `io.jsonwebtoken:jjwt-api`, `jjwt-impl`, `jjwt-jackson` (0.12.x)
- **`SecurityConfig`** (`SecurityFilterChain`):
  - `@EnableMethodSecurity` (obligatorio para que `@PreAuthorize` se evalúe).
  - `csrf(csrf -> csrf.disable())`: JWT stateless (el token viaja en header `Authorization`, no en sesión/cookie), por lo que no hay vector CSRF; sin esto `POST /auth/login` puede ser rechazado.
  - Permitir sin auth: `POST /auth/login`, `/swagger-ui/**`, `/v3/api-docs/**` y, **transitoriamente**, `/pacientes/**` (ver §3.10).
  - **Nota de context-path**: Spring Security evalúa los matchers contra la ruta **relativa al context-path** (`server.servlet.context-path: /api/v1`); por eso se usan `/auth/login` y `/pacientes/**` (NO `/api/v1/auth/login`). La URL pública completa sigue siendo `https://host/api/v1/auth/login`.
  - Todo lo demás: autenticado (`anyRequest().authenticated()`).
  - `cors(Customizer.withDefaults())` + bean `CorsConfigurationSource`: se define un bean explícito que **replica** `WebCorsConfig` (orígenes `http://localhost:4200`, `http://localhost:3000`, `http://127.0.0.1:4200`; métodos `GET/POST/PUT/PATCH/DELETE/OPTIONS`; headers `*`; `allowCredentials=true`). En Spring Security 6, con Spring MVC presente el `CorsConfigurer` delega en el `HandlerMappingIntrospector` (que sí lee el `CorsRegistry` de `WebCorsConfig`), pero un bean `CorsConfigurationSource` **explícito** lo hace determinista y evita que los `OPTIONS` preflight sean rechazados por `anyRequest().authenticated()` (401/403). **Cuidado**: debe incluir `PATCH` (usado por `PacienteRestController.@PatchMapping`) para no regresionar el módulo `paciente`.
  - `sessionManagement(STATELESS)` + `JwtAuthFilter` antes del `UsernamePasswordAuthenticationFilter`.
  - `PasswordEncoder` = `BCryptPasswordEncoder`.
  - `AuthenticationEntryPoint` y `AccessDeniedHandler` que devuelvan 401/403 en formato RFC 7807.
- **`JwtService`**:
  - `generarToken(Usuario)` y `validarToken(String)` (HS256 con secreto en variables de entorno, nunca en código).
  - El token incluye **`sub`**, **`iat`** y **`exp`** (TTL corto, p. ej. 60 min). `validarToken` debe rechazar tokens expirados y validar la firma (`Keys.hmacShaKeyFor` con secreto ≥ 256 bits).
  - Embebe la **lista de roles**; regla de mapeo: `authority = "ROLE_" + UPPER(codigo)` (p. ej. `therapist → ROLE_THERAPIST`, `admin_platform → ROLE_ADMIN_PLATFORM`).
- **`JwtAuthFilter`** (`OncePerRequestFilter`): lee `Authorization: Bearer <token>`; si es inválido/expirado **no lanza** (deja el `SecurityContext` vacío y continúa la cadena); el 401 lo emite el `AuthenticationEntryPoint`.
- **`@PreAuthorize`**: los endpoints se protegen por rol, p. ej. `@PreAuthorize("hasRole('THERAPIST')")`; un usuario multi-rol satisface cualquier rol que porte.
- **Manejo de errores** (`AuthExceptionHandler` + `@RestControllerAdvice`):
  - `CredencialesInvalidasException` → HTTP 401 RFC 7807.
  - `MethodArgumentNotValidException` → HTTP 400 RFC 7807.
  - **Corrección de premisa**: `PacienteExceptionHandler` hoy devuelve `Map.of(timestamp/status/error/message)` (NO `ProblemDetail`). El módulo `auth` **sí** usará `ProblemDetail`; la migración de `PacienteExceptionHandler` a `ProblemDetail` se registra como tarea separada en Fase 3.5 (no bloquea el login).
  - **Ambigüedad de advices**: ambos handlers serán `@RestControllerAdvice` globales; para evitar colisión, `AuthExceptionHandler` se acota con `@RestControllerAdvice(basePackages = "com.syborx.brevemente.auth")` (o `assignableTypes = AuthController.class`).

### 3.8 Mapper de Persistencia

- `UsuarioJpaEntity`: mapea `usuarios` con `@ManyToMany` hacia `roles`; **obligatorio** especificar el join (sin `@JoinTable` explícito, `ddl-auto=validate` falla por el naming por defecto de JPA):
  ```java
  @ManyToMany
  @JoinTable(
      name = "usuario_roles",
      joinColumns = @JoinColumn(name = "usuario_id"),
      inverseJoinColumns = @JoinColumn(name = "rol_id")
  )
  private Set<RolJpaEntity> roles;
  ```
- `SpringDataUsuarioRepository`: usar query que aproveche el índice funcional (`findByEmailIgnoreCase` genera `upper(email)` y **no** usaría `LOWER(email)`):
  ```java
  @Query("select u from UsuarioJpaEntity u where lower(u.email) = lower(:email)")
  Optional<UsuarioJpaEntity> findByEmail(String email);
  ```
- `AuthPersistenceMapper`: `UsuarioJpaEntity` ↔ `Usuario`; compone `nombre + ' ' + apellidos` y extrae el `Set<String>` de códigos de rol.
- `AuthPersistenceAdapter`: implementa `AutenticacionRepositoryPort` consultando `usuarios` (ya **no** `terapeutas`).
- `license` (cédula) se resuelve con join opcional `terapeutas.usuario_id` → solo existe para `therapist`; `null` para el resto de roles. **Frontera hexagonal**: `cedula_profesional` vive en `terapeutas` (módulo `paciente`); para no acoplar módulos, `auth` define un puerto out dedicado (`LicenseLookupPort`) con adaptador read-only que ejecuta `usuarios LEFT JOIN terapeutas` (proyección/nativo), **sin** depender de `TerapeutaJpaEntity` del módulo `paciente`.

### 3.9 Impacto cross-módulo (módulo `paciente`)

Al quitar `email`/`nombre`/`apellidos` de `TerapeutaJpaEntity`, el `PacientePersistenceMapper.toDomain` (que hoy invoca `terapeuta.getNombre()` y `getApellidos()`) **deja de compilar**. En Fase 3 se debe:

1. Mantener la relación `PacienteJpaEntity → TerapeutaJpaEntity`.
2. Resolver el nombre del terapeuta con join a `usuarios` (`terapeuta.usuario_id → usuarios`) y componer `nombre + ' ' + apellidos`.
3. Mantener el contrato `PacienteResponseDTO.therapistName` **sin cambios** para el frontend.
4. **Eliminar literales/fallbacks obsoletos de demo**:
   - **Fallbacks de runtime** (sustituir por el nombre real resuelto vía `usuarios`, o `null`): `"Dr. Alejandro Silva"` en `PacienteRestMapper.java:62` y `PacientePersistenceMapper.java:42`; `"ter-001"` en `PacientePersistenceMapper.java:39`, `PacienteRestMapper.java:61`, `PacienteRestMapper.java:121` y `PacientePersistenceAdapter.java:55` (`findById("ter-001").orElse(null)`).
   - **Ejemplos `@Schema` estáticos** (actualizar el texto del ejemplo, no "resolver"): `PacienteCreateRequest.java:41` pasa de `example = "Dr. Alejandro Silva"` a `example = "Dra. Sofía Ramírez Lozano"`.
   - **Alcance acotado**: los `@Schema(example = "ter-001")` de `PacienteCreateRequest.java:38`, `PacienteResponseDTO.java:40` y `CapacidadConsentimientoDTO.java:10` **no** se tocan: apuntan a un `terapeutas.id` real (`ter-001` sigue existiendo en V4), no son fallbacks de código.

### 3.10 Transición de seguridad (módulo `paciente` existente)

Al activar Spring Security con `anyRequest().authenticated()`, los endpoints actuales de `paciente`
(`GET/POST /api/v1/pacientes`) — que hoy Angular consume **sin** token — responderían 401 y romperían el módulo ya entregado. Plan de transición en Fase 3 (atómico, mismo PR del login):

1. **Whitelist transitoria**: `requestMatchers("/pacientes/**").permitAll()` en `SecurityConfig` (ruta **relativa al context-path** `/api/v1`; ver nota en §3.7), documentada como deuda técnica a cerrar.
2. **`AuthInterceptor` en Angular** (`core/interceptors/auth.interceptor.ts`): adjunta `Authorization: Bearer <token>` si existe `brevemente_session`; se registra con `provideHttpClient(withInterceptors([authInterceptor]))`.
3. **Cierre de deuda (Fase 3.5)**: proteger `paciente` con `@PreAuthorize` (p. ej. `hasAnyRole('THERAPIST','ADMIN_CLINICAL','SUPERVISOR')`), quitar la whitelist y actualizar los E2E de Playwright de `paciente` para hacer login y adjuntar token antes de cada spec.
4. **Sin regresión**: mientras la whitelist esté activa, el frontend de `paciente` funciona idéntico a hoy (los E2E de `pacientes` NO cambian en Fase 3; solo cambian en Fase 3.5).

> **Gate**: whitelist e interceptor son atómicos; si se omite uno, el módulo `paciente` queda sin servicio.

---

## 4. Frontend Angular: `LoginHttpAdapter`

### 4.1 Archivo nuevo

`Brevemente_App/frontend/src/app/modules/login/adapters/login-http.adapter.ts`

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of, throwError } from 'rxjs';
import { LoginRepository, LoginCredentials, AuthSession } from '../ports/login.repository';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class LoginHttpAdapter implements LoginRepository {
  private readonly baseUrl = `${environment.apiBaseUrl}/auth`;

  constructor(private readonly http: HttpClient) {}

  autenticar(credentials: LoginCredentials): Observable<AuthSession | null> {
    return this.http.post<AuthSession>(`${this.baseUrl}/login`, credentials).pipe(
      map((session) => {
        localStorage.setItem('brevemente_session', JSON.stringify(session));
        return session;
      }),
      catchError((err) => (err?.status === 401 ? of(null) : throwError(() => err)))
      // 401 → credenciales inválidas; el resto de errores (500, red) se propaga sin enmascararse
    );
  }

  cerrarSesion(): Observable<void> {
    // JWT stateless: descartar el token en el cliente es suficiente y evita
    // la incoherencia de invocar un endpoint protegido sin token.
    localStorage.removeItem('brevemente_session');
    return of(undefined);
  }
}
```

> Nota: la respuesta `{ token, user }` del backend es simétrica con `AuthSession { token, user: User }`; si hubiera diferencias de nomenclatura, se resuelven con `map()` **sin tocar** `login.component.html/.scss`.

### 4.2 Cambio de contrato por multi-rol

El backend devuelve `user.roles: string[]` en lugar de un único `role`. Esto implica, en **Fase 3** (no ahora, el SDD solo documenta):

1. `core/types/clinical.types.ts`: `User.role: Role` → `User.roles: Role[]`.
2. `adapters/login-localstorage.adapter.ts`: la semilla mock pasa a `roles: [...]` **y se alinea su identidad con V4** para que `loginBackend=false` y el backend devuelvan los mismos usuarios:
   - therapist: `alejandro.silva@brevemente.org`/`"Dr. Alejandro Silva"`/`CED-8849302-MX` → `sofia.ramirez@brevemente.org`/`"Dra. Sofía Ramírez Lozano"`/`CED-782190-PSIC`.
   - admin_clinical: `"Dra. Patricia Ortiz"`/`CED-5510290-MX` → `"Patricia Ortiz"`/`license: null` (usr-002 no tiene fila en `terapeutas`).
   - supervisor: `"Dra. Isabel Cárdenas"`/`CED-2245177-MX` → `"Isabel Cárdenas"`/`license: null` (usr-003 no tiene fila en `terapeutas`).
3. `login.component.ts` (hoy `this.roleState.setRole(session.user.role)`): pasa a elegir el rol activo inicial, p. ej. `session.user.roles[0]`; HTML/SCSS intactos.
4. `core/services/role-state.service.ts`: mantiene un **rol activo** para la simulación de UI (el usuario elige en cuál rol "opera"), mientras el token porta todos sus roles.
5. El `UserResponseDTO` del backend y el `User` del frontend quedan alineados en `roles`; como el backend envía `string[]` y el frontend `Role[]` (unión de literales), en Fase 3 se valida/mapea (guard de tipo o cast) en el adaptador.

### 4.3 Conmutación del Feature Flag (ADR-002)

En `login.component.ts`, el Factory Provider pasa a:

```typescript
providers: [
  {
    provide: LoginRepository,
    useFactory: (http: HttpClient) => {
      return environment.features.loginBackend
        ? new LoginHttpAdapter(http)
        : new LoginLocalStorageAdapter();
    },
    deps: [HttpClient]
  }
]
```

Y en `environments/environment.ts`: `loginBackend: true`.

> **Regla de Oro SDOP**: `login.component.html` y `login.component.scss` permanecen **100% INTACTOS**.

---

## 5. Criterios de Validación Playwright (Fase 4)

- `POST /api/v1/auth/login` con credenciales válidas → 200 + token; con inválidas → 401 RFC 7807.
- El token JWT porta la **lista de roles** del usuario y `@PreAuthorize` respeta el multi-rol.
- Flujo E2E: `/` → redirect `/login` → login → `/dashboard` → logout → redirect `/login`.
- Cero errores de consola y sin regresiones visuales (`toHaveScreenshot`).
- Semilla determinista: 4 `usuarios` con `password_hash` BCrypt de `demo123` y sus roles en `usuario_roles`.

---

## 6. Cierre de implementación — Fase 3 y Fase 3.5 (estado real)

> Esta sección documenta lo que **efectivamente se implementó** más allá del plan original, cerrando el módulo de autenticación.

### 6.1 Identidad real y multi-rol (frontend)

- `core/types/clinical.types.ts`: `User.role: Role` → **`User.roles: Role[]`**.
- `login-http.adapter.ts`: mapea `roles: string[]` → `Role[]` (validados); se **eliminó** el aplanado a "rol primario".
- `role-state.service.ts` (refactorizado):
  - Carga el **usuario real** desde `brevemente_session`.
  - `currentUserName` devuelve el nombre real del usuario (se **eliminó** el mapa estático `USER_NAMES`).
  - Expone `roles`, `hasRole()`, `currentUser`, `setUser()`, `logout()`.
  - Se **eliminó** `setRole()` y la clave `brevemente_role`.
- `header.component`: **eliminado el selector "Rol:"** (ya no se cambia de rol sin login). Muestra nombre real + badges de roles (solo lectura) + iniciales dinámicas.
- `sidebar.component`: la visibilidad del menú se calcula con la **unión de roles** del usuario.
- `login.component.ts`: inyecta `LoginHttpAdapter` directo (`useClass`, sin factory ni flag) y guarda el usuario completo vía `setUser()`.
- **Eliminado** `login-localstorage.adapter.ts` (mock) y el flag `loginBackend` de `environment.ts` / `environment.prod.ts`.

### 6.2 Guard con expiración JWT

- `auth.guard.ts` valida:
  1. Existencia y forma de la sesión (`token` + `user`).
  2. Expiración del JWT (`exp`); si expiró, limpia la sesión y redirige a `/login`.

### 6.3 Auto-logout por 401 (interceptor)

- `core/interceptors/auth.interceptor.ts`:
  - Adjunta `Authorization: Bearer <token>` a peticiones autenticadas.
  - Ante un **401** en una petición autenticada, **limpia la sesión y redirige a `/login`**.

### 6.4 Auditoría de acceso de login (Opción A — atómica)

- Nuevo puerto `auth/application/ports/out/AuditoriaAccesoPort` + adaptador `AuditoriaAccesoAdapter` + entidad `AuditoriaAccesoJpaEntity` + repositorio `SpringDataAuditoriaAccesoRepository`.
- `SpringDataUsuarioRepository.updateLastLoginAt()` (update nativo de `usuarios.last_login_at`).
- `AuthApplicationService.autenticar` pasó a transacción de **escritura** y, tras validar credenciales, registra el acceso **atómicamente**:
  1. `UPDATE usuarios SET last_login_at = CURRENT_TIMESTAMP`.
  2. `INSERT INTO auditoria_accesos (usuario_id, recurso_accedido='auth', accion='LOGIN', detalles=JSONB{roles, timestamp})`.
- Si la auditoría falla, el login falla (no hay acceso sin traza).

### 6.5 Cierre de la whitelist de `/pacientes/**`

- `SecurityConfig`: se **eliminó** `.requestMatchers("/pacientes/**").permitAll()`.
- `PacienteRestController`: protegido a nivel de clase con `@PreAuthorize("hasAnyRole('THERAPIST','ADMIN_CLINICAL','SUPERVISOR')")`.
- Verificado: `GET /pacientes` sin token → **401**; con token → **200**.

### 6.6 UI (hint de demo)

- `login.component.html`: el hint se actualizó a la credencial real `alejandro.mendoza@brevemente.org` · `demo123`.

### 6.7 Verificación final

- Backend: `mvn compile` OK; arranque con Flyway V4 + Hibernate `validate` OK.
- Frontend: `npm run build` OK.
- E2E Playwright:
  - `login.spec.ts` → **5/5 PASS** (redirección, login exitoso, login inválido, logout, regresión visual).
  - `pacientes.spec.ts` (con login previo) → **5/5 PASS**.
  - Total: **10/10 PASS**.

---

## ⚠️ Punto de Control Humano #1 (Gate de Aprobación)

Firma requerida del Arquitecto/Líder Técnico:

> **"SDD Aprobado. Procede con la Fase 3."**

Sin esta firma, **no se escribe código** en `/backend` ni `/frontend`.

> ✅ **Registro**: firma otorgada el 2026-09-30. Fases 3 y 3.5 implementadas y verificadas (ver §6).
