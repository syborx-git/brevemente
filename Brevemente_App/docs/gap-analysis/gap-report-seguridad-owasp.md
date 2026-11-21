# GAP Analysis Report: Auditoría de Seguridad OWASP (Plataforma Completa)

- **Fecha**: 2026-11-10
- **Rama**: `feature/jp-analisis-brechas-seguridad`
- **Alcance**: Backend Spring Boot (hexagonal) + Frontend Angular 18 + configuración + Docker/Flyway
- **Estado**: AUDITADO (READ-ONLY, sin modificación de código)
- **Metodología**: OWASP Top 10 (2021) + ASVS (V2 Authentication, V3 Session Management, V4 Access Control, V5 Validation, V6 Cryptography, V7 Error Handling/Logging, V9 Data Protection)
- **Auditor**: `jarvis-security` (CSO)

---

## 1. Resumen ejecutivo

La arquitectura de autenticación está bien diseñada en su núcleo: BCrypt, refresh token opaco rotado con detección de reutilización, revocación por `token_version` verificada por request, anti-IDOR en expedientes y citas, y queries JDBC parametrizadas (sin inyección SQL).

Sin embargo, existen **fallos críticos de configuración CORS, secretos por defecto hardcodeados, credenciales semilla conocidas y endpoints de IA (LEVA) sin control de acceso**, que permitirían acceso no autorizado a PHI y suplantación de firma clínica. El proyecto **no es apto para producción** en su estado actual.

**VEREDICTO: ❌ RECHAZADO** — 4 hallazgos críticos, 4 altos, 4 medios, 3 bajos.

---

## 2. Matriz de brechas de seguridad (GAP-SEC)

| ID | Severidad | Categoría OWASP | Ubicación | Brecha | Impacto | Acción propuesta |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| GAP-SEC-01 | **CRÍTICA** | A05 Security Misconfiguration | `auth/infrastructure/security/SecurityConfig.java:82-86` y `config/WebCorsConfig.java:16` | CORS con `allowedOriginPatterns("*")` **y** `setAllowCredentials(true)`; dos configuraciones CORS redundantes y conflictivas (`setAllowedOrigins` + `setAllowedOriginPatterns`). `allowedOriginPatterns` tiene precedencia y, con credenciales, refleja el `Origin` de cualquier sitio. | Cualquier web maliciosa puede lanzar peticiones autenticadas (refresh vía cookie o API con token) → robo de cuenta / CSRF-like. | Eliminar `setAllowedOriginPatterns` y `WebCorsConfig`; dejar **solo** `setAllowedOrigins` con lista blanca explícita. Con credenciales, nunca usar `*`. |
| GAP-SEC-02 | **CRÍTICA** | A01 Broken Access Control | `leva/.../rest/LevaSessionController.java` (sin `@PreAuthorize`) y `LevaOrchestrationService.approveProposal` (`reviewedById` desde el body) | Los endpoints `/leva/sessions/**` (transcribe, proposal, approve, risk-status) no exigen permiso; solo autenticación. `reviewedById` se toma del cuerpo de la petición, no del principal autenticado. | Cualquier usuario autenticado (incluso rol `patient`) puede leer propuestas clínicas de cualquier sesión y **firmar/sellar expedientes haciéndose pasar por otro terapeuta**. | Añadir `@PreAuthorize("hasAuthority('LEVA_USAR')")` a nivel de clase y derivar `reviewedById` de `@AuthenticationPrincipal`. Validar pertenencia de la sesión al terapeuta (reutilizar `PacienteAccesoPort`). |
| GAP-SEC-03 | **CRÍTICA** | A02 Cryptographic Failures / A05 | `application.yml:28,32,42`; `JwtService.java:17`; `docker-compose.yml` (perfil prod con defaults) | Secretos con valores por defecto en código y compose: `JWT_SECRET`, `DATABASE_PASSWORD=admin`, `LEVA_INTERNAL_API_KEY`. Compose los inyecta incluso con perfil `prod`. | Si no se sobreescriben las variables, un atacante puede **forjar JWTs** (firma HMAC con secreto público), acceder a PostgreSQL y al webhook interno. | Eliminar defaults de `application.yml` y `docker-compose.yml`; exigir variables de entorno con fail-fast; rotar secretos; usar gestor de secretos. |
| GAP-SEC-04 | **CRÍTICA** | A07 Identification & Authentication Failures | Migraciones `V4/V5/V6` (usuarios semilla) | Todos los usuarios semilla (admin, terapeutas, supervisores, pacientes, asistente) comparten la contraseña conocida `demo123`. El admin no tiene `debe_cambiar_password=TRUE`. | Acceso directo como administrador con credencial pública conocida. | No documentar credenciales en migraciones; forzar `debe_cambiar_password=TRUE` para **todos** los seeds (incluido admin); exigir cambio en primer login; eliminar semilla en producción. |
| GAP-SEC-05 | **ALTA** | A05/A07 (XSS → robo de token) | Frontend `core/interceptors/auth.interceptor.ts`, `core/guards/auth.guard.ts`, `core/services/role-state.service.ts` | El access token JWT se persiste en `localStorage` (`brevemente_session`). Solo el refresh va en cookie HttpOnly. | Un XSS (o script/extension de terceros) puede leer `localStorage` y exfiltrar el access token. Contradice el diseño "JWT en cookie HttpOnly". | Mantener el access token en memoria (variable del servicio) y el refresh en cookie HttpOnly; o mover ambos a cookies HttpOnly con SameSite. |
| GAP-SEC-06 | **ALTA** | A01 Broken Access Control (IDOR) | `constancia/.../ConstanciaRestController.java:37`, `auditoria/.../AuditoriaExpedienteRestController.java:28`, `pago/.../PagoRestController.java:39` | Endpoints `GET /constancias?pacienteId=`, `GET /expedientes/{pacienteId}/auditoria` y `GET /pagos?pacienteId=` exigen solo permiso de lectura genérico (`EXPEDIENTE_LEER`/`PAGOS_LEER`), **sin validar el alcance** del paciente (a diferencia de `ExpedienteRestController` que usa `PacienteAccesoPort`). | Cualquier usuario con permiso de lectura genérico puede leer constancias, bitácora clínica y pagos de pacientes ajenos. | Inyectar `PacienteAccesoPort.puedeAcceder(...)` en estos tres controladores (mismo patrón anti-IDOR de `ExpedienteRestController.validarAccesoPaciente`). |
| GAP-SEC-07 | **ALTA** | A05 Security Misconfiguration | `frontend/nginx.conf` (listen 80); `application.yml:32` (`COOKIE_SECURE=false`) | Nginx sirve solo HTTP (puerto 80), sin TLS ni headers de seguridad (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy). Cookie de refresh sin flag Secure por defecto. | Tráfico en claro (MITM), clickjacking, MIME-sniffing, cookies sin Secure. | Terminar TLS en nginx; añadir `add_header` de seguridad y CSP estricta; forzar `COOKIE_SECURE=true` en prod. |
| GAP-SEC-08 | **ALTA** | A07 / A05 | `auth/.../AuthController.java` (`resolveClientIp`); `auth/.../InMemoryLoginAttemptAdapter.java` | La IP usada para anti-fuerza-bruta se toma de `X-Forwarded-For` sin validar (spoofable) y el limitador vive en memoria (no aplica con varias réplicas). | Bypass del rate limiting de login (password spraying) rotando XFF; sin protección multi-instancia. | Usar `ForwardedHeaderFilter` solo para proxy de confianza; reemplazar el adaptador en memoria por Redis. |
| GAP-SEC-09 | **MEDIA** | A02 / A05 | `leva/.../LevaInternalWebhookController.java`; `SecurityConfig.java:53` | El webhook `/internal/**` se protege con `X-Internal-API-Key` comparado con `equals` (no constant-time) y clave por defecto débil; la ruta es `permitAll`. | Timing attack sobre la clave; con el default, inyección de transcripciones falsas. | Comparación constante (`MessageDigest.isEqual`); clave fuerte solo desde env; restringir `/internal/**` a red/lista blanca. |
| GAP-SEC-10 | **MEDIA** | A09 / V7 Error Handling | `dashboard/.../advice/DashboardExceptionHandler.java` | `handleUnexpected` devuelve `ex.getMessage()` directamente al cliente (500). | Fuga de detalles internos (rutas, SQL, clases) en respuestas de error del paquete dashboard. | Devolver mensaje genérico y registrar la excepción completa solo en logs. |
| GAP-SEC-11 | **MEDIA** | A03 Injection (path traversal) | `leva/.../client/PythonTranscriptionHttpClient.java` | El nombre de archivo subido (`file.getOriginalFilename()`) se reenvía tal cual al microservicio Python, sin sanitizar ni validar MIME (límite global 100 MB). | Posible path traversal / archivo malicioso si el servicio Python escribe con ese nombre. | Generar nombre propio en backend (UUID + extensión por MIME validado), validar `Content-Type` y limitar tamaño por archivo. |
| GAP-SEC-12 | **MEDIA** | A05 | `application.yml:35`; `SecurityConfig.java:66` | La lista CORS incluye orígenes HTTP planos y direcciones IP públicas (p. ej. `http://188.245.203.48`). | Origen no nominal y tráfico sin TLS permitido. | Restringir a dominios HTTPS nominales; eliminar IPs. |
| GAP-SEC-13 | **MEDIA** | A05 | `docker-compose.yml` (puertos 5432, 11434, 8000, 8080) | PostgreSQL, Ollama, transcript-engine y backend expuestos al host. | Superficie de ataque innecesaria (BD y LLM accesibles desde la red). | Exponer solo 80/443; mover el resto a red interna Docker. |
| GAP-SEC-14 | **BAJA** | A05 | `SecurityConfig.java:54-59` | Swagger UI y `/v3/api-docs/**` en `permitAll` (también en prod). | Divulgación del esquema completo de la API. | Restringir a perfil dev con `@Profile`. |
| GAP-SEC-15 | **BAJA** | A09 Data Protection | Migración `V6` (datos de pacientes) | PHI sintético (emails y nombres) en semilla de BD versionada. | Riesgo reputacional/regulatorio si se despliega con datos semilla. | Usar datos claramente ficticios o remover la semilla en producción. |

---

## 3. Checklist OWASP / ASVS

| Dominio | Estado | Observación |
| :--- | :--- | :--- |
| Authentication (V2) | ⚠️ | BCrypt correcto; dummy-hash anti-enumeración; contraseñas temporales con TTL; **pero** credenciales semilla `demo123` y secretos por defecto. |
| Session Management (V3) | ✅ | Refresh token opaco rotado + hash SHA-256 + detección de reutilización + ventana de gracia 20 s + revocación por `token_version`; cookie HttpOnly/SameSite=Lax/Path scoped. Fallo menor: `COOKIE_SECURE=false`. |
| Access Control (V4) | ❌ | `@PreAuthorize` extendido y anti-IDOR en expedientes/citas/dashboard/supervisión; **pero** LEVA sin autorización, `reviewedById` desde el cliente e IDOR en constancias/auditoría/pagos. |
| Validation / Sanitization (V5) | ⚠️ | `@Valid` + Bean Validation en DTOs; JDBC con `?` preparados (sin SQLi); sin `[innerHTML]` en Angular; **pero** filename de upload sin sanitizar. |
| Cryptography (V6) | ⚠️ | JJWT 0.12.6 con `verifyWith(SecretKey)` (evita `alg=none`); **pero** secreto por defecto hardcodeado y claves internas débiles. |
| Error Handling (V7) | ⚠️ | RFC 7807 genérico en auth; `DashboardExceptionHandler` filtra `ex.getMessage()`. |
| Logging (V7/V9) | ✅ | Auditoría de login/acceso presente; no se observan tokens ni contraseñas en logs; evento `REFRESH_REUSE_DETECTED` bien registrado. |
| Config (V4/A05) | ❌ | CORS wildcard con credenciales; nginx sin TLS ni headers; puertos de infraestructura expuestos; Swagger abierto; `/internal/**` permitAll. |
| Data Protection (V6/A09) | ⚠️ | PHI no encriptado en reposo (no verificado); PHI sintético en migraciones; access token en `localStorage`. |

---

## 4. Priorización de remediaciones

### P0 — Bloquear antes de producción (críticos)
1. `GAP-SEC-01` — Corregir CORS (quitar `*` con credenciales; unificar a una sola config).
2. `GAP-SEC-03` — Eliminar secretos por defecto; exigir variables de entorno.
3. `GAP-SEC-02` — Proteger LEVA con `@PreAuthorize` y derivar `reviewedById` del principal.
4. `GAP-SEC-04` — Forzar cambio de contraseña de las credenciales semilla.

### P1 — Alta prioridad (esta iteración)
5. `GAP-SEC-05` — Sacar el access token de `localStorage`.
6. `GAP-SEC-06` — Aplicar `PacienteAccesoPort` en constancias/auditoría/pagos.
7. `GAP-SEC-07` — TLS + headers de seguridad en nginx.
8. `GAP-SEC-08` — Endurecer rate limiting (XFF validado + Redis).

### P2 — Media/baja (siguiente iteración)
9. `GAP-SEC-09` — Comparación constant-time y endurecer `/internal/**`.
10. `GAP-SEC-10` — Mensajes de error genéricos en dashboard.
11. `GAP-SEC-11` — Sanitizar nombre de archivo de audio.
12. `GAP-SEC-12/13/14/15` — Restringir orígenes CORS, cerrar puertos, Swagger solo dev, limpiar PHI semilla.

---

## 5. Notas y limitaciones

- **No verificado**: sanitización del nombre de archivo en el microservicio Python (`transcript_engine_python`). El riesgo real de path traversal (GAP-SEC-11) depende de cómo ese servicio escribe en disco.
- **No verificado**: cifrado de PHI en reposo (columna-level/TDE) en PostgreSQL.
- Los hallazgos fueron contrastados contra el código fuente real (rutas y líneas citadas verificadas). Cualquier corrección debe re-auditarse tras aplicar los cambios.

---

## 6. Siguientes pasos propuestos

1. Aprobar/repriorizar la lista P0/P1/P2 con el equipo.
2. Ejecutar remediaciones con `jarvis-backend` / `jarvis-devops` / `jarvis-frontend` según la capa.
3. Re-auditar con `jarvis-security` (veredicto final) y cubrir con tests de `jarvis-qa`.
4. Registrar la implementación en `log.md` y actualizar ADR/SDD si cambia el modelo de sesión.
