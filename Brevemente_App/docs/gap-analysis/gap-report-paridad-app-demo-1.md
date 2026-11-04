# GAP Analysis Report: Paridad Demo ↔ Fullstack

- **Fecha**: 2026-11-03
- **Módulo**: `brevemente_demo` (React + Vite, localStorage) → alinear contra `Brevemente_App` (Angular 18 + Spring Boot + PostgreSQL)
- **Rama**: `feature/jp-paridad-app-demo-1`
- **Estado**: AUDITADO (READ-ONLY)
- **Dirección**: "bajar de nivel" la app fullstack a la demo — todo lo que hoy vive en BD/backend debe persistir en **localStorage** del navegador, manteniendo el modelo de la demo.

---

## 0. Alcance y metodología

Auditoría de solo lectura de las dos apps:

- **Demo (React)**: `brevemente_demo/src/` — `pages/`, `components/`, `services/` (localStorage), `types/`, `data/mockData.ts`, `utils/`.
- **Fullstack (fuente de verdad)**: `Brevemente_App/frontend/src/app/` — `modules/`, `core/types/clinical.types.ts`, `core/data/mockData.ts`, `core/services/role-state.service.ts`, `core/guards/`.

Regla: **lo que tiene el fullstack y le falta a la demo** se registra como brecha. La demo se mantiene 100% localStorage (sin backend, sin JWT real), solo se le "agrega" la funcionalidad trabajada en el fullstack.

---

## 1. Inventario de componentes auditados

### 1.1 Demo (React) — 14 páginas + 16 servicios

| Página | Cobertura actual |
| :-- | :-- |
| `Dashboard.tsx` | Centro de control con filtros, 4 KPIs, perspectiva, acción dominante, agenda del día, pendientes |
| `ClinicalRecord.tsx` | Expediente con **8 pestañas** (datos, psiquiatria, tbe, pagos, auditoria, supervision, constancias, contrareferencia) |
| `Agenda.tsx` | Vistas día/semana/mes/año, festivos, solapamientos, reprogramación |
| `Patients.tsx` | Búsqueda por texto + tabla (con columna de pago forzada) |
| `MiConsulta.tsx` | Estación de trabajo (próxima sesión, alertas, borradores LEVA) |
| `PatientDashboard.tsx` | Portal paciente (crisis, WhatsApp, contra-referencia, citas+prescripciones) |
| `AIAssistant.tsx` | Chat LEVA (mock) + detección de riesgo |
| `Supervision.tsx` | Bitácoras + revisión de grabaciones |
| `SecurityAudit.tsx` | Alertas de riesgo + bitácora |
| `Library.tsx` / `Campus.tsx` / `Analytics.tsx` / `Reports.tsx` / `IntakeForm.tsx` | Bibliotecas, campus, desempeño, constancia, admisión |

Servicios localStorage: `patientService`, `appointmentService`, `recordService`, `sessionService`, `paymentService`, `physicalCertificateService`, `counterReferralService`, `auditLogService`, `riskSimulationService`, `supervisionLogService`, `supervisionRequestService`, `holidayService`, `therapistSettingsService`, `demoStateService`.

### 1.2 Fullstack (Angular) — 14 módulos

| Módulo | Persistencia |
| :-- | :-- |
| `expediente-clinico` | HTTP + localStorage (7 pestañas: tbe, psiquiatria, datos, pagos, auditoria, supervision, constancias) |
| `dashboard` | HTTP + localStorage (centro de control + vistas por rol) |
| `agenda` | HTTP + localStorage |
| `pacientes` | HTTP + localStorage (búsqueda + filtros + consentimiento) |
| `mi-consulta` | HTTP + localStorage |
| `configuracion` | HTTP + localStorage (terapeuta + sedes) |
| `patient-portal` (`/mi-historial`) | HTTP + localStorage |
| `supervision` | HTTP + localStorage |
| `asistente-leva` | **solo localStorage** (flag backend `false`) |
| `login` | **solo HTTP** (JWT) |
| `biblioteca-clinica`, `campus`, `desempeno`, `auditoria-seguridad` | **estáticas** (demo, sin port/adaptador) |

---

## 2. Matriz de correspondencia (Demo ↔ Fullstack)

| Dominio | Demo (React) | Fullstack (Angular) | Estado |
| :-- | :-- | :-- | :-- |
| Dashboard | `Dashboard.tsx` | `dashboard` + `views/` | ⚠️ alineado a nivel navegación; ver GAP |
| Pacientes | `Patients.tsx` | `pacientes` | ⚠️ faltan filtros (GAP-11) |
| Agenda | `Agenda.tsx` | `agenda` | ✅ alineado |
| Expediente | `ClinicalRecord.tsx` | `expediente-clinico` | ❌ **brechas grandes** (GAP-01…06) |
| Mi Consulta | `MiConsulta.tsx` | `mi-consulta` | ✅ alineado |
| Portal paciente | `PatientDashboard.tsx` | `patient-portal` | ✅ alineado |
| LEVA | `AIAssistant.tsx` + paneles | `asistente-leva` | ✅ alineado (ambos localStorage/mock) |
| Supervisión | `Supervision.tsx` | `supervision` | ✅ alineado |
| Auditoría | `SecurityAudit.tsx` | `auditoria-seguridad` | ✅ alineado (ambos demo) |
| Biblioteca | `Library.tsx` | `biblioteca-clinica` | ✅ alineado (ambos estáticos) |
| Campus | `Campus.tsx` | `campus` | ✅ alineado (ambos estáticos) |
| Desempeño | `Analytics.tsx` | `desempeno` | ✅ alineado (ambos estáticos) |
| Configuración | inline en `App.tsx` | `configuracion` | ❌ falta terapeuta+sedes (GAP-09/10) |
| Login/Auth | selector de rol en `Header.tsx` | `login` (JWT) + `role-state` | ❌ sin JWT ni PBAC granular (GAP-07/08) |

---

## 3. Matriz de brechas (GAPs)

Clasificación: **MISSING** (no existe), **PARTIAL** (existe pero incompleto), **INCORRECT** (comportamiento incorrecto), **DATA** (falta semilla de datos).

| ID | Tipo | Brecha | Impacto | Acción propuesta |
| :-- | :-- | :-- | :-- | :-- |
| PAR-01 | MISSING | **Historia clínica** (datos → historia): antecedentes patológicos/no patológicos/heredo-familiares, examen mental (10 secciones) y evaluación de riesgo, presentes en fullstack (SDD-HC-3), no existen en la demo | Alto | Añadir tab "Historia clínica" con 5 cards + modal de examen mental + riesgo, persistido en `recordService` (localStorage) |
| PAR-02 | PARTIAL | **Ficha de identificación** de 7 secciones (identificación, fecha inicio, fuente de referencia, tratamientos previos, fármacos, psicofármacos, drogas) — la demo solo muestra ficha básica | Alto | Añadir las 7 secciones con `historialFarmacos/Psicofarmacos/Drogas`, `fuenteReferencia`, `tratamientosPrevios` en `recordService` |
| PAR-03 | PARTIAL | **Expediente Médico Psiquiátrico** de 8 secciones (motivo, DX nosológico, DX.DIF, plan, pronóstico, fármacos, psicofármacos, drogas). La demo tiene un único formulario plano; los campos `comorbilidad`, `differentialDx`, `favorableFactors`, `unfavorableFactors`, `drugsUsage` existen en el tipo pero **no se renderizan**; no hay `farmacosEsquema`/`drogasEsquema`/`usoDrogas` | Alto | Rediseñar la pestaña psiquiatría en 8 secciones; añadir campos `farmacosEsquema`, `drogasEsquema`, `usoDrogas` al tipo `ClinicalRecord` y al `recordService` |
| PAR-04 | MISSING | **TBE sin subtab "criterios"**: la demo embebe "Registro de Criterios Clínicos" dentro de VC; el fullstack tiene subtab independiente `criterios` (categorías + opciones conductuales) | Medio | Extraer los criterios a subtab propio con `criterios` y catálogo de opciones conductuales |
| PAR-05 | INCORRECT | **VC/VG/RST no persisten**: `vcHistory`/`vgHistory` son `useState` local en la demo y se pierden al recargar; en fullstack forman parte del expediente persistente | Alto | Persistir `valoracionCambio`/`valoracionGlobal` en `sessionService`/`recordService` |
| PAR-06 | PARTIAL | **Esquema psicotrópico reducido**: la demo no separa psicofármacos (`drugsList` con `categoria`) de fármacos/drogas vigentes; no agrupa por categoría | Medio | Añadir `categoria` al fármaco del esquema y separar los 3 conceptos (esquema / fármacos / drogas) |
| PAR-07 | MISSING | **Login JWT / sesión**: la demo cambia rol por dropdown (`Header.tsx`), sin login, expiración ni refresh | Medio | Mantener la simulación de rol (no se pide JWT real en demo), pero documentar/mapear el flujo de `login` fullstack como referencia |
| PAR-08 | PARTIAL | **Permisos granulares (PBAC)**: demo tiene 13 módulos en `utils/permissions.ts`; fullstack tiene permisos por acción (23 en el tipo `Permission`, 25 en BD) | Medio | Ampliar el mapa de permisos de la demo hacia permisos por acción, manteniendo el modelo por rol/módulo |
| PAR-09 | MISSING | **Configuración del terapeuta**: nombre, cédula, especialidad, costos (1ª/seguimiento), duración default — la demo solo expone `edadMinimaAtencion` | Medio | Crear pantalla de configuración y **añadir** los campos (nombre, cédula, especialidad, costos, duración) al tipo y a `therapistSettingsService` (hoy solo tiene `edadMinimaAtencion`/`consultorioDefault`/`firmaDigitalHabilitada`) |
| PAR-10 | MISSING | **Sedes**: la demo hardcodea sedes (`centro/norte/sur`); en fullstack el catálogo ya existe (V11/V20 + endpoints de solo lectura `/dashboard/catalogos`, `/sedes/{id}`) | Medio | Bajar el catálogo de sedes a localStorage en la demo (sin tocar BD/backend); si se requiere CRUD de sedes en demo, eso sería un gap backend nuevo |
| PAR-11 | MISSING | **Filtros de pacientes**: la demo solo tiene búsqueda por texto (nombre); fullstack filtra por texto (nombre/CURP), `statusFilter` (estado) y `consentFilter` (consentimiento) — no por riesgo/terapeuta/sede | Medio | Añadir búsqueda por CURP y filtros de estado + consentimiento al directorio |
| PAR-12 | DATA | **Semilla incompleta (solo demo)**: `mockClinicalRecords` solo `patient-1`/`patient-2`; `mockSessions` solo `patient-1`. La semilla fullstack (Flyway V2/V3/V6/V7) ya cubre a todos sus pacientes; el gap es solo en `mockData.ts` de la demo | Medio | Completar la semilla de la demo tomando V2/V3/V6/V7 como fuente |
| PAR-13 | INCORRECT | **"Hoy" hardcodeado**: `todayStr = '2026-08-24'` en `Dashboard.tsx`/`MiConsulta.tsx`; `anchorDate` en `Agenda.tsx` | Bajo | Usar la fecha real del sistema |
| PAR-14 | PARTIAL | **Constancias**: `Reports.tsx` solo genera constancia psicoterapéutica; el tipo contempla 5 tipos (psiquiátrica, asistencia, informe pericial, justificante) | Bajo | Completar tipos de constancia en el formulario |
| PAR-15 | PARTIAL | **Reglas de negocio desconectadas**: columna de pago y recordatorio forzados a `true` (`showPaymentColumn`, `showPaymentReminder`); no usan `therapistService.shouldShowPaymentColumn`/`canManagePayments` | Bajo | Conectar la regla de negocio existente |
| PAR-16 | FORMAT | **Dashboard con tabla/gráfica "invertida"** (observación de los doctores). Pendiente de precisar: la "Perspectiva Clínica Unificada" (ZONA 5 de la demo) ya usa el mismo patrón que el fullstack (una gráfica + selector citas/fases/protocolos); la observación parece referirse a otra tabla | Alto | Clarificar con el supervisor/doctores qué tabla exacta está "invertida" antes de actuar; no tocar la ZONA 5 que ya está alineada |
| PAR-17 | MISSING | **Tipo de terapia al agendar cita** (individual, pareja, familiar, grupal…). En BD la columna `citas.tipo_sesion` ya existe (V1, default 'INDIVIDUAL') pero está **huérfana**: sin mapeo JPA, sin CHECK y sin uso; el flujo actual usa `tipo_cita` = fase (primera/seguimiento/cierre) | Alto | **Doble alcance**: (fullstack) reutilizar `citas.tipo_sesion` — mapearla en JPA, añadir CHECK y exponerla en DTO/modal; (demo) añadir el campo a `Appointment` y selector en nueva cita |
| PAR-18 | PARTIAL | **Modalidad presencial/online al agendar**: fullstack la persiste (`Appointment.modality`); la demo **no** — el tipo `Appointment` no tiene campo `modality` y `handleSaveAppointment` no lo guarda; además el badge de la vista semana usa el estado global del formulario (bug) | Medio | Añadir `modality` al tipo `Appointment` de la demo, persistirla en `appointmentService` y corregir el badge; unificar nomenclatura (citas `PRESENCIAL/ONLINE` mayúsculas vs expedientes/demo `presencial/online` minúsculas) |

### 3.1 Requerimientos del supervisor (transcripción de audios)

1. **"Mismo formato demo ↔ fullstack"** — la demo aún tiene una tabla/gráfica "invertida" en el Dashboard (observación de los doctores). → **PAR-16** (no es la ZONA 5 "Perspectiva Unificada"; falta clarificar qué tabla exacta).
2. **"Cambios en Mi Consulta: agregar una opción en específico"** — la opción es el **agendamiento con modalidad y tipo de terapia** (el audio 2 lo aclara). → **PAR-17 / PAR-18**.
3. **"Al agendar cita: presencial/online + tipo de terapia (pareja, individual…)"** — **PAR-17** (tipo de terapia: la columna `tipo_sesion` existe en BD pero huérfana; requiere backend + demo) y **PAR-18** (modalidad: fullstack la persiste, la demo no).

---

## 4. Lo que la demo ya tiene de más (fuera de alcance)

> Nota del solicitante: **no interesa lo que la demo tiene de más**; el alcance es únicamente lo que le **falta** a la demo. Se listan solo como referencia, **no** se actúa sobre ellas:

1. Pestaña "Contra-referencia" en el expediente (demo).
2. Revisión de grabaciones en `Supervision.tsx` (demo).
3. Motor de protocolos `ProtocolDecisionPanel` (demo).
4. Constancias digitales (`Reports.tsx`) con vista previa PDF (demo).

---

## 5. Recomendaciones para la implementación

Prioridad sugerida (por valor clínico e impacto):

1. **PAR-01, PAR-02, PAR-03, PAR-05** — Expediente clínico (historia, ficha, psiquiatría 8 secciones, persistencia VC/VG). Es el grueso del trabajo y el corazón del alineamiento.
2. **PAR-16, PAR-17, PAR-18** — Dashboard (formato) y agendamiento (tipo de terapia + modalidad) — requerimientos directos del supervisor.
3. **PAR-06, PAR-04** — Esquema psicotrópico + subtab criterios TBE.
4. **PAR-09, PAR-10, PAR-11** — Configuración (terapeuta + sedes) y filtros de pacientes.
5. **PAR-08, PAR-07** — Permisos/roles (documentar flujo login, ampliar permisos).
6. **PAR-12, PAR-13, PAR-14, PAR-15** — Semilla, fechas reales, constancias, reglas de negocio.

**Alcance**: la gran mayoría es **solo demo** (`brevemente_demo/src/`), extendiendo servicios localStorage, `types/clinical.ts` y `data/mockData.ts`. **Excepción**: PAR-17 (tipo de terapia) tiene **doble alcance** — requiere tocar backend/fullstack (reutilizar `citas.tipo_sesion` huérfana) y luego bajarlo a la demo.

---

## 6. Siguiente paso

Con este informe aprobado, se procede a un SDD por cada bloque (o un SDD único de paridad) antes de tocar código, conforme al flujo SDOP del equipo.
