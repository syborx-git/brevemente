# GAP Analysis Report: Expediente Médico Psiquiátrico (Tratamiento Psiquiátrico)

- **Fecha**: 2026-11-02
- **Módulo**: Expediente Clínico — *Tratamiento Psiquiátrico → Expediente Médico Psiquiátrico*
- **Estado**: AUDITADO (READ-ONLY)
- **Fuente de requisito**: `C:\proyectos_Syborx\Brevemente_Demo\historia clínica.pdf` — submenú *Tratamiento Psiquiátrico* (láminas "Expediente Médico Psiquiátrico", "Fármacos/Psicofármacos", "Drogas")
- **Metodología**: `demo-gap-analysis` (mapear spec → auditar backend → detectar gaps → informe)

---

## 0. Nota de interpretación del documento (clave para la auditoría)

Las láminas del PDF usan una **tabla de 2 columnas**:

- **Columna GRIS** = **encabezado de sección**.
- **Columna BLANCA** = **campos que pertenecen a esa sección**.

Esto define una **jerarquía**, no una lista plana. Ejemplo:

| Encabezado (gris) | Campos (blanco) |
| :-- | :-- |
| **DX. Nosológico** | DX Nosológico · DSM5TR · CIE11 · Primera aparición · Factores precipitantes · Evolución temporal |
| **Pronóstico** | Excelente/Bueno/Reservado/Malo · Factores favorables · Factores desfavorables |

El PDF incluye además la instrucción explícita (lámina "Agregar algunos campos…"):
> *"Agregar algunos campos para completar el expediente médico: revisar la lista de las siguientes diapositivas y colocar aquí lo que falta."*

---

## 1. Interpretación del requisito (qué pide el PDF)

El submenú **Tratamiento Psiquiátrico** tiene 2 pestañas. La pestaña **"Expediente Médico Psiquiátrico"** debe contener, agrupadas por sección gris:

| # | Sección (gris) | Campos (blanco) |
| :-- | :-- | :-- |
| 1 | **Motivo Consulta** (Textual paciente) | Texto libre del motivo |
| 2 | **DX. Nosológico** | Diagnóstico Nosológico · DSM5TR · CIE11 · Primera aparición · Factores precipitantes · Evolución temporal (Progresivo / Agudo / Crónico / Episódico) |
| 3 | **DX.DIF** | Diagnóstico diferencial |
| 4 | **Plan de tratamiento** | Plan |
| 5 | **Pronóstico** | Excelente / Bueno / Reservado / Malo · Factores favorables · Factores desfavorables |
| 6 | **Fármacos** | No / Sí → Especificar 1, 2, 3 |
| 7 | **Psicofármacos** | BZD (benzodiacepinas) 1-3 · Antidepresivos (ISRS / Duales / Tricíclicos o tetracíclicos) · Neurolépticos (Típicos / Atípicos) · Psicoestabilizadores 1-4 · Inductores del sueño 1-2 · Otros 1-4 |
| 8 | **Drogas** | No / Sí → 1, 2, 3, 4 |

> **Distinción de concepto importante**: estas secciones (Fármacos / Psicofármacos / Drogas) corresponden al **esquema/tratamiento vigente** del paciente. No confundir con los `historial_*` que ya se modelaron en la *Ficha de identificación* (historial de consumo). El PDF usa los mismos nombres en ambas partes, por lo que la distinción debe quedar explícita en el SDD.

---

## 2. Estado actual del módulo en la app Angular

Sub-pestaña **"Expediente Médico Psiquiátrico"** (`psiquiatriaSubTab === 'expediente'`, archivo `expediente-clinico.component.html`):

Campos renderizados hoy (rejilla plana de 3 columnas, **sin** jerarquía gris/blanco):

| Campo actual | Orden | ¿Está en el PDF? |
| :-- | :-- | :-- |
| Motivo de Consulta (Textual) | 1 | ✅ (etiqueta distinta) |
| Diagnóstico Nosológico Clínico | 2 | ✅ (PDF: "DX. Nosológico") |
| Criterio DSM-5TR | 3 | ✅ |
| Criterio CIE-11 | 4 | ✅ |
| Primera Aparición | 5 | ✅ |
| Factores Precipitantes | 6 | ✅ |
| Evolución Temporal (select 4 opciones) | 7 | ✅ |
| **Comorbilidad** | 8 | ⚠️ no aparece en la lámina |
| Diagnóstico Diferencial | 9 | ✅ (PDF: "DX.DIF") |
| Pronóstico de Evolución (select 4 opciones) | 10 | ✅ |
| **Plan de Tratamiento Farmacológico** | 11 | ⚠️ PDF: "Plan de tratamiento" |
| **Uso de Fármacos (texto libre)** | 12 | ⚠️ no está como tal; el PDF pide la sección "Fármacos" |
| Factores Favorables | 13 | ✅ |
| Factores Desfavorables | 14 | ✅ |

**Hallazgo central**: NO existe ninguna sección para registrar **Fármacos**, **Psicofármacos** ni **Drogas** dentro de esta pestaña. El único campo relacionado es "Uso de Fármacos" (texto libre), que no corresponde a la estructura del PDF.

---

## 3. Matriz de brechas (GAPs)

Clasificación: **[MISSING]** no existe · **[PARTIAL]** existe parcial · **[INCORRECT]** tipo/etiqueta errónea · **[EXTRA]** sobra · **[CONTRACT]** desajuste API.

| ID | Tipo | Brecha | Impacto | Acción propuesta |
| :-- | :-- | :-- | :-- | :-- |
| GAP-EMP-01 | MISSING | Falta la sección **"Fármacos"** (No/Sí → Especificar 1-3) en *Expediente Médico Psiquiátrico*. | Alto | Renderizar sección estructurada (No/Sí + lista 1-3). Persistir en `farmacos_esquema` (V23). |
| GAP-EMP-02 | PARTIAL | La sección **"Psicofármacos"** agrupada por categoría NO está en *Expediente Médico Psiquiátrico*, pero la funcionalidad **ya existe** en el sub-tab hermano *Esquema Psico-Farmacológico* (tabla con `drugsList` + `categoria` alimentada por el catálogo). | Alto | Reubicar/agrupar por categoría dentro del Expediente Médico Psiquiátrico (no crear de cero). Reutilizar `esquema_farmacologico` y `catalogo_categorias_psicofarmacos`. |
| GAP-EMP-03 | MISSING | Falta la sección **"Drogas"** (No/Sí → 1-4). | Alto | Renderizar sección estructurada (No/Sí + lista 1-4). Persistir en `drogas_esquema` + flag `uso_drogas` (V23). |
| GAP-EMP-04 | INCORRECT | Campo "Uso de Fármacos" como texto libre; el PDF no lo pide así. | Medio | Eliminar o sustituir por la sección estructurada "Fármacos" (GAP-EMP-01). Conservar `uso_farmacos` en BD para retrocompatibilidad si aplica. |
| GAP-EMP-05 | EXTRA | "Comorbilidad" no aparece en la lámina del *Expediente Médico Psiquiátrico*. | Medio | Confirmar contra el PDF completo si pertenece a otra lámina; si no, quitar de esta pestaña (sin borrar el dato de BD). |
| GAP-EMP-06 | INCORRECT | Etiqueta "Plan de Tratamiento Farmacológico" → el PDF dice **"Plan de tratamiento"**. | Bajo | Renombrar etiqueta. |
| GAP-EMP-07 | PARTIAL | Estructura visual: rejilla plana de 3 columnas, sin la jerarquía gris/blanco del PDF (campos agrupados por sección). | Medio | Reestructurar la vista en secciones (encabezado + campos hijos), respetando el HTML/SCSS del port. |
| GAP-EMP-08 | PARTIAL | Orden: "Pronóstico" aparece antes que "Plan de tratamiento"; el PDF es `DX.DIF → Plan de tratamiento → Pronóstico`. | Bajo | Reordenar campos. |
| GAP-EMP-09 | CONTRACT | "Uso de Fármacos" se renderiza como texto libre, pero la columna `uso_farmacos` es `VARCHAR(15)` con `CHECK ('SI','NO','ESPECIFICAR')` (`V8`); cualquier texto libre ≠ esas 3 opciones hará fallar el `PATCH`. | Medio | La UI pasará a `select` (SI/NO/ESPECIFICAR) — ver Decisión de modelado cerrada. |
| GAP-EMP-10 | CONTRACT | `guardarPsiquiatria()` NO persiste `motif`, `firstAppearance`, `precipitatingFactors` ni `evolutionType`, que sí se renderizan/editables en esta pestaña (solo los guarda `guardarDx()`). Riesgo de pérdida de datos al pulsar "Guardar Expediente Psiquiátrico". | Alto | Persistir esos 4 campos desde este handler o trasladarlos a la pestaña DX. |

---

## 4. Matriz de reutilización de código existente

| Componente | Estado actual | Estrategia SDOP |
| :-- | :-- | :-- |
| `expedientes_clinicos` | Ya tiene y expone en API: `motivo_consulta` (V1), `primera_aparicion`/`factores_precipitantes`/`tipo_evolucion` (V7), `dx_nosologico`/`dsm5`/`cie11`/`comorbilidad`/`diagnostico_diferencial`/`plan_tratamiento`/`pronostico`/`factores_favorables`/`factores_desfavorables`/`uso_farmacos`/`esquema_farmacologico` (V8), `historial_*` + catálogo (V20) | **Reutilizar**; ya se aceptan vía `PATCH /expedientes/paciente/{pacienteId}` |
| `esquema_farmacologico` (JSONB) | Array de objetos `Drug` (no una clave `drugsList`: `drugsList` es el campo DTO). Guarda psicofármacos con `categoria` + dosis mañana/tarde/noche + EFF + obs. | **Reutilizar** para GAP-EMP-02 (Psicofármacos categorizados) |
| `catalogo_categorias_psicofarmacos` (V20) | Catálogo de 9 categorías (bzd, isrs, duales, triciclicos_tetraciclicos, neurolepticos_tipicos/atipicos, psicoestabilizadores, inductores_sueno, otros) | **Reutilizar** como fuente de las categorías |
| `historial_farmacos` / `historial_psicofarmacos` / `historial_drogas` (V20) | JSONB de **historial de consumo** (ya usados en Ficha de identificación) | **NO reutilizar** para el esquema vigente (sería conflación de dominio) |
| `ExpedienteResponseDTO` / `ExpedienteUpdateRequest` | Ya incluyen los campos clínicos de esta pestaña | **Reutilizar + extender** con `farmacosEsquema`, `drogasEsquema`, `usoDrogas` |

> **Decisión de modelado (CERRADA)** ✅ — se adopta **columnas JSONB separadas** (recomendación de `jarvis-database`):
> - `esquema_farmacologico` se mantiene **exclusivo para psicofármacos** (resuelve GAP-EMP-02).
> - Nuevas columnas `farmacos_esquema` JSONB (0-3) y `drogas_esquema` JSONB (0-4) para el **tratamiento vigente** de Fármacos y Drogas.
> - Flag `uso_drogas` `VARCHAR(15)` con CHECK `('SI','NO','ESPECIFICAR')`, espejo de `uso_farmacos`, para el toggle No/Sí de Drogas.
> - El toggle No/Sí de **Fármacos** reutiliza el flag existente `uso_farmacos` (mismo CHECK); NO se crea flag nuevo redundante.
> - **NO** se reutilizan `historial_*` (historial de consumo de la Ficha; sería conflación de dominio).
> - Implica migración `V23__esquema_farmacos_drogas.sql` + entidad JPA + DTOs + mapper.
>
> **Mapeo visual PDF → catálogo (para el SDD)**: el PDF agrupa los Psicofármacos en 6 grupos; el catálogo `catalogo_categorias_psicofarmacos` tiene 9 categorías. La UI debe colapsar así:
>
> | Grupo visual PDF | Categorías del catálogo |
> | :-- | :-- |
> | BZD | `bzd` |
> | Antidepresivos | `isrs`, `duales`, `triciclicos_tetraciclicos` |
> | Neurolépticos | `neurolepticos_tipicos`, `neurolepticos_atipicos` |
> | Psicoestabilizadores | `psicoestabilizadores` |
> | Inductores del sueño | `inductores_sueno` |
> | Otros | `otros` |

---

## 5. Recomendaciones para demo-gap-implementation

1. **Reestructurar la sub-pestaña** *Expediente Médico Psiquiátrico* con la jerarquía gris/blanco del PDF (secciones 1-8), en lugar de la rejilla plana actual.
2. **Reubicar/renombrar**:
   - Renombrar "Plan de Tratamiento Farmacológico" → "Plan de tratamiento".
   - Resolver "Uso de Fármacos" y "Comorbilidad" (GAP-EMP-04/05) sin borrar datos de BD.
   - Reordenar `DX.DIF → Plan → Pronóstico`.
3. **Añadir las 3 secciones estructuradas** (Fármacos 1-3, Psicofármacos por categoría, Drogas 1-4) reutilizando `esquema_farmacologico` + `catalogo_categorias_psicofarmacos`, y definiendo en el SDD la persistencia de Fármacos/Drogas.
4. **Migración `V23__esquema_farmacos_drogas.sql`** (columnas separadas): `farmacos_esquema` JSONB `NOT NULL DEFAULT '[]'`, `drogas_esquema` JSONB `NOT NULL DEFAULT '[]'`, `uso_drogas` VARCHAR(15) + CHECK `('SI','NO','ESPECIFICAR')`; backfill de `categoria` en el seed de `esquema_farmacologico` (los ítems de V8 no traen categoría).
5. **E2E**: actualizar el caso de *Expediente Médico Psiquiátrico* (hoy validado solo por oráculo de inputs) para cubrir las 3 secciones nuevas y la estructura por secciones.

---

## 6. Resumen ejecutivo

- El PDF **no** pide quitar los campos clínicos existentes (están todos), sino **agruparlos por sección** y **completar** con 3 secciones que hoy no existen: **Fármacos**, **Psicofármacos** (categorizados) y **Drogas**.
- La brecha combina **frontend** (estructura gris/blanco + reubicar Psicofármacos ya existentes + 2 secciones nuevas) y **backend** (migración `V23` con columnas JSONB separadas + entidad JPA + DTOs + mapper), tras cerrar la decisión de modelado con columnas separadas.
- Existen piezas reutilizables: `esquema_farmacologico`, `catalogo_categorias_psicofarmacos` y los DTOs ya exponen los campos clínicos.
