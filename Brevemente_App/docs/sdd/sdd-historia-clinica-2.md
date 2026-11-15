# SDD-HC-2: Software Design Document — Historia Clínica (Datos Generales, Historia y Esquema Farmacológico)

- **Módulos**: `expediente-clinico` + `pacientes` (frontend Angular) · `expediente` + `paciente` (backend Spring Boot) · PostgreSQL/Flyway
- **Código SDD**: `SDD-HC-2`
- **Versión**: 1.0.0
- **Fecha**: 2026-10-29
- **Estado**: BORRADOR — pendiente de aprobación (Gate #1)
- **Fuente de verdad**: `docs/gap-analysis/gap-report-historia-clinica-pdf.md` (aprobado en 5 rondas por `jarvis-database`, `jarvis-backend`, `jarvis-frontend`)
- **Requisito**: `C:\proyectos_Syborx\Brevemente_Demo\historia clínica.pdf` (especificación de los doctores)
- **Alineación**: ADR-001 (Hexagonal/SDOP), ADR-002 (Dual Adapters), ADR-003 (Backend hexagonal y OpenAPI)
- **Rol**: Lead Architect

> **Regla de Oro**: integrar vía adaptador/puerto, reutilizando/adaptando lo existente. Este documento **no** escribe código fuente; es la especificación que consumirá `demo-gap-implementation`.

---

## 0. Propósito y alcance

Implementar la **Historia Clínica** conforme al PDF de los doctores: dos submenús de pestañas dentro del expediente.

1. **"Datos de Admisión e Historia Clínica"** → 3 sub-pestañas: **Datos Generales**, **Historia clínica**, **Ficha de identificación**.
2. **"Tratamiento Psiquiátrico"** → 2 sub-pestañas: **Esquema Psico-Farmacológico**, **Expediente Médico Psiquiátrico**.

**Cierra los GAPs**: GAP-HC-01…23, con las decisiones de modelo D-1…D-7 del gap-report.

**Fuera de alcance**: TBE/sesiones/VC/VG (ya implementado), circuitos de riesgo del dashboard, reconsentimiento, motor de protocolos.

---

## 1. Plan de Reutilización (ADAPTAR vs CREAR)

### 1.1 Entidades JPA

| Componente | Estado | Estrategia |
| :--- | :--- | :--- |
| `PacienteJpaEntity` (`paciente`) | ✅ curp, fecha_nacimiento, representante_parentesco/correo, persona_de_apoyo_* | **EXTENDER**: `rfc`, `sexo`, `lugar_nacimiento`, `estado_civil`, `escolaridad`, `ocupacion`, `religion`, domicilio (`calle_numero`, `colonia`, `codigo_postal`, `municipio`, `estado_domicilio`, `telefono_casa/celular/trabajo`), `contacto_emergencia_*`, `representante_telefono`. |
| `ExpedienteJpaEntity` (`expediente`) | ✅ dx_nosologico, dsm5, cie11, comorbilidad, diagnostico_diferencial, uso_farmacos, esquema_farmacologico (JSONB) | **EXTENDER**: `tipo_expediente`, `fecha_apertura`, `fuente_referencia(+otro)`, `riesgo_suicida`, `riesgo_heteroagresivo`, `otros_riesgos`, `fecha_evaluacion_riesgo`, `examen_mental` (JSONB), `historial_farmacos/psicofarmacos/drogas` (JSONB). |
| `SedeJpaEntity` (catálogo `sedes`, V11; paquete `dashboard`) | ✅ id, nombre, direccion, activo | **EXTENDER**: `clues`, `licencia_sanitaria`, `tipo_establecimiento` (nullable; es catálogo compartido). |
| `AntecedenteExpedienteJpaEntity` | ❌ no existe | **CREAR** (tabla `antecedentes_expediente`). |
| `TratamientoPrevioJpaEntity` | ❌ no existe | **CREAR** (tabla `tratamientos_previos`). |
| `CatalogoCategoriaPsicofarmacoJpaEntity` | ❌ no existe | **CREAR** (patrón `CatalogoOpcionConductualJpaEntity` de V19). |

### 1.2 DTOs REST

| DTO | Estado | Estrategia |
| :--- | :--- | :--- |
| `PacienteResponseDTO` / `PacientePatchRequest` / `PacienteCreateRequest` | ✅ | **EXTENDER** con Datos Generales (rfc, sexo, domicilio, contacto emergencia, representanteTelefono). |
| `ExpedienteResponseDTO` / `ExpedienteUpdateRequest` | ✅ | **EXTENDER** con tipoExpediente, fechaApertura, fuenteReferencia, fuenteReferenciaOtro, riesgo*, examenMental, historiales JSONB; **añadir `intentosSolucion`** (GAP-HC-23); **corregir `@Schema` de `startDate`** (D-5). |
| `Drug` (record de dominio, expuesto en ambos DTOs) | ✅ plano (sin categoría) | **EXTENDER** con `categoria` (propagación a `Drug.java`, `ExpedienteResponseDTO`, `ExpedienteUpdateRequest`, `clinical.types.ts`; Jackson tolera `null`). |
| `AntecedenteResponseDTO` / `AntecedenteRequest` | ❌ | **CREAR** (`grupo`, `categoria`, `descripcion`). |
| `TratamientoPrevioResponseDTO` / `TratamientoPrevioRequest` | ❌ | **CREAR** (`enfoque`, `duracion`, `resultado`). |
| `CategoriaPsicofarmacoResponseDTO` | ❌ | **CREAR** (`codigo`, `etiqueta`, `orden`). |

### 1.3 Frontend (tipos, puertos, adaptadores)

| Componente | Estado | Estrategia |
| :--- | :--- | :--- |
| `Patient` (`clinical.types.ts`) | ✅ curp, representante, telefonoPaciente | **EXTENDER**: `rfc`, `sexo`, `lugarNacimiento`, `estadoCivil`, `escolaridad`, `ocupacion`, `religion`, `domicilio`, `contactoEmergencia`. |
| `ClinicalRecord` | ✅ dxNosologico…drugsList | **EXTENDER**: `tipoExpediente`, `fechaApertura`, `fuenteReferencia`, riesgo, `examenMental`, historiales, `intentosSolucion`. |
| `Drug` (`clinical.types.ts`) | ✅ plano | **EXTENDER** con `categoria` (opcional, backfill tolerante). |
| `ExpedienteRepository` (puerto) | ✅ `actualizarExpediente`, sesiones, criterios | **EXTENDER**: `listarCategoriasPsicofarmacos()`, `listar/guardarAntecedentes()`, `listar/guardarTratamientosPrevios()`, `obtenerSede()`. |
| `ExpedienteHttpAdapter` | ✅ | **EXTENDER** con los métodos nuevos. |
| `PacienteRepository` / `PacienteHttpAdapter` | ✅ `actualizar(id, Partial<Patient>)` | **REUTILIZAR**: el PATCH de paciente ya transporta los nuevos campos al extender el tipo. |
| `Sede`/Establecimiento (catálogo `sedes`) | ⚠️ solo `{id, nombre}` en el catálogo actual | **EXTENDER** tipo + endpoint con `clues`/`licencia_sanitaria`/`tipo_establecimiento` (ver §4.2/§4.3). |
| `expediente-clinico.component.html` | Tabs `datos`/`psiquiatria` | **REESTRUCTURAR** en sub-pestañas (HTML/SCSS aprobado inmutable salvo reestructura explícita). |

---

## 2. Migración Flyway `V20__historia_clinica.sql`

- **Consecutivo**: `V20` (sucede a `V19`; última aplicada = 19).
- **Ubicación**: `backend/src/main/resources/db/migration/V20__historia_clinica.sql`.
- **Propiedades**: idempotente (`IF NOT EXISTS` / `ON CONFLICT DO NOTHING` / `DO $$`), **inmutable** (no renombra ni dropea columnas/CHECKs existentes). Despliegue **junto con** las entidades JPA (`ddl-auto: validate`).

```sql
-- =============================================================================
-- Migración V20: Historia Clínica — Datos Generales, Historia y Esquema
-- Sucede a V19. Idempotente. Inmutable. Decisiones D-1..D-7 del gap-report.
-- =============================================================================

-- 1. Establecimiento (D-1): extiende el catálogo compartido `sedes` (V11) -----
ALTER TABLE sedes
    ADD COLUMN IF NOT EXISTS clues                VARCHAR(15),
    ADD COLUMN IF NOT EXISTS licencia_sanitaria   VARCHAR(50),
    ADD COLUMN IF NOT EXISTS tipo_establecimiento VARCHAR(10) DEFAULT 'privado';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
                   WHERE c.conname = 'ck_sedes_tipo_establecimiento' AND t.relname = 'sedes') THEN
        ALTER TABLE sedes ADD CONSTRAINT ck_sedes_tipo_establecimiento
            CHECK (tipo_establecimiento IN ('publico','privado','social'));
    END IF;
END $$;

-- 2. Datos Generales del paciente (GAP-HC-06/07/08/09) ------------------------
ALTER TABLE pacientes
    ADD COLUMN IF NOT EXISTS rfc              VARCHAR(13),
    ADD COLUMN IF NOT EXISTS sexo             VARCHAR(10),
    ADD COLUMN IF NOT EXISTS lugar_nacimiento VARCHAR(150),
    ADD COLUMN IF NOT EXISTS estado_civil     VARCHAR(20),
    ADD COLUMN IF NOT EXISTS escolaridad      VARCHAR(30),
    ADD COLUMN IF NOT EXISTS ocupacion        VARCHAR(100),
    ADD COLUMN IF NOT EXISTS religion         VARCHAR(50),
    ADD COLUMN IF NOT EXISTS calle_numero     VARCHAR(200),
    ADD COLUMN IF NOT EXISTS colonia          VARCHAR(100),
    ADD COLUMN IF NOT EXISTS codigo_postal    VARCHAR(5),
    ADD COLUMN IF NOT EXISTS municipio        VARCHAR(100),
    ADD COLUMN IF NOT EXISTS estado_domicilio VARCHAR(50),
    ADD COLUMN IF NOT EXISTS telefono_casa    VARCHAR(20),
    ADD COLUMN IF NOT EXISTS telefono_celular VARCHAR(20),
    ADD COLUMN IF NOT EXISTS telefono_trabajo VARCHAR(20),
    ADD COLUMN IF NOT EXISTS contacto_emergencia_nombre     VARCHAR(200),
    ADD COLUMN IF NOT EXISTS contacto_emergencia_parentesco VARCHAR(30),
    ADD COLUMN IF NOT EXISTS contacto_emergencia_telefono   VARCHAR(20),
    ADD COLUMN IF NOT EXISTS representante_telefono VARCHAR(20);

-- Unicidad parcial de RFC (patrón de curp)
CREATE UNIQUE INDEX IF NOT EXISTS ux_pacientes_rfc
    ON pacientes (rfc) WHERE rfc IS NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
                   WHERE c.conname = 'ck_pacientes_sexo' AND t.relname = 'pacientes') THEN
        ALTER TABLE pacientes ADD CONSTRAINT ck_pacientes_sexo
            CHECK (sexo IN ('M','F','LGTB+'));
    END IF;
END $$;

-- Backfill del teléfono del representante (hoy conflado en persona_de_apoyo_contacto)
UPDATE pacientes
SET representante_telefono = persona_de_apoyo_contacto
WHERE representante_parentesco IS NOT NULL
  AND representante_telefono IS NULL
  AND persona_de_apoyo_contacto IS NOT NULL;

-- 3. Cabecera del expediente (GAP-HC-05/14/15 + D-3/D-5) ----------------------
ALTER TABLE expedientes_clinicos
    ADD COLUMN IF NOT EXISTS tipo_expediente        VARCHAR(15),
    ADD COLUMN IF NOT EXISTS fecha_apertura         DATE,
    ADD COLUMN IF NOT EXISTS fuente_referencia      VARCHAR(30),
    ADD COLUMN IF NOT EXISTS fuente_referencia_otro VARCHAR(100),
    ADD COLUMN IF NOT EXISTS riesgo_suicida         VARCHAR(10),
    ADD COLUMN IF NOT EXISTS riesgo_heteroagresivo  VARCHAR(10),
    ADD COLUMN IF NOT EXISTS otros_riesgos          TEXT,
    ADD COLUMN IF NOT EXISTS fecha_evaluacion_riesgo DATE;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
                   WHERE c.conname = 'ck_expedientes_tipo_expediente' AND t.relname = 'expedientes_clinicos') THEN
        ALTER TABLE expedientes_clinicos ADD CONSTRAINT ck_expedientes_tipo_expediente
            CHECK (tipo_expediente IN ('fisico','electronico','mixto'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
                   WHERE c.conname = 'ck_expedientes_fuente_referencia' AND t.relname = 'expedientes_clinicos') THEN
        ALTER TABLE expedientes_clinicos ADD CONSTRAINT ck_expedientes_fuente_referencia
            CHECK (fuente_referencia IN ('iniciativa_propia','medico','psiquiatra','psicoterapeuta','familiar','amigo','otro'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
                   WHERE c.conname = 'ck_expedientes_riesgo_suicida' AND t.relname = 'expedientes_clinicos') THEN
        ALTER TABLE expedientes_clinicos ADD CONSTRAINT ck_expedientes_riesgo_suicida
            CHECK (riesgo_suicida IN ('ausente','bajo','moderado','alto','inminente'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
                   WHERE c.conname = 'ck_expedientes_riesgo_heteroagresivo' AND t.relname = 'expedientes_clinicos') THEN
        ALTER TABLE expedientes_clinicos ADD CONSTRAINT ck_expedientes_riesgo_heteroagresivo
            CHECK (riesgo_heteroagresivo IN ('ausente','bajo','moderado','alto'));
    END IF;
END $$;

-- 4. Historia clínica (JSONB) (D-4/D-6/D-7) -----------------------------------
ALTER TABLE expedientes_clinicos
    ADD COLUMN IF NOT EXISTS examen_mental           JSONB DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS historial_farmacos      JSONB NOT NULL DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS historial_psicofarmacos JSONB NOT NULL DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS historial_drogas        JSONB NOT NULL DEFAULT '[]';

-- 5. Tablas normalizadas (D-2) ------------------------------------------------
CREATE TABLE IF NOT EXISTS antecedentes_expediente (
    id            VARCHAR(36) PRIMARY KEY,
    expediente_id VARCHAR(36) NOT NULL REFERENCES expedientes_clinicos(id) ON DELETE CASCADE,
    grupo         VARCHAR(20) NOT NULL,
    categoria     VARCHAR(40) NOT NULL,
    descripcion   TEXT NOT NULL,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_antecedentes_grupo CHECK (grupo IN ('patologico','no_patologico','heredo_familiar'))
);
-- idx_antecedentes_grupo (expediente_id, grupo) cubre también las búsquedas por expediente_id
CREATE INDEX IF NOT EXISTS idx_antecedentes_grupo ON antecedentes_expediente (expediente_id, grupo);

CREATE TABLE IF NOT EXISTS tratamientos_previos (
    id            VARCHAR(36) PRIMARY KEY,
    expediente_id VARCHAR(36) NOT NULL REFERENCES expedientes_clinicos(id) ON DELETE CASCADE,
    enfoque       VARCHAR(100),
    duracion      VARCHAR(50),
    resultado     VARCHAR(20),
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_tratamientos_previos_resultado CHECK (resultado IN ('resuelto','mejorado','invariable','drop_out','otro'))
);
CREATE INDEX IF NOT EXISTS idx_tratamientos_previos_expediente ON tratamientos_previos (expediente_id);

-- 6. Catálogo de categorías de psicofármacos (D-6) ----------------------------
CREATE TABLE IF NOT EXISTS catalogo_categorias_psicofarmacos (
    id       VARCHAR(36) PRIMARY KEY,
    codigo   VARCHAR(50) NOT NULL UNIQUE,
    etiqueta VARCHAR(100) NOT NULL,
    orden    INT NOT NULL DEFAULT 0
);
INSERT INTO catalogo_categorias_psicofarmacos (id, codigo, etiqueta, orden) VALUES
    ('psf-001','bzd','Benzodiacepinas (BZD)',1),
    ('psf-002','isrs','Antidepresivos ISRS',2),
    ('psf-003','duales','Antidepresivos Duales',3),
    ('psf-004','triciclicos_tetraciclicos','Antidepresivos Tricíclicos/Tetracíclicos',4),
    ('psf-005','neurolepticos_tipicos','Neurolépticos Típicos',5),
    ('psf-006','neurolepticos_atipicos','Neurolépticos Atípicos',6),
    ('psf-007','psicoestabilizadores','Psicoestabilizadores',7),
    ('psf-008','inductores_sueno','Inductores del Sueño',8),
    ('psf-009','otros','Otros',9)
ON CONFLICT (codigo) DO NOTHING;

-- 7. Semilla de ejemplo (GAP-HC-22) -------------------------------------------
UPDATE sedes SET clues='CLSM-000001', licencia_sanitaria='LS-BM-2026-01', tipo_establecimiento='privado' WHERE id='sede-centro';
UPDATE sedes SET clues='CLSM-000002', licencia_sanitaria='LS-BM-2026-02', tipo_establecimiento='privado' WHERE id='sede-norte';
UPDATE sedes SET clues='CLSM-000003', licencia_sanitaria='LS-BM-2026-03', tipo_establecimiento='social'  WHERE id='sede-sur';

UPDATE pacientes SET rfc='SARM020815XXX', sexo='F', lugar_nacimiento='Ciudad de México',
    estado_civil='soltero', escolaridad='preparatoria', ocupacion='Estudiante', religion='—',
    calle_numero='Av. Insurgentes 123', colonia='Roma Norte', codigo_postal='06700',
    municipio='Cuauhtémoc', estado_domicilio='CDMX',
    telefono_celular='5512345678', representante_telefono='5522334455'
WHERE id='pac-001';

UPDATE pacientes SET rfc='GOME901101YYY', sexo='F', lugar_nacimiento='Guadalajara',
    estado_civil='union_libre', escolaridad='licenciatura', ocupacion='Diseñadora', religion='—',
    calle_numero='Av. Chapultepec 45', colonia='Americana', codigo_postal='44160',
    municipio='Guadalajara', estado_domicilio='Jalisco', telefono_celular='3311223344'
WHERE id='pac-002';

UPDATE expedientes_clinicos SET tipo_expediente='electronico', fecha_apertura='2026-08-10',
    fuente_referencia='psicoterapeuta', riesgo_suicida='bajo', riesgo_heteroagresivo='ausente',
    examen_mental='{}', historial_farmacos='[]', historial_psicofarmacos='[]', historial_drogas='[]'
WHERE id='exp-001';

INSERT INTO antecedentes_expediente (id, expediente_id, grupo, categoria, descripcion) VALUES
    ('ant-001','exp-001','patologico','alergicos','Alergia a la penicilina'),
    ('ant-002','exp-001','no_patologico','tabaquismo','No fuma'),
    ('ant-003','exp-001','heredo_familiar','enfermedades_mentales','Madre con trastorno de ansiedad')
ON CONFLICT (id) DO NOTHING;
```

> **Notas DBA**: los CHECKs nuevos usan vocabularios propios (nunca reutilizan `risk_level`). Las FKs de las tablas nuevas van con `ON DELETE CASCADE` e índice explícito. `representante_telefono` se backfillea desde `persona_de_apoyo_contacto` (conflación actual); `persona_de_apoyo_*` se conserva por retrocompatibilidad. El `categoria` del JSONB `esquema_farmacologico` **no** requiere DDL (ya es JSONB); la evolución es de contrato/aplicación. Los bloques `DO $$` deben filtrar por `conname` **y** `conrelid`/`relname` (patrón V11/V19). Los RFC/CLUES de la semilla son **ficticios** (ilustrativos).

---

## 3. Spring Boot (hexagonal)

### 3.1 Dominio

- `Paciente` / `RepresentanteLegal`: añadir `rfc`, `sexo`, `lugarNacimiento`, `estadoCivil`, `escolaridad`, `ocupacion`, `religion`, `Domicilio`, `ContactoEmergencia`, `representanteTelefono`.
- `Expediente`: añadir `tipoExpediente`, `fechaApertura`, `fuenteReferencia`, `fuenteReferenciaOtro`, `riesgoSuicida`, `riesgoHeteroagresivo`, `otrosRiesgos`, `fechaEvaluacionRiesgo`, `ExamenMental` (JSON), `historialFarmacos`, `historialPsicofarmacos`, `historialDrogas`, y exponer `intentosSolucion` (ya existe en dominio).
- `Drug` (record): añadir `String categoria` (nullable; backfill tolerante).
- (Nuevos records) `Antecedente`, `TratamientoPrevio`, `CategoriaPsicofarmaco`, `Domicilio`, `ContactoEmergencia`.

### 3.2 Puertos

**Entrada (`application/ports/in`):**
- (Nuevo) `ListarAntecedentesUseCase` / `GuardarAntecedentesUseCase`.
- (Nuevo) `ListarTratamientosPreviosUseCase` / `GuardarTratamientosPreviosUseCase`.
- (Nuevo) `ListarCategoriasPsicofarmacosUseCase`.
- (Extender) `ActualizarExpedienteUseCase` / `ActualizarPacienteUseCase` para los nuevos campos (semántica PATCH no-nula ya existente).

**Salida (`application/ports/out`):**
- (Extender) `PacienteRepositoryPort` y `ExpedienteRepositoryPort`.
- (Nuevo) `AntecedenteRepositoryPort`, `TratamientoPrevioRepositoryPort`, `CategoriaPsicofarmacoRepositoryPort`.

### 3.3 Servicios

- `ExpedienteApplicationService.aplicar()`: extender la copia no-nula para los nuevos campos editables (tipoExpediente, fechaApertura, fuenteReferencia, riesgos, examenMental, historiales, intentosSolucion).
- `PacienteApplicationService`: extender actualización de Datos Generales (los campos nuevos fluyen por el PATCH existente).
- (Nuevos) `AntecedenteApplicationService` y `TratamientoPrevioApplicationService` (reemplazo atómico de colección; el patrón existente `GuardarCriteriosSesionUseCase` usa `deleteBySesionId` + `saveAll`, aquí será `deleteByExpedienteId` + `saveAll`).
- (Nuevo) `CatalogoCategoriaPsicofarmacoApplicationService.listar()`.

### 3.4 REST — Controllers

| Endpoint | Método | Permiso | Request | Respuesta |
| :--- | :--- | :--- | :--- | :--- |
| `/expedientes/paciente/{pacienteId}` | **PATCH** (extender) | `EXPEDIENTE_ESCRIBIR` | `ExpedienteUpdateRequest` (ampliado) | **200** `ExpedienteResponseDTO` (ampliado) |
| `/expedientes/paciente/{pacienteId}/antecedentes` | GET | `EXPEDIENTE_LEER` | — | **200** `List<AntecedenteResponseDTO>` |
| `/expedientes/paciente/{pacienteId}/antecedentes` | PUT | `EXPEDIENTE_ESCRIBIR` | `List<AntecedenteRequest>` | **200** `List<AntecedenteResponseDTO>` |
| `/expedientes/paciente/{pacienteId}/tratamientos-previos` | GET | `EXPEDIENTE_LEER` | — | **200** `List<TratamientoPrevioResponseDTO>` |
| `/expedientes/paciente/{pacienteId}/tratamientos-previos` | PUT | `EXPEDIENTE_ESCRIBIR` | `List<TratamientoPrevioRequest>` | **200** `List<TratamientoPrevioResponseDTO>` |
| `/expedientes/catalogos/categorias-psicofarmacos` | GET | `EXPEDIENTE_LEER` | — | **200** `List<CategoriaPsicofarmacoResponseDTO>` |
| `/sedes/{sedeId}` | GET | `EXPEDIENTE_LEER` | — | **200** `SedeDTO` (extendido con `clues`/`licencia_sanitaria`/`tipo_establecimiento`) |
| `/pacientes/{id}` | **PATCH** (extender) | `PACIENTES_EDITAR` | `PacientePatchRequest` (ampliado) | **200** `PacienteResponseDTO` (ampliado) |

> El catálogo vive bajo `/expedientes/catalogos` (mismo controller), patrón de `/expedientes/catalogos/opciones-conductuales` (V19).
>
> **Establecimiento (D-1)**: extender el record de dominio `Sede` y el `SedeDTO` existente (dashboard, hoy `(id, nombre)`) con `clues`/`licencia_sanitaria`/`tipo_establecimiento` y su mapper. El catálogo de sedes existente se expone en `GET /dashboard/catalogos` (permiso `DASHBOARD_LEER`); se añade `GET /sedes/{sedeId}` para lectura individual. El frontend resuelve la sede del paciente vía `Patient.sedeId`.

### 3.5 DTOs y Mappers

- `ExpedienteResponseDTO` / `ExpedienteUpdateRequest`: añadir los campos nuevos + `intentosSolucion` (GAP-HC-23). Corregir `@Schema(description="Fecha de apertura")` de `startDate` → `"Fecha de inicio"`, y añadir `fechaApertura` real (D-5).
- `PacienteResponseDTO` / `PacientePatchRequest` / `PacienteCreateRequest`: añadir Datos Generales. **Añadir `sedeId`** a `PacienteResponseDTO` + `PacienteRestMapper` (hoy no se expone; es la clave para `obtenerSede()`).
- `ExpedienteRestMapper.toResponse()/toParcial()` y `PacienteRestMapper`: mapear los campos nuevos. **Explicitar** el mapeo de `intentosSolucion` en `toResponse()` y `toParcial()` (además de añadirlo a los DTOs).
- `ExpedientePersistenceMapper` / `PacientePersistenceMapper`: mapear los campos nuevos; **corregir la conflación** — `representante.telefono` debe escribir/leer `representante_telefono`, no `persona_de_apoyo_contacto`.
- (Nuevos) mappers para antecedentes, tratamientos previos y catálogo de psicofármacos.

### 3.6 Persistencia

- `PacienteJpaEntity` / `ExpedienteJpaEntity` / `SedeJpaEntity`: añadir columnas nuevas (JSONB con `@JdbcTypeCode(SqlTypes.JSON)`). **Obligatorio**: las 3 columnas `historial_farmacos`/`historial_psicofarmacos`/`historial_drogas` son `NOT NULL DEFAULT '[]'` → declarar `@Column(nullable = false)` (patrón de `esquema_farmacologico`), o `ddl-auto: validate` fallará.
- (Nuevos) `AntecedenteExpedienteJpaEntity` + `SpringDataAntecedenteExpedienteRepository` + adaptador.
- (Nuevos) `TratamientoPrevioJpaEntity` + `SpringDataTratamientoPrevioRepository` + adaptador.
- (Nuevos) `CatalogoCategoriaPsicofarmacoJpaEntity` + `SpringDataCatalogoCategoriaPsicofarmacoRepository` + adaptador.

### 3.7 Manejo de errores y auditoría

- `PacienteNotFoundException` / `ExpedienteNotFoundException` (existentes) → 404 en los sub-recursos.
- Validación de `grupo`/`resultado`/`categoria` en aplicación → 400 (no depender solo del CHECK).
- Registrar traza en `auditoria_expediente` (categoría `"expediente"`) al actualizar historia clínica, antecedentes y tratamientos.
- ⚠️ Riesgo IDOR conocido (solo se valida permiso, no ownership del paciente): documentar, coherente con el estado actual del módulo.

---

## 4. Angular — Estructura del adaptador HTTP

> El patrón de referencia es `LoginHttpAdapter` (`modules/login/adapters/login-http.adapter.ts`): `@Injectable({providedIn:'root'})`, constructor con `HttpClient`, `baseUrl` desde `environment.apiBaseUrl`, métodos que devuelven `Observable<T>` con `catchError`. Para esta feature se **extienden** `ExpedienteHttpAdapter` y `PacienteHttpAdapter` siguiendo ese mismo patrón.

### 4.1 Tipos (`core/types/clinical.types.ts`)

```ts
export type Sexo = 'M' | 'F' | 'LGTB+';
export type TipoExpediente = 'fisico' | 'electronico' | 'mixto';
export type RiesgoSuicida = 'ausente' | 'bajo' | 'moderado' | 'alto' | 'inminente';
export type RiesgoHeteroagresivo = 'ausente' | 'bajo' | 'moderado' | 'alto';
export type FuenteReferencia = 'iniciativa_propia' | 'medico' | 'psiquiatra' | 'psicoterapeuta' | 'familiar' | 'amigo' | 'otro';

// Código de categoría (para `Drug.categoria`)
export type CodigoCategoriaPsicofarmaco =
  'bzd' | 'isrs' | 'duales' | 'triciclicos_tetraciclicos'
  | 'neurolepticos_tipicos' | 'neurolepticos_atipicos'
  | 'psicoestabilizadores' | 'inductores_sueno' | 'otros';

// Ítem del catálogo (para `listarCategoriasPsicofarmacos()`), espejo de `OpcionConductual`
export interface CategoriaPsicofarmaco { codigo: CodigoCategoriaPsicofarmaco; etiqueta: string; orden: number; }

export interface Domicilio {
  calleNumero: string; colonia: string; codigoPostal: string;
  municipio: string; estadoDomicilio: string;
  telefonoCasa: string | null; telefonoCelular: string | null; telefonoTrabajo: string | null;
}
export interface ContactoEmergencia { nombre: string; parentesco: string; telefono: string; }
export interface Antecedente { id?: string; grupo: 'patologico' | 'no_patologico' | 'heredo_familiar'; categoria: string; descripcion: string; }
export interface TratamientoPrevio { id?: string; enfoque: string; duracion: string; resultado: 'resuelto' | 'mejorado' | 'invariable' | 'drop_out' | 'otro'; }

export interface ExamenMental { [seccion: string]: string | string[] | number | boolean | null; } // JSONB flexible (D-4)
export interface HistorialFarmaco { nombre: string; }
export interface HistorialPsicofarmaco { nombre: string; duracion: string; }
export interface HistorialDroga { nombre: string; }

export interface Establecimiento { id: string; nombre: string; clues: string | null; licenciaSanitaria: string | null; tipoEstablecimiento: 'publico' | 'privado' | 'social' | null; }

// Patient: + rfc?, sexo?, lugarNacimiento?, estadoCivil?, escolaridad?, ocupacion?, religion?, domicilio?, contactoEmergencia?, sedeId?
// ClinicalRecord: + tipoExpediente?, fechaApertura?, fuenteReferencia?: FuenteReferencia, fuenteReferenciaOtro?: string, riesgoSuicida?, riesgoHeteroagresivo?,
//                 otrosRiesgos?, examenMental?, historialFarmacos?: HistorialFarmaco[], historialPsicofarmacos?: HistorialPsicofarmaco[],
//                 historialDrogas?: HistorialDroga[], intentosSolucion?: string
// Drug: + categoria?: CodigoCategoriaPsicofarmaco (opcional)
```

### 4.2 Puerto (`expediente-clinico/ports/expediente.repository.ts`) — extender

```ts
abstract listarCategoriasPsicofarmacos(): Observable<CategoriaPsicofarmaco[]>;
abstract listarAntecedentes(pacienteId: string): Observable<Antecedente[]>;
abstract guardarAntecedentes(pacienteId: string, items: Antecedente[]): Observable<Antecedente[]>;
abstract listarTratamientosPrevios(pacienteId: string): Observable<TratamientoPrevio[]>;
abstract guardarTratamientosPrevios(pacienteId: string, items: TratamientoPrevio[]): Observable<TratamientoPrevio[]>;
abstract obtenerSede(sedeId: string): Observable<Establecimiento | null>;
```

### 4.3 `ExpedienteHttpAdapter` (extender)

```ts
@Injectable({ providedIn: 'root' })
export class ExpedienteHttpAdapter implements ExpedienteRepository {
  private readonly base = environment.apiBaseUrl;
  constructor(private readonly http: HttpClient) {}

  listarCategoriasPsicofarmacos(): Observable<CategoriaPsicofarmaco[]> {
    return this.http.get<CategoriaPsicofarmaco[]>(`${this.base}/expedientes/catalogos/categorias-psicofarmacos`)
      .pipe(catchError(() => of([])));
  }

  listarAntecedentes(pacienteId: string): Observable<Antecedente[]> {
    return this.http.get<Antecedente[]>(`${this.base}/expedientes/paciente/${pacienteId}/antecedentes`)
      .pipe(catchError(() => of([])));
  }

  guardarAntecedentes(pacienteId: string, items: Antecedente[]): Observable<Antecedente[]> {
    return this.http.put<Antecedente[]>(`${this.base}/expedientes/paciente/${pacienteId}/antecedentes`, items);
  }

  listarTratamientosPrevios(pacienteId: string): Observable<TratamientoPrevio[]> {
    return this.http.get<TratamientoPrevio[]>(`${this.base}/expedientes/paciente/${pacienteId}/tratamientos-previos`)
      .pipe(catchError(() => of([])));
  }

  guardarTratamientosPrevios(pacienteId: string, items: TratamientoPrevio[]): Observable<TratamientoPrevio[]> {
    return this.http.put<TratamientoPrevio[]>(`${this.base}/expedientes/paciente/${pacienteId}/tratamientos-previos`, items);
  }

  obtenerSede(sedeId: string): Observable<Establecimiento | null> {
    return this.http.get<Establecimiento>(`${this.base}/sedes/${sedeId}`)
      .pipe(catchError(() => of(null)));
  }
}
```

- El `actualizarExpediente(pacienteId, Partial<ClinicalRecord>)` **ya existe** y transporta los campos nuevos al ampliar `ClinicalRecord` (GAP-HC-18 es UI-only).
- `PacienteHttpAdapter.actualizar(id, Partial<Patient>)` **ya existe** y cubre Datos Generales al ampliar `Patient`.

### 4.4 Componente (`expediente-clinico.component.ts` + `.html`) — reestructura

- Añadir `datosSubTab: 'generales' | 'historia' | 'ficha'` y `psiquiatriaSubTab: 'esquema' | 'expediente'`.
- Renderizar los 5 campos ocultos del expediente psiquiátrico (`comorbilidad`, `differentialDx`, `favorableFactors`, `unfavorableFactors`, `drugsUsage`) y reubicar `motif`/`firstAppearance`/`precipitatingFactors`/`evolutionType`; **hacer editables** `firstAppearance` y `precipitatingFactors` (hoy solo lectura en `datos`, GAP-HC-18).
- Destino de los campos TBE hoy en `datos` (`description`, `trastornoEstrategico`, `objectivePatient`, `objectiveTherapist`): se conservan en el subtab TBE-DX (donde ya son editables) y se retiran del tab `datos` (GAP-HC-03). `dxOpInicial` y `sprInicial` **no son editables hoy** (solo lectura en `datos`): se decide crearles control editable en TBE-DX o conservarlos solo-lectura, evitando dejarlos huérfanos.
- Formularios de Datos Generales (incluida la sección **Establecimiento** con CLUES/licencia/tipo vía `obtenerSede`), Historia clínica (antecedentes, examen mental, riesgo, fuente de referencia, tratamientos previos, historiales) y Esquema categorizado; botón "Agregar" de fármacos (GAP-HC-21).
- **Ficha de identificación** (3ª sub-pestaña): reutiliza la ficha cabecera del paciente ya existente (datos demográficos + representante legal); sin lámina nueva en el PDF.
- **Excepción a la regla HTML/SCSS inmutable** (declarada explícitamente): se modifican (1) la barra de sub-pestañas de `datos`/`psiquiatria`, (2) los formularios nuevos de Datos Generales/Historia clínica/Esquema, (3) el botón "Agregar" de fármacos y (4) la reubicación de los campos indicados. Todo lo demás (TBE, sesiones, VC/VG, pagos, auditoría, supervisión, constancias) permanece **intacto**.

---

## 5. Verificación y cierre

1. Backend: `mvn test-compile` limpio; migración V20 aplicada sin error en `brevemente_db`.
2. Frontend: `npm run build` limpio.
3. Smoke REST: PATCH expediente con los campos nuevos; GET/PUT antecedentes y tratamientos-previos; GET catálogo psicofármacos; PATCH paciente con Datos Generales.
4. E2E Playwright: navegar sub-pestañas y verificar persistencia sin regresiones en TBE/VC/VG.
