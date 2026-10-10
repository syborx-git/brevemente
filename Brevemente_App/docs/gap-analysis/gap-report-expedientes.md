# GAP Analysis Report: Módulo Expedientes (Expediente Clínico TBE)

- **Fecha**: 2026-10-07
- **Módulo**: `expediente-clinico` (Angular) / dominio `expediente` (Spring Boot — **no existe aún**)
- **Estado**: AUDITADO (READ-ONLY) — Skill `demo-gap-analysis`
- **Rutas reales auditadas**:
  - Frontend: `Brevemente_App/frontend/src/app/modules/expediente-clinico/` (ruta `/expediente/:id`; `/expedientes` redirige a `/pacientes`)
  - Backend: `Brevemente_App/backend/src/main/java/com/syborx/brevemente/` (paquetes `auth`, `cita`, `config`, `paciente` — **sin paquete `expediente`**)
  - Demo React de referencia: `brevemente_demo/src/pages/ClinicalRecord.tsx`

> ⚠️ Nota sobre las fuentes indicadas: el usuario indicó `/frontend/src/app/modules/expedientes/` y `/backend/src/main/java/com/brevemente/`, pero los nombres reales son `expediente-clinico` (frontend) y `com.syborx.brevemente` (backend). Se auditó contra las rutas reales.

---

## 1. Inventario de Componentes Auditados

### 1.1 Frontend Angular (`expediente-clinico`)
| Archivo | Rol |
| :--- | :--- |
| `expediente-clinico.component.ts` | Smart component: carga paciente + expediente + sesiones; tabs; modal "Registrar Sesión TBE"; simulador de audio/LEVA; firma de consentimiento |
| `expediente-clinico.component.html` | UI: banner de paciente, 4 tabs, modal de sesión, alerta de consentimiento |
| `ports/expediente.repository.ts` | Puerto `ExpedienteRepository` (5 métodos) |
| `adapters/expediente-http.adapter.ts` | HTTP adapter (apunta a `/api/v1/expedientes/...`) — **no cableado** |
| `adapters/expediente-localstorage.adapter.ts` | Mock activo (seed de `mockData.ts`) |
| `core/types/clinical.types.ts` | Tipos `ClinicalRecord`, `Session`, `Patient`, `CapacidadConsentimiento`, `RepresentanteLegal` |

**Puerto `ExpedienteRepository` (firma exacta):**
```typescript
obtenerPaciente(pacienteId): Observable<Patient | null>
obtenerExpediente(pacienteId): Observable<ClinicalRecord | null>
obtenerSesiones(pacienteId): Observable<Session[]>
agregarSesion(pacienteId, sesion: Omit<Session,'id'>): Observable<Session>
firmarConsentimiento(pacienteId): Observable<boolean>
```

**Endpoints esperados por `ExpedienteHttpAdapter`:**
| Método | Ruta esperada | Estado backend |
| :--- | :--- | :--- |
| GET | `/api/v1/pacientes/{id}` | ✅ Existe (`PacienteRestController`) |
| GET | `/api/v1/expedientes/paciente/{id}` | ❌ MISSING |
| GET | `/api/v1/expedientes/paciente/{id}/sesiones` | ❌ MISSING |
| POST | `/api/v1/expedientes/paciente/{id}/sesiones` | ❌ MISSING |
| POST | `/api/v1/expedientes/paciente/{id}/consentimiento/firmar` | ❌ MISSING |

**Flag de activación**: `environments/environment.ts` → `expedienteClinicoBackend: false` (usa mock).

### 1.2 Backend Spring Boot
- **Módulos existentes**: `auth`, `cita`, `config`, `paciente`.
- **No existe ningún** `@Entity`, `JpaRepository`, `@Service` ni `@RestController` para el dominio expediente. Las únicas referencias son:
  - `Cita.expedienteId` / `CitaJpaEntity.expedienteId` (FK hacia `expedientes_clinicos`).
  - Descripción en `OpenApiConfig` y `PacienteResponseDTO` (solo texto).

### 1.3 Migraciones Flyway relevantes
| Migración | Relevancia para expedientes |
| :--- | :--- |
| `V1__init_schema.sql` | Tablas huérfanas: `expedientes_clinicos`, `notas_evolucion`, `consentimientos_informados` (sin entidad JPA) |
| `V2__seed_clinical_data.sql` | Semilla `exp-001` (pac-001) y `exp-002` (pac-002) con 8 columnas (5 clínicas) |
| `V3__extend_pacientes_schema.sql` | `pacientes` gana `consentimiento_representante_firmado`, `fecha_determinacion_consentimiento`, `motivo_determinacion_consentimiento`, `representante_parentesco`, `representante_correo` |
| `V5__introduce_permissions_and_token_security.sql` | Permisos **ya existen**: `EXPEDIENTE_LEER` (perm-005), `EXPEDIENTE_ESCRIBIR` (perm-006), `EXPEDIENTE_FIRMAR` (perm-007). Asignados a `therapist` (rol-003), `supervisor` (rol-005, solo LEER) y `admin_platform` (rol-001); ⚠️ `admin_clinical` (rol-002) no los tiene |
| `V6__introduce_citas_schema.sql` | Relevante: siembra `citas` con `expediente_id = 'exp-001'` y **restablece `pac-001.consentimiento_representante_firmado = FALSE`** (estado que GAP-EXP-04 debe revertir) |

---

## 2. Matriz de Reutilización de Código Existente (ADAPTAR VS CREAR)

| Componente Backend | Estado Actual | Estrategia SDOP |
| :--- | :--- | :--- |
| `expedientes_clinicos` (V1) | Tabla existe, **sin** entidad JPA | **ADAPTAR**: crear `ExpedienteJpaEntity` + **V7** para columnas del contrato `ClinicalRecord` |
| `notas_evolucion` (V1) | Tabla existe, **sin** entidad JPA ni seed | **CREAR tabla nueva `sesiones`** (semántica distinta); `notas_evolucion` se conserva como narrativa opcional o se ignora (decisión V7) |
| `consentimientos_informados` (V1) | Tabla existe, **sin** entidad JPA | **ADAPTAR**: crear `ConsentimientoJpaEntity` para auditoría de firmas |
| `pacientes` + `PacienteJpaEntity` | Completo | **REUTILIZAR**: el endpoint `GET /pacientes/{id}` ya sirve el `Patient`; no duplicar |
| `pacientes.consentimiento_representante_firmado` (V3) | Columna existe | **ADAPTAR**: el endpoint de firma actualiza esta columna (desbloquea la agenda) |
| Módulo `paciente` (hexagonal completo) | Entity/repo/service/controller/DTO/mapper/advice | **REUTILIZAR como plantilla** para el módulo `expediente` |
| Módulo `cita` (hexagonal completo) | Ídem + `CitaExceptionHandler` scoped | **REUTILIZAR como plantilla** (patrón `@RestControllerAdvice(basePackages)`) |
| Permisos `EXPEDIENTE_*` (V5) | Existen y están asignados | **REUTILIZAR** en `@PreAuthorize` |
| `AuditoriaAccesoPort` (auth) | Extendido con `registrarAcceso` | **REUTILIZAR** para auditar lectura/escritura de expediente |

**Conclusión**: las **tablas base** ya existen en V1/V3/V5, pero faltan 12 columnas nuevas en `expedientes_clinicos`, toda la estructura de `Session` (nueva tabla `sesiones`) y la auditoría de `consentimientos_informados`. Hay que **despertar** el dominio `expediente` con entidades JPA + repositorios + servicios + controllers, creando/ampliando el esquema vía `V7`.

---

## 3. Matriz de Brechas (GAPs) Identificadas

| ID | Tipo | Descripción de la Brecha | Impacto | Acción Propuesta |
| :--- | :--- | :--- | :--- | :--- |
| GAP-EXP-01 | **MISSING** | No existe el módulo backend `expediente` (sin `@Entity`/repo/service/controller para `expedientes_clinicos`). | **Alto** | Crear módulo hexagonal `com.syborx.brevemente.expediente` espejo de `paciente`/`cita`. |
| GAP-EXP-02 | **MISSING** | `GET /expedientes/paciente/{id}` → `ClinicalRecord` no existe. | **Alto** | Crear `ExpedienteRestController` + `ObtenerExpedienteUseCase`. |
| GAP-EXP-03 | **MISSING** | Sesiones: no existe entidad JPA de sesión (ni `notas_evolucion` ni tabla `sesiones`); faltan `GET/POST /expedientes/paciente/{id}/sesiones`. | **Alto** | Crear tabla `sesiones` (V7) + `SesionJpaEntity` + `ListarSesionesUseCase` + `AgregarSesionUseCase` + endpoints. |
| GAP-EXP-04 | **MISSING** | **Pendiente de la implementación anterior (Agenda)**: firma de consentimiento. Falta el endpoint de dominio `POST .../consentimiento/firmar`; la UI "Firmar Ahora" solo escribe en localStorage (aunque `PATCH /pacientes/{id}` ya permite fijar `consentimientoRepresentanteFirmado`, falta la auditoría en `consentimientos_informados` y el wiring del botón). | **Alto** | Crear `FirmarConsentimientoUseCase` que actualice `pacientes.consentimiento_representante_firmado = TRUE` (+ fila en `consentimientos_informados`) y active `expedienteClinicoBackend: true`. **Desbloquea la UI de agenda; nota: `listar` no recalcula `bloqueada_por_normativa`, por lo que las citas ya persistidas conservan el flag hasta re-agendarse.** |
| GAP-EXP-05 | **PARTIAL** | Contrato `ClinicalRecord` (14 campos listados: `trastornoEstrategico`, `sprInicial`, `dxOpInicial`, `valoracionCambioInicial`, `valoracionGlobalInicial`, `objectivePatient`, `objectiveTherapist`, `firstAppearance`, `precipitatingFactors`, `evolutionType`, `folio`, `startDate`, `modality`, `riskLevel`; además `description` requiere columna nueva) vs tabla `expedientes_clinicos` (solo `motivo_consulta`, `intentos_solucion`, `objetivo_terapeutico`, `diagnostico_operativo`, `estatus_expediente`). ⚠️ `ClinicalRecord.modality` usa `'presencial'|'online'`; `citas.modalidad` usa `'PRESENCIAL'|'ONLINE'` (unificar vocabulario). | **Alto** | Migración `V7` para extender `expedientes_clinicos` con las columnas del contrato (mapeo campo→origen: propio/join/nuevo). |
| GAP-EXP-06 | **PARTIAL** | Contrato `Session` (campos `number`, `phase`, `protocol`, `dxOp`, `trastorno`, `px[]`, `f1`, `f2`, `oss`, `add`, `cumplimiento`, `rss`, `eff`, `notes`, `observationsNextSession`, `situation`, `audioDuration`, `status`) vs `notas_evolucion` (solo `numero_sesion`, `estratagema_aplicada`, `prescripcion_tarea`, `observaciones_clinicas`, `reaccion_paciente`). | **Alto** | **CREAR tabla `sesiones`** (V7) con el contrato completo; no sobrecargar `notas_evolucion`. `px[]` puede ser JSONB o tabla hija. |
| GAP-EXP-07 | **CONTRACT** | El puerto `ExpedienteRepository` declara 5 métodos; el backend solo cubre 1 de los 5 (`GET /pacientes/{id}`). | **Alto** | Implementar los 4 endpoints faltantes alineando rutas y DTOs con el adapter HTTP. |
| GAP-EXP-08 | **DATA** | Semilla: `V2` solo siembra `exp-001`/`exp-002` (8 columnas, 5 clínicas); `pac-003`/`pac-004` no tienen expediente; no hay semilla de `notas_evolucion` ni `consentimientos_informados`; el mock de Angular usa `mockClinicalRecords`/`mockSessions` (pacientes `patient-1`/`patient-2` de la demo). | **Medio** | `V7` (o seed dedicado) para sembrar expedientes y sesiones coherentes con la demo (por paciente de la BD). |
| GAP-EXP-09 | **MISSING** | Feature flag `expedienteClinicoBackend: false` en dev (`environment.prod.ts` ya lo tiene `true`). `VALID_PERMISSIONS` **ya incluye** `EXPEDIENTE_LEER/ESCRIBIR/FIRMAR` (sin cambios). | **Medio** | Activar flag en `environment.ts` (dev). |
| GAP-EXP-10 | **SCOPE** | La demo React (`ClinicalRecord.tsx`) implementa mucho más que el Angular actual: psiquiatría, pagos, supervisión, constancias, contrareferencia, reconsentimiento autónomo al cumplir 18, sesiones con IA, audio real. | **Medio** | Definir alcance por fases (ver §5). |

---

## 4. Demo React de referencia — características a copiar (ya funcionaban)

`brevemente_demo/src/pages/ClinicalRecord.tsx` — inventario de funcionalidad validada en la demo:

- **Tabs de alto nivel**: `datos`, `tbe`, `psiquiatria`, `auditoria`, `pagos`, `supervision`, `constancias`, `contrareferencia`.
- **Sub-tabs TBE**: `dx` (diagnóstico), `sesiones`, `vc` (valoración de cambio), `vg` (valoración global), `rst` (relación/estrategia terapéutica).
- **Firma de consentimiento**: modal de firma del representante (`repSignatureName`) y **reconsentimiento autónomo al cumplir 18** (`handleFormalizeAutonomousReconsent`) con revocación de notificaciones al representante.
- **Sesiones**: creación en modo `ia`/`manual`, fases (`Desbloqueo`, `Intervención Estratégica`…), prescripciones (`px[]`), cumplimiento, RSS/EFF, grabación de audio, procesamiento IA y **detección/escalamiento de riesgo**.
- **Psiquiatría**: diagnóstico nosológico, DSM-5, CIE-11, pronóstico, plan y esquema de fármacos.
- **Pagos**: registro y **recordatorio de pago por WhatsApp** (`wa.me`).
- **Supervisión**: logs + modal de registro.
- **Constancias**: certificados físicos + modal de registro/detalle.
- **Contrareferencia**: derivación con motivo y resumen. *(⏳ FASE FUTURA — se planeará después del panel de expediente funcional)*

> El Angular actual (`expediente-clinico`) solo cubre una fracción: Formulación TBE (dx/spr/objetivo), Sesiones (lista + modal simple), Simulador de Audio/LEVA y Representación Legal. Todo el HTML/SCSS de la demo React es la **fuente de verdad visual a portar**.

### 4.1 Guía de port del frontend de la demo (archivo → UI)

> **Regla explícita para evitar repetir el caso del calendario**: el HTML/SCSS de la demo React debe portarse tal cual (las clases Tailwind ya son compatibles con el Angular). No se trata de "reinterpretar" la UI, sino de **copiar lo que ya funciona** en la demo.

| Fuente demo React | Qué copiar | Destino Angular |
| :--- | :--- | :--- |
| `ClinicalRecord.tsx` · selector de expedientes | Carpetas horizontales (`FolderHeart`) para cambiar de expediente | Encima del banner de paciente |
| `ClinicalRecord.tsx` · tab `datos` | Banner de paciente, datos demográficos, estado jurídico y alerta de consentimiento | `expediente-clinico.component.html` (banner actual, ampliar) |
| `ClinicalRecord.tsx` · tab `tbe`→`dx` | Formulario DX: Motivo de Consulta, Descripción de Conducta Sintomática, Trastorno Estratégico, Evolución Temporal, Objetivos del Paciente, Objetivos del Terapeuta | Tab "Formulación TBE" (completar campos editables) |
| `ClinicalRecord.tsx` · tab `tbe`→`sesiones` | Lista de sesiones, detalle y modal de creación `ia`/`manual` | Tab "Sesiones y Notas" + modal "Registrar Sesión TBE" |
| `ClinicalRecord.tsx` · modal "Compliance de la Indicación" (`selectedPrescription`) | EFF/ADD/OSS/RSS por prescripción | Detalle de sesión (tab "Sesiones y Notas") |
| `ClinicalRecord.tsx` · tab `tbe`→`vc` | Historial y registro de Valoración de Cambio | Bloque/tab "Valoración de Cambio" |
| `ClinicalRecord.tsx` · tab `tbe`→`vg` | Valoración Global | Bloque/tab "Valoración Global" |
| `ClinicalRecord.tsx` · tab `tbe`→`rst` | Relación/Estrategia terapéutica | Bloque/tab "Estrategia Terapéutica" |
| `ClinicalRecord.tsx` · tab `psiquiatria` | DX nosológico, DSM-5, CIE-11, pronóstico, plan y fármacos | Nuevo tab "Psiquiatría" |
| `ClinicalRecord.tsx` · tab `auditoria` (tabla inline `patientLogs`) | Bitácora de auditoría clínica por paciente | Nuevo tab "Auditoría" |
| `ClinicalRecord.tsx` · tab `pagos` | Registro de pagos + recordatorio WhatsApp (`wa.me`) | Nuevo tab "Pagos" |
| `ClinicalRecord.tsx` · modal inline "Registrar Pago" (`showPaymentModal`) | Modal de registro de pago | Nuevo tab "Pagos" |
| `ClinicalRecord.tsx` · tab `supervision` + `SupervisionLogModal.tsx` | Logs y modal de supervisión | Nuevo tab "Supervisión" (o integrar módulo `supervision` Angular) |
| `ClinicalRecord.tsx` · botón cabecera "Solicitar Supervisión" | Acción de solicitud de supervisión (ámbar) | Cabecera del expediente |
| `ClinicalRecord.tsx` · tab `constancias` + `RegisterPhysicalCertificateModal.tsx` + `PhysicalCertificateDetailModal.tsx` | Constancias + modales de registro/detalle | Nuevo tab "Constancias" |
| `ClinicalRecord.tsx` · sección "Historial de Contingencia y Crisis Resueltas" (`crisisHistory`) | Tarjeta roja de historial de crisis + nota de intervención | Bloque entre cabecera y Régimen Legal |
| `ClinicalRecord.tsx` · ficha "Régimen Legal y Capacidad de Consentimiento" | Estado jurídico, representante/apoyo (contacto, acreditación, otro progenitor), estado de consentimiento | Ampliar/reemplazar tab "Representación Legal" |
| `ClinicalRecord.tsx` · modal inline "Formalizar Consentimiento del Representante" (`showConsentSignModal`, `repSignatureName`) | Modal de firma con validación | Reemplazar botón "Firmar Ahora" |
| `ClinicalRecord.tsx` · alerta mayoría de edad + "Formalizar reconsentimiento autónomo" (`handleFormalizeAutonomousReconsent`) | Flujo de reconsentimiento + revocación de notificaciones | Tab "Representación Legal" |
| `ProtocolDecisionPanel.tsx` | Panel de decisión de protocolo/estrategia | Sección de decisión clínica |
| `RiskAlertBanner.tsx` | Banner de alerta de riesgo | Banner de riesgo en expediente |
| `mockData.ts` (demo) | Textos y datos clínicos reales de la demo | Base para el seed Flyway (V7) |

> ℹ️ `ConsentModal.tsx` pertenece al flujo de **intake** (no al expediente); `CrisisResolutionModal.tsx`/`CrisisIncidentDetailModal.tsx` pertenecen a **MiConsulta/SecurityAudit**. En el expediente, la crisis se gestiona con la sección inline "Historial de Contingencia" + `RiskAlertBanner`.

> 📝 **Observaciones de auditoría frontend (2ª ronda, 2026-10-07)**:
> - El modal inline "Registrar Pago" (`showPaymentModal`) queda listado como fila propia en §4.1, por consistencia con el resto de modales.
> - El botón "Ver Documento de Privacidad Firmado" (tab `datos`) navega a `/intake` (cross-module); queda fuera del alcance del expediente, sin acción requerida.

> ⏳ **Fase futura (fuera del alcance inicial, decisión 2026-10-07)**: el tab `contrareferencia` (derivación con motivo/resumen), el banner "Paciente contra-referido" y el modo solo lectura asociado **no se portan ahora**. Se planearán después de tener el panel de expediente funcional y terminado.

---

## 5. Pendiente explícito de la implementación anterior (Agenda → Expedientes)

Acordado en el cierre de Agenda (2026-10-07) y **aquí se incluye como GAP-EXP-04**:

- **Problema**: las citas `pendiente` de menores quedan bloqueadas por normativa (`PacienteConsentimientoAdapter`: `REPRESENTADO_POR_EDAD` ∧ `!consentimientoRepresentanteFirmado`), y hoy "Firmar Ahora" escribe en localStorage (mock), no en PostgreSQL (si bien `PATCH /pacientes/{id}` ya permite fijar `consentimientoRepresentanteFirmado`, falta el endpoint de dominio con auditoría y el wiring del botón).
- **Solución al implementar Expedientes**:
  1. Endpoint real de firma. **Decisión de ruta**: unificar en `POST /api/v1/pacientes/{id}/consentimiento/firmar` (muta `pacientes`, coincide con `sdd-agenda.md`); el adapter HTTP hoy espera `/expedientes/paciente/{id}/consentimiento/firmar` y hardcodea `/api/v1` (usar `environment.apiBaseUrl`).
  2. El use case actualiza `pacientes.consentimiento_representante_firmado = TRUE` y registra la firma en `consentimientos_informados` (auditoría: `firmado_por`, `calidad_firmante`, `fecha_firma`, `documento_hash`).
  3. Activar `expedienteClinicoBackend: true`.
  4. Efecto: la agenda deja de bloquear nuevas citas y la UI habilita "Confirmar"; **nota**: `CitaApplicationService.listar` no recalcula `bloqueada_por_normativa`, por lo que las citas ya persistidas conservan el flag hasta re-agendarse.

---

## 6. Recomendaciones para demo-gap-implementation

Plan secuencial propuesto (hexagonal, ADR-001/002/003):

1. **V7__introduce_expediente_extension.sql**: extender `expedientes_clinicos` (columnas de `ClinicalRecord` + `description`; decidir `UNIQUE(paciente_id)` si es 1:1 y `UNIQUE(folio)`) y **crear tabla `sesiones`** (no sobrecargar `notas_evolucion`); añadir índices de FK (`notas_evolucion.expediente_id`, `consentimientos_informados.paciente_id`, `citas.expediente_id`); normalizar `modalidad` (`presencial|online`); decidir si `sesiones.creado_por_id` referencia `terapeutas` o `usuarios`; seed de expedientes + sesiones por paciente.
2. **Módulo backend `expediente`** (espejo de `paciente`/`cita`): `Expediente` + `Sesion` + `Consentimiento` (domain model), excepciones, puertos in/out, services (`ObtenerExpediente`, `ListarSesiones`, `AgregarSesion`, `FirmarConsentimiento`), adaptadores de persistencia y REST (`ExpedienteRestController` + DTOs + mapper + `ExpedienteExceptionHandler`). La firma actualiza el paciente vía un **puerto de salida cross-module** (análogo a `PacienteConsentimientoPort`) o reutilizando `ActualizarPacienteUseCase`; no debe escribir la tabla `pacientes` directamente.
3. **Autorización**: `@PreAuthorize` con `EXPEDIENTE_LEER`/`EXPEDIENTE_ESCRIBIR`/`EXPEDIENTE_FIRMAR` (permisos ya existentes en V5). Evaluar si `admin_clinical` (rol-002) debe recibir `EXPEDIENTE_LEER`. El `obtenerPaciente` del adapter depende hoy de `PACIENTES_LEER`.
4. **Frontend**: activar `expedienteClinicoBackend: true` (dev) y alinear el adapter HTTP con los endpoints creados (usar `environment.apiBaseUrl` y ruta unificada de firma). `VALID_PERMISSIONS` ya incluye `EXPEDIENTE_*` (sin cambios).
5. **Port del frontend de la demo React** (fuente de verdad visual, ver §4.1): portar el HTML/SCSS de la demo tal cual (clases Tailwind ya compatibles) — psiquiatría, pagos, supervisión, constancias, reconsentimiento autónomo, sesiones IA/audio, gestión de crisis y protocolo. **Fuera del alcance inicial (fase futura): `contrareferencia`.** Igual que se hizo con el calendario de Agenda, **el port visual es obligatorio y no puede quedar fuera de alcance**.
6. **E2E**: suite `tests/e2e/expediente.spec.ts` (oráculo + regresión visual) siguiendo el patrón de `agenda.spec.ts`.

---

## 7. Contrato de integración frontend ↔ backend ↔ BD (auditoría final 2026-10-07)

Hallazgos de las auditorías de integración de `jarvis-backend` y `jarvis-database`. Ambos: ⚠️ aprobado con observaciones; **implementable al 100%** con las precisiones de abajo.

### 7.1 Contrato HTTP (frontend ↔ backend)

| # | Severidad | Observación | Corrección |
| :--- | :--- | :--- | :--- |
| M1 | 🔴 Alta | Ruta de firma divergente: adapter usa `/expedientes/paciente/{id}/consentimiento/firmar`; decisión unificada `/pacientes/{id}/consentimiento/firmar` | Actualizar `expediente-http.adapter.ts` |
| M2 | 🔴 Alta | `apiUrl` hardcodeada `/api/v1` | Usar `environment.apiBaseUrl` |
| M3 | 🟠 Media | Puerto devuelve `null`; backend responde **404** y el adapter no tiene `catchError` | `.pipe(catchError(... => of(null)))` para 404 |
| M4 | 🟠 Media | `firmarConsentimiento` → `Observable<boolean>` sin DTO de respuesta definido | Devolver `PacienteResponseDTO` (mapear a boolean) o `204` |
| M5 | 🟠 Media | Doble permiso: `obtenerPaciente` → `PACIENTES_LEER`; los otros 4 → `EXPEDIENTE_*` | Documentar que el módulo requiere ambos permisos, o unificar |
| M6 | 🟡 Baja | Fallback `patient-1` (mock) vs `pac-001` (BD) | Alinear fallback del componente a slugs reales |
| M7 | 🟡 Baja | Códigos HTTP (404/409/400) de expediente no especificados | Tabla de errores + `ExpedienteExceptionHandler` scoped (patrón `CitaExceptionHandler`) |

**DTOs pendientes de definir en el SDD**: `ExpedienteResponseDTO` (mapea `ClinicalRecord`), `SesionResponseDTO` / `SesionCreateRequest` (mapean `Session`) y la respuesta de firma.

### 7.2 Mapeo de DTOs (camelCase ↔ snake_case)

| DB (snake_case) | Frontend (camelCase) | Origen |
| :--- | :--- | :--- |
| `motivo_consulta` | `motif` | existente V1 |
| `diagnostico_operativo` | `dxOpInicial` | existente V1 |
| `objetivo_terapeutico` | `objectiveTherapist` | existente V1 |
| `estatus_expediente` | `status` | existente V1 (normalizar catálogo) |
| `objetivo_paciente` | `objectivePatient` | **nueva columna V7** |
| `modalidad` | `modality` | **nueva columna V7** (unificar vocabulario) |
| `pacientes.nombre/apellidos/edad_calculada/risk_level` | `patientName`/`age`/`riskLevel` | JOIN |
| `terapeutas.nombre/apellidos` | `therapistName` | JOIN |

### 7.3 Esquema V7 — mapeo campo→origen (BD)

- **`expedientes_clinicos` — 12 columnas nuevas**: `folio`, `fecha_inicio`, `modalidad`, `descripcion`, `trastorno_estrategico`, `primera_aparicion`, `factores_precipitantes`, `tipo_evolucion`, `spr_inicial`, `valoracion_cambio_inicial`, `valoracion_global_inicial`, `objetivo_paciente`. (`dxOpInicial` → `diagnostico_operativo`, `objectiveTherapist` → `objetivo_terapeutico` y `motif` → `motivo_consulta` ya existen; `riskLevel`, `patientName`, `age`, `therapistName` son joins.)
- **`sesiones` (tabla nueva)**: `patientId` se resuelve por **JOIN** (`expediente_id → expedientes_clinicos.paciente_id`), sin columna directa. `px[]` → **JSONB** en MVP (`NOT NULL DEFAULT '[]'`); tabla hija `sesion_prescripciones` solo si se porta "Compliance de la Indicación". **`add` se renombra a `adherencia`** (palabra clave SQL). `UNIQUE(expediente_id, numero)` y `CHECK(status IN ('borrador','validado'))`.

### 7.4 Normalización de vocabulario y CHECKs

- `modalidad`: unificar a `'presencial'|'online'` en `expedientes_clinicos`; normalizar `citas.modalidad` en la misma V7 o mapear en DTO.
- `risk_level`: añadir `CHECK ('bajo','medio','alto')` en `pacientes` (V3 no lo tiene).
- `estatus_expediente`: catálogo cerrado (`ACTIVO`, `EN_TRATAMIENTO`, `EN_DIAGNOSTICO`, `CERRADO`, `ARCHIVADO`) y display string en el DTO.

### 7.5 Semilla V7 (DATA)

- Extender `exp-001`/`exp-002` con las 12 columnas nuevas; crear `exp-003` (pac-003) y `exp-004` (pac-004).
- Sembrar sesiones: `ses-001`/`ses-002` (exp-001) y `ses-003`/`ses-004` (exp-002); consentimiento `con-001` (pac-001).
- `ON CONFLICT (id) DO NOTHING` para nuevos; `DO UPDATE SET ...` para extender los expedientes existentes.
- ⚠️ **Divergencia mock vs seed**: los **textos clínicos** de la demo son la fuente a portar, pero deben sembrarse sobre los registros reales `pac-001…pac-004`; NO replicar ids/nombres del mock (`patient-1` "Sofía Martínez", terapeuta "Dr. Alejandro Silva").
