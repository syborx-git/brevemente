# GAP Analysis Report: Módulo Expedientes — FASE 3 (Escritura de dominios ya modelados — Bloque A)

- **Fecha**: 2026-10-08
- **Módulo**: `expediente-clinico` (Angular) — tabs `pagos`, `constancias`, `supervision` y modal de sesión
- **Estado**: AUDITADO (READ-ONLY) — Skill `demo-gap-analysis`
- **Alcance**: Bloque A de la Fase 3 = **escritura completa** de los dominios ya modelados en Fase 2 (pagos, constancias, bitácoras de supervisión) + captura VC/VG en la sesión + recordatorio de pago por WhatsApp. **No requiere migración Flyway ni backend nuevo.**
- **Rutas reales auditadas**:
  - Frontend: `Brevemente_App/frontend/src/app/modules/expediente-clinico/` (componente, puerto, adapters HTTP/localStorage) y `Brevemente_App/frontend/src/app/core/types/clinical.types.ts`
  - Backend: `Brevemente_App/backend/src/main/java/com/syborx/brevemente/` (paquetes `pago`, `constancia`, `supervision`, `expediente`)
  - BD: `Brevemente_App/backend/src/main/resources/db/migration/V8__introduce_expediente_fase2.sql` (ya aplicada, v8)
  - Demo React de referencia: `brevemente_demo/src/pages/ClinicalRecord.tsx`, `brevemente_demo/src/components/{SupervisionLogModal,RegisterPhysicalCertificateModal,PhysicalCertificateDetailModal}.tsx`

> **Contexto**: la Fase 2 entregó el backend completo de pagos, constancias, supervisión y auditoría (POST/PATCH/DELETE incluidos) y el port visual de 7 tabs + 5 sub-tabs. Sin embargo, las tabs `pagos`, `constancias` y `supervision` son **solo lectura** en Angular: no exponen los formularios de registro ni las acciones de mutación que el backend ya soporta. Este informe define exactamente **qué falta en el frontend** para cerrar el ciclo de escritura, con los contratos de los DTOs ya existentes.

---

## 1. Inventario de Componentes Auditados

### 1.1 Frontend Angular — estado real

| Capa | Archivo | Estado |
| :--- | :--- | :--- |
| Puerto | `ports/expediente.repository.ts` | 13 métodos: 9 de lectura + 4 de escritura (`actualizarExpediente`, `agregarSesion`, `firmarConsentimiento`, `crearSolicitud`). **Sin métodos de escritura** de pagos/constancias/bitácoras. |
| Adapter HTTP | `adapters/expediente-http.adapter.ts` | Implementa lecturas + `actualizarExpediente` (PATCH) + `agregarSesion` (POST) + `crearSolicitud` (POST) + `firmarConsentimiento` (POST). **Sin** POST/PATCH/DELETE de pagos, constancias o bitácoras. |
| Adapter mock | `adapters/expediente-localstorage.adapter.ts` | Lecturas de pagos/constancias/auditoría/bitácoras/solicitudes con stub vacío; las mutaciones de sesión (`agregarSesion`) y consentimiento (`firmarConsentimiento`) persisten en localStorage; `crearSolicitud` y `actualizarExpediente` son no-op/in-memory. **Sin** mutaciones de pagos/constancias/bitácoras. |
| Componente | `expediente-clinico.component.ts` | Estado `pagos`, `constancias`, `bitacoras`, `solicitudes`; getters `totalCobrado`/`totalPendiente`; métodos `guardarDx`, `guardarPsiquiatria`, `solicitarSupervision`, `guardarSesion`, `firmarConsentimiento`. **Sin** métodos de registro pago/constancia/bitácora ni captura VC/VG. |
| Vista | `expediente-clinico.component.html` | Tab Pagos = resumen + tabla (solo lectura). Tab Constancias = lista (solo lectura). Tab Supervisión = lista + botón "Solicitar Supervisión". Modal de sesión = 4 campos (protocolo, estratagema, prescripción, notas). |
| Tipos | `core/types/clinical.types.ts` | `Payment`, `PhysicalCertificateLog`, `SupervisionLog`, `Session` (con `valoracionCambio`/`valoracionGlobal`), `VcEntry`, `VgEntry` **ya existen y son simétricos** con los DTOs backend. |
| Permisos | `Permission` union | `PAGOS_GESTIONAR`, `CONSTANCIAS_EMITIR`, `SUPERVISION_REGISTRAR` **ya declarados**. |

### 1.2 Backend Spring Boot — estado real (todo listo para REUTILIZAR)

| Endpoint | Método | Permiso | Request DTO | Estado |
| :--- | :--- | :--- | :--- | :---: |
| `/pagos?pacienteId=` | GET | `PAGOS_LEER` | — | ✅ |
| `/pagos` | POST | `PAGOS_GESTIONAR` | `PagoCreateRequest` | ✅ |
| `/pagos/{pagoId}/estado` | PATCH | `PAGOS_GESTIONAR` | `PagoEstadoRequest` | ✅ |
| `/pagos/{pagoId}` | DELETE | `PAGOS_GESTIONAR` | — | ✅ |
| `/constancias?pacienteId=` | GET | `EXPEDIENTE_LEER` | — | ✅ |
| `/constancias` | POST | `CONSTANCIAS_EMITIR` | `ConstanciaFisicaCreateRequest` | ✅ |
| `/constancias/{constanciaId}` | DELETE (anular) | `CONSTANCIAS_EMITIR` | — | ✅ |
| `/supervision/bitacoras?pacienteId=` | GET | `SUPERVISION_LEER` | — | ✅ |
| `/supervision/bitacoras` | POST | `SUPERVISION_EVALUAR` \| `SUPERVISION_REGISTRAR` | `SupervisionLogCreateRequest` | ✅ |
| `/supervision/bitacoras/{bitacoraId}` | DELETE | `SUPERVISION_EVALUAR` \| `SUPERVISION_REGISTRAR` | — | ✅ |
| `/supervision/solicitudes?pacienteId=` | GET | `SUPERVISION_LEER` | — | ✅ |
| `/supervision/solicitudes` | POST | `EXPEDIENTE_ESCRIBIR` | `SupervisionSolicitudCreateRequest` | ✅ |
| `/supervision/solicitudes/{solicitudId}/atender` | PATCH | `SUPERVISION_EVALUAR` | — | ✅ (fuera de expediente) |
| `/expedientes/paciente/{pacienteId}/sesiones` | POST | `EXPEDIENTE_ESCRIBIR` | `SesionCreateRequest` (con `valoracionCambio`/`valoracionGlobal`) | ✅ |

### 1.3 Migración Flyway

`V8__introduce_expediente_fase2.sql` (ya aplicada) creó `pagos`, `constancias_fisicas`, `supervision_bitacoras`, `supervision_solicitudes` con sus CHECKs, FK indexes y **seed** (`pay-001`, `con-fis-001`, `sup-001`). **No se requiere V9 para el Bloque A.**

---

## 2. Matriz de Reutilización de Código Existente (ADAPTAR VS CREAR)

| Componente | Estado Actual | Estrategia SDOP |
| :--- | :--- | :--- |
| `PagoRestController` (POST/PATCH/DELETE) | ✅ endpoints listos | **REUTILIZAR tal cual**; solo añadir llamadas HTTP en el adapter |
| `ConstanciaRestController` (POST/DELETE) | ✅ endpoints listos | **REUTILIZAR tal cual** |
| `SupervisionRestController` (POST/DELETE bitácoras) | ✅ endpoints listos | **REUTILIZAR tal cual** |
| `SesionCreateRequest` (VC/VG) | ✅ soporta `VcEntry`/`VgEntry` | **REUTILIZAR**; ampliar el modal de sesión para enviarlos |
| Tipos TS (`Payment`, `PhysicalCertificateLog`, `SupervisionLog`, `VcEntry`, `VgEntry`) | ✅ simétricos con los DTOs | **REUTILIZAR tal cual** (los DTOs fueron diseñados simétricos) |
| Modales demo (`SupervisionLogModal`, `RegisterPhysicalCertificateModal`, `PhysicalCertificateDetailModal`) | React | **PORTAR** al HTML/SCSS Angular con las clases Tailwind de la demo |
| `RoleStateService` (Angular) | estado de rol/permisos | **REUTILIZAR** para `*ngIf` de botones según permisos |
| `PagoRestMapper` / `ConstanciaFisicaRestMapper` / `SupervisionRestMapper` | ✅ mappers backend | **Sin cambios** |

---

## 3. Matriz de Brechas (GAPs) Identificadas

| ID | Tipo | Descripción de la Brecha | Impacto | Acción Propuesta |
| :--- | :--- | :--- | :--- | :--- |
| GAP-EXP3-01 | **MISSING** | Puerto + adapter sin métodos de escritura de pagos (`registrarPago`, `cambiarEstadoPago`, `eliminarPago`). El backend ya expone `POST/PATCH/DELETE /pagos`. | **Alto** | Añadir 3 métodos al `ExpedienteRepository` + implementar en `ExpedienteHttpAdapter` (y stub en localstorage). |
| GAP-EXP3-02 | **MISSING** | Tab Pagos: sin modal de registro, sin acciones de cambio de estado/eliminación y sin recordatorio de pago por WhatsApp (`wa.me`). | **Alto** | Portar modal de pago + acciones por fila + botón de recordatorio; gatillar según `PAGOS_GESTIONAR`. |
| GAP-EXP3-03 | **MISSING** | Puerto + adapter sin métodos de escritura de constancias (`registrarConstancia`, `anularConstancia`). Backend listo (`POST/DELETE /constancias`). | **Alto** | Añadir 2 métodos al puerto + adapter. |
| GAP-EXP3-04 | **MISSING** | Tab Constancias: sin modal de registro, sin anular y sin detalle. | **Alto** | Portar `RegisterPhysicalCertificateModal` (+ detalle) y botón anular según `CONSTANCIAS_EMITIR`. |
| GAP-EXP3-05 | **MISSING** | Puerto + adapter sin métodos de escritura de bitácoras (`registrarBitacora`, `eliminarBitacora`). Backend listo (`POST/DELETE /supervision/bitacoras`). | **Alto** | Añadir 2 métodos al puerto + adapter. |
| GAP-EXP3-06 | **MISSING** | Tab Supervisión: sin modal de bitácora (18 campos) y sin eliminar. | **Alto** | Portar `SupervisionLogModal` + botón eliminar según `SUPERVISION_EVALUAR`/`SUPERVISION_REGISTRAR`. |
| GAP-EXP3-07 | **PARTIAL** | Modal "Registrar Sesión TBE" no captura VC/VG ni campos clínicos (trastorno, cumplimiento, `audioDuration`); el backend `SesionCreateRequest` ya los soporta. Además, el campo "Estratagema Asignada" (`newSessionEstratagema`) se captura pero `guardarSesion()` nunca lo envía (UI muerta: no existe `estratagema` ni en TS ni en el DTO). | **Medio** | Ampliar el modal con captura VC (6 criterios) + VG (3 esferas) y enviarlos en `agregarSesion`; eliminar `newSessionEstratagema` o persistirlo si se añade al contrato. |
| GAP-EXP3-08 | **CONTRACT** | Recordatorio WhatsApp: la regla demo `therapistService.canManagePayments(role)` no existe en Angular (la demo lo muestra siempre, comentario `TODAVÍA NO CONECTADA`). | **Bajo** | Frontend-only; mostrar según `PAGOS_GESTIONAR` o replicar "siempre visible" de la demo. |
| GAP-EXP3-09 | **SCOPE** | Atender solicitud (`PATCH /solicitudes/{id}/atender`) pertenece al módulo `supervision` (rol evaluador), no al expediente. | **Nulo** | Fuera del alcance de expediente; se gestiona en `modules/supervision`. |
| GAP-EXP3-10 | **PARTIAL** | UX: sin estados de carga ni manejo de errores; el adapter traga errores (`catchError → of([])/of(null)`) y las mutaciones no tienen `catchError` ni notificación de fallo. | **Medio** | Añadir indicadores de carga y toast/alert de error en las mutaciones del Bloque A. |
| GAP-EXP3-11 | **PARTIAL** | Accesibilidad: los modales no declaran `role="dialog"`, `aria-modal`, focus trap ni cierre por `Esc`. | **Bajo** | Aplicar atributos ARIA, focus trap y cierre por teclado en los modales nuevos. |

---

## 4. Contratos de escritura exactos (para codificar a la primera)

> Todos los DTOs backend ya existen y son simétricos con los tipos TS. Los cuerpos de petición son los tipos TS **menos** los campos que el servidor deriva.
>
> **Validación**: los DTOs de request están anotados con `@Valid` pero **no** tienen constraints Bean Validation. La validación de negocio en la capa application cubre: `PagoApplicationService` (concepto obligatorio y monto ≥ 0 en `registrar`; estado ∈ {pagado, pendiente, parcial, reembolsado} solo en `cambiarEstado`) y `SesionApplicationService` (número de sesión ≥ 1). El resto lo garantizan los CHECK de BD (violarlos produce HTTP 500). Las fechas deben llegar en `YYYY-MM-DD` o se produce HTTP 500.

### 4.1 Registrar pago — `POST /pagos` (`PAGOS_GESTIONAR`)
```typescript
// body = PagoCreateRequest
{
  patientId, appointmentId?, concept, amount: number,
  date: 'YYYY-MM-DD', method: 'efectivo'|'transferencia'|'tarjeta'|'otro',
  status: 'pagado'|'pendiente'|'parcial'|'reembolsado', notes?
}
// ← Payment menos id, patientName, registeredBy, createdAt
```
- Registrar → **201 Created** (devuelve `PagoResponseDTO`).
- Cambiar estado: `PATCH /pagos/{pagoId}/estado` → **200** con body `{ estado }`.
- Eliminar: `DELETE /pagos/{pagoId}` → **204** (borrado físico).

### 4.2 Registrar constancia — `POST /constancias` (`CONSTANCIAS_EMITIR`)
```typescript
// body = ConstanciaFisicaCreateRequest
{
  patientId, physicalFolio, issueDate, type: PhysicalCertificateType,
  issuerName, issuerLicense, recipient, purpose, periodCovered,
  sessionsCount, clinicalSummary, digitalScanUrl?, scanFileName?, deliveredTo
}
// ← PhysicalCertificateLog menos id, patientName, status, registeredBy, registeredAt
```
- Registrar → **201 Created** (devuelve `ConstanciaFisicaResponseDTO`).
- Anular: `DELETE /constancias/{constanciaId}` → **204** (anulación **lógica**: `estado='anulada'`, no borrado físico).
- ⚠️ `physicalFolio` está sujeto al índice único `ux_constancias_folio`: un folio duplicado provoca error 500 del backend. El modal debe validar/mapear ese error.

### 4.3 Registrar bitácora — `POST /supervision/bitacoras` (`SUPERVISION_EVALUAR`|`SUPERVISION_REGISTRAR`)
```typescript
// body = SupervisionLogCreateRequest
{
  patientId, therapistId, date, sessionNumber,
  supervisorName, supervisorLicense, problemDefinition, currentSituation,
  spr, ts, therapistProblem, rst, px, eff, doubt, blocking,
  observations, recommendations
}
// ← SupervisionLog menos id, patientName, therapistName
```
- Registrar → **201 Created** (devuelve `SupervisionLogResponseDTO`).
- ⚠️ `therapistId` es **semánticamente requerido** (`SupervisionLogCreateRequest.therapistId`): el backend **no** lo deriva del principal (`registrarBitacora` no recibe `@AuthenticationPrincipal`) y la columna es nullable (sin validación de servidor). El frontend debe pre-rellenarlo desde `user.terapeutaIds[0]` o el terapeuta del paciente, pero **enviarlo en el body** (si llega `null`, la bitácora queda invisible para el terapeuta no-evaluador).
- Eliminar: `DELETE /supervision/bitacoras/{bitacoraId}` → **204** (borrado físico).

### 4.4 Sesión con VC/VG — `POST /expedientes/paciente/{pacienteId}/sesiones` (`EXPEDIENTE_ESCRIBIR`)
```typescript
// SesionCreateRequest ya acepta:
valoracionCambio?: VcEntry   // { sessionNum, percepcion, pensamientos, sensaciones, reacciones, sintomas, crisis }
valoracionGlobal?: VgEntry   // { sessionNum, yo: boolean, demas: boolean, mundo: boolean }
```
- Registrar → **201 Created** (devuelve `SesionResponseDTO`).
- ⚠️ `agregarSesion` usa `Omit<Session,'id'>`, que incluye `patientId` y `status`; `SesionCreateRequest` **no** los declara (los deriva de la ruta y el servidor). Excluir `patientId`/`status` del payload.

### 4.5 Crear solicitud de supervisión — `POST /supervision/solicitudes` (`EXPEDIENTE_ESCRIBIR`)
```typescript
// body = SupervisionSolicitudCreateRequest → OJO: usa `pacienteId` (no `patientId`)
{ pacienteId: string, reason: string }
```
- Registrar → **201 Created** (devuelve `SupervisionSolicitudResponseDTO`).
- Atender: `PATCH /supervision/solicitudes/{solicitudId}/atender` → **200** (`SUPERVISION_EVALUAR`), fuera del alcance del expediente.

---

## 5. Recomendaciones para demo-gap-implementation

Orden secuencial (frontend-only, sin tocar backend ni BD):

1. **Extender el puerto** `ExpedienteRepository` con 7 métodos: `registrarPago`, `cambiarEstadoPago`, `eliminarPago`, `registrarConstancia`, `anularConstancia`, `registrarBitacora`, `eliminarBitacora`.
2. **Implementar el adapter HTTP** `ExpedienteHttpAdapter` con los contratos §4 (y stubs no-op en `expediente-localstorage.adapter.ts`).
3. **Ampliar el componente** con estado local de formularios y métodos `registrarPago`, `cambiarEstadoPago`, `eliminarPago`, `enviarRecordatorioPago`, `registrarConstancia`, `anularConstancia`, `registrarBitacora`, `eliminarBitacora` + refresco tras cada mutación (`cargarDatos()`).
4. **Portar los modales** (`SupervisionLogModal`, `RegisterPhysicalCertificateModal`, `PhysicalCertificateDetailModal`) y el modal de pago con las clases Tailwind de la demo **tal cual** (regla del calendario). Preservar el checkbox `hasPhysicalProof` (UI-only) de la constancia y sustituir los iconos `lucide-react` por SVG inline.
5. **Ampliar el modal de sesión** con captura VC/VG (escala VC: Marcador de inicio=1 … Nuevo patrón=4.5) y enviarlos en `guardarSesion()`.
6. **Gate de permisos** en `*ngIf` de los botones usando `RoleStateService` (`PAGOS_GESTIONAR`, `CONSTANCIAS_EMITIR`, `SUPERVISION_REGISTRAR`/`SUPERVISION_EVALUAR`).
7. **E2E**: ampliar `tests/e2e/expediente.spec.ts` con flujos de mutación (registrar pago/constancia/bitácora + cambiar estado + anular + VC/VG en sesión), manteniendo monitoreo de consola y HTTP 500; incluir un caso de folio de constancia duplicado para validar el manejo del 500.
8. **Regresión visual**: regenerar baselines de los tabs afectados con `--update-snapshots`.
9. **UX/errores y accesibilidad** (GAP-EXP3-10/11): manejar errores de red de las mutaciones (hoy sin `catchError`) con toast/alert; añadir `role="dialog"`, `aria-modal`, focus trap y cierre por `Esc` a todos los modales nuevos.

> **Fuera de alcance (Bloque B/C)**: contra-referencia, circuito de riesgo (`crisisHistory`), reconsentimiento autónomo y motor de protocolos — documentados en `gap-report-expedientes_Fase2.md` §4.7 y diferidos.
