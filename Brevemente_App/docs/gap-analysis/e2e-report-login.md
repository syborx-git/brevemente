# E2E Test Report & Oracle Validation: Módulo Log In

- **Fecha**: 2026-10-02
- **Módulo**: `login`
- **SDD Asociado**: `SDD-004` (v1.5.0) — Fases 3 y 3.5 implementadas
- **Ambiente de Ejecución**: Producción Local SDOP (sin mock; `LoginHttpAdapter` directo)
  - **Frontend**: Angular 18 en `http://localhost:4200` (`ng serve`, watch mode)
  - **Backend**: Spring Boot 3.3.3 en `http://localhost:8080` (`context-path: /api/v1`)
  - **Base de Datos**: PostgreSQL 17 (`brevemente_db`) con Flyway `V1`, `V2`, `V3`, `V4`
  - **Motor de Pruebas**: Playwright 1.63.0 (Headless Chromium 1280x720)
- **Rol**: QA Automation Lead
- **Estado Global**: **APROBADO (100% PASS)**

---

## 1. Resumen Ejecutivo de Ejecución

```text
Running 10 tests using 1 worker

  ✓ TC-LOG-01: Redirección a /login sin sesión activa (authGuard)
  ✓ TC-LOG-02: Login exitoso contra el oráculo real (Spring Boot + PostgreSQL)
  ✓ TC-LOG-03: Login inválido muestra error y no navega
  ✓ TC-LOG-04: Cierre de sesión retorna a /login
  ✓ TC-LOG-05: Regresión Visual de la pantalla de Log In
  ✓ TC-PAC-01..05: Módulo de Pacientes (con autenticación previa)

  10 passed (24.4s)
```

| Métrica | Valor Obtenido | Umbral de Aceptación | Estado |
| :--- | :---: | :---: | :---: |
| **Casos Ejecutados** | 10 | 10 | **100%** |
| **Casos Aprobados** | 10 | 10 | **100%** |
| **Excepciones JS en Consola** | 0 | 0 | **PASS** |
| **Errores de Servidor HTTP 500** | 0 | 0 | **PASS** |
| **Tolerancia Regresión Visual** | 0.00% | $\le$ 1.00% (`maxDiffPixelRatio: 0.01`) | **PASS** |

---

## 2. Monitoreo de Consola y Red

Se implementaron listeners reactivos en Playwright (`page.on('console')`, `page.on('pageerror')`, `page.on('response')`):

- **Excepciones de JavaScript**: Ninguna excepción detectada en runtime (`[Uncaught JS Exception]: 0`).
- **Errores de servidor HTTP 500**: Cero respuestas $\ge$ 500 durante toda la suite.
- **Respuestas 4xx esperadas**: el `401 Unauthorized` del caso TC-LOG-03 (credenciales inválidas) es el **comportamiento contractual** del endpoint y se excluye del criterio de fallo; los 5xx sí fallan la suite.
- **Llamadas de Red**:
  - `POST /api/v1/auth/login` → **HTTP 200** con `{ token, user }` (credenciales válidas).
  - `POST /api/v1/auth/login` → **HTTP 401** RFC 7807 (credenciales inválidas).
  - El proxy de Angular redirigió de forma transparente `/api/v1/**` del puerto 4200 al backend en el 8080.

### 2.1 Verificación de seguridad (Fase 3.5)

- **Cierre de whitelist**: `GET /api/v1/pacientes` **sin** token → **HTTP 401**; **con** token JWT válido → **HTTP 200** (4 registros).
- **Auditoría de acceso**: tras un login exitoso se verificó en PostgreSQL:
  - `usuarios.last_login_at` actualizado.
  - Nueva fila en `auditoria_accesos` con `recurso_accedido='auth'`, `accion='LOGIN'`, `detalles` JSONB con roles y timestamp.
- **Auto-logout por 401**: el interceptor limpia la sesión y redirige a `/login` ante un 401 en una petición autenticada.

---

## 3. Matriz de Casos de Prueba (Oráculo y E2E)

### TC-LOG-01: Redirección a /login sin sesión activa (authGuard)
- **Objetivo**: Verificar que el guard funcional redirige al usuario no autenticado a la pantalla de acceso fuera del shell.
- **Evidencia**:
  - `page.goto('/')` → redirección a `**/login`.
  - Formulario visible: `h2 "Iniciar sesión"`, `#email`, `#password`, botón `Ingresar`.
- **Resultado**: **PASS**

### TC-LOG-02: Login exitoso contra el oráculo real (Spring Boot + PostgreSQL)
- **Objetivo**: Confirmar que la autenticación consulta la tabla `usuarios` (Flyway `V4`), no el mock de LocalStorage.
- **Credenciales**: `sofia.ramirez@brevemente.org` / `demo123` (`usr-001`).
- **Evidencia (oráculo)**:
  - Navegación a `**/dashboard` (shell autenticado).
  - `localStorage['brevemente_session']` contiene un **token JWT** emitido por el backend.
  - `user.email = sofia.ramirez@brevemente.org`, `user.role = therapist`.
  - La cédula (`license`) se resolvió vía `terapeutas.usuario_id → usuarios` (frontera hexagonal `LicenseLookupPort`).
  - El formulario de login desaparece y el header muestra `Cerrar sesión`.
- **Resultado**: **PASS**

### TC-LOG-03: Login inválido muestra error y no navega
- **Objetivo**: Validar el manejo del 401 con mensaje de error sin navegación.
- **Acciones y Aserciones**:
  - Credenciales `sofia.ramirez@brevemente.org` / `clave-incorrecta`.
  - Mensaje reactivo *"Credenciales inválidas"* visible.
  - URL permanece en `/login`.
- **Resultado**: **PASS**

### TC-LOG-04: Cierre de sesión retorna a /login
- **Objetivo**: Verificar el logout stateless (descarte del token en el cliente) y el regreso al estado público.
- **Acciones y Aserciones**:
  - Login exitoso → `Cerrar sesión` → redirección a `**/login`.
  - `localStorage['brevemente_session']` queda en `null`.
  - Pantalla de acceso nuevamente visible.
- **Resultado**: **PASS**

### TC-LOG-05: Regresión Visual de la pantalla de Log In
- **Objetivo**: Comprobar la paridad visual contra la línea base sin desviaciones estéticas.
- **Configuración**: `maxDiffPixelRatio: 0.01` (1% de tolerancia máxima por antialiasing / renderizado de fuentes).
- **Snapshot Generado**: `tests/e2e/login.spec.ts-snapshots/login-pantalla-chromium-win32.png`.
- **Resultado**: **PASS** (Desviación pixel-a-pixel: 0.00%).

---

## 4. Auditoría de Inmutabilidad de UI (Regla de Oro SDOP)

Conforme a las directrices de `ADR-001`, `ADR-002` y la Skill `demo-gap-implementation`:

- `login.component.scss`: **0 líneas modificadas (100% INTACTO)**.
- `login.component.html`: la estructura y estilos permanecen intactos; solo se actualizó el **texto del hint** de credenciales (de `alejandro.silva` → `alejandro.mendoza`) en Fase 3.5.
- La integración se efectuó en el puerto secundario (`LoginHttpAdapter`), el interceptor (`auth.interceptor.ts`), el servicio de estado (`role-state.service.ts`), el backend Spring Boot 3 (módulo `auth`) y PostgreSQL mediante Flyway `V4`.

---

## 5. Observaciones y Dictamen Final de QA

### Observaciones menores (no bloqueantes)
1. ~~Hint de demo desactualizado~~ — **RESUELTO en Fase 3.5**: el hint ahora muestra la credencial real `alejandro.mendoza@brevemente.org · demo123`.
2. Spring Boot emite el warning de "generated security password" propio de la autoconfiguración por defecto; es inocuo porque el `SecurityFilterChain` JWT no usa `formLogin`/`httpBasic` ni el `UserDetailsService` en memoria.

### Dictamen
El módulo **`login`** cuenta con certificación completa: autenticación contra oráculo real, identidad multi-rol, persistencia de sesión JWT con expiración, auto-logout por 401, auditoría de acceso atómica y cierre de la whitelist de `/pacientes/**` con `@PreAuthorize`. Las suites de `login` (5) y `pacientes` (5, con autenticación previa) pasan **10/10**. Se autoriza el cierre de las **Fases 3 y 3.5** del módulo de autenticación.
