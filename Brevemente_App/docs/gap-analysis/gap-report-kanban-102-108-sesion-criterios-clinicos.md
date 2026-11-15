# GAP Analysis Report: Edición de Sesión y Criterios Clínicos (Kanban #102–#108)

- **Fecha**: 2026-10-26
- **Módulo**: `expediente-clinico` (Angular) — Detalle de Sesión (subtab `sesiones`), tab VC (`vc`) y Registro de Criterios Clínicos
- **Estado**: AUDITADO (READ-ONLY) — Skill `demo-gap-analysis`
- **Origen**: Issues del tablero Kanban #102, #103, #104, #105, #106, #107, #108
- **Rutas reales auditadas**:
  - Frontend: `Brevemente_App/frontend/src/app/modules/expediente-clinico/` (componente, HTML, puerto, adapters) y `Brevemente_App/frontend/src/app/core/types/clinical.types.ts`
  - Backend: `Brevemente_App/backend/src/main/java/com/syborx/brevemente/expediente/` (dominio, application service, REST, persistencia)
  - BD: `Brevemente_App/backend/src/main/resources/db/migration/` — tabla `sesiones` en `V7__introduce_expediente_extension.sql`; columnas `valoracion_cambio`/`valoracion_global` en `V8__introduce_expediente_fase2.sql`; `cita_id` en `V17__introduce_portal_paciente.sql`
  - Demo React de referencia: `brevemente_demo/src/pages/ClinicalRecord.tsx`

> **Contexto**: el backend ya soporta **crear** y **listar** sesiones (V7 + `SesionApplicationService` + `ExpedienteRestController`), con los campos `fase`, `protocolo`, `dx_operativo`, `trastorno`, `px`, `f1`, `f2`, `oss`, `adherencia`, `cumplimiento`, `rss`, `eff`, `notas`, `observaciones_proxima_sesion`, `situacion`, `duracion_audio`, `status`, `valoracion_cambio` (JSONB `VcEntry`) y `valoracion_global` (JSONB `VgEntry`). Lo que **no existe** es la capacidad de **editar** una sesión existente, ni los campos de significado/SPR a nivel de sesión, ni el modelo de "Criterios Clínicos" por sesión. Este informe mapea exactamente qué falta para cerrar las 7 tareas del tablero.

---

## 1. Inventario de Componentes Auditados

### 1.1 Frontend Angular — estado real

| Capa | Archivo | Estado |
| :--- | :--- | :--- |
| Tipos | `core/types/clinical.types.ts` | `Session` tiene `phase`, `protocol`, `dxOp`, `trastorno?`, `px`, `f1`, `f2`, `oss`, `add`, `cumplimiento?`, `rss`, `eff`, `notes`, `observationsNextSession`, `situation`, `audioDuration?`, `status`, `valoracionCambio?` (`VcEntry`), `valoracionGlobal?` (`VgEntry`). **Sin** `significado` ni `spr`. |
| Puerto | `ports/expediente.repository.ts` | Métodos de lectura + `agregarSesion` (POST) + `actualizarExpediente` (PATCH). **Sin** método de actualización de sesión. |
| Adapter HTTP | `adapters/expediente-http.adapter.ts` | Implementa `GET/POST /expedientes/.../sesiones` y `PATCH /expedientes/paciente/{id}`. **Sin** PATCH por sesión. |
| Adapter mock | `adapters/expediente-localstorage.adapter.ts` | `agregarSesion` persiste en localStorage; sin actualización de sesión. |
| Componente | `expediente-clinico.component.ts` | `selectedSession`, `sessions`, `record`; `guardarDx`, `guardarPsiquiatria`, `guardarSesion` (crea sesión con `phase` hardcodeado en línea 376). **Sin** método de edición de sesión. |
| Vista | `expediente-clinico.component.html` | Detalle de sesión (líneas 334-361) en etiquetas `<p>` de solo lectura: no muestra `dxOp`, `significado` ni `spr`. Lista de sesiones muestra badge `{{ s.phase }}` (línea 328) solo lectura. Tab VC (`vc`) = tabla de texto plano. Modal "Nueva Sesión" = captura VC con `<select>` de texto (solo **Percepción** tiene 5 opciones; los otros 5 criterios tienen 4). |

### 1.2 Backend Spring Boot — estado real

| Endpoint | Método | Permiso | Estado |
| :--- | :--- | :--- | :---: |
| `/expedientes/paciente/{pacienteId}` | GET | `EXPEDIENTE_LEER` | ✅ |
| `/expedientes/paciente/{pacienteId}` | PATCH | `EXPEDIENTE_ESCRIBIR` | ✅ (actualiza **expediente**, no sesión) |
| `/expedientes/paciente/{pacienteId}/sesiones` | GET | `EXPEDIENTE_LEER` | ✅ |
| `/expedientes/sesiones/borradores` | GET | `EXPEDIENTE_LEER` | ✅ (con bug: `creadoPorId` no se asigna — ver §6.1) |
| `/expedientes/paciente/{pacienteId}/sesiones` | POST | `EXPEDIENTE_ESCRIBIR` | ✅ |
| `PATCH /expedientes/sesiones/{sesionId}` | — | — | ❌ **No existe** |

- `SesionApplicationService` implementa solo `ListarSesionesUseCase` y `AgregarSesionUseCase`. **No existe** `ActualizarSesionUseCase`.
- `Sesion` (dominio) y `SesionJpaEntity` tienen `fase` y `dxOperativo` (`dx_operativo`), pero **no** `significado` ni `spr`.
- `VcEntry` (dominio) documenta la escala literal: `"Marcador de inicio"`, `"Sin cambios"`, `"Mejoría leve"`, `"Mejoría significativa"`, `"Nuevo patrón"`, `"Empeoramiento"`, `"Recaída"` (solo Javadoc; los campos son `String` libres sin enum/CHECK/validación). El frontend expone un subconjunto en `<select>` sin "Marcador de inicio" ni "Recaída".

### 1.3 Migración Flyway

- `V7__introduce_expediente_extension.sql` creó la tabla `sesiones` con `fase VARCHAR(100)`, `dx_operativo TEXT`, `status VARCHAR(10)` + CHECK (`borrador`/`validado`), `UNIQUE (expediente_id, numero)` y FK `creado_por_id → terapeutas(id)` (sin `ON DELETE`).
- `V8__introduce_expediente_fase2.sql` añadió `valoracion_cambio JSONB` y `valoracion_global JSONB` (sin `NOT NULL` ni `DEFAULT`; seed solo para `ses-001`/`ses-002`).
- `V17__introduce_portal_paciente.sql` añadió `cita_id VARCHAR(36)` + FK `fk_sesiones_cita` + índice.
- **No existen** columnas `significado` ni `spr` en `sesiones` (sí existen `spr_inicial` en `expedientes_clinicos` (V7) y `spr` en `supervision_bitacoras` (V8)).
- **No existe** tabla para "Criterios Clínicos" por sesión (categorías: conductual, racionalizaciones-intelectualizaciones, comparaciones, imágenes intrusivas).
- No hay `CHECK (numero >= 1)` ni catálogo cerrado para `fase`/`protocolo`; no hay índice compuesto `(expediente_id, status)`.
- Última migración aplicada: `V18`. Se requerirá una **`V19__...`** para los cambios de esquema.

---

## 2. Matriz de Reutilización de Código Existente (ADAPTAR VS CREAR)

| Componente | Estado Actual | Estrategia SDOP |
| :--- | :--- | :--- |
| `SesionJpaEntity` / tabla `sesiones` | Columnas `fase`, `dx_operativo` existen | **REUTILIZAR**; añadir columnas `significado`, `spr` vía `V19` |
| `Sesion` (dominio) / `SesionResponseDTO` / `SesionRestMapper` | Campo `fase`/`dxOp` ya mapeados | **EXTENDER** con `significado`, `spr` |
| `SesionCreateRequest` | Acepta `phase`, `dxOp`, VC/VG | **REUTILIZAR** para creación; crear `SesionUpdateRequest` para edición |
| `SesionApplicationService` | `listarPorPaciente`, `listarBorradores`, `agregar` | **EXTENDER** con `ActualizarSesionUseCase` |
| `ExpedienteRestController` | GET/POST sesiones | **EXTENDER** con `PATCH /sesiones/{id}` (`EXPEDIENTE_ESCRIBIR`) |
| `VcEntry` (dominio) | Escala de 7 estados documentada (sin enforcement) | **REUTILIZAR** como base del catálogo del semáforo VC (tipar y validar) |
| `risk-semaphore` / variante `semaforo` de `kpi-card` | Semáforo **binario** de riesgo (punto rojo encendido/apagado), no escala de 5 estados | **NO reutilizar tal cual**; crear componente nuevo `vc-semaphore` de 5 estados; tomar solo la idea de badge |
| Tipos TS `Session`, `VcEntry` | Simétricos con DTOs (con matiz `patientId` null, ver §6) | **EXTENDER** con `significado`, `spr` |
| Demo `ClinicalRecord.tsx` | Tabla "Registro de Criterios Clínicos por Sesión" = solo tabla VC de 6 dimensiones | **CREAR** (la demo NO tiene las categorías conductual/racionalizaciones/comparaciones/imágenes) |

---

## 3. Matriz de Brechas (GAPs) Identificadas

| ID | Issue | Tipo | Descripción de la Brecha | Impacto | Acción Propuesta |
| :--- | :--- | :--- | :--- | :--- | :--- |
| GAP-K01 | #102 | **MISSING** (backend) / **PARTIAL** (UI) | Badge de fase (`{{ s.phase }}`) es solo lectura y no hay endpoint de actualización de sesión. La columna `fase` y el campo `phase` ya existen. | Alto | Crear `PATCH /expedientes/sesiones/{id}` + `SesionUpdateRequest`; en UI, badge clic-para-editar (select de fases). |
| GAP-K02 | #103 | **MISSING** | El campo "significado" ("Miedo al conflicto") no existe en modelo/BD; el `dxOp` existe pero no se muestra ni se edita en el detalle de sesión. | Alto | Añadir `significado` (y mostrar/editar `dxOp`) en sesión: columna + dominio + DTO + UI editable. |
| GAP-K03 | #104 | **MISSING** | No existe `spr` a nivel de sesión (solo `spr_inicial` en expediente). El detalle de sesión no muestra ni edita el SPR. | Alto | Añadir `spr` a sesión (columna + dominio + DTO) y edición inline sin reabrir el DX completo. |
| GAP-K04 | #105 | **MISSING** (UI) | El historial de VC es texto plano; la captura usa `<select>` de texto (solo Percepción tiene 5 opciones; los demás 4; en ninguno existen "Marcador de inicio" ni "Recaída"). No hay selector visual de 5 estados con color. | Medio | Componente "semáforo VC" de 5 estados (color + etiqueta) para captura e historial; tipar `VcEstado` y corregir `vcValue` (ver §6). |
| GAP-K05 | #106 | **MISSING** | No existe modelo de "Criterios Clínicos" con categorías (racionalizaciones-intelectualizaciones, comparaciones, imágenes intrusivas + otro); el texto libre no existe como menús desplegables. | Medio | Definir modelo de criterios por sesión; UI con menús desplegables por categoría. |
| GAP-K06 | #107 | **MISSING / DATA** | No existe catálogo de opciones del criterio conductual (pedir suavemente / insinuar / delegar / todas / otro). | Medio | Definir catálogo (5 opciones) y cargarlo en la sección "Conductual". |
| GAP-K07 | #108 | **MISSING** (UI) | No existe la sección "Conductual" como bloque colapsable en paridad con los demás criterios. | Bajo | Bloque colapsable "Conductual" alineado con percepción/pensamientos/sensaciones. |
| GAP-K08 | #102/#103/#104 | **MISSING** (backend transversal) | Falta `ActualizarSesionUseCase` + `SesionUpdateRequest` + `PATCH /expedientes/sesiones/{id}` + `SesionRepositoryPort.findById`; sin él, ninguna edición por sesión es posible. Ya existen: validación de `numero ≥ 1` **en app** (`agregar`), `CHECK (status IN ('borrador','validado'))` y `UNIQUE (expediente_id, numero)` **en BD**. Falta: validación de `status` a nivel app y (opcional) `CHECK (numero >= 1)` en BD. | Alto | Implementar el caso de uso de actualización de sesión; `SesionUpdateRequest` con semántica PATCH; validar `status` en app (400) y manejar violaciones de integridad (409/400). |

---

## 4. Recomendaciones para demo-gap-implementation

Orden secuencial sugerido (respetando dependencias):

1. **GAP-K08 (base transversal)**: crear `V19__sesion_edicion_criterios.sql` con:
   - `ALTER TABLE sesiones ADD COLUMN IF NOT EXISTS significado TEXT;`
   - `ALTER TABLE sesiones ADD COLUMN IF NOT EXISTS spr TEXT;` (TEXT por consistencia con `spr_inicial`/`supervision_bitacoras.spr`)
   - `CHECK (numero >= 1)` (opcional, recomendado)
   - Índice compuesto `(expediente_id, status)`
   - (Si #106–#108 se modela relacionalmente, definir la tabla de criterios y catálogo conductual aquí; **requiere definición de negocio previa**.)
2. **GAP-K08 cont.**: dominio `Sesion` + `SesionJpaEntity` + `SesionPersistenceMapper` + `SesionResponseDTO` + `SesionRestMapper` con `significado` y `spr`; `SesionUpdateRequest`; `ActualizarSesionUseCase`; `PATCH /expedientes/sesiones/{id}` (`EXPEDIENTE_ESCRIBIR`).
3. **GAP-K01, K02, K03 (frontend)**: en el detalle de sesión, convertir en editables inline `fase`, `significado`, `dxOp`, `spr`; añadir métodos al puerto + adapters HTTP/localStorage.
4. **GAP-K04**: componente "semáforo VC" (5 estados con color y etiqueta) y reemplazo de `<select>` y tabla de texto.
5. **GAP-K05, K06, K07**: sección "Registro de Criterios Clínicos" por sesión con bloques colapsables por criterio, menús desplegables y catálogo conductual.

### Decisiones de negocio requeridas antes de codificar (#105–#108)

- **#105**: confirmar los 5 estados exactos y sus colores: `marcador inicial / sin mejoría`, `mejoría leve`, `mejoría significativa`, `recaída`, `nuevo patrón`.
- **#106/#107/#108**: definir si "Criterios Clínicos" es una extensión del JSONB `valoracion_cambio` de `sesiones` o una entidad/tabla nueva; y el catálogo cerrado de opciones conductuales.
- **#102/#104**: definir el catálogo cerrado de fases (para el select de fase) y de valores SPR.

---

## 5. Trazabilidad con el documento de pendientes

- Documento de recopilación: `Brevemente_App/docs/tareas-pendientes.md` (7 tareas, todas ❌ pendientes).
- Este informe asigna un GAP-ID a cada issue y define el plan de ataque en bloque.

---

## 6. Hallazgos de la revisión de agentes (JARVIS backend / database / frontend)

> Este informe fue revisado por `jarvis-backend`, `jarvis-database` y `jarvis-frontend` (modo READ-ONLY). Correcciones ya incorporadas arriba. Resumen de hallazgos adicionales:

### 6.1 Backend

- ✅ Las 5 afirmaciones centrales de backend son correctas.
- ⚠️ **Bug detectado (no era parte del alcance original)**: `SesionResponseDTO.patientId` sale `null` — `SesionPersistenceMapper.toDomain` no mapea `pacienteId` (la tabla solo tiene `expediente_id`).
- ⚠️ **Bug detectado**: `creadoPorId` nunca se asigna al crear sesión (`agregar` usa `usuarioId` solo para auditoría), por lo que las sesiones nuevas **nunca aparecen** en `GET /sesiones/borradores` (la query nativa filtra por `creado_por_id IN :terapeutaIds`, que es FK a `terapeutas`, no a `usuarios`).
- ⚠️ `SesionRepositoryPort` **no tiene `findById`**; el PATCH lo necesitará.
- ⚠️ `ExpedienteExceptionHandler` no maneja `DataIntegrityViolationException` (violación de UNIQUE de número o CHECK de status) → devolvería 500. Tampoco hay handler de `MethodArgumentNotValidException` en el paquete `expediente` (el `@Valid` caería en el 400 estándar de Spring).
- ⚠️ `SesionCreateRequest` no expone `status`, `citaId` ni `creadoPorId`; el PATCH debe definir la transición `borrador → validado` y quién puede hacerla.
- ℹ️ Permisos: `EXPEDIENTE_ESCRIBIR` = `rol-001` (admin_platform) + `rol-003` (therapist). `rol-005` (supervisor) solo `EXPEDIENTE_LEER`. `rol-002` (admin_clinical) **no** tiene `EXPEDIENTE_LEER` (gap de roles a confirmar si la demo lo requiere).

### 6.2 Base de datos

- ⚠️ Corrección de atribución: `valoracion_cambio`/`valoracion_global` son de **V8**, no V7 (ya corregido en §1.3).
- ℹ️ `cita_id` fue agregado en **V17** (FK `fk_sesiones_cita`, `ON DELETE SET NULL`).
- ℹ️ `spr` sí existe en `supervision_bitacoras.spr` (V8) y `spr_inicial` en `expedientes_clinicos` (V7); solo falta en `sesiones`. (Además, `expedientes_clinicos` también tiene `valoracion_cambio_inicial` y `valoracion_global_inicial` en V7 — espejo a nivel expediente.)
- ℹ️ Detalles de esquema verificados: `status VARCHAR(10) NOT NULL DEFAULT 'borrador'` + `CHECK ck_sesiones_status ('borrador','validado')`; **sin** `CHECK (numero >= 1)` en BD (la validación de número vive en la app); FK `creado_por_id → terapeutas(id)` **sin** `ON DELETE` (a diferencia de `expediente_id` con `ON DELETE CASCADE`); no hay índice compuesto `(expediente_id, status)`; seed VC/VG solo para `ses-001`/`ses-002` (`ses-003`/`ses-004` —creadas en V7— y `ses-005` —creada en V18— quedan NULL); columnas JSONB sin `NOT NULL` ni `DEFAULT`.
- ℹ️ Recomendación de esquema para V19: `significado TEXT`, `spr TEXT` (consistencia con el vocabulario existente), `CHECK (numero >= 1)`, índice `(expediente_id, status)` (evaluar si sustituye o convive con `idx_sesiones_expediente`).
- ℹ️ Para #106–#108 se sugiere tabla normalizada `sesion_criterios_clinicos (sesion_id, categoria, valor)` con CHECK de categorías; decidir la unicidad según negocio: `UNIQUE (sesion_id, categoria, valor)` (múltiples valores por categoría) vs `UNIQUE (sesion_id, categoria)` (un valor por categoría). Más tabla `catalogo_opciones_conductuales` para el catálogo de #107. Alternativa: JSONB dentro de `sesiones` (mutuamente excluyente).

### 6.3 Frontend

- ✅ Las afirmaciones núcleo son correctas; ajustes de precisión ya aplicados (detalle = líneas **334-361**; selects VC = 5 opciones solo en Percepción).
- ⚠️ `risk-semaphore` es un semáforo **binario**, no reutilizable tal cual: se necesita un componente nuevo `vc-semaphore` de 5 estados.
- ⚠️ **Bug de datos**: `vcValue` (`expediente-clinico.component.ts:212-218`) mapea "Empeoramiento" y "Recaída" a `0` (mismo valor que "sin dato"); "Empeoramiento" debería quedar por debajo de "Sin cambios" (2). La demo React tiene el mismo defecto.
- ℹ️ El detalle Angular es un **subconjunto reducido** vs demo: omite `dxOp`, `trastorno`, `f1`, `f2`, `notes`, `situation`, `observationsNextSession`, `eff`, `cumplimiento`, `audioDuration` (todos campos existentes en `Session`). Conviene restaurarlos antes/además de añadir `significado`/`spr`.
- ℹ️ `environment.features.expedienteClinicoBackend = true` en dev y prod → el adapter localStorage es código muerto hoy; su `actualizarExpediente` es no-op y `agregarSesion` usa `unshift` (orden inconsistente con el backend).
- ℹ️ Accesibilidad: la lista de sesiones (`<div (click)>`) no tiene `role="button"`/`tabindex`/teclado; el badge de fase tampoco tiene affordance. El modal sí tiene `role="dialog" aria-modal cdkTrapFocus`.
- ℹ️ Estados de UI ausentes: `guardarSesion` no deshabilita botón ni muestra spinner; errores con `alert()`. Valores por defecto `newVc*` pre-sesgados a "Mejoría significativa".

### 6.4 Veredicto de la revisión

Los tres agentes concluyen que el informe es **sustancialmente correcto** y sus conclusiones estructurales (qué falta para cerrar #102–#108) son válidas. Las correcciones aplicadas son de **precisión** (atribución V7→V8, rangos de línea, matiz del semáforo binario, detalle VC por select) y de **alcance** (2 bugs de backend, bug de escala VC, detalle Angular reducido, flag de environment, accesibilidad). No hay ninguna afirmación **falsa** de fondo.

