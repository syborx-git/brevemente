# GAP Analysis Report: Toma de Sesión (cita → sesión clínica → cierre)

- **Fecha**: 2026-11-23
- **Rama**: `develop`
- **Alcance**: Contextos `cita` + `expediente` (+ `leva` como consumidor) en backend hexagonal, y módulos `agenda` + `mi-consulta` + `expediente-clinico` en frontend Angular.
- **Estado**: AUDITADO (READ-ONLY) · **v1.1.0** (correcciones de auditoría jarvis incorporadas)
- **Nota de versionado Flyway**: última migración aplicada **V39** (`V39__pagos_cancelacion_citas.sql`). La próxima, si se requiere, será **V40** (opcional, ver GAP-TS-12).

---

## 1. Contexto y problema

Ya está resuelto el ciclo de las **citas** (alta → `pendiente` → pago → `confirmada` → cancelación con motivo). Pero cuando **llega la hora de la cita** no existe un flujo formal de "tomar la sesión":

- No hay vínculo real entre la cita y la sesión clínica (`sesiones.cita_id` existe en BD pero nunca se llena por API).
- La sesión se graba dentro del Expediente usando un **ID fabricado** cuando el paciente aún no tiene sesión (`pacienteId + '-sN'`), desvinculando audio y propuesta LEVA de la sesión real.
- No se valida consentimiento ni pago al iniciar la grabación.
- Al terminar, la cita **no** transiciona a `completada`.
- "Mi Consulta" muestra la tarjeta "Próxima Sesión" con botones decorativos (sin manejadores).

Flujo objetivo (mecanismo de sesión alineado con el flujo de citas ya implementado):

```text
Cita confirmada (pagada/exenta)  ──►  "Atender / Iniciar sesión"
        │
        ▼
Crear sesión (borrador) ligada a la cita (sesiones.cita_id)  ──►  id real ses-*
        │
        ▼
Grabar audio  ──►  transcribir (Whisper)  ──►  propuesta LEVA (PROPOSED)
        │
        ▼
Terapeuta aprueba (Human-in-the-loop)  ──►  sesión validada + datos llenados
        │
        ▼
Cita transiciona a completada  ──►  auditoría con traza cita→sesión
```

---

## 2. Estado actual verificado (inventario de reutilización)

| Elemento | Estado |
| :--- | :--- |
| BD `sesiones.cita_id` | **Ya existe** (V17: `ALTER TABLE sesiones ADD COLUMN IF NOT EXISTS cita_id VARCHAR(36)` + FK `fk_sesiones_cita ON DELETE SET NULL` + índice `idx_sesiones_cita`). Backfill `ses-001→cit-001`, `ses-002→cit-002`. |
| `Sesion` (dominio) | **Ya tiene** campo `citaId`. |
| `SesionJpaEntity` | **Ya tiene** columna `cita_id`. |
| `SesionCreateRequest` | **Sin** `citaId`. |
| `SesionRestMapper.toDomain()` | **No** mapea `citaId`. |
| `SesionApplicationService.agregar()` | **No** asigna `citaId` (aunque el dominio lo soporta). |
| `SesionResponseDTO` | **Sin** `citaId`. |
| `SesionUpdateRequest` | **Sin** `citaId` (PATCH no lo requiere). |
| `POST /expedientes/paciente/{pacienteId}/sesiones` | Existe, exige `EXPEDIENTE_ESCRIBIR`. Crea sesión `borrador` con `numero` autoincremental. **No acepta citaId**. |
| Máquina de estados de cita | `confirmada → completada|cancelada|ausente|no_presentado` (en `CitaApplicationService.TRANSICIONES_ESTADO`). La transición a `completada` **ya es legal** vía `PATCH /citas/{id}/estado` (`AGENDA_GESTIONAR`). |
| Consentimiento (normativa) | `pacienteConsentimientoPort.estaBloqueadoPorNormativa(pacienteId)` disponible en contexto `cita` (ya se usa en el flujo de pago). |
| LEVA | `LevaOrchestrationService.startSessionTranscription(sessionId, file, lang)` acepta `sessionId` libre (V31 relajó FK). `LevaClinicalProposal.citaId` almacena el `sessionId` usado. |
| Frontend `Session` (`clinical.types.ts`) | **Sin** `citaId`. |
| Frontend `expediente-clinico` | `currentSessionId = selectedSession?.id || pacienteId + '-s' + (sessions.length+1)` → **fabrica ID** si no hay sesión. `startRealRecording()` **sin gate** de consentimiento/pago. `onProposalApproved()` llena campos y crea la sesión **recién al aprobar**. |
| Frontend `agenda` | No hay acción "Atender". Tiene `cambiarEstado(cita, nuevoEstado)` y flujo de cancelación con motivo. Labels incluyen `completada`. |
| Frontend `mi-consulta` | `AccionDominante` **ya expone** `citaId`, `consentimientoFirmado`, `intakeListo`, `grabacionLeva`, `numeroSesion`. Los botones "Atender/Preparar" y "Detener Grabación" **no tienen handler**. |
| Rutas | `/agenda`, `/expedientes/:id`, `/mi-consulta`. `expediente-clinico` lee `params.get('id')` pero **no** lee query params. |
| Permisos | Crear sesión: `EXPEDIENTE_ESCRIBIR`; agenda/transición: `AGENDA_GESTIONAR`. **No se requieren permisos nuevos** (los terapeutas ya los tienen). |

---

## 3. Matriz de brechas (GAP-TS)

| ID | Tipo | Brecha | Impacto | Acción propuesta |
| :--- | :--- | :--- | :--- | :--- |
| GAP-TS-01 | PARTIAL | `SesionCreateRequest` / `SesionRestMapper.toDomain` / `SesionApplicationService.agregar` no aceptan ni persisten `citaId`, pese a que la columna y el dominio ya existen. | La sesión nunca queda vinculada a la cita; sin trazabilidad cita→sesión. | Añadir `citaId` al request, al mapper y asignarlo en `agregar()`. Sin migración de columna (ya existe). |
| GAP-TS-02 | CONTRACT | `SesionResponseDTO` y el tipo `Session` del frontend no exponen `citaId`. | El frontend no puede mostrar ni usar el vínculo cita→sesión. | Añadir `citaId` al DTO y a la interfaz `Session`. |
| GAP-TS-03 | MISSING | No existe caso de uso/endpoint "iniciar sesión desde cita". El frontend fabrica `pacienteId-sN` en `currentSessionId` cuando no hay sesión. | Audio y propuesta LEVA quedan "huérfanos" bajo un ID fabricado; al recargar no se recuperan (el id real `ses-*` es distinto). | Crear `IniciarSesionDesdeCitaUseCase` (contexto `cita`) + endpoint `POST /citas/{citaId}/sesion` que reutiliza `AgregarSesionUseCase` (contexto `expediente`) y devuelve la sesión con id real. |
| GAP-TS-04 | MISSING | No hay validación de **consentimiento** ni de **pago** al iniciar la grabación (`startRealRecording()` graba sin chequear nada). | Se puede grabar a un menor sin consentimiento o una cita impaga. Inconsistente con el flujo de pagos ya corregido. | Gate en `IniciarSesionDesdeCitaUseCase`: cita `confirmada` con `payment_status IN ('pagada','exenta')` (post-V39 las confirmadas de semilla son `exenta`) y `bloqueadaPorNormativa=false`; si no → 409/403. El frontend además deshabilita "Atender" si no cumple. |
| GAP-TS-05 | MISSING | Al validar la sesión, la cita **no** transiciona a `completada`. La transición ya es legal en backend, pero nadie la dispara. | La cita queda `confirmada` indefinidamente; la agenda no refleja que ya se atendió. | Al pasar la sesión a `validado`, transicionar la cita vinculada a `completada` (port `CitaEstadoPort` desde contexto `expediente` → `ActualizarEstadoCitaUseCase`). |
| GAP-TS-06 | MISSING | Agenda sin botón "Atender" ni navegación al expediente con sesión preseleccionada. | No hay punto de entrada al flujo de toma de sesión. | Botón "Atender" en fila de cita `confirmada` + `paymentStatus ∈ {pagada, exenta}` → llama `POST /citas/{citaId}/sesion` → `router.navigate(['/expedientes', pacienteId], { queryParams: { sesion, modo:'grabacion' } })`. |
| GAP-TS-07 | MISSING | `expediente-clinico` no lee query params (`sesion`, `modo`) para preseleccionar la sesión y abrir la grabación. | Al redirigir no se abre la sesión correcta; el terapeuta debe buscarla manualmente. | Leer `route.queryParamMap` en `ngOnInit`: seleccionar la sesión indicada y, si `modo=grabacion`, posicionar la UI en el panel de grabación. |
| GAP-TS-08 | PARTIAL | "Mi Consulta" es decorativa para tomar sesión: botones sin handler y `sessionState` local desconectado del backend, pese a que `AccionDominante` ya trae `citaId` y `consentimientoFirmado`. | Panel de control no funcional; duplica UI muerta. | Cablear la tarjeta "Próxima Sesión" a la navegación real (`/expedientes/:id?sesion=&modo=grabacion`) y derivar el estado de `AccionDominante`. |
| GAP-TS-09 | MISSING | No existen `ModalIniciarSesion`, `ModalCierreSesion`, badge "EN CURSO" ni banner "Sesión en curso". | El terapeuta no tiene feedback visual del estado de la sesión. | Nuevos modales (confirmación con checks de consentimiento/pago; resumen post-aprobación) + badge de estado derivado (`borrador`+cita confirmada → "EN CURSO", `validado` → "VALIDADO"). |
| GAP-TS-10 | MISSING | Sin tests de integración para el vínculo cita→sesión ni la transición a `completada`. | Regresión no detectada (ID fabricado, cita sin cerrar). | Tests: (a) `POST /citas/{id}/sesion` crea sesión `borrador` con `citaId`; (b) sesión sin consentimiento/pago → 403/409; (c) sesión `validado` ⇒ cita `completada`. |
| GAP-TS-11 | DATA | No hay semilla demostrativa "cita confirmada + sesión borrador en curso" para el paseo E2E. | Difícil validar el flujo completo sin datos. | (Opcional) seed en V40 con una cita `confirmada` ligada a una sesión `borrador`. |
| GAP-TS-12 | MISSING | No hay integridad "1 sesión por cita": `sesiones.cita_id` sin UNIQUE parcial. | Posible duplicar sesiones para la misma cita. | Migración opcional **V40**: índice único parcial `ux_sesiones_cita ON sesiones(cita_id) WHERE cita_id IS NOT NULL`. |

---

## 4. Diseño propuesto (resumen ejecutivo)

### 4.1 Iniciar sesión desde cita (backend)

```text
POST /citas/{citaId}/sesion        (staff con AGENDA_GESTIONAR + EXPEDIENTE_ESCRIBIR + alcance)
   │
   ├─ IniciarSesionDesdeCitaUseCase.iniciar(citaId, actor)
   │     1. cargar cita (404 si no existe)
   │     2. validar alcance del staff (resolverAlcanceTerapeutas) — anti-IDOR
   │     3. validar cita.estado == 'confirmada' y payment_status ∈ {'pagada','exenta'} → si no, 409
   │     4. validar consentimiento: bloqueadaPorNormativa=false → si no, 403
   │     5. RegistroSesionPort.iniciar(pacienteId, fecha, citaId, ...) → adapter a AgregarSesionUseCase:
   │        numero auto, fecha = fecha de la cita, citaId = citaId, status='borrador'
   │     6. auditoría "Inicio de sesión desde cita"
   └─ 201 SesionResponseDTO (id real ses-*, citaId incluido)
```

### 4.2 Cierre de sesión (backend)

```text
Sesion validada (PATCH /expedientes/sesiones/{sesionId} status='validado')
   │
   └─ SesionApplicationService.actualizar detecta status→'validado' y citaId != null
        └─ CitaEstadoPort.marcarCompletada(citaId)  →  ActualizarEstadoCitaUseCase('completada')
             (misma transacción; la transición confirmada→completada ya es legal)
```

### 4.3 Flujo visual (frontend)

```text
Agenda ("Atender") ──► ModalIniciarSesion (checks) ──► POST /citas/{id}/sesion
        ──► navega /expedientes/:id?sesion=ses-*&modo=grabacion
        ──► expediente-clinico preselecciona sesión + abre grabación (badge "EN CURSO")
        ──► grabar → LEVA → aprobar (LevaProposalReview)
        ──► sesión validada + badge "VALIDADO" + ModalCierreSesion
        ──► cita queda "completada" en Agenda
```

---

## 5. Recomendaciones para demo-gap-implementation

1. **Backend primero**: `citaId` en request/mapper/service/DTO (GAP-TS-01/02) → `IniciarSesionDesdeCitaUseCase` + endpoint (GAP-TS-03/04) → cierre con `CitaEstadoPort` (GAP-TS-05).
2. **Frontend**: tipo `Session.citaId`, botón "Atender" + navegación (GAP-TS-06), lectura de query params (GAP-TS-07), cablear Mi Consulta (GAP-TS-08), modales + badges (GAP-TS-09).
3. **QA**: tests de integración (GAP-TS-10).
4. **Opcional**: V40 con índice único parcial + seed (GAP-TS-11/12).
5. Conforme a ADR-001 (Hexagonal/SDOP), ADR-002 (Dual Adapters), ADR-003 (Backend hexagonal y OpenAPI).

---

## 6. Resultados de auditoría (v1.1.0)

Dos rondas de auditoría (READ-ONLY) el 2026-11-23. Las correcciones de ambas rondas están incorporadas en este documento y en `sdd-toma-de-sesion.md`.

| Agente | Ronda 1 | Ronda 2 (final) |
| :--- | :--- | :--- |
| jarvis-database | ✅ APROBADO | ✅ APROBADO |
| jarvis-backend | ⚠️ OBSERVACIONES (7) | ✅ APROBADO (4 nits no bloqueantes) |
| jarvis-frontend | ⚠️ OBSERVACIONES (6) | ⚠️ OBSERVACIONES (1 material) → corregido |

### 6.1 Correcciones clave incorporadas

1. **DB**: gate de pago ampliado a `payment_status IN ('pagada','exenta')`; seed V40 corregido (`numero=4`, `pac-002`, `exenta`); si la cita no tiene expediente, derivarlo desde `paciente_id` (1:1).
2. **Backend**: caso de uso en `CitaApplicationService` (helpers privados); `RegistroSesionPort` con DTO minimal (sin fuga de dominio); idempotencia del cierre (pre-guard) + semántica única "propagar + rollback"; traducción de excepciones cross-context; endpoint exige `AGENDA_GESTIONAR` **y** `EXPEDIENTE_ESCRIBIR` (el assistant no inicia sesión; `admin_clinical` no tiene `AGENDA_GESTIONAR`).
3. **Frontend**: eliminar **los tres** ids fabricados (`currentSessionId`, `defaultSessionId` y el fallback del template HTML); leer `queryParamMap` y preseleccionar por id; tipar `nuevaSesion`; ids deterministas `ses-*` en el mock LocalStorage.
