# GAP Analysis Report: Módulo Agenda / Citas

- **Fecha**: 2026-10-06
- **Módulo**: `agenda` (citas de pacientes)
- **Estado**: CERRADO (READ-ONLY) — decisiones validadas (§4.5) + auditoría DBA/backend 4 rondas (§4.6)
- **Rama de trabajo**: `feature/jp-agenda-calendario-citas`
- **Alineación Normativa**: ADR-001 (Hexagonal), ADR-002 (Dual Adapters), ADR-003 (Flyway)
- **Objetivo**: **paridad total con la demo React** (`brevemente_demo/src/pages/Agenda.tsx`); todas sus features forman parte del alcance **inmediato** (hoy), no de una fase futura.

---

## 1. Inventario de Componentes Auditados

### Frontend Angular (`Brevemente_App/frontend/src/app/modules/agenda/`)

| Archivo | Rol | Estado |
| :--- | :--- | :--- |
| `ports/agenda.repository.ts` | Puerto abstracto `AgendaRepository` | Existe |
| `adapters/agenda-localstorage.adapter.ts` | Mock (LocalStorage) — **activo** (`agendaBackend: false`) | Existe |
| `adapters/agenda-http.adapter.ts` | Adaptador HTTP — **existe pero no se usa** | Existe |
| `agenda.component.ts/.html/.scss` | UI: vista semana/día, modal de agendar, cambio de estado | Existe |

**Contrato del puerto (`AgendaRepository`)**:

| Método | Retorno | Endpoint esperado por el HTTP adapter |
| :--- | :--- | :--- |
| `listarCitas()` | `Observable<Appointment[]>` | `GET /api/v1/citas` |
| `agendarCita(cita: Omit<Appointment,'id'>)` | `Observable<Appointment>` | `POST /api/v1/citas` |
| `obtenerPacientes()` | `Observable<Patient[]>` | `GET /api/v1/pacientes` (ya existe) |
| `actualizarEstadoCita(id, status)` | `Observable<Appointment>` | `PATCH /api/v1/citas/{id}/estado` |

**Contrato `Appointment` (`core/types/clinical.types.ts`)**:

```typescript
interface Appointment {
  id: string;
  patientId: string;
  patientName: string;         // denormalizado
  time: string;                // 'HH:mm'
  date: string;                // 'YYYY-MM-DD'
  type: 'primera' | 'seguimiento' | 'cierre';
  status: 'confirmada' | 'pendiente' | 'completada' | 'cancelada'
        | 'ausente' | 'no_presentado' | 'solicita_reagendar';
  paymentStatus?: 'pagada' | 'pendiente' | 'exenta';
}
```

**Regla de negocio visible en la UI** (`agenda.component.ts`):
- `isPatientBlocked(patientId)`: si el paciente es `REPRESENTADO_POR_EDAD` **y** `consentimientoRepresentanteFirmado === false`, la cita se muestra como **"Bloqueada por Normativa"** y se crea con `status: 'pendiente'` (no `confirmada`).
- Acciones por tarjeta: **Confirmar** (`→ confirmada`) y **Cancelar** (`→ cancelada`).
- Enlace "Ver Expediente →" hacia `/expediente/:patientId`.

### Demo React (`brevemente_demo/src/pages/Agenda.tsx`) — **REFERENCIA DE PARIDAD**

Funciona 100% en LocalStorage (`appointmentService`, `holidayService`, `auditLogService`, `utils/sessionDuration`, `utils/legalConsent`). Inventario completo de features a portar:

**Calendario y navegación**
- Vistas **día / semana / mes / año** con navegación (anterior/siguiente, zoom in/out, "Hoy").
- Línea horaria simulada de "ahora" en la vista semanal.

**Agendar cita (modal)**
- Paciente: selección de paciente existente **o** creación rápida de paciente nuevo (nombre, teléfono, email, fecha de nacimiento, motivo).
- Fecha, hora, **tipo** (primera/seguimiento/cierre + supervisión/evaluación en el form), **duración** (30/45/60), **modalidad** (presencial/online) y **consultorio** (A/B).
- **Bloqueo por día no laborable** (festivo personal siempre; oficial si el toggle está activo).
- **Detección de solapamientos** por día + duración: avisa con `confirm()` (no bloquea) y registra conflicto en auditoría.

**Acciones sobre citas**
- **Confirmar** (bloqueada si el paciente carece de consentimiento legal).
- **Reprogramar** (fecha/hora/duración) con validación de solapamiento y auditoría.
- **Contactar por WhatsApp** (solo en estado `no_presentado`).
- **Reagendar** (solo en estado `solicita_reagendar`).
- **Eliminar** cita.

**Estados de cita (7)**: `confirmada`, `pendiente`, `completada`, `cancelada`, `ausente`, `no_presentado`, `solicita_reagendar` (+ badge de color por estado).

**Festivos y días personales**
- Catálogo de **festivos oficiales 2026** (7 fechas, solo lectura).
- **Días personales** (CRUD) por terapeuta, con auditoría.
- Toggle **"Bloquear festivos para agendar"**.

**Filtros** (solo roles clínicos): profesional/terapeuta, consultorio, expediente (IA/manual), estado especial (confirmada/pendiente/riesgo alto/intake pendiente).

**Restricciones por rol**
- El rol `patient` **solo ve sus propias citas**.
- Roles clínicos (therapist, assistant, admin_clinical, admin_platform, supervisor) **ven** la agenda completa (con filtros).
  > **Decisión de negocio (aplica al port)**: **crear citas** queda restringido a **terapeutas**, **asistentes asignados** y **admin_platform**; `admin_clinical` y `supervisor` son **solo lectura** (ver §4.5, decisión 6). Este matiz sobreescribe el comportamiento de la demo.

**Reglas de negocio adicionales**
- Bloqueo legal de confirmación: `isActionBlockedByLegalConsent` (menor sin consentimiento de persona de apoyo → no se puede confirmar).
- Color de borde por `sessionFrequency` (semanal/quincenal/mensual).
- Icono de **riesgo clínico alto** (`riskLevel === 'alto'`).
- Auditoría de: acceso a detalle, creación de cita/paciente, confirmación, reprogramación, conflicto de agenda, días personales y push WhatsApp.

**Inconsistencias de la demo a resolver al portar**
1. El form incluye **tipo** `supervision`/`evaluacion`, pero el tipo `Appointment.type` solo admite `primera/seguimiento/cierre` → **Decisión**: catálogo final `primera`/`seguimiento`/`cierre`; se descartan `supervision`/`evaluacion`.
2. **Modalidad** y **consultorio** se capturan en el form pero **no se persisten** en `Appointment` (el card muestra `appModality` global en lugar del dato de la cita).
3. El `Appointment` de la demo **no** tiene `paymentStatus` (la Angular sí).

### Backend Spring Boot (`com.syborx.brevemente`)

| Paquete | Existente | Relevante para agenda |
| :--- | :--- | :--- |
| `auth` | Sí (login, JWT, PBAC, auditoría) | Deriva terapeuta autenticado; permisos `AGENDA_GESTIONAR` |
| `paciente` | Sí (CRUD completo) | Reutilizar `GET /pacientes` y lógica de consentimiento |
| `cita` / `agenda` | **NO EXISTE** | Falta todo el módulo |

### Base de Datos PostgreSQL (Flyway V1–V5)

- **`citas`** existe desde **V1** (ver §2). **No existe ninguna entidad JPA que la mapee**.
- **No hay semilla** de citas en ninguna migración.

---

## 2. Matriz de Reutilización de Código Existente

| Componente Backend | Estado Actual | Estrategia SDOP |
| :--- | :--- | :--- |
| Tabla `citas` (V1) | Existe con FKs a `pacientes`, `terapeutas`, `expedientes_clinicos` | **EXTENDER** mediante `V6` (columnas faltantes) y **SEMBRAR** |
| `pacientes` + `GET /api/v1/pacientes` | Migrado (V1–V3 + módulo `paciente`) | **REUTILIZAR** para `obtenerPacientes()` |
| `terapeutas.usuario_id` (V4) | Existe | **Exponer en el JWT**: emitir claim `terapeutaIds` (lista) al login — terapeuta → su propio id; asistente → ids de `asignaciones_terapeuta` (resuelto una sola vez, sin consultar BD por request) |
| `expedientes_clinicos` (V1) | Existe | **Reutilizar** FK opcional `expediente_id` |
| Patrón hexagonal `paciente` / `auth` | Existe | **REPLICAR** para el módulo `cita` |
| `AuditoriaAccesoPort` + `auditoria_accesos` (V4/V5) | Existe | **EXTENDER** con método genérico `registrarAcceso(usuarioId, recurso, accion, ...)` para auditar citas |
| PBAC `permisos` / `rol_permisos` (V5) | Existe | **V6**: `AGENDA_GESTIONAR` queda en `rol-003`/`rol-004` (+ `rol-001` superadmin) y se **revoca** a `rol-002`; nuevo `AGENDA_LEER` (perm-018) para lectura clínica; `MIS_CITAS_LEER` (perm-017) para `rol-006` |
| `WebCorsConfig` / `OpenApiConfig` | Existe | **REUTILIZAR** |

---

## 3. Matriz de Brechas (GAPs) Identificadas

### 3.1 Brechas del contrato base (CRUD + normativa)

| ID | Tipo | Descripción | Impacto | Acción Propuesta |
| :--- | :--- | :--- | :--- | :--- |
| GAP-AGENDA-01 | **MISSING** | No existe módulo backend `cita`: `CitaJpaEntity`, `CitaRepository`, `CitaApplicationService`, `CitaController`, DTOs y mappers. | **Alto** | Crear módulo hexagonal `cita`. |
| GAP-AGENDA-02 | **MISSING** | Endpoints `GET/POST /api/v1/citas` y `PATCH /api/v1/citas/{id}/estado`. | **Alto** | Crear `CitaRestController`. |
| GAP-AGENDA-03 | **PARTIAL** | Tabla `citas` (V1) no alineada al contrato: falta `payment_status`; `tipo_sesion` no representa `type`; `estado_cita` usa catálogo distinto. | **Alto** | V6: `payment_status`, `tipo_cita`, normalizar `estado_cita`. |
| GAP-AGENDA-04 | **INCORRECT** | `date`/`time` (string) vs `fecha_hora_inicio/fin` (TIMESTAMPTZ). | **Medio** | Mapper DTO fecha+hora → `OffsetDateTime` (zona explícita); el frontend recibe `date`/`time` string. |
| GAP-AGENDA-05 | **CONTRACT** | Firma exacta de `PATCH /citas/{id}/estado` y `POST /citas`. | **Medio** | `CitaEstadoRequest{ status }` (el adapter Angular hoy envía `{ status }`); `POST /citas → 201 Created`. |
| GAP-AGENDA-06 | **PARTIAL** | Regla "Bloqueada por Normativa" no implementada en backend; la columna `bloqueada_por_normativa` (V1) **ya existe**. | **Alto** | Implementar solo la **lógica** en `CitaApplicationService` (reutilizar la columna). |
| GAP-AGENDA-07 | **PARTIAL** | `terapeuta_id NOT NULL` sin envío del frontend. | **Alto** | Claim `terapeutaIds` (lista) en el JWT: terapeuta → su id; asistente → terapeutas asignados. `agendar` deriva el `terapeuta_id`; `403 SinTerapeutaVinculadoException` si no hay vínculo. |
| GAP-AGENDA-08 | **DATA** | Sin semilla de citas. | **Alto** | V6: seed para `pac-001`…`pac-004`. |
| GAP-AGENDA-09 | **PARTIAL** | `patientName` denormalizado. | **Bajo** | Join a `pacientes` en el DTO. |

### 3.2 Brechas de paridad con la demo React (alcance inmediato)

| ID | Tipo | Descripción | Impacto | Acción Propuesta |
| :--- | :--- | :--- | :--- | :--- |
| GAP-AGENDA-10 | **PARTIAL** | La demo React es la referencia de paridad (features listadas en §1). | **Alto** | Portar todo (desglosado en GAP-11…25). |
| GAP-AGENDA-11 | **MISSING** | Duración de sesión (30/45/60) no se persiste; `fecha_hora_fin` existe pero el frontend no la manda. | **Alto** | V6: `duracion_minutos INT DEFAULT 30`; form default 30 min editable en memoria; `fin = inicio + duración` calculado al `POST`. |
| GAP-AGENDA-12 | **MISSING** | Detección de solapamientos (terapeuta + día + intervalo). | **Alto** | **BLOQUEAR** (409) en ambas dimensiones — terapeuta **y** paciente sin citas simultáneas; auditoría "Conflicto de agenda". |
| GAP-AGENDA-13 | **PARTIAL** | Modalidad y consultorio: `citas.modalidad` existe; falta `consultorio`; no se persisten en el contrato Angular. | **Medio** | V6: `consultorio`; añadir `modality`/`office` al `Appointment`. |
| GAP-AGENDA-14 | **MISSING** | Festivos oficiales + días personales (no hay tabla). | **Alto** | V6: tabla `dias_no_laborables` con `terapeuta_id NULL` (oficial=global, personal=por terapeuta) + seed + CRUD + toggle. |
| GAP-AGENDA-15 | **MISSING** | Vistas mes/año y navegación del calendario. | **Medio** | Portar lógica de calendario a Angular (frontend). |
| GAP-AGENDA-16 | **MISSING** | Filtros (terapeuta, consultorio, expediente/modalidad, estado especial). | **Medio** | Query params en `GET /citas` + UI. |
| GAP-AGENDA-17 | **MISSING** | Restricción por rol `patient` (ve solo sus citas; **no crea citas**). Falta `pacientes.usuario_id` y permisos del rol `patient`. | **Alto** | V6: `pacientes.usuario_id` (NULLABLE) + FK `ON DELETE SET NULL` + seed de usuarios patient + `MIS_CITAS_LEER` (perm-017 → rol-006); `GET /citas` con `hasAnyAuthority('AGENDA_LEER','AGENDA_GESTIONAR','MIS_CITAS_LEER')` + filtro por claim `pacienteId`. |
| GAP-AGENDA-18 | **CLOSED** | Transiciones de estado completas (7 estados). | **Medio** | Máquina de estados en `CitaApplicationService.actualizarEstado` (mapa de transiciones + `TransicionEstadoCitaInvalidaException` → 409) y gating UI (`puedeConfirmar`/`puedeCancelar`). Contactar/Reagendar: WhatsApp cubierto por GAP-20; Reagendar queda como mejora futura. |
| GAP-AGENDA-19 | **MISSING** | Reprogramación (fecha/hora/duración) con validación y auditoría. | **Medio** | Endpoint `PATCH /citas/{id}` + lógica. |
| GAP-AGENDA-20 | **CLOSED (Nivel A)** | Contacto WhatsApp a paciente. | **Bajo** | Nivel A implementado: notificación de cancelación vía `wa.me` (checkbox en modal de confirmación + botón en drawer para citas `cancelada`). Puerto `WhatsAppPort` listo para Cloud API (Nivel B). |
| GAP-AGENDA-21 | **PARTIAL** | Crear paciente desde la agenda. | **Bajo** | Reutilizar `POST /pacientes` y enlazar modal. |
| GAP-AGENDA-22 | **PARTIAL** | Auditoría de citas (detalle, creación, confirmación, reprogramación, conflicto). | **Medio** | **Extender** `AuditoriaAccesoPort` con `registrarAcceso(usuarioId, recurso, accion, ...)` (hoy solo login/intentos/evento) o crear `CitaAuditoriaPort`. |
| GAP-AGENDA-23 | **PARTIAL** | Colores por `sessionFrequency` + icono riesgo alto. | **Bajo** | Frontend puro (datos ya vienen de pacientes). |
| GAP-AGENDA-24 | **INCORRECT** | Catálogo de `type`: la demo mezcla `supervision`/`evaluacion` en el form. | **Bajo** | **Decisión**: catálogo final `primera`/`seguimiento`/`cierre`; columna `tipo_cita`; descartar `supervision`/`evaluacion`. |
| GAP-AGENDA-25 | **PARTIAL** | `paymentStatus` inconsistente (Angular sí, demo React no). | **Bajo** | Mantener y persistir `payment_status`. |

---

## 4. Recomendaciones para demo-gap-implementation

### 4.1 Fase 1 — Base de Datos (Flyway `V6`)

Migración `V6__introduce_citas_schema.sql` (idempotente):
1. **Extender `citas`** (idempotente: `ADD COLUMN IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, `DO $$` para constraints):
   - `tipo_cita VARCHAR(20) NOT NULL DEFAULT 'primera'` con `CHECK (tipo_cita IN ('primera','seguimiento','cierre'))` (GAP-24). Semántica: `tipo_sesion` (V1) = formato de sesión (`INDIVIDUAL`/`GRUPAL`); `tipo_cita` = etapa clínica.
   - `duracion_minutos INT NOT NULL DEFAULT 30` con `CHECK (duracion_minutos IN (30,45,60))` (GAP-11); el default 30 es red de seguridad: la duración real se envía siempre en el `POST`.
   - `payment_status VARCHAR(20) NOT NULL DEFAULT 'pendiente'` con `CHECK (payment_status IN ('pagada','pendiente','exenta'))` (GAP-25).
   - `consultorio VARCHAR(10)` (A/B) con `CHECK (consultorio IN ('A','B'))` (GAP-13); `modalidad` ya existe → añadir `CHECK (modalidad IN ('PRESENCIAL','ONLINE'))`; ambas se **persisten por cita**.
   - Normalizar `estado_cita` a los 7 estados: `SET DEFAULT 'pendiente'` + `UPDATE citas SET estado_cita='pendiente' WHERE estado_cita='PROGRAMADA'` + `CHECK` de los 7 valores.
   - `updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP` (para reprogramar/cambiar estado).
   - Índices de solapamiento: `idx_citas_terapeuta_fecha (terapeuta_id, fecha_hora_inicio)` **y** `idx_citas_paciente_fecha (paciente_id, fecha_hora_inicio)`.
2. **Nueva tabla `dias_no_laborables`** (GAP-14):
   - `id VARCHAR(36) PRIMARY KEY`, `fecha DATE NOT NULL`, `nombre VARCHAR(100)`, `tipo VARCHAR(20) NOT NULL DEFAULT 'personal' CHECK (tipo IN ('oficial','personal'))`, `terapeuta_id VARCHAR(36) NULL REFERENCES terapeutas(id)` (NULL ⇒ festivo oficial/global), `created_by VARCHAR(36) REFERENCES usuarios(id) ON DELETE SET NULL`, `created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP`.
   - CHECK de coherencia: `(tipo='personal' AND terapeuta_id IS NOT NULL) OR (tipo='oficial' AND terapeuta_id IS NULL)` (impide días personales huérfanos).
   - Unicidad parcial (PostgreSQL no permite inline, se usa `CREATE UNIQUE INDEX ... WHERE`): `ux_dias_no_laborables_oficial ON (fecha) WHERE tipo='oficial'` + `ux_dias_no_laborables_personal ON (terapeuta_id, fecha) WHERE tipo='personal'` + seed de 7 festivos oficiales 2026.
3. **Semilla de citas** (GAP-08) con mapeo **posicional** (los ids de la demo `patient-1..4` no existen en BD; no se busca paridad de nombres, p. ej. la demo `patient-1` = "Sofía" pero `pac-001` = "Mateo"):
   | Semilla | paciente | terapeuta_id | expediente_id |
   | :--- | :--- | :--- | :--- |
   | mock patient-1 | `pac-001` | `ter-001` | `exp-001` |
   | mock patient-2 | `pac-002` | `ter-001` | `exp-002` |
   | mock patient-3 | `pac-003` | `ter-002` | `NULL` (sin expediente) |
   | mock patient-4 | `pac-004` | `ter-002` | `NULL` (sin expediente) |
   - Ids deterministas (`cit-001`…`cit-00N`) + `INSERT ... ON CONFLICT (id) DO NOTHING`, especificando columnas obligatorias (`tipo_cita`, `estado_cita`, `fecha_hora_inicio`, `fecha_hora_fin`, `duracion_minutos`) para no depender de DEFAULTs.
4. **Identidad, asignaciones y permisos para la agenda**:
   - **Vínculo paciente**: `ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS usuario_id VARCHAR(36)` (NULLABLE); FK `fk_pacientes_usuario REFERENCES usuarios(id) ON DELETE SET NULL`; índice único parcial `ux_pacientes_usuario_id ON pacientes(usuario_id) WHERE usuario_id IS NOT NULL`.
   - **Seed de usuarios patient** (idempotente, hash `demo123`): `usr-pac-001…004` (email, nombre, apellidos, `token_version=1`) + `INSERT INTO usuario_roles → rol-006` (`ON CONFLICT DO NOTHING`) + `UPDATE pacientes SET usuario_id = 'usr-pac-00N' WHERE id = 'pac-00N' AND usuario_id IS NULL`.
   - **Nueva tabla `asignaciones_terapeuta`** (N:M asistente ↔ terapeuta): `PRIMARY KEY (usuario_id, terapeuta_id)`, `usuario_id REFERENCES usuarios(id) ON DELETE CASCADE`, `terapeuta_id REFERENCES terapeutas(id) ON DELETE CASCADE`, `created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP` (patrón de join table como `usuario_roles`).
   - Índice inverso: `CREATE INDEX IF NOT EXISTS idx_asignaciones_terapeuta_terapeuta ON asignaciones_terapeuta (terapeuta_id)` (simetría con `idx_usuario_roles_rol` de V4).
   - **Seed de asistente** (idempotente, hash `demo123`): crear `usr-asist-001` en `usuarios` (email `asistente.agenda@brevemente.org`, `token_version=1`) + `INSERT INTO usuario_roles ('usr-asist-001','rol-004')` (`ON CONFLICT DO NOTHING`); luego `INSERT INTO asignaciones_terapeuta (usuario_id, terapeuta_id)` con `('usr-asist-001','ter-001')` y `('usr-asist-001','ter-002')` (cubre el caso multi-terapeuta).
   - **Permisos V6**: `perm-017 MIS_CITAS_LEER` → `rol-006` (solo; no se concede a `rol-001`); `perm-018 AGENDA_LEER` → `rol-002`, `rol-003`, `rol-004`, `rol-005`, `rol-001`; `AGENDA_GESTIONAR` (perm-008) se mantiene en `rol-003`, `rol-004` y `rol-001` (superadmin) y se **revoca** de `rol-002` (admin_clinical). `rol-001` recibe explícitamente `perm-018` (el "todos los permisos" de V5 es una foto estática que no cubre permisos creados después).
   - Los vínculos se resuelven **una sola vez, en el login**, y se emiten como claims `terapeutaIds` (lista) / `pacienteId` del JWT (sin consultar BD por request).
   - FKs de `citas` (V1: `paciente_id`, `terapeuta_id`, `expediente_id`) se mantienen con `ON DELETE NO ACTION` (protegen las citas ante borrados); V6 no las altera.

### 4.2 Fase 2 — Backend (módulo `cita`, hexagonal)

- **Dominio**: `Cita` (POJO), `DiaNoLaborable`, excepciones (`CitaNotFoundException`, `FechaNoLaborableException`, `SolapamientoCitaException`, `SinTerapeutaVinculadoException`).
- **Puertos**: `ListarCitasUseCase`, `AgendarCitaUseCase`, `ActualizarEstadoCitaUseCase`, `ReprogramarCitaUseCase`, `CitaRepositoryPort`, `DiaNoLaborablePort`, `WhatsAppPort` (salida; preparado para Cloud API), `IdentidadAutenticadaPort` (abstrae la lectura de `terapeutaIds`/`pacienteId` del `SecurityContext`).
- **Persistencia**: `CitaJpaEntity` (fechas `OffsetDateTime`/`Instant` sobre `TIMESTAMPTZ`, y `updatedAt` anotado con `@UpdateTimestamp` para que refleje reprogramar/cambiar estado) + `SpringDataCitaRepository` (queries de solapamiento por terapeuta y paciente); `DiaNoLaborableJpaEntity` + repositorio.
- **Sincronizar módulo `paciente`**: añadir el campo `usuarioId` a `PacienteJpaEntity` (y su mapper) para reflejar la nueva columna `pacientes.usuario_id` de V6, además de la proyección de lectura del claim `pacienteId`.
- **Servicio** (`CitaApplicationService`):
  - `agendar`: valida día no laborable (GAP-14), **bloquea solapamiento** por terapeuta **y** por paciente (GAP-12), bloqueo normativo (GAP-06), y deriva `terapeuta_id` (GAP-07) según la regla de §4.2 "Derivación de terapeuta_id"; calcula `fecha_hora_fin = inicio.plusMinutes(duracion)` (GAP-11).
  - `listar`: filtros (GAP-16) + restricción por rol patient (GAP-17): si el principal es `patient` (y no tiene rol clínico), forzar filtro con el claim `pacienteId`; si tiene ambos, gana el rol clínico (ve la agenda completa). El rol `patient` **no crea citas** (solo lectura).
  - `actualizarEstado`: transiciones de 7 estados (GAP-18).
  - `reprogramar`: validación de solapamiento + auditoría (GAP-19).
- **REST** (`CitaController`): `GET /citas`, `POST /citas` (**201 Created**), `PATCH /citas/{id}/estado`, `PATCH /citas/{id}` (reprogramar); `GET/POST/DELETE /dias-no-laborables` (`GET` → `AGENDA_LEER`; `POST/DELETE` → `AGENDA_GESTIONAR`, aplicando la misma regla de derivación de `terapeuta_id` para días personales). Manejo de errores con `CitaExceptionHandler` `@RestControllerAdvice(basePackages = "com.syborx.brevemente.cita")`.
- **DTOs + mappers**: `CitaCreateRequest`, `CitaResponseDTO` (con `patientName` por join y fechas `OffsetDateTime`), `CitaEstadoRequest{ status }`, `DiaNoLaborableDTO`.
- **Seguridad**: `GET /citas` con `@PreAuthorize("hasAnyAuthority('AGENDA_LEER','AGENDA_GESTIONAR','MIS_CITAS_LEER')")`; escritura (`POST`, `PATCH`) con `hasAuthority('AGENDA_GESTIONAR')` (perm-008: solo `rol-003`, `rol-004` y `rol-001` superadmin; revocado a `rol-002`). El rol `patient` (rol-006, perm-017) solo lee sus citas.
- **Derivación de `terapeuta_id` al agendar** (regla de negocio de quién puede crear citas): `CitaCreateRequest.terapeutaId` opcional; el backend decide:
  1. Claim `terapeutaIds` con **1** elemento → ese es el `terapeuta_id` (se ignora el explícito).
  2. Claim `terapeutaIds` con **>1** (asistente multi-terapeuta) → `terapeutaId` explícito **obligatorio** y debe estar en la lista (403 si no).
  3. Claim vacío y principal **superadmin** (detectado por la autoridad `ROLE_ADMIN_PLATFORM`, no por permiso) → `terapeutaId` explícito **obligatorio** (cualquier terapeuta activo).
  4. Claim vacío y no superadmin → `403 SinTerapeutaVinculadoException` (aplica también a `reprogramar`; no aplica a `listar`).
- **Identidad desde el JWT**: en el login, `JwtService` emite `terapeutaIds` (lista; terapeuta → su id, asistente → ids de `asignaciones_terapeuta`, resuelto vía un `VinculoIdentidadPort` que reutiliza el patrón `LicenseLookupPort`/`LicenseJpaProjection`) y `pacienteId` (vía proyección `SELECT id FROM pacientes WHERE usuario_id = :sub`). `JwtAuthFilter` construye un principal `UsuarioAutenticado(sub, terapeutaIds, pacienteId, authorities)` con `getName() → sub` (no rompe `/me` ni `/logout`) y el módulo `cita` lo lee a través de `IdentidadAutenticadaPort`. Los claims se **re-emiten en cada rotación del refresh token** (ventana máxima de desactualización = TTL del access token, 15 min).
- **Auditoría** (GAP-22): **extender** `AuditoriaAccesoPort` con `registrarAcceso(usuarioId, recurso, accion, ip, detalle)` (hoy fija recurso `'auth'`) o crear `CitaAuditoriaPort` propio; recurso `'citas'`.

### 4.3 Fase 3 — Frontend Angular

- Ampliar el contrato `Appointment` con `terapeutaId?: string` (además de duration, modality, office) y el puerto (`reprogramarCita`, `listarDiasNoLaborables`, etc.); sincronizar `agenda-http.adapter.ts`.
- En el modal de agendar, mostrar **selector de terapeuta solo si** el usuario logueado tiene `terapeutaIds.length > 1` (asistente multi-terapeuta); con 1 terapeuta se envía implícito.
- Duración: form default **30 min** editable (30/45/60) en memoria; el preview de hora de fin se calcula localmente y **solo se persiste en el `POST` final** (mismo flujo de la demo).
- WhatsApp Nivel A: link `wa.me` en la acción "Contactar" (`no_presentado`); el puerto `WhatsAppPort` queda definido para enchufar Cloud API después.
- Ajustar `agenda-http.adapter.ts` al nuevo contrato.
- **Portar la UI completa de la demo React** (calendario día/semana/mes/año, modal con duración/modalidad/consultorio, festivos, filtros, drawer de detalle, acciones contextuales).
- Activar `agendaBackend: true` y **eliminar el mock**.
- Regla de Oro: integrar vía adaptador/puerto, conservando la estructura y estilos aprobados.

### 4.4 Fase 4 — E2E Playwright

- Nueva suite `agenda.spec.ts`: oráculo real (citas de BD), regresión visual del calendario, casos de bloqueo normativo, solapamiento y restricción por rol.

### 4.5 Decisiones tomadas (validadas con el negocio)

1. **Catálogo de `type`** (GAP-24): solo `primera` / `seguimiento` / `cierre`. Se descartan `supervision`/`evaluacion`.
2. **Persistir modalidad/consultorio** (GAP-13/25): **sí** — `modalidad` (ya existe) y `consultorio` (nuevo) se persisten **por cita**; cada cita muestra su propio dato.
3. **Duración por defecto** (GAP-11): **30 min** en el form al agendar, editable (30/45/60) en memoria; la duración se guarda **solo al finalizar** el agendado (en el `POST`), como en la demo.
4. **Solapamiento** (GAP-12): **bloquear** en ambas dimensiones — ni el **terapeuta** ni el **paciente** pueden tener dos citas simultáneas → `409 Conflict`.
5. **WhatsApp** (GAP-20): arrancar en **Nivel A** (link `wa.me`) dejando definido el puerto `WhatsAppPort` para migrar a Cloud API (Nivel B) cuando se apruebe con los superiores.
6. **Quién crea citas**: solo **terapeutas** y **asistentes asignados** a uno o más terapeutas (`asignaciones_terapeuta`, N:M). `admin_platform` (superadmin) también agenda (con `terapeutaId` explícito). `admin_clinical` y `supervisor` son **solo lectura** de la agenda.
7. **Asistente multi-terapeuta**: un asistente puede apoyar a **varios** terapeutas; con >1, el `POST /citas` exige `terapeutaId` explícito.

### 4.6 Auditoría recibida (2026-10-06)

Documento auditado en READ-ONLY por `jarvis-database` (esquema/migraciones) y `jarvis-backend` (contratos/seguridad). Veredictos ⚠️ → correcciones incorporadas: índice de solapamiento por paciente, rediseño de `dias_no_laborables` (unicidad parcial por terapeuta + `terapeuta_id`), catálogo y DEFAULT de `estado_cita`, semántica `tipo_sesion` vs `tipo_cita`, `OffsetDateTime` sobre `TIMESTAMPTZ`, mapeo explícito de la semilla, `pacientes.usuario_id` + permiso `MIS_CITAS_LEER`, extensión de `AuditoriaAccesoPort`, convenciones (`CitaNotFoundException`, `201 Created`, `@RestControllerAdvice` scoped) e idempotencia explícita de V6. Re-auditoría (ronda 2): confirmadas las 11 correcciones; se incorporó además la regla "solo terapeutas y asistentes asignados crean citas" (`asignaciones_terapeuta` N:M, claim `terapeutaIds`, permiso `AGENDA_LEER`, revocación a `admin_clinical` (supervisor nunca tuvo `AGENDA_GESTIONAR`; solo lectura), superadmin con agendado explícito), el principal `UsuarioAutenticado`, la resolución del vínculo vía `VinculoIdentidadPort` y las precisiones DBA (nullabilidad/FK/índices parciales/seed de usuarios patient/CHECK de catálogos). Re-auditoría (ronda 3): seed completo de `usr-asist-001`, CHECK de `dias_no_laborables` (personal ⇒ terapeuta), FKs `ON DELETE CASCADE` y PK compuesta en `asignaciones_terapeuta`, `terapeutaId` + selector en frontend, detección de superadmin por `ROLE_ADMIN_PLATFORM`, autorización/derivación de `/dias-no-laborables`, `@UpdateTimestamp` y refinamientos menores. Auditoría final (ronda 4): ✅ LISTO PARA SDD; refinamientos aplicados: ids deterministas de la semilla de citas, índice inverso de `asignaciones_terapeuta`, CHECK de `duracion_minutos`, `ON DELETE SET NULL` en `dias_no_laborables.created_by`, política `ON DELETE` de FKs de `citas`, campo `usuarioId` en `PacienteJpaEntity` y corrección de referencia cruzada.

### 4.7 Cierre post-implementación (2026-10-07)

Este apartado registra el estado final tras la implementación fullstack (el análisis de GAPs permanece READ-ONLY):

- **GAP-AGENDA-15 (vistas mes/año)**: CLOSED — calendario Día/Semana/Mes/Año portado de la demo React.
- **GAP-AGENDA-18 (transiciones de estado)**: CLOSED — máquina de estados en backend (`TransicionEstadoCitaInvalidaException` → 409) y gating de botones en frontend (`puedeConfirmar`/`puedeCancelar`). "Reagendar" queda como mejora futura.
- **GAP-AGENDA-20 (WhatsApp)**: CLOSED (Nivel A) — notificación de cancelación vía `wa.me`; `WhatsAppPort` listo para Cloud API (Nivel B).
- Resto de GAPs: implementados según SDD-002 §2–§4 y verificados con la suite E2E (4/4) de `e2e-report-agenda.md`.
- **Pendiente acordado (fuera de agenda)**: desbloqueo de citas `pendiente` de menores por firma de consentimiento → se implementará en el módulo Expedientes (hoy la firma escribe solo en localStorage).
