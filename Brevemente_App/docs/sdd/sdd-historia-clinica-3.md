# SDD-HC-3: Software Design Document — Historia Clínica (Antecedentes estructurados, Examen Mental y Evaluación de Riesgo)

- **Módulos**: `expediente-clinico` (frontend Angular 18 standalone) · `expediente` (backend Spring Boot, hexagonal) · PostgreSQL/Flyway
- **Código SDD**: `SDD-HC-3`
- **Versión**: 1.0.0
- **Fecha**: 2026-10-29
- **Estado**: ✅ APROBADO (auditado y aprobado por `jarvis-database`, `jarvis-backend` y `jarvis-frontend`)
- **Sucede a**: `SDD-HC-2` (implementado en `V20__historia_clinica.sql`)
- **Fuente de verdad**: `C:\proyectos_Syborx\Brevemente_Demo\historia clínica.pdf` (página "Historia clínica") y `C:\proyectos_Syborx\Brevemente_Demo\Formato_Examen_Mental.docx`
- **Alineación**: ADR-001 (Hexagonal/SDOP), ADR-002 (Dual Adapters), ADR-003 (Backend hexagonal y OpenAPI)

> **Regla de Oro**: integrar vía adaptador/puerto, reutilizando/adaptando lo existente. Este documento **no** escribe código fuente; es la especificación que consumirá `demo-gap-implementation`.

---

## 0. Propósito y alcance

Corregir la sub-pestaña **"Historia clínica"** (dentro de *Datos de Admisión e Historia Clínica*) para que refleje **exactamente** la página "Historia clínica" del PDF de los doctores, reemplazando el modelo genérico actual (`antecedentes_expediente` + lista dinámica) por una estructura fija.

### 0.1 Resultado esperado

La sub-pestaña tendrá **5 cards latentes** (siempre visibles, aunque no tengan datos):

1. **Antecedentes Personales Patológicos**
2. **Antecedentes Personales No Patológicos**
3. **Antecedentes Heredo Familiares**
4. **Evaluación del Estado Mental (Examen Mental)** — card especial
5. **Evaluación de Riesgo**

### 0.2 Decisiones del usuario (no negociables)

| # | Decisión |
| :--- | :--- |
| D-1 | Cards **latentes**: visibles sin datos, con botón **"Editar"** para cambiar los datos. |
| D-2 | La card del **Examen Mental** es latente pero muestra **datos resumen** (no el examen completo), con botones **"Realizar examen"** (abre el formulario completo) y **"Ver resultados"** (abre un modal con las respuestas previas). Si no hay examen → texto "Sin datos — Realice el examen…". |
| D-3 | **Eliminar** de esta sub-pestaña todo lo que **no** pertenece a la página "Historia clínica" del PDF: `Fuente de Referencia`, `Tratamientos Previos`, `historialFarmacos`, `historialPsicofarmacos` e `historialDrogas` (se reubicarán después; **no** se borra el dato de la BD). |
| D-4 | **Reemplazar** el modelo genérico de antecedentes por la estructura fija del PDF, con **nueva migración `V22`**. |
| D-5 | Datos Generales queda **igual** (ya validado). |

---

## 1. Modelo de datos — Migración Flyway `V22__historia_clinica_estructurada.sql`

- **Consecutivo**: `V22` (última aplicada = 21).
- **Ubicación**: `backend/src/main/resources/db/migration/V22__historia_clinica_estructurada.sql`.
- **Propiedades**: idempotente, **inmutable** respecto a `V20`/`V21`. Migra los datos semilla del modelo genérico y luego lo retira.

```sql
-- =============================================================================
-- Migración V22: Historia Clínica estructurada
-- Antecedentes fijos + especificaciones de riesgo + examen mental con fecha.
-- Reemplaza el modelo genérico `antecedentes_expediente` (V20).
-- =============================================================================

-- 1. Antecedentes estructurados (reemplaza la tabla genérica) ------------------
ALTER TABLE expedientes_clinicos
    ADD COLUMN IF NOT EXISTS antecedentes JSONB NOT NULL DEFAULT '{}';

-- 2. Especificación de riesgo --------------------------------------------------
ALTER TABLE expedientes_clinicos
    ADD COLUMN IF NOT EXISTS riesgo_suicida_especificar TEXT,
    ADD COLUMN IF NOT EXISTS riesgo_heteroagresivo_especificar TEXT;

-- 3. Fecha del examen mental (para la card latente) ----------------------------
ALTER TABLE expedientes_clinicos
    ADD COLUMN IF NOT EXISTS fecha_examen_mental DATE;

-- 4. Migrar el seed genérico → JSONB estructurado (exp-001) --------------------
UPDATE expedientes_clinicos
SET antecedentes = jsonb_build_object(
    'personalesPatológicos', jsonb_build_object(
        'alérgicos', 'Alergia a la penicilina'
    ),
    'personalesNoPatológicos', jsonb_build_object(
        'tabaquismo', jsonb_build_object('presente', false, 'cantidad', '', 'tiempo', '')
    ),
    'heredoFamiliares', jsonb_build_object(
        'enfermedadesMentales', 'Madre con trastorno de ansiedad'
    )
)
WHERE id = 'exp-001'
  AND (antecedentes IS NULL OR antecedentes = '{}'::jsonb);
-- Verificado en la BD demo: solo exp-001 tiene filas en antecedentes_expediente (3 filas).
-- Si otro entorno tuviera datos de runtime en exp-002/003/004, migrarlos genéricamente ANTES del DROP.

-- 5. Retirar la tabla genérica -------------------------------------------------
DROP TABLE IF EXISTS antecedentes_expediente;
```

> **Nota de datos**: `tratamientos_previos` y `expedientes_clinicos.fuente_referencia` se **conservan** (D-3) para reubicarlos en una fase posterior. Solo se retira la tabla genérica de antecedentes.

### 1.1 Esquema JSONB `antecedentes`

```json
{
  "personalesPatológicos": {
    "médicos": "", "quirúrgicos": "", "traumáticos": "",
    "alérgicos": "", "transfusionales": "", "hospitalizaciones": ""
  },
  "personalesNoPatológicos": {
    "tabaquismo":  { "presente": false, "cantidad": "", "tiempo": "" },
    "alcoholismo":  { "presente": false, "cantidad": "", "frecuencia": "" },
    "toxicomanías": { "presente": false, "tipo": "", "tiempo": "" },
    "actividadFísica": "",
    "alimentación": ""
  },
  "heredoFamiliares": {
    "enfermedadesMentales": "", "enfermedadesCrónicas": "",
    "suicidiosIntentos": "", "adicciones": ""
  }
}
```

> **Convención de nomenclatura**: todas las claves JSONB usan **español correcto con acentos** (`sueño`, `cálculo`, `síntesis`, `orientación`, …). Se prohíben claves sin tilde/acento que luzcan como faltas de ortografía.

### 1.2 Esquema JSONB `examen_mental`

Estructura fija derivada de `Formato_Examen_Mental.docx`. Cada clave es texto libre ("Hallazgo"); las de `evaluacionRiesgo` llevan `{ nivel, hallazgo }`.

| Sección | Clave JSONB | Parámetros (claves) |
| :--- | :--- | :--- |
| APARIENCIA Y CONDUCTA | `aparienciaConducta` | `aspectoGeneral`, `actitudEntrevista`, `contactoVisual`, `actividadPsicomotora`, `movimientosAnormales`, `posturaMarcha` |
| CONCIENCIA Y SENSORIO | `concienciaSensorio` | `nivelConciencia`, `orientación`, `atenciónConcentración` |
| LENGUAJE Y HABLA | `lenguajeHabla` | `cantidad`, `velocidadRitmo`, `volumenProsodia`, `articulaciónFluidez`, `comprensiónDenominaciónRepetición`, `alteracionesParticulares` |
| AFECTIVIDAD | `afectividad` | `estadoÁnimo`, `afecto`, `rangoIntensidad`, `estabilidad`, `congruenciaAdecuación`, `reactividad` |
| PENSAMIENTO | `pensamiento` | `curso`, `forma`, `ideasDelirantes`, `fenómenosPasividad`, `ideasSobrevaloradas`, `obsesionesCompulsiones`, `fobiasPreocupacionesRumiaciones`, `ideaciónSuicidaAutolesivaHomicida` |
| SENSOPERCEPCIÓN | `sensopercepción` | `alucinaciones`, `pseudoalucinacionesAlucinosis`, `ilusiones`, `despersonalizaciónDesrealización`, `conductaAlucinatoria`, `otrasDistorsiones` |
| FUNCIONES COGNOSCITIVAS | `funcionesCognoscitivas` | `memoriaInmediata`, `memoriaReciente`, `memoriaRemota`, `cálculo`, `abstracción`, `visoespacialPraxiasGnosias`, `funcionesEjecutivas`, `inteligenciaCaudal` |
| JUICIO E INTROSPECCIÓN | `juicioIntrospección` | `juicioRealidad`, `juicioCríticoSocial`, `introspección`, `controlImpulsos`, `confiabilidad` |
| FUNCIONES FISIOLÓGICAS | `funcionesFisiológicas` | `sueño`, `apetitoPeso`, `libido` |
| EVALUACIÓN DE RIESGO (del examen) | `evaluaciónRiesgo` | `suicida`, `autolesión`, `heteroagresivo`, `abandonoAutocuidado`, `vulnerabilidad`, `fugaAbandono` → cada uno `{ nivel, hallazgo }` |
| SÍNTESIS | `síntesis` | `resumenHallazgos`, `integraciónSindromática`, `impresiónDiagnóstica`, `conductaASeguir`, `nombreFirmaEvaluador` |

---

## 2. Backend (hexagonal)

### 2.1 Dominio

| Clase | Estrategia |
| :--- | :--- |
| `expediente/domain/model/Expediente` | **EXTENDER** con `Map<String,Object> antecedentes`, `String riesgoSuicidaEspecificar`, `String riesgoHeteroagresivoEspecificar`, `LocalDate fechaExamenMental`. `examenMental` ya existe (ahora con estructura definida en §1.2). |
| `expediente/domain/model/Antecedente` (record) | **ELIMINAR** (modelo genérico reemplazado). |

### 2.2 Persistencia

| Clase | Estrategia |
| :--- | :--- |
| `ExpedienteJpaEntity` | **EXTENDER** con `@JdbcTypeCode(SqlTypes.JSON) @Column(name="antecedentes", columnDefinition="jsonb", nullable=false) Map<String,Object> antecedentes` (mismo patrón que `examen_mental`/`historial_*`), `riesgo_suicida_especificar` (TEXT), `riesgo_heteroagresivo_especificar` (TEXT), `fecha_examen_mental` (DATE). |
| `ExpedientePersistenceMapper` | **EXTENDER** mapeo bidireccional de los 4 campos nuevos. En `toJpaEntity` garantizar `antecedentes != null ? antecedentes : Map.of()` (la columna es NOT NULL). |
| `AntecedenteExpedienteJpaEntity` + repositorio | **ELIMINAR** (tabla dropeada en V22). |

### 2.3 Casos de uso / servicios

| Clase | Estrategia |
| :--- | :--- |
| `ExpedienteApplicationService.aplicar(...)` | **EXTENDER**: copia no-nula de `riesgoSuicidaEspecificar`, `riesgoHeteroagresivoEspecificar`, `fechaExamenMental`; para `antecedentes`/`examenMental` usar guard `!= null && !isEmpty()` (un `{}` vacío NO debe pisar datos previos). |
| `AntecedenteApplicationService` + puertos in/out | **ELIMINAR** (modelo genérico). |

> **Auditoría**: al eliminar `AntecedenteApplicationService` se pierde la traza específica "Actualización de antecedentes". `ExpedienteApplicationService.actualizar` debe emitir una traza específica ("Actualización de antecedentes/examen mental") cuando el PATCH traiga `antecedentes`, `examenMental` o `riesgo*Especificar` no nulos.

### 2.4 REST

| Componente | Estrategia |
| :--- | :--- |
| `ExpedienteResponseDTO` / `ExpedienteUpdateRequest` | **EXTENDER** con `Map<String,Object> antecedentes` (tipado `Map`, no `Object`), `riesgoSuicidaEspecificar`, `riesgoHeteroagresivoEspecificar`, `fechaExamenMental` (**String** ISO en DTO; `LocalDate` en dominio/entidad vía `parseDate`/`toString`). |
| `ExpedienteRestMapper` | **EXTENDER** mapeo de los 4 campos nuevos. |
| `GET/PUT /expedientes/paciente/{id}/antecedentes` | **ELIMINAR** (reemplazado por `PATCH /expedientes/paciente/{id}`). |
| `GET/PUT .../tratamientos-previos` | **CONSERVAR** (D-3: se reubicará después). |

> El alta/lectura/escritura de antecedentes, riesgo y examen mental se realiza a través del **mismo** `PATCH /expedientes/paciente/{pacienteId}` existente.

---

## 3. Frontend (Angular 18 standalone)

### 3.1 Tipos (`clinical.types.ts`)

| Tipo | Estrategia |
| :--- | :--- |
| `Antecedente` (genérico `{grupo,categoria,descripcion}`) | **ELIMINAR** |
| `Antecedentes` (nuevo) | **CREAR**: `{ personalesPatológicos: {...6}, personalesNoPatológicos: {...}, heredoFamiliares: {...4} }` con sub-tipos `HábitoPresente = { presente: boolean; cantidad?: string; tiempo?: string; frecuencia?: string; tipo?: string }`. |
| `ExamenMental` (genérico `{[seccion:string]: …}`) | **REEMPLAZAR** por tipo estructurado `ExamenMental` con las secciones de §1.2 y `ExamenRiesgoItem = { nivel: string; hallazgo: string }`. |
| `ClinicalRecord` | **EXTENDER**: `antecedentes?: Antecedentes`, `riesgoSuicidaEspecificar?`, `riesgoHeteroagresivoEspecificar?`, `fechaExamenMental?`. |

### 3.2 Puerto / adaptadores

| Componente | Estrategia |
| :--- | :--- |
| `expediente.repository.ts` (puerto) | **QUITAR** `listarAntecedentes`/`guardarAntecedentes` (ya no se usan). **CONSERVAR** `listarTratamientosPrevios`/`guardarTratamientosPrevios` (aunque la card se oculta). El guardado de antecedentes/riesgo/examen va por `actualizarExpediente` (ya existe). |
| `expediente-http.adapter.ts` / `expediente-localstorage.adapter.ts` | Ajustar para reflejar el puerto (quitar métodos de antecedentes). |

### 3.3 Componente (`expediente-clinico`)

**Estado nuevo:**
- `antecedentes: Antecedentes | null` (estructurado) — cargado de `record.antecedentes`, tolerando `undefined` con `?? ANTECEDENTES_VACIO`.
- **Drafts por card** (para que "Cancelar" no pierda ediciones): `antecedentesDraft`, `riesgoDraft` — se clonan al pulsar "Editar" y se descartan en "Cancelar"; `record` no se muta hasta persistir.
- Flags de edición por card: `editandoPatologicos`, `editandoNoPatologicos`, `editandoHeredoFamiliares`, `editandoRiesgo`.
- Examen: `showExamenModal` (formulario), `showResultadosModal` (lectura); ambos registrados en `onEscape()`.

**Métodos:**
- `guardarAntecedentes()`, `guardarRiesgo()` → `actualizarExpediente(pacienteId, {...})`.
- `guardarExamenMental(examen)` → `actualizarExpediente(pacienteId, { examenMental, fechaExamenMental })`.

### 3.4 UX de las 5 cards

| Card | Modo latente (lectura) | Acciones |
| :--- | :--- | :--- |
| Antecedentes Patológicos | Lista "etiqueta: valor" (o "Sin datos") | **Editar** → inputs inline + **Guardar** / **Cancelar** |
| Antecedentes No Patológicos | Resumen de hábitos (No/Sí + detalle) y actividad/alimentación | **Editar** → toggles No/Sí + inputs + **Guardar** / **Cancelar** |
| Antecedentes Heredo Familiares | Lista "etiqueta: valor" | **Editar** → inputs inline + **Guardar** / **Cancelar** |
| Examen Mental | Si hay examen: fecha + resumen (p. ej. "Impresión diagnóstica: …"); si no: "Sin datos — Realice el examen para registrar la evaluación del estado mental." | **Realizar examen** (abre formulario completo) · **Ver resultados** (modal con tabla) |
| Evaluación de Riesgo | Riesgo suicida + especificar · riesgo heteroagresivo + especificar · otros riesgos | **Editar** → selects + textareas + **Guardar** / **Cancelar** |

**Examen Mental — formulario completo (`Realizar examen`):**
- Modal a pantalla amplia (`max-w-4xl`, scroll interno), organizado por las 11 secciones de §1.2.
- Por cada parámetro: fila con `Parámetro` + `Qué evaluar` + `Descriptores` (solo lectura) + `Hallazgo` (textarea libre).
- Sección "Evaluación de riesgo": por cada ítem, select de `Nivel` (bajo/moderado/alto) + `Hallazgo` (textarea).
- Sección "Síntesis": 5 textareas + nombre del evaluador.
- Botones: **Guardar examen** (persiste `examenMental` + `fechaExamenMental` = hoy) y **Cancelar**.

**Examen Mental — resultados (`Ver resultados`):**
- Modal de lectura con **tabla**: `Parámetro | Hallazgo` (o `Sección | Parámetro | Hallazgo`), más la síntesis al final.
- Si no hay examen previo, el botón se deshabilita o el modal muestra el texto de "Sin datos".

**Accesibilidad y consistencia:**
- Modo lectura con `dl/dt/dd` (o tabla con caption `sr-only`), no `div` sueltos.
- Los 4 botones "Editar" llevan `aria-label` descriptivo (`Editar antecedentes personales patológicos`, …).
- Toggles No/Sí con `role="radiogroup"` + radios etiquetados (patrón del semáforo VC), no checkboxes ambiguos.
- Los 2 modales replican `role="dialog" aria-modal="true" cdkTrapFocus` + `aria-labelledby`; el formulario NO se anida dentro de otro `<form>`.

---

## 4. Migración de datos y limpieza

1. `V22` migra los 3 antecedentes semilla de `exp-001` a la nueva estructura JSONB y **dropea** `antecedentes_expediente`.
2. Se **retiran** del backend (lista cerrada, 10 archivos) y se limpia `ExpedienteRestController` (imports, campos `listar/guardarAntecedentesUseCase` y endpoints `GET/PUT .../antecedentes`):
   - `domain/model/Antecedente.java`
   - `application/service/AntecedenteApplicationService.java`
   - `application/ports/in/GuardarAntecedentesUseCase.java`
   - `application/ports/in/ListarAntecedentesUseCase.java`
   - `application/ports/out/AntecedenteRepositoryPort.java`
   - `infrastructure/adapters/out/persistence/AntecedenteExpedientePersistenceAdapter.java`
   - `infrastructure/adapters/out/persistence/repository/SpringDataAntecedenteExpedienteRepository.java`
   - `infrastructure/adapters/out/persistence/entity/AntecedenteExpedienteJpaEntity.java`
   - `infrastructure/adapters/in/rest/dto/AntecedenteRequest.java`
   - `infrastructure/adapters/in/rest/dto/AntecedenteResponseDTO.java`

   **Atomicidad de despliegue**: `V22` y la retirada de `Antecedente*` son **una sola unidad de despliegue** (mismo commit); con `ddl-auto: validate`, dejar viva la entidad tras el `DROP` produce fallo de arranque `missing table [antecedentes_expediente]`.
3. Se **conservan** (solo se ocultan de esta sub-pestaña, D-3): `tratamientos_previos` (tabla + endpoints), `fuente_referencia`, `historial_farmacos/psicofarmacos/drogas` (columnas JSONB de `expedientes_clinicos`).

---

## 5. Riesgos y observaciones

1. **Dropear `antecedentes_expediente`** es destructivo; se mitiga migrando el seed a JSONB en la misma migración (idempotente).
2. **`examenMental` ya existe** como JSONB genérico (`'{}'` por defecto). Al reestructurar, el frontend debe tolerar exámenes previos con estructura vacía (`{}`).
3. **Card latente sin datos**: el modo lectura debe soportar objetos vacíos sin romper (`?.` y `|| ''`).
4. **D-3 (Fuente de Referencia / Tratamientos Previos)**: al ocultar las cards, sus datos en BD quedan huérfanos hasta reubicarse; documentarlo como pendiente.
5. **Regresión E2E**: solo se rompe **TC-EXP-17** (antecedentes semilla por texto, headings y botón "Guardar Historia Clínica"). **TC-EXP-04** (esquema farmacológico, pestaña psiquiatría) y **TC-EXP-03** (screenshot del tab TBE) **no** se ven afectados. Añadir TCs nuevos para "Realizar examen → modal" y "Ver resultados → sin datos".
6. **`historialFarmacos/Psicofarmacos/Drogas` huérfanos**: hoy `guardarHistoriaClinica()` los envía al PATCH sin UI en esta sub-pestaña; con D-3 se retiran de este flujo y quedan pendientes de reubicación.
7. **`{}` vacío pisa datos**: en `aplicar`, guard `!= null && !isEmpty()` para `antecedentes`/`examenMental`.
8. **`@JdbcTypeCode(SqlTypes.JSON)`**: obligatorio en la entidad para que `ddl-auto: validate` no falle con "wrong column type jsonb".

---

## 6. Verificación

- **Backend**: `mvn test-compile` limpio; smoke test del `PATCH /expedientes/paciente/{id}` con `antecedentes` + `examenMental` + riesgo especificar.
- **Frontend**: `ng build` limpio.
- **E2E**: actualizar y ejecutar `expediente.spec.ts`; validar las 5 cards, el flujo "Realizar examen" → "Ver resultados" y el estado "Sin datos".
