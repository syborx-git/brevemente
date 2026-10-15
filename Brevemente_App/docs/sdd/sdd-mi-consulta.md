# SDD: Módulo Mi Consulta — Configuración del Terapeuta

- **Fecha**: 2026-10-15
- **Módulo**: `mi-consulta` (Angular) / configuración del terapeuta (Spring Boot)
- **Estado**: DISEÑO (no se edita código fuente)
- **Insume**: `docs/gap-analysis/gap-report-mi-consulta.md` (auditado por frontend/backend/database)

---

## Contexto y decisión

`mi-consulta` se redefine como **módulo de Configuración del Terapeuta**: perfil profesional, honorarios, teléfono y reglas de admisión. **No** se construye un "workspace operativo" (ya cubierto por Dashboard/Agenda/Supervisión/Expedientes/LEVA).

Fuentes de datos:
- **Identidad** (`therapistName`, `email`) → tabla `usuarios` (NO `terapeutas`; V4 las migró).
- **Perfil** (`cedula_profesional`, `especialidad`) → tabla `terapeutas`.
- **Configuración** (teléfono, duración, costos, edad mínima) → tabla `terapeutas` (columnas nuevas V13).

---

## 1. Plan de Reutilización: Entidades JPA y DTOs a extender

### 1.1 Entidades JPA existentes (reutilizar/adaptar)

| Artefacto | Ubicación | Acción |
| :--- | :--- | :--- |
| `TerapeutaJpaEntity` | `paciente/.../persistence/entity/TerapeutaJpaEntity.java` | **Extender** con 5 campos nuevos |
| `SpringDataTerapeutaRepository` | `paciente/.../persistence/repository/SpringDataTerapeutaRepository.java` | **Reutilizar** (ya tiene `findTherapistDisplayName`/`findAllDisplayNames` con JOIN `usuarios`); añadir query de `email` + campos de config |
| `UsuarioJpaEntity` | `auth/...` (identidad V4) | **Solo lectura** (nombre/apellidos/email) |
| `UsuarioAutenticado` | `auth/infrastructure/security/UsuarioAutenticado.java` | **Reutilizar** vía `@AuthenticationPrincipal` (patrón `SupervisionRestController`) para resolver `terapeutaIds` |

### 1.2 Campos a añadir en `TerapeutaJpaEntity`

| Campo JPA | Columna DB | Tipo |
| :--- | :--- | :--- |
| `telefono` | `telefono` | `String` (`VARCHAR(20)`) |
| `duracionSesionDefaultMin` | `duracion_sesion_default_min` | `int`/`Integer` (`SMALLINT`) |
| `costoPrimeraSesion` | `costo_primera_sesion` | `BigDecimal` (`NUMERIC(10,2)`) |
| `costoSeguimiento` | `costo_seguimiento` | `BigDecimal` (`NUMERIC(10,2)`) |
| `edadMinimaAtencion` | `edad_minima_atencion` | `int`/`Integer` (`SMALLINT`) |

### 1.3 DTOs nuevos (backend)

- **`TerapeutaConfigResponseDTO`** (record): `id`, `nombre`, `email`, `cedulaProfesional`, `especialidad`, `telefono`, `duracionSesionDefaultMin`, `costoPrimeraSesion`, `costoSeguimiento`, `edadMinimaAtencion`.
- **`TerapeutaConfigRequestDTO`** (record): `telefono`, `duracionSesionDefaultMin`, `costoPrimeraSesion`, `costoSeguimiento`, `edadMinimaAtencion`.

> Nota: `nombre`/`email` se resuelven por JOIN `usuarios` (vía `usuario_id`), no se guardan en `terapeutas`.

---

## 2. Migración Flyway (inmutable)

**Consecutivo correcto**: `V13` (último existente: `V12__introduce_protocolos.sql`).

**Archivo**: `V13__extend_terapeutas_config.sql`

```sql
-- V13: Configuración del terapeuta (honorarios, duración, admisión, teléfono)

-- 1. Columnas nuevas (con DEFAULT: poblan las filas existentes)
ALTER TABLE terapeutas ADD COLUMN IF NOT EXISTS telefono VARCHAR(20);
ALTER TABLE terapeutas ADD COLUMN IF NOT EXISTS duracion_sesion_default_min SMALLINT NOT NULL DEFAULT 50;
ALTER TABLE terapeutas ADD COLUMN IF NOT EXISTS costo_primera_sesion NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE terapeutas ADD COLUMN IF NOT EXISTS costo_seguimiento NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE terapeutas ADD COLUMN IF NOT EXISTS edad_minima_atencion SMALLINT NOT NULL DEFAULT 0;

-- 2. Backfill de terapeutas existentes (seed de demo; valores del mock Angular `mi-consulta-localstorage.adapter.ts`: duración 50, costos 1200/1000)
--    `edad_minima_atencion` se deja en 0 (sin límite), coherente con la demo React.
UPDATE terapeutas SET
  costo_primera_sesion = 1200,
  costo_seguimiento   = 1000
WHERE id IN ('ter-001', 'ter-002')
  AND costo_primera_sesion = 0
  AND costo_seguimiento = 0
  AND edad_minima_atencion = 0;

-- 3. CHECKs idempotentes (convención ck_terapeutas_*, con filtro de tabla)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
                 WHERE c.conname = 'ck_terapeutas_duracion' AND t.relname = 'terapeutas') THEN
    ALTER TABLE terapeutas ADD CONSTRAINT ck_terapeutas_duracion
      CHECK (duracion_sesion_default_min BETWEEN 15 AND 240);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
                 WHERE c.conname = 'ck_terapeutas_costos' AND t.relname = 'terapeutas') THEN
    ALTER TABLE terapeutas ADD CONSTRAINT ck_terapeutas_costos
      CHECK (costo_primera_sesion >= 0 AND costo_seguimiento >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
                 WHERE c.conname = 'ck_terapeutas_edad_minima' AND t.relname = 'terapeutas') THEN
    ALTER TABLE terapeutas ADD CONSTRAINT ck_terapeutas_edad_minima
      CHECK (edad_minima_atencion BETWEEN 0 AND 120);
  END IF;
END $$;
```

> **`firma_digital_habilitada`**: el mock de la demo incluye este campo con valor `true`. **Decisión**: queda **fuera de alcance** de V13 (se evaluará junto con la firma digital en Expedientes). Si se requiere, añadir en V13/V14: `firma_digital_habilitada BOOLEAN NOT NULL DEFAULT TRUE`.

> **Fuera de esta migración (mejora futura `V14`)**: relación M2M `terapeuta_sedes` para consultorios/sedes por terapeuta:
> ```sql
> CREATE TABLE IF NOT EXISTS terapeuta_sedes (
>   terapeuta_id VARCHAR(36) NOT NULL,
>   sede_id      VARCHAR(36) NOT NULL,
>   es_principal BOOLEAN NOT NULL DEFAULT FALSE,
>   activo       BOOLEAN NOT NULL DEFAULT TRUE,
>   PRIMARY KEY (terapeuta_id, sede_id),
>   CONSTRAINT fk_terapeuta_sedes_terapeuta FOREIGN KEY (terapeuta_id) REFERENCES terapeutas(id) ON DELETE CASCADE,
>   CONSTRAINT fk_terapeuta_sedes_sede      FOREIGN KEY (sede_id)      REFERENCES sedes(id)      ON DELETE CASCADE
> );
> CREATE UNIQUE INDEX IF NOT EXISTS ux_terapeuta_sedes_principal
>   ON terapeuta_sedes (terapeuta_id) WHERE es_principal = TRUE AND activo = TRUE;
> CREATE INDEX IF NOT EXISTS idx_terapeuta_sedes_sede ON terapeuta_sedes (sede_id);
> ```

---

## 3. Spring Boot: Controllers, DTOs, Mappers y Services

### 3.1 Estructura (hexagonal — extiende el módulo `paciente`, dueño del agregado `terapeutas`)

```
com.syborx.brevemente.paciente
├── application
│   ├── ports/in
│   │   ├── ObtenerConfigTerapeutaUseCase.java
│   │   └── ActualizarConfigTerapeutaUseCase.java
│   ├── ports/out/TerapeutaConfigRepositoryPort.java
│   └── service/TerapeutaConfigApplicationService.java
└── infrastructure
    ├── adapters/in/rest
    │   ├── MiConsultaRestController.java
    │   ├── dto/TerapeutaConfigResponseDTO.java
    │   ├── dto/TerapeutaConfigRequestDTO.java
    │   └── mapper/TerapeutaConfigRestMapper.java
    └── adapters/out/persistence
        └── TerapeutaConfigPersistenceAdapter.java   (envuelve SpringDataTerapeutaRepository)
```

> Decisión: se **extiende `paciente`** (no se crea un módulo `terapeuta` nuevo). `TerapeutaJpaEntity` y `SpringDataTerapeutaRepository` ya viven ahí y son el propietario del agregado; hay precedente cross-módulo (`dashboard`, `supervision`, `expediente` ya lo importan). El adapter de persistencia envuelve el repositorio existente, sin duplicar la entidad.

### 3.2 Endpoints REST

| Método | Ruta | Precondición | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/mi-consulta` | `hasAuthority('MI_CONSULTA_LEER')` | Config del terapeuta actual (resuelto por `terapeutaIds` del JWT) |
| `PUT` | `/api/v1/mi-consulta` | `hasAuthority('MI_CONSULTA_EDITAR')` | Actualiza config; acepta `terapeutaId` (query/body) para admin/supervisor con `terapeutaIds` vacío |

> Permisos: `MI_CONSULTA_LEER` **ya existe** (V5, `perm-013`). Falta crear `MI_CONSULTA_EDITAR` y asignarlo al menos a `therapist` (y decidir `supervisor`/`admin_clinical`). `CONFIGURACION_SISTEMA` **no** es reutilizable (solo `admin_platform`).

### 3.3 Service

- **Resolución del terapeuta** (replicar `CitaApplicationService.resolverTerapeutaId`): 1 id → `get(0)`; >1 ids → exige `terapeutaId` explícito dentro de la lista (si no, excepción); 0 ids → solo `admin_platform` con `terapeutaId` explícito; para `supervisor`, validar que el `terapeutaId` esté en su alcance (`asignaciones_supervision`).
- **Puerto de identidad**: `resolverTerapeutaId` depende de `IdentidadAutenticadaPort` (módulo `cita`). Al extender `paciente`, definir un **puerto de identidad propio** en `paciente` (no importar el de `cita`) para evitar acoplamiento entre módulos.
- **Puerto de supervisión**: el puerto de `asignaciones_supervision` vive en `dashboard` (`SupervisionAsignacionRepositoryPort`). Definir un puerto/adapter propio en `paciente` (o cross-import, como ya hace `dashboard`) para validar el alcance del supervisor.
- `obtenerConfig(terapeutaId)` → carga identidad (`usuarios`) + perfil/config (`terapeutas`); mapea a `TerapeutaConfig`.
- `actualizarConfig(terapeutaId, request)` → valida y persiste solo los 5 campos de configuración; actualiza `updated_at` (responsabilidad de la app; no hay trigger en DB).

### 3.4 Mapper

- `toResponse(TerapeutaConfig)` → `TerapeutaConfigResponseDTO`.
- `toDomain(TerapeutaConfigRequestDTO)` → campos de configuración.

---

## 4. Angular: estructura del adapter HTTP

> **Aclaración**: la referencia "loginHttpAdapter" del requerimiento corresponde al **`MiConsultaHttpAdapter`** (adapter HTTP de este módulo). El patrón a seguir es el `LoginHttpAdapter` existente (módulo login): base URL desde `environment`, tipo wire y `map()` wire→dominio.

**Archivo**: `frontend/src/app/modules/mi-consulta/adapters/mi-consulta-http.adapter.ts`

```ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ConsultaConfig, MiConsultaRepository } from '../ports/mi-consulta.repository';
import { environment } from '../../../../environments/environment';

/** Contrato real del backend (GET/PUT /api/v1/mi-consulta). */
interface TerapeutaConfigWire {
  id: string;
  nombre: string;
  email: string;
  cedulaProfesional: string;
  especialidad: string;
  telefono: string | null;
  duracionSesionDefaultMin: number;
  costoPrimeraSesion: number;
  costoSeguimiento: number;
  edadMinimaAtencion: number;
}

interface TerapeutaConfigRequestWire {
  telefono?: string | null;
  duracionSesionDefaultMin: number;
  costoPrimeraSesion: number;
  costoSeguimiento: number;
  edadMinimaAtencion: number;
}

@Injectable({ providedIn: 'root' })
export class MiConsultaHttpAdapter implements MiConsultaRepository {
  private readonly apiUrl = `${environment.apiBaseUrl}/mi-consulta`;

  constructor(private readonly http: HttpClient) {}

  obtenerConfig(terapeutaId?: string): Observable<ConsultaConfig> {
    const params = terapeutaId ? new HttpParams().set('terapeutaId', terapeutaId) : undefined;
    return this.http.get<TerapeutaConfigWire>(this.apiUrl, { params }).pipe(map(this.toDomain));
  }

  guardarConfig(config: ConsultaConfig, terapeutaId?: string): Observable<ConsultaConfig> {
    const params = terapeutaId ? new HttpParams().set('terapeutaId', terapeutaId) : undefined;
    const body: TerapeutaConfigRequestWire = {
      telefono: config.phone,
      duracionSesionDefaultMin: config.defaultSessionDuration,
      costoPrimeraSesion: config.costoPrimeraSesion,
      costoSeguimiento: config.costoSeguimiento,
      edadMinimaAtencion: config.edadMinimaAtencion
    };
    return this.http.put<TerapeutaConfigWire>(this.apiUrl, body, { params }).pipe(map(this.toDomain));
  }

  private toDomain(w: TerapeutaConfigWire): ConsultaConfig {
    return {
      therapistName: w.nombre,
      license: w.cedulaProfesional,
      specialty: w.especialidad,
      email: w.email,
      phone: w.telefono ?? '',
      defaultSessionDuration: w.duracionSesionDefaultMin,
      costoPrimeraSesion: w.costoPrimeraSesion,
      costoSeguimiento: w.costoSeguimiento,
      edadMinimaAtencion: w.edadMinimaAtencion
    };
  }
}
```

**Cambios asociados en el módulo** (documentados, sin editar):
1. **Puerto** `mi-consulta.repository.ts`: ajustar firmas a `obtenerConfig(terapeutaId?)` / `guardarConfig(config, terapeutaId?)`. Los 9 campos de `ConsultaConfig` **ya existen** (incluido `phone`); no es necesario extenderlos.
2. **Componente** `mi-consulta.component.ts`: **inyectar `RoleStateService`** (hoy no lo inyecta) para la fuente de `terapeutaId` (`roleService.terapeutaIds[0]` para terapeuta, o selector/param para admin/supervisor); añadir el input `phone` al formulario; manejar `error`/`loading` en `guardar()` (estados `saving`/`errorMessage`, botón `[disabled]`, banner de error); notificación dinámica según `environment.features.miConsultaBackend` (texto distinto para "servidor" vs "LocalStorage").
3. **Feature flag**: `environment.ts` → `miConsultaBackend: false` (dev); `environment.prod.ts` → `true` (ya correcto).

---

## 5. Alcance y fuera de alcance

**En esta iteración**: V13 + endpoint GET/PUT de configuración + formulario ampliado (con `phone`, manejo de errores).

**Fuera de alcance**: workspace operativo, máquina de estados de sesión (→ Expedientes), borradores LEVA (→ LEVA), capacitación (→ futuro), relación M2M `terapeuta_sedes` (→ `V14`, mejora futura).

> Este documento es diseño únicamente; **no** se ha editado código fuente.
