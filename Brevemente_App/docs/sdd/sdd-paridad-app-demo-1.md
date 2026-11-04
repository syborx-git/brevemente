# SDD-PAR-1: Software Design Document — Paridad Demo ↔ Fullstack

- **Código SDD**: `SDD-PAR-1`
- **Versión**: 1.0.0
- **Fecha**: 2026-11-03
- **Estado**: ✅ APROBADO (auditado por `jarvis-database`, `jarvis-backend` y `jarvis-frontend`)
- **Sucede a**: `gap-report-paridad-app-demo-1.md` (aprobado por los 3 agentes)
- **Módulos**: `brevemente_demo` (React + Vite + localStorage) · `Brevemente_App` (solo PAR-17: Spring Boot hexagonal)
- **Dirección**: "bajar de nivel" la app fullstack a la demo — todo lo que hoy vive en BD/backend se persiste en **localStorage** del navegador, manteniendo el modelo de la demo.

> **Regla de Oro**: este documento es especificación (no escribe código). Lo consumirá `demo-gap-implementation`. Todo es **solo demo**, salvo **PAR-17** (doble alcance backend + demo).

---

## 0. Propósito y alcance

Alinear la demo React al fullstack, agregando a la demo lo que ya se trabajó en la app fullstack. Resuelve las brechas `PAR-01…PAR-18` del gap-report.

### 0.1 Bloques de trabajo

| Bloque | Brechas | Alcance |
| :-- | :-- | :-- |
| A. Expediente clínico | PAR-01…06 | solo demo |
| B. Agendamiento | PAR-17, PAR-18 | **PAR-17 doble (backend+demo)**, PAR-18 demo |
| C. Configuración | PAR-09, PAR-10 | solo demo |
| D. Pacientes | PAR-11 | solo demo |
| E. Permisos | PAR-08 | solo demo |
| F. Varios | PAR-12…15 | solo demo |
| — Bloqueado | PAR-16 | **pendiente de clarificar con supervisor** (no es la ZONA 5) |

### 0.2 Decisiones cerradas

| # | Decisión |
| :-- | :-- |
| D-1 | Persistencia demo = **localStorage** (`brevemente_*`), sin backend. |
| D-2 | **PAR-17** es la única con doble alcance: reutilizar la columna huérfana `citas.tipo_sesion` (ya existe en V1, default `INDIVIDUAL`, sin mapeo JPA ni CHECK). |
| D-3 | **PAR-16** queda bloqueado hasta clarificar qué tabla "invertida" señalaron los doctores (la ZONA 5 "Perspectiva Unificada" ya está alineada). |
| D-4 | En la demo, el rol se sigue simulando (sin JWT real); solo se amplía el mapa de permisos. |
| D-5 | La semilla fullstack (Flyway V2/V3/V6/V7) es la fuente de verdad para completar la semilla de la demo. |

---

## 1. Bloque A — Expediente clínico (PAR-01…06, solo demo)

### 1.1 Tipos (`brevemente_demo/src/types/clinical.ts`)

**EXTENDER** `Patient` (no `ClinicalRecord`) con: `rfc`, `sexo`, `lugarNacimiento`, `estadoCivil`, `escolaridad`, `ocupacion`, `religion`, `domicilio`, `contactoEmergencia` — en el fullstack estos campos viven en `Patient`, no en `ClinicalRecord`.

**EXTENDER** `ClinicalRecord` con:

- Identificación/expediente: `tipoExpediente`, `fechaApertura`, `fuenteReferencia`, `fuenteReferenciaOtro` (`startDate` ya existe; no reañadir).
- Historia clínica: `antecedentes?: Antecedentes`, `examenMental?: ExamenMental`, `fechaExamenMental?`, `riesgoSuicida?`, `riesgoHeteroagresivo?`, `otrosRiesgos?`, `riesgoSuicidaEspecificar?`, `riesgoHeteroagresivoEspecificar?`.
- Ficha (historiales): `historialFarmacos?: HistorialFarmaco[]`, `historialPsicofarmacos?: HistorialPsicofarmaco[]`, `historialDrogas?: HistorialDroga[]`.
- Psiquiatría: `farmacosEsquema?: HistorialFarmaco[]`, `drogasEsquema?: HistorialDroga[]`, `usoDrogas?: 'SI'|'NO'|'ESPECIFICAR'`, `intentosSolucion?: string`. Nota: `differentialDx`, `comorbilidad`, `favorableFactors`, `unfavorableFactors` **ya existen** en la demo (solo falta tipar/alinear); convertir `drugsList` a `Drug[]`.
- Tratamientos previos: `TratamientoPrevio[]` se persiste **aparte** (servicio propio, como `guardarTratamientosPrevios` del fullstack), no dentro de `ClinicalRecord`.

**NUEVOS tipos** (copiar del fullstack `core/types/clinical.types.ts`): `Antecedentes` (personalesPatológicos/personalesNoPatológicos/heredoFamiliares), `ExamenMental`, `HábitoPresente`, `TratamientoPrevio`, `HistorialFarmaco`, `HistorialPsicofarmaco`, `HistorialDroga`, `CategoriaPsicofarmaco`, `CodigoCategoriaPsicofarmaco` (9 valores), `CriterioCategoria`, `CriterioClinico`, `OpcionConductual`, `VcEntry`, `VgEntry`, `Domicilio`, `ContactoEmergencia`, `Drug`.

**EXTENDER** `Drug` con `categoria?: CodigoCategoriaPsicofarmaco`.

**EXTENDER** `Session` con `valoracionCambio?: VcEntry`, `valoracionGlobal?: VgEntry`, y añadir persistencia de `criterios` por sesión.

### 1.2 Servicios

- `recordService` (`brevemente_clinical_records`): añadir `guardarCriteriosSesion`, `listarOpcionesConductuales`, y persistir los campos nuevos de `ClinicalRecord` (ya cubiertos por `saveByPatientId` al serializar el objeto completo).
- `sessionService` (`brevemente_sessions`): persistir `valoracionCambio`/`valoracionGlobal` y `criterios` en cada sesión.

### 1.3 UI (`pages/ClinicalRecord.tsx`)

| Tab | Cambio |
| :-- | :-- |
| `datos` | Añadir sub-tabs **generales / historia / ficha** |
| `datos > historia` | 5 cards (Antecedentes Patológicos, No Patológicos, Heredo Familiares, Examen Mental con modal, Evaluación de Riesgo) + modal de examen mental (9 secciones + evaluación de riesgo + síntesis) |
| `datos > ficha` | 7 secciones (identificación, fecha inicio, fuente de referencia, tratamientos previos, fármacos, psicofármacos, drogas) |
| `psiquiatria` | Rediseñar en **8 secciones** (motivo, DX nosológico, DX.DIF, plan, pronóstico, fármacos, psicofármacos agrupados por categoría, drogas) + conservar Esquema |
| `tbe` | Añadir subtab **criterios** (registro independiente por sesión, como en fullstack; comparte selector de sesión con VC) con categorías + opciones conductuales |
| `tbe > vc/vg` | Persistir `valoracionCambio`/`valoracionGlobal` en `sessionService` (hoy es `useState`) |

> Reutilizar las estructuras HTML/estilos ya aprobados en el fullstack como referencia, pero implementadas en JSX + Tailwind de la demo.

---

## 2. Bloque B — Agendamiento (PAR-17 doble + PAR-18 demo)

### 2.1 Backend (solo PAR-17 — tipo de terapia)

La columna `citas.tipo_sesion` ya existe (V1, `VARCHAR(30) DEFAULT 'INDIVIDUAL'`) pero está huérfana. Se **reutiliza**, no se crea columna nueva.

| Componente | Cambio |
| :-- | :-- |
| Migración `V25__cita_tipo_sesion_check.sql` | 3 pasos: (1) `UPDATE citas SET tipo_sesion = 'individual' WHERE tipo_sesion = 'INDIVIDUAL';` (normalizar el default de V1); (2) `ALTER TABLE citas ALTER COLUMN tipo_sesion SET DEFAULT 'individual';`; (3) CHECK idempotente **`ck_citas_tipo_sesion`**: `tipo_sesion IS NULL OR tipo_sesion IN ('individual','pareja','familiar','grupal')` (guard `pg_constraint`, como las existentes). La columna queda **nullable** (sin `NOT NULL`). |
| `CitaJpaEntity` | Añadir `@Column(name="tipo_sesion", length=30) String tipoSesion` |
| `Cita` (dominio) | Añadir `String tipoSesion` |
| `CitaCreateRequest` | Añadir `@Schema(allowableValues={"individual","pareja","familiar","grupal"}) String tipoTerapia` **al final** del record posicional |
| `CitaResponseDTO` | Añadir `String tipoTerapia` **al final** de los componentes (record posicional; `toResponse` construye posicionalmente) |
| `CitaRestMapper` | `toDomain(CitaCreateRequest)`: `.tipoSesion(request.tipoTerapia())`; `toResponse`: añadir `domain.getTipoSesion()` en la posición correspondiente (no existe `toParcial`; el parámetro es `Cita domain`) |
| `CitaPersistenceMapper` | `toDomain`/`toJpaEntity` para `tipoSesion` |
| `SpringDataCitaRepository` | Añadir `c.tipo_sesion` a la lista SELECT de las 5 native queries con columnas explícitas: `findAllByFilters`, `findByDiaGlobal`, `findByDiaScoped`, `findProximaDeHoyGlobal`, `findProximaDeHoyScoped` |
| `CitaApplicationService` | En `agendar()`: default `tipoSesion = 'individual'` si viene null (patrón de `modalidad`) |

> **Nota de contrato**: en la API se usa `tipoTerapia` (legible); en BD/dominio se conserva `tipo_sesion`. Mapeo explícito en `CitaRestMapper`.

### 2.2 Demo (PAR-17 + PAR-18)

- **PAR-17**: añadir `tipoTerapia?: 'individual'|'pareja'|'familiar'|'grupal'` al tipo `Appointment` y un `<select>` "Tipo de terapia" en el modal de nueva cita (`Agenda.tsx`); persistir en `appointmentService`.
- **PAR-18**: añadir `modality?: 'presencial'|'online'` al tipo `Appointment`; guardarla en `handleSaveAppointment`; **corregir el bug** del badge de la vista semana (hoy usa `appModality` global del formulario en vez de `app.modality` de cada cita).
- **Nomenclatura**: la demo usa `presencial/online` (minúsculas) internamente; el backend usa `PRESENCIAL/ONLINE`. La normalización es **solo demo**; si en el futuro se sincroniza, traducir `presencial→PRESENCIAL` / `online→ONLINE`.

---

## 3. Bloque C — Configuración (PAR-09, PAR-10, solo demo)

- **PAR-09**: ampliar `therapistSettingsService` (`brevemente_therapist_settings`) con `therapistName`, `license`, `specialty`, `email`, `phone`, `defaultSessionDuration`, `costoPrimeraSesion`, `costoSeguimiento` (hoy solo tiene `edadMinimaAtencion`/`consultorioDefault`/`firmaDigitalHabilitada`). Crear pantalla `/configuracion` real.
- **PAR-10**: añadir catálogo de sedes en localStorage (nombre, `clues`, `licenciaSanitaria`, `tipoEstablecimiento` — sin `activo`, que no existe en el fullstack) y usarlo sustituyendo `getPatientSede` hardcodeado en `Dashboard.tsx`. Alcance: catálogo de **solo lectura** (como `obtenerSedesCatalog`), sin CRUD en la demo.

---

## 4. Bloque D — Pacientes (PAR-11, solo demo)

En `Patients.tsx`: añadir los **filtros** `statusFilter` (estado) y `consentFilter` (estado de consentimiento), replicando el fullstack. La búsqueda por texto ya existe (nombre/CURP/teléfono/email); no se añaden filtros por riesgo/terapeuta/sede (el fullstack no los tiene).

---

## 5. Bloque E — Permisos (PAR-08, solo demo)

Ampliar `utils/permissions.ts` desde los 13 módulos actuales hacia **permisos por acción** (referencia: los 23 del tipo `Permission` del fullstack), manteniendo la resolución por rol. No se implementa JWT (D-4).

---

## 6. Bloque F — Varios (PAR-12…15, solo demo)

- **PAR-12**: completar `mockData.ts` con la semilla fullstack V2/V3/V6/V7 **tal cual** (pac-001..004, exp-001..004, cit-001..006, ses-001..004), sin inventar sesiones para pac-003/004 (que en fullstack no las tienen); reflejar el estado final **post-V7**.
- **PAR-13**: sustituir las fechas fijas "de demostración" por la fecha real del sistema. Puntos clave: `todayStr` y rango de semana en `Dashboard.tsx`, `todayStr` en `MiConsulta.tsx`, `anchorDate`/`date`/`reprogrammingDate`/`personalDayDate`/`goToday` en `Agenda.tsx`, `periodStart`/`periodEnd` en `Reports.tsx`, y las semillas (`mockData.ts`, `academicData.ts`, `paymentService.ts`, `physicalCertificateService.ts`, `supervisionLogService.ts`, `holidayService.ts`). Revisar también fechas fijas en `ClinicalRecord.tsx`, `Supervision.tsx`, `Campus.tsx`, `Analytics.tsx` y `RegisterPhysicalCertificateModal.tsx`.
- **PAR-14**: completar los 5 tipos de constancia (`PhysicalCertificateType`) en `Reports.tsx`.
- **PAR-15**: conectar `therapistService.shouldShowPaymentColumn`/`canManagePayments` en vez de forzar `true`.

---

## 7. Bloqueado — PAR-16 (Dashboard)

**No se implementa** hasta clarificar con el supervisor/doctores qué tabla concreta está "invertida". La ZONA 5 "Perspectiva Clínica Unificada" ya está alineada con el fullstack (mismo patrón de gráfica + selector).

---

## 8. Verificación

- **Demo**: `npm run build` limpio; smoke manual de los flujos (expediente 8 secciones, agenda con tipo de terapia + modalidad, filtros de pacientes, configuración).
- **Backend (PAR-17)**: `mvn test-compile` limpio; smoke `POST /citas` con `tipoTerapia`; Flyway aplica V25.
- **E2E**: si el equipo lo requiere, actualizar los casos de agenda/expediente en la demo.

---

## 9. Riesgos y observaciones

1. **PAR-17 doble alcance**: requiere commit en `Brevemente_App` (backend) + `brevemente_demo` (demo). Coordinar el PR de backend primero.
2. **PAR-16 bloqueado**: no bloquear los demás bloques; avanza A/B/C/D/E/F en paralelo.
3. **Semilla de la demo**: mantener coherencia con el fullstack (mismos `id`/nombres de pacientes) para facilitar pruebas.
4. **Nomenclatura modalidad**: citas `PRESENCIAL/ONLINE` (mayúsculas) vs expedientes/demo `presencial/online` (minúsculas); unificar en la demo a minúsculas internamente y traducir en el badge.

---

## 10. Estado documental

- [x] Gap-report aprobado (base)
- [x] Especificación (demo + backend PAR-17)
- [x] Auditoría por `jarvis-database`, `jarvis-backend` y `jarvis-frontend`
- [ ] Implementación (`demo-gap-implementation`)
- [ ] Validación
