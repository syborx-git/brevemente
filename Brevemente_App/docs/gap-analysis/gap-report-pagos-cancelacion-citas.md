# GAP Analysis Report: Pagos Provisionales y Cancelación de Citas con Motivo

- **Fecha**: 2026-11-23
- **Rama**: `develop`
- **Alcance**: Contextos `cita` + `pago` + `portalpaciente` (backend hexagonal) y módulos `agenda` + `patient-portal` (frontend Angular)
- **Estado**: AUDITADO (READ-ONLY)
- **Decisión adoptada**:
  1. **Reutilizar** el estado `pendiente` (no crear `pendiente_pago`); distinguir por `bloqueada_por_normativa` + `paymentStatus`.
  2. Consentimiento **antes que** pago: un menor sin consentimiento no puede pagar.
  3. Pueden confirmar el pago **paciente** y **terapeuta/asistente** (efectivo o pago externo).
  4. Expiración de citas impagas: **aplazada** (quedará documentada, no implementada).
  5. Botón **Cancelar** con **motivo obligatorio** en dashboard del paciente y del terapeuta/asistente.

- **Nota de versionado Flyway**: la migración se numera **V39** (`origin/develop` ya contiene `V38__introduce_leva_case_sources.sql`, verificado 2026-11-23).

---

## 1. Contexto y problema

Hoy toda cita se crea **directamente como `confirmada`**, aunque la regla de negocio establece que primero debe validarse el pago y solo entonces confirmarse. Además, no existe captura de motivo ni auditoría al cancelar, y el paciente no tiene forma de pagar ni de cancelar desde su portal.

Flujo objetivo (mecanismo listo para pasarela real, hoy con botón mock):

```text
Terapeuta agenda cita  ──►  estado = pendiente  (payment_status = pendiente)
        │
        ▼
Paciente (o terapeuta/asistente) pulsa "Pagar"  ──►  pasarela (mock hoy)
        │
        ▼
Pago confirmado  ──►  payment_status = pagada  +  estado = confirmada
        │
        ▼
Terapeuta ve la cita "confirmada" en su agenda
```

Y en paralelo, cualquier cita `pendiente`/`confirmada`/`solicita_reagendar` puede **cancelarse con motivo obligatorio**, quedando registro auditable.

---

## 2. Estado actual verificado

| Elemento | Estado |
| :--- | :--- |
| `CitaRestMapper.toDomain()` | Hardcodea `.estadoCita("confirmada")` y `.paymentStatus("pendiente")` en la creación. Causa raíz del problema. |
| `CitaApplicationService.agendar()` | Solo pone `pendiente` si `pacienteConsentimientoPort.estaBloqueadoPorNormativa(...)` (menor sin consentimiento). El resto queda `confirmada` (viene del mapper). |
| Máquina de estados | `pendiente → confirmada/cancelada`; `confirmada → completada/cancelada/ausente/no_presentado`; `solicita_reagendar → confirmada/cancelada`. La transición de pago **ya es legal**. |
| `CitaEstadoRequest` | Solo tiene `status`. **Sin `motivo`**. |
| `ActualizarEstadoCitaUseCase` | Firma `actualizarEstado(String id, String estado)`. Sin motivo ni auditoría. |
| `Cita` (dominio) | Tiene `paymentStatus` (`pagada`/`pendiente`/`exenta`) y `bloqueadaPorNormativa`. **Sin `motivoCancelacion`**. |
| `CitaJpaEntity` / BD `citas` | Columnas `estado_cita`, `payment_status` (CHECK `ck_citas_payment`: `pagada|pendiente|exenta`), `bloqueada_por_normativa`. **Sin columna `motivo_cancelacion`**. |
| `CitaRestController` | `POST /citas` y `PATCH /citas/{id}/estado` exigen `AGENDA_GESTIONAR` (el paciente **no** lo tiene). |
| `CitaResponseDTO` | Expone `status`, `paymentStatus`, `bloqueadaPorNormativa`. Sin `motivoCancelacion`. |
| Contexto `pago` | **Ya existe** hexagonal completo: `/pagos` (GET/POST/PATCH/DELETE), `PagoApplicationService.registrar`, `Pago` con `citaId`, `monto`, `metodo`, `estado` (`pagado|pendiente|parcial|reembolsado`). **Pero** `registrar` no toca la cita (no la confirma), y exige `PAGOS_GESTIONAR` (el paciente **no** lo tiene). |
| Solapamiento | Recién ajustado: solo estados **activos** (`pendiente`, `confirmada`, `solicita_reagendar`) bloquean horario. Una cita `pendiente` (por pagar) **sigue reservando el slot**. ✅ |
| Auditoría | `AuditoriaExpedientePort.registrar(...)` y `registrarEnMismaTransaccion(...)` disponibles (el contexto `pago` ya los usa). |
| Frontend portal paciente | `patient-portal.component.ts` + `cita-fila.component.ts` renderizan estado y `paymentStatus` como badges. **Sin botones "Pagar"/"Cancelar"**. `CitaPortal` expone `status` y `paymentStatus`. |
| Frontend agenda terapeuta | Ya tiene flujo de cancelación (`abrirConfirmacionCancelar` → `confirmarCancelacion` → `PATCH estado=cancelada`) con opción WhatsApp. **No captura motivo**. |
| Permisos (PBAC) | Paciente solo tiene `MIS_CITAS_LEER`, `MIS_SESIONES_LEER`. **No** tiene permisos de pagar ni cancelar. |

---

## 3. Matriz de brechas (GAP-PAGO)

| ID | Tipo | Brecha | Impacto | Acción propuesta |
| :--- | :--- | :--- | :--- | :--- |
| GAP-PAGO-01 | INCORRECT | `CitaRestMapper.toDomain()` fuerza `estadoCita("confirmada")` en el alta. | Toda cita nace confirmada sin validar pago. | Cambiar el default a `"pendiente"`. El estado `pendiente` se reutiliza; `bloqueada_por_normativa` y `paymentStatus` distinguen los dos significados. |
| GAP-PAGO-02 | MISSING | No existe caso de uso que **confirme el pago de una cita** (marcar `paymentStatus=pagada` y transicionar `pendiente → confirmada`). | No hay forma de "pagar y confirmar" desde dominio. | Crear `ConfirmarPagoCitaUseCase` (puerto de entrada, contexto `cita`). Reglas: solo paciente dueño (claim) o staff con alcance (`AGENDA_GESTIONAR` + `resolverAlcanceTerapeutas()`); solo desde `pendiente`; idempotente por `paymentStatus` (si `confirmada` **y** `payment_status='pagada'` → devolver la misma). |
| GAP-PAGO-03 | MISSING | No hay abstracción de **pasarela de pagos**. | Acoplaría el dominio a un proveedor concreto. | Crear puerto de salida `PasarelaPagosPort.cobrar(...)` + `PasarelaPagosMockAdapter` (éxito inmediato). La pasarela real será otro adapter; el caso de uso no cambia. |
| GAP-PAGO-04 | MISSING | No hay endpoint para que el **paciente** pague (los endpoints de pago exigen `PAGOS_GESTIONAR`). | El paciente no puede pagar desde su portal. | Nuevo endpoint `POST /citas/{id}/pago` con `hasAnyAuthority('MIS_CITAS_PAGAR','AGENDA_GESTIONAR')` + validación de pertenencia (paciente dueño desde claim, nunca del body/path). El paciente paga su cita; staff confirma pago en efectivo. |
| GAP-PAGO-05 | PARTIAL | Vocabulario divergente: `cita.payment_status` = `pagada|pendiente|exenta` vs `pago.estado` = `pagado|pendiente|parcial|reembolsado`. | Riesgo de inconsistencias al registrar el pago y confirmar la cita. | Mapeo explícito: pago confirmado ⇒ `cita.payment_status='pagada'` y `pago.estado='pagado'`. Estados **fuera del alcance actual** (se implementa solo el pago confirmado), documentados para futuro: `parcial` ⇒ la cita **sigue** `pendiente`; `reembolsado` ⇒ cita `cancelada` (NO hay transición `confirmada→pendiente`; no ampliar máquina). Dueño futuro: caso de uso de reembolso dedicado. |
| GAP-PAGO-06 | MISSING | No existe `motivo_cancelacion` en dominio, entidad, DTO ni BD. | No se puede auditar el "por qué" de la cancelación. | Migración `V39`: `motivo_cancelacion VARCHAR(30) NULL` + `motivo_cancelacion_detalle VARCHAR(255) NULL` (para "OTRO") + CHECK de lista cerrada (`ck_citas_motivo_cancelacion`, con `IS NULL`). Agregar campos en `Cita`, `CitaJpaEntity`, `CitaResponseDTO` y `CitaEstadoRequest`. |
| GAP-PAGO-07 | PARTIAL | `CitaEstadoRequest` solo recibe `status`; `ActualizarEstadoCitaUseCase` no recibe motivo. | No se puede exigir motivo al cancelar. | Extender `CitaEstadoRequest` con `motivo` + `motivoDetalle` (motivo **obligatorio** si `status='cancelada'`); validar whitelist + `@Size`; `ActualizarEstadoCitaUseCase.actualizarEstado(id, estado, motivo, motivoDetalle)`. Añadir validación de alcance del staff (`resolverAlcanceTerapeutas()`) para evitar cancelar citas ajenas (IDOR horizontal). Nueva excepción de dominio "motivo obligatorio" ⇒ **400** en `CitaExceptionHandler`. |
| GAP-PAGO-08 | MISSING | La cancelación no queda en auditoría. | Sin trazabilidad de quién/cuándo/por qué se canceló. | Registrar en `auditoria_expediente` (acción `"Cancelación de cita"`, detalle = motivo, actor = `IdentidadAutenticadaPort.sub()`). Usar `registrarEnMismaTransaccion(...)`. ⚠️ El CHECK `ck_auditoria_exp_categoria` **no** incluye `'citas'`; `V39` debe ampliarlo (DROP + ADD). |
| GAP-PAGO-09 | MISSING | El **paciente** no puede cancelar (`PATCH /citas/{id}/estado` exige `AGENDA_GESTIONAR`). | El portal del paciente no puede cancelar. | Nuevo endpoint `PATCH /portal-paciente/citas/{id}/cancelar` con `hasAuthority('MIS_CITAS_CANCELAR')` + pertenencia (paciente dueño desde claim). Requiere `motivo`. ⚠️ Mapeo de excepciones: `CitaExceptionHandler` está acotado a `cita` y no aplica a `portalpaciente`; añadir handlers en `PortalPacienteExceptionHandler` para `CitaNotFoundException` (404), `TransicionEstadoCitaInvalidaException` (409) y la nueva "motivo obligatorio" (400), o traducirlas a excepciones propias del portal. |
| GAP-PAGO-10 | MISSING | Frontend portal paciente sin botones "Pagar" ni "Cancelar". | El paciente no puede ejecutar el flujo. | `cita-fila.component.ts` es presentacional: emitir `@Output() pagar/cancelar`; el padre `patient-portal.component.ts` (dueño del repo) ejecuta y maneja loading/error. Visibilidad: **"Pagar"** solo `status='pendiente' && paymentStatus='pendiente' && !bloqueadaPorNormativa`; **"Cancelar"** en `pendiente|confirmada|solicita_reagendar`. Ampliar `CitaPortal` con `bloqueadaPorNormativa`/`motivoCancelacion` y `PatientPortalRepository` con `pagarCita`/`cancelarCita` (implementar en **ambos** adaptadores: la clase es 100% abstracta). Actualizar el copy de "solo lectura" del portal. Accesibilidad: `role=dialog`, `aria-modal`, cierre `Escape`, `aria-live` para loading/error. El botón "Cancelar" debe renderizarse **también en "Historial"** (`solicita_reagendar` cae hoy en esa sección). |
| GAP-PAGO-11 | PARTIAL | Agenda del terapeuta cancela sin motivo. | Cancelaciones del staff no quedan tipadas para auditoría. | Añadir selector de motivo (lista cerrada compartida) al modal existente; validar antes de habilitar "Sí, cancelar". Ampliar `AgendaRepository.actualizarEstadoCita(id, status, motivo?)` (o método `cancelarCita`) en agenda + adaptadores HTTP/LocalStorage. Añadir `motivoCancelacion?` al tipo `Appointment` (`clinical.types.ts`) para mostrarlo en el drawer tras cancelar. Accesibilidad del modal (role/aria/Escape). |
| GAP-PAGO-12 | MISSING | Sin tests para confirmación de pago ni cancelación con motivo. | Regresión no detectada. | Tests de integración: (a) alta ⇒ cita `pendiente`; (b) pago ⇒ cita `confirmada` + `payment_status='pagada'`; (c) cancelación sin motivo ⇒ 400; con motivo ⇒ `cancelada` + auditoría. |
| GAP-PAGO-13 | MISSING + DATA | El rol `patient` carece de permisos específicos para pagar/cancelar. | No hay control PBAC granular para las nuevas acciones. | **Decisión**: crear permisos `perm-029 = MIS_CITAS_PAGAR` y `perm-030 = MIS_CITAS_CANCELAR` (modulo `AGENDA`), asignados **solo** a `rol-006` (patient), vía `INSERT ... ON CONFLICT DO NOTHING`. El staff reutiliza `AGENDA_GESTIONAR` / `PAGOS_GESTIONAR`. |
| GAP-PAGO-14 | MISSING | Concurrencia/idempotencia del pago: `CitaJpaEntity` sin `@Version` y `pagos.cita_id` sin UNIQUE. | Doble pago ante dos POST simultáneos. | **Decisión**: `UPDATE ... WHERE estado_cita='pendiente'` condicional (sin columna nueva) + índice único parcial `ux_pagos_cita_pagado ON pagos(cita_id) WHERE estado='pagado' AND cita_id IS NOT NULL`. Alternativa `@Version` requeriría columna `version` (no contemplada). **Nota futura (pasarela real)**: el cobro ocurre antes del `save`; documentar idempotency-key de pasarela + compensación ante `OptimisticLockException` (irrelevante con mock). |
| GAP-PAGO-15 | MISSING | `payment_status='exenta'` sin regla de negocio definida. | Estado huérfano: ¿nace confirmada? ¿sin botón Pagar? | Definir: cita `exenta` **no muestra "Pagar"** ni exige pago. En esta fase **no nace `exenta` automáticamente**; se asigna manualmente por staff (cortesía) y se confirma con `PATCH estado=confirmada` (existente). El caso de uso de pago la rechaza (paso 3). |
| GAP-PAGO-16 | DATA | Backfill histórico: tras GAP-PAGO-01 quedan filas inconsistentes (`cit-001`/`cit-003` confirmadas con `payment_status='pendiente'`; `cit-006` cancelada sin motivo). | Datos semilla contradictorios con la nueva regla. | En `V39`: `UPDATE citas SET payment_status='exenta' WHERE estado_cita='confirmada' AND payment_status='pendiente'`; `UPDATE citas SET motivo_cancelacion='OTRO' WHERE id='cit-006' AND estado_cita='cancelada' AND motivo_cancelacion IS NULL`. **Alinear también el mock demo** (`agenda.component.ts guardarCita()` y `mockData.ts app-1d/app-2/app-6c`) para el modo `agendaBackend=false`. |
| GAP-PAGO-17 | CONTRACT | Frontend: `MIS_CITAS_PAGAR`/`MIS_CITAS_CANCELAR` no están en el union `Permission` (`clinical.types.ts`) ni en `VALID_PERMISSIONS` (`login-http.adapter.ts`). Además `patient-portal-http.adapter.listarCitas()` usa `/citas` (agenda) en vez de `/portal-paciente/citas`. | Los permisos se descartan silenciosamente; sin control de botones por permiso; inconsistencia de alcance. | Añadir ambos al union `Permission` y a `VALID_PERMISSIONS`; unificar `listarCitas()` a `GET /portal-paciente/citas`; usar `*hasPermission` para ocultar/mostrar botones. |

---

## 4. Diseño propuesto

### 4.1 Confirmación de pago (mock, preparado para pasarela real)

```text
POST /citas/{id}/pago   (paciente con MIS_CITAS_PAGAR · staff con AGENDA_GESTIONAR)
   │
   ├─ ConfirmarPagoCitaUseCase.confirmar(citaId, actor)
   │     1. cargar cita (404 si no existe)
   │     2. validar pertenencia: paciente dueño o staff con acceso
   │     3. validar estado actual == 'pendiente' y payment_status != 'exenta'
   │        (idempotente si 'confirmada' Y payment_status='pagada'; si 'confirmada' con
   │         payment_status='pendiente' → estado ambiguo, rechazar 409)
   │     4. rechazar si bloqueadaPorNormativa=true (403/409: consentimiento primero)
   │     5. pasarelaPagosPort.cobrar(cita)          ← PasarelaPagosMockAdapter (hoy)
   │     6. cita.paymentStatus = 'pagada'
   │     7. cita.estadoCita = 'confirmada'
   │     8. registrar Pago (reutilizar contexto pago: concepto, monto, metodo, estado='pagado')
   │     9. auditoría clínica "Confirmación de pago de cita" en la MISMA transacción
   │        (registrarEnMismaTransaccion; evitar doble traza 'pagos'+'citas')
   │     Concurrencia: UPDATE condicional WHERE estado_cita='pendiente' (sin columna nueva)
   │     + índice único parcial en pagos (anti doble cobro)
   │     Futuro (pasarela real): idempotency-key + compensación ante OptimisticLockException
   └─ 200 CitaResponseDTO (status=confirmada, paymentStatus=pagada)
```

### 4.2 Cancelación con motivo

```text
PATCH /citas/{id}/estado  { status: 'cancelada', motivo: '...' }   (staff)
PATCH /portal-paciente/citas/{id}/cancelar { motivo: '...' }       (paciente con MIS_CITAS_CANCELAR)
   │
   ├─ ActualizarEstadoCitaUseCase.actualizarEstado(id, 'cancelada', motivo, motivoDetalle)
   │     1. validar transición (pendiente/confirmada/solicita_reagendar → cancelada)
   │     2. validar motivo obligatorio (whitelist) + detalle si 'OTRO'
   │     3. persistir motivo_cancelacion (+ motivo_cancelacion_detalle)
   │     4. auditoría clínica "Cancelación de cita" (detalle = motivo, actor = IdentidadAutenticadaPort.sub())
   └─ 200 CitaResponseDTO (status=cancelada, motivoCancelacion)
```

### 4.3 Lista de motivos (decisión: opción A)

Select cerrado + "Otro" con detalle **obligatorio**:
`EMERGENCIA` · `NO_PUEDE_ASISTIR` · `CAMBIO_DE_PLANES` · `MOTIVO_CLINICO` · `OTRO`

- `motivo_cancelacion`: enum cerrado (CHECK en V39), `VARCHAR(30)`.
- `motivo_cancelacion_detalle`: texto libre, solo cuando el motivo es `OTRO` (`VARCHAR(255)`).
- Constante TS única compartida entre agenda y portal para evitar drift.

---

## 5. Decisiones confirmadas

1. **Reutilizar** `pendiente` (no crear `pendiente_pago`); distinguir por `bloqueada_por_normativa` + `paymentStatus`.
2. **Consentimiento primero, pago después**: un menor sin consentimiento no puede pagar (se valida en el caso de uso de pago).
3. **Quién confirma pago**: paciente y terapeuta/asistente (efectivo o pago externo).
4. **Expiración de impagas**: aplazada; queda documentada como pendiente futura.
5. **Cancelación**: botón en dashboard del paciente y del terapeuta/asistente, con **motivo obligatorio** (lista cerrada A) y registro auditable.
6. **Permisos**: crear `MIS_CITAS_PAGAR` y `MIS_CITAS_CANCELAR` para el rol `patient` (PBAC, mínimo privilegio). El staff reutiliza `AGENDA_GESTIONAR` / `PAGOS_GESTIONAR`.

---

## 6. Criterios de aceptación

- [ ] `POST /citas` crea la cita en estado `pendiente` (no `confirmada`), con `payment_status='pendiente'`.
- [ ] Una cita `pendiente` (por pagar) **sigue bloqueando** el horario en la regla de solapamiento.
- [ ] `POST /citas/{id}/pago` (mock) deja la cita `confirmada` y `payment_status='pagada'`.
- [ ] El pago es **idempotente**: si ya está confirmada, devuelve la misma cita sin duplicar pago.
- [ ] El paciente **no** puede pagar una cita de otro paciente (403/404).
- [ ] Un menor sin consentimiento **no** puede pagar (regla consentimiento → pago).
- [ ] Cancelar exige motivo: sin motivo ⇒ 400; con motivo ⇒ `cancelada` + `motivo_cancelacion` persistido.
- [ ] La cancelación queda registrada en auditoría clínica (acción, motivo, actor).
- [ ] El paciente puede cancelar desde su portal (mismo motivo obligatorio).
- [ ] El terapeuta/asistente cancela con motivo desde su agenda.
- [ ] Botones visibles correctamente en el portal: "Pagar" solo en `pendiente` (y no `exenta` ni `bloqueadaPorNormativa`); "Cancelar" solo en `pendiente`/`confirmada`/`solicita_reagendar`.
- [ ] Un menor sin consentimiento recibe 403/409 al intentar pagar.
- [ ] Una cita `exenta` no muestra botón "Pagar" y no exige pago.
- [ ] Dos pagos simultáneos no duplican el registro `Pago` (índice único parcial + validación de estado en el caso de uso).
- [ ] Tests de integración para pago y cancelación.

---

## 7. Siguientes pasos

1. **Backend cita**: cambiar default a `pendiente` en `CitaRestMapper`; crear `ConfirmarPagoCitaUseCase` + `PasarelaPagosPort` (mock) + endpoint `POST /citas/{id}/pago` (validación `bloqueadaPorNormativa`, `exenta`, idempotencia `@Version`).
2. **Backend pago**: integrar el registro del `Pago` (estado `pagado`) dentro de la confirmación (mapeo GAP-PAGO-05: parcial ⇒ sigue pendiente; reembolsado ⇒ revertir).
3. **Migración Flyway `V39`**: `motivo_cancelacion` + `motivo_cancelacion_detalle` + CHECK lista cerrada; ampliar `ck_auditoria_exp_categoria` con `'citas'`; permisos `perm-029`/`perm-030` (solo `rol-006`); índice único parcial `ux_pagos_cita_pagado`; backfill (`exenta`, `OTRO`).
4. **Cancelación**: extender `CitaEstadoRequest` y `ActualizarEstadoCitaUseCase` con `motivo`/`motivoDetalle`; excepción "motivo obligatorio" ⇒ 400; endpoint de cancelación del paciente; auditoría con actor.
5. **Frontend contrato**: añadir `MIS_CITAS_PAGAR`/`MIS_CITAS_CANCELAR` al union `Permission` y `VALID_PERMISSIONS`; ampliar `CitaPortal` con `bloqueadaPorNormativa` y `motivoCancelacion`; unificar `listarCitas()` a `/portal-paciente/citas`.
6. **Frontend portal paciente**: botones "Pagar"/"Cancelar" vía `@Output()` (cita-fila presentacional) + modal de motivo reutilizable + estados loading/error por acción.
7. **Frontend agenda terapeuta**: selector de motivo en el modal existente y `AgendaRepository.actualizarEstadoCita(id, status, motivo?)`.
8. **Tests** de integración (alta → pendiente; pago → confirmada; cancelación → motivo + auditoría; doble pago no duplica).
9. **Verificación API** y frontend (portal paciente + agenda terapeuta).

---

## 8. Auditoría de agentes (2026-11-23)

El documento fue auditado en modo READ-ONLY por `jarvis-backend`, `jarvis-database` y `jarvis-frontend`.

| Agente | Veredicto | Aportes clave incorporados |
| :--- | :--- | :--- |
| jarvis-backend | REQUIERE CAMBIOS | Autorización unificada (GAP-04/09 con permisos nuevos), categoría GAP-13 normalizada, concurrencia/idempotencia (`@Version` + índice único), validación de `bloqueadaPorNormativa` y `exenta`, actor de auditoría, excepción 400 por motivo, anti-IDOR. |
| jarvis-database | REQUIERE CAMBIOS | `motivo_cancelacion VARCHAR(30) NULL` + CHECK + detalle, ampliar `ck_auditoria_exp_categoria` con `'citas'`, mapeo `parcial`/`reembolsado`, backfill histórico, índice único parcial `ux_pagos_cita_pagado`, permisos `perm-029`/`perm-030` solo `rol-006`. |
| jarvis-frontend | REQUIERE CAMBIOS | Contrato de permisos (`Permission` + `VALID_PERMISSIONS`), `CitaPortal` con `bloqueadaPorNormativa`/`motivoCancelacion`, `cita-fila` presentacional con `@Output()`, unificar listado a `/portal-paciente/citas`, estados de UI/accesibilidad, modal de motivo reutilizable, copy de "solo lectura" a actualizar. |

Correcciones incorporadas en las secciones 3–7.

### 8.1 Re-auditoría (2ª ronda, 2026-11-23)

| Agente | Veredicto 2ª ronda | Estado |
| :--- | :--- | :--- |
| jarvis-database | ✅ APROBADO | V39 listo para implementar (3 observaciones menores opcionales). |
| jarvis-backend | ⚠️ REQUIERE CAMBIOS | 6 precisiones de diseño incorporadas: reembolso ⇒ `cancelada`, origen de `exenta` (manual staff), alcance del staff (anti-IDOR horizontal), transaccionalidad de auditoría, idempotencia por `paymentStatus`, compensación de pasarela (futuro). |
| jarvis-frontend | ⚠️ REQUIERE CAMBIOS | Precisiones documentales incorporadas: copy de "solo lectura", repo abstracto (ambos adaptadores), `Appointment.motivoCancelacion`, alineación de mock demo, accesibilidad, `solicita_reagendar` en Historial. |

### 8.2 Tercera ronda de auditoría (2026-11-23)

| Agente | Veredicto 3ª ronda | Estado |
| :--- | :--- | :--- |
| jarvis-database | ✅ APROBADO | V39 listo (observación: se optó por `UPDATE` condicional en vez de `@Version` para no añadir columna). |
| jarvis-backend | ⚠️ REQUIERE CAMBIOS (1 precisión) | Incorporada: mapeo de excepciones del endpoint de cancelación del portal (GAP-PAGO-09). |
| jarvis-frontend | ✅ APROBADO | Incorporadas 2 menores: `app-6c` en el mock y "Cancelar" visible también en Historial. |

Tras estas incorporaciones, el documento queda listo para `demo-gap-implementation`.
