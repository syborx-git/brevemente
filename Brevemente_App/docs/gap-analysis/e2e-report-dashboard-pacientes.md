# E2E Test Report & Oracle Validation: Portal del Paciente (`/mi-historial`)

- **Fecha**: 2026-10-25
- **Módulo**: `dashboard-pacientes` → Portal del Paciente (`/mi-historial`)
- **SDD Asociado**: `sdd-dashboard-pacientes.md` + migración Flyway `V17__introduce_portal_paciente.sql`
- **Rama**: `feature/jp-mi-consulta-configuracion-terapeuta-y-cambios-panel-principal`
- **Ambiente de Ejecución**: SDOP local contra oráculo real (sin mock)
  - **Frontend**: Angular 18 en `http://localhost:4200` (`ng serve`)
  - **Backend**: Spring Boot 3.3.3 en `http://localhost:8080` (`context-path: /api/v1`)
  - **Base de Datos**: PostgreSQL 17 (`brevemente_db`) con Flyway `V1`–`V18`
  - **Motor de Pruebas**: Playwright 1.63.0 (Headless Chromium 1280x720)
- **Spec**: `tests/e2e/dashboard-pacientes.spec.ts`
- **Rol**: QA Automation Lead
- **Estado Global**: **APROBADO (100% PASS)**

---

## 1. Resumen Ejecutivo de Ejecución

```text
Running 4 tests using 1 worker

  ✓  1 [chromium] › TC-DP-01: El patient aterriza en su portal sin shell de staff (role-gating) (1.6s)
  ✓  2 [chromium] › TC-DP-02: Próxima cita con badges de asistencia y pago + aviso de seguridad clínica (1.4s)
  ✓  3 [chromium] › TC-DP-03: Historial con empty-state cuando no hay citas pasadas (1.4s)
  ✓  4 [chromium] › TC-DP-04: Prescripciones por sesión expandibles (ses-001 → cit-001) (1.4s)

  4 passed (6.7s)
```

| Métrica | Valor Obtenido | Umbral de Aceptación | Estado |
| :--- | :---: | :---: | :---: |
| **Casos Ejecutados** | 4 | 4 | **100%** |
| **Casos Aprobados** | 4 | 4 | **100%** |
| **Errores en Consola JS** | 0 | 0 | **PASS** |
| **Excepciones No Capturadas** | 0 | 0 | **PASS** |
| **Errores de Servidor HTTP 5xx** | 0 | 0 | **PASS** |
| **Regresión Visual** | No aplica | — | **N/A** |

> El spec no incluye aserciones `toHaveScreenshot`; la validación es funcional y de oráculo (contenido real desde PostgreSQL).

---

## 2. Monitoreo de Consola y Red

Se instrumentaron listeners reactivos en Playwright en el `beforeEach` / `afterEach` de la suite
(`page.on('console')`, `page.on('pageerror')`, `page.on('response')`), con aserción de longitud cero
al cierre de **cada** caso:

- **Errores de consola**: 0. Se excluyen únicamente `favicon.ico` y respuestas `4xx` de recursos no críticos.
- **Excepciones JavaScript no capturadas**: 0.
- **Respuestas HTTP ≥ 500**: 0.
- **Autenticación del oráculo** (`POST /api/v1/auth/login`): **200 OK** con `roles: ["patient"]` y `pacienteId: pac-001`.
- **Redirección por permisos**: el paciente no posee `DASHBOARD_LEER`; `permissionGuard` lo redirige de `/` a `/mi-historial`, tal como espera el caso TC-DP-01.

---

## 3. Matriz de Casos de Prueba (Oráculo y E2E)

### TC-DP-01: El paciente aterriza en su portal sin shell de staff (role-gating)

- **Objetivo**: Verificar que el rol `patient` accede directamente a su portal y **no** recibe el armazón
  de navegación del personal clínico.
- **Evidencia verificada**:
  - Redirección efectiva a `/mi-historial` tras el login.
  - Encabezado `Hola, Mateo Herrera Santos` visible (nombre resuelto desde la base de datos).
  - Leyenda `Terapeuta asignado:` visible (`Dra. Sofía Ramírez Lozano`).
  - `app-sidebar` → **0** ocurrencias.
  - `app-risk-banner` → **0** ocurrencias.
  - `app-leva-button` → **0** ocurrencias.
  - `app-leva-drawer` → **0** ocurrencias.
  - Botón `Botón de Crisis` visible.
- **Resultado**: **PASS**

### TC-DP-02: Próxima cita con badges de asistencia y pago + aviso de seguridad clínica

- **Objetivo**: Validar que la próxima cita refleja el estado real de la cita y del pago,
  y que el aviso de seguridad clínica sembrado en `V17` se muestra.
- **Evidencia verificada**:
  - `Aviso de seguridad clínica` visible (registro `alerta-pac-001`, migración `V17`).
  - Badge `Próxima cita` visible (`cit-001`, estado confirmada).
  - Badge `Pendiente de pago` visible (campo denormalizado `citas.payment_status`).
- **Resultado**: **PASS**

### TC-DP-03: Historial con empty-state cuando no hay citas pasadas

- **Objetivo**: Confirmar que el historial distingue correctamente entre citas futuras y pasadas,
  y presenta un estado vacío explícito.
- **Evidencia verificada**:
  - Sección `Historial de Citas` visible.
  - Mensaje `Aún no hay citas en el historial` visible (el paciente solo tiene citas confirmada/pendiente).
- **Resultado**: **PASS**

### TC-DP-04: Prescripciones por sesión expandibles (`ses-001` → `cit-001`)

- **Objetivo**: Verificar la trazabilidad sesión → cita → prescripciones y la interacción de expansión.
- **Evidencia verificada**:
  - Indicador `2 prescripciones` presente y desplegable.
  - Bloque `Prescripciones asignadas en esta sesión` visible tras la expansión.
  - Prescripción `Cómo empeorar` listada (contenido real de la sesión `ses-001`).
- **Resultado**: **PASS**

---

## 4. Hallazgo de Entorno: origen permitido por CORS

Durante la primera ejecución la suite falló con **4/4 casos** por una causa **ajena a la aplicación**:

```text
TimeoutError: page.waitForURL: Timeout 15000ms exceeded.
HTTP 403 POST /api/v1/auth/login
Console: ERROR HttpErrorResponse
```

**Causa raíz:** el backend restringe los orígenes permitidos a `http://localhost:4200`,
`http://localhost:3000` y `http://127.0.0.1:4200` (`WebCorsConfig.java` / `SecurityConfig.java`).
Al servir la aplicación en cualquier otro puerto, el navegador envía un `Origin` no autorizado
y Spring responde **403 Forbidden** al `POST /auth/login`, por lo que nunca se produce la
redirección a `/mi-historial`.

Al ejecutar en el puerto **4200**, los 4 casos pasan sin cambios de código.

| Verificación | Resultado |
| :--- | :---: |
| `POST /api/v1/auth/login` directo al backend (8080, sin `Origin`) | **200** |
| `POST /api/v1/auth/login` vía proxy desde el puerto 4200 | **200** |
| `POST /api/v1/auth/login` vía proxy desde un puerto no autorizado | **403** |

**Recomendación:** ejecutar la suite siempre contra `http://localhost:4200` (valor por defecto de
`playwright.config.ts`) o, si se requiere otro puerto, añadirlo a la lista blanca de CORS **solo en perfil de desarrollo**.

---

## 5. Conclusión

- El Portal del Paciente cumple la paridad funcional esperada frente al oráculo real:
  role-gating, próxima cita, estado de pago, aviso de seguridad clínica, historial con
  empty-state y prescripciones por sesión.
- **Sin regresiones**: 0 errores de consola, 0 excepciones, 0 HTTP 5xx.
- La suite queda **verde** y es reproducible con:

```powershell
# Terminal 1 — Backend
cd Brevemente_App/backend
mvn spring-boot:run

# Terminal 2 — Frontend (puerto 4200 obligatorio por CORS)
cd Brevemente_App/frontend
npm start -- --port 4200

# Terminal 3 — Tests
cd Brevemente_App/frontend
npx playwright test dashboard-pacientes --reporter=list
```
