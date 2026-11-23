# SDD-PAGOS-CAN-1: Software Design Document — Pagos Provisionales y Cancelación de Citas con Motivo

- **Módulos**: `cita` + `pago` + `portalpaciente` (backend Spring Boot, hexagonal) · `agenda` + `patient-portal` (frontend Angular 18 standalone) · PostgreSQL/Flyway
- **Código SDD**: `SDD-PAGOS-CAN-1`
- **Versión**: 1.0.0
- **Fecha**: 2026-11-23
- **Estado**: AUDITADO (jarvis-database ✅ APROBADO; jarvis-backend/jarvis-frontend con correcciones incorporadas)
- **Sucede a**: `V38__introduce_leva_case_sources.sql` (última migración en `origin/develop`, verificada 2026-11-23)
- **Migración nueva**: `V39__pagos_cancelacion_citas.sql`
- **Fuente de verdad**: `docs/gap-analysis/gap-report-pagos-cancelacion-citas.md`
- **Alineación**: ADR-001 (Hexagonal/SDOP), ADR-002 (Dual Adapters), ADR-003 (Backend hexagonal y OpenAPI)

> **Regla de Oro**: integrar vía adaptador/puerto, reutilizando/adaptando lo existente. Este documento **no** escribe código fuente; es la especificación que consumirá la implementación.

---

## 0. Propósito y alcance

Hoy toda cita se crea **directamente como `confirmada`**, aunque la regla de negocio exige validar el pago antes de confirmar. Además no existe captura de motivo ni auditoría al cancelar, y el paciente no puede pagar ni cancelar desde su portal.

Se implementa un **mecanismo de pago provisional** (botón mock, listo para pasarela real) y una **cancelación con motivo obligatorio y auditable**.

### 0.1 Resultado esperado

1. `POST /citas` crea la cita en estado **`pendiente`** (no `confirmada`), con `payment_status='pendiente'`.
2. `POST /citas/{id}/pago` (mock) deja la cita **`confirmada`** y `payment_status='pagada'`.
3. Cancelar exige **motivo**; sin motivo ⇒ 400; con motivo ⇒ `cancelada` + `motivo_cancelacion` persistido + traza de auditoría.
4. El paciente puede **pagar** y **cancelar** desde su portal; el terapeuta/asistente confirma pago (efectivo) y cancela con motivo desde su agenda.
5. La pasarela queda detrás de un puerto (`PasarelaPagosPort`); hoy hay un adapter mock, mañana uno real sin tocar el caso de uso.

### 0.2 Decisiones adoptadas

| # | Decisión |
| :-- | :-- |
| D-1 | **Reutilizar** el estado `pendiente` (no crear `pendiente_pago`); distinguir por `bloqueada_por_normativa` + `paymentStatus`. |
| D-2 | **Consentimiento primero, pago después**: un menor sin consentimiento (`bloqueadaPorNormativa=true`) no puede pagar. |
| D-3 | Pueden confirmar pago **paciente** (`MIS_CITAS_PAGAR`) y **terapeuta/asistente** (`AGENDA_GESTIONAR`). |
| D-4 | **Expiración de impagas**: aplazada (documentada como pendiente futura, no implementada). |
| D-5 | **Cancelación con motivo obligatorio** (lista cerrada + "Otro" con detalle) en portal y agenda; auditable. |
| D-6 | **Permisos nuevos**: `perm-029 = MIS_CITAS_PAGAR`, `perm-030 = MIS_CITAS_CANCELAR` (módulo `AGENDA`), solo rol `patient`. |
| D-7 | **Concurrencia anti doble cobro**: índice único parcial `ux_pagos_cita_pagado` + validación de estado en el caso de uso (no `@Version` para no añadir columna). |
| D-8 | `payment_status='exenta'` no nace automático: lo asigna el staff (cortesía) y se confirma con `PATCH estado`; no muestra "Pagar". |
| D-9 | **Monto del pago** se resuelve del terapeuta: `costoPrimeraSesion` si `tipo_cita='primera'`, `costoSeguimiento` en caso contrario (`TerapeutaConfig` del contexto `paciente`). |

---

## 1. Brecha documental

La brecha completa está en `gap-report-pagos-cancelacion-citas.md`. Resumen:

| ID | Tipo | Brecha |
| :-- | :-- | :-- |
| GAP-PAGO-01 | INCORRECT | `CitaRestMapper.toDomain()` hardcodea `estadoCita("confirmada")`. |
| GAP-PAGO-02 | MISSING | No existe caso de uso para confirmar el pago de una cita. |
| GAP-PAGO-03 | MISSING | No hay abstracción de pasarela de pagos. |
| GAP-PAGO-04 | MISSING | No hay endpoint para que el paciente pague. |
| GAP-PAGO-05 | PARTIAL | Vocabulario `pagada/pendiente/exenta` vs `pagado/pendiente/parcial/reembolsado`. |
| GAP-PAGO-06 | MISSING | No existe `motivo_cancelacion` (ni detalle) en dominio/entidad/DTO/BD. |
| GAP-PAGO-07 | PARTIAL | `CitaEstadoRequest`/`actualizarEstado` no reciben motivo. |
| GAP-PAGO-08 | MISSING | La cancelación no queda en auditoría (y `ck_auditoria_exp_categoria` no incluye `'citas'`). |
| GAP-PAGO-09 | MISSING | El paciente no puede cancelar (endpoint + mapeo de excepciones del portal). |
| GAP-PAGO-10 | MISSING | Portal paciente sin botones "Pagar"/"Cancelar". |
| GAP-PAGO-11 | PARTIAL | Agenda del terapeuta cancela sin motivo. |
| GAP-PAGO-12 | MISSING | Sin tests de pago/cancelación. |
| GAP-PAGO-13 | MISSING+DATA | Permisos `MIS_CITAS_PAGAR`/`MIS_CITAS_CANCELAR` (rol patient). |
| GAP-PAGO-14 | MISSING | Concurrencia/idempotencia del pago. |
| GAP-PAGO-15 | MISSING | Regla de `payment_status='exenta'`. |
| GAP-PAGO-16 | DATA | Backfill histórico + alineación del mock demo. |
| GAP-PAGO-17 | CONTRACT | Contrato de permisos y endpoint de listado del portal. |

---

## 2. Modelo de datos — `V39__pagos_cancelacion_citas.sql`

```sql
-- =============================================================================
-- V39: Pagos provisionales y cancelación de citas con motivo (SDOP)
-- Sucede a V38. Idempotente.
-- =============================================================================

-- 1. Columnas de cancelación ---------------------------------------------------
ALTER TABLE citas ADD COLUMN IF NOT EXISTS motivo_cancelacion VARCHAR(30);
ALTER TABLE citas ADD COLUMN IF NOT EXISTS motivo_cancelacion_detalle VARCHAR(255);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
                   WHERE c.conname = 'ck_citas_motivo_cancelacion' AND t.relname = 'citas') THEN
        ALTER TABLE citas ADD CONSTRAINT ck_citas_motivo_cancelacion
            CHECK (motivo_cancelacion IS NULL OR motivo_cancelacion IN
                   ('EMERGENCIA','NO_PUEDE_ASISTIR','CAMBIO_DE_PLANES','MOTIVO_CLINICO','OTRO'));
    END IF;
END $$;

-- 2. Backfill histórico (semilla V6) -------------------------------------------
UPDATE citas SET motivo_cancelacion = 'OTRO'
 WHERE id = 'cit-006' AND estado_cita = 'cancelada' AND motivo_cancelacion IS NULL;

UPDATE citas SET payment_status = 'exenta'
 WHERE estado_cita = 'confirmada' AND payment_status = 'pendiente';

-- 3. Auditoría: permitir categoría 'citas' -------------------------------------
ALTER TABLE auditoria_expediente DROP CONSTRAINT IF EXISTS ck_auditoria_exp_categoria;
ALTER TABLE auditoria_expediente ADD CONSTRAINT ck_auditoria_exp_categoria
    CHECK (categoria IN ('expediente','sesion','ia','reporte','seguridad','riesgo','pagos','citas'));

-- 4. Permisos PBAC (solo patient) ---------------------------------------------
INSERT INTO permisos (id, codigo, modulo, descripcion) VALUES
    ('perm-029', 'MIS_CITAS_PAGAR',    'AGENDA', 'Pagar la cita propia del paciente autenticado'),
    ('perm-030', 'MIS_CITAS_CANCELAR', 'AGENDA', 'Cancelar una cita propia del paciente autenticado con motivo')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT 'rol-006', id FROM permisos WHERE codigo IN ('MIS_CITAS_PAGAR','MIS_CITAS_CANCELAR')
ON CONFLICT (rol_id, permiso_id) DO NOTHING;

-- 5. Anti doble cobro (índice único parcial) ------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS ux_pagos_cita_pagado
    ON pagos (cita_id) WHERE estado = 'pagado' AND cita_id IS NOT NULL;
```

**Notas**:
- `motivo_cancelacion` **nullable** + CHECK con `IS NULL`: obliga la lista cerrada sin romper filas existentes.
- El DROP+ADD de `ck_auditoria_exp_categoria` es **indispensable** (hoy no existe `'citas'`).
- El backfill se ejecuta **después** de crear las columnas y el CHECK.

---

## 3. Backend (hexagonal)

### 3.1 Cambio de default — `CitaRestMapper.toDomain()`

```text
.estadoCita("pendiente")     // antes "confirmada"
.paymentStatus("pendiente")  // sin cambios
```

### 3.2 Dominio — `Cita` y `CitaJpaEntity`

Añadir:
- `Cita.motivoCancelacion` + `Cita.motivoCancelacionDetalle` (String, nullable).
- `CitaJpaEntity` → columnas `motivo_cancelacion` + `motivo_cancelacion_detalle`.
- Mapear en `CitaPersistenceMapper` (toDomain/toJpa) y en `CitaRestMapper` (request/response).

### 3.3 Puerto de salida — `PasarelaPagosPort` (nuevo)

```text
ResultadoCobro cobrar(String citaId, BigDecimal monto, String concepto);
// record ResultadoCobro(boolean exito, String referencia)
```

- `PasarelaPagosMockAdapter` (nuevo): devuelve `exito=true` con referencia mock `"mock-<uuid>"`.
- La pasarela real futura será otro adapter; el caso de uso **no** cambia.

### 3.4 Caso de uso — `ConfirmarPagoCitaUseCase` (nuevo, puerto de entrada)

Firma:

```text
Cita confirmarPago(String citaId);
```

Implementación en `CitaApplicationService` (o servicio dedicado), `@Transactional`:

1. `cita = citaRepositoryPort.findById(citaId)` → 404 si no existe.
2. **Pertenencia/alcance**:
   - rol `patient` → validar `cita.pacienteId == identidadAutenticadaPort.pacienteId()` (claim), si no ⇒ 403.
   - staff (`AGENDA_GESTIONAR`) → validar alcance con `resolverAlcanceTerapeutas()` (anti-IDOR horizontal).
3. **Estado**:
   - si `estadoCita == 'confirmada'` **y** `paymentStatus == 'pagada'` → retornar la misma (idempotente).
   - si `estadoCita == 'confirmada'` y `paymentStatus == 'pendiente'` → 409 (estado ambiguo).
   - si `paymentStatus == 'exenta'` → 409 (no exige pago).
   - si `estadoCita != 'pendiente'` → 409.
4. **Bloqueo normativo**: si `bloqueadaPorNormativa == true` → **403** (consentimiento primero).
5. **Resolver monto** (D-9): `monto = (tipoCita == 'primera' || tipoCita == 'cierre' ? (tipoCita == 'primera' ? costoPrimeraSesion : costoSeguimiento) : costoSeguimiento)`, simplificado: `monto = tipoCita.equals("primera") ? costoPrimeraSesion : costoSeguimiento`. Leer vía el **puerto de salida** `TerapeutaConfigRepositoryPort.findById(terapeutaId)` (contexto `paciente`), **NO** vía `ObtenerConfigTerapeutaUseCase` (aplica alcance de staff y rechazaría 403 a un paciente). Acoplamiento `cita ↔ paciente` documentado (igual que en el expediente en alta).
6. `resultado = pasarelaPagosPort.cobrar(citaId, monto, concepto)`; si `!exito` → excepción de pago (409).
7. `cita.paymentStatus = 'pagada'`; `cita.estadoCita = 'confirmada'`; `citaRepositoryPort.save(cita)`.
   - Concurrencia: si la violación del índice único `ux_pagos_cita_pagado` dispara `DataIntegrityViolationException`, traducirla a **409 idempotente** (o devolver la cita ya confirmada). No `@Version` (D-7).
8. **Registrar Pago** vía `pagoRepositoryPort.save(Pago)` fijando los campos obligatorios: `id = "pay-" + UUID.randomUUID()...` (⚠️ `PagoPersistenceAdapter.save` NO genera id; solo lo hace `PagoApplicationService.registrar`), `pacienteId`, `citaId`, `fecha = LocalDate.now(ZONA)`, `metodo = 'transferencia'` (mock determinista; CHECK `efectivo|transferencia|tarjeta|otro`), `monto`, `concepto`, `estado = 'pagado'`, `registradoPorId = identidadAutenticadaPort.sub()`. NO usar `PagoApplicationService.registrar` (su auditoría es `REQUIRES_NEW` y generaría doble traza).
9. **Auditoría** única: `auditoriaExpedientePort.registrarEnMismaTransaccion(pacienteId, actorId, "Confirmación de pago de cita", detalle, "pagos")`.

### 3.5 Cancelación con motivo — `ActualizarEstadoCitaUseCase`

Ampliar firma:

```text
Cita actualizarEstado(String id, String estado, String motivo, String motivoDetalle);
```

Reglas:
0. **Pertenencia del paciente**: si el actor es rol `patient` → validar `cita.pacienteId == identidadAutenticadaPort.pacienteId()` (claim), si no ⇒ **403**.
1. Validar transición (`pendiente`/`confirmada`/`solicita_reagendar` → `cancelada`) con `TRANSICIONES_ESTADO`.
2. Si `estado == 'cancelada'`:
   - `motivo` **obligatorio** (whitelist `EMERGENCIA|NO_PUEDE_ASISTIR|CAMBIO_DE_PLANES|MOTIVO_CLINICO|OTRO`).
   - si `motivo == 'OTRO'` → `motivoDetalle` obligatorio.
   - si falta ⇒ `MotivoCancelacionObligatorioException` ⇒ **400**.
3. **Alcance del staff** con `resolverAlcanceTerapeutas()` (anti-IDOR horizontal).
4. Persistir `motivoCancelacion` (+ `motivoCancelacionDetalle`).
5. Auditoría: `registrarEnMismaTransaccion(pacienteId, actorId, "Cancelación de cita", "Motivo: " + motivo, "citas")`.

### 3.6 Endpoints REST

**`CitaRestController`**:
- `POST /citas/{id}/pago` — `@PreAuthorize("hasAnyAuthority('MIS_CITAS_PAGAR','AGENDA_GESTIONAR')")` → `confirmarPago(id)`.
- `PATCH /citas/{id}/estado` — body ampliado `{ status, motivo?, motivoDetalle? }` → `actualizarEstado(id, status, motivo, motivoDetalle)`.

**`PacientePortalRestController`** (contexto `portalpaciente`):
- `PATCH /portal-paciente/citas/{id}/cancelar` — `@PreAuthorize("hasAuthority('MIS_CITAS_CANCELAR')")`, body `{ motivo, motivoDetalle? }` → resuelve `pacienteId` desde claim y delega en `actualizarEstado`.

> ⚠️ **Mapeo de excepciones**: `CitaExceptionHandler` está acotado a `cita`; el endpoint del portal debe mapear `CitaNotFoundException` (404), `TransicionEstadoCitaInvalidaException` (409) y `MotivoCancelacionObligatorioException` (400) en `PortalPacienteExceptionHandler` (o traducirlas a excepciones propias del portal).

### 3.7 DTOs

- `CitaEstadoRequest`: añadir `String motivo`, `String motivoDetalle`.
- `CitaResponseDTO`: añadir `String motivoCancelacion`, `String motivoCancelacionDetalle`.
- Nuevo DTO de cancelación del portal: `CancelarCitaPortalRequest(String motivo, String motivoDetalle)`.

### 3.8 Excepciones

- `MotivoCancelacionObligatorioException` (nueva, `cita/domain/exception`) ⇒ **400** en `CitaExceptionHandler`.
- `CitaBloqueadaPorNormativaException` (nueva, `cita/domain/exception`) ⇒ **403** en `CitaExceptionHandler` (usada en §3.4 paso 4).
- Reutilizar `CitaNotFoundException` (404) y `TransicionEstadoCitaInvalidaException` (409).

---

## 4. Frontend

> ⚠️ **Nota de proceso**: este módulo **requiere cambios de markup** (selector de motivo en `agenda.component.html`, botones/copy/modal en los templates inline de `patient-portal.component.ts` y `cita-fila.component.ts`). La skill `demo-gap-implementation` prohíbe tocar HTML/SCSS; para esta feature debe **eximirse esa regla** o ejecutarse como tarea frontend independiente.

### 4.1 Contrato de permisos (GAP-PAGO-17)

- `core/types/clinical.types.ts`: añadir `'MIS_CITAS_PAGAR' | 'MIS_CITAS_CANCELAR'` al union `Permission`.
- `login-http.adapter.ts`: añadir ambos a `VALID_PERMISSIONS`.
- `patient-portal.component.ts`: inyectar `RoleStateService`; derivar `canPay`/`canCancel` y pasarlos al hijo.

### 4.2 Contrato de citas

- `clinical.types.ts` (`Appointment`): añadir `motivoCancelacion?` (para mostrar en el drawer de la agenda).
- `patient-portal.repository.ts` (`CitaPortal`): añadir `bloqueadaPorNormativa: boolean | null` y `motivoCancelacion?: string`.
- `patient-portal-http.adapter.ts`: mapear `bloqueadaPorNormativa`/`motivoCancelacion` y **unificar** `listarCitas()` a `GET /portal-paciente/citas`.

### 4.3 Repositorios

- `PatientPortalRepository` (clase 100% abstracta): añadir
  - `pagarCita(id): Observable<CitaPortal>`
  - `cancelarCita(id, motivo, motivoDetalle?): Observable<CitaPortal>`
  - implementar en **ambos** adaptadores (HTTP y LocalStorage).
- `AgendaRepository.actualizarEstadoCita(id, status, motivo?, motivoDetalle?)`: actualizar firma y adaptadores HTTP/LocalStorage.

### 4.4 Portal paciente (`cita-fila.component.ts` + `patient-portal.component.ts`)

- `cita-fila` permanece **presentacional**: añadir `@Output() pagar` y `@Output() cancelar`; el padre ejecuta vía `repo` y maneja loading/error.
- Visibilidad:
  - **"Pagar"**: `status==='pendiente' && paymentStatus==='pendiente' && !bloqueadaPorNormativa`.
  - **"Cancelar"**: `status` ∈ `pendiente | confirmada | solicita_reagendar` (renderizar también en la sección "Historial", donde hoy cae `solicita_reagendar`).
- Modal de **motivo reutilizable** (componente standalone, lista cerrada + "Otro" con input de detalle), usado por portal y agenda.
- Estados de UI: `loading`/`disabled` por botón (anti doble submit), mensajes de error específicos (403/409/400), recarga tras éxito.
- Actualizar el copy de "solo lectura" del portal.
- Accesibilidad: `role="dialog"`, `aria-modal`, cierre `Escape`, `aria-live` para loading/error.

### 4.5 Agenda terapeuta (`agenda.component.ts/html`)

- Añadir selector de motivo al modal `¿Cancelar esta cita?` existente; deshabilitar "Sí, cancelar" hasta elegir motivo.
- `confirmarCancelacion()` envía `motivo`/`motivoDetalle` al `PATCH`.
- **Alinear el mock demo** (`guardarCita()` y `mockData.ts app-1d/app-2/app-6c`) para el modo `agendaBackend=false`: nuevas citas en `pendiente` (salvo bloqueo normativo).

---

## 5. Verificación

- **Backend**: compilación limpia (`mvn`); arranque con Flyway aplicando `V39`.
- **API (staff)**:
  1. `POST /citas` → 201 con `status='pendiente'`, `paymentStatus='pendiente'`.
  2. `POST /citas/{id}/pago` → 200 `status='confirmada'`, `paymentStatus='pagada'`.
  3. `PATCH /citas/{id}/estado {status:'cancelada'}` sin motivo → 400; con motivo → 200 `cancelada` + `motivoCancelacion`.
  4. `GET /pagos?pacienteId=...` → existe el `Pago` registrado (`pagado`).
- **API (paciente)**: `PATCH /portal-paciente/citas/{id}/cancelar` y `POST /citas/{id}/pago` solo sobre citas propias; cita ajena ⇒ 403/404.
- **Reglas**: menor sin consentimiento ⇒ 403/409 al pagar; cita `exenta` ⇒ 409/no muestra "Pagar"; doble pago ⇒ no duplica `Pago` (índice único).
- **Frontend**: `ng build` limpio; botones visibles según reglas; cancelación con motivo desde portal y agenda.
- **E2E**: alta → pendiente; pago → confirmada; cancelación → motivo + auditoría.

---

## 6. Riesgos y observaciones

1. **Reembolso/parcial** (`GAP-PAGO-05`): fuera del alcance actual. Futuro: `parcial` ⇒ sigue `pendiente`; `reembolsado` ⇒ `cancelada` (no hay transición `confirmada→pendiente`; no ampliar máquina). Dueño: caso de uso de reembolso dedicado.
2. **`exenta`** (`GAP-PAGO-15`): solo la asigna el staff (cortesía); se confirma con `PATCH estado`. El backfill de `V39` la usa para la semilla.
3. **Pasarela real** (`GAP-PAGO-14`): el cobro ocurre antes del `save`; documentar idempotency-key + compensación ante `OptimisticLockException` cuando exista pasarela real (irrelevante con mock).
4. **`resolverAlcanceTerapeutas()` es `private`**: si `ConfirmarPagoCitaUseCase` vive en otro servicio, extraerlo a un puerto/componente compartido.
5. **Índice único parcial** protege solo el camino primario del caso de uso (`pagado` directo); el camino alternativo `PATCH /pagos/{id}/estado` queda fuera de protección (aceptable por alcance).
6. **Backfill `exenta` global**: aplica a toda cita `confirmada`+`pendiente`; es la semántica adoptada (cortesía). Confirmar antes de producción real.
7. **Mapeo de excepciones del portal** (§3.6): sin él, las excepciones de cita escapan como 500.
8. **`solicita_reagendar`** cae en "Historial" en el portal; el botón "Cancelar" debe renderizarse también ahí.
9. **Base de la rama**: `origin/develop` ya contiene `V38` (LEVA), pero el HEAD local llega a `V37`. La rama de implementación debe **nacer/rebasarse desde `origin/develop`** para que Flyway vea `V38` como predecesor de `V39`.
10. **"Otro" con detalle obligatorio**: el SDD exige `motivoDetalle` obligatorio si `OTRO` (más seguro); el gap-report §4.3 decía "opcional". Alinear el gap-report a "obligatorio".
11. **Códigos de error en el portal**: el adapter HTTP del portal debe inspeccionar `HttpErrorResponse.status` para distinguir 403/409/400 (hoy aplana todo error a un mensaje genérico).
12. **Reserva de IDs de permiso**: se optó por `perm-029`/`perm-030` (Opción B) para no colisionar con `perm-027=SEDES_LEER`/`perm-028=SEDES_GESTIONAR` que `gap-report-vista-admin-plataforma-1.md` anticipa para Sedes.

---

## 7. Estado documental

- [x] Gap-analysis (`gap-report-pagos-cancelacion-citas.md`)
- [x] Especificación backend (sección 3)
- [x] Especificación frontend (sección 4)
- [x] Migración `V39` especificada (sección 2)
- [x] Auditoría por `jarvis-database`, `jarvis-backend` y `jarvis-frontend` (correcciones incorporadas)
- [ ] Implementación
- [ ] E2E y reporte
