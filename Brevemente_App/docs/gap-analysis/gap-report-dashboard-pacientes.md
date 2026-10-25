# GAP Analysis Report: Dashboard / Portal del Paciente (Pacientes)

- **Fecha**: 2026-10-19
- **Módulo**: `dashboard-pacientes` (portal del paciente + directorio de pacientes)
- **Estado**: AUDITADO — corregido tras 2ª auditoría de `jarvis-backend` / `jarvis-database` / `jarvis-frontend`
- **Fuentes Auditadas**:
  - **Demo React**: `brevemente_demo/src/App.tsx`, `pages/Patients.tsx`, `pages/PatientDashboard.tsx`, `pages/IntakeForm.tsx`, `components/CreatePatientModal.tsx`, `components/ConsentModal.tsx`, `types/clinical.ts`, `data/mockData.ts`
  - **Frontend Angular**: `Brevemente_App/frontend/src/app/modules/pacientes/`, `modules/dashboard/views/dashboard-patient-view/`, `core/types/clinical.types.ts`, `app.routes.ts`, `core/guards/permission.guard.ts`, `core/layout/sidebar/sidebar.component.ts`
  - **Backend**: `com.syborx.brevemente.paciente.*`, `auth.*`, `cita.*` y migraciones Flyway `V1`–`V16`

> **Premisa verificada**: en la demo, el "dashboard de paciente" que realmente se muestra es el **portal `/mi-historial`** (`PatientDashboard.tsx`). La ruta `/` redirige a `patient → /mi-historial` porque `hasPermission('patient','dashboard') === false`. La rama `userRole === 'patient'` de `Dashboard.tsx` (banner "Mi Portal de Terapia", próxima consulta, tareas, evolución SVG, LEVA) **no es alcanzable** en el flujo normal del paciente. Por tanto, la paridad debe medirse contra `PatientDashboard.tsx`, no contra `Dashboard.tsx`.

---

## 1. Inventario de Componentes Auditados

### 1.1 Demo React (referencia de paridad)
| Recurso | Descripción |
| :--- | :--- |
| `Patients.tsx` | Directorio: búsqueda (nombre/CURP/**teléfono/email**), tabla con **columna "Estatus de pago"**, botón "Crear Paciente", **contra-referencias** (`derivedReferrals`). |
| `CreatePatientModal.tsx` | **Wizard de alta en 3 pasos**: (1) identificación con parseo/autocompletado de CURP → fecha nacimiento + aviso de edad mínima; (2) representación legal (parentesco, docs de identificación/vínculo, otro progenitor informado); (3) confirmación. |
| `IntakeForm.tsx` | Flujo de registro/intake con `ConsentModal` (firma digital del consentimiento). |
| `Dashboard.tsx` (rama `patient`) | Dashboard estático (banner, próxima consulta, tareas, evolución SVG, LEVA, crisis). **Inalcanzable** para el patient (sin permiso `dashboard`). |
| `PatientDashboard.tsx` | **Portal real del paciente** (`/mi-historial`): encabezado con terapeuta/motivo, **Botón de Crisis con escalado**, contacto **WhatsApp** (asistente/terapeuta según `hasAssistant`), push de **contra-referencia aprobada**, aviso de **seguridad clínica**, aviso de **crisis atendida**, **Próximas Citas + Historial** con badges de asistencia (7 estados) y pago (pagada/pendiente/exenta), **prescripciones por sesión** (expand) + nota de seguimiento, footer solo-lectura. |
| `types/clinical.ts` (`Patient`) | Incluye `pendienteReconsentimiento`, `notificacionesRepresentanteRevocadas`, `sessionFrequency`, `capacidadConsentimiento`, `representante`. |

### 1.2 Frontend Angular
| Recurso | Estado |
| :--- | :--- |
| `modules/pacientes/` (component, port, adapters http/localstorage) | ✅ Directorio + CRUD (`listar`, `buscarPorId`, `crear`, `actualizar`) contra `/api/v1/pacientes`. Modal de alta **simple** (sin wizard, sin parseo CURP, sin representación legal documental). |
| `modules/dashboard/views/dashboard-patient-view/` | ✅ Réplica de la **rama `patient` de `Dashboard.tsx`** (banner, crisis modal, próxima consulta, tareas, evolución SVG, LEVA). **NO es el portal** `PatientDashboard.tsx`. Datos hardcodeados ("24 de Agosto de 2026", "Dr. Alejandro Silva"). |
| `core/types/clinical.types.ts` (`Patient`) | ✅ Tiene `pendienteReconsentimiento?` y `notificacionesRepresentanteRevocadas?` (opcionales), `sessionFrequency?`, `capacidadConsentimiento`, `representante`. |
| `app.routes.ts` | ✅ Rutas: `dashboard`, `pacientes`, `expedientes`, `agenda`, `asistente-leva`, `supervision`, `mi-consulta`. **No existe** `mi-historial`; demo usa `patient → /mi-historial`, Angular usa `patient → /mi-consulta`. ⚠️ Solo `dashboard` tiene `canActivate` de rol; el resto es accesible por URL directa. |
| `core/guards/permission.guard.ts` | ⚠️ Exige `DASHBOARD_LEER`; si no, `patient → /mi-consulta` (fallback **incorrecto**). |
| `core/layout/sidebar/sidebar.component.ts` | ⚠️ El rol `patient` solo ve **"Agenda"** (único ítem que lo incluye). |
| `core/layout/main-layout/main-layout.component.html` | ⚠️ Renderiza `<app-sidebar>`, `<app-risk-banner>`, `<app-leva-button>`, `<app-leva-drawer>` y el `<app-header>` (atajo "LEVA IA" en `header.component.html`, `toggleLeva()`) **sin condicionar por rol** → el patient vería risk-banner (staff) y LEVA (excluido en la demo). |

### 1.3 Backend (Spring Boot + PostgreSQL)
| Recurso | Estado |
| :--- | :--- |
| `PacienteRestController` | ✅ `GET /pacientes`, `GET /pacientes/{id}`, `POST /pacientes`, `PATCH /pacientes/{id}` (permisos `PACIENTES_LEER/CREAR/EDITAR`). |
| `PacienteResponseDTO` | ✅ 21 campos. **No incluye** `pendienteReconsentimiento` ni `notificacionesRepresentanteRevocadas`; `estado_consentimiento` **sí** se expone anidado en `capacidadConsentimiento.estado`. |
| `PacienteJpaEntity` / `SpringDataPacienteRepository` | ✅ Existen (módulo `paciente`). |
| Tabla `pacientes` | ✅ V1 (base) + V3 (demográficas, consentimiento, `terapeuta_id`) + V6 (`usuario_id`). |
| Tabla `citas` (V6) | ✅ Existe con `paciente_id`, estados de asistencia y pago. |
| Roles/Usuarios patient | ✅ `rol-006 patient` (V4); usuarios `usr-pac-001..004` con vínculo `pacientes.usuario_id` (V6). |
| Permisos del rol patient | ✅ **Sí tiene** `MIS_CITAS_LEER` (`perm-017`) asignado en **V6** (no en V5). Falta el permiso/navegación de portal. |
| Endpoint del portal del paciente | ⚠️ No existe ruta `/mis-citas`, pero `GET /citas` **ya es patient-scoped** (`MIS_CITAS_LEER` + filtro por `pacienteId` del claim). |
| Módulo `pago` (V8) | ✅ `GET /pagos?pacienteId=`, `POST`, `PATCH`, `DELETE` (`PAGOS_LEER`/`PAGOS_GESTIONAR`). Segunda fuente de pago con vocabulario **divergente**: `pagos.estado` = `pagado/pendiente/parcial/reembolsado` vs `citas.payment_status` = `pagada/pendiente/exenta`. |
| Módulo `dashboard` (`GET /dashboard/alertas`) | ✅ Alertas de centro de control para staff; **no** son alertas de riesgo del paciente. |
| Contra-referencias / alertas de paciente | ❌ **No existen** (ni tabla, ni entidad, ni endpoint). No hay nada que "adaptar" de supervisión. |
| `UsuarioAutenticado.pacienteId` | ✅ Existe (claim de identidad para el rol patient). |

---

## 2. Matriz de Reutilización (Adaptar vs Crear)

| Recurso Existente | Estrategia |
| :--- | :--- |
| Tabla `pacientes` + `citas` (V1/V3/V6) | **REUTILIZAR** para el portal del paciente (historial de citas propio). |
| `UsuarioAutenticado.pacienteId` | **REUTILIZAR** para resolver "citas del paciente autenticado". |
| Usuarios patient (`usr-pac-001..004`) + `rol-006` | **REUTILIZAR**; ya tiene `MIS_CITAS_LEER` (V6). Solo falta el permiso/navegación del portal. |
| `GET /citas` + `MIS_CITAS_LEER` | **REUTILIZAR** como fuente de citas del portal (ya patient-scoped). Alias opcional `/mis-citas`. |
| `MIS_CITAS_LEER` (frontend) | **REUTILIZAR**: ya está en `clinical.types.ts` (unión `Permission`) y en `VALID_PERMISSIONS` del login adapter. **No** crear un permiso nuevo. |
| `dashboard-patient-view` (Angular) | **CONSERVAR** como réplica de `Dashboard.tsx`; **NO** es el portal. El portal se crea como componente nuevo espejo de `PatientDashboard.tsx`. |
| `PacienteRestController` + DTO | **ADAPTAR** (añadir booleano derivado `pendienteReconsentimiento` desde `capacidadConsentimiento.estado`; `notificacionesRepresentanteRevocadas` no es del portal). |
| `pago` (V8) + `GET /pagos?pacienteId=` | **REUTILIZAR** y definir cuál fuente de pago es canónica + **mapeo de vocabulario** (`exenta` ↔ `pagado/parcial/reembolsado`). |
| `permission.guard.ts` | **CORREGIR** el fallback de patient. |
| `core/layout/main-layout/main-layout.component.ts` + `header.component.html` | **AJUSTAR**: el shell renderiza `<app-sidebar>`, `<app-risk-banner>`, `<app-leva-button>`, `<app-leva-drawer>` y el atajo "LEVA IA" del `<app-header>` sin condicionar por rol; role-gatear las cinco superficies para patient (fidelidad). No es `sidebar.component.ts`. |
| Demo `PatientDashboard.tsx` | **CREAR** equivalente Angular (`mi-historial` / portal). |
| Demo `CreatePatientModal.tsx` (wizard 3 pasos) | **CREAR** wizard Angular con validación CURP/edad/representación. |

---

## 3. Matriz de Brechas (GAPs)

> **Referente de paridad**: `PatientDashboard.tsx` (portal `/mi-historial`). Los gaps se listan en el orden visual del portal.

### 3.1 Brechas del portal del paciente (crítico para la premisa)

| ID | Tipo | Demo (`PatientDashboard.tsx`) | Angular actual | Acción Propuesta |
| :--- | :--- | :--- | :--- | :--- |
| **GAP-DP-01** | `[INCORRECT]` | Patient entra a `/mi-historial` (portal) y **no ve** sidebar, risk-banner ni LEVA (flotante ni atajo del header). | `permissionGuard` exige `DASHBOARD_LEER` (no lo tiene) y lo manda a `/mi-consulta`; **solo `dashboard` tiene guard**: `pacientes`, `expedientes`, `agenda`, `asistente-leva`, `supervision` y `mi-consulta` son accesibles por URL directa (fuga de alcance); `MainLayout` renderiza `<app-sidebar>`, `<app-risk-banner>`, `<app-leva-button>`, `<app-leva-drawer>` y el atajo "LEVA IA" del `<app-header>` sin condicionar por rol. | Ruta `mi-historial` guardada con `MIS_CITAS_LEER`; `patient → /mi-historial`; **blindar por rol todas las rutas hijas staff** (o guard a nivel `MainLayout`); **role-gatear `MainLayout` + `Header`** (ocultar sidebar, risk-banner y LEVA a patient). |
| **GAP-DP-02** | `[MISSING]` | Encabezado: "Hola {nombre}", terapeuta asignado, motivo. | `dashboard-patient-view` replica la rama estática de `Dashboard.tsx`, **no** el portal. Sin fuente backend: patient no tiene `PACIENTES_LEER`; `CitaResponseDTO` trae `terapeutaId` pero no el **nombre** del terapeuta ni el motivo. | Crear componente `patient-portal` espejo de `PatientDashboard.tsx` + endpoint de **perfil propio** (nombre, nombre del terapeuta, motivo) patient-scoped. |
| **GAP-DP-03** | `[MISSING]` | Botón de Crisis **escala** alerta + estado "Aviso enviado al equipo". | Modal de crisis estático (solo teléfonos). | Endpoint de escalado/notificación (hoy **sin contraparte backend**). |
| **GAP-DP-04** | `[MISSING]` | Contacto WhatsApp (asistente/terapeuta según `hasAssistant`), mensaje editable. | No existe. | `ContactModal` + enlace `wa.me`. |
| **GAP-DP-05** | `[MISSING]` | Push contra-referencia aprobada + aviso seguridad clínica + aviso crisis atendida. | No existe. | **Tablas nuevas** (contra-referencias, alertas de paciente) + endpoints. No adaptar supervisión. |
| **GAP-DP-06** | `[PARTIAL]` | Próximas Citas + Historial con badges de asistencia (7 estados) y pago (pagada/pendiente/exenta). | No existe en portal; pero `GET /citas` ya es patient-scoped. | **Reutilizar `GET /citas`** (alias `/mis-citas`) + extender `CitaResponseDTO` si faltan badges. |
| **GAP-DP-07** | `[MISSING]` | Prescripciones por sesión (expand/collapse) + nota de seguimiento. | No existe en portal; `sesiones` se liga a `expediente_id`, no a `citas` (sin join key determinista; `sesiones.fecha` DATE vs `citas.fecha_hora_inicio` TIMESTAMP). | Permiso `MIS_SESIONES_LEER` + filtro por claim + **definir mapeo**: añadir `cita_id` a `sesiones` (migración) o reutilizar `notas_evolucion.cita_id`. |
| **GAP-DP-08** | `[MISSING]` | Fecha es-MX, hora, duración, tipo (primera/seguimiento/cierre), footer solo-lectura. Empty-state solo en "Historial"; "Próximas Citas" se **oculta** si no hay citas. | No existe en portal. | Reutilizar `citas` + formatters es-MX + empty-state del historial + ocultar sección vacía de próximas. |
| **GAP-DP-09** | `[NAV]` | — | `rol-006` **ya tiene** `MIS_CITAS_LEER` (V6); solo falta la navegación/guard del portal (cubierto por GAP-DP-01). Nota de aclaración, no un déficit de datos. | Fusionable en GAP-DP-01; guard con `MIS_CITAS_LEER` (no crear permiso nuevo). |

### 3.2 Brechas de directorio y alta (secundarias para esta premisa)

| ID | Tipo | Descripción | Impacto |
| :--- | :--- | :--- | :--- |
| GAP-DP-10 | `[MISSING]` | Wizard de alta 3 pasos (CURP → edad, representación legal con documentos, consentimiento/firma). | Alto |
| GAP-DP-11 | `[MISSING]` | Columna "Estatus de pago" en directorio (`Patients.tsx`). Dos fuentes con vocabulario divergente: `citas.payment_status` {pagada/pendiente/exenta} vs `pagos.estado` {pagado/pendiente/parcial/reembolsado}. Falta mapeo. | Medio |
| GAP-DP-12 | `[MISSING]` | Contra-referencias (`derivedReferrals`) en directorio. Requiere **tabla nueva** `contra_referencias`. | Medio |
| GAP-DP-13 | `[PARTIAL]` | Búsqueda por teléfono/email (Angular solo nombre/CURP). | Bajo |
| GAP-DP-14 | `[PARTIAL]` | DTO sin `pendienteReconsentimiento` / `notificacionesRepresentanteRevocadas`. `estado_consentimiento` **sí se expone** (vía `capacidadConsentimiento.estado`), pero: (a) la columna **no tiene CHECK** canónico; (b) su vocabulario persistido (`PENDIENTE_FIRMA`, `FIRMADO_TITULAR`, `PENDIENTE_RECONSENTIMIENTO`…) **no coincide** con los `allowableValues` del DTO (`AUTONOMO`, `REPRESENTADO_POR_EDAD`, `REPRESENTADO_POR_CONDICION`, `PENDIENTE_DETERMINACION`); (c) falta el **booleano derivado** `pendienteReconsentimiento`. `notificacionesRepresentanteRevocadas` no aplica al portal. | Medio |

---

## 4. Recomendaciones para `demo-gap-implementation`

Orden secuencial para alcanzar paridad con `PatientDashboard.tsx` (el "dashboard de paciente" de la demo):

1. **Fase 1 — Desbloquear el portal (ruta + permisos)**:
   - **Reutilizar `MIS_CITAS_LEER`** (ya asignado a `rol-006` en V6 y ya en `VALID_PERMISSIONS` del login). **No crear** `PACIENTE_PORTAL_LEER`.
   - `app.routes.ts`: ruta `mi-historial` guardada con `MIS_CITAS_LEER`; `permission.guard.ts`: `patient → /mi-historial`.
   - **Blindar por rol todas las rutas hijas staff** (`pacientes`, `expedientes`, `agenda`, `asistente-leva`, `supervision`, `mi-consulta`) — hoy solo `dashboard` tiene guard — o añadir un guard de patient a nivel `MainLayout`.
   - Shell `MainLayout`: en la demo el patient **no ve** sidebar, ni `risk-banner`, ni LEVA (`leva` excluye a patient). Ajustar `MainLayoutComponent` y `HeaderComponent` para role-gatear `<app-sidebar>`, `<app-risk-banner>`, `<app-leva-button>`, `<app-leva-drawer>` y el atajo "LEVA IA" en patient, o documentar la desviación.
2. **Fase 2 — Backend del portal (datos reales)**:
   - **Reutilizar `GET /citas`** (ya patient-scoped vía `pacienteId` del claim). Alias opcional `/mis-citas`. Extender `CitaResponseDTO` si falta algún badge.
   - Prescripciones/sesión: permiso nuevo `MIS_SESIONES_LEER` + filtro por claim + **definir mapeo** (`cita_id` en `sesiones` vía migración, o reutilizar `notas_evolucion.cita_id`).
   - Contra-referencias y alertas de paciente: **tablas nuevas** (V17+) + endpoints; **no** adaptar supervisión.
   - Endpoint de **escalado/notificación** para el botón de Crisis (GAP-DP-03).
   - Definir `pago` (V8) como fuente canónica y **mapear vocabularios** (`pagada/exenta` de citas ↔ `pagado/parcial/reembolsado` de pagos).
   - Endpoint de **perfil propio** patient-scoped para el encabezado (nombre, terapeuta asignado, motivo) — GAP-DP-02.
   - **Anti-IDOR**: todo endpoint patient-scoped resuelve `pacienteId` desde `UsuarioAutenticado`, nunca de path/query; **denegar** si el rol es patient y `pacienteId` es `null`.
3. **Fase 3 — UI del portal (componente nuevo, NO reutilizar `dashboard-patient-view`)**:
   - Componente `patient-portal` espejo de `PatientDashboard.tsx`: encabezado, crisis con escalado, WhatsApp, badges de asistencia/pago, prescripciones expand, banners de alerta/contra-referencia/crisis resuelta, footer solo-lectura, empty-states.
   - Arquitectura hexagonal: puertos + adaptadores HTTP/LocalStorage + feature flag; señales + `@if`/`@for`.
   - A11y: `aria-expanded`, `aria-live` en banners, focus-ring en crisis, contraste AA en badges.
   - `dashboard-patient-view` se conserva como réplica de `Dashboard.tsx`; **no** es el portal.
4. **Fase 4 — Directorio y alta**:
   - Wizard de alta (CURP/edad/representación/consentimiento) + columna pago + contra-referencias + búsqueda ampliada.
   - DTO: añadir **booleano derivado** `pendienteReconsentimiento` a partir de `capacidadConsentimiento.estado` (ya expuesto); añadir **CHECK canónico** a `estado_consentimiento` y reconciliar su vocabulario con el DTO; `notificacionesRepresentanteRevocadas` no aplica al portal.
5. **Fase 5 — E2E**:
   - Spec Playwright `dashboard-pacientes.spec.ts`: login patient → `/mi-historial` → historial con badges → crisis → WhatsApp.
6. **Notas transversales de base de datos**:
   - Migraciones **idempotentes**: `INSERT ... ON CONFLICT DO NOTHING` (patrón V5/V6/V8/V13).
   - **CHECKs canónicos**: añadir CHECK a `pacientes.estado_consentimiento` y unificar/mapear el vocabulario de pago (`citas.payment_status` ↔ `pagos.estado`).
   - Tablas nuevas (`contra_referencias`, alertas de paciente) con DDL mínimo: PK, FK a `pacientes(id)`, CHECK de estado, índices.
