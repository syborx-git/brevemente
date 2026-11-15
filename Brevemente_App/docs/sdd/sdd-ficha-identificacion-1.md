# SDD-FI-1: Software Design Document — Ficha de Identificación (alineación al PDF)

- **Módulos**: `expediente-clinico` (frontend Angular 18 standalone) · `expediente` (backend Spring Boot, hexagonal) · PostgreSQL/Flyway
- **Código SDD**: `SDD-FI-1`
- **Versión**: 1.0.0
- **Fecha**: 2026-11-02
- **Estado**: ✅ APROBADO (auditado por `jarvis-database`, `jarvis-backend` y `jarvis-frontend`)
- **Sucede a**: `SDD-HC-3` (implementado en `V22__historia_clinica_estructurada.sql`)
- **Fuente de verdad**: `C:\proyectos_Syborx\Brevemente_Demo\historia clínica.pdf` (láminas de la pestaña *Ficha de identificación*)
- **Alineación**: ADR-001 (Hexagonal/SDOP), ADR-002 (Dual Adapters), ADR-003 (Backend hexagonal y OpenAPI)

> **Regla de Oro**: integrar vía adaptador/puerto, reutilizando/adaptando lo existente. Este documento **no** escribe código fuente; es la especificación que consumirá `demo-gap-implementation`.

---

## 0. Propósito y alcance

Alinear la sub-pestaña **"Ficha de identificación"** (dentro de *Datos de Admisión e Historia Clínica*) con lo que pide la lámina correspondiente del PDF. Hoy la pestaña solo muestra 4 campos de identificación; el documento exige, además de esos, la **fecha de inicio**, la **fuente de referencia**, los **tratamientos previos psicoterapéuticos** y el **historial de consumo** (fármacos / psicofármacos / drogas).

### 0.1 Resultado esperado

La sub-pestaña tendrá **7 secciones**:

1. **Identificación del paciente** (Nombre, CURP, Fecha de nacimiento, Representante legal) — *ya renderizada*.
2. **Fecha de inicio**.
3. **Fuente de referencia**.
4. **Tratamientos Previos Psicoterapéuticos**.
5. **Fármacos**.
6. **Psicofármacos**.
7. **Drogas**.

### 0.2 Alcance (hallazgo clave de diagnóstico)

- **Brecha 100% FRONTEND**: el backend ya dispone de **todas** las columnas, tablas, DTOs y endpoints necesarios (heredados de `V7`/`V20`). **No** se requiere migración, entidad, servicio ni endpoint nuevos.
- Esta tarea **salda la deuda D-3 de SDD-HC-3**: en aquella implementación se ocultaron de *Historia clínica* los bloques *Fuente de Referencia*, *Tratamientos Previos* e historiales de consumo, con la nota "se reubicarán después". **Este documento define esa reubicación a *Ficha de identificación***, tal como indica el PDF.

---

## 1. Brecha documental (sustituye al gap-report)

Por decisión expresa del equipo no se genera `gap-report` separado: al no existir brechas de backend/BD/contrato/semilla, la brecha se documenta aquí como sección del propio SDD.

### 1.1 Estado actual vs documento

| # | Sección del documento | Estado en la UI actual | Tipo de brecha |
| :-- | :-- | :-- | :-- |
| 1 | Identificación (Nombre, CURP, Fecha nacimiento, Representante) | ✅ Renderizada | — |
| 2 | Fecha de inicio | ❌ No renderizada | FRONTEND-ONLY |
| 3 | Fuente de referencia (Iniciativa propia / Médico / Psiquiatra / Psicoterapeuta / Familiar / Amigo / Otro) | ❌ No renderizada | FRONTEND-ONLY |
| 4 | Tratamientos Previos Psicoterapéuticos (No/Sí → enfoque, duración, resultados) | ❌ No renderizada | FRONTEND-ONLY |
| 5 | Fármacos (No/Sí → especificar 1-3) | ❌ No renderizada | FRONTEND-ONLY |
| 6 | Psicofármacos (No/Sí → nombre y duración, 1-8) | ❌ No renderizada | FRONTEND-ONLY |
| 7 | Drogas (No/Sí → 1-4) | ❌ No renderizada | FRONTEND-ONLY |

### 1.2 Matriz de reutilización del backend existente

| Dato del documento | Backend existente | Endpoint |
| :-- | :-- | :-- |
| Fecha de inicio | `expedientes_clinicos.fecha_inicio` → campo API `startDate` | `GET /expedientes/paciente/{id}` (solo lectura; no editable) |
| Fuente de referencia | `fuente_referencia` (CHECK 7 valores) + `fuente_referencia_otro` (V20) | `PATCH /expedientes/paciente/{id}` |
| Tratamientos previos | Tabla `tratamientos_previos` (`enfoque`, `duracion`, `resultado` CHECK) | `GET` / `PUT /expedientes/paciente/{id}/tratamientos-previos` |
| Fármacos (1-3) | `historial_farmacos` JSONB `[]` (0-3 × `{nombre}`) | `PATCH /expedientes/paciente/{id}` |
| Psicofármacos (1-8) | `historial_psicofarmacos` JSONB `[]` (0-8 × `{nombre, duracion}`) | `PATCH /expedientes/paciente/{id}` |
| Drogas (1-4) | `historial_drogas` JSONB `[]` (0-4 × `{nombre}`) | `PATCH /expedientes/paciente/{id}` |

### 1.3 Frontend ya existente

| Recurso | Estado |
| :-- | :-- |
| Tipos `TratamientoPrevio`, `HistorialFarmaco`, `HistorialPsicofarmaco`, `HistorialDroga`, `FuenteReferencia` | Ya existen en `clinical.types.ts` |
| Campos `ClinicalRecord.startDate`, `fuenteReferencia`, `fuenteReferenciaOtro`, `historialFarmacos`, `historialPsicofarmacos`, `historialDrogas` | Ya existen en `ClinicalRecord` |
| Puerto `listarTratamientosPrevios` / `guardarTratamientosPrevios` | Conservados desde SDD-HC-3 (métodos en puerto + ambos adaptadores) |
| `actualizarExpediente` (para fecha, fuente e historiales) | Ya existe |

> **Conclusión de brecha**: no hay `MISSING/PARTIAL/INCORRECT/CONTRACT/DATA` en backend. Solo resta reconstruir la vista *Ficha de identificación* y reconectar el estado del componente.

---

## 2. Modelo de datos (sin cambios)

**No se crea migración.** Se reutilizan íntegramente:

- `expedientes_clinicos.fecha_inicio` (DATE), `fuente_referencia` (VARCHAR 30 + CHECK), `fuente_referencia_otro` (VARCHAR 100).
- `expedientes_clinicos.historial_farmacos` / `historial_psicofarmacos` / `historial_drogas` (JSONB `NOT NULL DEFAULT '[]'`).
- Tabla `tratamientos_previos` con `CHECK (resultado IN ('resuelto','mejorado','invariable','drop_out','otro'))`.

**Semántica del toggle No/Sí**: el PDF usa "No / Sí" como elección previa a detallar. En el modelo existente, ese estado **se deriva de la presencia de ítems**: lista vacía ⇒ "No"; lista con ítems ⇒ "Sí". No se añade columna de flag nueva (evita duplicar estado con `uso_farmacos`, que se conserva intacto para retrocompatibilidad).

**Nota `startDate` (solo lectura)**: `startDate` existe únicamente en `ExpedienteResponseDTO`; **no** está en `ExpedienteUpdateRequest` ni en `ExpedienteRestMapper.toParcial`, por lo que `PATCH` no puede modificarlo. En la vista se muestra como dato de apertura (consistente con D-5 de V20).

---

## 3. Frontend (Angular 18 standalone)

### 3.1 Tipos y puerto

- **Tipos**: sin cambios (todos ya existen, §1.3).
- **Puerto `expediente.repository.ts`**: sin cambios (métodos de tratamientos previos ya existen).
- **Adaptadores**: sin cambios (ya implementan `listarTratamientosPrevios`/`guardarTratamientosPrevios`).

### 3.2 Componente (`expediente-clinico`)

**Estado a restaurar/añadir:**
- `tratamientosPrevios: TratamientoPrevio[] = []` (se retiró en SDD-HC-3; se restaura).
- **Inicialización obligatoria** al cargar/entrar a edición: `record.fuenteReferencia ?? null`, `record.historialFarmacos ??= []`, `record.historialPsicofarmacos ??= []`, `record.historialDrogas ??= []` (los mocks de localStorage NO traen estos campos; sin inicializar, `ngModel` a `historialFarmacos[i].nombre` lanza `Cannot read properties of undefined`).
- **Edición explícita por bloque** (independiente de la longitud): `editandoFicha` (fecha + fuente), `editandoTratamientos`, `editandoFarmacos`, `editandoPsicofarmacos`, `editandoDrogas`. Además, cada bloque con toggle No/Sí lleva un **booleano de borrador propio** para esa elección (`tratamientosSi`, `farmacosSi`, `psicofarmacosSi`, `drogasSi`), **inicializado al entrar a edición con el `tiene*()` correspondiente** y nunca derivado de la longitud: un radio No/Sí enlazado a `tieneFarmacos()` no puede sostener "Sí" con lista vacía (al pulsar "Sí" el radio volvería a "No").
- Toggles de **lectura**: `tieneTratamientos()`, `tieneFarmacos()`, `tienePsicofarmacos()`, `tieneDrogas()` (booleanos según longitud de la lista).

**Métodos:**
- `cargarFicha()` → `listarTratamientosPrevios(pacienteId)` (se llama en `cargarDatos()`).
- `guardarFichaIdentificacion()` → en un único botón "Guardar Ficha":
  1. `actualizarExpediente(pacienteId, { fuenteReferencia, fuenteReferenciaOtro })` (fecha de inicio `startDate` no es editable en esta vista: es dato de apertura del expediente; para hacerla editable sería necesario añadir `startDate` al `ExpedienteUpdateRequest`, al `ExpedienteRestMapper.toParcial` y a `ExpedienteApplicationService.aplicar`).
  2. `guardarTratamientosPrevios(pacienteId, tratamientosPrevios)`.
  3. `actualizarExpediente(pacienteId, { historialFarmacos, historialPsicofarmacos, historialDrogas })`.
  4. **Regla de borrado "No"**: cada bloque con toggle envía su lista solo si su booleano de borrador es `true`; si es `false`, envía `[]` (`tratamientosSi === false` → `guardarTratamientosPrevios(pacienteId, [])`; `farmacosSi === false` → `historialFarmacos: []`; ídem psicofármacos y drogas). Así se preserva la invariante "lista vacía ⇒ No" de §2.
- Helpers CRUD de listas: `agregarTratamiento()`, `eliminarTratamiento(i)`, `agregarFarmacoHistorial()`, `agregarPsicofarmacoHistorial()`, `agregarDrogaHistorial()` y sus eliminaciones. Los `agregar*` respetan los máximos del documento PDF (validación frontend): **Fármacos ≤ 3, Psicofármacos ≤ 8, Drogas ≤ 4**. Al guardar, `fuenteReferenciaOtro` se envía solo cuando `fuenteReferencia === 'otro'`; en cualquier otro caso se envía `null`.

### 3.3 UX de las 7 secciones

| Sección | Modo lectura | Modo edición |
| :-- | :-- | :-- |
| 1. Identificación | Nombre, CURP, fecha nacimiento, representante (solo lectura, ya está) | — (no editable aquí) |
| 2. Fecha de inicio | `{{ record.startDate }}` | Solo lectura (dato de apertura) |
| 3. Fuente de referencia | Valor legible (p. ej. "Psicoterapeuta") + "Otro: …" si aplica | `select` (7 opciones) + input "Otro" visible cuando `fuenteReferencia === 'otro'` |
| 4. Tratamientos previos | "No" si lista vacía; "Sí" + lista `enfoque / duración / resultado` | Radio No/Sí + filas editables (enfoque, duración, select de resultado) + Agregar/Eliminar |
| 5. Fármacos | "No" o lista de 1-3 nombres | Radio No/Sí + 1-3 inputs "Especificar" |
| 6. Psicofármacos | "No" o lista de 1-8 `nombre (duración)` | Radio No/Sí + 1-8 filas nombre + duración |
| 7. Drogas | "No" o lista de 1-4 nombres | Radio No/Sí + 1-4 inputs |

**Accesibilidad y consistencia:**
- La guarda del bloque debe ser `datosSubTab === 'ficha' && record` (hoy es `&& patient`); `record` es `null` hasta que responde `obtenerExpediente`, y toda referencia a `record.*` debe ser safe (`record?.` o la guarda `&& record`).
- La sección 1 (Identificación) lee `patient.*`; sus campos deben usar safe navigation (`patient?.name`, `patient?.curp`, `patient?.fechaNacimiento`, `patient?.representante?.nombreCompleto`) o mantener un `*ngIf` propio con `&& patient`, porque con la guarda única `&& record` un `patient` `null` lanzaría `Cannot read properties of null`.
- Toggles No/Sí con `role="radiogroup"` + radios etiquetados (mismo patrón del semáforo VC y de Historia clínica). **Cada grupo No/Sí lleva `name` único** (`ficha-tratamientos`, `ficha-farmacos`, `ficha-psicofarmacos`, `ficha-drogas`) para que los radios no interfieran entre secciones.
- Un único botón **"Guardar Ficha"** al pie; el formulario no anida `<form>`.
- El `select` de **resultado** (tratamientos previos) usa las 5 opciones del CHECK: `resuelto`, `mejorado`, `invariable`, `drop_out`, `otro`. El `select` de **fuente de referencia** enlaza directamente a `record.fuenteReferencia` (los radios No/Sí solo aplican a los 4 bloques de tratamientos/historiales).
- Claves y etiquetas en español con acentos; el parser de Angular no admite acentos en identificadores de expresiones → usar accesores/métodos ASCII del componente con clave string (lección documentada de SDD-HC-3).

---

## 4. Verificación

- **Backend**: sin cambios → smoke test opcional del `GET /expedientes/paciente/{id}` y `GET .../tratamientos-previos` para confirmar el contrato actual.
- **Frontend**: `ng build --configuration development` limpio.
- **E2E**: actualizar `TC-EXP-18` (Ficha de identificación) para validar:
  - Identificación (ya cubierta).
  - Fecha de inicio, fuente de referencia (seed `psicoterapeuta`), y bloques Fármacos/Psicofármacos/Drogas en estado "No" (seed `[]`).
  - Opcionalmente, flujo "Sí" → agregar ítem → "Guardar Ficha" → persistencia.

---

## 5. Riesgos y observaciones

1. **Seed vacío de historiales**: `historial_*` están en `[]` para `exp-001`; la UI debe tolerar arrays vacíos y renderizar "No" sin romper.
2. **Fecha de inicio**: es `fecha_inicio` (inicio de tratamiento), concepto distinto de `fecha_apertura` (D-5 de V20). En esta vista se muestra `startDate` como "Fecha de inicio" y no se edita.
3. **`guardarTratamientosPrevios` es reemplazo total**: el `PUT` borra y reinserta (patrón del backend). El frontend debe enviar la lista completa, no diffs.
4. **Orden determinista**: `listarTratamientosPrevios` devuelve por `created_at ASC`; las filas nuevas se agregan al final.
5. **Regresión E2E**: solo se toca `TC-EXP-18`; `TC-EXP-16` (Datos Generales) y `TC-EXP-17*` (Historia clínica) no se ven afectados. El D-3 de SDD-HC-3 queda saldado sin romper la suite.
6. **Persistencia simulada en modo localStorage**: `expediente-localstorage.adapter.ts` devuelve el registro sin aplicar `datos` en `actualizarExpediente`; `listarTratamientosPrevios` devuelve `[]` y `guardarTratamientosPrevios` no guarda. Con `environment.features.expedienteClinicoBackend === false`, el botón "Guardar Ficha" es un no-op y los datos no sobreviven a recargas. La validación E2E de persistencia exige el adaptador HTTP.
7. **Binding con `ngModel`**: usar `[ngModel]` + `(ngModelChange)` con accesores ASCII del componente (no `record.historialFarmacos[i].nombre` directo) para arrays que pueden ser `undefined` y para claves con acentos.

---

## 6. Estado documental

- [x] Brecha documental (sección 1)
- [x] Especificación frontend (sección 3)
- [x] Auditoría por `jarvis-database`, `jarvis-backend` y `jarvis-frontend`
- [ ] Implementación (`demo-gap-implementation`)
- [ ] E2E y reporte
