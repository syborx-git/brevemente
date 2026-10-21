# SDD-002: Software Design Document — Módulo Agenda y Citas (SDOP)

- **Módulo**: `agenda`
- **Código SDD**: `SDD-002`
- **Versión**: 2.1.0 *(cierre de implementación sobre v2.0.0)*
- **Fecha**: 2026-10-07
- **Estado**: IMPLEMENTADO — verificado con E2E (4/4) y smoke test de máquina de estados
- **Alineación Normativa**: ADR-001 (Hexagonal/SDOP), ADR-002 (Dual Adapters), ADR-003 (Flyway), `gap-report-agenda.md` (4 rondas de auditoría DBA/backend)
- **Rol**: Lead Architect

> **Regla de Oro**: integrar vía adaptador/puerto, conservando HTML/SCSS del frontend **100% intactos**. No se edita código fuente en esta fase; este documento es la especificación.

---

## 0. Propósito y alcance

Portar a producción (backend Spring Boot + PostgreSQL) la agenda completa de la demo React, con paridad total: calendario día/semana/mes/año, agendado con duración/modalidad/consultorio, 7 estados de cita, festivos oficiales + días personales, filtros, restricción por rol y auditoría.

Reglas de negocio ya validadas (`gap-report-agenda.md` §4.5):
1. `type` ∈ {`primera`, `seguimiento`, `cierre`}.
2. `modalidad` y `consultorio` se persisten **por cita**.
3. Duración default **30 min**, editable (30/45/60) solo en memoria hasta el `POST`.
4. Solapamiento **bloqueado** (409) por terapeuta **y** por paciente.
5. WhatsApp: **Nivel A** (`wa.me`) con puerto `WhatsAppPort` listo para Cloud API.
6. Crean citas: **terapeutas**, **asistentes asignados** (N:M) y **admin_platform**; `admin_clinical` y `supervisor` son **solo lectura**.
7. Asistente puede apoyar a **varios** terapeutas (con >1, `POST` exige `terapeutaId`).

---

## 1. Plan de Reutilización: Entidades JPA y DTOs a Extender

Principio SDOP: **reutilizar y adaptar antes de crear**. Nada del esquema previo se descarta.

### 1.1 Reutilizar sin cambios
| Componente | Ubicación | Uso |
| :--- | :--- | :--- |
| Tabla `citas` (V1) | `db/migration/V1__init_schema.sql` | Se **extiende** en V6 (no se recrea) |
| Tabla `pacientes` + `GET /api/v1/pacientes` | módulo `paciente` | `obtenerPacientes()` del puerto Angular |
| `terapeutas.usuario_id` (V4) | — | Resolver `terapeutaIds` en el login |
| `expedientes_clinicos` (V1) | — | FK opcional `expediente_id` |
| `AuditoriaAccesoAdapter` + `auditoria_accesos` | módulo `auth` | Se **extiende** para recurso `'citas'` |
| `WebCorsConfig` / `OpenApiConfig` | módulo `config` | Sin cambios |
| `PacienteRestController` + DTOs + mapper + `PacienteExceptionHandler` | módulo `paciente` | **Plantilla** para el módulo `cita` |

> Nota: `CitaExceptionHandler` replica `PacienteExceptionHandler` pero **añade** `basePackages = "com.syborx.brevemente.cita"` para acotar su alcance al módulo `cita` (el advice de `paciente` es global, por lo que conviene evitar que capture excepciones ajenas).

### 1.2 Entidades JPA a EXTENDER (existentes)
| Entidad | Cambio |
| :--- | :--- |
| `PacienteJpaEntity` (`paciente/infrastructure/.../out/persistence/entity`) | Añadir campo `usuarioId` (columna `pacientes.usuario_id` de V6) |
| `PacientePersistenceMapper` | Mapear `usuarioId` ↔ dominio `Paciente` |

> Nota: la tabla `usuarios` **no** gana columnas nuevas; `terapeutaIds`/`pacienteId` se **derivan** en el login (no se persisten en `usuarios`).

### 1.3 Modelo de dominio `auth` a EXTENDER
| Elemento | Cambio |
| :--- | :--- |
| `Usuario` (`auth/domain/model`) | Añadir campos opcionales `List<String> terapeutaIds` y `String pacienteId` |
| `JwtService.generarToken` | Emitir claims `terapeutaIds` (lista) y `pacienteId` |
| `JwtAuthFilter` | Sustituir el principal `String userId` por `UsuarioAutenticado(sub, terapeutaIds, pacienteId, authorities)` con `getName() → sub` |
| `AuditoriaAccesoPort` | Añadir `registrarAcceso(String usuarioId, String recurso, String accion, String ip, String detalle)` (hoy fija recurso `'auth'`) |
| `LoginHttpAdapter` (frontend) → `TokenResponseBackend` | Incluir `terapeutaIds`/`pacienteId` en el objeto `user` |

### 1.4 Entidades JPA NUEVAS (módulo `cita`)
| Entidad | Tabla | Notas |
| :--- | :--- | :--- |
| `CitaJpaEntity` | `citas` | Fechas `OffsetDateTime` sobre `TIMESTAMPTZ`; `updatedAt` con `@UpdateTimestamp` |
| `DiaNoLaborableJpaEntity` | `dias_no_laborables` | `tipo` oficial/personal |
| `AsignacionTerapeutaJpaEntity` | `asignaciones_terapeuta` | PK compuesta `(usuario_id, terapeuta_id)` |

> `tipo_sesion` y `notas_preparacion` (V1) no se mapean en `CitaJpaEntity`: `tipo_sesion` es formato de sesión legacy (la etapa clínica es `tipo_cita`) y `notas_preparacion` queda fuera del alcance inicial.

### 1.5 Puertos/adaptadores a REUTILIZAR como patrón
- **`LicenseLookupPort` → `LicenseLookupAdapter` → `LicenseJpaProjection`** (módulo `auth`): plantilla exacta para el nuevo `VinculoIdentidadPort`/`VinculoIdentidadAdapter`/`VinculoJpaProjection`, que en el login resuelve:
  - `terapeutaIds` = `SELECT id FROM terapeutas WHERE usuario_id = :sub` **UNION** `SELECT terapeuta_id FROM asignaciones_terapeuta WHERE usuario_id = :sub`.
  - `pacienteId` = `SELECT id FROM pacientes WHERE usuario_id = :sub`.
- **`PacienteRepositoryPort`** (módulo `paciente`): se consume desde el módulo `cita` vía un puerto propio `PacienteConsentimientoPort` (adapter que traduce) para aplicar la regla "Bloqueada por Normativa" sin acoplar módulos.

### 1.6 DTOs a EXTENDER (frontend, `core/types/clinical.types.ts`)
| Tipo | Cambio |
| :--- | :--- |
| `User` | Añadir `terapeutaIds?: string[]` y `pacienteId?: string` |
| `Appointment` | Añadir `terapeutaId?: string`, `duration?: 30 \| 45 \| 60`, `modality?: 'PRESENCIAL' \| 'ONLINE'`, `office?: 'A' \| 'B'`, `bloqueadaPorNormativa?: boolean` |
| `Permission` | Añadir `'MIS_CITAS_LEER'` y `'AGENDA_LEER'` |
| `DiaNoLaborable` (**nuevo**) | `{ id: string; fecha: string; nombre: string; tipo: 'oficial' \| 'personal'; terapeutaId?: string \| null }` |
| `RoleStateService` | Exponer `terapeutaIds` (para decidir si se muestra el selector de terapeuta) |

---

## 2. Migración Flyway: `V6__introduce_citas_schema.sql`

- **Consecutivo oficial**: `V6` (sucede a `V1…V5`; V5 llega a `perm-016`).
- **Ubicación**: `Brevemente_App/backend/src/main/resources/db/migration/V6__introduce_citas_schema.sql`.
- **Propiedades**: inmutable, idempotente (`IF NOT EXISTS`, `ON CONFLICT DO NOTHING`, `DO $$` para constraints). Hash BCrypt `demo123`: `$2b$10$R6r.x0rEySTSe6zcys7heeDDF/uC2lQY5jVoNhM52BjrhGaSkGXH2`.
  > Robustez: los guards `pg_constraint.conname` se acotan por tabla (`JOIN pg_class ... AND t.relname = 'citas'`) para evitar falsos positivos ante nombres homónimos.

```sql
-- =============================================================================
-- Migración V6: Esquema Agenda/Citas (SDOP) — SDD-002 v2.0.0
-- Sucede a V1..V5. Idempotente.
-- =============================================================================

-- 1. Extender citas ------------------------------------------------------------
ALTER TABLE citas
    ADD COLUMN IF NOT EXISTS tipo_cita        VARCHAR(20) NOT NULL DEFAULT 'primera',
    ADD COLUMN IF NOT EXISTS duracion_minutos INT         NOT NULL DEFAULT 30,
    ADD COLUMN IF NOT EXISTS payment_status   VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    ADD COLUMN IF NOT EXISTS consultorio      VARCHAR(10),
    ADD COLUMN IF NOT EXISTS updated_at       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE citas ALTER COLUMN estado_cita SET DEFAULT 'pendiente';
UPDATE citas SET estado_cita = 'pendiente' WHERE estado_cita = 'PROGRAMADA';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
                   WHERE c.conname = 'ck_citas_tipo_cita' AND t.relname = 'citas') THEN
        ALTER TABLE citas ADD CONSTRAINT ck_citas_tipo_cita
            CHECK (tipo_cita IN ('primera','seguimiento','cierre'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
                   WHERE c.conname = 'ck_citas_duracion' AND t.relname = 'citas') THEN
        ALTER TABLE citas ADD CONSTRAINT ck_citas_duracion
            CHECK (duracion_minutos IN (30,45,60));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
                   WHERE c.conname = 'ck_citas_payment' AND t.relname = 'citas') THEN
        ALTER TABLE citas ADD CONSTRAINT ck_citas_payment
            CHECK (payment_status IN ('pagada','pendiente','exenta'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
                   WHERE c.conname = 'ck_citas_consultorio' AND t.relname = 'citas') THEN
        ALTER TABLE citas ADD CONSTRAINT ck_citas_consultorio
            CHECK (consultorio IN ('A','B'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
                   WHERE c.conname = 'ck_citas_modalidad' AND t.relname = 'citas') THEN
        ALTER TABLE citas ADD CONSTRAINT ck_citas_modalidad
            CHECK (modalidad IN ('PRESENCIAL','ONLINE'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
                   WHERE c.conname = 'ck_citas_estado' AND t.relname = 'citas') THEN
        ALTER TABLE citas ADD CONSTRAINT ck_citas_estado
            CHECK (estado_cita IN ('confirmada','pendiente','completada','cancelada',
                                   'ausente','no_presentado','solicita_reagendar'));
    END IF;
END $$;

-- Índices de soporte a la detección de solapamiento (terapeuta y paciente)
CREATE INDEX IF NOT EXISTS idx_citas_terapeuta_fecha ON citas (terapeuta_id, fecha_hora_inicio);
CREATE INDEX IF NOT EXISTS idx_citas_paciente_fecha  ON citas (paciente_id,  fecha_hora_inicio);

-- 2. Nueva tabla dias_no_laborables --------------------------------------------
CREATE TABLE IF NOT EXISTS dias_no_laborables (
    id           VARCHAR(36) PRIMARY KEY,
    fecha        DATE NOT NULL,
    nombre       VARCHAR(100),
    tipo         VARCHAR(20) NOT NULL DEFAULT 'personal',
    terapeuta_id VARCHAR(36) REFERENCES terapeutas(id) ON DELETE CASCADE,  -- NULL ⇒ festivo oficial/global; días personales mueren con el terapeuta
    created_by   VARCHAR(36) REFERENCES usuarios(id) ON DELETE SET NULL,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_dias_no_laborables_tipo CHECK (tipo IN ('oficial','personal'))
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
                   WHERE c.conname = 'ck_dias_no_laborables_coherencia' AND t.relname = 'dias_no_laborables') THEN
        ALTER TABLE dias_no_laborables ADD CONSTRAINT ck_dias_no_laborables_coherencia
            CHECK ((tipo = 'personal' AND terapeuta_id IS NOT NULL)
                OR (tipo = 'oficial'  AND terapeuta_id IS NULL));
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS ux_dias_no_laborables_oficial
    ON dias_no_laborables (fecha) WHERE tipo = 'oficial';
CREATE UNIQUE INDEX IF NOT EXISTS ux_dias_no_laborables_personal
    ON dias_no_laborables (terapeuta_id, fecha) WHERE tipo = 'personal';

-- Festivos oficiales 2026 (solo lectura)
INSERT INTO dias_no_laborables (id, fecha, nombre, tipo) VALUES
    ('hol-1', '2026-01-01', 'Año Nuevo',                    'oficial'),
    ('hol-2', '2026-02-02', 'Día de la Constitución',       'oficial'),
    ('hol-3', '2026-03-16', 'Natalicio de Benito Juárez',   'oficial'),
    ('hol-4', '2026-05-01', 'Día del Trabajo',              'oficial'),
    ('hol-5', '2026-09-16', 'Día de la Independencia',      'oficial'),
    ('hol-6', '2026-11-16', 'Día de la Revolución',         'oficial'),
    ('hol-7', '2026-12-25', 'Navidad',                      'oficial')
ON CONFLICT DO NOTHING;

-- 3. Semilla de citas (ids deterministas) --------------------------------------
-- Coherencia con la regla "Bloqueada por Normativa": pac-001 (menor) queda sin
-- consentimiento firmado para poder demostrar el bloqueo normativo en la agenda.
-- cit-001 es histórica (confirmada antes de la revocación); cit-002 y cit-005
-- demuestran el bloqueo normativo (pendiente + bloqueada_por_normativa = TRUE).
UPDATE pacientes SET consentimiento_representante_firmado = FALSE WHERE id = 'pac-001';

INSERT INTO citas (id, paciente_id, terapeuta_id, expediente_id,
                   fecha_hora_inicio, fecha_hora_fin, tipo_cita, modalidad,
                   estado_cita, duracion_minutos, consultorio, payment_status,
                   bloqueada_por_normativa)
VALUES
    ('cit-001','pac-001','ter-001','exp-001',
     '2026-10-07T09:00:00-06:00','2026-10-07T09:30:00-06:00','primera','PRESENCIAL',
     'confirmada',30,'A','pendiente',FALSE),
    ('cit-002','pac-001','ter-001','exp-001',
     '2026-10-07T10:00:00-06:00','2026-10-07T10:45:00-06:00','seguimiento','ONLINE',
     'pendiente',45,NULL,'pendiente',TRUE),
    ('cit-003','pac-003','ter-002',NULL,
     '2026-10-07T11:00:00-06:00','2026-10-07T11:30:00-06:00','primera','PRESENCIAL',
     'confirmada',30,'B','pendiente',FALSE),
    ('cit-004','pac-004','ter-002',NULL,
     '2026-10-07T12:00:00-06:00','2026-10-07T13:00:00-06:00','seguimiento','PRESENCIAL',
     'completada',60,'B','pagada',FALSE),
    ('cit-005','pac-001','ter-001','exp-001',
     '2026-10-08T09:00:00-06:00','2026-10-08T09:45:00-06:00','seguimiento','PRESENCIAL',
     'pendiente',45,'A','pendiente',TRUE),
    ('cit-006','pac-003','ter-002',NULL,
     '2026-10-08T10:00:00-06:00','2026-10-08T10:30:00-06:00','primera','ONLINE',
     'cancelada',30,NULL,'pendiente',FALSE)
ON CONFLICT (id) DO NOTHING;

-- 4. Identidad, asignaciones y permisos ----------------------------------------
-- 4.1 Vínculo paciente ↔ usuario
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS usuario_id VARCHAR(36);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
                   WHERE c.conname = 'fk_pacientes_usuario' AND t.relname = 'pacientes') THEN
        ALTER TABLE pacientes
            ADD CONSTRAINT fk_pacientes_usuario
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL;
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS ux_pacientes_usuario_id
    ON pacientes (usuario_id) WHERE usuario_id IS NOT NULL;

-- 4.2 Usuarios patient (demo123) + rol-006 + vínculo
INSERT INTO usuarios (id, email, password_hash, nombre, apellidos, activo, token_version) VALUES
    ('usr-pac-001','contacto.mateo@familia.mx',    '$2b$10$R6r.x0rEySTSe6zcys7heeDDF/uC2lQY5jVoNhM52BjrhGaSkGXH2','Mateo','Herrera Santos',TRUE,1),
    ('usr-pac-002','valeria.gomez@empresa.mx',     '$2b$10$R6r.x0rEySTSe6zcys7heeDDF/uC2lQY5jVoNhM52BjrhGaSkGXH2','Valeria','Gómez Fuentes',TRUE,1),
    ('usr-pac-003','emiliano.diaz@universidad.mx', '$2b$10$R6r.x0rEySTSe6zcys7heeDDF/uC2lQY5jVoNhM52BjrhGaSkGXH2','Emiliano','Díaz Corona',TRUE,1),
    ('usr-pac-004','roberto.valdes@email.com',     '$2b$10$R6r.x0rEySTSe6zcys7heeDDF/uC2lQY5jVoNhM52BjrhGaSkGXH2','Roberto','Valdés Garza',TRUE,1)
ON CONFLICT DO NOTHING;

INSERT INTO usuario_roles (usuario_id, rol_id) VALUES
    ('usr-pac-001','rol-006'),
    ('usr-pac-002','rol-006'),
    ('usr-pac-003','rol-006'),
    ('usr-pac-004','rol-006')
ON CONFLICT (usuario_id, rol_id) DO NOTHING;

-- Verificación: los 4 usuarios patient deben existir (si un email colisionara,
-- el INSERT anterior se omitiría y el UPDATE violaría la FK).
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM (VALUES ('usr-pac-001'),('usr-pac-002'),('usr-pac-003'),('usr-pac-004')) AS v(id)
        WHERE NOT EXISTS (SELECT 1 FROM usuarios u WHERE u.id = v.id)
    ) THEN
        RAISE EXCEPTION 'V6: seed de usuarios patient incompleto (posible colisión de email)';
    END IF;
END $$;

UPDATE pacientes SET usuario_id = 'usr-pac-001' WHERE id = 'pac-001' AND usuario_id IS NULL;
UPDATE pacientes SET usuario_id = 'usr-pac-002' WHERE id = 'pac-002' AND usuario_id IS NULL;
UPDATE pacientes SET usuario_id = 'usr-pac-003' WHERE id = 'pac-003' AND usuario_id IS NULL;
UPDATE pacientes SET usuario_id = 'usr-pac-004' WHERE id = 'pac-004' AND usuario_id IS NULL;

-- 4.3 Asignaciones asistente ↔ terapeuta (N:M)
CREATE TABLE IF NOT EXISTS asignaciones_terapeuta (
    usuario_id   VARCHAR(36) NOT NULL REFERENCES usuarios(id)   ON DELETE CASCADE,
    terapeuta_id VARCHAR(36) NOT NULL REFERENCES terapeutas(id) ON DELETE CASCADE,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (usuario_id, terapeuta_id)
);
CREATE INDEX IF NOT EXISTS idx_asignaciones_terapeuta_terapeuta
    ON asignaciones_terapeuta (terapeuta_id);

INSERT INTO usuarios (id, email, password_hash, nombre, apellidos, activo, token_version) VALUES
    ('usr-asist-001','asistente.agenda@brevemente.org','$2b$10$R6r.x0rEySTSe6zcys7heeDDF/uC2lQY5jVoNhM52BjrhGaSkGXH2','Asistente','Agenda',TRUE,1)
ON CONFLICT DO NOTHING;

INSERT INTO usuario_roles (usuario_id, rol_id) VALUES
    ('usr-asist-001','rol-004')
ON CONFLICT (usuario_id, rol_id) DO NOTHING;

-- Verificación: el asistente debe existir antes de asignarlo.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM usuarios WHERE id = 'usr-asist-001') THEN
        RAISE EXCEPTION 'V6: seed de usuario asistente incompleto (posible colisión de email)';
    END IF;
END $$;

INSERT INTO asignaciones_terapeuta (usuario_id, terapeuta_id) VALUES
    ('usr-asist-001','ter-001'),
    ('usr-asist-001','ter-002')
ON CONFLICT (usuario_id, terapeuta_id) DO NOTHING;

-- 4.4 Permisos de agenda (PBAC)
INSERT INTO permisos (id, codigo, modulo, descripcion) VALUES
    ('perm-017','MIS_CITAS_LEER','AGENDA','Consultar las citas propias del paciente autenticado'),
    ('perm-018','AGENDA_LEER',   'AGENDA','Ver la agenda completa con filtros')
ON CONFLICT (codigo) DO NOTHING;

-- patient (rol-006): solo lee sus citas
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT 'rol-006', id FROM permisos WHERE codigo = 'MIS_CITAS_LEER'
ON CONFLICT DO NOTHING;

-- Roles clínicos + superadmin: lectura de agenda (AGENDA_LEER)
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.rol_id, p.id
FROM (VALUES ('rol-002'),('rol-003'),('rol-004'),('rol-005'),('rol-001')) AS r(rol_id)
CROSS JOIN (SELECT id FROM permisos WHERE codigo = 'AGENDA_LEER') AS p
ON CONFLICT DO NOTHING;

-- Regla de negocio: solo terapeutas, asistentes y superadmin agendan.
-- admin_clinical (rol-002) pierde AGENDA_GESTIONAR.
DELETE FROM rol_permisos
WHERE rol_id = 'rol-002'
  AND permiso_id = (SELECT id FROM permisos WHERE codigo = 'AGENDA_GESTIONAR');
```

---

## 3. Spring Boot: Controllers REST, DTOs, Mappers y Services

Estructura hexagonal nueva en `com.syborx.brevemente.cita` (espejo del módulo `paciente`).

### 3.1 Estructura de paquetes
```
com.syborx.brevemente.cita
├── domain
│   ├── model        → Cita, DiaNoLaborable
│   └── exception    → CitaNotFoundException, FechaNoLaborableException,
│                      SolapamientoCitaException, SinTerapeutaVinculadoException
├── application
│   ├── ports
│   │   ├── in       → ListarCitasUseCase, AgendarCitaUseCase, ActualizarEstadoCitaUseCase,
│   │   │              ReprogramarCitaUseCase, GestionarDiasNoLaborablesUseCase
│   │   └── out      → CitaRepositoryPort, DiaNoLaborablePort,
│   │                  PacienteConsentimientoPort, IdentidadAutenticadaPort, WhatsAppPort
│   └── service      → CitaApplicationService, DiaNoLaborableApplicationService
└── infrastructure
    └── adapters
        ├── in/rest      → CitaRestController, dto/*, mapper/CitaRestMapper, advice/CitaExceptionHandler
        └── out/persistence → entity/*, repository/*, mapper/*, CitaPersistenceAdapter, DiaNoLaborablePersistenceAdapter
```

### 3.2 Controllers REST

| Endpoint | Método | Autoridad | Respuesta |
| :--- | :--- | :--- | :--- |
| `/citas` | GET | `hasAnyAuthority('AGENDA_LEER','AGENDA_GESTIONAR','MIS_CITAS_LEER')` | 200 `CitaResponseDTO[]` |
| `/citas` | POST | `hasAuthority('AGENDA_GESTIONAR')` | 201 `CitaResponseDTO` |
| `/citas/{id}/estado` | PATCH | `hasAuthority('AGENDA_GESTIONAR')` | 200 `CitaResponseDTO` |
| `/citas/{id}` | PATCH | `hasAuthority('AGENDA_GESTIONAR')` | 200 `CitaResponseDTO` (reprogramar) |
| `/dias-no-laborables` | GET | `hasAuthority('AGENDA_LEER')` | 200 `DiaNoLaborableDTO[]` |
| `/dias-no-laborables` | POST | `hasAuthority('AGENDA_GESTIONAR')` | 201 `DiaNoLaborableDTO` |
| `/dias-no-laborables/{id}` | DELETE | `hasAuthority('AGENDA_GESTIONAR')` | 204 |

- `GET /citas` acepta filtros por query params: `terapeutaId`, `consultorio`, `modalidad`, `estado`, `desde`, `hasta`.
- `CitaExceptionHandler` = `@RestControllerAdvice(basePackages = "com.syborx.brevemente.cita")`.
- Manejo de errores: `404 CitaNotFoundException`, `409 SolapamientoCitaException`, `409 FechaNoLaborableException`, `403 SinTerapeutaVinculadoException`.

### 3.3 DTOs
| DTO | Campos clave |
| :--- | :--- |
| `CitaCreateRequest` | `pacienteId`, `terapeutaId?`, `fecha`, `hora`, `tipo`, `duracionMinutos`, `modalidad`, `consultorio?` (obligatorio solo en `PRESENCIAL`) |
| `CitaReprogramarRequest` | `fecha`, `hora`, `duracionMinutos`, `terapeutaId?` |
| `CitaEstadoRequest` | `status` (el adapter Angular hoy envía `{ status }`) |
| `CitaResponseDTO` | `id`, `patientId`, `patientName` (join), `date`, `time`, `type`, `status`, `paymentStatus`, `terapeutaId`, `duration`, `modality`, `office`, `bloqueadaPorNormativa` |
| `DiaNoLaborableDTO` | `id`, `fecha`, `nombre`, `tipo`, `terapeutaId` |

### 3.4 Mappers
- `CitaRestMapper`: `Cita → CitaResponseDTO` (compone `date`/`time` a partir de `OffsetDateTime` con zona explícita; resuelve `patientName` vía join en el adapter de persistencia). Correspondencia request↔response: `pacienteId`↔`patientId`, `modalidad`↔`modality`, `consultorio`↔`office`, `duracionMinutos`↔`duration`, `tipo`↔`type`, `estado`↔`status`.
- `CitaPersistenceMapper`: `CitaJpaEntity ↔ Cita` (fechas `OffsetDateTime`).
- `DiaNoLaborableRestMapper` y `DiaNoLaborablePersistenceMapper` (análogos).

### 3.5 Services (lógica central)
**`CitaApplicationService`**
- `agendar`:
  1. Valida día no laborable (oficial/personal) según la fecha.
  2. **Bloquea solapamiento** por terapeuta **y** por paciente (409).
  3. Aplica bloqueo normativo (`PacienteConsentimientoPort`): menor sin consentimiento → `bloqueada_por_normativa = true` y `estado = pendiente`.
  4. Deriva `terapeuta_id` (regla §3.6).
  5. Calcula `fecha_hora_fin = inicio.plusMinutes(duracion)`.
  6. `modalidad = 'ONLINE'` ⇒ fuerza `consultorio = null`; `PRESENCIAL` ⇒ exige `consultorio`.
  7. Resuelve `expediente_id` como el expediente activo del paciente (o `NULL` si no existe).
- `listar`: filtros + restricción por rol `patient` (filtro por `pacienteId`; si el usuario tiene rol clínico, gana el clínico).
- `actualizarEstado`: transiciones entre los 7 estados.
- `reprogramar`: validación de solapamiento + auditoría.

**`DiaNoLaborableApplicationService`**: CRUD de días personales (misma regla de derivación de `terapeuta_id`).

### 3.6 Derivación de `terapeuta_id` (regla de negocio)
1. `terapeutaIds` con **1** elemento → se usa (ignora explícito).
2. `terapeutaIds` con **>1** → `terapeutaId` explícito **obligatorio** y dentro de la lista (403 si no).
3. Sin `terapeutaIds` y principal con autoridad `ROLE_ADMIN_PLATFORM` → `terapeutaId` explícito **obligatorio** (cualquier terapeuta activo).
4. Sin `terapeutaIds` y no superadmin → `403 SinTerapeutaVinculadoException` (aplica a `agendar`/`reprogramar`; no a `listar`).

### 3.7 Cambios en el módulo `auth`
- `Usuario`: + `List<String> terapeutaIds`, + `String pacienteId` (poblados en `AuthPersistenceAdapter.toDomain` vía `VinculoIdentidadPort`).
- `VinculoIdentidadPort`/`VinculoIdentidadAdapter`/`VinculoJpaProjection` (patrón `LicenseLookupPort`).
- `JwtService.generarToken`: `.claim("terapeutaIds", ...)` y `.claim("pacienteId", ...)`.
- `UserResponseDTO` + `AuthRestMapper`: serializar `terapeutaIds`/`pacienteId` en el objeto `user` de la respuesta de login (para que el frontend los reciba).
- `JwtAuthFilter`: principal `record UsuarioAutenticado(String sub, List<String> terapeutaIds, String pacienteId, Collection<GrantedAuthority> authorities) implements Principal` con `getName() → sub` (no rompe `/me` ni `/logout`).
- `AuditoriaAccesoPort`: + `registrarAcceso(...)`; `AuditoriaAccesoAdapter` escribe `recurso_accedido = 'citas'`.
- Claims re-emitidos en cada rotación del refresh (ventana máxima de desactualización = TTL del access token, 15 min).

---

## 4. Angular: Estructura del `AgendaHttpAdapter` (patrón `LoginHttpAdapter`)

El adaptador HTTP de agenda reemplaza al mock (`agenda-localstorage.adapter.ts`) y sigue la misma estructura de `LoginHttpAdapter`: `@Injectable`, `HttpClient`, `baseUrl` desde `environment`, mapeo y tipado de respuestas (se añade `catchError` solo donde se requiera tratar un estado concreto).

### 4.1 Puerto extendido (`ports/agenda.repository.ts`)
```typescript
import { Observable } from 'rxjs';
import { Appointment, Patient, DiaNoLaborable } from '../../../core/types/clinical.types';

export interface CitaCreatePayload {
  pacienteId: string;
  terapeutaId?: string;          // obligatorio solo si el usuario tiene >1 terapeuta
  fecha: string;                 // 'YYYY-MM-DD'
  hora: string;                  // 'HH:mm'
  tipo: 'primera' | 'seguimiento' | 'cierre';
  duracionMinutos: 30 | 45 | 60; // default 30 en el form
  modalidad: 'PRESENCIAL' | 'ONLINE';
  consultorio?: 'A' | 'B';        // obligatorio solo si modalidad = 'PRESENCIAL'
}

export interface CitaReprogramarPayload {
  fecha: string;
  hora: string;
  duracionMinutos: 30 | 45 | 60;
  terapeutaId?: string;
}

export interface CitaFiltros {
  terapeutaId?: string;
  consultorio?: 'A' | 'B';
  modalidad?: 'PRESENCIAL' | 'ONLINE';
  estado?: Appointment['status'];
  desde?: string;
  hasta?: string;
}

export abstract class AgendaRepository {
  abstract listarCitas(filtros?: CitaFiltros): Observable<Appointment[]>;
  abstract agendarCita(cita: CitaCreatePayload): Observable<Appointment>;
  abstract reprogramarCita(id: string, cita: CitaReprogramarPayload): Observable<Appointment>;
  abstract obtenerPacientes(): Observable<Patient[]>;
  abstract actualizarEstadoCita(id: string, status: Appointment['status']): Observable<Appointment>;
  abstract listarDiasNoLaborables(): Observable<DiaNoLaborable[]>;
  abstract crearDiaNoLaborable(dto: Omit<DiaNoLaborable, 'id'>): Observable<DiaNoLaborable>;
  abstract eliminarDiaNoLaborable(id: string): Observable<void>;
}
```

### 4.2 Clase `AgendaHttpAdapter`
```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AgendaRepository, CitaCreatePayload, CitaReprogramarPayload, CitaFiltros } from '../ports/agenda.repository';
import { Appointment, Patient, DiaNoLaborable } from '../../../core/types/clinical.types';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AgendaHttpAdapter implements AgendaRepository {
  private readonly baseUrl = `${environment.apiBaseUrl}/citas`;
  private readonly diasUrl = `${environment.apiBaseUrl}/dias-no-laborables`;

  constructor(private readonly http: HttpClient) {}

  listarCitas(filtros?: CitaFiltros): Observable<Appointment[]> {
    const params = new HttpParams({ fromObject: { ...filtros } as Record<string, string> });
    return this.http.get<Appointment[]>(this.baseUrl, { params });
  }

  agendarCita(cita: CitaCreatePayload): Observable<Appointment> {
    return this.http.post<Appointment>(this.baseUrl, cita); // 201
  }

  reprogramarCita(id: string, cita: CitaReprogramarPayload): Observable<Appointment> {
    return this.http.patch<Appointment>(`${this.baseUrl}/${id}`, cita);
  }

  obtenerPacientes(): Observable<Patient[]> {
    return this.http.get<Patient[]>(`${environment.apiBaseUrl}/pacientes`);
  }

  actualizarEstadoCita(id: string, status: Appointment['status']): Observable<Appointment> {
    return this.http.patch<Appointment>(`${this.baseUrl}/${id}/estado`, { status });
  }

  listarDiasNoLaborables(): Observable<DiaNoLaborable[]> {
    return this.http.get<DiaNoLaborable[]>(this.diasUrl);
  }

  crearDiaNoLaborable(dto: Omit<DiaNoLaborable, 'id'>): Observable<DiaNoLaborable> {
    return this.http.post<DiaNoLaborable>(this.diasUrl, dto); // 201
  }

  eliminarDiaNoLaborable(id: string): Observable<void> {
    return this.http.delete<void>(`${this.diasUrl}/${id}`); // 204
  }
}
```

### 4.3 Activación y UI (Regla de Oro)
- `environments/environment.ts`: `agendaBackend: true` y **eliminar** `agenda-localstorage.adapter.ts`.
- `agenda.component.ts`: sustituir el `useFactory` condicional actual (`agendaBackend ? AgendaHttpAdapter : AgendaLocalStorageAdapter`) por la resolución directa a `AgendaHttpAdapter` (y borrar el mock).
- `login-http.adapter.ts`: añadir `'AGENDA_LEER'` y `'MIS_CITAS_LEER'` a `VALID_PERMISSIONS` (si no, `validPermissions()` los filtra del `User` y se rompe el gating de UI).
- `login-http.adapter.ts`: `persistSession` debe copiar `terapeutaIds`/`pacienteId` al objeto `User` (desde `TokenResponseBackend.user`).
- El **selector de terapeuta** del modal se muestra si `terapeutaIds.length > 1` (asistente multi-terapeuta) **o** si el usuario es `admin_platform` sin `terapeutaIds` (regla §3.6.3); con 1 terapeuta se envía implícito.
- HTML/SCSS **100% intactos**; los cambios de UI nuevos se añaden sin alterar lo aprobado.

---

## 5. Aceptación (Gate #1)

Este SDD queda listo para `demo-gap-implementation` cuando se aprueben:
1. El consecutivo `V6` y el script SQL de la §2.
2. La regla de derivación de `terapeuta_id` (§3.6) y la matriz de permisos (§2, 4.4).
3. La firma del puerto `AgendaRepository` (§4.1).

> Fuente de verdad: `docs/gap-analysis/gap-report-agenda.md` (25 GAPs, 7 decisiones de negocio, 4 rondas de auditoría DBA/backend).
>
> Auditoría del SDD (2026-10-06): `jarvis-backend` y `jarvis-database` — ⚠️ aprobado con observaciones; correcciones incorporadas (semilla de bloqueo normativo, propagación de `terapeutaIds`/`pacienteId` al login, `VALID_PERMISSIONS`, tipo `DiaNoLaborable`, selector superadmin, idempotencia de semillas de usuarios y refinamientos menores).

---

## 6. Cierre de implementación (deltas sobre v2.0.0)

Implementado y verificado el 2026-10-07. La Regla de Oro se respetó: la estructura HTML/SCSS aprobada no se alteró; los cambios de UI son adiciones.

### 6.1 Calendario clínico (port de la demo React)
- `agenda.component` implementa el calendario con 4 niveles: **Día**, **Semana**, **Mes** y **Año**, con navegación `‹ ›`, botón `Hoy` y zoom entre niveles.
- Drawer **"Detalle de Consulta"** al pulsar una cita (paciente, fecha/hora/duración, estado).
- Modal de agendar ampliado con **Duración** (30/45/60), **Modalidad** (Presencial/Online) y **Consultorio** (A/B).
- El toggle **"Bloquear festivos para agendar"** vive dentro de la barra de navegación del calendario (a la izquierda de "Hoy"), separado del banner de Control Normativo.

### 6.2 Máquina de estados de cita
Matriz de transiciones válidas (única fuente en `CitaApplicationService`):

| Estado actual | Transiciones permitidas |
| :--- | :--- |
| `pendiente` | `confirmada`, `cancelada` |
| `confirmada` | `completada`, `cancelada`, `ausente`, `no_presentado` |
| `solicita_reagendar` | `confirmada`, `cancelada` |
| `completada`, `cancelada`, `ausente`, `no_presentado` | *(terminales, sin salidas)* |

- **Backend**: `actualizarEstado` valida contra el mapa y lanza `TransicionEstadoCitaInvalidaException`; `CitaExceptionHandler` la traduce a **409 Conflict**. Smoke test real: `PATCH /citas/cit-004/estado { status: 'cancelada' }` sobre una cita `completada` → **HTTP 409**.
- **Frontend**: `puedeConfirmar(app)` (solo `pendiente`/`solicita_reagendar` y paciente no bloqueado) y `puedeCancelar(app)` (solo `confirmada`/`pendiente`/`solicita_reagendar`) gobiernan los botones del drawer. Las citas `completada`/`cancelada`/`ausente`/`no_presentado` no muestran acciones.

### 6.3 Cancelación con confirmación y notificación (Nivel A)
- El botón "Cancelar" abre un **modal de confirmación** ("¿Cancelar esta cita?") antes de ejecutar el `PATCH`.
- Checkbox **"Notificar al paciente por WhatsApp"** (marcado por defecto) que abre `wa.me` con mensaje precargado de cancelación.
- El drawer muestra el botón **"Notificar cancelación por WhatsApp"** en citas `cancelada` como respaldo.
- WhatsApp se mantiene en **Nivel A** (`wa.me` en frontend); el puerto `WhatsAppPort` sigue como seam para Cloud API (Nivel B).

### 6.4 Corrección de zona horaria
- `CitaRestMapper.toResponse` compone `date`/`time` con `atZoneSameInstant(America/Mexico_City)` para que las citas seedeadas en `-06:00` se muestren en hora local (p. ej. `09:00`) y no en UTC.

### 6.5 Validación
- Suite E2E `agenda.spec.ts`: **4/4** (oráculo, navegación día/mes/año + drawer, modal ampliado, regresión visual `agenda-calendario.png`).
- Smoke test de API: login JWT + transición inválida → 409.

### 6.6 Pendiente acordado (fuera de agenda)
- Desbloqueo de citas `pendiente` de menores por firma de consentimiento: se implementará en el módulo **Expedientes** (endpoint real `POST /pacientes/{id}/consentimiento/firmar` + `expedienteClinicoBackend: true`), ya que hoy la firma escribe solo en localStorage.
