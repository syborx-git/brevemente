# GAP Analysis Report: Módulo Expedientes — FASE 2 (Dominios clínicos complementarios)

- **Fecha**: 2026-10-07
- **Módulo**: `expediente-clinico` (Angular) / dominio `expediente` + nuevos dominios `pago`, `supervision`, `constancia`, `auditoria`
- **Estado**: AUDITADO (READ-ONLY) — Skill `demo-gap-analysis`
- **Alcance**: port COMPLETO de la demo React `ClinicalRecord.tsx` (8 tabs + 5 sub-tabs) con respaldo real en backend + PostgreSQL
- **Rutas reales auditadas**:
  - Frontend: `Brevemente_App/frontend/src/app/modules/expediente-clinico/` (ruta `/expediente/:id`) y `Brevemente_App/frontend/src/app/core/types/clinical.types.ts`
  - Backend: `Brevemente_App/backend/src/main/java/com/syborx/brevemente/` (paquetes `auth`, `cita`, `config`, `expediente`, `paciente`)
  - BD: `Brevemente_App/backend/src/main/resources/db/migration/` (V1…V7)
  - Demo React de referencia: `brevemente_demo/src/pages/ClinicalRecord.tsx`, `brevemente_demo/src/types/clinical.ts`, `brevemente_demo/src/services/`

> **Contexto**: la Fase 1 ya entregó el núcleo del expediente (paciente, expediente DX, sesiones, consentimiento) con backend real. El port del frontend Angular ya tiene la estructura de 7 tabs + 5 sub-tabs, pero los tabs `psiquiatria`, `pagos`, `auditoria`, `supervision`, `constancias` y los sub-tabs `vc`/`vg`/`rst` son placeholders. Este informe define **qué backend y BD se necesitan** para desbloquearlos, con precisión de codificación "a la primera".

---

## 1. Inventario de Componentes Auditados

### 1.1 Demo React — modelos de datos de los dominios Fase 2 (fuente de verdad)

Extraídos de `brevemente_demo/src/types/clinical.ts` y `brevemente_demo/src/services/*.ts`. Todos los servicios de la demo son **localStorage** (no hay backend en la demo).

| Dominio | Tipo TS | Persistencia demo | Servicio demo |
| :--- | :--- | :--- | :--- |
| Psiquiatría | campos en `ClinicalRecord` + `drugsList[]` | `recordService.saveByPatientId` | `recordService.ts` |
| Pagos | `Payment` | `brevemente_payments` | `paymentService.ts` |
| Auditoría | `AuditLog` | `brevemente_audit_logs` | `auditLogService.ts` |
| Supervisión (bitácora) | `SupervisionLog` | `brevemente_supervision_logs` | `supervisionLogService.ts` |
| Supervisión (solicitud) | `SupervisionRequest` | `brevemente_supervision_requests` | `supervisionRequestService.ts` |
| Constancias | `PhysicalCertificateLog` | `brevemente_physical_certificates` | `physicalCertificateService.ts` |
| Contra-referencia | `CounterReferral` | `brevemente_counter_referrals` | `counterReferralService.ts` |
| VC / VG | estado local del componente (`vcHistory`, `vgHistory`) | **no persisten** (solo en memoria) | — (inline en `ClinicalRecord.tsx`) |
| Crisis | `CrisisIncident[]` en `ClinicalRecord` | `recordService` | cross-module (MiConsulta) |

### 1.2 Backend Spring Boot — estado real (auditado)

Controllers `@RestController` existentes en todo el backend:

| Endpoint | Clase | Estado |
| :--- | :--- | :--- |
| `/auth` | `AuthController` | ✅ |
| `/pacientes` | `PacienteRestController` | ✅ |
| `/citas` | `CitaRestController` | ✅ |
| `/dias-no-laborables` | `DiaNoLaborableRestController` | ✅ |
| `/expedientes` | `ExpedienteRestController` (solo GET expediente + GET/POST sesiones) | ✅ parcial |
| `/pacientes/{id}/consentimiento/firmar` | `ConsentimientoRestController` | ✅ |

**No existe** ningún controller/entity/service para: pagos, psiquiatría, auditoría clínica, supervisión, constancias ni contra-referencia.

### 1.3 Migraciones Flyway — estado real (auditado)

| Migración | Contenido relevante para Fase 2 |
| :--- | :--- |
| `V1__init_schema.sql` | `auditoria_accesos` (solo **acceso/login**, con `usuario_id`, `recurso_accedido`, `accion`, `detalles JSONB`, `created_at`) |
| `V5__introduce_permissions_and_token_security.sql` | Permisos **ya existentes**: `SUPERVISION_LEER` (perm-009), `SUPERVISION_EVALUAR` (perm-010). **Asignados solo a** `supervisor` (rol-005), `admin_clinical` (rol-002, solo LEER) y `admin_platform` (rol-001). ⚠️ El `therapist` (rol-003) **no** los tiene. |
| `V6__introduce_citas_schema.sql` | `citas.payment_status` (`pagada|pendiente|exenta`, CHECK `ck_citas_payment`). **Además siembra `perm-017`=`MIS_CITAS_LEER` y `perm-018`=`AGENDA_LEER`** (sección 4.4). |
| `V7__introduce_expediente_extension.sql` | `expedientes_clinicos` gana `valoracion_cambio_inicial` y `valoracion_global_inicial` (TEXT, **solo marcador inicial**); tabla `sesiones` (px JSONB, `adherencia`, `f1`, `f2`, `rss`, `eff`, `oss`, `situacion`, `status`, UNIQUE(expediente_id,numero)) |

**Conclusión de inventario**: para Fase 2 **no hay nada** de backend/BD salvo (a) permisos de supervisión, (b) `citas.payment_status` (flag por cita, no ledger), (c) los dos marcadores iniciales de VC/VG, y (d) `sesiones.f1/f2` que ya soportan el sub-tab RST.

---

## 2. Matriz de Reutilización de Código Existente (ADAPTAR VS CREAR)

| Componente | Estado Actual | Estrategia SDOP |
| :--- | :--- | :--- |
| Módulo `expediente` (hexagonal completo Fase 1) | `Expediente`, `Sesion`, `Consentimiento`, adapters, controllers, advice | **REUTILIZAR como plantilla** para los nuevos módulos |
| `ExpedienteRestController` | GET expediente + GET/POST sesiones | **ADAPTAR**: añadir `PATCH /expedientes/paciente/{pacienteId}`; requiere `ActualizarExpedienteUseCase` + `save` en `ExpedienteRepositoryPort` + `toJpaEntity` en el mapper (hoy solo existen `findByPacienteId` y `toDomain`) |
| `SesionJpaEntity` / `sesiones` (V7) | px JSONB, f1, f2, rss, eff, oss, situacion | **ADAPTAR**: añadir `valoracion_cambio JSONB` y `valoracion_global JSONB` (VC/VG por sesión) |
| `f1`/`f2` de `sesiones` | ya persistidos | **REUTILIZAR tal cual** → el sub-tab RST es 100% derivado, sin backend nuevo |
| Permisos `SUPERVISION_LEER`/`SUPERVISION_EVALUAR` (V5) | existen; asignados a `supervisor`, `admin_clinical`, `admin_platform` (el `therapist` **no**) | **REUTILIZAR**; **ADAPTAR** asignando `SUPERVISION_LEER` a rol-003 (ver §7.3) |
| Frontend módulo `supervision` (Angular) | ports + adapters + componente; adapter HTTP → `/api/v1/supervision`; flag `supervisionBackend: false` | **ADAPTAR**: alinear con el controller nuevo y activar flag |
| Tipos Angular `Payment` y `SupervisionLog` | ya existen en `clinical.types.ts` (idénticos a la demo) | **REUTILIZAR** |
| `AuditoriaAccesoPort` / `auditoria_accesos` (auth) | auditoría de login/refresh/logout | **NO REUTILIZAR para clínica**: crear `auditoria_expediente` (semántica distinta) |
| `Cita.paymentStatus` / `citas.payment_status` | flag por cita `pagada|pendiente|exenta` | **MANTENER separado** del ledger `pagos` (vocabulario distinto, ver §5) |

---

## 3. Matriz de Brechas (GAPs) Identificadas

| ID | Tipo | Descripción de la Brecha | Impacto | Acción Propuesta |
| :--- | :--- | :--- | :--- | :--- |
| GAP-EXP2-01 | **MISSING** | Psiquiatría: `expedientes_clinicos` no tiene `dx_nosologico`, `dsm5`, `cie11`, `comorbilidad`, `diagnostico_diferencial`, `plan_tratamiento`, `pronostico`, `factores_favorables`, `factores_desfavorables`, `uso_farmacos` ni esquema farmacológico (`drugsList`). | **Alto** | V8: 10 columnas + `esquema_farmacologico JSONB` en `expedientes_clinicos`; extender `ExpedienteResponseDTO`. |
| GAP-EXP2-02 | **MISSING** | Pagos: no existe tabla `pagos` ni controller; la demo gestiona CRUD completo (crear, cambiar estado, eliminar, recordatorio WhatsApp). | **Alto** | V8: tabla `pagos` + módulo hexagonal `pago`. |
| GAP-EXP2-03 | **MISSING** | Auditoría clínica: `auditoria_accesos` es solo de acceso/auth; no hay bitácora de eventos clínicos por expediente. | **Alto** | V8: tabla `auditoria_expediente` + servicio transversal de escritura + GET por paciente. |
| GAP-EXP2-04 | **MISSING** | Supervisión (bitácoras): sin tabla/controller. El frontend Angular ya tiene módulo `supervision` con adapter HTTP a `/api/v1/supervision` (flag `false`). | **Alto** | V8: tabla `supervision_bitacoras` + módulo `supervision` backend. |
| GAP-EXP2-05 | **MISSING** | Supervisión (solicitudes): `SupervisionRequest` sin tabla/controller. | **Medio** | V8: tabla `supervision_solicitudes` + endpoints (crear/atender). |
| GAP-EXP2-06 | **MISSING** | Constancias físicas: `PhysicalCertificateLog` sin tabla/controller. | **Alto** | V8: tabla `constancias_fisicas` + módulo `constancia`. |
| GAP-EXP2-07 | **MISSING** | VC por sesión: solo existe `valoracion_cambio_inicial` (marcador). No hay historial por sesión. | **Alto** | V8: `sesiones.valoracion_cambio JSONB`. |
| GAP-EXP2-08 | **MISSING** | VG por sesión: solo existe `valoracion_global_inicial` (marcador). No hay historial por sesión. | **Alto** | V8: `sesiones.valoracion_global JSONB`. |
| GAP-EXP2-09 | **SCOPE** | RST: el sub-tab `rst` de la demo solo itera `sessions` y muestra `f1`/`f2`. **No requiere backend nuevo**. | **Nulo** | Portar la vista derivada de `sesiones` (ya en Fase 1). Sin acción backend. |
| GAP-EXP2-10 | **DATA** | Semilla: no hay datos de psiquiatría, pagos, supervisión, constancias ni VC/VG por sesión; el mock usa ids/nombres de la demo (`patient-1` "Sofía Martínez") que **no deben** replicarse. | **Medio** | V8 seed sobre `pac-001…pac-004` con textos clínicos de la demo adaptados. |
| GAP-EXP2-11 | **CONTRACT** | Vocabulario de pagos divergente: `citas.payment_status` = `pagada|pendiente|exenta` vs `pagos.status` = `pagado|pendiente|parcial|reembolsado`. | **Medio** | Mantener como conceptos distintos (flag de cita ≠ ledger); documentar en §5. |
| GAP-EXP2-12 | **SCOPE** | Contra-referencia, `crisisHistory` y reconsentimiento autónomo al cumplir 18 años. | **Medio** | **Diferidos** (fase futura, decisión 2026-10-07). Modelos documentados en §4.7 para no perderlos. |
| GAP-EXP2-13 | **MISSING** | Tipos frontend: `PhysicalCertificateLog`, `SupervisionRequest`, `CounterReferral`, `CrisisIncident`, `AuditLog`, y entradas `VcEntry`/`VgEntry` **no existen** en `clinical.types.ts`. | **Medio** | Añadirlos a `clinical.types.ts` (copiar de la demo, adaptando `role` a la unión de roles Angular). |
| GAP-EXP2-14 | **MISSING** | Permisos: no existen `PAGOS_*` ni `CONSTANCIAS_*` en V5. | **Medio** | V8: sembrar `PAGOS_LEER`, `PAGOS_GESTIONAR`, `CONSTANCIAS_EMITIR` (ver §7.3). |
| GAP-EXP2-15 | **MISSING** | No existe endpoint de actualización del expediente; la demo guarda DX (`handleSaveDx`) y psiquiatría (`handleSavePsychiatry`) vía `recordService.saveByPatientId`. | **Alto** | Añadir `PATCH /expedientes/paciente/{id}` con `ExpedienteUpdateRequest` (DX + psiquiatría). |

---

## 4. Demo React — modelos de datos exactos (para codificar a la primera)

### 4.1 `Payment` (tab Pagos)
```typescript
interface Payment {
  id: string;
  patientId: string;
  patientName: string;
  appointmentId?: string;          // cita asociada (opcional)
  concept: string;                 // "Sesión 3 · Seguimiento"
  amount: number;                  // MXN
  date: string;                    // YYYY-MM-DD
  method: 'efectivo' | 'transferencia' | 'tarjeta' | 'otro';
  status: 'pagado' | 'pendiente' | 'parcial' | 'reembolsado';
  notes?: string;
  registeredBy: string;            // nombre del asistente/terapeuta
  createdAt: string;               // ISO
}
```
Operaciones demo: `addPayment`, `updatePaymentStatus(id, status)`, `deletePayment(id)`, recordatorio WhatsApp (`wa.me`) para `pendiente|parcial`.

### 4.2 `AuditLog` (tab Auditoría)
```typescript
interface AuditLog {
  id: string;
  timestamp: string;               // ISO
  userId: string;
  userName: string;
  role: Role;
  action: string;                  // "Acceso a expediente", "Edición de sesión"…
  details: string;
  category: 'expediente' | 'sesion' | 'ia' | 'reporte' | 'seguridad' | 'riesgo' | 'pagos';
}
```
El tab muestra `patientLogs` = logs cuyo `details` incluye el nombre del paciente (filtro de la demo). **Nota de diseño**: en backend debe persistirse `paciente_id` explícito (no filtrar por substring).

### 4.3 `SupervisionLog` (tab Bitácoras de Supervisión)
```typescript
interface SupervisionLog {
  id: string;
  date: string;                    // YYYY-MM-DD
  supervisorName: string;
  supervisorLicense: string;       // CED-…
  patientId: string;
  patientName: string;
  therapistId: string;
  therapistName: string;
  sessionNumber: number;
  problemDefinition: string;
  currentSituation: string;
  spr: string;                     // "SPR Fóbico"
  ts: string;                      // Trastorno Estratégico
  therapistProblem: string;
  rst: string;                     // Reestructuración
  px: string;                      // Prescripciones (string, NO array)
  eff: string;                     // Efecto
  doubt: string;                   // Duda clínica
  blocking: string;                // Bloqueo identificado
  observations: string;
  recommendations: string;
}
```
> ℹ️ El tipo `SupervisionLog` **ya existe idéntico** en el frontend Angular (`clinical.types.ts`). Operaciones demo: `addLog`, `deleteLog`.

### 4.4 `SupervisionRequest` (botón "Solicitar Supervisión")
```typescript
interface SupervisionRequest {
  id: string;
  patientId: string;
  patientName: string;
  therapistId: string;
  therapistName: string;
  reason: string;
  status: 'pendiente' | 'atendida';
  createdAt: string;
  attendedBy?: string;
  attendedAt?: string;
}
```
Operaciones demo: `createRequest`, `attendRequest`.

### 4.5 `PhysicalCertificateLog` (tab Constancias)
```typescript
type PhysicalCertificateType = 'psicoterapeutica' | 'psiquiatrica' | 'asistencia' | 'informe_pericial' | 'justificante';

interface PhysicalCertificateLog {
  id: string;
  patientId: string;
  patientName: string;
  physicalFolio: string;           // "CONST-2026-084-FIS"
  issueDate: string;               // YYYY-MM-DD
  type: PhysicalCertificateType;
  issuerName: string;
  issuerLicense: string;           // cédula profesional
  recipient: string;               // destinatario
  purpose: string;
  periodCovered: string;
  sessionsCount: number;
  clinicalSummary: string;
  digitalScanUrl?: string;
  scanFileName?: string;
  deliveredTo: string;
  status: 'entregada_en_fisico' | 'anulada';
  registeredBy: string;
  registeredAt: string;            // ISO
}
```
> ℹ️ El tipo `Certificate` (constancia PDF digital) **no** pertenece a este tab: el tab es solo el **registro en físico** (NOM-004-SSA3-2012). No portar generación de PDF.
Operaciones demo: `addCertificateRecord`, `deleteCertificateRecord`.

### 4.6 VC / VG (sub-tabs Valoración del Cambio / Global)
```typescript
type VcEntry = {
  sessionNum: number;
  percepcion: string;    // enum VC (ver §5)
  pensamientos: string;
  sensaciones: string;
  reacciones: string;
  sintomas: string;
  crisis: string;
};

type VgEntry = {
  sessionNum: number;
  yo: boolean;            // esfera señalada
  demas: boolean;
  mundo: boolean;
};
```
- **Captura**: en el formulario de sesión (`newVc*`, `newVg*`), se guardan **junto con la sesión** (misma operación).
- **Visualización**: `vc` (LineChart 6 series) y `vg` (BarChart 3 series) usando `recharts`; en Angular se sustituye por una librería equivalente o un render SVG simple (decisión SDD).
- Escala numérica VC (demo): Marcador de inicio=1, Sin cambios=2, Mejoría leve=3, Mejoría significativa=4, Nuevo patrón=4.5, Empeoramiento/Recaída=0.

### 4.7 Diferidos (modelos documentados, sin implementar)
```typescript
interface CounterReferral {           // tab Contra-referencia (fase futura)
  id; patientId; patientName;
  fromTherapistId; fromTherapistName; toTherapistId; toTherapistName;
  reason: string; clinicalSummary?: string;
  status: 'solicitada' | 'aceptada' | 'rechazada';
  createdAt; resolvedAt?; resolvedBy?;
}
// ClinicalRecord.crisisHistory: CrisisIncident[] (sección "Historial de Contingencia")
// Reconsentimiento autónomo: pacientes.pendienteReconsentimiento + notificacionesRepresentanteRevocadas
```
`canCreateCounterReferral(role)` = `therapist|admin_clinical|admin_platform|supervisor`.

### 4.8 Psiquiatría — campos en `ClinicalRecord` (extensión del expediente)
```typescript
dxNosologico?: string;               // "Trastorno de Pánico [F41.0]"
dsm5?: string;                       // "300.01 Trastorno de Pánico"
cie11?: string;                      // "6B01 Trastorno de Pánico"
comorbilidad?: string;
differentialDx?: string;
treatmentPlan?: string;
prognosis?: 'excelente' | 'bueno' | 'reservado' | 'malo';
favorableFactors?: string;
unfavorableFactors?: string;
drugsUsage?: string;                 // 'SI' | 'NO' | especificar
drugsList?: Array<{
  id: string; name: string;
  doseMorning: string; doseAfternoon: string; doseNight: string;
  eff: string; notes: string;
}>;
```

---

## 5. Normalización de vocabulario y CHECKs

| Concepto | Valores | Decisión |
| :--- | :--- | :--- |
| `pagos.estado` | `pagado|pendiente|parcial|reembolsado` | CHECK en tabla `pagos` |
| `citas.payment_status` | `pagada|pendiente|exenta` | **mantener** (flag por cita, ya existe en V6); no unificar con el ledger |
| `pagos.metodo` | `efectivo|transferencia|tarjeta|otro` | CHECK |
| `pagos.monto` | numérico `>= 0` | CHECK `ck_pagos_monto` |
| `pronostico` | `excelente|bueno|reservado|malo` | CHECK |
| `uso_farmacos` | `SI|NO|ESPECIFICAR` (normalizar a mayúsculas; la demo usa texto libre «sí/no/especificar») | CHECK |
| `constancias.tipo` | `psicoterapeutica|psiquiatrica|asistencia|informe_pericial|justificante` | CHECK |
| `constancias.estado` | `entregada_en_fisico|anulada` | CHECK |
| `supervision_solicitudes.estado` | `pendiente|atendida` | CHECK |
| `auditoria_expediente.categoria` | `expediente|sesion|ia|reporte|seguridad|riesgo|pagos` | CHECK |
| VC criterio | `Marcador de inicio`=1 · `Sin cambios`=2 · `Mejoría leve`=3 · `Mejoría significativa`=4 · `Nuevo patrón`=4.5 · `Empeoramiento`=0 · `Recaída`=0 | validar en capa application (JSONB) |
| `sesiones.status` | `borrador|validado` | ya existe (V7) |
| Convención columna de estado | tablas nuevas usan `estado`; existentes sin renombrar: `sesiones.status`, `citas.estado_cita`, `pacientes.status`, `expedientes_clinicos.estatus_expediente` | **no renombrar columnas existentes**; fijar convención en SDD |

---

## 6. Recomendaciones para demo-gap-implementation

Orden secuencial propuesto (hexagonal, ADR-001/002/003; un módulo por dominio como en `paciente`/`cita`/`expediente`):

1. **`V8__introduce_expediente_fase2.sql`** (una sola migración, ver §8): columnas psiquiatría + JSONB fármacos en `expedientes_clinicos`; `valoracion_cambio`/`valoracion_global` JSONB en `sesiones`; tablas nuevas `pagos`, `auditoria_expediente`, `supervision_bitacoras`, `supervision_solicitudes`, `constancias_fisicas`; CHECKs + índices FK + permisos nuevos + seed.
2. **Módulo `auditoria`** (propio, NO dentro de `expediente`, para evitar acoplamiento inverso): dominio `AuditoriaExpediente`, puerto de salida de escritura (append-only, transacción `REQUIRES_NEW` como `AuditoriaAccesoPort`), puerto de entrada de consulta, adapter de persistencia y controller de lectura. Se implementa **antes** de pago/supervisión/constancia para que sus services lo inyecten.
3. **Extender módulo `expediente`**: `PATCH /expedientes/paciente/{pacienteId}` (DX + psiquiatría) → requiere `ActualizarExpedienteUseCase` (ports/in), `save`/`update` en `ExpedienteRepositoryPort` y `toJpaEntity` en `ExpedientePersistenceMapper` (hoy solo existen `findByPacienteId` + `toDomain`). Extender `ExpedienteResponseDTO` con campos psiquiatría + `esquemaFarmacologico`; extender `SesionResponseDTO`/`SesionCreateRequest` con `valoracionCambio` y `valoracionGlobal` (tipos `VcEntry`/`VgEntry`, validando la escala en capa application).
4. **Módulo `pago`** (hexagonal): `Pago` domain, `PagoRepositoryPort`, `PagoApplicationService`, `PagoRestController` (GET por paciente, POST, PATCH estado, DELETE), `PagoExceptionHandler`. Derivar `registradoPor` del principal `UsuarioAutenticado` (no del body).
5. **Módulo `supervision`** (hexagonal): `SupervisionBitacora` + `SupervisionSolicitud` domain; endpoints `GET/POST/DELETE /supervision/bitacoras` y `POST /supervision/solicitudes` + `PATCH /supervision/solicitudes/{id}/atender`; **actualizar el adapter Angular** (hoy `GET/POST /api/v1/supervision` plano → añadir `pacienteId` como query param en `listarLogs()`) y activar `supervisionBackend: true`. Derivar `therapistId` de la solicitud desde `UsuarioAutenticado.terapeutaIds` (no del body).
6. **Módulo `constancia`** (hexagonal): `ConstanciaFisica` domain; `GET/POST/DELETE /constancias`.
7. **Frontend Angular**: añadir tipos faltantes (§4) a `clinical.types.ts`; extender el puerto `ExpedienteRepository` (o crear puertos por dominio); portar los tabs reales con las clases Tailwind de la demo **tal cual**; sustituir `recharts` por SVG ligero o librería Angular (decisión SDD); activar flags de backend.
8. **E2E**: ampliar `tests/e2e/expediente.spec.ts` (oráculo + regresión visual por tab) siguiendo el patrón de `agenda.spec.ts`; regenerar baselines.

---

## 7. Contrato de integración frontend ↔ backend ↔ BD

### 7.1 Endpoints REST propuestos (base `/api/v1`, `@PreAuthorize`)

| Método | Ruta | DTO entrada | DTO salida | Permiso | Códigos |
| :--- | :--- | :--- | :--- | :--- | :--- |
| PATCH | `/expedientes/paciente/{pacienteId}` | `ExpedienteUpdateRequest` (DX + psiquiatría + fármacos) | `ExpedienteResponseDTO` | `EXPEDIENTE_ESCRIBIR` | 200 / 404 |
| GET | `/expedientes/paciente/{pacienteId}` | — | `ExpedienteResponseDTO` (ampliado) | `EXPEDIENTE_LEER` | 200 / 404 |
| GET | `/expedientes/paciente/{pacienteId}/sesiones` | — | `SesionResponseDTO[]` (con VC/VG) | `EXPEDIENTE_LEER` | 200 / 404 |
| POST | `/expedientes/paciente/{pacienteId}/sesiones` | `SesionCreateRequest` (con VC/VG) | `SesionResponseDTO` | `EXPEDIENTE_ESCRIBIR` | 201 / 400 |
| GET | `/expedientes/paciente/{pacienteId}/auditoria` | — | `AuditoriaExpedienteResponseDTO[]` | `EXPEDIENTE_LEER` | 200 / 404 |
| GET | `/pagos?pacienteId={pacienteId}` | — | `PagoResponseDTO[]` | `PAGOS_LEER` | 200 |
| POST | `/pagos` | `PagoCreateRequest` | `PagoResponseDTO` | `PAGOS_GESTIONAR` | 201 / 400 |
| PATCH | `/pagos/{pagoId}/estado` | `{ estado }` | `PagoResponseDTO` | `PAGOS_GESTIONAR` | 200 / 404 |
| DELETE | `/pagos/{pagoId}` | — | 204 | `PAGOS_GESTIONAR` | 204 / 404 |
| GET | `/supervision/bitacoras?pacienteId={pacienteId}` | — | `SupervisionLogResponseDTO[]` | `SUPERVISION_LEER` (scope de propiedad) | 200 |
| POST | `/supervision/bitacoras` | `SupervisionLogCreateRequest` | `SupervisionLogResponseDTO` | `SUPERVISION_EVALUAR` o `SUPERVISION_REGISTRAR` | 201 / 400 |
| DELETE | `/supervision/bitacoras/{bitacoraId}` | — | 204 | `SUPERVISION_EVALUAR` o `SUPERVISION_REGISTRAR` (scope de propiedad) | 204 / 404 |
| GET | `/supervision/solicitudes?pacienteId={pacienteId}` | — | `SupervisionSolicitudResponseDTO[]` | `SUPERVISION_LEER` | 200 |
| POST | `/supervision/solicitudes` | `{ pacienteId, reason }` | `SupervisionSolicitudResponseDTO` | `EXPEDIENTE_ESCRIBIR` | 201 / 400 |
| PATCH | `/supervision/solicitudes/{solicitudId}/atender` | — | `SupervisionSolicitudResponseDTO` | `SUPERVISION_EVALUAR` | 200 / 404 |
| GET | `/constancias?pacienteId={pacienteId}` | — | `ConstanciaFisicaResponseDTO[]` | `EXPEDIENTE_LEER` | 200 |
| POST | `/constancias` | `ConstanciaFisicaCreateRequest` | `ConstanciaFisicaResponseDTO` | `CONSTANCIAS_EMITIR` | 201 / 400 |
| DELETE | `/constancias/{constanciaId}` | — | 204 | `CONSTANCIAS_EMITIR` | 204 / 404 |

> ⚠️ **Notas del contrato**:
> - **Derivación identidad vs profesional (crítico)**: `supervision_solicitudes.solicitante_id` (FK→`usuarios`) se deriva de `UsuarioAutenticado.sub()` (identidad); `therapistId` (profesional, tabla `terapeutas`) y `supervision_bitacoras.terapeuta_id` se derivan de `UsuarioAutenticado.terapeutaIds`. **No** usar `terapeutaIds` (ids `ter-*`) para poblar columnas FK→`usuarios` (ids `usr-*`).
> - `POST /supervision/solicitudes` usa `EXPEDIENTE_ESCRIBIR` (acción del **terapeuta tratante**). Alternativa: permiso dedicado `SUPERVISION_SOLICITAR`.
> - `POST/DELETE /supervision/bitacoras`: el **terapeuta** registra/borra sus propias bitácoras (`SUPERVISION_REGISTRAR`); el **supervisor** evalúa (`SUPERVISION_EVALUAR`). DELETE con scope de propiedad: el terapeuta solo borra las suyas (`terapeuta_id` propio).
> - `GET /supervision/bitacoras`: con `SUPERVISION_LEER`, el terapeuta ve **solo sus bitácoras**; supervisor/admin ven todas. Fijar filtro por propiedad/rol en el service.
> - `GET /supervision/solicitudes`: mismo scope de propiedad — terapeuta ve **solo sus solicitudes**; supervisor/admin ven todas.
> - Derivación multi-terapeuta (`terapeutaIds` con 0 o >1): replicar la regla ya documentada en `sdd-agenda.md` (1 → ese id; >1 → el seleccionado; 0 → 403 para roles clínicos).
> - El controller de lectura de auditoría vive en el **módulo `auditoria`**, exponiendo la ruta estable `/expedientes/paciente/{pacienteId}/auditoria`.
> - Naming de path params: usar `{pacienteId}`, `{pagoId}`, `{bitacoraId}`, `{solicitudId}`, `{constanciaId}` para no divergir de `ExpedienteRestController` (que ya usa `{pacienteId}`).

### 7.2 Mapeo camelCase ↔ snake_case (DTOs ↔ BD)

| Frontend (camelCase) | BD (snake_case) | Tabla |
| :--- | :--- | :--- |
| `dxNosologico` | `dx_nosologico` | `expedientes_clinicos` |
| `dsm5` / `cie11` | `dsm5` / `cie11` | `expedientes_clinicos` |
| `comorbilidad` | `comorbilidad` | `expedientes_clinicos` |
| `differentialDx` | `diagnostico_diferencial` | `expedientes_clinicos` |
| `treatmentPlan` | `plan_tratamiento` | `expedientes_clinicos` |
| `prognosis` | `pronostico` | `expedientes_clinicos` |
| `favorableFactors` / `unfavorableFactors` | `factores_favorables` / `factores_desfavorables` | `expedientes_clinicos` |
| `drugsUsage` | `uso_farmacos` | `expedientes_clinicos` |
| `drugsList` | `esquema_farmacologico` (JSONB `DEFAULT '[]'`) | `expedientes_clinicos` |
| `valoracionCambio` (VcEntry) | `valoracion_cambio` (JSONB, nullable) | `sesiones` |
| `valoracionGlobal` (VgEntry) | `valoracion_global` (JSONB, nullable) | `sesiones` |
| `patientId` | `paciente_id` (FK `pacientes`) | `pagos` / `supervision_bitacoras` / `supervision_solicitudes` / `constancias_fisicas` / `auditoria_expediente` |
| `patientName` | JOIN `pacientes.nombre`/`apellidos` | `pagos` / `supervision_bitacoras` / `supervision_solicitudes` / `constancias_fisicas` |
| `appointmentId` | `cita_id` (FK `citas`, NULL) | `pagos` |
| `concept` / `amount` / `method` / `status` | `concepto` / `monto` / `metodo` / `estado` | `pagos` |
| `date` / `notes` / `createdAt` | `fecha` / `notas` / `created_at` | `pagos` |
| `registeredBy` | `registrado_por_id` (FK `usuarios`; nombre resuelto por JOIN) | `pagos` / `constancias_fisicas` |
| `timestamp` | `created_at` | `auditoria_expediente` |
| `userId` | `usuario_id` (FK `usuarios`) | `auditoria_expediente` |
| `userName` / `role` | JOIN `usuarios` + `roles` | `auditoria_expediente` |
| `action` / `details` / `category` | `accion` / `detalle` / `categoria` | `auditoria_expediente` |
| `supervisorName` / `supervisorLicense` | `supervisor_nombre` / `supervisor_cedula` (texto; ver §9.7) | `supervision_bitacoras` |
| `therapistId` / `therapistName` | `terapeuta_id` (FK `terapeutas`) / JOIN | `supervision_bitacoras` |
| `date` / `spr` / `ts` / `therapistProblem` | `fecha` / `spr` / `ts` / `problema_terapeuta` | `supervision_bitacoras` |
| `sessionNumber` / `problemDefinition` / `currentSituation` | `numero_sesion` / `definicion_problema` / `situacion_actual` | `supervision_bitacoras` |
| `rst` / `px` / `eff` / `doubt` / `blocking` | `rst` / `px` / `eff` / `duda` / `bloqueo` (todos **TEXT**; `px` es string) | `supervision_bitacoras` |
| `observations` / `recommendations` | `observaciones` / `recomendaciones` | `supervision_bitacoras` |
| `reason` / `status` / `createdAt` | `motivo` / `estado` / `created_at` | `supervision_solicitudes` |
| `solicitante` (identidad) | `solicitante_id` (FK `usuarios`, desde `sub()`) | `supervision_solicitudes` |
| `therapistId` (profesional solicitante) | `terapeuta_id` (FK `terapeutas`, persistido en POST) · `therapistName` por JOIN `terapeutas` | `supervision_solicitudes` |
| `attendedBy` / `attendedAt` | `atendido_por_id` / `atendido_at` | `supervision_solicitudes` |
| `physicalFolio` / `issueDate` / `type` | `folio_fisico` / `fecha_expedicion` / `tipo` | `constancias_fisicas` |
| `issuerName` / `issuerLicense` / `recipient` / `purpose` | `emisor_nombre` / `emisor_cedula` / `destinatario` / `motivo` | `constancias_fisicas` |
| `periodCovered` / `sessionsCount` | `periodo_cubierto` / `num_sesiones` | `constancias_fisicas` |
| `clinicalSummary` / `deliveredTo` / `registeredAt` | `resumen_clinico` / `entregado_a` / `registrado_at` | `constancias_fisicas` |
| `digitalScanUrl` / `scanFileName` / `status` | `url_escaneo` / `nombre_archivo_escaneo` / `estado` | `constancias_fisicas` |

### 7.3 Permisos nuevos (V8)

**Secuencia real verificada**: V5 siembra `perm-001…perm-016`; **V6 siembra `perm-017`=`MIS_CITAS_LEER` y `perm-018`=`AGENDA_LEER`**. Por tanto, los nuevos continúan desde `perm-019`:

| Permiso | Código | Categoría | Roles asignados |
| :--- | :--- | :--- | :--- |
| `PAGOS_LEER` | perm-019 | PAGOS | `therapist`, `assistant`, `supervisor`, `admin_clinical`, `admin_platform` |
| `PAGOS_GESTIONAR` | perm-020 | PAGOS | `therapist`, `assistant`, `admin_clinical`, `admin_platform` |
| `CONSTANCIAS_EMITIR` | perm-021 | CONSTANCIAS | `therapist`, `admin_clinical`, `admin_platform` |
| `SUPERVISION_REGISTRAR` | perm-022 | SUPERVISION | `therapist` (registra/borra sus propias bitácoras) |

> ⚠️ **Correcciones de la auditoría**:
> - **Asignar a rol-003 (`therapist`)** en V8: `SUPERVISION_LEER` (ver sus bitácoras) y `SUPERVISION_REGISTRAR` (registrar/borrar sus propias bitácoras). Hoy el terapeuta no tiene ningún permiso de supervisión.
> - **Ampliar la unión `Permission` del frontend** (`clinical.types.ts`) con `PAGOS_LEER`, `PAGOS_GESTIONAR`, `CONSTANCIAS_EMITIR` y `SUPERVISION_REGISTRAR`.
> - **Drift preexistente de permisos**: `CitaRestController` y la unión `Permission` del frontend referencian `AGENDA_LEER`/`MIS_CITAS_LEER`, sembrados recién en V6. Aprovechar V8 para verificar que `VALID_PERMISSIONS` del frontend los incluya.

---

## 8. Plan de migración V8 (resumen para el SDD)

### 8.1 Columnas nuevas en `expedientes_clinicos`
`dx_nosologico TEXT`, `dsm5 TEXT`, `cie11 TEXT`, `comorbilidad TEXT`, `diagnostico_diferencial TEXT`, `plan_tratamiento TEXT`, `pronostico VARCHAR(20)`, `factores_favorables TEXT`, `factores_desfavorables TEXT`, `uso_farmacos VARCHAR(15)`, `esquema_farmacologico JSONB`.

### 8.2 Columnas nuevas en `sesiones`
`valoracion_cambio JSONB` (VcEntry), `valoracion_global JSONB` (VgEntry).

### 8.3 Tablas nuevas

- **`pagos`**: `id`, `paciente_id` FK→`pacientes`, `cita_id` FK→`citas` NULL, `concepto`, `monto NUMERIC(10,2)`, `fecha DATE`, `metodo VARCHAR(20)`, `estado VARCHAR(20)`, `notas TEXT`, `registrado_por_id` FK→`usuarios`, `created_at`, `updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`. CHECKs `ck_pagos_metodo`, `ck_pagos_estado`, `ck_pagos_monto (monto >= 0)`; índices `idx_pagos_paciente`, `idx_pagos_cita`.
- **`auditoria_expediente`**: `id`, `paciente_id` FK→`pacientes`, `usuario_id` FK→`usuarios`, `accion VARCHAR(100)`, `detalle TEXT`, `categoria VARCHAR(20)`, `created_at`. CHECK `ck_auditoria_exp_categoria`; índice `idx_auditoria_exp_paciente`. Append-only.
- **`supervision_bitacoras`**: `id`, `paciente_id` FK→`pacientes`, `terapeuta_id` FK→`terapeutas` (profesional supervisado), `fecha DATE`, `numero_sesion INT`, `supervisor_nombre`, `supervisor_cedula` (texto; supervisor puede ser externo, ver §9.7), `definicion_problema TEXT`, `situacion_actual TEXT`, `spr TEXT`, `ts TEXT`, `problema_terapeuta TEXT`, `rst TEXT`, `px TEXT` (**TEXT, no JSONB**), `eff TEXT`, `duda TEXT`, `bloqueo TEXT`, `observaciones TEXT`, `recomendaciones TEXT`, `created_at`. Índice `idx_supervision_paciente` (+ `idx_supervision_terapeuta`).
- **`supervision_solicitudes`**: `id`, `paciente_id` FK→`pacientes`, `solicitante_id` FK→`usuarios` (identidad del terapeuta que solicita), `terapeuta_id` FK→`terapeutas` NULL (profesional, **persistido en POST** según regla de derivación), `motivo TEXT`, `estado VARCHAR(20)`, `created_at`, `atendido_por_id` FK→`usuarios` NULL, `atendido_at`. CHECK `ck_supervision_solicitud_estado`. Índice `idx_supervision_solicitudes_paciente`.
- **`constancias_fisicas`**: ≈17 columnas de datos de `PhysicalCertificateLog` (snake_case: `folio_fisico`, `fecha_expedicion`, `tipo VARCHAR(20)`, `emisor_nombre`, `emisor_cedula`, `destinatario`, `motivo`, `periodo_cubierto`, `num_sesiones INT`, `resumen_clinico TEXT`, `url_escaneo`, `nombre_archivo_escaneo`, `entregado_a`, `estado VARCHAR(20)`, `registrado_por_id` FK→`usuarios`, `registrado_at`, `created_at`) + `id` + `paciente_id` FK→`pacientes`. CHECKs `ck_constancias_tipo`, `ck_constancias_estado`; índice `idx_constancias_paciente` + único parcial `ux_constancias_folio` (`folio_fisico`).

### 8.4 Semilla V8
- Psiquiatría + fármacos sobre **`exp-002` (pac-002 «Valeria», Trastorno de Pánico con Agorafobia, adulta)**: F41.0/300.01/6B01, Sertralina 50 mg + Alprazolam 0.25 mg. ⚠️ **No sobre `exp-001`** (pac-001 «Mateo Herrera Santos», menor con fobia de rendimiento: un benzodiacepínico ahí rompería la coherencia clínica).
- VC/VG para `ses-001` y `ses-002` (valores de la demo, sesiones 1-2).
- 1 pago (`pay-001` para pac-001), 1 bitácora de supervisión (pac-001), 1 constancia física (pac-001), replicando los textos de la demo adaptados a los nombres/folios reales.
- Permisos nuevos (`perm-019/020/021/022`) + asignación a roles + **asignar `SUPERVISION_LEER` y `SUPERVISION_REGISTRAR` a rol-003**.

---

## 9. Riesgos y notas de implementación

1. **VC/VG como JSONB en `sesiones`**: decisión pragmática consistente con `px JSONB`. Alternativa pura-relacional (tablas `valoraciones_cambio`/`valoraciones_globales` hijas de `sesiones`) se descarta en MVP por no aportar queries independientes.
2. **`auditoria_expediente` vs `auditoria_accesos`**: no mezclar; son dominios distintos (acceso vs clínica).
3. **`registeredBy`/`registrado_por_id`**: la demo guarda el *nombre*; en backend guardar **FK a `usuarios`** y resolver el nombre en el DTO (join), patrón de identidad `auditoria_accesos.usuario_id` (tabla en V1; FK a `usuarios` en V4) y `dias_no_laborables.created_by` (V6). ⚠️ **No** citar como patrón `sesiones.creado_por_id`, que referencia **`terapeutas`** (patrón de «profesional»). Regla: *quién profesional* → `terapeutas`; *quién identidad/actor* → `usuarios`.
4. **Recordatorio WhatsApp (`wa.me`)**: es acción de UI (abre `https://wa.me/...`); no requiere endpoint backend. Reutilizar el patrón ya implementado en Agenda (`abrirWhatsAppCancelacion`).
5. **Recharts**: la demo usa `recharts`; en Angular no hay equivalente directo de 1:1. Decisión SDD: render SVG ligero (línea/barras) o librería (`ng2-charts`). Registrar en el SDD.
6. **Fuente de verdad visual**: portar las clases Tailwind de la demo tal cual (regla del calendario); los tabs `datos`/`tbe`/`dx`/`sesiones` ya portados en Fase 1.
7. **Supervisor como texto vs FK** (`supervision_bitacoras`): se conservan `supervisor_nombre`/`supervisor_cedula` como texto (el supervisor puede ser externo); `terapeuta_id` (supervisado) sí es FK→`terapeutas`. Alternativa documentada: `supervisor_id` FK→`terapeutas` NULL + texto de respaldo. Decidir en SDD.
8. **Auditoría clínica `REQUIRES_NEW`**: la escritura en `auditoria_expediente` debe usar propagación `REQUIRES_NEW` (append-only que sobrevive rollbacks), igual que `AuditoriaAccesoPort`. `SesionApplicationService.agregar` hoy **no** asigna `creadoPorId` desde el principal; implementar la atribución desde `UsuarioAutenticado` explícitamente.
9. **Idempotencia V8**: seguir el patrón exacto de V6/V7 (`ADD COLUMN IF NOT EXISTS`, `CREATE TABLE/INDEX IF NOT EXISTS`, bloques `DO $$` para CHECKs/FKs sobre tablas existentes).
10. **Convención de nombre de columnas de estado**: tablas nuevas → `estado`; no renombrar `sesiones.status` ni `citas.estado_cita`.

---

## 10. Auditoría de validación (jarvis-database + jarvis-backend)

**Fecha**: 2026-10-08. Ambos agentes auditaron este informe en modo READ-ONLY y emitieron **⚠️ APROBADO CON OBSERVACIONES**. Todas las observaciones quedaron incorporadas en este documento.

### 10.1 Hallazgos críticos corregidos (🔴)

| # | Origen | Hallazgo | Corrección aplicada |
| :--- | :--- | :--- | :--- |
| C1 | database | Colisión de códigos de permiso: V6 ya ocupó `perm-017`/`perm-018`. | Nuevos códigos: `perm-019`/`perm-020`/`perm-021` (§7.3). |
| C2 | database | Semilla psiquiátrica de pánico sobre exp-001 (menor con fobia) es clínicamente incoherente. | Movida a `exp-002`/pac-002 (§8.4). |
| C3 | database | `supervision_solicitudes.terapeuta_id` FK→`usuarios` es auto-contradictorio. | Renombrada a `solicitante_id` FK→`usuarios` (§8.3). |
| C4 | backend | `POST /supervision/solicitudes` con `SUPERVISION_LEER` bloquea al terapeuta (no lo tiene). | Permiso `EXPEDIENTE_ESCRIBIR` + `therapistId` desde principal (§7.1); asignar `SUPERVISION_LEER` a rol-003 (§7.3). |
| C5 | backend | `PATCH /expedientes/...` sin soporte de escritura (solo `findByPacienteId`/`toDomain`). | `ActualizarExpedienteUseCase` + `save` + `toJpaEntity` (§2, §6.3). |
| C6 | backend | Puerto de auditoría en `expediente` genera acoplamiento inverso. | Módulo propio `auditoria` con `REQUIRES_NEW` (§6.2, §9.8). |

### 10.2 Otras correcciones (🟠/🟡)

- `supervision_bitacoras.px` es **TEXT** (no JSONB) (§7.2, §8.3).
- `pagos` gana `updated_at` y `ck_pagos_monto` (§5, §8.3).
- Contrato de supervisión alineado con el adapter Angular (`/supervision/bitacoras` + `/supervision/solicitudes`; actualizar `listarLogs()` con query param) (§6.5).
- Mapeo §7.2 completado al 100% (pagos, auditoría, supervisión, constancias).
- Path params renombrados a `{pacienteId}`/`{pagoId}`/`{bitacoraId}`/`{solicitudId}`/`{constanciaId}` (§7.1).
- Casing de `uso_farmacos` normalizado a mayúsculas (§5).
- Corregido el patrón de FK citado en §9.3 (`sesiones.creado_por_id`→`terapeutas` es «profesional», no «identidad»).

### 10.3 Decisiones pendientes para el SDD

1. Supervisor: `supervisor_nombre`/`supervisor_cedula` texto vs `supervisor_id` FK→`terapeutas` NULL + respaldo (§9.7).
2. Permiso de solicitud de supervisión: `EXPEDIENTE_ESCRIBIR` (adoptado) vs permiso dedicado `SUPERVISION_SOLICITAR`.
3. Librería de gráficas VC/VG en Angular (SVG ligero vs `ng2-charts`) (§9.5).

### 10.4 Segunda ronda de validación (2026-10-08)

Re-auditoría tras aplicar la 1ª ronda. Ambos agentes: **⚠️ APROBADO CON OBSERVACIONES**; las 9 correcciones (database) y 8 (backend) quedaron **confirmadas ✅**. Se incorporaron los hallazgos residuales:

| # | Severidad | Hallazgo | Corrección aplicada |
| :--- | :--- | :--- | :--- |
| F1 | 🔴 | `solicitante_id` (FK→`usuarios`) mal derivado: `terapeutaIds` contiene ids `ter-*`, no `usr-*`. | Derivación dual: `sub()`→identidad (`solicitante_id`); `terapeutaIds`→profesional (`therapistId` de respuesta + `terapeuta_id`). §7.1 nota + §7.2. |
| F2 | 🟠 | El terapeuta no podía crear/borrar bitácoras (`POST/DELETE` solo `SUPERVISION_EVALUAR`, exclusivo del supervisor). | Nuevo permiso `SUPERVISION_REGISTRAR` (perm-022) para rol-003; POST/DELETE con `SUPERVISION_EVALUAR` o `SUPERVISION_REGISTRAR` + scope de propiedad. §7.1/§7.3/§8.4. |
| F3 | 🟡 | Faltaba `GET /supervision/solicitudes` para que el supervisor liste pendientes. | Endpoint añadido a §7.1. |
| F4 | 🟡 | Scope de propiedad en `GET /supervision/bitacoras` sin definir. | Nota de filtro por propiedad/rol (§7.1). |
| F5 | 🟡 | Cita imprecisa: `auditoria_accesos.usuario_id` es V1 (tabla) y V4 (FK). | Corregido en §9.3. |
| F6 | 🟡 | Derivación multi-terapeuta (0 o >1 `terapeutaIds`) sin regla. | Remitido a la regla de `sdd-agenda.md` (§7.1 nota). |
| H1 | 🟡 | `supervision_solicitudes` omitido en `patientId`/`patientName` de §7.2. | Añadido. |
| H2 | 🟡 | Convención `estado` omitía `pacientes.status` y `expedientes_clinicos.estatus_expediente`. | Completado (§5). |

> ✅ Informe cerrado: contratos de endpoints, permisos, esquema V8 y mapeo DTO están completos y verificados contra las migraciones y el código real. Listo para redactar el **SDD de Fase 2** (`docs/sdd/sdd-expedientes-fase2.md`).

### 10.5 Tercera ronda de validación (2026-10-08)

Re-auditoría de cierre. Ambos agentes: **⚠️ APROBADO CON OBSERVACIONES** (sin 🔴/🟠). Confirmaron ✅ H1/H2 (database) y F1–F6 (backend). Residuales 🟡 aplicados:

- `sesiones.situation` → `situacion` (§1.3, §2).
- Escala VC unificada con valores numéricos explícitos (§5).
- `supervision_solicitudes` gana `terapeuta_id` FK→`terapeutas` (persistido en POST) + mapeo `therapistName` por JOIN (§7.2, §8.3).
- Scope de propiedad definido para `GET /supervision/solicitudes` (§7.1).

> ✅ Sin hallazgos bloqueantes. El documento está **cerrado** y listo para el SDD de Fase 2.
