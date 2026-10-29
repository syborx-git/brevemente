# GAP Analysis Report: Historia Clínica (Especificación de los Doctores)

- **Fecha**: 2026-10-29
- **Módulo**: Expediente Clínico — Historia Clínica / Admisión / Tratamiento Psiquiátrico
- **Estado**: AUDITADO (READ-ONLY)
- **Fuente de requisito**: `C:\proyectos_Syborx\Brevemente_Demo\historia clínica.pdf` (12 páginas)
- **Metodología**: `demo-gap-analysis` (Fases: mapear spec → auditar backend → detectar gaps → informe)

---

## 1. Interpretación del Requisito (qué piden los doctores)

El PDF define **dos submenús de pestañas** dentro del expediente clínico:

### 1.1 "Datos de Admisión e Historia Clínica" → 3 pestañas

| Pestaña | Contenido solicitado (página del PDF) |
| :--- | :--- |
| **Datos Generales** | Establecimiento (CLUES, Licencia Sanitaria, Tipo Público/Privado/Social); Expediente (Número, Fecha de Apertura, Tipo Físico/Electrónico/Mixto); Paciente (Nombre, CURP, RFC, Fecha Nacimiento, Edad, Sexo M/F/LGTB+, Lugar de Nacimiento, Estado Civil, Escolaridad, Ocupación, Religión); Domicilio (Calle, Colonia, C.P., Municipio, Estado, Teléfonos Casa/Celular/Trabajo, Correo); Contacto de Emergencia (Nombre, Parentesco, Teléfono); Responsable Legal (Nombre, Parentesco, Teléfono). *(pág. 2)* |
| **Historia clínica** | (1) Antecedentes Personales Patológicos (Médicos, Quirúrgicos, Traumáticos, Alérgicos, Transfusionales, Hospitalizaciones); (2) Antecedentes Personales No Patológicos (Tabaquismo, Alcoholismo, Toxicomanías, Actividad física, Alimentación); (3) Antecedentes Heredo-Familiares (Enf. mentales, crónicas, suicidios, adicciones); (4) Evaluación del Estado Mental (usar "Formato Examen Mental 2"); (5) Evaluación de Riesgo (Riesgo Suicida: Ausente/Bajo/Moderado/Alto/Inminente; Riesgo Heteroagresivo: Ausente/Bajo/Moderado/Alto; Otros riesgos); Fecha de inicio; Fuente de referencia (Iniciativa propia, Médico, Psiquiatra, Psicoterapeuta, Familiar, Amigo, Otro); Tratamientos previos psicoterapéuticos (enfoque, duración, resultados Resuelto/Mejorado/Invariable/Drop-out/Otro); Fármacos (No/Sí, 1-3); Psicofármacos (No/Sí, nombre y duración, 1-8); Drogas (No/Sí, 1-4). *(págs. 3-6)* |
| **Ficha de identificación** | Pestaña presente en el encabezado del documento (sin lámina propia). Corresponde a la ficha de identificación institucional del paciente. *(págs. 2-6)* |

### 1.2 "Tratamiento Psiquiátrico" → 2 pestañas

| Pestaña | Contenido solicitado (página del PDF) |
| :--- | :--- |
| **Esquema Psico-Farmacológico** | Fármacos (No/Sí, 1-3); Psicofármacos categorizados: BZD (1-3), Antidepresivos (ISRS, Duales, Tricíclicos/Tetracíclicos), Neurolépticos (Típicos/Atípicos), Psicoestabilizadores (1-4), Inductores del sueño (1-2), Otros (1-4); Drogas (No/Sí, 1-4). *(págs. 10-11)* |
| **Expediente Médico Psiquiátrico** | Motivo de Consulta (textual del paciente); DX Nosológico DSM-5TR; CIE-11; Primera aparición; Factores precipitantes; Evolución temporal (Progresivo/Agudo/Crónico/Episódico); Comorbilidad; DX diferencial; Plan de tratamiento; Pronóstico (Excelente/Bueno/Reservado/Malo); Factores favorables; Factores desfavorables. *(pág. 9)* |

> Nota del PDF (pág. 8): *"Agregar algunos campos para completar el expediente médico: revisar la lista de las siguientes diapositivas y colocar aquí lo que falta"* → es una instrucción explícita de **completar** campos, no de rediseñar.

---

## 2. Estado Actual del Módulo en la App Angular

### 2.1 Tabs actuales (`expediente-clinico.component.ts`)
```
activeTab: 'datos' | 'psiquiatria' | 'tbe' | 'pagos' | 'auditoria' | 'supervision' | 'constancias'
```
- Tab **"Datos de Admisión e Historia Clínica"** (`datos`): 2 tarjetas — "Diagnóstico Clínico Estratégico" y "Objetivos y SPR" (solo lectura).
- Tab **"Psiquiatría"** (`psiquiatria`): "Expediente Médico Psiquiátrico" + tabla "Esquema Psicotrópico Farmacológico" (flat, no categorizado).
- **NO existe** la sub-estructura de 3 pestañas ni de 2 pestañas que pide el PDF.

### 2.2 Backend existente
- `pacientes` (V1/V12): nombre, apellidos, curp, fecha_nacimiento, edad_calculada, telefono, email, persona_de_apoyo_nombre/contacto, status, risk_level, representante_parentesco, representante_correo.
- `expedientes_clinicos` (V1/V8): motivo_consulta, folio, fecha_inicio, modalidad, descripcion, trastorno_estrategico, primera_aparicion, factores_precipitantes, tipo_evolucion, spr_inicial, objetivo_paciente/terapeutico, dx_nosologico, dsm5, cie11, **comorbilidad**, **diagnostico_diferencial**, plan_tratamiento, pronostico, **factores_favorables**, **factores_desfavorables**, **uso_farmacos**, esquema_farmacologico (JSONB).

### 2.3 Hallazgos de la auditoría cruzada (jarvis-database / jarvis-backend / jarvis-frontend)

- **GAP-HC-18 es mayormente UI**: los 8 campos del expediente psiquiátrico (`comorbilidad`, `differentialDx`, `favorableFactors`, `unfavorableFactors`, `drugsUsage`, `firstAppearance`, `precipitatingFactors`, `evolutionType`) ya están en `ExpedienteResponseDTO` y se aceptan vía PATCH. `comorbilidad`, `differentialDx`, `favorableFactors`, `unfavorableFactors` y `drugsUsage` los envía `guardarPsiquiatria()` pero **no se renderizan** en ningún HTML; `firstAppearance`, `precipitatingFactors` y `evolutionType` los envía `guardarDx()` y ya se muestran (solo lectura) en el tab `datos` (`evolutionType` además es editable en el subtab TBE-DX), por lo que solo hay que reubicarlos a "Expediente Médico Psiquiátrico".
- **Campo huérfano**: `intentosSolucion` existe en DB, `ExpedienteJpaEntity`, dominio y mapper, pero **no está en ningún DTO REST** → dato muerto (no se lee ni escribe por API).
- **Conflación de dominio (crítico, 3 conceptos colapsados)**: `PacientePersistenceMapper` persiste el **nombre** y **teléfono** del representante legal en `persona_de_apoyo_nombre`/`persona_de_apoyo_contacto`. Es decir, "persona de apoyo", "responsable legal" y el futuro "contacto de emergencia" conviven en las mismas 2 columnas. Al modelar V20 hay que separar explícitamente `contacto_emergencia_*`, `representante_*` (nombre, parentesco, teléfono, correo) y decidir qué es `persona_de_apoyo_*`, con backfill de los datos existentes; si no, habrá corrupción/pérdida de datos.
- **Dos escalas de riesgo separadas**: `pacientes.risk_level` (`bajo/medio/alto`, triage) NO debe reutilizarse para riesgo suicida (`ausente/bajo/moderado/alto/inminente`) ni heteroagresivo (`ausente/bajo/moderado/alto`). Requieren columnas propias.
- **`ddl-auto: validate`**: la migración y las entidades JPA deben desplegarse juntas, o la app no arranca.
- **Numeración de migraciones**: la última aplicada es `V19`; la siguiente disponible es **V20** (no V21).

---

## 3. Matriz de Brechas (GAPs)

Clasificación: **[MISSING]** no existe · **[PARTIAL]** existe parcial · **[INCORRECT]** tipo incompatible · **[CONTRACT]** desajuste puerto/API · **[DATA]** falta semilla.

### 3.1 Estructura de navegación

| ID | Tipo | Brecha | Impacto | Acción propuesta |
| :--- | :--- | :--- | :--- | :--- |
| GAP-HC-01 | MISSING | El tab `datos` no tiene submenú de 3 pestañas (Datos Generales / Historia clínica / Ficha de identificación). | Alto | Introducir `datosSubTab` en el componente + nueva UI (manteniendo HTML aprobado en la demo cuando aplique). |
| GAP-HC-02 | MISSING | El tab `psiquiatria` no tiene submenú de 2 pestañas (Esquema Psico-Farmacológico / Expediente Médico Psiquiátrico). | Alto | Introducir `psiquiatriaSubTab`. |
| GAP-HC-03 | PARTIAL | El tab `datos` actual mezcla campos TBE ("Diagnóstico Estratégico", "SPR") que el PDF ubica en otra parte. | Medio | Reubicar/clarificar; el "Motivo de consulta textual", "Primera aparición", "Factores precipitantes", "Evolución temporal" deben vivir en "Expediente Médico Psiquiátrico" (pág. 9). |

### 3.2 Pestaña "Datos Generales" (pág. 2)

| ID | Tipo | Brecha | Impacto | Acción propuesta |
| :--- | :--- | :--- | :--- | :--- |
| GAP-HC-04 | MISSING | No existe sección de **Establecimiento** (CLUES, Licencia Sanitaria, Tipo Público/Privado/Social). | Alto | Nueva tabla/servicio de datos institucionales o campos en expediente. |
| GAP-HC-05 | PARTIAL | Existen `folio` y `fecha_inicio` (inicio de tratamiento), pero falta **Tipo de Expediente** (Físico/Electrónico/Mixto) y **Fecha de Apertura** como concepto distinto a `fecha_inicio`. | Medio | Extender `expedientes_clinicos` con `tipo_expediente` y `fecha_apertura` (sin renombrar `fecha_inicio`). |
| GAP-HC-06 | PARTIAL | Paciente: falta **RFC**, **Sexo (M/F/LGTB+)**, **Lugar de nacimiento**, **Estado civil**, **Escolaridad**, **Ocupación**, **Religión**. Existen CURP, fecha nacimiento, edad. | Alto | Migración sobre `pacientes` + DTO. |
| GAP-HC-07 | MISSING | **Domicilio** estructurado: Calle/Número, Colonia, C.P., Municipio, Estado, Teléfonos Casa/Celular/Trabajo (hoy solo hay un `telefono`). | Alto | Migración sobre `pacientes` (o tabla `domicilios`). |
| GAP-HC-08 | PARTIAL | **Contacto de emergencia** está implícito en `persona_de_apoyo_nombre/contacto` y en `representante`, pero sin `parentesco` del contacto de emergencia ni teléfono separado. | Medio | Extender con `contacto_emergencia_*`. |
| GAP-HC-09 | PARTIAL | **Responsable legal**: el tipo `RepresentanteLegal.telefono` existe y se renderiza, pero en BD **no hay columna** `representante_telefono`; el mapper lo persiste en `persona_de_apoyo_contacto` (conflación de dominio). | Alto | Añadir `representante_telefono` + corregir `PacientePersistenceMapper` en el mismo cambio (evitar corrupción de datos). |

### 3.3 Pestaña "Historia clínica" (págs. 3-6)

| ID | Tipo | Brecha | Impacto | Acción propuesta |
| :--- | :--- | :--- | :--- | :--- |
| GAP-HC-10 | MISSING | **Antecedentes Personales Patológicos** (médicos, quirúrgicos, traumáticos, alérgicos, transfusionales, hospitalizaciones). | Alto | Nueva tabla/JSONB de antecedentes en expediente. |
| GAP-HC-11 | MISSING | **Antecedentes Personales No Patológicos** (tabaquismo, alcoholismo, toxicomanías, actividad física, alimentación). | Alto | Ídem. |
| GAP-HC-12 | MISSING | **Antecedentes Heredo-Familiares** (enf. mentales, crónicas, suicidios/intentos, adicciones). | Alto | Ídem. |
| GAP-HC-13 | MISSING | **Evaluación del Estado Mental** ("Formato Examen Mental 2"). | Alto | Definir formato + persistencia. |
| GAP-HC-14 | PARTIAL | **Evaluación de Riesgo** estructurada: Riesgo Suicida (Ausente/Bajo/Moderado/Alto/Inminente) y Heteroagresivo. Hoy solo `risk_level` (bajo/medio/alto). | Alto | Extender modelo de riesgo clínico. |
| GAP-HC-15 | MISSING | **Fuente de referencia** (iniciativa propia, médico, psiquiatra, psicoterapeuta, familiar, amigo, otro). | Medio | Campo en expediente. |
| GAP-HC-16 | MISSING | **Tratamientos previos psicoterapéuticos** (enfoque, duración, resultados). | Medio | Tabla/JSONB. |
| GAP-HC-17 | PARTIAL | **Fármacos / Psicofármacos / Drogas** como historia (págs. 5-6): existe `uso_farmacos` + `esquema_farmacologico`, pero la historia de consumo (nombre, duración) no está modelada. | Alto | Extender esquema farmacológico. |

### 3.4 Pestaña "Tratamiento Psiquiátrico" (págs. 7-11)

| ID | Tipo | Brecha | Impacto | Acción propuesta |
| :--- | :--- | :--- | :--- | :--- |
| GAP-HC-18 | PARTIAL (UI-only) | **Expediente Médico Psiquiátrico**: los 8 campos ya están en la API (`ExpedienteResponseDTO` + PATCH). `comorbilidad`, `differentialDx`, `favorableFactors`, `unfavorableFactors` y `drugsUsage` los envía `guardarPsiquiatria()` pero no se renderizan; `firstAppearance`, `precipitatingFactors` y `evolutionType` los envía `guardarDx()` y ya se muestran (solo lectura) en `datos`. | Alto | Solo UI: renderizar los 5 campos ocultos (`comorbilidad`, `differentialDx`, `favorableFactors`, `unfavorableFactors`, `drugsUsage`) y reubicar `motif`/`firstAppearance`/`precipitatingFactors`/`evolutionType` a esta pestaña (crear control editable para `firstAppearance`/`precipitatingFactors`, hoy solo lectura). |
| GAP-HC-19 | PARTIAL | **Esquema Psico-Farmacológico** categorizado (BZD, ISRS, Duales, Tricíclicos, Neurolépticos típicos/atípicos, Psicoestabilizadores, Inductores del sueño, Otros): hoy la tabla es plana (`drugsList` con mañana/tarde/noche/EFF/observaciones). | Alto | Modelar categorías de psicofármacos. |
| GAP-HC-20 | MISSING | **Drogas** como subsección separada del esquema farmacológico. | Medio | Campo/tabla. |
| GAP-HC-21 | PARTIAL | Botón **"Agregar"** de tratamiento psiquiátrico (pág. 7). El alta ya es posible vía `PATCH /expedientes/paciente/{id}` con `drugsList`; falta la **UI de alta/eliminación** de filas del esquema. | Medio | UI de alta/eliminación + validación por categoría en backend (opcional). |

### 3.5 Datos / Semilla

| ID | Tipo | Brecha | Impacto | Acción propuesta |
| :--- | :--- | :--- | :--- | :--- |
| GAP-HC-22 | DATA | Sin semilla para los nuevos campos (antecedentes, domicilio, datos generales, esquema categorizado). | Medio | Migración de semilla. |

### 3.6 Contrato API / Deuda (hallazgos de auditoría)

| ID | Tipo | Brecha | Impacto | Acción propuesta |
| :--- | :--- | :--- | :--- | :--- |
| GAP-HC-23 | CONTRACT | `intentosSolucion` existe en DB, `ExpedienteJpaEntity`, dominio y mapper, pero **no está en ningún DTO REST** → dato muerto. | Medio | Añadir `intentosSolucion` a `ExpedienteResponseDTO` y `ExpedienteUpdateRequest` (o descartarlo explícitamente). |

---

## 4. Matriz de Reutilización de Código Existente

| Componente | Estado actual | Estrategia SDOP |
| :--- | :--- | :--- |
| `expedientes_clinicos` (V1/V8) | Ya tiene y ya expone en API `comorbilidad`, `diagnostico_diferencial`, `factores_favorables/desfavorables`, `uso_farmacos`, `esquema_farmacologico` | **Reutilizar**; solo falta renderizarlos en UI |
| `pacientes` (V1/V12) | Ya tiene `curp`, `fecha_nacimiento`, `edad`, `representante_parentesco/correo`, `persona_de_apoyo_nombre/contacto` | **Extender** con domicilio, RFC, sexo, etc. |
| `ExpedienteJpaEntity` + `ClinicalRecord` | Mapeo casi completo del expediente médico | **Extender** con campos de Historia clínica |
| `expediente-clinico.component.html` | Tabs `datos`/`psiquiatria` actuales | **Reestructurar** en sub-pestañas sin perder el HTML aprobado |

---

## 5. Resumen ejecutivo

1. El PDF **no pide rediseño** de lo existente (TBE, sesiones, VC/VG), sino **completar la Historia Clínica** con la estructura que los doctores definen.
2. El **esqueleto ya existe** (tabs `datos` y `psiquiatria` + backend con muchos campos del expediente médico). Las brechas mayores son:
   - Estructura de **sub-pestañas** (3 y 2).
   - **Datos Generales** completos (establecimiento, RFC, sexo, domicilio, contacto de emergencia).
   - **Historia clínica** (antecedentes, examen mental, evaluación de riesgo estructurada, fuente de referencia, tratamientos previos).
   - **Esquema farmacológico categorizado** + drogas.
3. Recomendación de implementación secuencial:
   - **Fase A (backend)**: migración V20 con campos de Datos Generales + Historia clínica + esquema categorizado.
   - **Fase B (backend)**: DTOs/controllers para lectura/escritura.
   - **Fase C (frontend)**: sub-pestañas + formularios respetando el HTML/SCSS aprobado.
   - **Fase D**: semilla y E2E.

---

## 6. Decisiones de modelo (cerradas para V20)

| # | Decisión | Resolución |
| :--- | :--- | :--- |
| D-1 | **Establecimiento** (GAP-HC-04): ¿tabla global o por expediente? | Reutilizar `sedes` (V11) extendiéndola con `clues`, `licencia_sanitaria`, `tipo_establecimiento` (CHECK público/privado/social). El expediente hereda la sede vía `pacientes.sede_id` (ya existente). No duplicar datos institucionales por expediente. |
| D-2 | **Antecedentes y tratamientos previos** (HC-10/11/12/16): ¿tabla o JSONB? | **Tablas normalizadas**: `antecedentes_expediente` (grupo patológico/no_patológico/heredo_familiar + categoria + descripcion) y `tratamientos_previos` (enfoque, duracion, resultado con CHECK). Colecciones consultables de cardinalidad variable. |
| D-3 | **Evaluación de riesgo** (HC-14): ¿en paciente o expediente? | **En `expedientes_clinicos`**: `riesgo_suicida`, `riesgo_heteroagresivo`, `otros_riesgos`, `fecha_evaluacion_riesgo`. `pacientes.risk_level` se conserva intacto como triage de dashboard. |
| D-4 | **Examen Mental 2** (HC-13): ¿estructurado o texto libre? | **JSONB `examen_mental`** en `expedientes_clinicos` con secciones del formato como claves (flexible). Nota: `docs/analisis-documentacion-clinica.md` propone un modelo normalizado (`examen_mental_parametros`/`examen_mental_aplicaciones`); se adopta JSONB como simplificación para V20 y debe reconciliarse/descartarse explícitamente en ese documento. |
| D-5 | **`startDate` vs `fecha_apertura`** (contrato API) | `startDate` seguirá mapeando `fecha_inicio` (inicio de tratamiento) y se **corrige su `@Schema`**, que hoy dice erróneamente "Fecha de apertura". Se añade campo API nuevo `fechaApertura` para la apertura real, documentado en OpenAPI. |
| D-6 | **Esquema categorizado** (HC-19/20) | Catálogo `catalogo_categorias_psicofarmacos` (patrón V19) + campo `categoria` en el JSONB `esquema_farmacologico` (backfill tolerante, sin CHECK retroactivo). **Atención**: `categoria` se propaga a 4 lugares a la vez — `Drug.java` (dominio), `ExpedienteResponseDTO`, `ExpedienteUpdateRequest` y `clinical.types.ts` — y Jackson debe tolerar `categoria` ausente/null en filas existentes. Drogas como subsección propia: `historial_drogas` será **columna JSONB** en `expedientes_clinicos` (historia de consumo 0-4); en el esquema, las drogas se representan como ítems del JSONB categorizado. |
| D-7 | **Historia de consumo fármacos/psicofármacos** (HC-17) | `historial_farmacos` JSONB en `expedientes_clinicos` (0-3, ítems con nombre) y `historial_psicofarmacos` JSONB (0-8, ítems `{nombre, duracion}`). `uso_farmacos` se conserva como flag maestro (SI/NO/ESPECIFICAR) para retrocompatibilidad; el detalle vive en los JSONB. |
