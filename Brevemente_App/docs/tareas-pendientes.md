# 📋 Tareas Pendientes

> Registro de tareas del tablero Kanban pendientes de resolver.
> Se recopilan primero y se atacan después. Cada entrada incluye evidencia y qué falta para completarla.

**Última actualización:** 2026-10-26

> **Gap analysis asociado:** `Brevemente_App/docs/gap-analysis/gap-report-kanban-102-108-sesion-criterios-clinicos.md`

---

## Estado general

| # | Tarea | Origen | Estado | Evidencia |
|---|-------|--------|--------|-----------|
| 1 | #102 — Badge de fase, editable | Detalle de Sesión 3, anotación "Editable" | ❌ Pendiente | Badge de fase es solo lectura (ver detalle) |
| 2 | #103 — Campo "Miedo al conflicto" editable | Detalle de Sesión 3, anotación "Editable" (izquierda) | ❌ Pendiente | Campo no existe + DX operativo no editable (ver detalle) |
| 3 | #104 — Campo "SPR obsesivo-paranoico" editable | Detalle de Sesión 3, anotación "Editable" (derecha) | ❌ Pendiente | SPR no se muestra ni se edita en el detalle de sesión (ver detalle) |
| 4 | #105 — Semáforo de Valoración del Cambio | Leyenda emergente sobre el Historial Clínico de VC | ❌ Pendiente | El historial de VC es texto plano, sin selector visual (ver detalle) |
| 5 | #106 — Menús desplegables para criterios clínicos | Registro de Criterios Clínicos, anotación "Tal vez poner Menús Desplegables" | ❌ Pendiente | El bloque de texto libre no existe como menús desplegables (ver detalle) |
| 6 | #107 — Catálogo de opciones conductuales | Registro de Criterios Clínicos, sección "Conductual" | ❌ Pendiente | El listado seleccionable no existe (ver detalle) |
| 7 | #108 — Sección "Conductual" como bloque propio | Registro de Criterios Clínicos, encabezado "Conductual" | ❌ Pendiente | No existe la sección colapsable "Conductual" (ver detalle) |

---

## Detalle de tareas

### 1. GitHub issue #102 — "Badge de fase, editable"

- **Origen:** Detalle de Sesión 3, anotación "Editable".
- **Requisito:** El indicador "FASE: INTERVENCIÓN" en el detalle de sesión debe ser **manualmente editable**, no solo mostrado como estado calculado.
- **Estado:** ❌ **No implementado**
- **Evidencia:**
  - `frontend/src/app/modules/expediente-clinico/expediente-clinico.component.html:328`:
    ```html
    <span class="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200">
      {{ s.phase }}
    </span>
    ```
    Es un `<span>` estático (solo lectura): sin input, sin botón de edición, sin clic-para-editar.
  - La fase solo se asigna en el método de guardado (`expediente-clinico.component.ts:376`):
    ```ts
    phase: 'Intervención Estratégica',
    ```
    (valor hardcodeado, no editable por el usuario).
- **Qué falta:**
  1. **Frontend:** convertir el badge en editable (clic → input/select con las fases y persistir el cambio).
  2. **Backend:** no existe endpoint de actualización de fase de sesión:
     - `ExpedienteRestController` solo expone `GET/POST` de sesiones.
     - `SesionApplicationService` no tiene método de actualización.
     - La columna `sesiones.fase` existe (V7) pero no hay flujo de escritura.

---

### 2. GitHub issue #103 — "Campo 'Miedo al conflicto' editable"

- **Origen:** Detalle de Sesión 3, anotación "Editable" (izquierda).
- **Requisito:** La etiqueta de significado asociada a la sesión ("Miedo al conflicto"), junto al DX operativo, debe quedar **editable por el terapeuta**.
- **Estado:** ❌ **No implementado**
- **Evidencia:**
  - El campo "significado" ("Miedo al conflicto") **no existe** en el modelo. En `clinical.types.ts:196` la interfaz `Session` tiene `dxOp` pero no tiene ningún campo de significado:
    ```ts
    export interface Session {
      id: string;
      patientId: string;
      number: number;
      date: string;
      phase: string;
      protocol: string;
      dxOp: string;   // ← DX operativo existe, pero NO se muestra ni se edita
      ...
    }
    ```
    No aparece la cadena "Miedo al conflicto" en ningún archivo del código fuente.
  - El **detalle de sesión** (`expediente-clinico.component.html:330-360`) solo muestra: número, fecha, protocolo, estado, Prescripciones Estratégicas (px), Observaciones (oss), RSS y Adherencia (add). Todo en etiquetas `<p>` de solo lectura. **No muestra ni el DX operativo ni ningún campo de significado.**
  - Lo único editable en el área de sesiones es el modal **"Nueva Sesión"** (protocolo, prescripción y notas), no el detalle.
- **Qué falta:**
  1. **Modelo:** añadir campo `significado` (etiqueta de significado) a `Session` (y su equivalente backend si aplica).
  2. **Frontend:** en el detalle de sesión, mostrar y hacer editables tanto el `significado` como el `dxOp`.
  3. **Backend:** endpoint para persistir la actualización de `significado` y `dxOp` de una sesión (hoy solo existe `GET/POST` de sesiones en `ExpedienteRestController`).

---

### 3. GitHub issue #104 — "Campo 'SPR obsesivo-paranoico' editable"

- **Origen:** Detalle de Sesión 3, anotación "Editable" (derecha).
- **Requisito:** El sistema perceptivo-reactivo (SPR) mostrado en el detalle de sesión debe quedar **editable**, sin reabrir el DX estratégico completo.
- **Estado:** ❌ **No implementado**
- **Evidencia:**
  - La interfaz `Session` (`clinical.types.ts:196`) **no tiene campo `spr`**. El SPR no se persiste a nivel de sesión.
  - El detalle de sesión (`expediente-clinico.component.html:330-360`) **no muestra ni edita el SPR**.
  - El SPR solo aparece en dos lugares no relacionados con el detalle de sesión:
    - Tarjeta "Objetivos y SPR" del DX (línea 224): `record?.sprInicial` en `<p>` de solo lectura.
    - Modal de bitácora de supervisión (líneas 1672-1680): select de `newBitacora.spr` con opciones `SPR Fóbico`, `SPR Obsesivo-Compulsivo`, `SPR Paranoide`, `SPR Depresivo`, `SPR Dismórfico`, `SPR Hipocondríaco`.
  - No existe la cadena "obsesivo-paranoico" en el código fuente.
- **Qué falta:**
  1. **Modelo:** añadir campo `spr` a `Session` (frontend + backend si aplica).
  2. **Frontend:** mostrar y hacer editable el SPR en el detalle de sesión (sin abrir el DX completo).
  3. **Backend:** endpoint para persistir el SPR de la sesión.

---

### 4. GitHub issue #105 — "Semáforo de Valoración del Cambio"

- **Origen:** Leyenda emergente sobre el Historial Clínico de Valoración del Cambio.
- **Requisito:** Selector visual de 5 estados con color y etiqueta: `marcador inicial / sin mejoría`, `mejoría leve`, `mejoría significativa`, `recaída`, `nuevo patrón`. Reemplaza el texto libre del historial por sesión.
- **Estado:** ❌ **No implementado**
- **Evidencia:**
  - El historial de VC (`expediente-clinico.component.html:426-434`) es **texto plano** por celda, sin color ni semáforo:
    ```html
    <td class="p-3">{{ s.valoracionCambio?.percepcion || '—' }}</td>
    ...
    <td class="p-3">{{ s.valoracionCambio?.crisis || '—' }}</td>
    ```
  - La captura de VC usa `<select>` de texto (`expediente-clinico.component.html:1008-1058`) con opciones distintas a las requeridas: `Sin cambios`, `Mejoría leve`, `Mejoría significativa`, `Nuevo patrón`, `Empeoramiento`. **No incluye** `marcador inicial` ni `recaída`.
  - Los componentes `semaforo` existentes (`risk-semaphore.component.ts`, variante `semaforo` de `kpi-card.component.ts`) son para **alertas de riesgo del dashboard**, no para la Valoración del Cambio por sesión.
- **Qué falta:**
  1. Definir el modelo de 5 estados con color + etiqueta (marcador inicial / sin mejoría, mejoría leve, mejoría significativa, recaída, nuevo patrón).
  2. **Frontend:** sustituir el texto libre del historial por sesión por el selector visual (semáforo) de 5 estados.
  3. **Frontend:** actualizar la captura de VC para usar el mismo semáforo (reemplazar los `<select>` actuales).

---

### 5. GitHub issue #106 — "Menús desplegables para criterios clínicos"

- **Origen:** Registro de Criterios Clínicos, anotación "Tal vez poner Menús Desplegables".
- **Requisito:** Convertir el bloque de texto libre (racionalizaciones-intelectualizaciones, comparaciones, imágenes intrusivas + "otro") en menús desplegables.
- **Estado:** ❌ **No implementado**
- **Evidencia:**
  - Las cadenas `racionalizaciones`, `intelectualizaciones`, `comparaciones`, `imágenes intrusivas` **no aparecen en ningún archivo** del código fuente (ni Angular ni demo).
  - En el expediente Angular (`expediente-clinico.component.html`) **no existe** una sección "Registro de Criterios Clínicos" con esas categorías.
  - En la demo (`brevemente_demo/src/pages/ClinicalRecord.tsx:1959`) existe el encabezado "Registro de Criterios Clínicos por Sesión", pero es la tabla de Valoración del Cambio (Percepción, Pensamientos, Sensaciones, Reacciones, Síntomas, Crisis) en celdas `<td>` de texto plano, **sin menús desplegables** y sin las categorías citadas.
- **Qué falta:**
  1. Localizar/definir el bloque "Registro de Criterios Clínicos" con las categorías citadas (racionalizaciones-intelectualizaciones, comparaciones, imágenes intrusivas + "otro").
  2. **Frontend:** sustituir el texto libre por menús desplegables (selects) para cada categoría.
  3. Definir las opciones de cada menú y su persistencia (modelo/backend si aplica).

---

### 6. GitHub issue #107 — "Catálogo de opciones conductuales"

- **Origen:** Registro de Criterios Clínicos, sección "Conductual".
- **Requisito:** Definir y cargar el listado seleccionable del criterio conductual: `pedir las cosas suavemente` / `insinuar en lugar de pedir directamente` / `delegar` / `todas las anteriores` / `otro`.
- **Estado:** ❌ **No implementado**
- **Evidencia:**
  - Las opciones citadas (`pedir las cosas suavemente`, `insinuar`, `delegar`) **no aparecen en ningún archivo** del código fuente (ni Angular ni demo).
  - No existe la sección "Registro de Criterios Clínicos → Conductual" con un listado seleccionable.
  - Solo aparece la palabra genérica "conductual" en textos de la biblioteca clínica (`mockData.ts`), sin relación con el catálogo pedido.
- **Qué falta:**
  1. Definir el catálogo de opciones conductuales (las 5 opciones + modelo de datos).
  2. **Frontend:** cargar y mostrar el listado seleccionable en la sección "Conductual" del Registro de Criterios Clínicos.
  3. Persistencia de la selección (modelo/backend si aplica).

---

### 7. GitHub issue #108 — "Sección 'Conductual' como bloque propio"

- **Origen:** Registro de Criterios Clínicos, encabezado "Conductual".
- **Requisito:** Confirmar que el criterio conductual se muestra como su propia sección **colapsable**, en paridad con los demás criterios (percepción, pensamientos, sensaciones...).
- **Estado:** ❌ **No implementado**
- **Evidencia:**
  - En el expediente Angular **no existe** la sección "Registro de Criterios Clínicos" con criterios colapsables por categoría.
  - En la demo (`brevemente_demo/src/pages/ClinicalRecord.tsx:1959`) "Registro de Criterios Clínicos por Sesión" es una tabla plana de VC (Percepción, Pensamientos, Sensaciones, Reacciones, Síntomas, Crisis), **sin bloques colapsables** y sin encabezado "Conductual".
- **Qué falta:**
  1. Crear la sección "Conductual" como bloque propio y colapsable.
  2. Garantizar paridad visual con los demás criterios (percepción, pensamientos, sensaciones...).
  3. Integrar con el catálogo de opciones (#107).

---

## Tareas por agregar

> Pegar aquí las siguientes tareas del Kanban para ir registrándolas.
> (Queda pendiente de completar conforme se vayan recibiendo.)
