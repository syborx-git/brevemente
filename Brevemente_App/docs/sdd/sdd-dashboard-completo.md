# SDD-005: Dashboard — Paridad completa con la demo React (Centro de Control + vistas por rol)

- **Módulo**: `dashboard` (Centro de Control + vistas paciente/alumno)
- **Código SDD**: `SDD-005`
- **Versión**: 1.1.0 *(reconciliado tras auditoría de paridad demo↔SDD↔Angular)*
- **Fecha**: 2026-10-13
- **Estado**: DISEÑADO Y RECONCILIADO — réplica fiel de `brevemente_demo/src/pages/Dashboard.tsx`
- **Alineación Normativa**: ADR-001 (Hexagonal/SDOP), ADR-002 (Dual Adapters), ADR-003 (Flyway), `gap-report-dashboard.md` (GAP-DASH-01..10), `gap-report-dashboard-roles.md` (GAP-ROLE-01..06), `sdd-dashboard.md` (SDD-003), `sdd-dashboard-roles.md` (SDD-004)

> **Objetivo**: que el dashboard Angular se vea y comporte **exactamente igual** a la demo React, reemplazando la versión mínima actual. El scoping por rol (SDD-004) se conserva.

> **Decisiones de equipo (vigentes)**:
> 1. **NO** selector de doctor independiente (demo-only): el filtro por terapeuta se integra en la barra de filtros.
> 2. **NO** botón "Demo Guiada". El botón **LEVA** ya existe.
> 3. **SE RETIRAN** del Angular actual los elementos que **no existen en la demo**: card "Alertas Normativas" (`alertasConsentimiento`), banner "Alerta Prioritaria de Consentimiento Legal" y card "Pacientes con Actividad Reciente".
> 4. **SE MANTIENEN** "Nuevo Paciente" y "Agendar Cita".
> 5. Scoping por rol (SDD-004): terapeuta→propios, supervisor→asignados, asistente→operativo sin clínica, admin→global, multi-rol→unión.
> 6. **Gráficas en SVG puro** (sin `recharts`), consistente con SDD-003 §1.3.

---

## 0. Propósito y alcance

Portar a producción (Angular + Spring Boot + PostgreSQL) **todas** las zonas del `Dashboard.tsx` de la demo, incluidas las vistas por rol de paciente y alumno. Hoy el dashboard Angular es la "Fase inmediata" del SDD-003; este SDD incorpora el resto.

---

## 1. Inventario de paridad (demo → Angular actual → acción)

| Elemento demo | Angular actual | Acción |
| :--- | :--- | :--- |
| Cabecera: título **"Centro de Control BreveMente"** + icono `Shield` + subtítulo *"Visión ejecutiva de la operación clínica, las alertas y la efectividad general."* | ⚠️ "Panel Principal" + "Resumen operativo…" | ❌ reescribir |
| Badge **"Actualizado: {hace unos instantes}"** | ❌ | ❌ añadir |
| Botón **LEVA** en cabecera (→ `/leva`) | ⚠️ LEVA es flotante global, no en cabecera | ❌ añadir en cabecera |
| Botón "Demo Guiada" | 🚫 | 🚫 no se implementa |
| Botones "Nuevo Paciente"/"Agendar Cita" | ✅ | ✅ se mantienen |
| **Filtros**: modalidad, sede, periodo, terapeuta, protocolo + "Limpiar filtros" | ❌ | ❌ añadir |
| **Perspectiva Clínica Unificada** (selector + 3 gráficas) | ❌ | ❌ añadir |
| **Alerta Mayoría de Edad** (banner + tarjetas + "Ver Expediente") | ❌ | ❌ añadir |
| KPI 1 "Citas Programadas" (citas de HOY + "N confirmadas hoy" + "Clic para ver agenda") | ⚠️ subtexto "Agenda Activa" | ❌ corregir textos |
| KPI 2 "Pacientes Activos" (anillo + "Capacidad al X%") | ⚠️ sin anillo, subtexto "TBE en Curso" | ❌ añadir anillo |
| KPI 3 "Pendientes Clínicos" (barra + "Límite semanal: 5") | ❌ (hoy tiene "Alertas Normativas") | ❌ añadir |
| KPI 4 "Alertas de Riesgo" (semáforo + badge "REQUERIDO") | ❌ | ❌ añadir |
| **Acción Operativa Dominante** (próxima consulta + "Preparar Sesión") | ❌ (endpoint sí, UI no) | ❌ añadir |
| **Agenda del Día** (≤3, subtítulo "{tipo} • Presencial", status plano) | ⚠️ "Agenda Inmediata" ≤5 con badges | ❌ corregir |
| **Pendientes Prioritarios** (badge "Crítico") | ❌ (hoy "Pacientes Recientes") | ❌ reemplazar |
| **Drilldowns** (riesgo, consentimientos, pacientes, citas) | ❌ | ❌ añadir |
| Vista paciente (crisis, próxima consulta, tareas, evolución, LEVA, clínica, modal) | ❌ | ❌ añadir |
| Vista alumno (resumen académico, avisos, CTA Campus, Radar de Competencias) | ❌ | ❌ añadir |

---

## 2. Capa de datos — `jarvis-database`

### 2.1 Migración `V11__introduce_sedes.sql`

```sql
CREATE TABLE IF NOT EXISTS sedes (
    id      VARCHAR(36) PRIMARY KEY,
    nombre  VARCHAR(100) NOT NULL,
    direccion VARCHAR(200),
    activo  BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT ux_sedes_nombre UNIQUE (nombre)
);

ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS sede_id VARCHAR(36);
CREATE INDEX IF NOT EXISTS idx_pacientes_sede ON pacientes (sede_id);

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='fk_pacientes_sede') THEN
        ALTER TABLE pacientes ADD CONSTRAINT fk_pacientes_sede
            FOREIGN KEY (sede_id) REFERENCES sedes(id) ON DELETE SET NULL;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='ck_pacientes_status') THEN
        ALTER TABLE pacientes ADD CONSTRAINT ck_pacientes_status
            CHECK (status IN ('activo','pendiente','completado','archivado'));
    END IF;
END $$;

INSERT INTO sedes (id, nombre, direccion) VALUES
    ('sede-centro','Sede Centro BreveMente','Ciudad de México'),
    ('sede-norte','Sede Norte BreveMente', NULL),
    ('sede-sur','Sede Sur BreveMente', NULL)
ON CONFLICT (id) DO NOTHING;

-- Semilla de asignación (coherente con la demo):
UPDATE pacientes SET sede_id = 'sede-centro' WHERE id IN ('pac-001','pac-002');
UPDATE pacientes SET sede_id = 'sede-norte' WHERE id = 'pac-003';
UPDATE pacientes SET sede_id = 'sede-sur'   WHERE id = 'pac-004';
```

### 2.2 Migración `V12__introduce_protocolos.sql`

```sql
CREATE TABLE IF NOT EXISTS protocolos (
    id     VARCHAR(36) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT ux_protocolos_nombre UNIQUE (nombre)
);

ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS protocolo_id VARCHAR(36);
CREATE INDEX IF NOT EXISTS idx_pacientes_protocolo ON pacientes (protocolo_id);

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='fk_pacientes_protocolo') THEN
        ALTER TABLE pacientes ADD CONSTRAINT fk_pacientes_protocolo
            FOREIGN KEY (protocolo_id) REFERENCES protocolos(id) ON DELETE SET NULL;
    END IF;
END $$;

INSERT INTO protocolos (id, nombre) VALUES
    ('prot-panico','Ataque de Pánico'),
    ('prot-toc','TOC Control'),
    ('prot-fobia-escolar','Fobia Escolar'),
    ('prot-fobia-social','Fobia Social')
ON CONFLICT (id) DO NOTHING;

UPDATE pacientes SET protocolo_id = 'prot-panico'        WHERE id = 'pac-001';
UPDATE pacientes SET protocolo_id = 'prot-fobia-social'  WHERE id = 'pac-002';
UPDATE pacientes SET protocolo_id = 'prot-toc'           WHERE id = 'pac-003';
UPDATE pacientes SET protocolo_id = 'prot-fobia-escolar' WHERE id = 'pac-004';
```

> El filtro de protocolo reproduce las **2 opciones de la demo** (label "Ataque de Pánico", label "TOC de Verificación" → nombre canónico **"TOC Control"**), aunque la gráfica de barras use las 4. El catálogo completo (4) alimenta la gráfica.

### 2.3 Fase TBE y periodo (sin columna nueva)

- **Fase TBE** se **deriva** de `status` + `risk_level` (igual que la demo):
  - Fase 1 (Admisión) = `status='pendiente'`.
  - Fase 2 (Desbloqueo) = `status='activo'` y `risk_level IN ('medio','alto')`.
  - Fase 3 (Consolidación) = `status='activo'` y `risk_level='bajo'`.
  - Fase 4 (Cierre/Alta) = `status IN ('completado','archivado')`.
- **Periodo** se deriva de `citas.fecha_hora_inicio`: `hoy` | `semana` | `mes` (default **`mes`**), sin tabla nueva.
- **Modalidad** ya existe (`citas.modalidad` CHECK `PRESENCIAL/ONLINE` uppercase; `expedientes_clinicos.modalidad` lowercase). El filtro usa **`citas.modalidad`**.
- **Terapeuta** ya existe (`pacientes.terapeuta_id`, `citas.terapeuta_id`).
- **Semilla de pacientes (nuestra BD, 4)**: pac-001 `activo`/medio, pac-002 `activo`/alto, pac-003 `pendiente`/bajo, pac-004 `completado`/bajo. Derivación de fases: Fase 1 = 1 (pac-003), Fase 2 = 2 (pac-001, pac-002), **Fase 3 = 0**, Fase 4 = 1 (pac-004).
- ⚠️ **Paridad de datos fuera de alcance**: la demo React (`mockData.ts`) tiene 6 pacientes con otros nombres/estados. Se mantienen los **4 pacientes de nuestra BD** (y sus tests). La paridad es de **layout/componentes**; los números de las gráficas reflejan **nuestra** BD.

> Nota: `sedes` y `protocolos` son **catálogos simples** (no dependen del Motor de Protocolos, Bloque C). El Motor de Protocolos podrá enriquecer `protocolos` con reglas en el futuro sin migrar de nuevo.

---

## 3. Backend — `jarvis-backend`

### 3.1 Contrato API (se extiende el módulo `dashboard`)

Base `/dashboard`, autoridad `DASHBOARD_LEER` (misma que hoy). Todos los endpoints **respetan el scoping por rol** (SDD-004) y aceptan **filtros** como query params (todos opcionales):

```text
filtros comunes: modalidad?, sedeId?, periodo?, terapeutaId?, protocoloId?
```

| Método | Ruta | Respuesta | Nuevo/Existente |
| :--- | :--- | :--- | :--- |
| GET | `/dashboard/stats` | `DashboardStatsResponseDTO` (ya existe) | existente |
| GET | `/dashboard/citas-hoy` | `List<CitaResponseDTO>` | existente |
| GET | `/dashboard/alertas` | `List<AlertaDashboardResponseDTO>` | existente |
| GET | `/dashboard/pacientes-recientes` | `List<PacienteResponseDTO>` (o resumen operativo) | existente |
| GET | `/dashboard/accion-dominante` | `AccionDominanteResponseDTO` | existente (enriquecer) |
| GET | `/dashboard/citas-por-mes` | `List<SerieMesDTO>` | **nuevo** |
| GET | `/dashboard/distribucion-fases` | `List<DistribucionFaseDTO>` | **nuevo** |
| GET | `/dashboard/casos-por-protocolo` | `List<CasoProtocoloDTO>` | **nuevo** |
| GET | `/dashboard/alertas-mayoria-edad` | `List<AlertaMayoriaEdadDTO>` | **nuevo** |
| GET | `/dashboard/catalogos` | `CatalogosDashboardDTO` (sedes, protocolos, terapeutas, modalidades) | **nuevo** |
| GET | `/dashboard/pendientes-prioritarios` | `List<PendientePrioritarioDTO>` | **nuevo** |

DTOs nuevos (records con `@Schema`):

```text
SerieMesDTO(month String, citas long)             // cuenta TODAS las citas del mes (paridad con la demo)
DistribucionFaseDTO(fase String, valor long)
CasoProtocoloDTO(protocolo String, casos long)
AlertaMayoriaEdadDTO(pacienteId, nombre, fechaNacimiento, representante)
PendientePrioritarioDTO(pacienteId, nombre, horaCita, motivo)
SedeDTO(id, nombre) · ProtocoloDTO(id, nombre) · TerapeutaDTO(id, nombre)
CatalogosDashboardDTO(sedes: SedeDTO[], protocolos: ProtocoloDTO[], terapeutas: TerapeutaDTO[], modalidades: String[])  // modalidades = ['PRESENCIAL','ONLINE'] (uppercase canónico; el frontend normaliza a labels)
```

### 3.2 Semántica

- **Acción Operativa Dominante**: primera cita confirmada/pendiente de hoy. Campos: `citaId, pacienteId, pacienteNombre, terapeutaNombre /* Responsable */, fecha, hora, tipoCita, modalidad, duracionMinutos, protocolo, intakeListo, consentimientoFirmado, grabacionLeva`. **Sin `sede`** (la demo no la muestra). `intakeListo` = `status != pendiente`; `grabacionLeva` = `registryMode == 'ia'`.
- **Alerta Mayoría de Edad**: `capacidadConsentimiento.estado == 'REPRESENTADO_POR_EDAD'` **y** `fecha_nacimiento + 18 años <= hoy` (detecta menores que acaban de cumplir 18; **NO** marca adultos `AUTONOMO`). **No** filtrada por rol (decisión de paridad; ver riesgo PII en §6).
- **Filtros sobre citas por sede/protocolo**: `citas-por-mes` y `accion-dominante` filtran por `sede_id`/`protocolo_id` mediante **JOIN `citas → pacientes`** (esas columnas viven en `pacientes`). La `modalidad` solo existe en `citas`/`expedientes`; las agregaciones sobre pacientes no se filtran por modalidad (o se hace JOIN a citas).
- **Fallback acción dominante**: la demo usa `hoy[0] || filtered[0]`; el backend devuelve 204 si no hay confirmada/pendiente hoy (más estricto, desviación deliberada a documentar).
- **citas-por-mes**: reproduce la demo: **cuenta todas las citas** del rango (no filtra por `status='completada'`). Decisión de paridad documentada.
- **distribucion-fases / casos-por-protocolo**: agregaciones filtradas y scoped.

### 3.3 Catálogos (entidades/repos/puertos nuevos)

- `sedes`, `protocolos` → tablas V11/V12. Nuevos: `SedeJpaEntity`/`ProtocoloJpaEntity` (o proyecciones), `SpringDataSedeRepository`/`SpringDataProtocoloRepository`, puerto `DashboardCatalogosRepositoryPort` + adapter.
- `terapeutas` → listado **bulk** con nombre vía `usuarios` (nueva query `findAll`; el singular `findTherapistDisplayName` ya existe).
- `modalidades` → enum `{PRESENCIAL, ONLINE}`.
- **Agregaciones scoped**: métodos nuevos en `PacienteRepositoryPort`/`CitaRepositoryPort` para `agruparPorFase`, `agruparPorProtocolo`, `agruparPorMes` (parámetros: `terapeutaIds`, `sedeId`, `protocoloId`, `periodo`).

### 3.4 Drilldowns

Los drilldowns **reutilizan los datos ya filtrados** devueltos por los endpoints existentes (`citas-hoy`, `pacientes-recientes`, `alertas`, `pendientes-prioritarios`); **no** requieren endpoints nuevos.

---

## 4. Frontend — `jarvis-frontend`

### 4.1 Componentes nuevos (Angular standalone, Tailwind, SVG puro)

```text
modules/dashboard/components/
  dashboard-filters/          # barra de filtros (modalidad, sede, periodo, terapeuta, protocolo + limpiar)
  kpi-card/                   # 4 variantes: numérico, anillo, barra, semáforo (no idénticas)
  progress-ring/              # anillo SVG (máx. 1 por viewport)
  linear-progress/            # barra lineal
  risk-semaphore/             # semáforo + badge "REQUERIDO"
  dominant-action/            # Acción Operativa Dominante
  clinic-perspective/         # 3 gráficas SVG con selector (línea, donut, barras)
  majority-age-alert/         # banner de mayoría de edad
  agenda-dia/                 # línea de tiempo de citas (máx. 3)
  pendientes-prioritarios/    # lista + badge "Crítico"
  drilldown-modal/            # modal genérico de detalle por KPI
modules/dashboard/views/
  dashboard-therapist-view/   # Centro de Control (terapeuta/admin/supervisor)
  dashboard-patient-view/     # Botón de Crisis, tareas, evolución, LEVA Paciente, clínica
  dashboard-student-view/     # resumen académico + CTA a Campus
```

### 4.2 Comportamiento por rol y fidelidad visual exacta

| Rol | Vista |
| :--- | :--- |
| therapist / admin_platform / admin_clinical / supervisor | `dashboard-therapist-view` (Centro de Control) |
| assistant | Centro de Control **sin** alertas clínicas ni gráficas (modo operativo) |
| patient | `dashboard-patient-view` |
| student | `dashboard-student-view` |

> La rama por rol se decide en `dashboard.component.ts` con `roleService.roles` (no `activeRole`). Las vistas paciente/alumno se renderizan aquí con datos del backend (mock/estático donde no hay fuente); la integración profunda con `MiConsulta`/`Campus` sigue en sus módulos.

**Textos y paleta (paridad exacta):**

- **Cabecera**: icono `Shield` + **"Centro de Control BreveMente"** + *"Visión ejecutiva de la operación clínica, las alertas y la efectividad general."* + badge **"Actualizado: {…}"** + botón **LEVA**.
- **Filtros**: selects Modalidad / Sede / Periodo / Terapeuta / Protocolo + botón **"Limpiar filtros"**.
- **KPI 1 Citas Programadas**: valor = citas de HOY · **"{N} confirmadas hoy"** · **"Clic para ver agenda"**.
- **KPI 2 Pacientes Activos**: **anillo** `(activos/10)*100%` (denominador **10**) · **"Capacidad al {X}%"**.
- **KPI 3 Pendientes Clínicos**: **barra** `(pendientes/5)*100%` · **"Límite semanal: 5"**.
- **KPI 4 Alertas de Riesgo**: **semáforo** (luz roja si >0) + badge **"REQUERIDO"** (si >0) · etiqueta **"Nivel de alerta"** · asistente → **"—"**, luz apagada, **"No autorizado"**.
- **Perspectiva Clínica Unificada** (oculta para asistente): "Citas completadas (Histórico)" línea `#304768` · "Distribución por Fase TBE" donut `#304768,#75AFBC,#319795,#4A5568` · "Casos Activos por Protocolo" barras `#304768,#75AFBC,#2C7A7B,#4A5568`.
- **Alerta Mayoría de Edad**: banner oscuro gradiente, título **"Alerta de Mayoría de Edad — Reconsentimiento Autónomo Requerido"**, badge con conteo, tarjetas ("Nacimiento: …", "Representante previo: …", "Revocación preparada") + **"Ver Expediente"**.
- **Acción Operativa Dominante**: badge **"Próxima Consulta"**/"Sin Consultas"; hora AM/PM; **"Protocolo: … • Modalidad: … • Tipo: … • Duración: N min"**; chips **Intake: Listo/Pendiente · Consentimiento: Firmado/Pendiente · Grabación LEVA: Autorizada/Modo Manual**; **"Responsable: {terapeutaNombre}"**; **"Preparar Sesión"** (oculto asistente).
- **Agenda del Día**: máx **3** citas (`slice(0,3)`), subtítulo **"{tipo} • Presencial"**, status plano uppercase; enlace **"Ver todos"**.
- **Pendientes Prioritarios**: **"Admisión de {name}"** + *"Debe completar historia clínica y firmar consentimiento antes de su cita a las {time}."* (fallback *"Pendiente de historia clínica y consentimiento de audio."*) + badge **"Crítico"**; enlace **"Ver todos"**.

### 4.3 Utilidades puras (`core/utils/dashboard-metrics.ts`)

`agruparCitasPorMes`, `distribuirPorFase`, `agruparPorProtocolo`, `calcCapacidadPct`, `sessionMinutes`, `detectarMayoriaEdad`.

### 4.4 Puerto (`ports/dashboard.repository.ts`)

Añadir métodos y tipos:

```text
CatalogosDashboard, SerieMes, DistribucionFase, CasoProtocolo, AlertaMayoriaEdad, PendientePrioritario
obtenerCatalogos()
obtenerCitasPorMes(filtros), obtenerDistribucionFases(filtros), obtenerCasosPorProtocolo(filtros)
obtenerAlertasMayoriaEdad(), obtenerPendientesPrioritarios()
// los 4 métodos existentes pasan a aceptar DashboardFiltros
```

`DashboardFiltros { modalidad?, sedeId?, periodo?, terapeutaId?, protocoloId? }`.

### 4.5 Contrato compartido (sync TS ↔ DTO)

- `DashboardStats` se amplía: `capacidadPct` (o se deriva en frontend), `confirmadasHoy`.
- Tipos nuevos simétricos con los DTO de §3.1.
- El adapter HTTP mapea filtros → query params.

---

## 5. Matriz de visibilidad (corregida)

| Zona | admin_platform | admin_clinical | therapist | supervisor | assistant |
| :--- | :---: | :---: | :---: | :---: | :---: |
| KPIs 1–3 (citas, activos, pendientes) | ✅ | ✅ | ✅ | ✅ | ✅ |
| KPI 4 Alertas de Riesgo + semáforo | ✅ | ✅ | ✅ | ✅ | ⚠️ "— / No autorizado" (sin datos ni badge) |
| Perspectiva Clínica (3 gráficas) | ✅ | ✅ | ✅ | ✅ | ❌ |
| Filtros | ✅ | ✅ | ✅ | ✅ | ✅ |
| Acción Operativa Dominante | ✅ | ✅ | ✅ | ✅ | ✅ (sin "Preparar Sesión") |
| Alerta Mayoría de Edad | ✅ | ✅ | ✅ | ✅ | ✅ |
| Agenda del Día | ✅ | ✅ | ✅ | ✅ | ✅ |
| Pendientes Prioritarios | ✅ | ✅ | ✅ | ✅ | ✅ |
| Drilldowns | ✅ | ✅ | ✅ | ✅ | ✅ salvo `risk` |

> Vistas paciente/alumno: se renderizan por rol (no por `DASHBOARD_LEER`). Sus datos son del backend (mock/estático donde no hay fuente); la integración profunda con `MiConsulta`/`Campus` queda en sus módulos.

---

## 6. Riesgos

| # | Riesgo | Mitigación |
| :--- | :--- | :--- |
| 1 | `sede`/`protocolo` sin datos en BD previos | Migraciones V11/V12 con semilla y asignación a los 4 pacientes. |
| 2 | "Fase TBE" derivada de status/riskLevel puede diferir del Motor de Protocolos futuro | Documentado: la derivación es la fuente actual; el Motor (Bloque C) la sustituirá sin migración de columnas. |
| 3 | Vista paciente/alumno sin `MiConsulta`/`Campus` | Vistas dashboard con datos propios; integración profunda queda en sus módulos. |
| 4 | Gráficas SVG manuales (sin lib) | Utilidades puras + tests unit; se evita dependencia `recharts`. |
| 5 | Scoping + filtros combinados | Los endpoints filtrados reutilizan el `DashboardScopeResolver` (no se salta el scope). |
| 6 | Filtro por periodo con zona horaria | Rango calculado en Java (`America/Mexico_City`), como en SDD-003. |
| 7 | Paridad visual estricta vs componentes actuales | Se reemplazan cabecera, KPIs, agenda y se retiran "Alertas Normativas"/banner consentimiento/"Pacientes Recientes". |
| 8 | "Citas completadas" cuenta todas las citas (nombre engañoso de la demo) | Decisión de paridad: reproducir el conteo de la demo. |
| 9 | Protocolo: filtro 2 opciones vs gráfica 4 | Filtro reproduce las 2 de la demo; catálogo completo (4) para gráfica. |
| 10 | Mayoría de edad sin scoping expone `fechaNacimiento`/`representante` de pacientes ajenos | Decisión de paridad; documentar como ADR o aplicar scoping posterior. |
| 11 | Fallback acción dominante (demo `[0] || filtered[0]`) vs backend 204 | Desviación deliberada (más estricta) documentada en §3.2. |
| 12 | Nuestra semilla (4 pacientes) no reproduce los números de la demo (6 pacientes): Fase 3 = 0, Fobia Escolar = 0, sin alerta de mayoría de edad | Paridad de **DATOS** fuera de alcance (decisión de equipo). Paridad de layout/componentes sí. |

---

## 7. Plan de pruebas

**Backend**: unit de agregaciones (citas-por-mes, fases, protocolos, mayoría de edad, pendientes) con scoping + filtros; `@WebMvcTest` con query params y 403 sin `DASHBOARD_LEER`.

**Frontend**: unit de `dashboard-metrics.ts`; E2E por rol (therapist/supervisor/asistente/admin + patient/student) validando filtros, gráficas, acción dominante, drilldowns y mayoría de edad; regresión visual por rol.

**BD**: validación de V11/V12 (FK, semilla, índices).

---

## 8. Trazabilidad de brechas

| GAP | Resuelto en este SDD |
| :--- | :--- |
| GAP-DASH-02 (filtros) | §2.1, §2.2, §3.1, §4.1 |
| GAP-DASH-03 (gráficas) | §3.1, §4.1 |
| GAP-DASH-04 (mayoría de edad) | §3.1, §4.1 |
| GAP-DASH-05 (drilldowns) | §4.1 |
| GAP-DASH-06 (acción dominante + anillo/semáforo) | §3.2, §4.1 |
| GAP-DASH-07 (vistas por rol) | §4.2 |
| GAP-ROLE-01..06 (scoping) | se mantiene de SDD-004 |
