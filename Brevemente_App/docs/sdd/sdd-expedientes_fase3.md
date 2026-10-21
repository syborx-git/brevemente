# SDD-EXP-F3: Software Design Document — Módulo Expedientes FASE 3 (Escritura de dominios — Bloque A)

- **Módulos**: `expediente-clinico` (frontend Angular) — **sin cambios de backend ni BD**
- **Código SDD**: `SDD-EXP-F3`
- **Versión**: 1.0.0
- **Fecha**: 2026-10-08
- **Estado**: BORRADOR — pendiente de aprobación (Gate #1)
- **Fuente de verdad**: `docs/gap-analysis/gap-report-expedientes_Fase3.md` (validado en 2 rondas por `jarvis-database`, `jarvis-backend` y `jarvis-frontend`; sin bloqueantes 🔴/🟠)
- **Predecesor**: `sdd-expedientes-fase2.md` (SDD-EXP-F2 — ya implementado y en producción de demo)
- **Alineación**: ADR-001 (Hexagonal/SDOP), ADR-002 (Dual Adapters)

> **Regla de Oro**: integrar vía adaptador/puerto, reutilizando/adaptando lo existente. El HTML/SCSS de la demo React es la **fuente de verdad visual a portar** tal cual (regla del calendario). No se escribe código fuente en esta fase; este documento es la especificación.

---

## 0. Propósito y alcance

Cerrar el **ciclo de escritura** del módulo Expedientes: la Fase 2 ya entregó el backend completo (POST/PATCH/DELETE de pagos, constancias y bitácoras, y `SesionCreateRequest` con VC/VG), pero las tabs Angular `pagos`, `constancias` y `supervision` son **solo lectura** y el modal de sesión **no captura VC/VG**. Esta fase implementa únicamente en el frontend:

1. **Pagos**: registrar pago, cambiar estado, eliminar y recordatorio por WhatsApp (`wa.me`).
2. **Constancias**: registrar constancia física, anular y ver detalle.
3. **Supervisión**: registrar bitácora (18 campos) y eliminar.
4. **Sesión TBE**: capturar VC (6 criterios) y VG (3 esferas) en el modal.
5. **UX/errores y accesibilidad** de los nuevos modales.

**Fuera del alcance (Bloque B/C, fase futura)**: tab `contrareferencia`, circuito de riesgo (`crisisHistory`), reconsentimiento autónomo y motor de protocolos — documentados en `gap-report-expedientes_Fase2.md` §4.7.

**Sin backend nuevo**: los 13 endpoints de escritura ya existen y los DTOs son simétricos con los tipos TS (verificado por `jarvis-backend` y `jarvis-database`).

---

## 1. Plan de Reutilización (nada nuevo en backend)

| Componente | Estado | Estrategia |
| :--- | :--- | :--- |
| `PagoRestController` (`GET/POST/PATCH/DELETE /pagos`) | ✅ implementado | **REUTILIZAR tal cual** |
| `ConstanciaRestController` (`GET/POST/DELETE /constancias`) | ✅ implementado | **REUTILIZAR tal cual** |
| `SupervisionRestController` (`GET/POST/DELETE /supervision/bitacoras`) | ✅ implementado | **REUTILIZAR tal cual** |
| `SesionCreateRequest` (con `valoracionCambio`/`valoracionGlobal`) | ✅ implementado | **REUTILIZAR**; ampliar el modal de sesión |
| Tipos TS `Payment`, `PhysicalCertificateLog`, `SupervisionLog`, `Session`, `VcEntry`, `VgEntry` | ✅ simétricos con los DTOs | **REUTILIZAR tal cual** |
| `RoleStateService` (`hasPermission`, `hasAnyPermission`, `terapeutaIds`) | ✅ implementado | **REUTILIZAR** para gating de botones |
| Modales demo (`SupervisionLogModal`, `RegisterPhysicalCertificateModal`, `PhysicalCertificateDetailModal`) | React | **PORTAR** al HTML/SCSS Angular |
| `ExpedienteRepository` (puerto, 13 métodos) + `ExpedienteHttpAdapter` | ✅ implementado | **EXTENDER** con 7 métodos |

---

## 2. Sin migración Flyway

**No se requiere V9.** `V8__introduce_expediente_fase2.sql` (ya aplicada) provee las tablas `pagos` y `constancias_fisicas` con CHECKs, y `supervision_bitacoras` con FKs e índices (sin CHECK); todo con seed (`pay-001`, `con-fis-001`, `sup-001`); y `sesiones.valoracion_cambio`/`valoracion_global` (JSONB). Confirmado por `jarvis-database`.

> ⚠️ Recordatorios de contrato (de la revisión DBA):
> - `constancias_fisicas.folio_fisico` tiene índice único parcial `ux_constancias_folio` (`WHERE folio_fisico IS NOT NULL`) → folio duplicado provoca **500**; el modal debe manejar ese error.
> - Anular constancia es **borrado lógico** (`estado='anulada'`); pago y bitácora son **borrado físico** (ambos quedan auditados en `auditoria_expediente`).
> - `supervision_bitacoras.terapeuta_id` es **nullable** (sin `NOT NULL`): si el frontend omite `therapistId`, la fila se inserta con `NULL` y queda invisible para el terapeuta. Recomendación para futura V9: `NOT NULL` o default por sesión.
> - Los CHECKs no están validados en el DTO: `tipo` (`psicoterapeutica|psiquiatrica|asistencia|informe_pericial|justificante`), `metodo` (`efectivo|transferencia|tarjeta|otro`) y `estado` (`pagado|pendiente|parcial|reembolsado`). Usar los tipos TS existentes (`PhysicalCertificateType`, `PaymentMethod`, `PaymentStatus`); un valor inválido revienta el CHECK → **500**.

---

## 3. Frontend Angular: puerto, adapters y componente

### 3.1 Puerto `ExpedienteRepository` — EXTENDER (+7 métodos)

En `modules/expediente-clinico/ports/expediente.repository.ts`:

```typescript
// Pagos
abstract registrarPago(pago: PagoNuevo): Observable<Payment>;
abstract cambiarEstadoPago(pagoId: string, estado: PaymentStatus): Observable<Payment>;
abstract eliminarPago(pagoId: string): Observable<void>;

// Constancias
abstract registrarConstancia(constancia: ConstanciaNueva): Observable<PhysicalCertificateLog>;
abstract anularConstancia(constanciaId: string): Observable<void>;

// Bitácoras de supervisión
abstract registrarBitacora(bitacora: BitacoraNueva): Observable<SupervisionLog>;
abstract eliminarBitacora(bitacoraId: string): Observable<void>;
```

Tipos derivados (cuerpo = tipo TS menos campos derivados por servidor):
```typescript
type PagoNuevo        = Omit<Payment, 'id' | 'patientName' | 'registeredBy' | 'createdAt'>;
type ConstanciaNueva  = Omit<PhysicalCertificateLog, 'id' | 'patientName' | 'status' | 'registeredBy' | 'registeredAt'>;
type BitacoraNueva    = Omit<SupervisionLog, 'id' | 'patientName' | 'therapistName'>;
```

> La captura VC/VG **no requiere métodos nuevos**, pero la firma de `agregarSesion` **sí cambia** a `Omit<Session, 'id' | 'patientId' | 'status'>` para poder excluir `patientId`/`status` del body (el servidor los deriva). `valoracionCambio`/`valoracionGlobal` ya viajan en `Session` sin cambio.

### 3.2 Adapter HTTP `ExpedienteHttpAdapter` — implementar los 7 métodos

| Método | HTTP | Endpoint (base = `environment.apiBaseUrl`) |
| :--- | :--- | :--- |
| `registrarPago` | POST | `${base}/pagos` (body `PagoCreateRequest`) |
| `cambiarEstadoPago` | PATCH | `${base}/pagos/${pagoId}/estado` (body `{ estado }`) |
| `eliminarPago` | DELETE | `${base}/pagos/${pagoId}` |
| `registrarConstancia` | POST | `${base}/constancias` (body `ConstanciaFisicaCreateRequest`) |
| `anularConstancia` | DELETE | `${base}/constancias/${constanciaId}` |
| `registrarBitacora` | POST | `${base}/supervision/bitacoras` (body `SupervisionLogCreateRequest`) |
| `eliminarBitacora` | DELETE | `${base}/supervision/bitacoras/${bitacoraId}` |

**Reglas de implementación del adapter:**
- Usar tipado de retorno de los DTOs de respuesta (simétricos con los tipos TS): `Payment`, `PhysicalCertificateLog`, `SupervisionLog`.
- **No** tragar errores en escrituras con `catchError(() => of(null))`: dejar que el error se propague para que el componente lo maneje (GAP-EXP3-10). (Las lecturas existentes conservan su `catchError` actual.)

### 3.3 Adapter LocalStorage `ExpedienteLocalStorageAdapter` — stubs no-op

Añadir los 7 métodos abstractos como **stubs no-op** (el adapter mock no implementa estas mutaciones; la demo React usaba su propio `localStorage`):
- `registrarPago`/`registrarConstancia`/`registrarBitacora` → `of({...})` in-memory o `EMPTY` (documentar que no persisten).
- `cambiarEstadoPago`/`eliminarPago`/`anularConstancia`/`eliminarBitacora` → `of(void 0)`.

> Consistencia con el estado actual del mock: solo `agregarSesion` y `firmarConsentimiento` persisten en localStorage; el resto son no-op/in-memory (verificado por `jarvis-frontend`).

### 3.4 Componente `ExpedienteClinicoComponent` — estado y métodos

**Nuevo estado de formularios:**
```typescript
// Pagos
showPaymentModal = false;
newPayment = { concept: '', amount: 0, date: '', method: 'transferencia', status: 'pagado', notes: '' };  // amount: number (`<input type="number">`); validación equivalente a la demo (rechazar NaN y < 0)

// Constancias
showConstanciaModal = false;
selectedConstancia: PhysicalCertificateLog | null = null;

// Bitácoras
showBitacoraModal = false;
```

**Nuevos métodos (todos con recarga tras éxito vía `cargarDatos()`):**
```typescript
registrarPago(): void;          // valida concepto no vacío, monto (>= 0, no NaN) y fecha → registrarPago → cierra modal
cambiarEstadoPago(p: Payment): void;   // PATCH estado
eliminarPago(p: Payment): void;        // confirmar → DELETE
enviarRecordatorioPago(p: Payment): void;  // wa.me (ver §3.7)
registrarConstancia(): void;           // POST → cierra modal
anularConstancia(c: PhysicalCertificateLog): void;  // DELETE
registrarBitacora(): void;             // POST (body con therapistId) → cierra modal
eliminarBitacora(b: SupervisionLog): void;  // DELETE
```

**`guardarSesion()` — modificar** para:
1. Incluir `valoracionCambio: VcEntry` y `valoracionGlobal: VgEntry` en el payload (con `sessionNum` = `nextNum`).
2. **Eliminar** el envío del campo muerto `newSessionEstratagema` (hoy capturado y descartado; no existe en TS ni en el DTO — GAP-EXP3-07).
3. **Excluir** `patientId` y `status` del body (los deriva el servidor: `patientId` de la ruta, `status='borrador'`). Esto exige cambiar la firma del puerto a `Omit<Session,'id'|'patientId'|'status'>` (§3.1).
4. ⚠️ **Cambio de comportamiento**: hoy se envía `status:'validado'`; al excluirlo, las sesiones nuevas quedarán `'borrador'` (el backend solo fija `'borrador'` si viene vacío). Validar con producto si procede.

**Inyección de `patientId` en las escrituras:** `registrarPago()`, `registrarConstancia()` y `registrarBitacora()` deben setear `patientId = this.pacienteId` al construir el payload (los tipos `PagoNuevo`/`ConstanciaNueva`/`BitacoraNueva` lo exigen).

**Totales de pagos (divergencia con la demo):** el getter `totalCobrado` actual cuenta `parcial` como cobrado; la demo lo cuenta como **pendiente**. Alinear a la demo (`cobrado` = solo `pagado`; `pendiente` = `pendiente`+`parcial`) y ajustar TC-EXP-10/11.

### 3.5 Modales a portar (HTML/SCSS — regla del calendario)

Portar **tal cual** las clases Tailwind de la demo React a `expediente-clinico.component.html`:

| Modal | Fuente demo | Campos |
| :--- | :--- | :--- |
| Modal de pago | `ClinicalRecord.tsx` (handleAddPayment) | concepto, monto, fecha, método, estado, notas |
| Registro de constancia | `RegisterPhysicalCertificateModal.tsx` | folio, fecha, tipo, emisor (nombre+cédula), destinatario, motivo, periodo, nº sesiones, resumen clínico, escaneo (nombre archivo), entregado a + checkbox `hasPhysicalProof` (**UI-only**, no va al DTO) |
| Detalle de constancia | `PhysicalCertificateDetailModal.tsx` | visualización + "descargar escaneo" (simulado) |
| Bitácora de supervisión | `SupervisionLogModal.tsx` | 18 campos de `SupervisionLogCreateRequest` (ver §4.3 del gap report) |

- Sustituir los iconos `lucide-react` de la demo por **SVG inline** para no introducir una dependencia de iconos adicional (el proyecto ya declara `lucide-angular`, pero este módulo usa SVG inline hoy).
- Pestañas afectadas: `pagos` (tabla + botones por fila + modal), `constancias` (botón "Registrar constancia" + acciones por fila), `supervision` (botón "Registrar bitácora" junto a "Solicitar Supervisión").

### 3.6 Captura VC/VG en el modal de sesión

Ampliar el modal "Registrar Nueva Sesión TBE" con:

- **VC (6 criterios)** — `<select>` por criterio con las opciones de la demo:
  `Sin cambios` · `Mejoría leve` · `Mejoría significativa` · `Empeoramiento`
  (+ `Nuevo patrón` únicamente en el criterio "Percepción").
  ⚠️ `vcValue()` mapea `Marcador de inicio`=1, `Sin cambios`=2, `Mejoría leve`=3, `Mejoría significativa`=4, `Nuevo patrón`=4.5 y devuelve 0 para el resto (incluido `Empeoramiento`); revisar el mapeo si `Empeoramiento` debe plotear distinto de 0.
- **VG (3 esferas)** — 3 toggles booleanos: `YO`, `DEMÁS`, `MUNDO`.

Estado nuevo: `newVc*` (6 strings) y `newVgYo/newVgDemas/newVgMundo` (3 booleanos). Defaults de la demo: VC `Mejoría significativa` (percepción/sensaciones/reacciones/síntomas/crisis) y `Mejoría leve` (pensamientos); VG `yo/demas/mundo = false`.

### 3.7 Recordatorio de pago por WhatsApp

Método `enviarRecordatorioPago(p: Payment)`:
1. `const phone = (patient?.phone || '').replace(/\D/g, '')`; si vacío → alert "El paciente no tiene teléfono registrado."
2. Mensaje: `Hola ${p.patientName}, te recordamos que tienes un pago pendiente de $${p.amount} MXN por "${p.concept}". ¿Podrías realizar el pago? Gracias.`
3. `window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent(message), '_blank')`.
4. Traza de auditoría: **no implementable** con el puerto actual (`listarAuditoria` es solo lectura); omitir o añadir un método de escritura de auditoría (fuera del alcance del Bloque A).

**Visibilidad (GAP-EXP3-08)**: mostrar el botón para pagos `pendiente`/`parcial`. La regla `canManagePayments` no existe en Angular; se replica el comportamiento de la demo (`showPaymentReminder = true`) o se gana con `hasPermission('PAGOS_GESTIONAR')` (decisión de implementación, documentar en el código).

### 3.8 Gating por permisos (`RoleStateService`)

Usar los helpers existentes (`hasPermission`, `hasAnyPermission`) en `*ngIf` de botones:

| Acción | Condición |
| :--- | :--- |
| Registrar/cambiar estado/eliminar pago | `roleService.hasPermission('PAGOS_GESTIONAR')` |
| Registrar/anular constancia | `roleService.hasPermission('CONSTANCIAS_EMITIR')` |
| Registrar/eliminar bitácora | `roleService.hasAnyPermission(['SUPERVISION_REGISTRAR','SUPERVISION_EVALUAR'])` |
| Recordatorio WhatsApp | `hasPermission('PAGOS_GESTIONAR')` (o siempre visible, ver §3.7) |

**`therapistId` de la bitácora**: pre-rellenar en `registrarBitacora()` desde `roleService.terapeutaIds[0]` o `patient.therapistId`, y **enviarlo en el body** (el backend no lo deriva).

### 3.9 UX/errores y accesibilidad (GAP-EXP3-10/11)

- **Errores**: las mutaciones no usan `catchError`; capturar el error en el `.subscribe` y mostrar notificación (alert/toast). Caso especial: folio de constancia duplicado (500) → el backend no devuelve un contrato de error específico (`DataIntegrityViolationException`); mostrar un mensaje genérico "No se pudo registrar (folio duplicado)" según el status 500, o acotar en backend a futuro.
- **Carga**: deshabilitar el botón de submit mientras la petición está en curso.
- **Accesibilidad** en todos los modales nuevos: `role="dialog"`, `aria-modal="true"`, focus trap al abrir y devolver foco al cerrar, cierre con `Esc` y botón ✕ con `aria-label="Cerrar"`. El focus trap requiere la dependencia `@angular/cdk/a11y` (`cdkTrapFocus`) — declararla.

---

## 4. Contratos de escritura (referencia exacta)

> Detalle completo en `gap-report-expedientes_Fase3.md` §4. Resumen operativo:

| Operación | Endpoint | Permiso | Respuesta |
| :--- | :--- | :--- | :--- |
| Registrar pago | `POST /pagos` | `PAGOS_GESTIONAR` | **201** `PagoResponseDTO` |
| Cambiar estado | `PATCH /pagos/{pagoId}/estado` body `{estado}` | `PAGOS_GESTIONAR` | **200** `PagoResponseDTO` |
| Eliminar pago | `DELETE /pagos/{pagoId}` | `PAGOS_GESTIONAR` | **204** |
| Registrar constancia | `POST /constancias` | `CONSTANCIAS_EMITIR` | **201** `ConstanciaFisicaResponseDTO` |
| Anular constancia | `DELETE /constancias/{constanciaId}` | `CONSTANCIAS_EMITIR` | **204** (lógica) |
| Registrar bitácora | `POST /supervision/bitacoras` | `SUPERVISION_REGISTRAR`\|`SUPERVISION_EVALUAR` | **201** `SupervisionLogResponseDTO` |
| Eliminar bitácora | `DELETE /supervision/bitacoras/{bitacoraId}` | `SUPERVISION_REGISTRAR`\|`SUPERVISION_EVALUAR` | **204** |
| Crear solicitud | `POST /supervision/solicitudes` body `{pacienteId, reason}` | `EXPEDIENTE_ESCRIBIR` | **201** (ya implementado) |
| Nueva sesión (VC/VG) | `POST /expedientes/paciente/{pacienteId}/sesiones` | `EXPEDIENTE_ESCRIBIR` | **201** `SesionResponseDTO` |

---

## 5. Plan de pruebas

1. **E2E (Playwright)** — ampliar `tests/e2e/expediente.spec.ts`:
   - TC-EXP-10: registrar pago → aparece en tabla y actualiza `Total cobrado/pendiente`.
   - TC-EXP-11: cambiar estado de pago (`pendiente → pagado`) y eliminar pago.
   - TC-EXP-12: registrar constancia física → aparece en listado.
   - TC-EXP-13: registrar bitácora de supervisión (18 campos) → aparece en listado.
   - TC-EXP-14: registrar sesión con VC/VG → las gráficas/tablas VC-VG reflejan los valores.
   - TC-EXP-15: folio de constancia duplicado → el frontend no rompe (manejo de error).
   - Mantener monitoreo de consola (`page.on('console')`) y HTTP ≥500 (`page.on('response')`).
2. **Regresión visual** — regenerar baselines de los tabs `pagos`, `constancias`, `supervision` y del modal de sesión con `--update-snapshots` (`maxDiffPixelRatio: 0.01`).
3. **Build** — `ng build` debe compilar limpio (el puerto abstracto fuerza a implementar los 7 métodos en ambos adapters).

---

## 6. Aceptación (Gate #1)

Este SDD queda listo para `demo-gap-implementation` cuando se aprueben:
1. Los 7 métodos del puerto §3.1, su tipado derivado (`PagoNuevo`, `ConstanciaNueva`, `BitacoraNueva`) y el cambio de firma de `agregarSesion` a `Omit<Session,'id'|'patientId'|'status'>`.
2. Los 7 endpoints del adapter §3.2 y la regla de **no** tragar errores de escritura.
3. La captura VC/VG §3.6 (escala alineada a la demo), la eliminación del campo muerto `newSessionEstratagema` y la exclusión de `patientId`/`status` en `guardarSesion()`.
4. El port visual §3.5 (fuente de verdad = demo React) y la accesibilidad §3.9.
5. El plan de pruebas §5 (E2E + regresión visual).

> Fuente de verdad: `docs/gap-analysis/gap-report-expedientes_Fase3.md` (11 GAPs + §4 contratos). Auditorías: 2 rondas de `jarvis-database`/`jarvis-backend`/`jarvis-frontend` (sin bloqueantes; 5 matices de redacción ya incorporados).

> **Fase futura (fuera de este SDD)**: contra-referencia, `crisisHistory`, reconsentimiento autónomo y motor de protocolos — requerirán su propia migración, backend y SDD.
