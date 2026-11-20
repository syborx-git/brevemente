# GAP Analysis Report: Creación Automática del Expediente en el Alta del Paciente

- **Fecha**: 2026-11-20
- **Rama**: `feature/jp-analisis-brechas-seguridad`
- **Alcance**: Contexto `paciente` + `expediente` (backend hexagonal) y componente `expediente-clinico` (frontend Angular)
- **Estado**: AUDITADO (READ-ONLY)
- **Decisión adoptada**: **Opción 1 — crear el expediente automáticamente en el alta del paciente** (no "bajo demanda" en GET).

---

## 1. Contexto y problema

Al dar de alta un paciente (`POST /pacientes`), **no se crea su expediente clínico**. El expediente (`expedientes_clinicos`, relación 1:1 con el paciente) solo existe para los pacientes de semilla (`exp-001..exp-004`).

Consecuencias observadas en el flujo normal del terapeuta:

1. `GET /expedientes/paciente/{id}` responde **404** (`ExpedienteNotFoundException`).
2. El frontend (`expediente-clinico`) convierte ese 404 en `record = null`.
3. Los tabs **DX Estratégico**, **Tratamiento Psiquiátrico**, **Historia Clínica** y **Ficha de Identificación** aparecen **completamente vacíos**.
4. Al intentar guardar, `PATCH /expedientes/paciente/{id}` también responde **404** y el frontend falla **en silencio** (mapea el error a `null`).

La causa raíz: el contexto `expediente` solo expone `obtenerPorPaciente` y `actualizar`; **no existe ningún caso de uso de creación**, y `PacienteApplicationService.crear` no lo invoca.

---

## 2. Estado actual verificado

| Elemento | Estado |
| :--- | :--- |
| `ExpedienteRepositoryPort` | Solo `findByPacienteId(...)` y `save(...)`. No hay `existsByPacienteId` ni semántica de creación. |
| `ExpedienteApplicationService` | Implementa `ObtenerExpedienteUseCase` y `ActualizarExpedienteUseCase`. Sin `CrearExpedienteUseCase`. |
| `PacienteApplicationService.crear` | Guarda identidad (`usuarios`), paciente y genera contraseña temporal. **No crea expediente**. |
| `ExpedienteRestController` | Solo `GET/PATCH /paciente/{id}` + tratamientos previos + sesiones. Sin `POST`. |
| Esquema `expedientes_clinicos` | `motivo_consulta TEXT NOT NULL`; columnas JSONB NOT NULL con `DEFAULT '[]'/'{}'` (`esquema_farmacologico`, `farmacos_esquema`, `drogas_esquema`, `historial_farmacos`, `historial_psicofarmacos`, `historial_drogas`, `antecedentes`); `estatus_expediente` nullable con `DEFAULT 'ACTIVO'` + CHECK (V7); `modalidad VARCHAR(10)` sin DEFAULT (debe setearse); `terapeuta_asignado_id` nullable. |
| Folio | Índice único parcial `ux_expedientes_folio` (WHERE folio IS NOT NULL). Semilla hardcodea `EXP-0001..0004`. |
| Frontend | `obtenerExpediente()` mapea **todo** error → `null` (confunde 404 con 500/red); `actualizarExpediente()` mapea error → `null` (fallo silencioso y `record=null`). |

---

## 3. Matriz de brechas (GAP-EXP)

| ID | Tipo | Brecha | Impacto | Acción propuesta |
| :--- | :--- | :--- | :--- | :--- |
| GAP-EXP-01 | MISSING | No existe `CrearExpedienteUseCase` ni un método de creación en el puerto de salida (`ExpedienteRepositoryPort`). | No hay forma de abrir un expediente desde el dominio. | Crear `CrearExpedienteUseCase` (puerto de entrada) e implementarlo en `ExpedienteApplicationService`. Ampliar `ExpedienteRepositoryPort` con `existsByPacienteId(String)` y `siguienteFolio()`. Idempotencia: pre-chequeo `existsByPacienteId` (si existe → devolver el existente). El índice único `ux_expedientes_paciente` es el backstop: ante `DataIntegrityViolationException` (23505) la transacción se marca rollback-only y **no** se puede recuperar dentro del mismo `@Transactional`. |
| GAP-EXP-02 | MISSING | `PacienteApplicationService.crear` no crea el expediente en la misma transacción del alta. | Todo paciente nuevo queda sin expediente (404 en lectura y escritura). | Invocar el nuevo caso de uso de creación dentro de `crear(...)`, tras `pacienteRepositoryPort.save`, en la misma `@Transactional`. |
| GAP-EXP-03 | PARTIAL | No hay factory de "expediente mínimo". El inserto debe satisfacer `motivo_consulta NOT NULL` y las columnas JSONB NOT NULL (Hibernate envía `null` si el builder no las setea, ignorando el `DEFAULT` de BD). | Si no se rellenan defaults, el `save` fallará por violación de NOT NULL. | Crear `ExpedienteFactory` en **domain** que reciba `folio` y `fecha` como parámetros (el dominio no llama a `nextval`) y genere: `id=exp-<uuid>`, `motivoConsulta` = constante de dominio `MOTIVO_CONSULTA_INICIAL`, `estatusExpediente='ACTIVO'` (seteo explícito: Hibernate pisa el `DEFAULT` de BD con `NULL`), `modalidad='presencial'`, `tipoExpediente='electronico'`, `fechaApertura=fechaInicio` (fecha recibida del alta = `LocalDate.now()`), `terapeutaAsignadoId` (nullable) y JSONB vacíos. Nota: `ExpedientePersistenceMapper.toJpaEntity` ya defaultea los JSONB a `[]`/`{}`, pero la factory debe fijarlos por invariante de dominio. |
| GAP-EXP-04 | MISSING | No existe estrategia de generación de **folio**. La semilla usa valores fijos `EXP-0001..0004`. | Riesgo de colisión si se asignan folios a mano; sin estandarización. | Generador de folio **con secuencia PostgreSQL** (`CREATE SEQUENCE seq_expediente_folio` + `setval` backfill), formato `EXP-%04d`. Descartar `MAX(folio)+1` (comparación lexicográfica y carreras bajo READ COMMITTED). Migración `V30__secuencia_folio_expediente.sql`. |
| GAP-EXP-05 | MISSING | El evento de **apertura de expediente** no queda en auditoría clínica. | No hay trazabilidad de "quién/cuándo se abrió el expediente". | Registrar en `auditoria_expediente` la apertura **en la MISMA transacción** del alta (acción "Apertura de expediente", actor = `operadorId` = `identidadTerapeutaPort.sub()`, **no** el `usuarioId` del paciente). ⚠️ No reutilizar `AuditoriaExpedientePort.registrar` tal cual: usa `Propagation.REQUIRES_NEW` y rompería el alta por FK/deadlock sobre `pacientes` aún no commiteada. Añadir método nuevo al puerto (p. ej. `registrarEnMismaTransaccion(...)`) con `REQUIRED`, o registrar post-commit. |
| GAP-EXP-06 | MISSING | Sin cobertura de tests para el alta con expediente (unidad/integración). | Regresión no detectada. | Añadir test de integración: `POST /pacientes` ⇒ existe fila en `expedientes_clinicos` con `paciente_id`, `terapeuta_asignado_id` y defaults correctos. |
| GAP-EXP-07 | PARTIAL | Frontend: `actualizarExpediente()` mapea error → `null`, y el componente hace `this.record = null` al fallar un PATCH (borra el expediente en memoria). `obtenerExpediente()` confunde 404 con errores 500/red. | Pérdida de datos en pantalla y fallo sin feedback al guardar. | Accionable: propagar el error en `actualizarExpediente` (no `of(null)`; el tipo pasa a `Observable<ClinicalRecord>`); distinguir 404 (→ `null`) de otros fallos en `obtenerExpediente`; aplicar `if (r) this.record = r` **solo en los callbacks de guardado** (no en `cargarDatos`, donde `null` es legítimo) y añadir `error:` con aviso. Solo aplica al adapter HTTP; el `localstorage.adapter` no se ve afectado. |

---

## 4. Diseño propuesto (Opción 1 — alta automática)

Flujo objetivo dentro de `PacienteApplicationService.crear` (misma transacción):

```text
1. validar CURP/RFC + resolverTerapeuta + calcular edad/consentimiento
2. crear identidad de acceso (usuarios + usuario_roles)          [existente]
3. pacienteRepositoryPort.save(nuevoPaciente)                    [existente]
4. crearExpedienteUseCase.crear(pacienteId, terapeutaId, operadorId)  [NUEVO]  // operadorId = identidadTerapeutaPort.sub()
5. generarPasswordTemporalUseCase.generarPasswordTemporal(...)    [existente]
6. retornar PacienteCreado(paciente, passwordTemporal)
```

Contrato del nuevo caso de uso:

```text
CrearExpedienteUseCase.crear(String pacienteId, String terapeutaId, String operadorId) : Expediente
```

Valores mínimos del expediente creado:

| Campo | Valor |
| :--- | :--- |
| `id` | `exp-` + UUID corto |
| `pacienteId` | id del paciente recién creado |
| `terapeutaAsignadoId` | terapeuta resuelto en el alta (puede ser `null` para admin/asistente sin `therapistId`) |
| `motivoConsulta` | constante de dominio `MOTIVO_CONSULTA_INICIAL` = `"Pendiente de captura en primera consulta"` |
| `estatusExpediente` | `ACTIVO` (seteo explícito) |
| `modalidad` | `presencial` |
| `tipoExpediente` | `electronico` |
| `fechaInicio` / `fechaApertura` | fecha del alta (`LocalDate.now()`) |
| `esquemaFarmacologico`, `farmacosEsquema`, `drogasEsquema`, `historialFarmacos`, `historialPsicofarmacos`, `historialDrogas` | `[]` |
| `antecedentes` | `{}` |
| `folio` | generado por secuencia `seq_expediente_folio`, formato `EXP-%04d` (pasado al factory como parámetro) |

### Decisiones confirmadas
1. **Folio**: se genera **automáticamente en el alta** del paciente, con **secuencia PostgreSQL** (`EXP-%04d`).
2. **`motivoConsulta` por defecto**: texto fijo `"Pendiente de captura en primera consulta"` (constante de dominio).
3. **Factory**: en `expediente/domain/factory/ExpedienteFactory`; recibe `folio` y `fecha` (del alta = `LocalDate.now()`) como parámetros; fija `tipoExpediente='electronico'`.
4. **Auditoría de apertura**: en la misma transacción del alta (método nuevo `registrarEnMismaTransaccion`, no `REQUIRES_NEW`); actor = `operadorId` = `identidadTerapeutaPort.sub()`.

> Nota de arquitectura: `PacienteApplicationService` (contexto `paciente`) dependerá del puerto de entrada de `expediente`. Hoy es seguro (único contexto Spring, sin `@ComponentScan` acotado), pero queda documentado el acoplamiento `paciente ↔ expediente` por si en el futuro se particiona en contextos (Spring Modulith).

---

## 5. Criterios de aceptación

- [ ] `POST /pacientes` crea, en la misma transacción, la fila del paciente **y** su expediente.
- [ ] `GET /expedientes/paciente/{id}` de un paciente recién dado de alta responde **200** (no 404) con los defaults.
- [ ] Los 4 tabs (DX, Psiquiatría, Historia Clínica, Ficha) abren **editables** sobre el expediente nuevo.
- [ ] `PATCH /expedientes/paciente/{id}` guarda correctamente sobre el expediente recién creado.
- [ ] Queda registro en `auditoria_expediente` de la apertura (una sola vez).
- [ ] Idempotencia: no se duplica el expediente si el alta se reintenta (`existsByPacienteId`; el 23505 se trata como rollback).
- [ ] El folio generado es visible en la cabecera y en "Número de Expediente".
- [ ] Tests: alta ⇒ expediente existe; no se duplica al repetir; auditoría registrada.

---

## 6. Siguientes pasos

1. Implementar backend: `CrearExpedienteUseCase` + `ExpedienteFactory` (domain) + ampliar `ExpedienteRepositoryPort` (`existsByPacienteId`, `siguienteFolio`) + wiring en `PacienteApplicationService.crear`.
2. Migración Flyway `V30__secuencia_folio_expediente.sql` (`CREATE SEQUENCE seq_expediente_folio` + `setval` backfill al entero `4` → primer folio `EXP-0005`).
3. Auditoría de apertura en la misma transacción (nuevo método `registrarEnMismaTransaccion` en `AuditoriaExpedientePort`, actor `operadorId`).
4. Frontend (GAP-EXP-07): propagar errores en `actualizarExpediente`; distinguir 404 de otros fallos en `obtenerExpediente`; `if (r)` solo en callbacks de guardado + aviso de error.
5. Test de integración del alta con expediente + idempotencia.
6. Verificación API (alta ⇒ GET 200) y frontend (tabs editables).
