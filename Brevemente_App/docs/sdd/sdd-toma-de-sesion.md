# SDD-TOMA-SESION-1: Software Design Document — Toma de Sesión (cita → sesión clínica → cierre)

- **Módulos**: `cita` + `expediente` (backend Spring Boot, hexagonal) · `agenda` + `mi-consulta` + `expediente-clinico` (frontend Angular 18 standalone) · PostgreSQL/Flyway · motor `leva` (consumidor, sin cambios)
- **Código SDD**: `SDD-TOMA-SESION-1`
- **Versión**: 1.1.0
- **Fecha**: 2026-11-23
- **Estado**: ESPECIFICADO + AUDITADO — jarvis-database ✅ APROBADO · jarvis-backend ⚠️ · jarvis-frontend ⚠️ (correcciones incorporadas en v1.1.0)
- **Sucede a**: `V39__pagos_cancelacion_citas.sql` (última migración en `develop`, verificada 2026-11-23)
- **Migración nueva**: `V40__toma_de_sesion.sql` (**opcional**; solo índice de integridad + seed. La columna `sesiones.cita_id` ya existe desde V17)
- **Fuente de verdad**: `docs/gap-analysis/gap-report-toma-de-sesion.md`
- **Alineación**: ADR-001 (Hexagonal/SDOP), ADR-002 (Dual Adapters), ADR-003 (Backend hexagonal y OpenAPI)

> **Regla de Oro**: integrar vía adaptador/puerto, reutilizando/adaptando lo existente. Este documento **no** escribe código fuente; es la especificación que consumirá la implementación.

---

## 0. Propósito y alcance

Hoy, cuando llega la hora de una cita confirmada, no existe un flujo formal de **toma de sesión**: la sesión clínica no se vincula a la cita, se graba bajo un ID fabricado, no se valida consentimiento ni pago, y la cita nunca se cierra como `completada`.

Se implementa el flujo completo **cita → sesión → cierre**, reutilizando la columna `sesiones.cita_id` (ya presente en BD) y el motor LEVA (que ya funciona).

### 0.1 Resultado esperado

1. `POST /citas/{citaId}/sesion` crea la sesión `borrador` ligada a la cita y devuelve su id real (`ses-*`).
2. El audio y la propuesta LEVA se asocian al **id real** de la sesión (fin del ID fabricado).
3. Solo se puede iniciar sesión con la cita `confirmada` (`pagada`/`exenta`) y consentimiento no bloqueado; si no → 409/403.
4. Al validar la sesión, la cita vinculada transiciona automáticamente a `completada`.
5. El terapeuta arranca desde **Agenda** (o **Mi Consulta**), navega al **Expediente** con la sesión preseleccionada y obtiene feedback visual (badge "EN CURSO", banner, modales de inicio y cierre).

### 0.2 Decisiones adoptadas

| # | Decisión |
| :-- | :-- |
| D-1 | **Reutilizar** `sesiones.cita_id` (existe desde V17 con FK `fk_sesiones_cita`). No se añade columna. |
| D-2 | **Crear la sesión antes de grabar**: el id de sesión real (`ses-*`) es el que usan audio, tarea de transcripción y propuesta LEVA. |
| D-3 | Nuevo endpoint `POST /citas/{citaId}/sesion` (contexto `cita`, staff) que crea la sesión a través de `RegistroSesionPort` (ver D-12). |
| D-4 | **Gate de inicio**: cita `confirmada` con `payment_status IN ('pagada','exenta')` + `bloqueadaPorNormativa=false`. Si no → 409 (estado) / 403 (consentimiento). |
| D-5 | **Cierre automático e idempotente**: al pasar la sesión a `validado` con `citaId`, se transiciona la cita a `completada` en la misma transacción (port `CitaEstadoPort`). Pre-guard: no reintentar si la sesión ya es `validado` o la cita ya es `completada`. |
| D-6 | `SesionResponseDTO` y el tipo `Session` del frontend exponen `citaId`. |
| D-7 | Navegación: `/expedientes/:id?sesion=ses-*&modo=grabacion`; `expediente-clinico` preselecciona la sesión leyendo `queryParamMap` y abre la grabación. |
| D-8 | "Mi Consulta" se cablea: la tarjeta "Próxima Sesión" deriva su estado de `AccionDominante` y redirige al Expediente. |
| D-9 | **Sin permisos nuevos**: se reutilizan `AGENDA_GESTIONAR` + `EXPEDIENTE_ESCRIBIR`. |
| D-10 | Migración **V40 opcional**: índice único parcial `ux_sesiones_cita` (1 sesión por cita) + seed demostrativo corregido. No bloquea la implementación. |
| D-11 | **Autorización del endpoint nuevo**: `POST /citas/{citaId}/sesion` exige `AGENDA_GESTIONAR` **y** `EXPEDIENTE_ESCRIBIR` (paridad con `POST .../sesiones`). El **assistant** no inicia sesión clínica (solo gestiona agenda). |
| D-12 | **Desacoplamiento cita→expediente**: el contexto `cita` consume `RegistroSesionPort` (puerto de salida propio) con DTO minimal `SesionIniciada`; el adapter delega en `AgregarSesionUseCase` y resuelve el expediente vía el índice 1:1 `ux_expedientes_paciente` desde `pacienteId` (la cita puede no traer `expediente_id`). Sin fuga del dominio `Sesion` hacia `cita`. |
| D-13 | **El caso de uso vive en `CitaApplicationService`**: reutiliza `resolverAlcanceTerapeutas()`/`validarAlcanceStaff()` (hoy `private`). |
| D-14 | **Semántica única del cierre**: **propagar + rollback** si la transición de la cita falla (no dejar sesión `validado` con cita abierta); el pre-guard de D-5 evita reintentos. |
| D-15 | **Traducción de excepciones cross-context**: `ExpedienteNotFoundException` en `cita` → 404; excepciones de `cita` en el cierre de `expediente` gestionadas explícitamente (sin 500). |

---

## 1. Brecha documental

La brecha completa está en `gap-report-toma-de-sesion.md`. Resumen:

| ID | Tipo | Brecha |
| :-- | :-- | :-- |
| GAP-TS-01 | PARTIAL | `SesionCreateRequest`/mapper/`agregar()` no aceptan `citaId` (la columna ya existe). |
| GAP-TS-02 | CONTRACT | `SesionResponseDTO` y `Session` (frontend) no exponen `citaId`. |
| GAP-TS-03 | MISSING | No existe "iniciar sesión desde cita"; el frontend fabrica `pacienteId-sN`. |
| GAP-TS-04 | MISSING | Sin gate de consentimiento/pago al grabar. |
| GAP-TS-05 | MISSING | La cita no transiciona a `completada` al validar la sesión. |
| GAP-TS-06 | MISSING | Agenda sin botón "Atender" ni navegación. |
| GAP-TS-07 | MISSING | `expediente-clinico` no lee query params (`sesion`, `modo`). |
| GAP-TS-08 | PARTIAL | Mi Consulta decorativa para tomar sesión. |
| GAP-TS-09 | MISSING | Sin modales/badges/banner de estado de sesión. |
| GAP-TS-10 | MISSING | Sin tests de integración del flujo. |
| GAP-TS-11 | DATA | Sin seed demostrativo "cita + sesión en curso". |
| GAP-TS-12 | MISSING | Sin integridad "1 sesión por cita". |

---

## 2. Modelo de datos — `V40__toma_de_sesion.sql` (opcional)

No se requiere columna nueva. Si se aplica, contiene:

```sql
-- =============================================================================
-- V40: Toma de sesión (SDOP) — integridad 1 sesión por cita + seed demostrativo
-- Sucede a V39. Idempotente.
-- =============================================================================

-- 1. Índice único parcial: una cita a lo sumo una sesión ----------------------
CREATE UNIQUE INDEX IF NOT EXISTS ux_sesiones_cita
    ON sesiones (cita_id)
    WHERE cita_id IS NOT NULL;

-- 2. Seed demostrativo: cita confirmada (exenta post-V39) + sesión borrador -----
INSERT INTO citas (id, paciente_id, terapeuta_id, expediente_id,
                   fecha_hora_inicio, fecha_hora_fin, tipo_cita, modalidad,
                   estado_cita, duracion_minutos, consultorio, payment_status,
                   bloqueada_por_normativa)
VALUES ('cit-demo', 'pac-002', 'ter-001', 'exp-002',
        '2026-11-23T09:00:00-06:00', '2026-11-23T09:45:00-06:00',
        'seguimiento', 'PRESENCIAL', 'confirmada', 45, 'A', 'exenta', FALSE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO sesiones (id, expediente_id, numero, fecha, status, creado_por_id, cita_id, notas)
VALUES ('ses-demo-1', 'exp-002', 4, CURRENT_DATE, 'borrador', 'ter-001', 'cit-demo',
        'Seed demo: sesión en curso vinculada a cita confirmada.')
ON CONFLICT (id) DO NOTHING;
```

> **Nota**: `sesiones.cita_id` ya tiene FK `fk_sesiones_cita ON DELETE SET NULL` e índice `idx_sesiones_cita` desde V17. El índice único parcial es la única novedad.

---

## 3. Contratos API

### 3.1 Iniciar sesión desde cita (nuevo)

```
POST /api/v1/citas/{citaId}/sesion
Authorization: Bearer <JWT>
Permiso: AGENDA_GESTIONAR + EXPEDIENTE_ESCRIBIR (+ alcance sobre la cita)
```

**Respuesta**: `201 Created` con `SesionIniciadaResponseDTO` (DTO minimal propio del contexto `cita`).

```json
{
  "id": "ses-abc12345",
  "patientId": "pac-001",
  "number": 3,
  "date": "2026-11-23",
  "status": "borrador",
  "citaId": "cit-001"
}
```

**Errores**:
- `404` — cita no existe o el paciente no tiene expediente.
- `403` — fuera del alcance del staff (`PacienteAjenoAlTerapeutaException`) o consentimiento bloqueado por normativa (`bloqueadaPorNormativa=true`).
- `409` — cita no está `confirmada` o `payment_status ∉ {pagada, exenta}`; o la cita ya tiene una sesión vinculada.

### 3.2 Crear sesión (existente, extendido)

```
POST /api/v1/expedientes/paciente/{pacienteId}/sesiones
Permiso: EXPEDIENTE_ESCRIBIR
```

`SesionCreateRequest` gana el campo opcional `citaId`:

```json
{ "number": 3, "date": "2026-11-23", "citaId": "cit-001", "phase": "..." }
```

Reglas de validación (en `SesionApplicationService.agregar`):
- Si `citaId` viene presente, la cita debe existir y pertenecer al mismo `pacienteId` (anti-IDOR); si no → 400/404.
- Si la cita ya tiene una sesión vinculada (por índice único) → 409.

### 3.3 Validar sesión (existente, extendido)

```
PATCH /api/v1/expedientes/sesiones/{sesionId}
Permiso: EXPEDIENTE_ESCRIBIR
Body: { "status": "validado", ... }
```

Efecto nuevo: si `status='validado'` y la sesión tiene `citaId`, se transiciona la cita a `completada` en la misma transacción.

### 3.4 Respuesta de sesión (extendido)

`SesionResponseDTO` añade el campo `citaId` (nullable). Afecta a `GET /expedientes/paciente/{id}/sesiones`, `GET /expedientes/sesiones/borradores`, `POST .../sesiones` y `PATCH /expedientes/sesiones/{id}`.

---

## 4. Backend — Diseño hexagonal

### 4.1 Contexto `cita` — caso de uso de inicio

- **Nuevo puerto de entrada** `IniciarSesionDesdeCitaUseCase`:
  ```java
  SesionIniciada iniciarSesion(String citaId, UsuarioAutenticado actor);
  ```
  (`actor` solo aporta `sub()`/`terapeutaIds()`; el alcance se resuelve internamente vía `identidadAutenticadaPort`.)
- **Implementación en `CitaApplicationService`** (D-13): reutiliza `resolverAlcanceTerapeutas()` y `validarAlcanceStaff(Cita)` (hoy `private`), sin extraerlos a un helper.
  1. `citaRepositoryPort.findById(citaId)` → 404 (`CitaNotFoundException`).
  2. `validarAlcanceStaff(cita)` → anti-IDOR (la identidad sale del port inyectado, no del parámetro).
  3. `cita.estadoCita == 'confirmada'` **y** `cita.paymentStatus ∈ {'pagada','exenta'}` → si no, `TransicionEstadoCitaInvalidaException` (409).
  4. `pacienteConsentimientoPort.estaBloqueadoPorNormativa(cita.pacienteId)` → si `true`, `CitaBloqueadaPorNormativaException` (403).
  5. Delegar en `RegistroSesionPort.iniciar(pacienteId, fecha, citaId, actor.sub(), actor.terapeutaIds())` (D-12).
- **Nuevo puerto de salida** `RegistroSesionPort` (contexto `cita`) con DTO minimal `SesionIniciada(id, pacienteId, numero, fecha, status, citaId)`. El adapter `SesionRegistroAdapter` delega en `AgregarSesionUseCase` (contexto `expediente`). No se filtra el dominio `Sesion` a `cita`.
- **Nuevo endpoint** en `CitaRestController`: `POST /citas/{citaId}/sesion` con `@PreAuthorize("hasAuthority('AGENDA_GESTIONAR') and hasAuthority('EXPEDIENTE_ESCRIBIR')")` (D-11). Respuesta: DTO propio del contexto `cita` (`SesionIniciadaResponseDTO`) construido desde `SesionIniciada`; no reutilizar `SesionResponseDTO` cross-context (mantener fronteras limpias).
- **Traducción de excepción** (D-15): si `RegistroSesionPort` lanza `ExpedienteNotFoundException` (paciente sin expediente), traducirla a 404 (handler en `cita` o rethrow de una excepción propia del contexto).

### 4.2 Contexto `expediente` — soporte de `citaId` y cierre

- `SesionCreateRequest` + `SesionRestMapper.toDomain()` + `SesionResponseDTO` + `SesionRestMapper.toResponse()` incorporan `citaId`.
- `SesionApplicationService.agregar()`: asignar `citaId` si viene; validar coherencia paciente↔cita (usando `SesionRepositoryPort.findByCitaId` para el guard 409 y un port de lectura de cita para la pertenencia).
- `SesionApplicationService.actualizar()`: cuando `datosParciales.status == 'validado'` y `target.citaId != null`:
  1. **Pre-guard de idempotencia** (D-5): si `target.status` ya es `validado`, o la cita ya está `completada`, **no** transicionar.
  2. Guardar la sesión y luego invocar `CitaEstadoPort.marcarCompletada(target.citaId)`.
  3. Si la transición falla, **propagar la excepción** (rollback total) — D-14.
- **Nuevo puerto de salida** `CitaEstadoPort` (contexto `expediente`) con dos operaciones:
  - `estaCompletada(citaId)` → lectura del estado de la cita (para el pre-guard de idempotencia de D-5; puede reutilizar el port de lectura de cita de §4.2).
  - `marcarCompletada(citaId)` → adapter que delega en `ActualizarEstadoCitaUseCase.actualizarEstado(citaId, 'completada', null, null)`.
- Auditoría: registrar "Inicio de sesión desde cita" (categoría `sesion`, ya permitida) y "Sesión validada → cita completada".

### 4.3 Mapeo de excepciones

- `CitaExceptionHandler` (contexto `cita`) para el endpoint nuevo: `TransicionEstadoCitaInvalidaException → 409`, `CitaBloqueadaPorNormativaException → 403`, `PacienteAjenoAlTerapeutaException → 403`, `CitaNotFoundException → 404`.
- **Cross-context (D-15)**:
  - En `cita`: `ExpedienteNotFoundException` (paciente sin expediente) → 404.
  - En `expediente` (cierre): si `CitaEstadoPort` lanza `CitaNotFoundException`/`TransicionEstadoCitaInvalidaException`, el pre-guard de D-5 debe impedirlo; si aun así ocurre, se propaga (rollback) y el `ExpedienteExceptionHandler` debe mapearlas (409/404) para no devolver 500.

---

## 5. Frontend — Diseño de flujo

### 5.1 Agenda (`agenda.component.ts`)

- En cada cita `confirmada` + `paymentStatus ∈ {'pagada','exenta'}`, renderizar botón **"Atender"**.
- Al pulsarlo, abrir `ModalIniciarSesion` (nuevo) que muestra:
  - Paciente, hora, tipo, modalidad.
  - Checks: consentimiento de grabación ✓ / pago registrado ✓ (los datos ya vienen en `Appointment` / `AccionDominante`).
- Al confirmar: `agendaRepository.iniciarSesion(citaId)` → `POST /citas/{citaId}/sesion` → con la sesión devuelta, `router.navigate(['/expedientes', pacienteId], { queryParams: { sesion: sesion.id, modo: 'grabacion' } })`.

### 5.2 Expediente (`expediente-clinico.component.ts`)

- En `ngOnInit`, suscribirse tanto a `route.paramMap` como a `route.queryParamMap`:
  - `sesion` → `selectedSession = sessions.find(s => s.id === querySesion)` (no dejar que `obtenerSesiones` auto-seleccione `s[0]`).
  - `modo=grabacion` → dejar el panel de grabación visible (estado `IDLE`, botón "Grabar" en foco).
- **Eliminar TODOS los IDs fabricados** (son tres):
  1. `currentSessionId` → **solo** `selectedSession.id`.
  2. El fallback `defaultSessionId = pacienteId + '-s1'` en `cargarDatos()`.
  3. El fallback del template `[sessionId]="selectedSession?.id || (pacienteId + '-s' + (sessions.length || 1))"` (~HTML línea 1168, pasado a `LevaProposalReview`).
  Si no hay sesión, se exige crearla primero (desde Agenda/Mi Consulta); ya no se graba ni se propone contra un id inventado.
- Badge de estado: derivar de `selectedSession.status` + `selectedSession.citaId`:
  - `borrador` con `citaId` → **"EN CURSO"**.
  - `validado` → **"VALIDADO"**.
- Banner contextual cuando `selectedSession.citaId` está presente: "Sesión en curso — cita asociada".
- `onProposalApproved()`: ya llena los campos y pone `status='validado'` (esto ahora dispara el cierre de la cita en backend). Tras el OK, abrir `ModalCierreSesion`.

### 5.3 Mi Consulta (`mi-consulta.component.ts`)

- La tarjeta "Próxima Sesión Clínico-Estratégica" deja de ser decorativa:
  - `AccionDominante.citaId` + `consentimientoFirmado` determinan el botón:
    - Cita confirmada sin sesión → **"Atender / Preparar Sesión →"** (navega al Expediente con `modo=grabacion` tras crear la sesión).
    - Sesión en curso → **"Continuar Sesión →"**.
    - Sesión validada → check "✓ Sesión registrada".
- Reutiliza el mismo flujo de `agenda` (crear sesión → navegar).

### 5.4 Componentes nuevos

| Componente | Responsabilidad |
| :--- | :--- |
| `ModalIniciarSesion` | Confirmación de inicio con checks de consentimiento/pago; dispara `POST /citas/{id}/sesion`. |
| `ModalCierreSesion` | Resumen post-aprobación (dx, protocolo, audio, nota SOAP) + botones "Ver nota SOAP" / "Volver a Agenda". |
| `BannerSesionEnCurso` (o bloque inline) | Contexto visual "Sesión en curso — cita asociada". |

### 5.5 Contrato de repositorios

- `AgendaRepository` (abstracto) gana `iniciarSesion(citaId): Observable<Session>` — implementar en **ambos** adaptadores (HTTP y LocalStorage).
- `ExpedienteRepository` (abstracto) — `agregarSesion` ya existe; añadir `citaId` al tipo `Session` y permitir enviarlo. **Tipar** los objetos `nuevaSesion` de `onProposalApproved`/`aplicarPropuestaAlExpediente` (hoy `any`) para incluir `citaId` con type-safety.
- `Session` (`clinical.types.ts`) gana `citaId?: string`.
- **Mock demo determinista**: el adaptador LocalStorage de expediente debe generar ids `ses-*` y resolver por `id` (hoy filtra solo por `patientId` y tiene un fallback `slice(0,3)` que devuelve sesiones ajenas; eliminar/ajustar ambos), para que `?sesion=` funcione con `features.expedienteClinicoBackend=false`.
- Navegación centralizada (evitar lógica duplicada): helper `iniciarSesionDesdeCita(cita)` compartido entre `agenda` y `mi-consulta`.

---

## 6. Permisos (PBAC)

**Sin permisos nuevos.** Se reutilizan:

| Acción | Permiso | Rol típico |
| :--- | :--- | :--- |
| `POST /citas/{id}/sesion` | `AGENDA_GESTIONAR` + `EXPEDIENTE_ESCRIBIR` | therapist, admin_platform |
| `POST /expedientes/paciente/{id}/sesiones` | `EXPEDIENTE_ESCRIBIR` | therapist, admin |
| `PATCH /expedientes/sesiones/{id}` | `EXPEDIENTE_ESCRIBIR` | therapist, admin |
| Cita → `completada` (interno backend) | — (port interno) | — |

> **Nota (D-11)**: el endpoint nuevo exige **ambos** permisos. El **assistant** (`AGENDA_GESTIONAR` sin `EXPEDIENTE_ESCRIBIR`) no inicia sesión clínica; `admin_clinical` no tiene `AGENDA_GESTIONAR` (revocado en V6). El botón "Atender" del frontend solo se muestra a roles con ambos permisos.

---

## 7. Pruebas (Quality Gates)

### 7.1 Integración (backend)

1. `POST /citas/{citaId}/sesion` con cita `confirmada` (`pagada` o `exenta`) + consentimiento OK → `201`, sesión `borrador` con `citaId` y `numero` correcto.
2. Cita `pendiente` (impaga) → `409`.
3. Cita con `bloqueadaPorNormativa=true` → `403`.
4. Staff sin alcance sobre la cita → `403`.
5. `PATCH /expedientes/sesiones/{id}` con `status='validado'` y `citaId` → la cita queda `completada`.
6. Re-validar una sesión ya `validado` (o cita ya `completada`) → **no** reintenta la transición (idempotente, sin 409).
7. Doble `POST /citas/{id}/sesion` → `409` (por `findByCitaId` o índice único si V40 aplicado).
8. `assistant` sin `EXPEDIENTE_ESCRIBIR` → `403`.

### 7.2 Frontend (unitario/E2E)

- Agenda: "Atender" solo visible en cita `confirmada` + `paymentStatus ∈ {pagada, exenta}`.
- Navegación con query params preselecciona la sesión y muestra el panel de grabación.
- Badge "EN CURSO" → "VALIDADO" tras aprobar propuesta.
- `ModalCierreSesion` se abre tras aprobar.

### 7.3 Cobertura

- ≥ 80% en los casos de uso nuevos (`IniciarSesionDesdeCitaUseCase`, cierre en `SesionApplicationService`).

---

## 8. Plan de implementación (secuencial)

1. **Backend** (GAP-TS-01/02): `citaId` en request/mapper/service/DTO + `CitaEstadoPort` + cierre en `actualizar`.
2. **Backend** (GAP-TS-03/04): `IniciarSesionDesdeCitaUseCase` + `POST /citas/{citaId}/sesion` + handlers de excepción.
3. **Migración V40 opcional** (GAP-TS-12): índice único parcial + seed.
4. **Frontend** (GAP-TS-06/07): `Session.citaId`, botón "Atender" + navegación, lectura de query params, eliminar id fabricado.
5. **Frontend** (GAP-TS-08/09): cablear Mi Consulta + modales + badges/banner.
6. **QA** (GAP-TS-10): tests de integración y E2E.
7. **Auditoría**: jarvis-security (OWASP — anti-IDOR en `citaId`) y jarvis-reviewer (SOLID/DRY).

---

## 9. Notas y riesgos

- **IDOR**: `citaId` nunca se confía del body/path sin validar pertenencia paciente↔cita y alcance del staff.
- **Atomicidad del cierre (D-14)**: la transición cita→`completada` se ejecuta en la misma transacción que la validación de la sesión. Si falla, se **propaga y hace rollback** (no queda sesión `validado` con cita abierta); el pre-guard de D-5 evita reintentos idempotentes.
- **Compatibilidad con el mock demo**: los adaptadores LocalStorage (`agenda`/`expediente`/`mi-consulta`) deben reflejar el mismo flujo e ids deterministas para `features.*Backend=false`.
- **LEVA sin cambios**: el motor ya acepta `sessionId` libre; con la sesión creada antes, se usa el id real.

---

## 10. Changelog de auditoría (v1.1.0)

| # | Origen | Corrección incorporada |
| :-- | :-- | :-- |
| 1 | jarvis-database | Gate de pago ampliado a `payment_status IN ('pagada','exenta')` (post-V39 las confirmadas de semilla son `exenta`). |
| 2 | jarvis-database | Seed V40 corregido: `numero=4` (exp-002 ya tiene `numero=3`) y `pac-002` con `payment_status='exenta'`. |
| 3 | jarvis-database | Si la cita no tiene expediente, derivarlo desde `paciente_id` (1:1) al crear la sesión. |
| 4 | jarvis-backend | Caso de uso en `CitaApplicationService` (los helpers de alcance son `private`). |
| 5 | jarvis-backend | `RegistroSesionPort` + DTO minimal para no filtrar el dominio `Sesion` a `cita`. |
| 6 | jarvis-backend | Idempotencia del cierre (pre-guard) y semántica única "propagar + rollback". |
| 7 | jarvis-backend | Traducción de excepciones cross-context (sin 500). |
| 8 | jarvis-backend | Permisos: endpoint exige `AGENDA_GESTIONAR` **y** `EXPEDIENTE_ESCRIBIR`; corrige roles (`admin_clinical` sin `AGENDA_GESTIONAR`). |
| 9 | jarvis-frontend | Eliminar **los tres** ids fabricados (`currentSessionId`, `defaultSessionId` y el fallback del template HTML). |
| 10 | jarvis-frontend | Leer `queryParamMap` y preseleccionar por id (no auto-seleccionar `s[0]`). |
| 11 | jarvis-frontend | Tipar objetos `nuevaSesion` e ids deterministas `ses-*` en el mock LocalStorage. |
| 12 | jarvis-backend (ronda 2) | Firma del helper: `validarAlcanceStaff(Cita)` (sin `actor`); identidad desde el port inyectado. |
| 13 | jarvis-backend (ronda 2) | `CitaEstadoPort.estaCompletada(citaId)` para el pre-guard de idempotencia. |
| 14 | jarvis-backend (ronda 2) | Respuesta del endpoint con DTO propio `SesionIniciadaResponseDTO` (no `SesionResponseDTO` cross-context). |
| 15 | jarvis-frontend (ronda 2) | Tercer id fabricado en el template (`HTML ~1168`) + fallback `slice(0,3)` del mock. |
