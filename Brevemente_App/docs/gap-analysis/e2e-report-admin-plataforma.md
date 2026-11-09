# E2E Report: Zona Admin — Dashboard de Plataforma + Gestión de Usuarios y Roles

- **Fecha**: 2026-11-09
- **Módulos**: `admin/dashboard` (Dashboard de Plataforma) y `admin/usuarios` (Gestión de Usuarios y Roles)
- **Suite**: `Brevemente_App/frontend/tests/e2e/admin-plataforma.spec.ts`
- **Oráculo**: Angular 18 (`http://localhost:4200`) → Spring Boot 3.3.3 (`/api/v1`, puerto 8080) → PostgreSQL 17 (`brevemente_db`)
- **Estado**: ✅ **APROBADO**

---

## 1. Resumen de ejecución

| Métrica | Resultado |
| :--- | :--- |
| Casos de prueba | 9 |
| Pasaron | **9 / 9 (100%)** |
| Fallaron | 0 |
| Errores de consola (JS) | 0 |
| Excepciones JS no capturadas | 0 |
| Errores HTTP 500 | 0 |
| Duración total | ~13 s (1 worker, Chromium) |

Ejecutado con `npx playwright test admin-plataforma.spec.ts --reporter=list` contra el backend Spring Boot recién arrancado (`Started BrevementeApplication`, Flyway `Schema "public" is up to date. No migration necessary.`, versión **28**).

---

## 2. Alcance

La suite valida end-to-end los dos módulos ya conectados al backend real de la zona de administración (`/admin/*`), gestionada por el rol `admin_platform` (`rol-001`):

- **Dashboard de Plataforma** (`/admin/dashboard`): KPIs reales, secciones, desglose por terapeuta.
- **Usuarios y Roles** (`/admin/usuarios`): listado real, filtro por rol, alta, edición y reset con confirmación de contraseña (requisito **D12**).

**Fuera de alcance** (diferido por acuerdo): Módulo 3 — Sedes y Establecimientos (aún mock), y la regresión visual (ver §4).

---

## 3. Detalle de casos de prueba

### TC-ADM-01 — Rol no-admin no accede a la zona `/admin` (adminPlatformGuard) ✅
- Login `sofia.ramirez@brevemente.org` (therapist, `rol-003`).
- `page.goto('/admin/dashboard')` → el guard redirige a `/dashboard` (clínico).
- No se renderiza el heading `Dashboard de Plataforma` ni el enlace de sidebar `Sedes y Establecimientos`.

### TC-ADM-02 — Login admin → shell admin y redirección a `/admin/dashboard` ✅
- Login `admin@brevemente.org` (demo123, `usr-admin`, `rol-001`).
- `homeRedirectGuard` envía a `/admin/dashboard`.
- Sidebar de administración visible: navegación `Usuarios y Roles` y `Sedes y Establecimientos`, pie con identidad `Administrador Plataforma`.

### TC-ADM-03 — Dashboard de Plataforma carga KPIs reales y secciones ✅
- KPIs reales desde `GET /admin/dashboard/resumen` (contadores PostgreSQL): `Terapeutas activos` y `Pacientes activos`.
- Secciones renderizadas: `Indicadores clínicos globales`, `Actividad reciente`, `Alertas administrativas`, `Salud de la plataforma`, `Feature flags`.

### TC-ADM-04 — Desglose por terapeuta de un indicador clínico ✅
- Clic en `Efectividad TBE` abre el modal `desglose por terapeuta`.
- El modal muestra los tres terapeutas del desglose (`Dra. Sofía Ramírez Lozano`, `Mtro. Alejandro Mendoza Garza`, `Dra. Isabel Cárdenas`).
- Cierre del modal verificado.

### TC-ADM-05 — Usuarios: listado real desde el backend ✅
- Navegación por sidebar a `/admin/usuarios`.
- Heading `Gestión de Usuarios y Roles`.
- Se listan usuarios reales sembrados por Flyway (`admin@brevemente.org`, `sofia.ramirez@brevemente.org`).
- La cuenta del propio admin se marca `Tú` y `No editable`.

### TC-ADM-06 — Usuarios: filtro por rol ✅
- Filtro de rol `therapist` → `sofia.ramirez@brevemente.org` visible y `admin@brevemente.org` (admin_platform) oculto.

### TC-ADM-07 — Usuarios: edición requiere contraseña de confirmación (D12) ✅
- Abre edición de un usuario no-admin: el modal `Editar usuario` expone el campo `Reescribe tu contraseña para confirmar`.
- Sin confirmación, `Guardar cambios` muestra `Escribe tu contraseña para confirmar los cambios.` (validación de cliente, sin tocar el backend).

### TC-ADM-08 — Usuarios: reset en dos pasos con confirmación (D12) ✅
- Abre `Restablecer`: el modal muestra el **paso de confirmación** (`Generar temporal`) sin generar nada todavía.
- Confirmación vacía → error `Escribe tu contraseña para confirmar.` (sin llamada al backend).

### TC-ADM-09 — Usuarios: alta con email duplicado es rechazada (409, sin mutación) ✅
- Alta con un email ya existente (`sofia.ramirez@brevemente.org`).
- El backend responde **409** y el modal muestra `No se pudo crear el usuario (revisa correo o cédula).`
- Caso no muta la base de datos (idempotente y repetible).

---

## 4. Monitoreo de errores de consola y red

Protocolo estándar de la suite:
- `page.on('console')` → errores de tipo `error`, ignorando `favicon.ico` y 4xx.
- `page.on('pageerror')` → excepciones JS no capturadas.
- `page.on('response')` → respuestas HTTP ≥ 500.

**Resultado**: 0 errores de consola, 0 excepciones JS, 0 respuestas 5xx. El `afterEach` fallaría la suite ante cualquier incidencia.

### Decisión sobre regresión visual

Se omite deliberadamente la regresión visual (`toHaveScreenshot`) en esta suite porque el contenido del dashboard y del listado de usuarios es **dinámico** (KPIs derivados de contadores en PostgreSQL, actividad con marcas de tiempo relativas — `hoy · 09:12`, `hace N min` — y `última actividad` que cambia con cada login). Un snapshot de pixel sería inestable entre ejecuciones. La validación se realiza por **oráculo funcional** (presencia de datos reales y comportamiento de los flujos D12), más robusto para esta superficie.

---

## 5. Observaciones

- **Guard de plataforma**: `adminPlatformGuard` usa el conjunto de roles (`hasRole('admin_platform')`), no el rol activo; el terapeuta es devuelto a `/dashboard` sin shell admin.
- **D12 operativo en frontend**: la confirmación de contraseña se valida en cliente (evita llamadas innecesarias) y se envía al backend en `editar` (`passwordConfirmacion`), `cambiarEstado` y `reset` (`POST /admin/usuarios/{id}/password-temporal`).
- **Encadenamiento edición + estado**: al cambiar el estado en edición, el frontend encadena `PUT /admin/usuarios/{id}` y `PATCH /admin/usuarios/{id}/estado` con la misma confirmación.
- **Alta sin mutación en el test**: se usa email duplicado para validar el 409 del backend (`UsuarioConflictException`) sin insertar registros; la base permanece estable entre corridas.
- **Backend**: Flyway aplicó V26–V28 durante arranques previos; en esta ejecución reportó `Schema "public" is up to date. No migration necessary.` (versión 28).
- **Badges de UI**: los headers de Dashboard de Plataforma y Usuarios muestran ahora `Conectado · datos reales` (antes `Vista previa · datos mock`), coherente con el estado conectado de ambos módulos.

---

## 6. Veredicto final

✅ **APROBADO** — La zona de administración opera end-to-end contra el oráculo real: guard de rol, redirección del admin, dashboard con KPIs reales y desglose, y gestión de usuarios (listado, filtro, alta con validación 409, edición y reset con confirmación D12), sin errores de consola y sin respuestas 5xx.
