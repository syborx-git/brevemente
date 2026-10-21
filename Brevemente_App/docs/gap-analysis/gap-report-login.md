# GAP Analysis Report: Módulo Log In

- **Fecha**: 2026-09-28
- **Módulo**: `login`
- **Estado**: AUDITADO (STRICT READ-ONLY)
- **Fuentes Auditadas**:
  - **Frontend**: `Brevemente_App/frontend/src/app/modules/login/`, `core/guards/auth.guard.ts`, `core/types/clinical.types.ts`
  - **Backend**: `Brevemente_App/backend/src/main/java/com/syborx/brevemente/` y `src/main/resources/db/migration/`

> ⚠️ Nota: el prompt indica la ruta de backend `/backend/src/main/java/com/brevemente/`, pero el paquete real es `com.syborx.brevemente`. La auditoría se realizó sobre el paquete real.

---

## 1. Inventario de Componentes Auditados

### 1.1 Frontend (Angular 18 — Hexagonal / SDOP)

| Componente / Archivo | Rol Arquitectónico | Estado / Observaciones |
| :--- | :--- | :--- |
| `ports/login.repository.ts` | Puerto Secundario (Interface) | Define `LoginRepository` (abstracto) con `autenticar(credentials): Observable<AuthSession \| null>` y `cerrarSesion(): Observable<void>`. Tipos `LoginCredentials { email, password }` y `AuthSession { token, user: User }`. |
| `adapters/login-localstorage.adapter.ts` | Adaptador Mock (Fase 0) | Valida 3 usuarios demo en memoria (`alejandro.silva@brevemente.org`, `patricia.ortiz@brevemente.org`, `isabel.cardenas@brevemente.org` con `demo123`) y persiste `brevemente_session` en LocalStorage. |
| `login.component.ts` | Smart Component | Formulario de acceso; Factory Provider inyecta `LoginLocalStorageAdapter` condicionado al feature flag `loginBackend`. En éxito, `roleState.setRole()` + navegación a `/dashboard`. |
| `login.component.html` / `.scss` | Plantilla Visual | Formulario limpio (correo + contraseña), pantalla a pantalla completa fuera del shell. |
| `core/guards/auth.guard.ts` | Guard funcional | Verifica existencia de `brevemente_session`; sin sesión redirige a `/login`. |
| `core/types/clinical.types.ts` | Dominio TypeScript | Define `User { id, name, role, email, avatar?, license? }` y `Role`. |
| `environments/environment.ts` | Configuración | Feature flag `loginBackend: false` (login opera sobre LocalStorage). |
| `app.routes.ts` | Enrutamiento | `/login` como ruta fuera del `MainLayout`; `MainLayout` protegido con `canActivate: [authGuard]`. |

### 1.2 Backend (Spring Boot 3.3.3 + PostgreSQL + Flyway)

| Componente / Archivo | Rol Arquitectónico | Estado / Observaciones |
| :--- | :--- | :--- |
| `pom.xml` | Dependencias | **NO** incluye `spring-boot-starter-security` ni librería JWT (jjwt/java-jwt). |
| `application.yml` | Configuración | **NO** hay configuración de seguridad, ni `spring.security.*`. Solo datasource, JPA, Flyway y server. |
| Migraciones Flyway (`V1__init_schema.sql`, `V2__seed_clinical_data.sql`, `V3__extend_pacientes_schema.sql`) | Esquema de BD | **NO** existe tabla de usuarios/credenciales ni columna de contraseña. |
| Tabla `terapeutas` (V1) | Datos | Tiene `email VARCHAR(150) UNIQUE NOT NULL`, pero **NO** tiene `password_hash`, `role` ni credenciales. |
| Tabla `auditoria_accesos` (V1) | Auditoría | Tiene `usuario_id VARCHAR(36)` genérico (no es una tabla de usuarios). |
| `TerapeutaJpaEntity` | Entidad JPA | Existe (módulo `paciente`), sin campos de credenciales. |
| `PacienteJpaEntity`, `SpringDataPacienteRepository`, `PacienteApplicationService`, `PacienteRestController` | Módulo `paciente` | Único módulo implementado. **No hay módulo de autenticación.** |
| Controllers REST | Web | Solo `PacienteRestController` (`/pacientes`). **No hay** `AuthController` / `/auth/login`. |

---

## 2. Matriz de Reutilización de Código Existente (Adaptar vs Crear)

| Componente Backend | Estado Actual | Estrategia SDOP |
| :--- | :--- | :--- |
| Tabla `terapeutas` (V1) | Existe con `email` único y `cedula_profesional` | **ADAPTAR/EXTENDER**: agregar `password_hash` y `role` mediante migración `V4__add_auth_to_terapeutas.sql`. |
| `TerapeutaJpaEntity` | Existe | **ADAPTAR/EXTENDER**: añadir campo `passwordHash` y mapear `cedulaProfesional` ↔ `license`. |
| `SpringDataTerapeutaRepository` | Existe | **REUTILIZAR**: añadir `findByEmail(...)`. |
| Seguridad (Spring Security + JWT) | **NO EXISTE** | **CREAR**: dependencias, configuración de seguridad, filtro JWT y endpoints de auth. |
| `PacienteRestController` / estructura hexagonal | Existe (patrón) | **REPLICAR patrón**: `auth` debe seguir la misma estructura Controller → Service → Repository → DTO/Mapper. |

---

## 3. Matriz de Brechas (GAPs) Identificadas

| ID | Tipo | Descripción de la Brecha | Impacto | Acción Propuesta |
| :--- | :--- | :--- | :--- | :--- |
| GAP-LOGIN-001 | **MISSING** | No existe endpoint `POST /api/v1/auth/login` (ni logout). | Alto | Crear `AuthController` con endpoints de login/logout. |
| GAP-LOGIN-002 | **MISSING** | No hay dependencias de seguridad (`spring-boot-starter-security`) ni JWT. | Alto | Añadir Spring Security + jjwt al `pom.xml`. |
| GAP-LOGIN-003 | **MISSING** | No existe entidad/tabla de credenciales ni columna de contraseña en BD. | Alto | Migración `V4__...sql` + entidad de credenciales. |
| GAP-LOGIN-004 | **PARTIAL** | `terapeutas.email` existe (único, apto como login) pero falta `password_hash` y `role`. | Alto | **ADAPTAR** `terapeutas` con `password_hash` y `role` (no crear tabla duplicada). |
| GAP-LOGIN-005 | **CONTRACT** | El puerto `LoginRepository.autenticar()` devuelve `AuthSession { token, user }`; no hay DTO REST equivalente. | Medio | Definir `LoginRequest` / `TokenResponse` y alinear el contrato. |
| GAP-LOGIN-006 | **INCORRECT** | Mismatch de campos: frontend `User.name` (único) y `User.license` vs backend `terapeutas.nombre`+`apellidos` y `cedula_profesional`. | Medio | Mapper en backend que unifique nombre y mapee `cedula_profesional` ↔ `license`. |
| GAP-LOGIN-007 | **DATA** | La semilla del mock (`Dr. Alejandro Silva`, `Dra. Patricia Ortiz`, `Dra. Isabel Cárdenas`) no coincide con `terapeutas` de V2 (`ter-001` Dra. Sofía Ramírez, `ter-002` Mtro. Alejandro Mendoza). | Medio | Alinear semilla SQL con los usuarios del mock o viceversa (semillado determinista). |

---

## 4. Recomendaciones para demo-gap-implementation

Orden de ejecución sugerido (posterior a la aprobación del SDD — Gate #1):

1. **Base de datos (Flyway)**: crear `V4__add_auth_to_terapeutas.sql` que:
   - Añada `password_hash VARCHAR(255)` y `role VARCHAR(30)` a `terapeutas`.
   - Actualice la semilla para que coincida con los usuarios del mock (correos y hashes de `demo123`).
2. **Backend (Spring Boot)**:
   - Añadir `spring-boot-starter-security` y JWT.
   - Crear módulo `auth` hexagonal: `AuthController` (`POST /auth/login`), `AuthService`, DTOs `LoginRequest`/`TokenResponse`, y reutilizar `SpringDataTerapeutaRepository.findByEmail`.
   - Configurar `SecurityFilterChain`, `PasswordEncoder` (BCrypt) y filtro JWT.
3. **Frontend (Angular)**:
   - Crear `adapters/login-http.adapter.ts` implementando `LoginRepository` con `HttpClient` hacia `/api/v1/auth/login`.
   - Conmutar el Factory Provider con `environment.features.loginBackend = true`.
   - Conservar `login.component.html` y `.scss` **100% intactos** (Regla de Oro SDOP).
4. **Validación (Playwright)**: verificar flujo login → dashboard → logout contra el servidor real, sin errores de consola ni regresiones visuales.
