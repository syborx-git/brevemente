# SDD-EXP: Software Design Document — Módulo Expedientes (Expediente Clínico TBE)

- **Módulo**: `expediente` (backend) / `expediente-clinico` (frontend)
- **Código SDD**: `SDD-EXP`
- **Versión**: 1.0.0
- **Fecha**: 2026-10-07
- **Estado**: BORRADOR — pendiente de aprobación (Gate #1)
- **Fuente de verdad**: `docs/gap-analysis/gap-report-expedientes.md` (auditado ✅ por `jarvis-database`, `jarvis-backend` y `jarvis-frontend` 2 rondas + auditoría de integración final)
- **Alineación**: ADR-001 (Hexagonal/SDOP), ADR-002 (Dual Adapters), ADR-003 (Flyway), `SDD-001-expediente-clinico.md` (stub previo), `sdd-agenda.md` (pendiente GAP-EXP-04)

> **Regla de Oro**: integrar vía adaptador/puerto, reutilizando/adaptando lo existente. El HTML/SCSS de la demo React es la **fuente de verdad visual a portar** (ver §4.1 del gap report). No se escribe código fuente en esta fase; este documento es la especificación.

---

## 0. Propósito y alcance

Despertar el dominio **Expedientes** en el backend empresarial (Spring Boot + PostgreSQL) para el módulo Angular `expediente-clinico` (ruta `/expediente/:id`), con paridad total respecto a la demo React (`ClinicalRecord.tsx`): formulación TBE, sesiones y notas, valoraciones (VC/VG/RST), psiquiatría, auditoría, pagos, supervisión, constancias y régimen legal/consentimiento.

**Fuera del alcance inicial (fase futura, decisión 2026-10-07)**: el tab `contrareferencia`, el banner "Paciente contra-referido" y el modo solo lectura asociado. Se planearán después de tener el panel de expediente funcional.

**Alcance backend inicial** (este SDD): los 4 endpoints que el frontend necesita y hoy no existen, más la firma de consentimiento (pendiente de Agenda, GAP-EXP-04).

---

## 1. Plan de Reutilización: Entidades JPA y DTOs a extender

### 1.1 Reutilizar sin cambios
| Componente | Ubicación | Uso |
| :--- | :--- | :--- |
| Tabla `expedientes_clinicos` (V1) | `db/migration/V1__init_schema.sql` | Se **extiende** en V7 (no se recrea) |
| Tablas `notas_evolucion` y `consentimientos_informados` (V1) | V1 | `notas_evolucion` se conserva como narrativa opcional; `consentimientos_informados` se **adapta** para auditoría de firma |
| `pacientes` + `PacienteJpaEntity` + `PacienteRepositoryPort` | módulo `paciente` | `GET /pacientes/{id}` ya sirve el `Patient`; el adapter de firma reutiliza `PacienteRepositoryPort` (patrón `PacienteConsentimientoAdapter` de `cita`) |
| Permisos `EXPEDIENTE_LEER/ESCRIBIR/FIRMAR` (V5) | perm-005/006/007 | `@PreAuthorize` de los endpoints |
| Módulo `paciente` (hexagonal completo) | — | **Plantilla** de estructura |
| Módulo `cita` (hexagonal completo + `CitaExceptionHandler` scoped) | — | **Plantilla** para `ExpedienteExceptionHandler` |
| `AuditoriaAccesoPort` (auth) | extendido con `registrarAcceso` | Auditar lectura/escritura de expediente |

### 1.2 Entidades JPA a EXTENDER (existentes)
| Entidad | Cambio |
| :--- | :--- |
| `PacienteJpaEntity` | **Sin cambios** (la firma reutiliza su columna `consentimiento_representante_firmado` de V3) |

### 1.3 Entidades JPA NUEVAS (módulo `expediente`)
| Entidad | Tabla | Notas |
| :--- | :--- | :--- |
| `ExpedienteJpaEntity` | `expedientes_clinicos` | 12 columnas nuevas de V7 + 4 campos clínicos principales existentes (`motivo_consulta`, `intentos_solucion`, `objetivo_terapeutico`, `diagnostico_operativo`) + IDs/timestamps + joins |
| `SesionJpaEntity` | `sesiones` (nueva V7) | `px` como JSONB; `add` → `adherencia` |
| `ConsentimientoJpaEntity` | `consentimientos_informados` | Auditoría de firmas (read/insert) |

### 1.4 DTOs a EXTENDER (frontend, `core/types/clinical.types.ts`)
- **Sin cambios de tipos**: `ClinicalRecord`, `Session`, `Patient`, `CapacidadConsentimiento`, `RepresentanteLegal` ya describen el contrato. El backend produce DTOs que serializan **camelCase** idéntico (patrón `PacienteRestMapper`).
- `Permission` ya incluye `EXPEDIENTE_LEER/ESCRIBIR/FIRMAR` (sin cambios).
- `environment.ts`: activar `features.expedienteClinicoBackend: true` (dev).

### 1.5 Puertos/adaptadores a REUTILIZAR como patrón
- **`PacienteConsentimientoPort` → `PacienteConsentimientoAdapter`** (módulo `cita`): plantilla del nuevo puerto de salida **`PacienteConsentimientoEscrituraPort`** (método `firmar(pacienteId, fechaDeterminacion)`). A diferencia del de `cita` (solo lectura), este es **lectura+escritura**: su adapter inyecta `PacienteRepositoryPort` para localizar el paciente, reconstruir `CapacidadConsentimiento` con la nueva fecha de determinación y guardar `consentimiento_representante_firmado = TRUE` sin acoplar módulos.
- **`ExpedienteExceptionHandler`** replica `CitaExceptionHandler` con `basePackages = "com.syborx.brevemente.expediente"`.

---

## 2. Migración Flyway: `V7__introduce_expediente_extension.sql`

- **Consecutivo oficial**: `V7` (sucede a `V1…V6`).
- **Ubicación**: `Brevemente_App/backend/src/main/resources/db/migration/V7__introduce_expediente_extension.sql`.
- **Propiedades**: inmutable, idempotente (`ADD COLUMN IF NOT EXISTS`, `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, `DO $$` para constraints, seed con `ON CONFLICT`).

```sql
-- =============================================================================
-- Migración V7: Extensión de Expedientes + tabla sesiones (SDOP) — SDD-EXP v1.0.0
-- Sucede a V1..V6. Idempotente.
-- =============================================================================

-- 1. Extender expedientes_clinicos (12 columnas nuevas) ----------------------
ALTER TABLE expedientes_clinicos
    ADD COLUMN IF NOT EXISTS folio                      VARCHAR(30),
    ADD COLUMN IF NOT EXISTS fecha_inicio               DATE,
    ADD COLUMN IF NOT EXISTS modalidad                  VARCHAR(10),
    ADD COLUMN IF NOT EXISTS descripcion                TEXT,
    ADD COLUMN IF NOT EXISTS trastorno_estrategico      TEXT,
    ADD COLUMN IF NOT EXISTS primera_aparicion          TEXT,
    ADD COLUMN IF NOT EXISTS factores_precipitantes     TEXT,
    ADD COLUMN IF NOT EXISTS tipo_evolucion             VARCHAR(20),
    ADD COLUMN IF NOT EXISTS spr_inicial                TEXT,
    ADD COLUMN IF NOT EXISTS valoracion_cambio_inicial  TEXT,
    ADD COLUMN IF NOT EXISTS valoracion_global_inicial  TEXT,
    ADD COLUMN IF NOT EXISTS objetivo_paciente          TEXT;

-- 2. CHECKs de expedientes_clinicos -------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
                   WHERE c.conname = 'ck_expedientes_modalidad' AND t.relname = 'expedientes_clinicos') THEN
        ALTER TABLE expedientes_clinicos
            ADD CONSTRAINT ck_expedientes_modalidad CHECK (modalidad IN ('presencial','online'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
                   WHERE c.conname = 'ck_expedientes_tipo_evolucion' AND t.relname = 'expedientes_clinicos') THEN
        ALTER TABLE expedientes_clinicos
            ADD CONSTRAINT ck_expedientes_tipo_evolucion CHECK (tipo_evolucion IN ('progresivo','agudo','crónico','episódico'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
                   WHERE c.conname = 'ck_expedientes_estatus' AND t.relname = 'expedientes_clinicos') THEN
        ALTER TABLE expedientes_clinicos
            ADD CONSTRAINT ck_expedientes_estatus CHECK (estatus_expediente IN ('ACTIVO','EN_TRATAMIENTO','EN_DIAGNOSTICO','CERRADO','ARCHIVADO'));
    END IF;
END $$;

-- Unicidad 1:1 paciente↔expediente y folio único (parcial)
CREATE UNIQUE INDEX IF NOT EXISTS ux_expedientes_paciente ON expedientes_clinicos (paciente_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_expedientes_folio    ON expedientes_clinicos (folio) WHERE folio IS NOT NULL;
DROP INDEX IF EXISTS idx_expedientes_paciente; -- V1 creaba un índice no único redundante (lo cubre ux_expedientes_paciente)

-- 3. Nueva tabla sesiones ------------------------------------------------------
CREATE TABLE IF NOT EXISTS sesiones (
    id                           VARCHAR(36) PRIMARY KEY,
    expediente_id                VARCHAR(36) NOT NULL REFERENCES expedientes_clinicos(id) ON DELETE CASCADE,
    numero                       INT NOT NULL,
    fecha                        DATE,
    fase                         VARCHAR(100),
    protocolo                    VARCHAR(100),
    dx_operativo                 TEXT,
    trastorno                    TEXT,
    px                           JSONB NOT NULL DEFAULT '[]',
    f1                           TEXT,
    f2                           TEXT,
    oss                          TEXT,
    adherencia                   TEXT,
    cumplimiento                 TEXT,
    rss                          TEXT,
    eff                          TEXT,
    notas                        TEXT,
    observaciones_proxima_sesion TEXT,
    situacion                    TEXT,
    duracion_audio               VARCHAR(20),
    status                       VARCHAR(10) NOT NULL DEFAULT 'borrador',
    creado_por_id                VARCHAR(36) REFERENCES terapeutas(id),
    created_at                   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at                   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
                   WHERE c.conname = 'ck_sesiones_status' AND t.relname = 'sesiones') THEN
        ALTER TABLE sesiones ADD CONSTRAINT ck_sesiones_status CHECK (status IN ('borrador','validado'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
                   WHERE c.conname = 'ux_sesiones_expediente_numero' AND t.relname = 'sesiones') THEN
        ALTER TABLE sesiones ADD CONSTRAINT ux_sesiones_expediente_numero UNIQUE (expediente_id, numero);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_sesiones_expediente ON sesiones (expediente_id);

-- 4. Índices de soporte a FKs (PostgreSQL no los crea automáticamente) ---------
CREATE INDEX IF NOT EXISTS idx_notas_evolucion_expediente ON notas_evolucion (expediente_id);
CREATE INDEX IF NOT EXISTS idx_consentimientos_paciente  ON consentimientos_informados (paciente_id);
CREATE INDEX IF NOT EXISTS idx_citas_expediente           ON citas (expediente_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_creado_por       ON sesiones (creado_por_id);
CREATE INDEX IF NOT EXISTS idx_expedientes_terapeuta     ON expedientes_clinicos (terapeuta_asignado_id);

-- 5. CHECK risk_level en pacientes (V3 no lo tenía) ----------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
                   WHERE c.conname = 'ck_pacientes_risk_level' AND t.relname = 'pacientes') THEN
        ALTER TABLE pacientes ADD CONSTRAINT ck_pacientes_risk_level CHECK (risk_level IN ('bajo','medio','alto'));
    END IF;
END $$;

-- 6. Semilla: extender expedientes existentes ----------------------------------
UPDATE expedientes_clinicos SET
    folio = 'EXP-0001', fecha_inicio = '2026-08-10', modalidad = 'presencial',
    descripcion = 'Bloqueo fóbico en situaciones de examen y alta autoexigencia académica.',
    trastorno_estrategico = 'Fobia de rendimiento / Ansiedad de ejecución',
    primera_aparicion = 'Hace 6 meses tras periodo de alta exigencia académica.',
    factores_precipitantes = 'Evaluaciones finales y crítica del entorno escolar.',
    tipo_evolucion = 'progresivo', spr_inicial = 'Percepción de peligro inminente ante la evaluación.',
    valoracion_cambio_inicial = 'Marcador de inicio', valoracion_global_inicial = 'Marcador de inicio',
    objetivo_paciente = 'Rendir exámenes sin bloqueo.'
WHERE id = 'exp-001';

UPDATE expedientes_clinicos SET
    folio = 'EXP-0002', fecha_inicio = '2026-08-12', modalidad = 'online',
    descripcion = 'Crisis de pánico con agorafobia incipiente en transporte público.',
    trastorno_estrategico = 'Trastorno de Pánico con Agorafobia',
    primera_aparicion = 'Hace 3 meses tras periodo de alto estrés laboral.',
    factores_precipitantes = 'Discusión con superior y desvelo prolongado.',
    tipo_evolucion = 'episódico', spr_inicial = 'Marcador de inicio',
    valoracion_cambio_inicial = 'Marcador de inicio', valoracion_global_inicial = 'Marcador de inicio',
    objetivo_paciente = 'Usar transporte público sin compañía.'
WHERE id = 'exp-002';

-- 7. Semilla: expedientes nuevos (pac-003, pac-004) ----------------------------
INSERT INTO expedientes_clinicos (id, paciente_id, terapeuta_asignado_id, motivo_consulta, intentos_solucion,
    objetivo_terapeutico, diagnostico_operativo, estatus_expediente, folio, fecha_inicio, modalidad,
    descripcion, trastorno_estrategico, tipo_evolucion, spr_inicial, valoracion_cambio_inicial,
    valoracion_global_inicial, objetivo_paciente)
VALUES
    ('exp-003', 'pac-003', 'ter-002', 'Ansiedad ante evaluaciones universitarias.',
     'Evitación y solicitud de cambio de fechas.', 'Extinguir la evitación fóbica.', 'SPR Fóbico',
     'ACTIVO', 'EXP-0003', '2026-08-20', 'presencial', 'Bloqueo en exposiciones orales.',
     'Fobia de rendimiento', 'progresivo', 'Marcador de inicio', 'Marcador de inicio', 'Marcador de inicio',
     'Exponer sin bloqueo.'),
    ('exp-004', 'pac-004', 'ter-002', 'Problemas de pareja y comunicación destructiva.',
     'Discusiones recurrentes y evitación del diálogo.', 'Interrumpir el patrón de escalada.', 'Conflicto de pareja',
     'EN_TRATAMIENTO', 'EXP-0004', '2026-08-15', 'presencial', 'Patrón de escalada simétrica.',
     'Conflicto de pareja', 'crónico', 'Marcador de inicio', 'Marcador de inicio', 'Marcador de inicio',
     'Comunicación asertiva.')
ON CONFLICT (id) DO NOTHING;

-- 8. Semilla: sesiones (pac-001 y pac-002) -------------------------------------
INSERT INTO sesiones (id, expediente_id, numero, fecha, fase, protocolo, dx_operativo, px, f1, f2, oss,
    adherencia, rss, eff, notas, observaciones_proxima_sesion, situacion, status, creado_por_id)
VALUES
    ('ses-001', 'exp-001', 1, '2026-08-10', 'Definición del problema', 'Fobia de rendimiento', 'SPR Fóbico',
     '["Cómo empeorar","Bitácora de la peor fantasía"]', 'Redefinición del control', 'Evitación que confirma el peligro',
     'Alta receptividad.', '100%', 'Mejoría leve', 'Impacto positivo', 'Registro redujo la crisis de 20 a 5 min.',
     'Profundizar en la maniobra del cómo empeorar.', 'Estable', 'validado', 'ter-001'),
    ('ses-002', 'exp-001', 2, '2026-08-17', 'Intervención Estratégica', 'Fobia de rendimiento', 'SPR Fóbico',
     '["Prescripción de la peor fantasía"]', 'Extinción del control', 'Reestructuración analógica',
     'Aplicó la prescripción.', '90%', 'Disminución de la angustia', 'Desarticulación gradual',
     'Paciente refiere menor anticipación.', 'Revisar bitácora.', 'En proceso', 'validado', 'ter-001'),
    ('ses-003', 'exp-002', 1, '2026-08-12', 'Definición del problema', 'Ataque de Pánico', 'SPR Fóbico',
     '["Diario de abordo"]', 'Quien busca el control lo pierde', 'Evitación que confirma el peligro',
     'Se identificó la solución intentada.', '100%', 'Mejoría leve', 'Externalización efectiva',
     'Reducción de duración de crisis.', 'Maniobra del cómo empeorar.', 'Estable', 'validado', 'ter-001'),
    ('ses-004', 'exp-002', 2, '2026-08-19', 'Intervención Estratégica', 'Ataque de Pánico', 'SPR Fóbico',
     '["Cómo empeorar"]', 'Paradoja del control', 'Desactivación del intento de control',
     'Buena adherencia.', '90%', 'Mejoría significativa', 'Desaparición gradual de la evitación',
     'Solicita compañía con menor frecuencia.', 'Confrontación en transporte.', 'En proceso', 'borrador', 'ter-001')
ON CONFLICT (id) DO NOTHING;

-- 9. Semilla: consentimiento histórico (pac-001, para demostrar auditoría) -----
INSERT INTO consentimientos_informados (id, paciente_id, tipo_consentimiento, firmado_por, calidad_firmante,
    fecha_firma, revocado)
VALUES
    ('con-001', 'pac-001', 'TRATAMIENTO_MENOR', 'Claudia Santos', 'PERSONA_DE_APOYO', CURRENT_TIMESTAMP, FALSE)
ON CONFLICT (id) DO NOTHING;
```

> Nota: el seed de textos clínicos se basa en la demo React (`mockData.ts`/`ClinicalRecord.tsx`) pero mapeado a los registros reales `pac-001…pac-004`. No se replican ids/nombres del mock (`patient-1` "Sofía Martínez", "Dr. Alejandro Silva").

---

## 3. Spring Boot: Controllers REST, DTOs, Mappers y Services

Estructura hexagonal nueva en `com.syborx.brevemente.expediente` (espejo de `paciente`).

### 3.1 Estructura de paquetes
```
com.syborx.brevemente.expediente
├── domain
│   ├── model        → Expediente, Sesion, Consentimiento
│   └── exception    → ExpedienteNotFoundException, ConsentimientoYaFirmadoException, SesionInvalidaException
├── application
│   ├── ports
│   │   ├── in       → ObtenerExpedienteUseCase, ListarSesionesUseCase,
│   │   │              AgregarSesionUseCase, FirmarConsentimientoUseCase
│   │   └── out      → ExpedienteRepositoryPort, SesionRepositoryPort,
│   │                  ConsentimientoRepositoryPort, PacienteConsentimientoEscrituraPort
│   └── service      → ExpedienteApplicationService, SesionApplicationService, ConsentimientoApplicationService
└── infrastructure
    └── adapters
        ├── in/rest  → ExpedienteRestController, ConsentimientoRestController,
        │              dto/*, mapper/*, advice/ExpedienteExceptionHandler
        └── out/persistence → entity/*, repository/*, mapper/*,
                               ExpedientePersistenceAdapter, SesionPersistenceAdapter,
                               ConsentimientoPersistenceAdapter, PacienteConsentimientoEscrituraAdapter
```

### 3.2 Controllers REST

| Endpoint | Método | Autoridad | Respuesta / Errores |
| :--- | :--- | :--- | :--- |
| `/expedientes/paciente/{pacienteId}` | GET | `hasAuthority('EXPEDIENTE_LEER')` | 200 `ExpedienteResponseDTO` · 404 |
| `/expedientes/paciente/{pacienteId}/sesiones` | GET | `hasAuthority('EXPEDIENTE_LEER')` | 200 `SesionResponseDTO[]` · 404 |
| `/expedientes/paciente/{pacienteId}/sesiones` | POST | `hasAuthority('EXPEDIENTE_ESCRIBIR')` | 201 `SesionResponseDTO` · 400 · 404 |
| `/pacientes/{pacienteId}/consentimiento/firmar` | POST | `hasAuthority('EXPEDIENTE_FIRMAR')` | 204 · 404 · 409 |

> **Firma en ruta unificada** (`/pacientes/...`, muta `pacientes`, coincide con `sdd-agenda.md`). Se expone en `ConsentimientoRestController` del módulo `expediente` con `@RequestMapping("/pacientes")` para no forzar un controller con base `/expedientes`.

**`ExpedienteExceptionHandler`** = `@RestControllerAdvice(basePackages = "com.syborx.brevemente.expediente")`:
- `404 ExpedienteNotFoundException` (expediente/paciente no encontrado).
- `409 ConsentimientoYaFirmadoException` (firma duplicada).
- `400 SesionInvalidaException` (validación de sesión: número de sesión, campos obligatorios).

### 3.3 DTOs (camelCase, alineados con el frontend)
| DTO | Campos clave |
| :--- | :--- |
| `ExpedienteResponseDTO` | `patientId`, `patientName` (join), `folio`, `startDate`, `age` (join), `therapistName` (join), `status`, `riskLevel` (join), `modality`, `motif`, `description`, `trastornoEstrategico`, `firstAppearance`, `precipitatingFactors`, `evolutionType`, `dxOpInicial`, `sprInicial`, `valoracionCambioInicial`, `valoracionGlobalInicial`, `objectivePatient`, `objectiveTherapist` |
| `SesionResponseDTO` | `id`, `patientId` (join), `number`, `date`, `phase`, `protocol`, `dxOp`, `trastorno`, `px`, `f1`, `f2`, `oss`, `add`, `cumplimiento`, `rss`, `eff`, `notes`, `observationsNextSession`, `situation`, `audioDuration`, `status` |
| `SesionCreateRequest` | `number`, `date`, `phase`, `protocol`, `dxOp`, `trastorno?`, `px[]`, `f1`, `f2`, `oss`, `add`, `cumplimiento?`, `rss`, `eff`, `notes`, `observationsNextSession`, `situation`, `audioDuration?` (el `status` inicia en `borrador`) |

> La firma (`POST .../consentimiento/firmar`) devuelve **204 No Content** con body vacío `{}`; `firmadoPor`, `calidadFirmante` y `tipoConsentimiento` se **derivan en backend** (JWT + `representante` del paciente + regla de minoría de edad). El adapter Angular mapea a `true`.
>
> `SesionResponseDTO.patientId` se resuelve por **doble join**: `sesiones.expediente_id → expedientes_clinicos.paciente_id` (no existe columna directa en `sesiones`).

### 3.4 Mappers
- `ExpedienteRestMapper`: `Expediente` + joins → `ExpedienteResponseDTO` (compone `patientName`/`age`/`therapistName`/`riskLevel` desde paciente/terapeuta; traducción snake_case→camelCase según gap report §7.2).
- `SesionRestMapper`: `Sesion → SesionResponseDTO` y `SesionCreateRequest → Sesion`.
- `ExpedientePersistenceMapper` / `SesionPersistenceMapper` / `ConsentimientoPersistenceMapper`: `*JpaEntity ↔ *` (nota: `add` TS ↔ `adherencia` DB; `px` ↔ JSONB).

### 3.5 Services (lógica central)
**`ExpedienteApplicationService`** — `obtenerExpediente(pacienteId)`:
1. Busca expediente por `paciente_id` (índice `ux_expedientes_paciente`); si no existe → `ExpedienteNotFoundException`.
2. Devuelve el expediente con joins (paciente/terapeuta) para el mapper.

**`SesionApplicationService`** — `listarSesiones(pacienteId)` y `agregarSesion(pacienteId, sesion)`:
1. Resuelve el expediente por `paciente_id` (404 si no existe).
2. `agregarSesion`: valida número de sesión secuencial y campos obligatorios (`SesionInvalidaException` 400); asigna `id` determinista/aleatorio, `status = 'borrador'`, `px` default `[]`.
3. Persiste en `sesiones` (`UNIQUE(expediente_id, numero)` protege duplicados).

**`ConsentimientoApplicationService`** — `firmarConsentimiento(pacienteId)`:
1. Si el paciente ya tiene `consentimiento_representante_firmado = TRUE` → `ConsentimientoYaFirmadoException` (409).
2. Deriva server-side (sin request DTO): `firmadoPor` (nombre del representante, o usuario autenticado si es titular), `calidadFirmante` (`PERSONA_DE_APOYO` | `TITULAR`), `tipoConsentimiento` (p. ej. `TRATAMIENTO_MENOR`) y `fechaDeterminacion = now()`.
3. Vía `PacienteConsentimientoEscrituraPort.firmar(pacienteId, fechaDeterminacion)`: marca `consentimiento_representante_firmado = TRUE` y actualiza `fecha_determinacion_consentimiento` en `pacientes`.
4. Inserta la fila de auditoría en `consentimientos_informados` (`tipo_consentimiento`, `firmado_por`, `calidad_firmante`, `fecha_firma`).
5. **Efecto** (GAP-EXP-04): la agenda deja de bloquear nuevas citas y la UI habilita "Confirmar" (nota: `CitaApplicationService.listar` no recalcula `bloqueada_por_normativa`; las citas ya persistidas conservan el flag hasta re-agendarse).

**`PacienteConsentimientoEscrituraPort`** (out, cross-module): método `firmar(String pacienteId, LocalDate fechaDeterminacion)`. Su adapter (`PacienteConsentimientoEscrituraAdapter`, en `expediente/infrastructure/.../out/persistence`) inyecta `PacienteRepositoryPort` (módulo `paciente`) para: (1) localizar al paciente — si `findById` está vacío lanza `ExpedienteNotFoundException` (no propaga `PacienteNotFoundException`), (2) reconstruir `CapacidadConsentimiento` con la nueva `fechaDeterminacion`, (3) marcar `consentimiento_representante_firmado = TRUE` y guardar. Es lectura+escritura (a diferencia del `PacienteConsentimientoAdapter` de `cita`, que es solo lectura).

### 3.6 Cambios en el módulo `paciente`
- **Ninguno** en entidades/DTOs. Solo se consume `PacienteRepositoryPort` desde `expediente` (patrón cita→paciente).
- ⚠️ El adapter de escritura **no propaga** `PacienteNotFoundException` (cuyo `PacienteExceptionHandler` es global sin `basePackages`): convierte el `findById` vacío en `ExpedienteNotFoundException` para que el 404 lo maneje `ExpedienteExceptionHandler` (scoped) con body consistente.

---

## 4. Angular: `ExpedienteHttpAdapter` (patrón `LoginHttpAdapter`)

> Nota: el usuario pidió "la clase loginHttpAdapter"; para Expedientes la clase es `ExpedienteHttpAdapter`, que sigue el **mismo patrón** de `LoginHttpAdapter`/`AgendaHttpAdapter` (`@Injectable`, `HttpClient`, `baseUrl` desde `environment`, mapeo tipado). Se corrigen los mismatches M1–M4 de la auditoría de integración.

### 4.1 Cambios de activación
- `environments/environment.ts`: `features.expedienteClinicoBackend: true` (dev). `VALID_PERMISSIONS` **ya incluye** `EXPEDIENTE_LEER/ESCRIBIR/FIRMAR` (sin cambios).
- Eliminar `expediente-localstorage.adapter.ts` (mock) al cablear el HTTP adapter.

### 4.2 Clase `ExpedienteHttpAdapter` (estructura final)
```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ExpedienteRepository } from '../ports/expediente.repository';
import { ClinicalRecord, Patient, Session } from '../../../core/types/clinical.types';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ExpedienteHttpAdapter implements ExpedienteRepository {
  private readonly base = environment.apiBaseUrl;          // M2: no hardcodear /api/v1

  constructor(private readonly http: HttpClient) {}

  obtenerPaciente(pacienteId: string): Observable<Patient | null> {
    return this.http.get<Patient>(`${this.base}/pacientes/${pacienteId}`)
      .pipe(catchError(() => of(null)));                    // M3: 404 → null
  }

  obtenerExpediente(pacienteId: string): Observable<ClinicalRecord | null> {
    return this.http.get<ClinicalRecord>(`${this.base}/expedientes/paciente/${pacienteId}`)
      .pipe(catchError(() => of(null)));                    // M3: 404 → null
  }

  obtenerSesiones(pacienteId: string): Observable<Session[]> {
    return this.http.get<Session[]>(`${this.base}/expedientes/paciente/${pacienteId}/sesiones`)
      .pipe(catchError(() => of([])));                     // 404 → lista vacía
  }

  agregarSesion(pacienteId: string, sesion: Omit<Session, 'id'>): Observable<Session> {
    return this.http.post<Session>(`${this.base}/expedientes/paciente/${pacienteId}/sesiones`, sesion); // 201
  }

  firmarConsentimiento(pacienteId: string): Observable<boolean> {
    return this.http.post<void>(`${this.base}/pacientes/${pacienteId}/consentimiento/firmar`, {})
      .pipe(map(() => true));                               // M1 + M4: ruta unificada; 204 → true; body {} (datos derivados en backend)
  }
}
```

> **Estado actual vs estado objetivo**: este es el estado objetivo; el `expediente-http.adapter.ts` real aún hardcodea `/api/v1`, no usa `catchError`/`map` y la firma apunta a `/expedientes/paciente/...`. Se aplicará en `demo-gap-implementation` (Regla de Oro: no se escribe código en esta fase).

### 4.3 Alineación con el puerto (sin cambios en la firma)
`ExpedienteRepository` conserva sus 5 métodos; solo cambia la implementación del adapter (rutas, `baseUrl`, `catchError`, `map`). El fallback del componente (`pacienteId = 'patient-1'`) debe alinearse a slugs reales (`pac-001`) o navegar siempre con el id de la BD (M6).
- ⚠️ **Dependencia de permisos (M5)**: la pantalla requiere **`PACIENTES_LEER` + `EXPEDIENTE_LEER`** (el `obtenerPaciente` usa `GET /pacientes/{id}` protegido con `PACIENTES_LEER`; los demás con `EXPEDIENTE_*`). En V5 los roles clínicos tienen ambos; documentar para no romper la carga del banner de paciente.

---

## 5. Aceptación (Gate #1)

Este SDD queda listo para `demo-gap-implementation` cuando se aprueben:
1. El consecutivo `V7` y el script SQL de la §2 (12 columnas + tabla `sesiones` + índices + seed).
2. El contrato REST §3.2 (4 endpoints, autorización `EXPEDIENTE_*`, firma en ruta unificada).
3. La firma del `ExpedienteRepository` (sin cambios) y la estructura de `ExpedienteHttpAdapter` §4.

> Fuente de verdad: `docs/gap-analysis/gap-report-expedientes.md` (10 GAPs + §7 contrato de integración). Auditorías: `jarvis-database` ✅, `jarvis-backend` ✅, `jarvis-frontend` ✅ (2 rondas), integración final ✅.
>
> **Fase futura (fuera de este SDD)**: tab `contrareferencia` + banner "Paciente contra-referido" + modo solo lectura (decisión de negocio 2026-10-07; requerirá su propia migración `V8`, entidad `contrareferencias`, permisos nuevos y enforcement de solo-lectura en backend).
