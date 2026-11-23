# SDD-MODO-REGISTRO-1: Software Design Document — Modo de Registro de Sesión (card unificada LEVA/Manual)

- **Módulos**: `expediente-clinico` (frontend Angular 18 standalone) · contexto `expediente` (backend Spring Boot, hexagonal) · motor `leva` (fuente de datos, sin cambios)
- **Código SDD**: `SDD-MODO-REGISTRO-1`
- **Versión**: 1.1.0
- **Fecha**: 2026-11-23
- **Estado**: ESPECIFICADO + AUDITADO — jarvis-backend ❌ (corregido en v1.1.0) · jarvis-frontend ⚠️ (corregido) · jarvis-database ⚠️ (corregido)
- **Sucede a**: `SDD-TOMA-SESION-1` (toma de sesión) y `V39__pagos_cancelacion_citas.sql`
- **Migración nueva**: **ninguna requerida** (MVP deriva el modo del paciente desde `pacientes.registry_mode`). Opcional futuro: `V40__modo_registro_sesion.sql`
- **Fuente de verdad**: `docs/gap-analysis/gap-report-modo-registro-sesion.md`
- **Alineación**: ADR-001 (Hexagonal/SDOP), ADR-002 (Dual Adapters), ADR-003 (Backend hexagonal y OpenAPI)

> **Regla de Oro**: reutilizar el modelo `Sesion` y los endpoints existentes. Este documento **no** escribe código fuente; es la especificación que consumirá la implementación.

---

## 0. Propósito y alcance

Hoy la sesión se registra por tres vías (modal manual, card de solo lectura con inline-edit, y flujo LEVA) que capturan subconjuntos distintos de campos, generando datos ambiguos. Se **unifica la captura en una sola card de sesión**:

- **LEVA activa** → panel de grabación; LEVA prellena los campos narrativos; el terapeuta completa el resto (el semáforo VC/VG es siempre manual).
- **LEVA inactiva** → sin panel de grabación; el terapeuta llena todos los campos.

El modelo de datos no cambia: ambos modos escriben al mismo `Sesion` / tabla `sesiones` con los mismos endpoints.

### 0.1 Resultado esperado

1. La card de sesión contiene **todos** los campos editables en un solo lugar (desaparece el modal "Registrar Nueva Sesión TBE").
2. El modo (`LEVA`/`MANUAL`) se determina al iniciar la sesión según `patient.registryMode` (`'ia'` → LEVA; en caso contrario → MANUAL).
3. En modo `MANUAL` no se muestra el panel de grabación; se muestra el formulario completo.
4. En modo `LEVA`, LEVA prellena solo `dxOp`, `spr`, `protocol`, `px`, nota SOAP y `f2`; el semáforo VC/VG y el resto los llena el terapeuta.
5. En `status='validado'` la card es de solo lectura.

### 0.2 Decisiones adoptadas

| # | Decisión |
| :-- | :-- |
| D-1 | **Consolidar** el formulario manual dentro de la card (eliminar el modal); una sola UI para capturar la sesión. |
| D-2 | **Modo por sesión** derivado de `patient.registryMode === 'ia'` (el componente `expediente-clinico` no tiene `grabacionLeva`): `LEVA` si es `ia`, `MANUAL` si no. |
| D-3 | **Ownership de campos**: LEVA prellena `dxOp`, `spr`, `protocol`, `px`, la nota SOAP (en `notes`/`oss`), `f2`; el terapeuta llena `phase`, `significado`, `cumplimiento`, `rss`, `eff`, `notes`, `observationsNextSession`, `situation`, `valoracionCambio`, `valoracionGlobal` y criterios. Los campos prellenados por LEVA siguen siendo **editables**. ⚠️ `add` en el API mapea a `adherencia`; la nota SOAP **no** debe guardarse en `add` (ver §4.3). |
| D-4 | **VC/VG siempre manual** (juicio clínico, human-in-the-loop). Opcional futuro: LEVA sugiere y el terapeuta confirma. |
| D-5 | **Ampliar el contrato de edición**: reutilizar `POST /expedientes/paciente/{id}/sesiones` (crear) y `PATCH /expedientes/sesiones/{id}` (editar), pero **ampliar `SesionUpdateRequest`** para soportar `protocol`, `f2`, `cumplimiento`, `eff`, `notes`, `observationsNextSession`, `situation`, `valoracionCambio`, `valoracionGlobal` (hoy no los acepta). Ver §4. |
| D-6 | **Acción "Nueva Sesión"** (`+`) conservada para crear una sesión `borrador` sin cita y abrir la card en edición. El flujo "Atender" ya crea la sesión desde la cita. |
| D-7 | **MVP sin migración**: el modo se deriva de `pacientes.registry_mode` (ya existe desde V3). **Futuro opcional**: columna `modo_registro VARCHAR(10)` en `sesiones` (V40) si una sesión debe poder forzar un modo distinto al del paciente. |
| D-8 | **Estados de la card**: editable en `borrador`, solo lectura en `validado`. |

---

## 1. Brecha documental

La brecha completa está en `gap-report-modo-registro-sesion.md`. Resumen:

| ID | Tipo | Brecha |
| :-- | :-- | :-- |
| GAP-MR-01 | MISSING | El formulario manual vive en un modal aparte, no en la card. |
| GAP-MR-02 | MISSING | No existe modo de registro por sesión; la card siempre muestra grabación. |
| GAP-MR-03 | PARTIAL | LEVA no llena VC/VG (solo `valoracionDelCambio` textual). |
| GAP-MR-04 | PARTIAL | Cobertura de campos inconsistente entre modal manual y LEVA. |
| GAP-MR-05 | MISSING | Falta acción para crear sesión manual en blanco sin cita. |
| GAP-MR-06 | PARTIAL | La card es de solo lectura con inline-edit puntual. |
| GAP-MR-07 | DECISION | Persistir `modo_registro` vs derivar del paciente. |
| GAP-MR-08 | MISSING | Sin tests del flujo unificado. |

---

## 2. Modelo de datos

**Sin cambios en el MVP.** Se reutiliza la tabla `sesiones` — columnas base en V7, `valoracion_cambio`/`valoracion_global` en V8, `cita_id` en V17, `significado`/`spr` en V19 — con sus columnas clínicas: `fase`, `protocolo`, `dx_operativo`, `significado`, `spr`, `trastorno`, `px` (jsonb), `f1`, `f2`, `oss`, `adherencia`, `cumplimiento`, `rss`, `eff`, `notas`, `observaciones_proxima_sesion`, `situacion`, `duracion_audio`, `status`, `cita_id`, `valoracion_cambio` (jsonb), `valoracion_global` (jsonb); además de `id`, `expediente_id`, `numero`, `fecha`, `creado_por_id`, `created_at` y `updated_at`.

### 2.1 Futuro opcional — `V40__modo_registro_sesion.sql`

```sql
-- V40: Modo de registro por sesión (opcional, solo si se decide persistir el modo)
ALTER TABLE sesiones ADD COLUMN IF NOT EXISTS modo_registro VARCHAR(10);
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
                   WHERE c.conname = 'ck_sesiones_modo_registro' AND t.relname = 'sesiones') THEN
        ALTER TABLE sesiones ADD CONSTRAINT ck_sesiones_modo_registro
            CHECK (modo_registro IS NULL OR modo_registro IN ('LEVA','MANUAL'));
    END IF;
END $$;
```

> **MVP**: no se aplica; el modo se deriva de `patient.registryMode` en el frontend.

---

## 3. Diseño frontend — Card de sesión unificada

### 3.1 Estructura de la card (modo `borrador`)

```text
Card de Sesión #N (fecha · BORRADOR)
├─ Cabecera: número, fecha, badge de estado (EN CURSO / VALIDADO)
├─ @if (modo === 'LEVA')
│     • Panel "Grabación Asistida por LEVA" (ya existente)
│     • LevaProposalReview (aprobación → prellena campos narrativos)
├─ Formulario (siempre visible, editable en borrador):
│     Fase · Significado · Dx Operativo · SPR
│     Protocolo · Prescripciones (px) · Observaciones (oss)
│     Adherencia (add) · Cumplimiento · RSS · EFF
│     Notas (notes) · Observaciones próxima sesión (observationsNextSession) · Situación (situation)
│     Valoración del Cambio (semáforo 6 categorías)
│     Valoración Global (YO / DEMÁS / MUNDO)
│     Criterios Clínicos
└─ [Guardar Sesión]  → PATCH /expedientes/sesiones/{id}
```

### 3.2 Comportamiento por modo

| | LEVA | MANUAL |
| :--- | :--- | :--- |
| Panel de grabación | visible | oculto |
| dxOp, spr, protocol, px, nota SOAP, f2 | prellenados por LEVA (editables) | vacíos, los llena el terapeuta |
| phase, significado, add (adherencia), cumplimiento, rss, eff, notes, observationsNextSession, situation | terapeuta | terapeuta |
| VC (semáforo), VG (esferas), criterios | terapeuta (siempre) | terapeuta |

### 3.3 Estados y edición

- `status='borrador'` → formulario **editable**.
- `status='validado'` → **solo lectura** (nota sellada); sin botón "Guardar".
- El modo (`LEVA`/`MANUAL`) se resuelve al cargar/crear la sesión desde `patient.registryMode === 'ia'`.

### 3.4 Reutilización

- `VcSemaphoreComponent` (semáforo) se renderiza **dentro** de la card en lugar del modal.
- La lógica de `guardarSesion()` se reutiliza como "Guardar Sesión" de la card. **Nota**: hoy `guardarSesion()` solo hace `POST` (crea); para editar una sesión existente debe usarse `PATCH` (hoy `actualizarSesion` solo cubre un subconjunto de campos; ver §4.2).
- El inline-edit existente (`iniciarEdicion`/`guardarEdicion`) se reemplaza por el formulario completo (o se conserva como edición por campo).
- "Nueva Sesión" (`+`) crea una sesión `borrador` (POST) y abre la card en edición.

---

## 4. Contratos

### 4.1 Endpoints (sin endpoints ni permisos nuevos)

| Acción | Endpoint | Permiso |
| :--- | :--- | :--- |
| Crear sesión en blanco | `POST /expedientes/paciente/{id}/sesiones` | `EXPEDIENTE_ESCRIBIR` |
| Guardar/validar sesión | `PATCH /expedientes/sesiones/{id}` | `EXPEDIENTE_ESCRIBIR` |
| Criterios clínicos | `PUT /expedientes/sesiones/{id}/criterios` | `EXPEDIENTE_ESCRIBIR` |

### 4.2 Ampliación de `SesionUpdateRequest` (backend, requerida)

La card edita todos los campos de la sesión; hoy `SesionUpdateRequest` solo acepta `phase, significado, dxOp, spr, trastorno, px, oss, add, rss, status`. Hay que ampliarlo:

| Campo de la card | Clave a añadir a `SesionUpdateRequest` |
| :--- | :--- |
| Protocolo | `protocol` |
| Punto clave (f2) | `f2` |
| Cumplimiento | `cumplimiento` |
| EFF | `eff` |
| Notas | `notes` |
| Observaciones próxima sesión | `observationsNextSession` |
| Situación | `situation` |
| Valoración del Cambio | `valoracionCambio` (`VcEntry`) |
| Valoración Global | `valoracionGlobal` (`VgEntry`) |

Acompañar con:
- `SesionRestMapper.toParcial()`: mapear las claves nuevas (del DTO al dominio): `r.protocol()` → `.protocolo(…)`, `r.notes()` → `.notas(…)`, `r.observationsNextSession()` → `.observacionesProximaSesion(…)`, `r.situation()` → `.situacion(…)`; `f2`, `cumplimiento`, `eff`, `valoracionCambio`, `valoracionGlobal` se mapean 1:1.
- `SesionApplicationService.actualizar()`: fusionar esos campos en el PATCH.

> `SesionCreateRequest` ya soporta la mayoría de estos campos (excepto `significado`/`spr`, que se capturan al editar).

### 4.3 Semántica de `add` vs `adherencia` (colisión a resolver)

En el API, la clave `add` mapea al campo de dominio `adherencia` (columna `adherencia`). El frontend usa `Session.add` como **nota SOAP** (LEVA sella la nota en `add`). Decisión:
- `add`/`adherencia` = **adherencia** (valor clínico).
- La **nota SOAP** de LEVA debe guardarse en `notes` (o `oss`), no en `add`.

---

## 5. Pruebas (Quality Gates)

### 5.1 Frontend / E2E

1. Paciente `registryMode='manual'` → al abrir la sesión, **no** se muestra el panel de grabación; el formulario completo está visible y editable.
2. Paciente `registryMode='ia'` → se muestra el panel de grabación y, tras aprobar la propuesta, los campos narrativos quedan prellenados; el semáforo VC/VG queda vacío para captura manual.
3. En `borrador`, "Guardar Sesión" persiste todos los campos vía `PATCH`; al pasar a `validado`, la card queda en solo lectura.
4. "Nueva Sesión" (`+`) crea una sesión `borrador` sin cita y abre la card editable.
5. La propuesta LEVA aprobada sigue siendo editable manualmente en la card.

### 5.2 Cobertura

- ≥ 80% en la lógica de modo/edición de la card (componente `expediente-clinico`).

---

## 6. Plan de implementación (secuencial)

1. **Backend**: ampliar `SesionUpdateRequest` + `toParcial` + `actualizar` (GAP-MR-09) y resolver la colisión `add`/`adherencia` (GAP-MR-10).
2. **Frontend**: trasladar el contenido del modal a la card (protocolo, prescripción, observaciones, VC, VG) — GAP-MR-01.
3. **Frontend**: añadir `modo` (`LEVA`/`MANUAL`) derivado de `patient.registryMode` y condicionar el panel de grabación — GAP-MR-02.
4. **Frontend**: formulario completo editable en `borrador` / solo lectura en `validado` — GAP-MR-06.
5. **Frontend**: unificar ownership de campos (D-3) y conservar VC/VG manual (D-4) — GAP-MR-03/04.
6. **Frontend**: acción "Nueva Sesión" que crea `borrador` sin cita — GAP-MR-05.
7. **QA**: tests del flujo unificado — GAP-MR-08.
8. **Auditoría**: jarvis-backend (contrato), jarvis-frontend (UX/estado) y jarvis-reviewer (SOLID/DRY).

---

## 7. Notas y riesgos

- **Alcance**: refactor de UI + **ampliación de `SesionUpdateRequest`** (el esquema de BD no cambia en el MVP).
- **Consistencia**: todos los campos editables viven en la card; no debe quedar ningún campo solo en el modal.
- **Semáforo**: nunca auto-sellado por LEVA (riesgo clínico); queda como captura humana.
- **`add`/`adherencia`**: resolver la colisión antes de implementar (ver §4.3); la nota SOAP va a `notes`/`oss`.
- **Modo por sesión**: si en el futuro se requiere forzar un modo distinto al del paciente, usar `modo_registro` (V40) en vez de derivarlo.
- **Compatibilidad mock**: el adaptador LocalStorage de expediente debe reflejar el mismo comportamiento (modo + formulario) para `features.expedienteClinicoBackend=false`.

---

## 8. Changelog de auditoría (v1.1.0)

| # | Origen | Corrección incorporada |
| :-- | :-- | :-- |
| 1 | jarvis-backend | La premisa "sin cambios backend" era falsa → D-5 ahora exige ampliar `SesionUpdateRequest` + `toParcial` + `actualizar` (§4.2). |
| 2 | jarvis-backend | `protocol` y `f2` que envía `onProposalApproved` hoy se descartan → cubiertos en la ampliación. |
| 3 | jarvis-frontend/backend | Colisión `add`/`adherencia` → §4.3 define `add`=adherencia y la nota SOAP en `notes`/`oss`. |
| 4 | jarvis-frontend | `adherencia` no existe en `Session` → ownership corregido a los campos TypeScript reales. |
| 5 | jarvis-frontend | `grabacionLeva` no existe en `expediente-clinico` → D-2 usa `patient.registryMode === 'ia'`. |
| 6 | jarvis-frontend | `guardarSesion()` solo hace POST → §3.4 aclara que editar exige PATCH. |
| 7 | jarvis-database | Versionado de columnas: V7 base + V8 (VC/VG) + V17 (cita_id) + V19 (significado/spr). |
| 8 | jarvis-database | V40 es innecesario para el MVP: derivar de `pacientes.registry_mode` (V3). |
