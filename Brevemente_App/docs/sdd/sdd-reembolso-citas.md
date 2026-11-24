# SDD-REEM-1: Software Design Document — Reembolso al cancelar citas pagadas

- **Módulos**: `cita` + `pago` + `portalpaciente` (backend Spring Boot, hexagonal) · `patient-portal` (frontend Angular 18 standalone) · PostgreSQL/Flyway
- **Código SDD**: `SDD-REEM-1`
- **Versión**: 1.0.0
- **Fecha**: 2026-11-24
- **Estado**: AUDITADO (3ª ronda, cierre) — jarvis-database ✅ APROBADO · jarvis-backend ✅ APROBADO · jarvis-frontend ✅ APROBADO
- **Sucede a**: `V39__pagos_cancelacion_citas.sql` (última migración, verificada 2026-11-23)
- **Migración nueva**: `V40__reembolso_citas.sql`
- **Origen**: hallazgo al cancelar una cita **pagada** desde el portal del paciente (diagnóstico 2026-11-24)
- **Alineación**: ADR-001 (Hexagonal/SDOP), ADR-002 (Dual Adapters), ADR-003 (Backend hexagonal y OpenAPI)

> **Regla de Oro**: integrar vía adaptador/puerto, reutilizando/adaptando lo existente. Este documento **no** escribe código fuente; es la especificación que consumirá la implementación.

---

## 0. Propósito y alcance

Al cancelar una cita desde el portal (o la agenda), `CitaApplicationService.actualizarEstado` **borra físicamente el registro de pago** sin distinguir si estaba `pagado` o `pendiente`, **no emite reembolso** y **no reinicia** `payment_status` de la cita. El resultado visible es:

1. Un paciente que ya pagó pierde su pago sin devolución y sin trazabilidad.
2. La cita queda `cancelada` pero con `payment_status='pagada'`, mostrando badges contradictorios ("Cancelada" + "Pagada").

Se implementa un **flujo de reembolso** al cancelar citas pagadas, manteniendo el comportamiento actual (anulación del pago provisional) para citas pendientes.

### 0.1 Resultado esperado

1. Cancelar una cita **pagada** ⇒ la pasarela devuelve el dinero (mock), el `Pago` pasa a estado **`reembolsado`** (no se borra) y la cita queda `payment_status='reembolsado'`.
2. Cancelar una cita **pendiente** ⇒ se anula el pago provisional (borrado), sin reembolso (no hubo cobro).
3. La cita cancelada deja de mostrar el badge "Pagada"; muestra "Reembolsado" solo si fue reembolsada; sin badge de pago si nunca se pagó.
4. La auditoría registra **cancelación** y **reembolso** por separado.
5. La máquina de estados de la cita no cambia (`cancelada` sigue siendo terminal).

### 0.2 Decisiones adoptadas

| # | Decisión |
| :-- | :-- |
| D-1 | Ampliar el vocabulario de `citas.payment_status` con `reembolsado` (recrear CHECK `ck_citas_payment`). |
| D-2 | **Reutilizar** `pagos.estado='reembolsado'`: ya existe en `ck_pagos_estado` (`pagado, pendiente, parcial, reembolsado`) pero no se usa. El pago **no se borra**, se marca. |
| D-3 | **Reembolso atómico**: si la pasarela falla, la cancelación aborta (rollback transaccional). |
| D-4 | El reembolso vive detrás del puerto `PasarelaPagosPort` (nuevo método `reembolsar`); hoy mock siempre exitoso, mañana real sin tocar el caso de uso. |
| D-5 | La referencia del reembolso se persiste en `pago.notas`. |
| D-6 | Cancelar una cita `pendiente` **no** genera reembolso: borra el pago provisional (comportamiento actual preservado). |
| D-7 | Frontend: badge `reembolsado` + regla de supresión del badge de pago en citas canceladas no reembolsadas. |
| D-8 | La máquina de estados de la cita se mantiene intacta: `confirmada → cancelada` (ya permitida en `TRANSICIONES_ESTADO`). |

---

## 1. Diagnóstico (estado actual)

| ID | Hallazgo | Ubicación |
| :-- | :-- | :-- |
| H-REEM-01 | `actualizarEstado` borra el pago sin importar su estado: `findByCitaId(id).ifPresent(p -> deleteById(p.getId()))`. | `CitaApplicationService.actualizarEstado` (rama `cancelada`) |
| H-REEM-02 | No existe método de reembolso: `PasarelaPagosPort` solo declara `cobrar(...)`. | `PasarelaPagosPort` / `PasarelaPagosMockAdapter` |
| H-REEM-03 | `payment_status` de la cita **no se reinicia** al cancelar ⇒ cita `cancelada` con `payment_status='pagada'`. | `CitaApplicationService.actualizarEstado` |
| H-REEM-04 | El CHECK `ck_citas_payment` no admite `reembolsado`. | `V6__introduce_citas_schema.sql` |
| H-REEM-05 | `pagos.estado` ya admite `reembolsado`, pero ningún flujo lo usa. | `V8__introduce_expediente_fase2.sql` (`ck_pagos_estado`) |
| H-REEM-06 | La auditoría registra "Cancelación de cita" pero **nada** sobre la anulación/reembolso del cobro. | `CitaApplicationService.actualizarEstado` |

---

## 2. Modelo de datos — `V40__reembolso_citas.sql`

```sql
-- =============================================================================
-- V40: Reembolso al cancelar citas pagadas (SDOP)
-- Sucede a V39. Idempotente.
-- =============================================================================

-- Ampliar vocabulario de payment_status de citas con 'reembolsado'.
-- (pagos.estado ya admite 'reembolsado' en ck_pagos_estado desde V8: sin cambio.)
ALTER TABLE citas DROP CONSTRAINT IF EXISTS ck_citas_payment;
ALTER TABLE citas ADD CONSTRAINT ck_citas_payment
    CHECK (payment_status IN ('pagada','pendiente','exenta','reembolsado'));

-- Defensa en profundidad anti doble reembolso (análogo a ux_pagos_cita_pagado de V39).
CREATE UNIQUE INDEX IF NOT EXISTS ux_pagos_cita_reembolsado
    ON pagos (cita_id) WHERE estado = 'reembolsado' AND cita_id IS NOT NULL;
```

**Notas**:
- **No hay backfill**: ningún registro usa `reembolsado` aún; los valores existentes (`pagada/pendiente/exenta`) siguen siendo válidos, por lo que el DROP+ADD es seguro.
- `pagos.estado` **no requiere migración**: `ck_pagos_estado` ya contiene `('pagado','pendiente','parcial','reembolsado')`.
- El CHECK se recrea con el patrón `DROP CONSTRAINT IF EXISTS` + `ADD CONSTRAINT`, el mismo usado en `V39` (p. ej. `ck_auditoria_exp_categoria`).
- `ux_pagos_cita_reembolsado` es un índice parcial (no altera datos) que impide dos pagos `reembolsado` para la misma cita a nivel de esquema.

---

## 3. Backend (hexagonal)

### 3.1 Puerto de salida — `PasarelaPagosPort`

Añadir el contrato de reembolso (junto al `cobrar` existente):

```text
ResultadoReembolso reembolsar(String citaId, BigDecimal monto, String concepto);
// record ResultadoReembolso(boolean exito, String referencia)
```

- `PasarelaPagosMockAdapter`: implementar `reembolsar` devolviendo `exito=true` con referencia `"refund-" + UUID...`.
- La pasarela real futura será otro adapter; el caso de uso **no** cambia.
- `ResultadoReembolso` se mantiene como record separado de `ResultadoCobro` (tipos semánticos distintos); alternativa aceptable: unificar ambos en un `ResultadoOperacion` genérico.

### 3.2 Caso de uso — `ActualizarEstadoCitaUseCase` (rama `cancelada`)

Sustituir el borrado incondicional por una **anulación/reembolso condicionado**:

```text
if ("cancelada".equals(estado)) {
    validarMotivoCancelacion(motivo, motivoDetalle);
    existente.setMotivoCancelacion(motivo);
    existente.setMotivoCancelacionDetalle(motivoDetalle);
    procesarPagoAlCancelar(existente);   // helper privado
}
```

Helper privado en `CitaApplicationService` (sin anotación propia: se ejecuta **dentro** de la transacción `@Transactional` de `actualizarEstado`):

1. `pago = pagoRepositoryPort.findByCitaId(cita.getId())`; si vacío ⇒ no hacer nada.
2. Si `"pagado".equals(pago.getEstado())`:
   1. `r = pasarelaPagosPort.reembolsar(cita.getId(), pago.getMonto(), pago.getConcepto())`.
   2. Si `!r.exito()` ⇒ lanzar `TransicionEstadoCitaInvalidaException` ("No se pudo reembolsar…") → aborta la cancelación (rollback).
   3. `pago.setEstado("reembolsado")`; `pago.setNotas("Reembolso por cancelación. Referencia: " + r.referencia())`.
   4. `pagoRepositoryPort.save(pago)` — **no** `deleteById`.
   5. `cita.setPaymentStatus("reembolsado")`.
   6. Auditoría: `registrarEnMismaTransaccion(cita.getPacienteId(), identidadAutenticadaPort.sub(), "Reembolso de cita", "Reembolso de $" + monto + " MXN por cancelación de cita " + id + " (referencia " + r.referencia() + ").", "pagos")`.
3. Si `"pendiente"` ⇒ `pagoRepositoryPort.deleteById(pago.getId())` (anulación del pago provisional, comportamiento actual).
4. Si `"parcial"` ⇒ dinero ya capturado: marcar `reembolsado` (no borrar). Nota: hoy `Pago` solo tiene `monto` (total), no `monto_capturado`, por lo que con el modelo actual se reembolsaría `pago.getMonto()` íntegro (equivalente a `pagado` a efectos del mock). Al materializar captura parcial se añadirá `monto_capturado` (migración futura). Rama hoy inalcanzable (el código solo genera `pendiente`/`pagado`).

**Reglas transversales**:
- **Anti-IDOR**: la pertenencia ya se valida al inicio de `actualizarEstado` (rol `patient` ⇒ `pacienteId` del claim; staff ⇒ `resolverAlcanceTerapeutas()`). El reembolso se ejecuta dentro de ese mismo flujo, sin validación adicional.
- **Atómico**: pasarela → estados → auditoría, todo en la misma transacción.
- **Anti doble reembolso**: a nivel de aplicación, `cancelada` es terminal (no hay transición `cancelada → cancelada`); a nivel de esquema, el índice parcial `ux_pagos_cita_reembolsado` (V40) impide un segundo `pago` en `reembolsado` para la misma cita. Para cancelaciones **concurrentes** sobre la misma cita, la protección de datos es el índice único (y, al integrar pasarela real, idempotency-key del refund).
- El reembolso **no** altera `estadoCita` (sigue `cancelada`) ni la máquina de estados.

### 3.3 Blindaje de `confirmarPago`

**Sin código nuevo**: una cita `reembolsado` tiene `estadoCita='cancelada'`, y el guard existente `if (!"pendiente".equals(estadoCita)) throw TransicionEstadoCitaInvalidaException` ya la rechaza con 409. Se documenta (comentario) en el caso de uso; no se añade un guard redundante.

### 3.4 DTOs

- `CitaResponseDTO` / `CitaPortal`: **sin cambios** — `paymentStatus` ya se serializa; el valor `reembolsado` fluye de la entidad al portal automáticamente.
- No hay request nuevo (el endpoint `PATCH /citas/{id}/estado` y `PATCH /portal-paciente/citas/{id}/cancelar` ya reciben `motivo`).

---

## 4. Frontend

> ⚠️ **Nota de proceso**: la corrección requiere **un cambio mínimo de template** en `cita-fila.component.ts` (una guarda en la rama `@else` del badge de pago), además de los mapas de TypeScript. No es un rediseño de markup, pero sí excede "solo constantes TS"; debe eximirse puntualmente la regla "no tocar HTML" de `demo-gap-implementation` para este archivo.

### 4.1 Badge `reembolsado` (dos archivos, mapas duplicados)

- `cita-fila.component.ts` — constante `PAGO`: añadir
  ```text
  reembolsado: { label: 'Reembolsado', cls: 'bg-violet-100 text-violet-800 border-violet-200' }
  ```
- `patient-portal.component.ts` — su mapa `PAGO` está **duplicado y sin uso** (el padre delega el render de badges en `<app-cita-fila>`). Añadir la misma entrada por consistencia, o (recomendado) refactorizar a una constante compartida en `patient-portal/` para no mantener dos mapas sincronizados manualmente.

### 4.2 Badge de pago en cita cancelada (dos cambios coordinados)

**4.2.1** Regla en `CitaFilaComponent.pago()`: para `cancelada`, mostrar badge solo si el pago sigue siendo significativo (`reembolsado` o `exenta`); suprimir los contradictorios `pagada`/`pendiente`:

```text
if (this.cita.status === 'cancelada') {
  const p = PAGO[this.cita.paymentStatus ?? ''];
  return (p && (this.cita.paymentStatus === 'reembolsado' || this.cita.paymentStatus === 'exenta'))
    ? p
    : null;
}
return this.cita.paymentStatus ? (PAGO[this.cita.paymentStatus] ?? null) : null;
```

**4.2.2** Guarda en el template (obligatoria): la rama `@else` pinta hoy "Sin info de pago" cuando `pago()` es `null`; para una cita cancelada eso debe quedar **sin placeholder**:

```html
@if (pago(); as p) { ...badge... }
@else if (cita.status !== 'cancelada') { <span class="text-slate-600 text-[10px] font-bold">Sin info de pago</span> }
```

Sin esta guarda, el resultado 0.1.3 ("sin badge de pago si nunca se pagó") no se cumple. Se sube además el contraste del placeholder a `text-slate-600` (≈7.6:1, WCAG AAA), desde el `text-slate-300` actual (≈1.5:1).

### 4.3 Sin cambios (y una verificación externa)

- `puedePagar()` (sigue `pendiente && pendiente`) y `puedeCancelar()` (sigue permitiendo `confirmada`) **no cambian**.
- Contrato `CitaPortal.paymentStatus: string | null` ya cubre `reembolsado`.
- **Paridad LocalStorage (opcional, mock)**: el adapter `patient-portal-localstorage.adapter.ts` devuelve `paymentStatus: null` al cancelar; alinearlo a `reembolsado` solo si se quiere paridad exacta en modo demo local (baja prioridad).
- **Verificar `agenda`** (fuera del alcance portal): `Appointment.paymentStatus` en `core/types/clinical.types.ts` es union `'pagada'|'pendiente'|'exenta'` y `agenda.component.ts` compara `=== 'pagada' || === 'exenta'`. Si la agenda consume backend real, ampliar el union con `'reembolsado'` para no romper tipado.

---

## 5. Verificación

- **Backend**: compilación limpia (`mvn`); arranque con Flyway aplicando `V40`.
- **API (staff)**:
  1. Agendar cita → `POST /citas` (queda `pendiente`) + `POST /citas/{id}/pago` ⇒ `confirmada`/`pagada`.
  2. `PATCH /citas/{id}/estado {status:'cancelada', motivo:'CAMBIO_DE_PLANES'}` ⇒ 200 con `status='cancelada'` y `paymentStatus='reembolsado'`.
  3. `GET /pagos?pacienteId=...` ⇒ el `Pago` sigue existiendo con `estado='reembolsado'` y `notas` con referencia (no borrado).
- **API (paciente)**: `PATCH /portal-paciente/citas/{id}/cancelar` sobre cita propia pagada ⇒ reembolso; sobre cita pendiente ⇒ pago provisional anulado.
- **Reglas**: cancelar cita `pendiente` ⇒ sin reembolso (pago borrado); cancelar cita `exenta` ⇒ sin pago que procesar.
- **Frontend**: `ng build` limpio; badge "Reembolsado" visible en historial para cita cancelada-reembolsada; sin badge "Pagada" ni "Pendiente de pago" en cita cancelada.
- **E2E**: agendar → pagar → cancelar ⇒ reembolso registrado, pago `reembolsado`, cita `cancelada`, auditoría con "Cancelación de cita" y "Reembolso de cita".
- **Tests unitarios** (`CitaApplicationServiceTest`, nuevo): `pagada → reembolsado` (verify `save` y `never().deleteById`), `pendiente → anulado` (verify `deleteById`), `parcial → reembolso (monto completo)`, `exenta → no-op`, pasarela falla ⇒ rollback.

---

## 6. Riesgos y observaciones

1. **Pasarela real**: el reembolso debe ser **compensable** ante fallo de red (idempotency-key del refund). Irrelevante con mock; documentar al integrar pasarela real.
2. **Reembolso parcial** (`pagos.estado='parcial'`): hoy inalcanzable (solo se generan `pendiente`/`pagado`). Especificado en §3.2 paso 4: `parcial` ⇒ marcar `reembolsado` (no borrar); con el modelo actual se reembolsa `pago.getMonto()` íntegro (sin campo `monto_capturado`). Materializar con test.
3. **`payment_status='exenta'`**: cancelar una cita exenta no encuentra pago (`crearPagoPendiente` no creó ninguno) ⇒ helper no-op; correcto. En UI conserva el badge "Exenta" (ver §4.2.1).
4. **Doble reembolso / concurrencia**: `cancelada` es terminal (secuencial) y `confirmarPago` exige `pendiente`; para cancelaciones **concurrentes** la protección de datos es `ux_pagos_cita_reembolsado` (V40). Al integrar pasarela real, añadir idempotency-key del refund.
5. **Badges duplicados**: los mapas `PAGO` están duplicados en `cita-fila` y `patient-portal`; el del padre está sin uso. Refactorizar a constante compartida (deuda menor, no bloqueante).
6. **`registroSesionPort`/expediente**: si la cita pagada ya tiene sesión vinculada, la cancelación no la toca (la sesión queda vinculada a una cita cancelada; comportamiento existente, fuera de alcance).
7. **Orden de despliegue**: `V40` debe aplicarse **antes** que el código backend; sin el CHECK ampliado, el `save` con `payment_status='reembolsado'` lanza `DataIntegrityViolationException` y revierte. Además, `PortalPacienteExceptionHandler` no cubre `DataIntegrityViolationException` (hoy 500 en ese límite); añadir mapeo → 409 como defensa.
8. **Referencia del reembolso en `pago.notas`**: válido para mock; en producción con pasarela real considerar columna `pagos.referencia_reembolso` o tabla `reembolsos` (no bloqueante).

---

## 7. Estado documental y plan de ejecución

- [x] Diagnóstico (sección 1)
- [x] Especificación backend (sección 3)
- [x] Especificación frontend (sección 4)
- [x] Migración `V40` especificada (sección 2)
- [x] Auditoría por `jarvis-database`, `jarvis-backend` y `jarvis-frontend` (3ª ronda, cierre: ✅ APROBADO los tres)
- [ ] Implementación
- [ ] E2E y reporte

### Checkpoints de ejecución (JARVIS)

```text
JVS-20261124-001 | jarvis-database  → V40__reembolso_citas.sql (recrear ck_citas_payment)
JVS-20261124-002 | jarvis-backend   → PasarelaPagosPort.reembolsar + mock; actualizarEstado (reembolso/anulación); comentario documental en confirmarPago (sin guard redundante); auditoría
JVS-20261124-003 | jarvis-frontend  → badge 'reembolsado' (2 mapas) + regla de supresión en cita cancelada
JVS-20261124-004 | jarvis-security  → anti-IDOR del reembolso + no exponer referencias
JVS-20261124-005 | jarvis-qa        → tests CitaApplicationService (pagada→reembolsado; pendiente→anulado) + E2E
```
