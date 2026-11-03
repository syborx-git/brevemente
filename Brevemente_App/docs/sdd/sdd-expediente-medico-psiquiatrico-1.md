# SDD-EMP-1: Software Design Document — Expediente Médico Psiquiátrico (alineación al PDF)

- **Módulos**: `expediente-clinico` (frontend Angular 18 standalone) · `expediente` (backend Spring Boot, hexagonal) · PostgreSQL/Flyway
- **Código SDD**: `SDD-EMP-1`
- **Versión**: 1.0.0
- **Fecha**: 2026-11-02
- **Estado**: ✅ APROBADO (auditado por `jarvis-database`, `jarvis-backend` y `jarvis-frontend`; implementado y validado E2E)
- **Sucede a**: `SDD-FI-1` (Ficha de identificación) y `SDD-HC-3` (Historia clínica)
- **Fuente de verdad**: `C:\proyectos_Syborx\Brevemente_Demo\historia clínica.pdf` — submenú *Tratamiento Psiquiátrico → Expediente Médico Psiquiátrico* (láminas de campos, Fármacos/Psicofármacos y Drogas)
- **Alineación**: ADR-001 (Hexagonal/SDOP), ADR-002 (Dual Adapters), ADR-003 (Backend hexagonal y OpenAPI)
- **Precede a**: `gap-report-expediente-medico-psiquiatrico.md` (aprobado por los 3 agentes)

> **Regla de Oro**: integrar vía adaptador/puerto, reutilizando/adaptando lo existente. Este documento **no** escribe código fuente; es la especificación que consumirá `demo-gap-implementation`.

---

## 0. Propósito y alcance

Alinear la sub-pestaña **"Expediente Médico Psiquiátrico"** con la lámina del PDF, que hoy es una rejilla plana de 14 campos y le faltan 3 secciones (Fármacos, Psicofármacos, Drogas).

### 0.1 Estructura del documento (clave de interpretación)

El PDF usa una tabla de 2 columnas: **gris = encabezado de sección**, **blanco = campos de esa sección**. El resultado debe ser una vista con **8 secciones**:

1. **Motivo Consulta** (Textual paciente)
2. **DX. Nosológico** → DX Nosológico · DSM5TR · CIE11 · Primera aparición · Factores precipitantes · Evolución temporal
3. **DX.DIF**
4. **Plan de tratamiento**
5. **Pronóstico** → Excelente/Bueno/Reservado/Malo · Factores favorables · Factores desfavorables
6. **Fármacos** → No/Sí → Especificar 1-3
7. **Psicofármacos** → agrupados por 6 grupos (BZD, Antidepresivos, Neurolépticos, Psicoestabilizadores, Inductores del sueño, Otros)
8. **Drogas** → No/Sí → 1-4

### 0.2 Alcance

- **Solo** la sub-pestaña *Expediente Médico Psiquiátrico*. La sub-pestaña hermana *Esquema Psico-Farmacológico* queda **fuera de alcance** (SDD futuro); su tabla de psicofármacos se reutiliza como fuente para la sección 7.
- Resuelve los `GAP-EMP-01…10` del gap-report aprobado.

### 0.3 Decisiones cerradas (del gap-report)

| # | Decisión |
| :-- | :-- |
| D-1 | Persistencia de Fármacos/Drogas con **columnas JSONB separadas** (`farmacos_esquema`, `drogas_esquema`) — NO reutilizar `historial_*` (son historial de consumo). |
| D-2 | `esquema_farmacologico` se mantiene **exclusivo para psicofármacos**. |
| D-3 | El toggle No/Sí de **Fármacos** mapea al flag existente `uso_farmacos` (campo frontend `drugsUsage`); los ítems viven en `farmacos_esquema`. |
| D-4 | El toggle No/Sí de **Drogas** mapea al nuevo flag `uso_drogas`; los ítems viven en `drogas_esquema`. |
| D-5 | El campo "Uso de Fármacos" deja de ser texto libre (GAP-EMP-09): la UI usa el toggle No/Sí de la sección Fármacos (flag `SI`/`NO`); el valor `ESPECIFICAR` queda como **legacy** (el CHECK de BD lo admite, pero la nueva UI no lo produce). |
| D-6 | "Comorbilidad" se **oculta** de esta pestaña (no está en la lámina); el dato en BD se conserva. |
| D-7 | Renombrar "Plan de Tratamiento Farmacológico" → **"Plan de tratamiento"**. |
| D-8 | Orden de campos: `DX.DIF → Plan de tratamiento → Pronóstico`. |
| D-9 | `guardarPsiquiatria()` debe persistir también `motif`, `firstAppearance`, `precipitatingFactors`, `evolutionType` (GAP-EMP-10). |
| D-10 | Toggle "Sí" escribe el flag como `SI`; "No" escribe `NO`. |

---

## 1. Modelo de datos — Migración Flyway `V23__esquema_farmacos_drogas.sql`

- **Consecutivo**: `V23` (última aplicada = 22).
- **Ubicación**: `backend/src/main/resources/db/migration/V23__esquema_farmacos_drogas.sql`.
- **Propiedades**: idempotente, inmutable respecto a `V20`/`V22`.

```sql
-- =============================================================================
-- Migración V23: Fármacos y Drogas del esquema vigente (Expediente Médico Psiquiátrico)
-- Sucede a V22. Idempotente. Decisiones D-1..D-4 del gap-report.
-- =============================================================================

-- 1. Fármacos vigentes (0-3) y Drogas vigentes (0-4) ---------------------------
ALTER TABLE expedientes_clinicos
    ADD COLUMN IF NOT EXISTS farmacos_esquema JSONB NOT NULL DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS drogas_esquema  JSONB NOT NULL DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS uso_drogas       VARCHAR(15);

-- 2. CHECK espejo de ck_expedientes_uso_farmacos (V8) ---------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
                   WHERE c.conname = 'ck_expedientes_uso_drogas' AND t.relname = 'expedientes_clinicos') THEN
        ALTER TABLE expedientes_clinicos ADD CONSTRAINT ck_expedientes_uso_drogas
            CHECK (uso_drogas IS NULL OR uso_drogas IN ('SI','NO','ESPECIFICAR'));
    END IF;
END $$;

-- 3. Backfill de categoría en el seed de esquema_farmacologico (V8 no la traía) -
UPDATE expedientes_clinicos
SET esquema_farmacologico = (
    SELECT COALESCE(
        jsonb_agg(
            elem || CASE
                WHEN elem->>'categoria' IS NOT NULL THEN '{}'::jsonb
                WHEN elem->>'id' = 'drug-1' THEN '{"categoria":"isrs"}'::jsonb
                WHEN elem->>'id' = 'drug-2' THEN '{"categoria":"bzd"}'::jsonb
                ELSE '{}'::jsonb
            END
        ),
        '[]'::jsonb
    )
    FROM jsonb_array_elements(esquema_farmacologico) AS elem
)
WHERE id = 'exp-002'
  AND esquema_farmacologico IS NOT NULL
  AND jsonb_typeof(esquema_farmacologico) = 'array';
```

> **Nota de backfill**: el seed de `esquema_farmacologico` (`V8`) no incluye `categoria`. La V23 etiqueta los 2 ítems de demostración de `exp-002` **clavando por `id`** (`drug-1` Sertralina → `isrs`; `drug-2` Alprazolam → `bzd`), tolerante al reordenamiento del array y sin CHECK retroactivo.

### 1.1 Esquema de los JSONB nuevos

```json
{
  "farmacos_esquema": [ { "nombre": "Losartan" } ],
  "drogas_esquema":   [ { "nombre": "Cannabis" } ],
  "uso_drogas": "SI"
}
```

- `farmacos_esquema`: array 0-3 de `{ nombre }`.
- `drogas_esquema`: array 0-4 de `{ nombre }`.
- `uso_drogas`: flag maestro `SI`/`NO`/`ESPECIFICAR` (espejo de `uso_farmacos`).

---

## 2. Backend (hexagonal)

| Componente | Estrategia |
| :-- | :-- |
| `expediente/domain/model/Expediente` | **EXTENDER** con `List<Map<String,Object>> farmacosEsquema`, `List<Map<String,Object>> drogasEsquema`, `String usoDrogas`. |
| `ExpedienteJpaEntity` | **EXTENDER** con `@JdbcTypeCode(SqlTypes.JSON) @Column(name="farmacos_esquema", columnDefinition="jsonb", nullable=false) List<Map<String,Object>> farmacosEsquema`, ídem `drogas_esquema`, y `@Column(name="uso_drogas", length=15) String usoDrogas`. |
| `ExpedientePersistenceMapper` | **EXTENDER** `toDomain`/`toJpaEntity` para los 3 campos (guard `!= null ? … : List.of()`). |
| `ExpedienteApplicationService.aplicar(...)` | **EXTENDER** con 3 copias no-nulas: `farmacosEsquema`, `drogasEsquema` (guard `!= null`, un `[]` **sí** limpia) y `usoDrogas` (guard `!= null`). |
| `ExpedienteResponseDTO` / `ExpedienteUpdateRequest` | **EXTENDER** con `List<Map<String,Object>> farmacosEsquema`, `drogasEsquema`, `String usoDrogas` (nombres camelCase). |
| `ExpedienteRestMapper` | **EXTENDER** `toParcial` (`.farmacosEsquema(r.farmacosEsquema())`, `.drogasEsquema(...)`, `.usoDrogas(...)`) y `toResponse` (3 args nuevos). |

> **Sin endpoint nuevo**: alta/lectura/escritura vía el mismo `PATCH /expedientes/paciente/{pacienteId}`.
>
> **Nota de tipos**: `farmacosEsquema`/`drogasEsquema` siguen el patrón `List<Map<String,Object>>` de `historial_*` (ítems planos `{nombre}`), no el de `esquema_farmacologico` (que en dominio es `List<Drug>` tipado con `categoria` y dosis).
>
> **Nota de mapeo posicional**: `ExpedienteResponseDTO` es un record con constructor posicional; en `ExpedienteRestMapper.toResponse()` los 3 campos nuevos deben insertarse en el **mismo orden** en que se declaran en el record (p. ej. junto a `drugsUsage`/`drugsList`) para evitar desalineación silenciosa. `toParcial()` usa builder y no tiene este riesgo.

---

## 3. Frontend (Angular 18 standalone)

### 3.1 Tipos (`clinical.types.ts`)

- `ClinicalRecord`: **EXTENDER** con `farmacosEsquema?: HistorialFarmaco[]`, `drogasEsquema?: HistorialDroga[]` (reutilizando los tipos ya existentes `HistorialFarmaco`/`HistorialDroga`, ambos `{ nombre: string }`), `usoDrogas?: 'SI' | 'NO' | 'ESPECIFICAR'`.
- `Drug` (ya existe) conserva `categoria?: CodigoCategoriaPsicofarmaco` para los psicofármacos.

### 3.2 Componente (`expediente-clinico`)

**Estado nuevo (prefijo `emp` para no colisionar con la Ficha de identificación, que ya usa `farmacosSi`/`drogasSi`):**
- `editandoEMP = false` (modo edición de toda la pestaña).
- Drafts solo para las listas nuevas: `empFarmacosDraft: { nombre: string }[]`, `empDrogasDraft: { nombre: string }[]`.
- Toggles de edición: `empFarmacosSi`, `empDrogasSi` (booleanos de borrador, no derivados de longitud — lección de SDD-FI-1).
- Los campos clínicos (secciones 1-5) y la sección 7 (Psicofármacos) usan **binding en vivo sobre `record`** (igual que hoy); `cancelar()` recarga `cargarDatos()` para descartar.

**Métodos:**
- `editarExpedienteMedico()` → inicializa `empFarmacosDraft = record.farmacosEsquema ?? []`, `empDrogasDraft = record.drogasEsquema ?? []`, `empFarmacosSi = empFarmacosDraft.length > 0`, `empDrogasSi = empDrogasDraft.length > 0`, `editandoEMP = true`.
- `guardarExpedientePsiquiatrico()` (renombra/amplía `guardarPsiquiatria()`; es el handler compartido por los botones "Guardar Expediente Psiquiátrico" y "Guardar Esquema") → envía en un único `PATCH`:
  - Los campos clínicos, incluidos los 4 faltantes de GAP-EMP-10 (`motif`, `firstAppearance`, `precipitatingFactors`, `evolutionType`).
  - **Solo si `editandoEMP === true`**: `drugsUsage` = `empFarmacosSi ? 'SI' : 'NO'`, `farmacosEsquema` = `empFarmacosSi ? empFarmacosDraft : []`, `usoDrogas` = `empDrogasSi ? 'SI' : 'NO'`, `drogasEsquema` = `empDrogasSi ? empDrogasDraft : []`. (Si `editandoEMP === false` — p. ej. "Guardar Esquema" sin pasar por edición del Expediente — **no** se envían estos 4 campos, para no sobrescribir datos vigentes con vacíos.)
  - `drugsList` (psicofármacos) tal cual, compartido con el sub-tab Esquema.
- Helpers CRUD: `agregarFarmacoEsquema()` (máx 3), `agregarDrogaEsquema()` (máx 4) y sus eliminaciones.
- **Psicofármacos (sección 7)**: `agregarPsicofarmaco(grupo)` crea un ítem en `record.drugsList` asignando la `categoria` del grupo según la tabla de mapeo §3.3 (no fija `otros`); los ítems con `categoria` `undefined` o inválida caen en "Otros".

> **Nota de contrato**: `drugsUsage` (frontend, tipo `ClinicalRecord`) ↔ columna `uso_farmacos` (backend). **No existe** `usoFarmacos` en el frontend.

### 3.3 UX de las 8 secciones (gris = encabezado, blanco = campos)

| # | Sección | Contenido |
| :-- | :-- | :-- |
| 1 | Motivo Consulta (Textual paciente) | `textarea` `record.motif` |
| 2 | DX. Nosológico | `dxNosologico` · `dsm5` · `cie11` · `firstAppearance` · `precipitatingFactors` · `evolutionType` (select 4 opciones) |
| 3 | DX.DIF | `differentialDx` |
| 4 | Plan de tratamiento | `treatmentPlan` |
| 5 | Pronóstico | `prognosis` (select 4) + `favorableFactors` + `unfavorableFactors` |
| 6 | Fármacos | Radio No/Sí (`empFarmacosSi`) → si "Sí", 1-3 inputs "nombre" + Agregar/Eliminar (máx 3) |
| 7 | Psicofármacos | 6 grupos (BZD / Antidepresivos / Neurolépticos / Psicoestabilizadores / Inductores del sueño / Otros); bajo cada grupo, los ítems de `record.drugsList` con esa(s) categoría(s), editables (nombre, dosis mañana/tarde/noche, EFF, obs.) + "Agregar" por grupo. Los ítems sin `categoria` o con categoría inválida se muestran en "Otros". |
| 8 | Drogas | Radio No/Sí (`empDrogasSi`) → si "Sí", 1-4 inputs "nombre" + Agregar/Eliminar (máx 4) |

**Mapeo 6 grupos → 9 categorías** (constante en el componente):

| Grupo PDF | Categorías catálogo |
| :-- | :-- |
| BZD | `bzd` |
| Antidepresivos | `isrs`, `duales`, `triciclicos_tetraciclicos` |
| Neurolépticos | `neurolepticos_tipicos`, `neurolepticos_atipicos` |
| Psicoestabilizadores | `psicoestabilizadores` |
| Inductores del sueño | `inductores_sueno` |
| Otros | `otros` |

**Accesibilidad y consistencia:**
- Cada grupo No/Sí lleva `name` único (`emp-farmacos`, `emp-drogas`).
- Jerarquía con `<section>` + encabezado `bg-slate-100` + campos en tarjetas blancas; la rejilla `md:grid-cols-3` se usa **dentro** de cada sección.
- Un único botón **"Guardar Expediente Psiquiátrico"** al pie; no anidar `<form>`.
- Claves con acentos: usar accesores ASCII con clave string (lección documentada de SDD-HC-3/SDD-FI-1).

---

## 4. Verificación

- **Backend**: `mvn test-compile` limpio; smoke test del `PATCH /expedientes/paciente/{id}` con `farmacosEsquema` + `drogasEsquema` + `usoDrogas`.
- **Frontend**: `ng build --configuration development` limpio.
- **E2E**: actualizar/añadir casos en `expediente.spec.ts`:
  - *Expediente Médico Psiquiátrico* con 8 secciones (estructura por encabezados).
  - Fármacos "Sí" → 1-3 y Drogas "Sí" → 1-4 con persistencia.
  - Regresión: `guardarPsiquiatria()` persiste los 4 campos faltantes (GAP-EMP-10).

---

## 5. Riesgos y observaciones

1. **`guardarPsiquiatria()` incompleto (GAP-EMP-10)**: hoy 4 campos editables no se persisten; se corrige en el mismo cambio para evitar pérdida de datos.
2. **`uso_farmacos` CHECK**: el frontend solo enviará `SI`/`NO` (toggle); `ESPECIFICAR` queda como valor legacy. No enviar texto libre.
3. **Seed sin `categoria`**: el backfill de V23 es tolerante; si un ítem queda sin categoría válida, la sección 7 debe mostrarlo bajo "Otros" (no romper).
4. **`Comorbilidad` oculta (D-6)**: el campo sigue en BD y DTO; solo se quita de la vista. Si el PDF completo la ubica en otra lámina, se reubicará en otro SDD.
5. **Fuera de alcance**: la sub-pestaña *Esquema Psico-Farmacológico* conserva su tabla actual; su botón "Guardar Esquema" pasa a usar el mismo `guardarExpedientePsiquiatrico()` (payload unificado). La posible duplicación visual con la sección 7 se resolverá en un SDD futuro.
6. **Regresión E2E**: se toca el caso de *Expediente Médico Psiquiátrico*; los casos de Historia clínica, Ficha de identificación y Esquema no se ven afectados (el Esquema sigue intacto).
7. **Modo localStorage (ADR-002)**: `expediente-localstorage.adapter.ts.actualizarExpediente` es un no-op; la persistencia de los 3 campos nuevos y de D-9 solo aplica al adaptador HTTP. El fallback localStorage queda fuera de la validación E2E.

---

## 6. Estado documental

- [x] Gap-report aprobado (base)
- [x] Especificación backend (V23 + hexagonal)
- [x] Especificación frontend (8 secciones)
- [x] Auditoría por `jarvis-database`, `jarvis-backend` y `jarvis-frontend`
- [x] Implementación (`demo-gap-implementation`)
- [x] E2E y reporte
