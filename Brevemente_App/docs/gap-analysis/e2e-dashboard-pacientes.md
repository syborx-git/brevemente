# E2E: Portal del Paciente (`/mi-historial`) — `dashboard-pacientes`

- **Fecha**: 2026-10-20
- **Spec**: `Brevemente_App/frontend/tests/e2e/dashboard-pacientes.spec.ts`
- **Módulo**: `patient-portal` (Angular) ↔ `portalpaciente` (Spring Boot) ↔ `V17__introduce_portal_paciente.sql`
- **Referencias**: `docs/sdd/sdd-dashboard-pacientes.md`, `docs/gap-analysis/gap-report-dashboard-pacientes.md`

---

## 1. Objetivo

Validar de punta a punta, contra el **oráculo real** (Spring Boot + PostgreSQL), que un usuario con rol `patient`:

1. Aterriza en su portal `/mi-historial` (no en el dashboard staff ni en `/mi-consulta`).
2. No ve superficies de staff (sidebar, risk-banner, LEVA) — role-gating del shell.
3. Ve sus citas con badges de asistencia y pago, su aviso de seguridad clínica y sus prescripciones expandibles.
4. No genera errores de consola ni respuestas HTTP 5xx.

---

## 2. Prerrequisitos

- Backend levantado en `http://localhost:8080` con la migración **V17** aplicada (Flyway).
- PostgreSQL 17.10 con el seed de V1–V17.
- Frontend Angular servido en `http://localhost:4200` (`ng serve` o build + proxy `/api/v1` → `:8080`).
- Playwright: `npx playwright test tests/e2e/dashboard-pacientes.spec.ts`.

---

## 3. Datos del oráculo (fixtures)

| Recurso | Valor | Origen |
| :--- | :--- | :--- |
| Usuario patient | `contacto.mateo@familia.mx` / `demo123` (`usr-pac-001`) | V6 |
| Paciente vinculado | `pac-001` (Mateo Herrera Santos) | V2/V6 |
| Terapeuta asignado | `ter-001` (Dra. Sofía Ramírez Lozano) | V3 |
| Permisos | `MIS_CITAS_LEER` (perm-017) y `MIS_SESIONES_LEER` (perm-024) → `rol-006` | V6 / V17 |
| Citas (pac-001) | `cit-001` confirmada, `cit-002` y `cit-005` pendientes | V6 |
| Sesiones → citas | `ses-001`→`cit-001` (2 prescripciones), `ses-002`→`cit-002` (1 prescripción) | V17 |
| Alerta activa | `alerta-pac-001` (seguridad_clinica) | V17 |

---

## 4. Casos de prueba

### TC-DP-01 — Aterrizaje y role-gating del shell
**Flujo**: login patient → redirección.
- Esperado: `waitForURL('**/mi-historial')` (el patient no tiene `DASHBOARD_LEER`).
- Aserciones:
  - `Hola, Mateo` (nombre desde `/portal-paciente/perfil`).
  - `Terapeuta asignado:` visible.
  - `app-sidebar`, `app-risk-banner`, `app-leva-button`, `app-leva-drawer` con `toHaveCount(0)`.
  - Botón "Botón de Crisis" visible.

### TC-DP-02 — Badges de asistencia/pago y aviso de seguridad
- Aserciones:
  - `Aviso de seguridad clínica` visible (alerta seed).
  - `Próxima cita` (badge de `cit-001` confirmada).
  - `Pendiente de pago` (badge de `cit-001` desde `citas.payment_status`).

### TC-DP-03 — Empty-state del historial
- `pac-001` no tiene citas pasadas (solo `confirmada`/`pendiente`).
- Aserciones:
  - `Historial de Citas` visible.
  - `Aún no hay citas en el historial.` visible.

### TC-DP-04 — Prescripciones expandibles
- `cit-001` tiene `ses-001` vinculada con `["Cómo empeorar","Bitácora de la peor fantasía"]`.
- Aserciones:
  - Click en el badge `2 prescripciones` → `Prescripciones asignadas en esta sesión` y `Cómo empeorar` visibles.

---

## 5. Reglas de calidad (heredadas del patrón E2E del proyecto)

- `afterEach` falla si hay errores de consola (ignorando `favicon.ico` y 4xx esperados) o respuestas HTTP ≥ 500.
- `workers: 1` y `fullyParallel: false` (config global) para no interferir con el estado compartido de la BD.

---

## 6. Cómo ejecutar

```powershell
# 1. Backend (con PostgreSQL + V17 aplicada)
# 2. Frontend
cd C:\proyectos_Syborx\Brevemente_Demo\brevemente\Brevemente_App\frontend
npx ng serve --configuration development
# 3. E2E
npx playwright test tests/e2e/dashboard-pacientes.spec.ts
```

---

## 7. Resultados de la ejecución

- **Fecha de ejecución**: 2026-10-20
- **Resultado**: ✅ **4/4 passed** (5.6s, 1 worker)
  - TC-DP-01 — Aterrizaje y role-gating: PASS
  - TC-DP-02 — Badges de asistencia/pago + aviso de seguridad: PASS
  - TC-DP-03 — Empty-state del historial: PASS
  - TC-DP-04 — Prescripciones expandibles: PASS
- **Errores de consola**: 0. **HTTP 5xx**: 0.

### Hallazgos corregidos durante la ejecución

| # | Hallazgo | Causa raíz | Corrección |
| :--- | :--- | :--- | :--- |
| 1 | `cit-001` aparecía `cancelada` en vez de `confirmada` | Deriva de datos por pruebas previas sobre la BD de desarrollo (V6 la siembra `confirmada`; ninguna migración posterior la modifica) | `UPDATE citas SET estado_cita='confirmada' WHERE id='cit-001'` (corrección de datos en runtime; una BD fresca ya obtiene `confirmada` de V6, no se añade migración) |
| 2 | Badge mostraba "1 prescripción" para `cit-001` (2 px reales) | `cita-fila.component.ts` contaba **sesiones** (`prescripciones.length`) en lugar de **prescripciones reales** (`Σ s.px.length`), divergiendo del oráculo React que cuenta `prescriptions.length` | Getter `totalPrescripciones` = suma de `s.px.length`; `hasPrescripciones()` = `totalPrescripciones > 0`; filtrado de sesiones con px para el panel expandible |
| 3 | Badge renderizaba "prescripciónes" (plural con tilde) | Concatenación literal `prescripción` + sufijo `es`; el plural correcto pierde la tilde | Condicional de palabra completa: `totalPrescripciones > 1 ? 'prescripciones' : 'prescripción'` |
