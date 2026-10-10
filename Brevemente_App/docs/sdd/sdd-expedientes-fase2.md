# SDD-EXP-F2: Software Design Document — Módulo Expedientes FASE 2 (Dominios clínicos complementarios)

- **Módulos**: `expediente` (extensión) + `auditoria`, `pago`, `supervision`, `constancia` (nuevos) / `expediente-clinico`, `supervision` (frontend)
- **Código SDD**: `SDD-EXP-F2`
- **Versión**: 1.0.0
- **Fecha**: 2026-10-08
- **Estado**: BORRADOR — pendiente de aprobación (Gate #1)
- **Fuente de verdad**: `docs/gap-analysis/gap-report-expedientes_Fase2.md` (validado en 3 rondas por `jarvis-database` y `jarvis-backend`: sin bloqueantes 🔴/🟠)
- **Predecesor**: `sdd-expedientes.md` (SDD-EXP, Fase 1 — ya implementado)
- **Alineación**: ADR-001 (Hexagonal/SDOP), ADR-002 (Dual Adapters), ADR-003 (Flyway)

> **Regla de Oro**: integrar vía adaptador/puerto, reutilizando/adaptando lo existente. El HTML/SCSS de la demo React es la **fuente de verdad visual a portar** tal cual (regla del calendario). No se escribe código fuente en esta fase; este documento es la especificación.

---

## 0. Propósito y alcance

Completar el dominio **Expedientes** con los dominios clínicos que la demo React ya cubre y que hoy son placeholders en el frontend Angular: **psiquiatría**, **pagos**, **auditoría clínica**, **supervisión** (bitácoras + solicitudes), **constancias físicas** y las valoraciones por sesión **VC/VG**.

**Fuera del alcance (fase futura, decisión 2026-10-07)**: tab `contrareferencia`, `crisisHistory` y reconsentimiento autónomo al cumplir 18. Modelos documentados en el gap report §4.7 para no perderlos.

**Sin backend nuevo (ya cubierto por Fase 1)**: sub-tab RST (deriva de `sesiones.f1`/`f2`), DX estratégico, sesiones, consentimiento.

---

## 1. Plan de Reutilización: Entidades JPA y DTOs a extender

### 1.1 Reutilizar sin cambios
| Componente | Ubicación | Uso |
| :--- | :--- | :--- |
| Módulo `expediente` (Fase 1) | `com.syborx.brevemente.expediente` | Plantilla de estructura hexagonal para los 4 módulos nuevos |
| `AuditoriaAccesoPort` + `AuditoriaAccesoAdapter` (auth) | `com.syborx.brevemente.auth` | **Plantilla** del puerto de auditoría clínica (`REQUIRES_NEW`, append-only) |
| Permisos `EXPEDIENTE_*`, `SUPERVISION_*` (V5) | perm-005/006/007/009/010 | `@PreAuthorize` |
| Frontend módulo `supervision` (Angular) | `modules/supervision` | Puertos/adapters/componente ya existen; alinear contrato HTTP |
| Tipos Angular `Payment`, `SupervisionLog` | `core/types/clinical.types.ts` | Ya idénticos a la demo; reutilizar |

### 1.2 Entidades JPA a EXTENDER (módulo `expediente`)
| Entidad | Cambio |
| :--- | :--- |
| `ExpedienteJpaEntity` | +10 columnas psiquiatría + `esquemaFarmacologico` (JSONB) |
| `SesionJpaEntity` | +`valoracionCambio` (JSONB), `valoracionGlobal` (JSONB) |
| `ExpedientePersistenceMapper` | +`toJpaEntity` (hoy solo `toDomain`) |
| `ExpedienteRepositoryPort` | +`save`/`update` (hoy solo `findByPacienteId`) |

### 1.3 Entidades JPA NUEVAS
| Entidad | Tabla | Notas |
| :--- | :--- | :--- |
| `AuditoriaExpedienteJpaEntity` | `auditoria_expediente` | Append-only |
| `PagoJpaEntity` | `pagos` | `registradoPorId` → FK `usuarios` |
| `SupervisionBitacoraJpaEntity` | `supervision_bitacoras` | `px` TEXT, `terapeutaId` → FK `terapeutas` |
| `SupervisionSolicitudJpaEntity` | `supervision_solicitudes` | `solicitanteId` → FK `usuarios`; `terapeutaId` → FK `terapeutas` NULL |
| `ConstanciaFisicaJpaEntity` | `constancias_fisicas` | `registradoPorId` → FK `usuarios` |

### 1.4 Tipos frontend a AÑADIR (`core/types/clinical.types.ts`)
- `AuditLog`, `SupervisionRequest`, `PhysicalCertificateLog`, `CounterReferral` (diferido), `CrisisIncident` (diferido), `VcEntry`, `VgEntry`, `Drug`.
- Unión `Permission` +`PAGOS_LEER`, `PAGOS_GESTIONAR`, `CONSTANCIAS_EMITIR`, `SUPERVISION_REGISTRAR`.
- Flags `environment.ts`: `supervisionBackend: true`, `pagosBackend: true`, `constanciasBackend: true`, `auditoriaBackend: true`.

### 1.5 Puertos/adaptadores a REUTILIZAR como patrón
- **`AuditoriaAccesoAdapter` (auth)**: plantilla del nuevo `AuditoriaExpedientePort` (escritura `REQUIRES_NEW` que sobrevive rollbacks).
- **`ExpedienteExceptionHandler`** (scoped): plantilla de los `*ExceptionHandler` de los módulos nuevos (`basePackages` propio por módulo).
- **`PacienteConsentimientoEscrituraAdapter`** (Fase 1): patrón de puerto de salida cross-module sin acoplar.

---

## 2. Migración Flyway: `V8__introduce_expediente_fase2.sql`

- **Consecutivo oficial**: `V8` (sucede a `V1…V7`; V6 sembró `perm-017`/`perm-018`).
- **Ubicación**: `Brevemente_App/backend/src/main/resources/db/migration/V8__introduce_expediente_fase2.sql`.
- **Propiedades**: inmutable, idempotente (`ADD COLUMN IF NOT EXISTS`, `CREATE TABLE/INDEX IF NOT EXISTS`, `DO $$` para CHECKs/FKs sobre tablas existentes, seed con `ON CONFLICT`).

```sql
-- =============================================================================
-- Migración V8: Expedientes Fase 2 (SDOP) — SDD-EXP-F2 v1.0.0
-- Sucede a V1..V7. Idempotente.
-- =============================================================================

-- 1. Psiquiatría en expedientes_clinicos --------------------------------------
ALTER TABLE expedientes_clinicos
    ADD COLUMN IF NOT EXISTS dx_nosologico           TEXT,
    ADD COLUMN IF NOT EXISTS dsm5                    TEXT,
    ADD COLUMN IF NOT EXISTS cie11                   TEXT,
    ADD COLUMN IF NOT EXISTS comorbilidad            TEXT,
    ADD COLUMN IF NOT EXISTS diagnostico_diferencial TEXT,
    ADD COLUMN IF NOT EXISTS plan_tratamiento        TEXT,
    ADD COLUMN IF NOT EXISTS pronostico              VARCHAR(20),
    ADD COLUMN IF NOT EXISTS factores_favorables     TEXT,
    ADD COLUMN IF NOT EXISTS factores_desfavorables  TEXT,
    ADD COLUMN IF NOT EXISTS uso_farmacos            VARCHAR(15),
    ADD COLUMN IF NOT EXISTS esquema_farmacologico   JSONB NOT NULL DEFAULT '[]';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
                   WHERE c.conname = 'ck_expedientes_pronostico' AND t.relname = 'expedientes_clinicos') THEN
        ALTER TABLE expedientes_clinicos ADD CONSTRAINT ck_expedientes_pronostico
            CHECK (pronostico IS NULL OR pronostico IN ('excelente','bueno','reservado','malo'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
                   WHERE c.conname = 'ck_expedientes_uso_farmacos' AND t.relname = 'expedientes_clinicos') THEN
        ALTER TABLE expedientes_clinicos ADD CONSTRAINT ck_expedientes_uso_farmacos
            CHECK (uso_farmacos IS NULL OR uso_farmacos IN ('SI','NO','ESPECIFICAR'));
    END IF;
END $$;

-- 2. VC/VG por sesión (JSONB) --------------------------------------------------
ALTER TABLE sesiones
    ADD COLUMN IF NOT EXISTS valoracion_cambio  JSONB,
    ADD COLUMN IF NOT EXISTS valoracion_global  JSONB;

-- 3. Pagos ----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pagos (
    id                VARCHAR(36) PRIMARY KEY,
    paciente_id       VARCHAR(36) NOT NULL REFERENCES pacientes(id),
    cita_id           VARCHAR(36) REFERENCES citas(id),
    concepto          TEXT NOT NULL,
    monto             NUMERIC(10,2) NOT NULL,
    fecha             DATE NOT NULL,
    metodo            VARCHAR(20) NOT NULL,
    estado            VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    notas             TEXT,
    registrado_por_id VARCHAR(36) REFERENCES usuarios(id),
    created_at        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_pagos_metodo CHECK (metodo IN ('efectivo','transferencia','tarjeta','otro')),
    CONSTRAINT ck_pagos_estado CHECK (estado IN ('pagado','pendiente','parcial','reembolsado')),
    CONSTRAINT ck_pagos_monto  CHECK (monto >= 0)
);
CREATE INDEX IF NOT EXISTS idx_pagos_paciente     ON pagos (paciente_id);
CREATE INDEX IF NOT EXISTS idx_pagos_cita         ON pagos (cita_id);
CREATE INDEX IF NOT EXISTS idx_pagos_registrado   ON pagos (registrado_por_id);

-- 4. Auditoría clínica del expediente (append-only) ---------------------------
CREATE TABLE IF NOT EXISTS auditoria_expediente (
    id          VARCHAR(36) PRIMARY KEY,
    paciente_id VARCHAR(36) NOT NULL REFERENCES pacientes(id),
    usuario_id  VARCHAR(36) REFERENCES usuarios(id),
    accion      VARCHAR(100) NOT NULL,
    detalle     TEXT,
    categoria   VARCHAR(20) NOT NULL,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_auditoria_exp_categoria CHECK (categoria IN
        ('expediente','sesion','ia','reporte','seguridad','riesgo','pagos'))
);
CREATE INDEX IF NOT EXISTS idx_auditoria_exp_paciente ON auditoria_expediente (paciente_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_exp_usuario  ON auditoria_expediente (usuario_id);

-- 5. Supervisión: bitácoras ----------------------------------------------------
CREATE TABLE IF NOT EXISTS supervision_bitacoras (
    id                   VARCHAR(36) PRIMARY KEY,
    paciente_id          VARCHAR(36) NOT NULL REFERENCES pacientes(id),
    terapeuta_id         VARCHAR(36) REFERENCES terapeutas(id),
    fecha                DATE,
    numero_sesion        INT,
    supervisor_nombre    VARCHAR(200),
    supervisor_cedula    VARCHAR(50),
    definicion_problema  TEXT,
    situacion_actual     TEXT,
    spr                  TEXT,
    ts                   TEXT,
    problema_terapeuta   TEXT,
    rst                  TEXT,
    px                   TEXT,
    eff                  TEXT,
    duda                 TEXT,
    bloqueo              TEXT,
    observaciones        TEXT,
    recomendaciones      TEXT,
    created_at           TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_supervision_paciente  ON supervision_bitacoras (paciente_id);
CREATE INDEX IF NOT EXISTS idx_supervision_terapeuta ON supervision_bitacoras (terapeuta_id);

-- 6. Supervisión: solicitudes --------------------------------------------------
CREATE TABLE IF NOT EXISTS supervision_solicitudes (
    id                VARCHAR(36) PRIMARY KEY,
    paciente_id       VARCHAR(36) NOT NULL REFERENCES pacientes(id),
    solicitante_id    VARCHAR(36) NOT NULL REFERENCES usuarios(id),
    terapeuta_id      VARCHAR(36) REFERENCES terapeutas(id),
    motivo            TEXT,
    estado            VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    created_at        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    atendido_por_id   VARCHAR(36) REFERENCES usuarios(id),
    atendido_at       TIMESTAMP WITH TIME ZONE,
    CONSTRAINT ck_supervision_solicitud_estado CHECK (estado IN ('pendiente','atendida'))
);
CREATE INDEX IF NOT EXISTS idx_supervision_solicitudes_paciente    ON supervision_solicitudes (paciente_id);
CREATE INDEX IF NOT EXISTS idx_supervision_solicitudes_solicitante ON supervision_solicitudes (solicitante_id);
CREATE INDEX IF NOT EXISTS idx_supervision_solicitudes_terapeuta   ON supervision_solicitudes (terapeuta_id);
CREATE INDEX IF NOT EXISTS idx_supervision_solicitudes_atendido    ON supervision_solicitudes (atendido_por_id);

-- 7. Constancias físicas --------------------------------------------------------
CREATE TABLE IF NOT EXISTS constancias_fisicas (
    id                     VARCHAR(36) PRIMARY KEY,
    paciente_id            VARCHAR(36) NOT NULL REFERENCES pacientes(id),
    folio_fisico           VARCHAR(50),
    fecha_expedicion       DATE,
    tipo                   VARCHAR(20) NOT NULL,
    emisor_nombre          VARCHAR(200),
    emisor_cedula          VARCHAR(50),
    destinatario           TEXT,
    motivo                 TEXT,
    periodo_cubierto       TEXT,
    num_sesiones           INT,
    resumen_clinico        TEXT,
    url_escaneo            TEXT,
    nombre_archivo_escaneo VARCHAR(255),
    entregado_a            TEXT,
    estado                 VARCHAR(20) NOT NULL DEFAULT 'entregada_en_fisico',
    registrado_por_id      VARCHAR(36) REFERENCES usuarios(id),
    registrado_at          TIMESTAMP WITH TIME ZONE,
    created_at             TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_constancias_tipo   CHECK (tipo IN
        ('psicoterapeutica','psiquiatrica','asistencia','informe_pericial','justificante')),
    CONSTRAINT ck_constancias_estado CHECK (estado IN ('entregada_en_fisico','anulada'))
);
CREATE INDEX IF NOT EXISTS idx_constancias_paciente    ON constancias_fisicas (paciente_id);
CREATE INDEX IF NOT EXISTS idx_constancias_registrado  ON constancias_fisicas (registrado_por_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_constancias_folio ON constancias_fisicas (folio_fisico)
    WHERE folio_fisico IS NOT NULL;

-- 8. Permisos nuevos -----------------------------------------------------------
INSERT INTO permisos (id, codigo, modulo, descripcion) VALUES
    ('perm-019','PAGOS_LEER',            'PAGOS',       'Consultar el historial de pagos de los pacientes'),
    ('perm-020','PAGOS_GESTIONAR',       'PAGOS',       'Registrar, modificar y eliminar pagos'),
    ('perm-021','CONSTANCIAS_EMITIR',    'CONSTANCIAS', 'Registrar y anular constancias físicas'),
    ('perm-022','SUPERVISION_REGISTRAR', 'SUPERVISION', 'Registrar y eliminar sus propias bitácoras de supervisión')
ON CONFLICT (codigo) DO NOTHING;

-- Asignación (ids de rol verificados en V5/V6: rol-001 admin_platform,
-- rol-002 admin_clinical, rol-003 therapist, rol-004 assistant, rol-005 supervisor)
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permisos p
WHERE (r.id = 'rol-003' AND p.codigo IN ('PAGOS_LEER','PAGOS_GESTIONAR','CONSTANCIAS_EMITIR','SUPERVISION_REGISTRAR'))
   OR (r.id = 'rol-001' AND p.codigo IN ('PAGOS_LEER','PAGOS_GESTIONAR','CONSTANCIAS_EMITIR'))
   OR (r.id = 'rol-002' AND p.codigo IN ('PAGOS_LEER','PAGOS_GESTIONAR','CONSTANCIAS_EMITIR'))
   OR (r.id = 'rol-004' AND p.codigo IN ('PAGOS_LEER','PAGOS_GESTIONAR'))
   OR (r.id = 'rol-005' AND p.codigo = 'PAGOS_LEER')
ON CONFLICT (rol_id, permiso_id) DO NOTHING;

-- El terapeuta (rol-003) necesita ver sus propias bitácoras (SUPERVISION_LEER)
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT 'rol-003', id FROM permisos WHERE codigo = 'SUPERVISION_LEER'
ON CONFLICT (rol_id, permiso_id) DO NOTHING;

-- 9. Semilla: psiquiatría sobre exp-002 (pac-002, adulta, Trastorno de Pánico) -
UPDATE expedientes_clinicos SET
    dx_nosologico          = 'Trastorno de Pánico [F41.0]',
    dsm5                   = '300.01 Trastorno de Pánico',
    cie11                  = '6B01 Trastorno de Pánico',
    pronostico             = 'bueno',
    plan_tratamiento       = 'Monitoreo de fármacos y co-tratamiento psicoterapéutico.',
    uso_farmacos           = 'SI',
    esquema_farmacologico  = '[{"id":"drug-1","name":"Sertralina 50mg","doseMorning":"1 tableta","doseAfternoon":"0","doseNight":"0","eff":"Bueno","notes":"Ligera cefalea los primeros días."},{"id":"drug-2","name":"Alprazolam 0.25mg","doseMorning":"0","doseAfternoon":"0","doseNight":"1 tableta","eff":"Excelente inductor de sueño","notes":"Uso condicionado a crisis agudas."}]'::jsonb
WHERE id = 'exp-002';

-- 10. Semilla: VC/VG por sesión (ses-001, ses-002) ------------------------------
UPDATE sesiones SET
    valoracion_cambio = '{"sessionNum":1,"percepcion":"Marcador de inicio","pensamientos":"Marcador de inicio","sensaciones":"Marcador de inicio","reacciones":"Marcador de inicio","sintomas":"Marcador de inicio","crisis":"Marcador de inicio"}'::jsonb,
    valoracion_global = '{"sessionNum":1,"yo":true,"demas":false,"mundo":false}'::jsonb
WHERE id = 'ses-001';

UPDATE sesiones SET
    valoracion_cambio = '{"sessionNum":2,"percepcion":"Mejoría leve","pensamientos":"Sin cambios","sensaciones":"Mejoría leve","reacciones":"Mejoría leve","sintomas":"Mejoría leve","crisis":"Mejoría leve"}'::jsonb,
    valoracion_global = '{"sessionNum":2,"yo":true,"demas":true,"mundo":false}'::jsonb
WHERE id = 'ses-002';

-- 11. Semilla: pago, bitácora de supervisión y constancia (pac-001) -------------
-- Guarda de identidad del registrante (usr-001 = sofia.ramirez@brevemente.org, V4)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM usuarios WHERE id = 'usr-001') THEN
        RAISE EXCEPTION 'V8: usuario registrante usr-001 no encontrado';
    END IF;
END $$;

INSERT INTO pagos (id, paciente_id, concepto, monto, fecha, metodo, estado, registrado_por_id)
VALUES ('pay-001', 'pac-001', 'Sesión 1 · Seguimiento', 800.00, '2026-08-10', 'transferencia', 'pagado',
        'usr-001')
ON CONFLICT (id) DO NOTHING;

INSERT INTO supervision_bitacoras (id, paciente_id, terapeuta_id, fecha, numero_sesion,
    supervisor_nombre, supervisor_cedula, definicion_problema, situacion_actual, spr, ts,
    problema_terapeuta, rst, px, eff, duda, bloqueo, observaciones, recomendaciones)
VALUES ('sup-001', 'pac-001', 'ter-001', '2026-08-18', 2,
    'Dra. Isabel Cárdenas', 'CED-9988221-MX',
    'Fobia de rendimiento con evitación de evaluaciones. Solución intentada: evitación y búsqueda de reaseguramiento.',
    'Favorable. Disminución de la angustia anticipatoria tras la prescripción de la peor fantasía.',
    'SPR Fóbico', 'Fobia de rendimiento',
    'Resistencia sutil a exponerse solo ante exámenes.',
    'Fantasía del peor escenario y prescripción paradójica del síntoma.',
    'Bitácora de la peor fantasía + cómo empeorar.',
    'Disminución del miedo anticipatorio.',
    '¿Cómo modular la evitación ante evaluaciones orales?',
    'Evitación persistente de presentaciones.',
    'Aplicar redefinición paradójica sin confrontar directamente el miedo.',
    'Simulacros voluntarios de exposición + revisión en Sesión 3.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO constancias_fisicas (id, paciente_id, folio_fisico, fecha_expedicion, tipo,
    emisor_nombre, emisor_cedula, destinatario, motivo, periodo_cubierto, num_sesiones,
    resumen_clinico, url_escaneo, nombre_archivo_escaneo, entregado_a, estado, registrado_por_id, registrado_at)
VALUES ('con-fis-001', 'pac-001', 'CONST-2026-084-FIS', '2026-08-20', 'psicoterapeutica',
    'Dr. Alejandro Silva', 'CED-8849302-MX', 'Dirección Escolar', 'Acreditación de asistencia a tratamiento',
    '10 de Agosto de 2026 al 17 de Agosto de 2026', 2,
    'Se hace constar en físico que el paciente acude de manera regular a intervención en Terapia Breve Estratégica con evolución clínica favorable.',
    'escaneo_constancia_mateo_herrera.pdf', 'escaneo_constancia_mateo_herrera.pdf',
    'Mateo Herrera Santos (en mano, consultorio)', 'entregada_en_fisico',
    'usr-001', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;
```

> ⚠️ Notas del seed:
> - El registrante de `pay-001`/`con-fis-001` es `usr-001` (verificado en V4; una guarda `DO $$ RAISE EXCEPTION` antecede a los INSERT).
> - `rol-001…rol-006` son los ids reales (V5/V6); verificar antes de aplicar.
> - Textos clínicos adaptados de la demo a los registros reales `pac-001…pac-004` (no replicar `patient-1` "Sofía Martínez").

---

## 3. Spring Boot: módulos, controllers, DTOs, mappers y services

Cuatro módulos hexagonales nuevos + extensión del módulo `expediente`. Un `@RestControllerAdvice` por módulo con `basePackages` propio.

### 3.1 Estructura de paquetes (nuevos)
```
com.syborx.brevemente
├── auditoria        → domain (AuditoriaExpediente), application (ports in/out + service),
│                      infrastructure (adapter out persistencia + rest)
├── pago             → domain (Pago), application, infrastructure (rest + persistencia)
├── supervision      → domain (SupervisionBitacora, SupervisionSolicitud), application, infrastructure
├── constancia       → domain (ConstanciaFisica), application, infrastructure
└── expediente       → (extensión) ActualizarExpedienteUseCase + PATCH controller + toJpaEntity
```

### 3.2 Controllers REST (contrato definitivo, base `/api/v1`)

| Método | Ruta | Autoridad | Respuesta / Errores |
| :--- | :--- | :--- | :--- |
| PATCH | `/expedientes/paciente/{pacienteId}` | `EXPEDIENTE_ESCRIBIR` | 200 `ExpedienteResponseDTO` · 404 |
| GET | `/expedientes/paciente/{pacienteId}/auditoria` | `EXPEDIENTE_LEER` | 200 `AuditoriaExpedienteResponseDTO[]` · 404 |
| GET | `/pagos?pacienteId={pacienteId}` | `PAGOS_LEER` | 200 `PagoResponseDTO[]` |
| POST | `/pagos` | `PAGOS_GESTIONAR` | 201 `PagoResponseDTO` · 400 |
| PATCH | `/pagos/{pagoId}/estado` | `PAGOS_GESTIONAR` | 200 `PagoResponseDTO` · 404 |
| DELETE | `/pagos/{pagoId}` | `PAGOS_GESTIONAR` | 204 · 404 |
| GET | `/supervision/bitacoras?pacienteId={pacienteId}` | `SUPERVISION_LEER` | 200 `SupervisionLogResponseDTO[]` |
| POST | `/supervision/bitacoras` | `SUPERVISION_EVALUAR` o `SUPERVISION_REGISTRAR` | 201 · 400 |
| DELETE | `/supervision/bitacoras/{bitacoraId}` | `SUPERVISION_EVALUAR` o `SUPERVISION_REGISTRAR` (scope) | 204 · 404 |
| GET | `/supervision/solicitudes?pacienteId={pacienteId}` | `SUPERVISION_LEER` | 200 `SupervisionSolicitudResponseDTO[]` |
| POST | `/supervision/solicitudes` | `EXPEDIENTE_ESCRIBIR` | 201 `SupervisionSolicitudResponseDTO` · 400 |
| PATCH | `/supervision/solicitudes/{solicitudId}/atender` | `SUPERVISION_EVALUAR` | 200 · 404 |
| GET | `/constancias?pacienteId={pacienteId}` | `EXPEDIENTE_LEER` | 200 `ConstanciaFisicaResponseDTO[]` |
| POST | `/constancias` | `CONSTANCIAS_EMITIR` | 201 · 400 |
| DELETE | `/constancias/{constanciaId}` | `CONSTANCIAS_EMITIR` | 204 · 404 |

**Reglas de derivación (identidad vs profesional):**
- `solicitante_id` (FK→`usuarios`) ← `UsuarioAutenticado.sub()`.
- `terapeuta_id` / `therapistId` (FK→`terapeutas`) ← `UsuarioAutenticado.terapeutaIds` (regla multi-terapeuta de `sdd-agenda.md`: 1 → ese id; >1 → el seleccionado; 0 → 403 para roles clínicos).
- `registrado_por_id` (pagos/constancias) ← `sub()`.
- Scope de propiedad: con `SUPERVISION_LEER`, el terapeuta ve/solo-borra sus bitácoras y solicitudes (`terapeuta_id` propio); supervisor/admin ven todas.

> **ADR-003 (OpenAPI)**: los 4 controllers nuevos y todos sus DTOs deben autodocumentarse con `@Tag`, `@Operation`, `@ApiResponse` y `@Schema` (obligatorio según ADR-003).

### 3.3 DTOs (camelCase, alineados con el frontend)
| DTO | Campos clave |
| :--- | :--- |
| `ExpedienteResponseDTO` (extendido) | + `dxNosologico`, `dsm5`, `cie11`, `comorbilidad`, `differentialDx`, `treatmentPlan`, `prognosis`, `favorableFactors`, `unfavorableFactors`, `drugsUsage`, `drugsList` |
| `ExpedienteUpdateRequest` | solo campos editables de DX + psiquiatría (los de arriba + `motif`, `description`, `trastornoEstrategico`, `evolutionType`, `objectivePatient`, `objectiveTherapist`) |
| `SesionResponseDTO` / `SesionCreateRequest` (extendidos) | + `valoracionCambio` (`VcEntry`), `valoracionGlobal` (`VgEntry`) |
| `AuditoriaExpedienteResponseDTO` | `id`, `timestamp` (←`created_at`), `userId`, `userName` (join `usuarios`), `role` (join `roles`), `action`, `details`, `category` |
| `PagoResponseDTO` / `PagoCreateRequest` | `id`, `patientId`, `patientName` (join), `appointmentId?`, `concept`, `amount`, `date`, `method`, `status`, `notes?`, `registeredBy` (join), `createdAt` |
| `SupervisionLogResponseDTO` / `CreateRequest` | todos los campos de `SupervisionLog` (21 en demo/angular), `patientName`/`therapistName` por join |
| `SupervisionSolicitudResponseDTO` | `id`, `patientId`, `patientName`, `therapistId`, `therapistName` (join), `reason`, `status`, `createdAt`, `attendedBy?`, `attendedAt?` |
| `ConstanciaFisicaResponseDTO` / `CreateRequest` | 19 campos de `PhysicalCertificateLog`, `patientName` por join, `registeredBy` por join |

**Tipos embebidos (JSONB):**
```typescript
type VcEntry = { sessionNum; percepcion; pensamientos; sensaciones; reacciones; sintomas; crisis; };
type VgEntry = { sessionNum; yo: boolean; demas: boolean; mundo: boolean; };
type Drug  = { id; name; doseMorning; doseAfternoon; doseNight; eff; notes; };
```
- Escala VC validada en capa application: `Marcador de inicio`=1, `Sin cambios`=2, `Mejoría leve`=3, `Mejoría significativa`=4, `Nuevo patrón`=4.5, `Empeoramiento`=0, `Recaída`=0.
- `drugsUsage`/`uso_farmacos`: normalizar en el mapper (`sí`→`SI`, `no`→`NO`, `especificar`→`ESPECIFICAR`); el CHECK `ck_expedientes_uso_farmacos` solo admite mayúsculas.

### 3.4 Services (lógica central)
**`AuditoriaExpedienteApplicationService`** (módulo `auditoria`):
- `registrar(pacienteId, usuarioId, accion, detalle, categoria)` → `REQUIRES_NEW`, inserta en `auditoria_expediente`.
- `listarPorPaciente(pacienteId)` → `AuditoriaExpedienteResponseDTO[]` (join `usuarios`/`roles`).
- Lo invocan los services de `pago`, `supervision`, `constancia` y `expediente` (actualización) vía su puerto de salida.
- Excepción local: si el paciente no existe al listar, lanza `PacienteNoEncontradoException` (en `auditoria.domain.exception`), mapeada a 404 por `AuditoriaExceptionHandler` (sin depender de excepciones del módulo `expediente`).
- **Mapeo de categoría** (coherente con el CHECK `ck_auditoria_exp_categoria` y con la demo): pago→`pagos`, bitácora/solicitud de supervisión→`sesion`, constancia→`expediente`, actualización de expediente→`expediente`.

**`ActualizarExpedienteUseCase`** (módulo `expediente`, extensión):
1. `findByPacienteId` (404 si no existe).
2. Fusiona campos DX + psiquiatría → `save` (nuevo método en `ExpedienteRepositoryPort` + `toJpaEntity`).
3. Registra en auditoría (`AuditoriaExpedientePort`).
4. **Re-lee el expediente enriquecido** (mismo camino que GET: joins de paciente/terapeuta) para construir el `ExpedienteResponseDTO` de la respuesta 200.

**`PagoApplicationService`** (módulo `pago`):
- `listarPorPaciente`, `registrar` (deriva `registradoPorId` de `sub()`), `cambiarEstado` (transición libre dentro del catálogo; auditoría), `eliminar` (borrado físico + auditoría).

**`SupervisionBitacoraApplicationService` + `SupervisionSolicitudApplicationService`** (módulo `supervision`):
- Bitácoras: `listarPorPaciente` (scope por rol), `registrar` (terapeuta/supervisor), `eliminar` (scope de propiedad).
- Solicitudes: `crear` (deriva `solicitanteId`/`terapeutaId`), `listarPorPaciente` (scope), `atender` (supervisor).
- ⚠️ Nombres de bean explícitos (`@Service("supervisionBitacoraApplicationService")`, `@Service("supervisionSolicitudApplicationService")`) para evitar el conflicto ya visto con `SesionApplicationService`.

**`ConstanciaApplicationService`** (módulo `constancia`):
- `listarPorPaciente`, `registrar` (deriva `registradoPorId`), `eliminar` (anulación lógica `estado='anulada'` + auditoría).

### 3.5 Exception handlers (uno por módulo, scoped)
| Módulo | `@RestControllerAdvice(basePackages)` | Códigos |
| :--- | :--- | :--- |
| `expediente` (extendido) | `com.syborx.brevemente.expediente` | 404 `ExpedienteNotFoundException`; 400 validación |
| `pago` | `com.syborx.brevemente.pago` | 404 `PagoNotFoundException`; 400 `PagoInvalidoException` |
| `supervision` | `com.syborx.brevemente.supervision` | 404 `BitacoraNotFoundException`/`SolicitudNotFoundException` |
| `constancia` | `com.syborx.brevemente.constancia` | 404 `ConstanciaNotFoundException` |
| `auditoria` | `com.syborx.brevemente.auditoria` | 404 `PacienteNoEncontradoException` (local) al listar |

---

## 4. Angular: puertos, adapters y port visual

### 4.1 Tipos y flags
- Añadir a `clinical.types.ts`: `AuditLog`, `SupervisionRequest`, `PhysicalCertificateLog`, `VcEntry`, `VgEntry`, `Drug`, `CounterReferral` (diferido), `CrisisIncident` (diferido).
- Ampliar la unión `Permission` en `clinical.types.ts` con `PAGOS_LEER`, `PAGOS_GESTIONAR`, `CONSTANCIAS_EMITIR`, `SUPERVISION_REGISTRAR`.
- **Actualizar `VALID_PERMISSIONS`** en `modules/login/adapters/login-http.adapter.ts` con los 4 permisos nuevos (si no, el filtro PBAC del login los descarta y `hasPermission` nunca los concede).
- `environment.ts` **y** `environment.prod.ts`: **añadir** `pagosBackend`, `constanciasBackend`, `auditoriaBackend` al objeto `features` (hoy no existen en ninguno) y **activar** `supervisionBackend: true` (en dev está `false`; en prod ya está `true`). ⚠️ El build de producción usa `fileReplacements` → si solo se toca `environment.ts`, el build falla (TS2339) o el adapter cae silenciosamente a LocalStorage. Patrón dual adapters.

### 4.2 Puertos nuevos (hexagonal frontend)
| Puerto | Métodos |
| :--- | :--- |
| `PagoRepository` | `listarPorPaciente`, `registrar`, `cambiarEstado`, `eliminar` |
| `ConstanciaRepository` | `listarPorPaciente`, `registrar`, `eliminar` |
| `AuditoriaRepository` | `listarPorPaciente` |
| `SupervisionRepository` (extender) | `listarBitacoras(pacienteId)`, `agregarBitacora`, `eliminarBitacora`, `crearSolicitud`, `listarSolicitudes`, `atenderSolicitud` |

> El adapter Angular `supervision-http.adapter.ts` actual (`GET/POST /api/v1/supervision` plano) se reescribe al contrato `/supervision/bitacoras` + `/supervision/solicitudes` con `pacienteId` como query param.
>
> **Coexistencia de dos consumidores**: la página standalone `/supervision` (módulo `modules/supervision`) conserva `listarLogs()` global (sin `pacienteId`); el tab de supervisión dentro de `expediente-clinico` usa los métodos per-paciente (`listarBitacoras(pacienteId)`, etc.). `SupervisionRepository` gana ambos grupos de métodos; el factory provider se declara en cada componente (`supervision.component.ts` para la página, `expediente-clinico.component.ts` para el tab), ambos resolviendo al mismo `SupervisionHttpAdapter`.

### 4.3 Port visual (regla del calendario)
Portar **tal cual** las clases Tailwind de la demo React a `expediente-clinico.component.html`:
- `tbe → vc`: tabla de criterios + gráfico de líneas (6 series).
- `tbe → vg`: tabla de esferas + gráfico de barras (YO/DEMÁS/MUNDO).
- `tbe → rst`: listado derivado de `sesiones.f1/f2`.
- `psiquiatria`: formulario DX nosológico + DSM-5/CIE-11 + pronóstico + tabla de fármacos.
- `pagos`: resumen (total cobrado/pendiente) + tabla + modal "Registrar pago" + recordatorio WhatsApp (`wa.me`, patrón `abrirWhatsAppCancelacion` de Agenda).
- `auditoria`: bitácora inmutable con categoría/rol/fecha.
- `supervision`: tarjetas resumen + historial de bitácoras + modal "Nueva bitácora" + "Solicitar Supervisión".
- `constancias`: banner normativo (NOM-004-SSA3-2012) + listado + modales de registro/detalle.
- Gráficas VC/VG: SVG ligero o `ng2-charts` (decisión §10.3 del gap report).

---

## 5. Aceptación (Gate #1)

Este SDD queda listo para `demo-gap-implementation` cuando se aprueben:
1. El consecutivo `V8` y el SQL de la §2 (13 columnas: 11 en `expedientes_clinicos` + 2 en `sesiones`; 5 tablas + CHECKs + índices + permisos + seed).
2. El contrato REST §3.2 (15 endpoints, autorización y scope de propiedad).
3. La derivación identidad/profesional (`sub()` vs `terapeutaIds`) y la regla multi-terapeuta.
4. Los DTOs §3.3 (incluidos `VcEntry`/`VgEntry`/`Drug` y la escala VC).
5. El port visual §4.3 (fuente de verdad = demo React).

> Fuente de verdad: `docs/gap-analysis/gap-report-expedientes_Fase2.md` (15 GAPs + §7 contrato + §8 plan V8). Auditorías: 3 rondas de `jarvis-database` y `jarvis-backend` (sin bloqueantes).

> **Fase futura (fuera de este SDD)**: `contrareferencia`, `crisisHistory`, reconsentimiento autónomo — requerirán su propia migración y permisos.
