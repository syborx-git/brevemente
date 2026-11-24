# GAP Analysis Report: Modo de Registro de Sesión (card unificada: LEVA vs Manual)

- **Fecha**: 2026-11-23
- **Rama**: `feature/jp-toma-de-sesion`
- **Alcance**: Módulo `expediente-clinico` (frontend Angular) y contexto `expediente` (backend hexagonal). Motor `leva` como fuente de datos (sin cambios).
- **Estado**: AUDITADO (READ-ONLY) · **v1.1.0** (correcciones de auditoría jarvis incorporadas)
- **Nota de versionado Flyway**: última migración aplicada **V39**. Si se requiere columna nueva, sería **V40** (opcional, ver GAP-MR-07).

---

## 1. Contexto y problema

Hoy la sesión clínica se registra por **tres vías distintas** dentro del mismo expediente, cada una con un subconjunto de campos y una UI diferente:

1. **Modal "Registrar Nueva Sesión TBE"** (botón "Registrar Sesión TBE" / "+ Nueva Sesión"): captura protocolo, prescripción, observaciones, **Valoración del Cambio (semáforo)** y **Valoración Global (esferas)**.
2. **Card de sesión** (panel derecho): muestra `fase`, `significado`, `dxOp`, `spr` con edición inline puntual; el resto es solo lectura.
3. **Flujo LEVA** (grabación + propuesta): prellena `dxOp`, `spr`, `protocol`, `px` y la nota SOAP, **sin** tocar el semáforo.

Resultado: campos ambiguos o sin llenar, y dos experiencias de captura incompatibles pese a que **todas escriben al mismo modelo `Sesion` / tabla `sesiones`**.

Flujo objetivo:

```text
Card de Sesión (única, misma UI, mismo contrato de guardado)
├─ LEVA activa   → panel de grabación + LEVA prellena lo narrativo
│                  + terapeuta llena el resto (semáforo VC/VG siempre manual)
└─ LEVA inactiva → terapeuta llena TODO
```

---

## 2. Estado actual verificado (inventario de reutilización)

| Elemento | Estado |
| :--- | :--- |
| Modal manual | `showSessionModal` + `guardarSesion()` en `expediente-clinico.component.ts` (líneas ~320-323, ~1054-1062, ~1580-1625). Captura `newSessionProtocol`, `newSessionPrescripcion`, `newSessionNotes`, VC (`VcEntry`) y VG (`VgEntry`). |
| Card de sesión | `expediente-clinico.component.html` (~854-950): muestra fase/significado/dxOp/spr con inline-edit (`iniciarEdicion`/`guardarEdicion`); prescripciones/observaciones/RSS/adherencia solo lectura. |
| Panel LEVA | "Grabación Asistida por LEVA" (~960-1173): graba, sube audio, poll de propuesta, `LevaProposalReview` (aprobación human-in-the-loop). |
| Llenado LEVA | `aplicarPropuestaAlExpediente()` (~877) y `onProposalApproved()` (~934): rellenan `protocol`, `dxOp`, `spr`, `px`, `f2`, `add` (nota sellada), `status='validado'`. **No** tocan VC/VG. |
| Semáforo | `VcSemaphoreComponent` ya renderiza el semáforo en el modal; el estado VC/VG vive en `newVcPercepcion`, `newVcPensamientos`, `newVgYo`, etc. |
| Modelo `Sesion` (backend, dominio) | Ya contiene todos los campos clínicos: `fase`, `protocolo`, `dxOperativo`, `significado`, `spr`, `trastorno`, `px`, `f1`, `f2`, `oss`, `adherencia`, `cumplimiento`, `rss`, `eff`, `notas`, `observacionesProximaSesion`, `situacion`, `duracionAudio`, `status`, `citaId`, `valoracionCambio`, `valoracionGlobal` (además de `id`, `numero`, `fecha`, `expedienteId`, `creadoPorId`, `createdAt`, `updatedAt`). (Nota: el frontend `Session` usa `add` como alias de `adherencia`, y `dxOp`/`notes`/`observationsNextSession`/`audioDuration`.) |
| Contrato backend | `POST /expedientes/paciente/{id}/sesiones` (crea `borrador`), `PATCH /expedientes/sesiones/{id}` (fusión parcial), `PUT /expedientes/sesiones/{id}/criterios`. **`SesionUpdateRequest` NO acepta `protocol`, `f2`, `cumplimiento`, `eff`, `notes`, `observationsNextSession`, `situation`, `valoracionCambio`, `valoracionGlobal`** → requiere ampliación (GAP-MR-09). |
| Modo IA/Manual | `pacientes.registry_mode` (V3) / `patient.registryMode` (`'ia' | 'manual'`). El backend calcula `grabacionLeva` en dashboard/mi-consulta, **pero `expediente-clinico` no lo tiene**; la card debe derivar el modo de `patient.registryMode === 'ia'`. |
| Propuesta LEVA | `StructuredProposalData` tiene `valoracionDelCambio` **textual**; no hay mapeo al `VcEntry` estructurado (6 categorías) ni al `VgEntry`. |
| Criterios clínicos | Subtab "Criterios Clínicos" existente (`listarCriteriosSesion`/`guardarCriteriosSesion`), reutilizable en la card. |

---

## 3. Matriz de brechas (GAP-MR)

| ID | Tipo | Brecha | Impacto | Acción propuesta |
| :--- | :--- | :--- | :--- | :--- |
| GAP-MR-01 | MISSING | El formulario manual vive en un **modal aparte** (`showSessionModal`), separado de la card de sesión. | Dos UI para el mismo dato; el terapeuta no ve "la sesión completa" en un solo lugar. | **Trasladar el contenido del modal a la card**: protocolo, prescripción, observaciones, VC y VG renderizados inline dentro de la card. Eliminar el modal (conservar solo la acción que dispara la edición). |
| GAP-MR-02 | MISSING | No existe un **modo de registro** por sesión: la card siempre muestra el panel de grabación LEVA, aun cuando el paciente es `manual`. | Con paciente sin consentimiento, se muestra un panel de grabación que no debería usarse. | Añadir estado de modo a la card (`LEVA` | `MANUAL`) derivado de `patient.registryMode` al iniciar la sesión. En `MANUAL` ocultar/deshabilitar el panel de grabación y mostrar el formulario completo. |
| GAP-MR-03 | PARTIAL | LEVA **no** llena el semáforo: la propuesta expone `valoracionDelCambio` textual, sin mapeo a `VcEntry`/`VgEntry`. | El semáforo queda vacío en modo LEVA; inconsistencia con el modo manual. | **VC/VG siempre manual** (juicio clínico). Opcional futuro: LEVA *sugiere* un valor y el terapeuta confirma. Documentar el mapeo textual→estructurado solo si se implementa la sugerencia. |
| GAP-MR-04 | PARTIAL | Cobertura de campos inconsistente: el modal manual captura VC/VG pero **no** `spr`/`significado`/`cumplimiento`; LEVA captura `spr`/`dxOp` pero **no** VC/VG. | Campos sin dueño según el modo; datos ambiguos. | Definir **ownership explícito**: LEVA prellena `dxOp`, `spr`, `protocol`, `px`, nota SOAP (en `notes`/`oss`), `f2`; el terapeuta llena `phase`, `significado`, `cumplimiento`, `rss`, `eff`, `notes`, `observationsNextSession`, `situation`, VC, VG, criterios. Todos visibles en la misma card. ⚠️ `add` mapea a `adherencia`; la nota SOAP no va en `add`. |
| GAP-MR-05 | MISSING | Al eliminar el modal, falta una acción que **cree una sesión en blanco** y abra la card en edición (para sesiones manuales sin cita). | No habría forma de registrar una sesión manual desde cero. | Conservar "Nueva Sesión" (`+`) que cree una sesión `borrador` (reutilizando `agregarSesion`) y seleccione la card en modo edición. El flujo "Atender" ya crea la sesión desde la cita. |
| GAP-MR-06 | PARTIAL | La card es mayormente **solo lectura** con inline-edit puntual; no es un formulario completo editable. | No se pueden llenar todos los campos desde la card. | Card editable en `status='borrador'` y solo lectura en `status='validado'`. Todos los campos (`phase`, `significado`, `dxOp`, `spr`, `protocol`, `px`, `oss`, `add` (adherencia), `cumplimiento`, `rss`, `eff`, `notes`, `observationsNextSession`, `situation`, VC, VG) se editan inline. |
| GAP-MR-07 | DECISION | ¿Persistir `modo_registro` en `sesiones` o derivarlo del paciente? | Si una sesión debe poder ser manual aunque el paciente sea `ia` (o viceversa), hace falta persistir el modo. | **MVP**: derivar el modo de `patient.registryMode` (columna `pacientes.registry_mode`, V3), sin columna nueva. **Futuro opcional**: columna `modo_registro VARCHAR(10)` en `sesiones` (V40). |
| GAP-MR-08 | MISSING | Sin tests del flujo unificado (modo LEVA vs manual, y edición inline). | Regresión no detectada al consolidar la UI. | Tests frontend/E2E: (a) paciente `manual` → card sin panel de grabación y formulario completo; (b) paciente `ia` → panel de grabación + semáforo manual; (c) guardar en `borrador` persiste todos los campos vía el mismo `PATCH`. |
| GAP-MR-09 | MISSING (backend) | `SesionUpdateRequest` no acepta `protocol`, `f2`, `cumplimiento`, `eff`, `notes`, `observationsNextSession`, `situation`, `valoracionCambio`, `valoracionGlobal`. | La card no puede persistir su formulario completo vía `PATCH`. | Ampliar `SesionUpdateRequest` + `SesionRestMapper.toParcial` + `SesionApplicationService.actualizar` para esos campos. |
| GAP-MR-10 | INCORRECT | Colisión semántica de `add`: el API mapea `add`→`adherencia`, pero el frontend usa `Session.add` como nota SOAP (LEVA sella la nota en `add`). | La nota SOAP se persiste en el campo de adherencia. | `add`/`adherencia` = adherencia; la nota SOAP va en `notes`/`oss`. Corregir `onProposalApproved`/`aplicarPropuestaAlExpediente` y el mapeo. |

---

## 4. Diseño propuesto (resumen ejecutivo)

### 4.1 Card de sesión unificada

```text
Card de Sesión #N  (fecha · estado)
├─ Modo MANUAL (patient.registryMode !== 'ia')
│     • sin panel "Grabación Asistida por LEVA"
│     • formulario completo editable: protocol, px, oss, phase, significado, dxOp, spr,
│       add (adherencia), cumplimiento, rss, eff, notes, observationsNextSession,
│       situation, VC (semáforo), VG (esferas)
│     • [Guardar Sesión]  → PATCH /expedientes/sesiones/{id}
├─ Modo LEVA (patient.registryMode === 'ia')
│     • panel "Grabación Asistida por LEVA"
│     • LEVA prellena: dxOp, spr, protocol, px, nota SOAP (notes/oss), f2
│     • terapeuta llena: phase, significado, add (adherencia), cumplimiento, rss, eff,
│       notes, observationsNextSession, situation, VC, VG, criterios
└─ status = validado → solo lectura (nota sellada)
```

### 4.2 Ownership de campos (nombres = campos TypeScript)

| Campo | LEVA activa | Manual |
| :--- | :--- | :--- |
| dxOp, spr, protocol, px, nota SOAP (`notes`/`oss`), f2 | **LEVA prellena** (editable) | terapeuta |
| phase, significado, add (adherencia), cumplimiento, rss, eff, notes, observationsNextSession, situation | terapeuta | terapeuta |
| VC (6 categorías), VG (esferas) | terapeuta (siempre) | terapeuta |
| criterios clínicos | terapeuta | terapeuta |

### 4.3 Contrato backend (requiere ampliación)

Se reutilizan `POST /expedientes/paciente/{id}/sesiones` (crear `borrador`) y `PUT /expedientes/sesiones/{id}/criterios`. Para editar la sesión completa vía `PATCH /expedientes/sesiones/{id}` hay que **ampliar `SesionUpdateRequest`** con `protocol`, `f2`, `cumplimiento`, `eff`, `notes`, `observationsNextSession`, `situation`, `valoracionCambio`, `valoracionGlobal` (GAP-MR-09).

---

## 5. Recomendaciones para demo-gap-implementation

1. **Backend**: ampliar `SesionUpdateRequest` + `toParcial` + `actualizar` (GAP-MR-09) y resolver la colisión `add`/`adherencia` (GAP-MR-10).
2. **Frontend**: trasladar el contenido del modal a la card (GAP-MR-01), añadir modo LEVA/MANUAL derivado de `patient.registryMode` (GAP-MR-02) y formulario completo editable/lectura (GAP-MR-06).
3. Definir ownership de campos (GAP-MR-04) y dejar VC/VG manual (GAP-MR-03).
4. Conservar acción "Nueva Sesión" para sesiones manuales sin cita (GAP-MR-05).
5. Decisión de persistencia de modo: derivar del paciente (MVP, `registry_mode` V3) o columna `modo_registro` opcional (GAP-MR-07).
6. Tests del flujo unificado (GAP-MR-08).
7. Conforme a ADR-001 (Hexagonal/SDOP), ADR-002 (Dual Adapters), ADR-003 (Backend hexagonal y OpenAPI).

---

## 6. Resultados de auditoría (v1.1.0)

Auditoría cruzada con `jarvis-frontend`, `jarvis-backend` y `jarvis-database` (READ-ONLY) el 2026-11-23. Correcciones incorporadas en esta versión.

| Agente | Veredicto |
| :--- | :--- |
| jarvis-frontend | ⚠️ OBSERVACIONES (5 correcciones) |
| jarvis-backend | ❌ RECHAZADO (premisa "sin backend" falsa) → corregido |
| jarvis-database | ⚠️ OBSERVACIONES (no bloqueantes) |

### 6.1 Correcciones clave incorporadas

1. **Backend**: la premisa "sin cambios backend" era falsa → nueva GAP-MR-09 y ampliación de `SesionUpdateRequest` en el SDD §4.2.
2. **`add`/`adherencia`**: colisión resuelta (GAP-MR-10): `add`=adherencia; nota SOAP en `notes`/`oss`.
3. **Frontend**: `adherencia` no existe en `Session`; `grabacionLeva` no existe en `expediente-clinico` → usar `patient.registryMode`.
4. **DB**: versionado de columnas (V7/V8/V17/V19) y V40 innecesario para el MVP (derivar de `pacientes.registry_mode`).
