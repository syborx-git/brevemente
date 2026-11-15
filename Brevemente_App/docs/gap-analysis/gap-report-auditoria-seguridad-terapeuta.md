# GAP Analysis Report: Módulo Auditoría y Seguridad (Franja Terapeuta)

- **Fecha**: 2026-10-28
- **Módulo**: Auditoría y Seguridad — alcance TERAPEUTA (fase 1)
- **Estado**: AUDITADO (READ-ONLY)
- **Demo de referencia**: `brevemente_demo/src/pages/SecurityAudit.tsx` + servicios `auditLogService`, `riskSimulationService`, componentes `RiskAlertBanner`, `CrisisResolutionModal`, `CrisisIncidentDetailModal`.

---

## 1. Alcance del Terapeuta (Fase 1)

Según el modelo de roles confirmado, el terapeuta **NO** accede a la página global
`/auditoria` (solo `admin_platform`, `admin_clinical`, `supervisor`). Su interacción
con el subsistema de seguridad se limita a:

1. **Ver la bitácora por paciente** (tab "Auditoría" del expediente).
2. **Ver un banner de riesgo** en el expediente con acciones "Escalar" / "Resuelto".
3. **Escalar una alerta de riesgo** desde el expediente (detectada por texto o manual).
4. **Resolver una alerta** con un protocolo clínico (modal de resolución de crisis).
5. **Alimentar la bitácora** con sus propias acciones (accesos, ediciones, uso de IA).

---

## 2. Inventario de Componentes Auditados

### 2.1 Demo (React) — lado terapeuta
| Artefacto | Contenido relevante |
| :--- | :--- |
| `RiskAlertBanner.tsx` | Banner rojo con botones "Escalar"/"Resuelto" y recursos de crisis 24/7 |
| `SecurityAudit.tsx` | `handleResolveAlert` invoca resolución (roles supervisor/admin/therapist) |
| `CrisisResolutionModal.tsx` | Protocolo: contacto, nivel de riesgo, checklist de acciones, nota clínica, indicaciones al paciente |
| `CrisisIncidentDetailModal.tsx` | Acta de resolución (trazabilidad) |
| `riskSimulationService.ts` | `checkTextForRisk` (detección por palabras), `escalateRisk`, `resolveAlert`, `getAlerts` |
| `auditLogService.ts` | `addLog`, `getLogs`, `clearLogs` |

### 2.2 Backend Spring Boot — estado actual
| Artefacto | Estado |
| :--- | :--- |
| `auditoria_expediente` (V8) | Tabla + `AuditoriaExpedientePort.registrar()/listarPorPaciente()` |
| `GET /expedientes/paciente/{id}/auditoria` | ✅ Existente (`EXPEDIENTE_LEER`) — ya consumido por el tab Auditoría |
| `auditoria_configuracion` (V15) | Bitácora de cambios de configuración (Mi Consulta) |
| `alerta_paciente` (V17) | Tabla de alertas (`tipo`, `mensaje`, `estado`, `resuelta_por`, `resuelta_en`) |
| `POST /portal-paciente/crisis` | Escalado del **paciente** (no staff) |
| `GET /alertas/activas` | Listado staff de alertas activas (`MI_CONSULTA_LEER`) — ya usado por Mi Consulta |
| `PATCH /alertas/{id}/resolver` | Resolución **sin protocolo** (sin body) — ya usado por Mi Consulta |
| Permiso `ALERTAS_GESTIONAR` (perm-025, V18) | Resolución: rol-001/002/003/005 (admin + therapist + supervisor) |

---

## 3. Matriz de Reutilización de Código Existente

| Componente Backend | Estado Actual | Estrategia SDOP |
| :--- | :--- | :--- |
| `alerta_paciente` + `AlertaPaciente` | Tabla y dominio existentes | **Extender** con `nota` y `detalle_resolucion` (V20) |
| `AlertasStaffRestController` | GET activas + PATCH resolver | **Extender** con POST escalar, GET resueltas, GET {id}, resolver con protocolo |
| `AuditoriaExpedientePort.registrar` | Escritura per-paciente | **Reutilizar** al escalar/resolver alertas |
| `IdentidadAutenticadaPort.sub()` | Identidad del principal | **Reutilizar** para `resueltaPor` y `usuarioId` |
| `DashboardScopeResolver` | Scope Global/Scoped | **Reutilizar** en listados staff |
| `SpringDataAlertaPacienteRepository` | Queries nativas | **Extender** con `nota`, `detalle_resolucion` y filtro por estado |

---

## 4. Matriz de Brechas (GAPs) Identificadas

| ID | Tipo | Brecha | Impacto | Acción Propuesta |
| :--- | :--- | :--- | :--- | :--- |
| GAP-T1 | MISSING | No existe endpoint de **escalado por staff** (`POST /alertas` con `pacienteId`, `mensaje`, `nota`). Solo el paciente escala desde su portal. | Alto | Crear `EscalarAlertaStaffUseCase` + `POST /alertas` |
| GAP-T2 | PARTIAL | `alerta_paciente` no guarda `nota` (quién/motivo del escalado) ni `detalle_resolucion` (protocolo de crisis). | Alto | Migración V20: columnas `nota TEXT` + `detalle_resolucion JSONB` |
| GAP-T3 | PARTIAL | `PATCH /alertas/{id}/resolver` no recibe el **protocolo de resolución** (`CrisisResolutionDetails`). | Alto | Extender `resolver` con body opcional `ResolverAlertaRequest` |
| GAP-T4 | MISSING | No hay endpoint para **consultar el acta** de resolución (`GET /alertas/{id}` con detalle). | Medio | Crear `obtener(id)` en use case + endpoint |
| GAP-T5 | MISSING | No hay endpoint de **historial de alertas atendidas** (`GET /alertas/resueltas`). | Medio | Crear listado por estado resuelta |
| GAP-T6 | PARTIAL | **Detección de riesgo por texto** (`checkTextForRisk`) solo existe en la demo (frontend). | Medio | Servicio backend `DetectarRiesgoTexto` (palabras críticas) o mantener en frontend |
| GAP-T7 | MISSING | **Banner de riesgo** en el expediente Angular (vista terapeuta) no existe. | Medio | Fase frontend: componente `risk-banner` en expediente-clinico |

---

## 5. Brechas de la franja de Roles Superiores (fase 2 — solo backend)

| ID | Tipo | Brecha | Acción Propuesta |
| :--- | :--- | :--- | :--- |
| GAP-S1 | MISSING | No existe **bitácora general** global (logs de todas las categorías con filtros/búsqueda). | Tabla `auditoria_general` + `GET /auditoria/general` |
| GAP-S2 | MISSING | No existe **vaciar bitácora** (admin). | `DELETE /auditoria/general` (`AUDITORIA_GESTIONAR`) |
| GAP-S3 | PARTIAL | La escritura de auditoría general no está cableada a los módulos. | `AuditoriaGeneralPort.registrar()` + wiring en escalar/resolver |

---

## 6. Recomendaciones para demo-gap-implementation

1. **V20**: extender `alerta_paciente` (`nota`, `detalle_resolucion`) + crear `auditoria_general` + permisos `AUDITORIA_LEER`/`AUDITORIA_GESTIONAR`.
2. **Backend** (hexagonal): extender dominio `AlertaPaciente`/`AlertaStaff` con `DetalleResolucionCrisis`; nuevos casos de uso staff; nuevo módulo de auditoría general (domain + ports + service + persistence + REST).
3. **Frontend** (fase terapeuta): banner de riesgo + modal de resolución en `expediente-clinico`, y cablear `POST /alertas` desde el puerto del expediente.
4. **Frontend** (fase superiores): reconstruir `/auditoria` con la bitácora global real + alertas + resolución.
