# GAP Analysis Report: Módulo Mi Consulta (Vista Privada del Terapeuta)

- **Fecha**: 2026-10-21
- **Módulo**: Mi Consulta (`/mi-consulta`) — vista privada/operativa del terapeuta
- **Estado**: AUDITADO (READ-ONLY)

---

## 1. Inventario de Componentes Auditados

### Demo (oráculo)
- `brevemente_demo/src/pages/MiConsulta.tsx` — vista completa (cabecera, próxima sesión, agenda del día, alertas urgentes, solicitudes de supervisión, borradores LEVA, información secundaria, modales de crisis).
- `brevemente_demo/src/App.tsx` — enrutado `/mi-consulta` (niega acceso a `student` y `patient`).
- Servicios demo: `riskSimulationService`, `supervisionRequestService`, `therapistService`.

### Frontend Angular actual
- `frontend/src/app/modules/mi-consulta/mi-consulta.component.ts` — **placeholder vacío** ("Este módulo está en construcción"). El contenido anterior (configuración del terapeuta) fue migrado a `modules/configuracion/`.
- Ruta: `app.routes.ts` → `/mi-consulta` con `staffOnlyGuard`.
- Sidebar: entrada "Mi Consulta" en INICIO (roles: admin_platform, admin_clinical, therapist, supervisor).

### Backend Spring Boot (inventario de reutilización)
- **Citas**: `CitaRestController` (`GET/POST /citas`, `PATCH /citas/{id}/estado`, `PATCH /citas/{id}`).
- **Dashboard**: `DashboardRestController` (`GET /dashboard/citas-hoy`, `GET /dashboard/accion-dominante`, `GET /dashboard/alertas`, `GET /dashboard/catalogos`, entre otros). Modelo `AccionDominante` con 14 campos.
- **Supervisión**: `SupervisionRestController` (`GET/POST /supervision/bitacoras`, `GET/POST /supervision/solicitudes`, `PATCH /supervision/solicitudes/{id}/atender`).
- **Expediente/Sesiones**: `ExpedienteRestController` (`GET/PATCH /expedientes/paciente/{id}`, `GET/POST /expedientes/paciente/{id}/sesiones`). `SesionApplicationService` crea sesiones con `status='borrador'`.
- **Consentimiento**: `ConsentimientoRestController` (`POST /pacientes/{id}/consentimiento/firmar`).
- **Mi Consulta (config, ya migrada)**: `MiConsultaRestController` (`GET/PUT /api/v1/mi-consulta`, `PUT /api/v1/mi-consulta/sedes`; `@PreAuthorize MI_CONSULTA_LEER/EDITAR`) — sigue existiendo y es la fuente de catálogo de sedes + sede `esPrincipal` para el header de Mi Consulta.
- **Portal paciente**: `alerta_paciente` (V17) con `PacientePortalRestController` (`GET /portal-paciente/alertas`, `POST /portal-paciente/crisis`).
- **Flyway**: V1–V17 aplicadas. Sin tabla de "capacitación/campus" ni de "sesión en curso".

---

## 2. Funcionalidades de la demo vs. estado actual

| Funcionalidad demo (MiConsulta.tsx) | ¿Existe en la UI Angular actual? | ¿Soporte backend? |
| :--- | :--- | :--- |
| Título dinámico por rol | ❌ (placeholder vacío) | N/A (frontend) |
| Role-gating student/patient | ❌ (guard solo bloquea patient) | N/A (seguridad) |
| Próxima Sesión (paciente, motivo, sesión #, estado) | ❌ | Parcial (`AccionDominante`) |
| Selector de estado de sesión (por_iniciar/en_curso/finalizada/nota_pendiente) | ❌ | ❌ (simulado en demo) |
| Parámetros de admisión (Intake, Consentimiento, LEVA) | ❌ | Parcial |
| Agenda de Hoy del terapeuta | ❌ | ✅ (`/dashboard/citas-hoy`) |
| Requieren Atención Urgente (alertas + Resolver Caso) | ❌ | Parcial (`/dashboard/alertas` tipo RIESGO desde `risk_level`, solo lectura; falta circuito de crisis `alerta_paciente` + resolución) |
| Solicitudes de supervisión (Atender Solicitud) | ❌ | ✅ (`/supervision/solicitudes`) |
| Borradores de LEVA Pendientes | ❌ | Parcial (`sesiones.status='borrador'`) |
| Información Secundaria (Supervisiones, Capacitación) | ❌ | Parcial (supervisión) / ❌ (capacitación) |
| Sede activa en cabecera | ❌ | Parcial (catálogo de sedes) |
| Modales de crisis (Resolución, Acta) | ❌ | ❌ |

---

## 3. Matriz de Reutilización de Código Existente (ADAPT vs CREATE)

| Componente Backend | Estado Actual | Estrategia SDOP |
| :--- | :--- | :--- |
| `AccionDominante` + `GET /dashboard/accion-dominante` | 14 campos (citaId, pacienteId, pacienteNombre, terapeutaNombre, fecha, hora, tipoCita, modalidad, duracionMinutos, consultorio, protocolo, intakeListo, consentimientoFirmado, grabacionLeva) | **EXTENDER** con `motivoConsulta` y `numeroSesion` |
| `GET /dashboard/citas-hoy` | Existe con scope por terapeuta | **REUTILIZAR** (Agenda de Hoy) |
| `GET /dashboard/catalogos` (sedes) | Existe | **REUTILIZAR** (selector de sede) |
| `GET/POST/PATCH /supervision/solicitudes` | Existe (listar, crear, atender) | **REUTILIZAR** (solicitudes + atender) |
| `alerta_paciente` (V17) + portal endpoints | Tabla y endpoints de paciente existen | **EXTENDER** con controller staff (listar + resolver) |
| `sesiones.status='borrador'` + `GET /expedientes/paciente/{id}/sesiones` | Existe | **EXTENDER** con agregado por terapeuta |
| `pacientes.consentimiento_representante_firmado` + `POST /pacientes/{id}/consentimiento/firmar` | Existe | **REUTILIZAR** (parámetro Consentimiento) |
| Campus / Capacitación pendiente | No existe | **CREAR** (fuera de alcance de Mi Consulta) |

---

## 4. Matriz de Brechas (GAPs) Identificadas

| ID | Tipo | Descripción de la Brecha | Impacto | Acción Propuesta |
| :--- | :--- | :--- | :--- | :--- |
| GAP-MC-01 | INCORRECT | La ruta `/mi-consulta` usa `staffOnlyGuard` (solo bloquea `patient`) y deja pasar a `assistant` por URL. Nota: la demo solo niega `student`/`patient` (sí permite `assistant`), pero el sidebar lo excluye y el backend (rol-004) no tiene `MI_CONSULTA_LEER`. | Alto | Usar `hasAnyRoleGuard('admin_platform','admin_clinical','therapist','supervisor')` (misma lista que el sidebar). Alternativa equivalente: guard por permiso `MI_CONSULTA_LEER` (V5, otorgado exactamente a esos 4 roles). Nota: cambia el redirect de `patient` de `/mi-historial` a `/dashboard` (inocuo: `permissionGuard` re-redirige a patient). |
| GAP-MC-02 | PARTIAL | `AccionDominante` no expone `motivoConsulta` ni `numeroSesion` (la demo muestra "Motivo: Ataque de Pánico • Sesión #3"). | Medio | Extender query/DTO de `accion-dominante` con `pacientes.motivo_consulta` (V3) y número de sesión (`sesiones.numero`, V7) vía JOIN (`sesiones.cita_id`, V17 — sin migración). Ojo: el método Spring Data es `findProximaDeHoyGlobal`/`findProximaDeHoyScoped`; y `DashboardRestMapper` tiene dos mapeos (`toResponse` clínico / `toResponseOperativo` que enmascara `intakeListo`/`consentimientoFirmado`) — decidir si los campos nuevos se enmascaran en modo operativo. |
| GAP-MC-03 | MISSING | El estado de sesión `por_iniciar/en_curso/finalizada/nota_pendiente` no tiene equivalente backend (cita usa `estado_cita`; sesión usa `status`). | Medio | Definir si es simulación de UI o modelar sobre `sesiones.status`. |
| GAP-MC-04 | MISSING | No hay endpoint staff para listar alertas de crisis/riesgo activas desde `alerta_paciente`, ni para resolverlas. El dashboard `/alertas` usa `pacientes.risk_level`, no `alerta_paciente`. | Alto | Crear controller staff: `GET` alertas activas scopeadas al terapeuta (JOIN `alerta_paciente → pacientes.terapeuta_id`, V3) + `PATCH` resolver. Precisión: `crisis_atendida` es un valor de `tipo`, NO de `estado`; resolver = `estado='resuelta'` + `resuelta_por` + `resuelta_en`. |
| GAP-MC-05 | PARTIAL | Los endpoints de supervisión existen, pero `GET /supervision/solicitudes` exige `pacienteId` (lista por paciente) y **no** existe listado agregado de "pendientes" por terapeuta/supervisor. | Medio | **EXTENDER** backend con listado agregado de solicitudes pendientes + consumir en frontend. Definir permiso: `POST /solicitudes` exige `EXPEDIENTE_ESCRIBIR` y `PATCH .../atender` exige `SUPERVISION_EVALUAR` (supervisor); `admin_clinical` tiene `SUPERVISION_LEER` pero no `SUPERVISION_EVALUAR`. |
| GAP-MC-06 | PARTIAL | "Borradores de LEVA Pendientes": existe `sesiones.status='borrador'`, pero no hay endpoint agregado por terapeuta y la generación IA de LEVA no está implementada (`asistenteLevaBackend: false` en dev). | Medio | Endpoint agregado de borradores por terapeuta (camino indexado vía `idx_expedientes_terapeuta`, V7); la IA queda fuera de alcance. |
| GAP-MC-07 | MISSING | "Mi Capacitación Pendiente" (Información Secundaria) no tiene backend académico. | Bajo | Depende del módulo Campus (placeholder). |
| GAP-MC-08 | PARTIAL | "Sede activa" del header: en la demo es un badge estático "Sede Centro". Angular ya tiene más infraestructura que la demo. | Bajo | Reutilizar el repositorio de `configuracion` (`obtenerSedesCatalog()` + `obtenerConfig()`) y mostrar la sede con `esPrincipal: true`; permitir cambio solo si hay varias sedes. |
| GAP-MC-09 | DATA | La demo usa fecha fija `2026-08-24` con citas de hoy para `therapist-1`; el backend usa la fecha real (hoy 2026-10-21) y las citas seed de `ter-001` están en 2026-10-07/08 (pasadas). `citas-hoy`/`accion-dominante` devolverían vacío. | Alto | Seed correctivo (V18) con citas de hoy para `ter-001` usando `pac-002` (adulta `FIRMADO_TITULAR`, no activa bloqueo normativo; su `exp-002` ya tiene sesiones 1 y 2 → próxima sesión #3, coincide con la demo). Opcional: índices parciales `idx_alerta_paciente_activa_paciente` y `idx_sesiones_borrador`. |
| GAP-MC-10 | MISSING | Modales `CrisisResolutionModal` y `CrisisIncidentDetailModal` (protocolo de resolución de crisis y acta histórica) no tienen backend. | Alto | Depende de GAP-MC-04. |

---

## 4.1 Fidelidad visual y requisitos de frontend (auditoría jarvis-frontend)

- **Clases Tailwind inválidas en la demo**: `MiConsulta.tsx` usa `text-slate-655`, `text-slate-450`, `text-red-750`, `text-amber-750`, `border-emerald-250`, `border-slate-150`, `text-red-650` (todas inexistentes en la paleta por defecto). Al reconstruir la vista se deben mapear a clases válidas + tokens `clinical.*` (`clinical-textMuted`, `clinical-accent`, `clinical-dark`, `clinical-teal`), igual que se hizo en los tabs de Biblioteca/Campus.
- **Estado de sesión (GAP-MC-03)**: es una **simulación** (la demo lo registra en auditoría como "Simulación estado sesión"). Debe llevar badge visible "Simulación", `aria-pressed` en los toggles, `type="button"` y respetar `prefers-reduced-motion` para el pulso de "en_curso".
- **Título dinámico por rol**: `supervisor → "Mi Supervisión"`, `admin_clinical → "Mi Operación"`, `admin_platform → "Operación Clínica"`, default → "Mi Consulta"` (los labels de rol ya existen en `sidebar.component.ts`).
- **Auditoría**: la demo registra en `auditLogService` el cambio de estado de sesión y la resolución de crisis; Angular debería hacer lo mismo vía el módulo `auditoria-seguridad`.
- **Multi-rol**: los guards evalúan el conjunto `roles` (`hasRole`), no `activeRole`; el frontend ya usa lazy loading (`loadComponent`) — no requiere cambios.
- **Contrato de ruta**: la demo navega con query `/expedientes?id=patient-1`; Angular usa path param `/expedientes/:id` — mapear los CTA (Atender sesión, Redactar nota, Revisar borrador) a `/expedientes/{id}`.

## 5. Recomendaciones para demo-gap-implementation

Orden sugerido de implementación:

1. **GAP-MC-01** — corregir guard de la ruta (frontend, sin backend).
2. **GAP-MC-04 + GAP-MC-10** — endpoint staff de alertas de crisis (listar activas + resolver), habilitando "Requieren Atención Urgente" y los modales de crisis. Es la brecha de mayor valor clínico.
3. **GAP-MC-02** — extender `AccionDominante` con motivo y número de sesión para la ficha "Próxima Sesión".
4. **GAP-MC-09** — seed de citas de "hoy" para que Agenda del Día y Próxima Sesión tengan datos visibles.
5. **GAP-MC-05 / GAP-MC-06 / GAP-MC-08** — reutilizar supervisiones, sesiones-borrador y catálogo de sedes en el frontend.
6. **GAP-MC-03 / GAP-MC-07** — decidir alcance (simulación UI vs modelado backend; capacitación depende de Campus).
7. **Estructura hexagonal frontend** — el módulo `mi-consulta` debe seguir el patrón `ports/` + `adapters/` (`MiConsultaRepository` + `mi-consulta-http.adapter.ts` + `mi-consulta-localstorage.adapter.ts`), igual que `configuracion`.
8. **Fidelidad visual** — mapear clases inválidas de la demo a tokens `clinical.*` (ver §4.1).

> Nota: el módulo `configuracion` (que antes era "Mi Consulta" de configuración) ya está migrado y queda fuera del alcance de este reporte.
