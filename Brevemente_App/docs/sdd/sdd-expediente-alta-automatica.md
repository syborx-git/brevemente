# SDD-EXP-ALTA-1: Software Design Document — Creación Automática del Expediente en el Alta del Paciente

- **Módulos**: `paciente` + `expediente` (backend Spring Boot, hexagonal) · `expediente-clinico` (frontend Angular 18 standalone) · PostgreSQL/Flyway
- **Código SDD**: `SDD-EXP-ALTA-1`
- **Versión**: 1.0.0
- **Fecha**: 2026-11-20
- **Estado**: ✅ APROBADO (auditado por `jarvis-database`, `jarvis-backend` y `jarvis-frontend`)
- **Sucede a**: `V29__corregir_citas_terapeuta_paciente.sql` (última migración aplicada)
- **Fuente de verdad**: `docs/gap-analysis/gap-report-creacion-expediente-alta.md`
- **Alineación**: ADR-001 (Hexagonal/SDOP), ADR-002 (Dual Adapters), ADR-003 (Backend hexagonal y OpenAPI)

> **Regla de Oro**: integrar vía adaptador/puerto, reutilizando/adaptando lo existente. Este documento **no** escribe código fuente; es la especificación que consumirá la implementación.

---

## 0. Propósito y alcance

Garantizar que **todo paciente dado de alta tenga su expediente clínico desde el inicio**. Hoy `POST /pacientes` crea paciente e identidad de acceso, pero **no** crea el expediente; `GET/PATCH /expedientes/paciente/{id}` responden 404 para pacientes nuevos y el frontend muestra los 4 tabs vacíos y falla en silencio al guardar.

### 0.1 Resultado esperado

1. Al alta (`POST /pacientes`), se crea **en la misma transacción** un expediente mínimo válido (relación 1:1 garantizada).
2. `GET /expedientes/paciente/{id}` de un paciente recién dado de alta responde **200** con los defaults.
3. Queda registrada la **apertura del expediente** en auditoría clínica.
4. El folio se genera **automáticamente** con secuencia PostgreSQL (`EXP-0005`, `EXP-0006`, …).
5. El frontend deja de borrar el expediente en memoria cuando falla un guardado (GAP-EXP-07).

### 0.2 Decisiones adoptadas

| # | Decisión |
| :-- | :-- |
| D-1 | El expediente se crea **en el alta** (Opción 1), no "bajo demanda" en GET. |
| D-2 | **Folio** generado automáticamente en el alta con **secuencia PostgreSQL**, formato `EXP-%04d`. |
| D-3 | **`motivoConsulta`** por defecto: constante de dominio `MOTIVO_CONSULTA_INICIAL` = `"Pendiente de captura en primera consulta"`. |
| D-4 | **Factory** en `expediente/domain/factory/ExpedienteFactory`; recibe `folio` y `fecha` (del alta) como parámetros. |
| D-5 | **Auditoría de apertura** en la MISMA transacción del alta (método nuevo, no `REQUIRES_NEW`); actor = operador. |

---

## 1. Brecha documental

La brecha completa está en `gap-report-creacion-expediente-alta.md`. Resumen:

| ID | Tipo | Brecha |
| :-- | :-- | :-- |
| GAP-EXP-01 | MISSING | No existe `CrearExpedienteUseCase` ni método de creación en `ExpedienteRepositoryPort`. |
| GAP-EXP-02 | MISSING | `PacienteApplicationService.crear` no crea el expediente en la transacción del alta. |
| GAP-EXP-03 | PARTIAL | No hay factory de "expediente mínimo" (satisfacer `motivo_consulta NOT NULL` + JSONB NOT NULL). |
| GAP-EXP-04 | MISSING | No hay generador de folio. |
| GAP-EXP-05 | MISSING | La apertura no queda en `auditoria_expediente`. |
| GAP-EXP-06 | MISSING | Sin tests de alta ⇒ expediente. |
| GAP-EXP-07 | PARTIAL | Frontend: guardado fallido borra `record` en memoria; `obtenerExpediente` confunde 404 con 500. |

---

## 2. Modelo de datos

### 2.1 Migración nueva — `V30__secuencia_folio_expediente.sql`

```sql
-- Secuencia numérica de folio para expedientes clínicos.
CREATE SEQUENCE IF NOT EXISTS seq_expediente_folio;

-- Backfill: el primer nextval() será MAX(número de folio)+1.
-- Semilla actual: EXP-0001..EXP-0004  ⇒  primer folio nuevo = EXP-0005.
SELECT setval(
    'seq_expediente_folio',
    COALESCE(
        (SELECT MAX((substring(folio FROM 5))::bigint)
           FROM expedientes_clinicos
          WHERE folio ~ '^EXP-[0-9]+$'),
        0
    ),
    true
);
```

### 2.2 Columnas que debe satisfacer el expediente mínimo

| Columna | Restricción | Valor en alta |
| :-- | :-- | :-- |
| `id` | PK NOT NULL | `exp-` + UUID corto |
| `paciente_id` | NOT NULL FK | id del paciente creado |
| `terapeuta_asignado_id` | nullable FK | `terapeutaId` resuelto (puede ser `null`) |
| `motivo_consulta` | TEXT NOT NULL | `MOTIVO_CONSULTA_INICIAL` |
| `estatus_expediente` | nullable DEFAULT 'ACTIVO' + CHECK | `ACTIVO` (seteo explícito) |
| `modalidad` | VARCHAR(10), CHECK presencial/online | `presencial` |
| `tipo_expediente` | VARCHAR(15), CHECK fisico/electronico/mixto | `electronico` |
| `fecha_inicio` / `fecha_apertura` | DATE | fecha del alta (`LocalDate.now()`) |
| `folio` | VARCHAR(30), índice único parcial | secuencia `EXP-%04d` |
| `esquema_farmacologico`, `farmacos_esquema`, `drogas_esquema`, `historial_farmacos`, `historial_psicofarmacos`, `historial_drogas` | JSONB NOT NULL DEFAULT `'[]'` | `[]` |
| `antecedentes` | JSONB NOT NULL DEFAULT `'{}'` | `{}` |

> Nota: aunque las columnas JSONB tienen `DEFAULT` en BD, **Hibernate envía `null`** si el builder no las setea (ignora el `DEFAULT`). La factory debe fijarlas explícitamente. `examen_mental` es nullable (opcional).

---

## 3. Backend (hexagonal)

### 3.1 Dominio — `ExpedienteFactory`

`expediente/domain/factory/ExpedienteFactory.java` (nuevo):

- Constante pública `MOTIVO_CONSULTA_INICIAL = "Pendiente de captura en primera consulta"`.
- Método `Expediente crearMinimo(String pacienteId, String terapeutaAsignadoId, String folio, LocalDate fecha)` que construye el expediente con los valores de §2.2 (JSONB vacíos, `estatus='ACTIVO'`, `modalidad='presencial'`, `tipoExpediente='electronico'`, `fechaInicio=fechaApertura=fecha`).
- Genera `id = "exp-" + UUID.randomUUID().toString().substring(0, 8)`.
- **Nota de dominio**: la columna `esquema_farmacologico` se mapea al campo de dominio `drugsList` (`List<Drug>`), no a un campo `esquemaFarmacologico`; la factory setea `drugsList` vacío (el resto de JSONB sí se llama igual en dominio y BD).
- El dominio **no** llama a `nextval`: recibe `folio` ya formateado.

### 3.2 Puerto de entrada — `CrearExpedienteUseCase`

`expediente/application/ports/in/CrearExpedienteUseCase.java` (nuevo):

```text
Expediente crear(String pacienteId, String terapeutaId, String operadorId);
```

- **Idempotente**: si ya existe expediente para `pacienteId` → devolver el existente (sin excepción).
- `operadorId` = operador autenticado (`identidadTerapeutaPort.sub()`), **no** el `usuarioId` del paciente; se usa como actor de la auditoría de apertura.

### 3.3 Puerto de salida — `ExpedienteRepositoryPort`

Ampliar `expediente/application/ports/out/ExpedienteRepositoryPort.java`:

```text
boolean existsByPacienteId(String pacienteId);
String  siguienteFolio();
```

### 3.4 Persistencia — adaptador y repositorio

`expediente/infrastructure/adapters/out/persistence/repository/SpringDataExpedienteRepository.java`:

- `boolean existsByPacienteId(String pacienteId)` (derived query).
- Folio: query nativa
  ```sql
  SELECT 'EXP-' || lpad(nextval('seq_expediente_folio')::text, 4, '0')
  ```

`ExpedientePersistenceAdapter.java`: implementar ambos métodos delegando al repositorio.

### 3.5 Caso de uso — `ExpedienteApplicationService`

Implementar `CrearExpedienteUseCase` con `@Transactional`:

1. Si `expedienteRepositoryPort.existsByPacienteId(pacienteId)` → retornar `obtenerPorPaciente(pacienteId)` (idempotencia).
2. `folio = expedienteRepositoryPort.siguienteFolio()`.
3. `expediente = ExpedienteFactory.crearMinimo(pacienteId, terapeutaId, folio, LocalDate.now())`.
4. `expedienteRepositoryPort.save(expediente)`.
5. Registrar apertura con `auditoriaExpedientePort.registrarEnMismaTransaccion(pacienteId, operadorId, "Apertura de expediente", "...", "expediente")` — ver §3.6.
6. Retornar el expediente guardado.

> Concurrencia: el backstop es el índice único `ux_expedientes_paciente`. Ante `DataIntegrityViolationException` (23505) la transacción se marca rollback-only y **no** se recupera dentro del mismo `@Transactional`; la idempotencia real es el pre-chequeo `existsByPacienteId`.

### 3.6 Auditoría — `AuditoriaExpedientePort`

El método actual `registrar(...)` usa `Propagation.REQUIRES_NEW`; **no** puede usarse en el alta (FK/deadlock sobre `pacientes` aún no commiteada). Añadir:

```text
void registrarEnMismaTransaccion(String pacienteId, String usuarioId,
                                 String accion, String detalle, String categoria);
```

- Implementación con propagación `REQUIRED` (participa de la transacción del alta).
- El actor es un `usuarios.id` ya existente (`operadorId`), por lo que la FK a `usuarios` no es problema.
- **Javadoc obligatorio** del método nuevo: explicar que usa `REQUIRED` (participa de la transacción del alta), en contraste con `registrar(...)` que usa `REQUIRES_NEW` (traza que debe sobrevivir a rollbacks en `actualizar`). Documentar `@param`/`@return` de `pacienteId`, `usuarioId`, `accion`, `detalle`, `categoria`.

### 3.7 Wiring — `PacienteApplicationService.crear`

Inyectar `CrearExpedienteUseCase` y, tras `pacienteRepositoryPort.save(nuevoPaciente)` y antes de generar la contraseña temporal:

```text
crearExpedienteUseCase.crear(guardado.getId(), guardado.getTerapeutaId(), identidadTerapeutaPort.sub());
```

- `guardado.getTerapeutaId()` puede ser `null` (admin/asistente sin `therapistId`); la columna lo tolera.
- Todo queda en la misma `@Transactional` → atomicidad (paciente + expediente + credencial).

> Nota de arquitectura: `PacienteApplicationService` (contexto `paciente`) dependerá del puerto de entrada de `expediente`. Hoy es seguro (único contexto Spring, sin `@ComponentScan` acotado); queda documentado el acoplamiento `paciente ↔ expediente` por si en el futuro se particiona (Spring Modulith).

---

## 4. Frontend (GAP-EXP-07)

### 4.1 Adaptador HTTP — `expediente-http.adapter.ts`

- Imports nuevos: `throwError` (`rxjs`) y `HttpErrorResponse` (`@angular/common/http`).
- `obtenerExpediente(pacienteId)` — mantiene `Observable<ClinicalRecord | null>`:
  - `err.status === 404` → `of(null)` (paciente sin expediente, legítimo).
  - cualquier otro error (500/red, `status === 0`) → `throwError(() => err)`.
- `actualizarExpediente(pacienteId, datos)` — pasa a `Observable<ClinicalRecord>`:
  - **eliminar** `catchError(() => of(null))`; propagar el error.

### 4.2 Puerto — `expediente.repository.ts`

- `obtenerExpediente`: sin cambios (`Observable<ClinicalRecord | null>`).
- `actualizarExpediente`: `Observable<ClinicalRecord>` (sin `| null`).

### 4.3 Adaptador LocalStorage — `expediente-localstorage.adapter.ts`

- **Sí se ve afectado**: hoy su `actualizarExpediente` devuelve `Observable<ClinicalRecord | null>` (delega en `obtenerExpediente`). Debe actualizarse a `Observable<ClinicalRecord>` (resolver el `null`: devolver el registro existente o lanzar si no existe).

### 4.4 Componente — `expediente-clinico.component.ts`

- Callbacks de **guardado** de `actualizarExpediente` (7 sitios): `guardarDx`, `guardarExpedientePsiquiatrico`, `guardarDatosGenerales`, `guardarAntecedentes`, `guardarRiesgo`, `guardarExamen`, `guardarFicha`. Sustituir `subscribe(r => this.record = r)` por:
  ```text
  subscribe({ next: r => { if (r) this.record = r; }, error: () => alert('No se pudo guardar el expediente.') })
  ```
- En `guardarFicha`, la suscripción anidada de `guardarTratamientosPrevios` también necesita `error:` handler (hoy es silenciosa).
- **Carga** (`cargarDatos` / `obtenerExpediente`): NO aplicar `if (r)` (el `null` es legítimo), pero **sí** añadir `error:` handler a la suscripción para que un 500/red no quede sin manejar.
- Feedback consistente con el resto del componente (`alert(...)`).

---

## 5. Verificación

- **Backend**: compilación limpia (`mvn`); arranque con Flyway aplicando `V30`.
- **API**:
  1. `POST /pacientes` → 200 y, en la misma transacción, fila en `expedientes_clinicos`.
  2. `GET /expedientes/paciente/{id}` del nuevo paciente → **200** (no 404) con defaults.
  3. `PATCH /expedientes/paciente/{id}` → guarda correctamente.
  4. `auditoria_expediente` → una fila de apertura con actor = operador.
  5. Folio incremental: siguiente alta → `EXP-0006`, etc.
- **Idempotencia**: reintentar alta del mismo paciente no duplica el expediente.
- **Frontend**: `ng build` limpio; al fallar un guardado no se pierde `record` en pantalla y se muestra aviso.
- **E2E**: extender/añadir caso para alta de paciente ⇒ expediente editable; regresión de tabs.

---

## 6. Riesgos y observaciones

1. **`terapeutaId` null**: para admin/asistente sin `therapistId`, el expediente queda sin terapeuta asignado (columna nullable). No rompe; es un dato que se completa después.
2. **Folio con Hibernate**: no confiar en `DEFAULT` de BD; el folio se setea explícitamente antes del `save`.
3. **`guardarTratamientosPrevios` y JSONB**: los arrays se fijan en la factory, no en el adapter, para que la invariante sea de dominio (defense-in-depth; `ExpedientePersistenceMapper.toJpaEntity` ya defaultea los JSONB a `[]`/`{}`).
4. **`examen_mental`**: nullable; no se inicializa en el alta (se completa en Historia Clínica).
5. **Acoplamiento `paciente ↔ expediente`**: documentado en §3.7; a vigilar si se particiona en contextos.
6. **Semilla existente**: los IDs `exp-001..004` y folios `EXP-0001..EXP-0004` no pasan por `POST /pacientes`; no se ven afectados ni duplicados.
7. **Huecos de folio**: `nextval()` no es transaccional; si el alta hace rollback, el número de folio se "quema" (p. ej. saltar de `EXP-0005` a `EXP-0007`). Aceptable para la demo.
8. **Campo de dominio vs columna**: `esquema_farmacologico` (BD) ↔ `drugsList` (dominio); la factory setea `drugsList` vacío.
9. **`obtenerPorPaciente` dentro de `crear`** (auto-invocación): el `@Transactional(readOnly=true)` se ignora en auto-invocación; sin impacto funcional.

---

## 7. Estado documental

- [x] Gap-analysis (`gap-report-creacion-expediente-alta.md`)
- [x] Especificación backend (sección 3)
- [x] Especificación frontend (sección 4)
- [x] Auditoría por `jarvis-database`, `jarvis-backend` y `jarvis-frontend`
- [ ] Implementación
- [ ] E2E y reporte
