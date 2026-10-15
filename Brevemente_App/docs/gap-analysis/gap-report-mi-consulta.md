# GAP Analysis Report: Módulo Mi Consulta

- **Fecha**: 2026-10-15
- **Módulo**: `mi-consulta` (Angular) vs demo `MiConsulta` (React)
- **Estado**: AUDITADO (READ-ONLY)

---

## 0. Hallazgo Principal y Decisión de Enfoque

**Desajuste de concepto** entre la demo y la implementación Angular:

| Fuente | Qué es |
| :--- | :--- |
| Demo React `brevemente_demo/src/pages/MiConsulta.tsx` | **Workspace operativo diario**: próxima sesión, agenda de hoy, alertas de riesgo, solicitudes de supervisión, borradores LEVA. |
| Angular `src/app/modules/mi-consulta/` | **Formulario de configuración** del terapeuta: perfil profesional, honorarios, reglas de admisión. |

**Decisión de enfoque (confirmada por producto):**

1. `mi-consulta` se **redefine y consolida como módulo de Configuración del Terapeuta**: perfil profesional, **honorarios**, **consultorios/sedes**, reglas de admisión. Se **mantiene y enriquece**.
2. **No se crea un "workspace operativo" separado**: los bloques operativos de la demo ya están cubiertos por otros módulos (Dashboard, Agenda, Supervisión, Expedientes, LEVA). Crear un workspace duplicaría información y fragmentaría la experiencia.
3. La **máquina de estados de sesión** (única pieza "huérfana" de la demo) se evalúa a futuro **dentro de Expedientes**, no en `mi-consulta`.

---

## 1. Inventario de Componentes Auditados

### 1.1 Frontend Angular (actual)
- `src/app/modules/mi-consulta/mi-consulta.component.ts` — componente con `ConsultaConfig` + `guardar()`; selección de adapter vía `useFactory` en el propio componente (`deps: [HttpClient]`).
- `mi-consulta.component.html` — formulario: Datos del Profesional, Parámetros de Sesión y Honorarios, Reglas de Admisión.
- `ports/mi-consulta.repository.ts` — `ConsultaConfig` + `obtenerConfig()` / `guardarConfig()`.
- `adapters/mi-consulta-http.adapter.ts` — `GET/PUT /api/v1/mi-consulta`.
- `adapters/mi-consulta-localstorage.adapter.ts` — mock `brevemente_consulta_config`.
- Feature flag: `environment.ts` → `miConsultaBackend: false` (dev); `environment.prod.ts` → `true`.

**Contrato `ConsultaConfig` (9 campos):**
`therapistName`, `license`, `specialty`, `email`, `phone`, `defaultSessionDuration`, `costoPrimeraSesion`, `costoSeguimiento`, `edadMinimaAtencion`.

⚠️ **Hallazgos frontend:**
- `phone` existe en el contrato y en el mock, pero **NO está renderizado en el formulario** (nunca se captura). El formulario renderiza 8 inputs (los 9 menos `phone`).
- `guardar()` no maneja errores (`subscribe` sin `error`) y la notificación dice "Cambios guardados en LocalStorage" aunque en prod use el adapter HTTP (mensaje falso).

### 1.2 Demo React (oráculo)
`brevemente_demo/src/pages/MiConsulta.tsx` con bloques:
1. **Cabecera**: título por rol + nombre de terapeuta + badge "Sede Centro".
2. **Próxima Sesión Clínico-Estratégica**: máquina de estados simulada `por_iniciar | en_curso | finalizada | nota_pendiente`; ficha del paciente (motivo/protocolo, sesión #N, estado); parámetros de admisión (Intake COMPLETO, Consentimiento FIRMADO, LEVA HABILITADA); botón de acción dinámico.
3. **Agenda de Hoy**: citas del terapeuta para el día (hora, paciente, tipo • modalidad • duración, estado).
4. **Requieren Atención Urgente**: alertas de riesgo activas + solicitudes de supervisión pendientes; botones "Resolver Caso →" / "Atender Solicitud →"; modales `CrisisResolutionModal` y `CrisisIncidentDetailModal`.
5. **Borradores de LEVA Pendientes**: sugerencias de nota de LEVA.
6. **Información Secundaria** (acordeón): Supervisiones Solicitadas, Mi Capacitación Pendiente.

### 1.3 Backend Spring Boot + PostgreSQL
- **Tabla `terapeutas`** (V1 + V4): `id, usuario_id, cedula_profesional, especialidad, activo, created_at, updated_at`.
  > ⚠️ V4 **eliminó** `nombre, apellidos, email` de `terapeutas` (migraron a `usuarios`). `therapistName`/`email` se resuelven por JOIN `usuarios` vía `usuario_id`, o `GET /auth/me`.
- **`cita`**: `CitaRestController` → `GET/POST /citas`, `PATCH /citas/{id}`, `PATCH /citas/{id}/estado`; `DiaNoLaborableRestController` → `GET/POST/DELETE /dias-no-laborables`.
- **`supervision`**: `SupervisionRestController` → `GET/POST/DELETE /supervision/bitacoras`, `GET/POST /supervision/solicitudes`, `PATCH /supervision/solicitudes/{id}/atender`.
- **`expediente`**: `ExpedienteRestController` → `GET /expedientes/paciente/{id}`, `GET/POST /expedientes/paciente/{id}/sesiones`, `PATCH /expedientes/paciente/{id}`; `ConsentimientoRestController` → `POST /pacientes/{id}/consentimiento/firmar`.
- **`dashboard`** (reutilizable): `citas-hoy`, `accion-dominante`, `alertas`, `pacientes-recientes`, etc.
- **`auth`**: `GET /auth/me` — fuente de identidad (`terapeutaIds` en el JWT).
- **Tabla `sesiones`** (V7): `status IN ('borrador','validado')` (no la máquina de estados de la demo).
- **No existe** ningún controller/endpoint `mi-consulta` **ni** controller REST de `terapeutas` (la única exposición actual de terapeutas es `GET /dashboard/catalogos`).

---

## 2. Matriz de Reutilización de Código Existente

| Componente Backend | Estado Actual | Estrategia SDOP |
| :--- | :--- | :--- |
| Tabla `terapeutas` (V1+V4) | Existe (`cedula_profesional`, `especialidad`, `usuario_id`) | **Extender** con columnas de configuración (V13) |
| Tabla `usuarios` (V4) | Existe (`nombre`, `apellidos`, `email`) | **Fuente de identidad** para `therapistName`/`email` (no duplicar en `terapeutas`) |
| `GET /auth/me` | Existe (`terapeutaIds` en JWT) | **Reutilizar** para resolver el terapeuta actual |
| `SpringDataTerapeutaRepository` | Existe | **Reutilizar/adaptar** para CRUD del perfil |
| Tabla `sedes` (V11) | Existe (catálogo global) | **Vincular al terapeuta** vía relación M2M (mejora futura) |
| Controller `terapeutas` | **No existe** | **Crear** controller de configuración |
| `cita` / `dashboard` / `supervision` / `expediente` | Existen | **No tocar en este módulo** (pertenecen a sus propios módulos) |

---

## 3. Matriz de Brechas (GAPs) Identificadas

| ID | Tipo | Descripción | Impacto | Acción Propuesta |
| :--- | :--- | :--- | :--- | :--- |
| GAP-MC-01 | MISSING | No existe endpoint de configuración (`GET/PUT /api/v1/mi-consulta`). El adapter HTTP lo llama; en prod (`miConsultaBackend: true`) daría 404. | Alto | Crear controller + service de configuración del terapeuta |
| GAP-MC-02 | DECISIÓN | Desajuste conceptual demo=workspace vs Angular=config. | Resuelto | `mi-consulta` = módulo de Configuración del Terapeuta (no workspace) |
| GAP-MC-03 | PARTIAL | `terapeutas` no tiene `telefono`, `duracion_sesion_default`, `costo_primera_sesion`, `costo_seguimiento`, `edad_minima_atencion`. | Alto | Migración Flyway `V13__extend_terapeutas_config.sql` |
| GAP-MC-04 | MISSING | Consultorios/sedes **por terapeuta** no existen (hoy `sedes` es catálogo global). | Medio | Modelar M2M `terapeuta_sedes` (mejora futura) |
| GAP-MC-05 | CONTRACT | `ConsultaConfig` mezcla identidad (`therapistName`, `email`) con perfil (`license`, `specialty`) y configuración (costos, duración, edad, teléfono). | Medio | Separar fuentes: identidad/perfil desde `usuarios`/`auth/me`+`terapeutas`; configuración desde el nuevo endpoint |
| GAP-MC-06 | DATA | No hay semilla para los nuevos campos de configuración. | Bajo | Backfill en `ter-001`/`ter-002` (patrón V4) |
| GAP-MC-07 | FRONTEND | `phone` existe en `ConsultaConfig` pero **no está en el formulario** (nunca se captura). | Medio | Añadir input `phone` + persistir |
| GAP-MC-08 | FRONTEND | `guardar()` sin manejo de errores; notificación hardcodeada "LocalStorage" (falsa en prod). | Medio | Añadir `error`/`loading` + mensaje dinámico según adapter |
| GAP-MC-09 | BACKEND | No existe controller REST de `terapeutas` (ni `/terapeutas/me`); no está definida la resolución del terapeuta a editar. `ux_terapeutas_usuario_id UNIQUE` (V4) limita a 1 perfil por usuario, por lo que el caso real es admin/supervisor (JWT con `terapeutaIds` vacío) que gestiona a otros vía `supervision_asignaciones`. | Alto | Definir endpoint de configuración con resolución explícita por `terapeutaId` (query/body) para admin/supervisor |

### Notas de integridad (DB) — insumos para V13

- **Tipos sugeridos**: `telefono VARCHAR(20)`, `duracion_sesion_default_min SMALLINT NOT NULL DEFAULT 50`, `costo_primera_sesion NUMERIC(10,2) NOT NULL DEFAULT 0`, `costo_seguimiento NUMERIC(10,2) NOT NULL DEFAULT 0`, `edad_minima_atencion SMALLINT NOT NULL DEFAULT 0`.
- **CHECKs** (convención `ck_terapeutas_*`): `ck_terapeutas_duracion` (`duracion_sesion_default_min BETWEEN 15 AND 240`); `ck_terapeutas_costos` (`costo_primera_sesion >= 0` y `costo_seguimiento >= 0`); `ck_terapeutas_edad_minima` (`edad_minima_atencion BETWEEN 0 AND 120`).
- **Backfill antes de `NOT NULL`** (patrón idempotente V4: UPDATE → assert de que no quedan `NULL` → SET NOT NULL).
- **M2M sedes**: `terapeuta_sedes(terapeuta_id VARCHAR(36) NOT NULL REFERENCES terapeutas(id) ON DELETE CASCADE, sede_id VARCHAR(36) NOT NULL REFERENCES sedes(id) ON DELETE CASCADE, es_principal BOOLEAN NOT NULL DEFAULT FALSE, activo BOOLEAN NOT NULL DEFAULT TRUE, PRIMARY KEY (terapeuta_id, sede_id))`.
  - Índice parcial único: `CREATE UNIQUE INDEX ux_terapeuta_sedes_principal ON terapeuta_sedes (terapeuta_id) WHERE es_principal = TRUE AND activo = TRUE` (al desactivar la sede principal debe hacerse `SET es_principal = FALSE`).
  - Índice de FK inversa: `idx_terapeuta_sedes_sede ON terapeuta_sedes (sede_id)`.
  - Nota: `activo` en el join duplica `sedes.activo`; definir cuál manda (se sugiere gestionar el vínculo activo/inactivo aquí).
- **`updated_at`**: sin trigger en el esquema; documentar que el PUT de configuración lo actualiza.
- **Moneda**: plataforma moneda única (MXN); no requiere columna `moneda` (salvo decisión futura multi-moneda).

### Fuera de alcance (no pertenecen a este módulo)

| Item de la demo | Dónde vive en Angular |
| :--- | :--- |
| Máquina de estados de sesión (`por_iniciar/en_curso/finalizada/nota_pendiente`) | **Expedientes** (futuro) |
| Agenda de Hoy | **Agenda** + Dashboard |
| Requieren Atención Urgente (alertas + solicitudes) | **Dashboard** + **Supervisión** |
| Borradores de LEVA | **LEVA** (asistente-leva) |
| Información Secundaria (capacitación) | Futuro (no existe aún) |

---

## 4. Recomendaciones para demo-gap-implementation

1. **Redefinir `mi-consulta` como "Configuración del Terapeuta"**: renombrar la vista (label del sidebar) y ampliar el formulario (honorarios, teléfono, consultorios/sedes, reglas de admisión).
2. **GAP-MC-01/09** → crear `MiConsultaRestController` (o `TerapeutaConfigRestController`) con `GET/PUT`. Resolver el terapeuta: para roles terapeuta desde `terapeutaIds` (JWT, 0 o 1); para admin/supervisor (JWT con `terapeutaIds` vacío) aceptar un parámetro explícito `terapeutaId` (query/body).
3. **GAP-MC-05** → separar fuentes: identidad (`therapistName`, `email`) desde `usuarios`/`auth/me`; perfil (`license`, `specialty`) y configuración (costos, duración, edad, teléfono) desde `terapeutas` + nuevo endpoint.
4. **GAP-MC-03** → migración `V13__extend_terapeutas_config.sql` (tipos y CHECKs de la sección 3; backfill antes de `NOT NULL`).
5. **GAP-MC-06** → semilla/backfill de configuración para `ter-001`/`ter-002`.
6. **GAP-MC-07/08** → añadir input `phone`, manejo de errores y notificación dinámica en el formulario.
7. **GAP-MC-04** → modelar M2M `terapeuta_sedes` (mejora futura).
8. **Fuera de alcance**: workspace operativo, máquina de estados de sesión (→ Expedientes), borradores LEVA (→ LEVA), capacitación (→ futuro).

> Nota: este informe es **solo lectura**; no se modificó código. El único artefacto generado es este documento.
