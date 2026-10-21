# E2E Report: Módulo Agenda / Citas — Calendario Clínico (Validación de Oráculo y Regresión Visual)

- **Fecha**: 2026-10-06
- **Módulo**: `agenda` (citas de pacientes + calendario clínico)
- **Suite**: `Brevemente_App/frontend/tests/e2e/agenda.spec.ts`
- **Oráculo**: Angular 18 (`http://localhost:4200`) → Spring Boot 3.3.3 (`/api/v1`, puerto 8080) → PostgreSQL 17 (`brevemente_db`)
- **Rama**: `feature/jp-agenda-calendario-citas`
- **Estado**: ✅ **APROBADO**

---

## 1. Resumen de ejecución

| Métrica | Resultado |
| :--- | :--- |
| Casos de prueba | 4 |
| Pasaron | **4 / 4 (100%)** |
| Fallaron | 0 |
| Errores de consola (JS) | 0 |
| Errores HTTP 500 | 0 |
| Regresión visual | ✅ Sin diferencias (`maxDiffPixelRatio: 0.01`) |
| Duración total | ~15 s (1 worker, Chromium) |

Se ejecutó en **dos pasadas**: la primera con `--update-snapshots` para generar el baseline de regresión visual; la segunda con comparación directa contra dicho baseline. Ambas pasaron.

---

## 2. Detalle de casos de prueba

### TC-AG-01 — Carga y oráculo de datos reales desde Spring Boot/PostgreSQL ✅
- Navega a `/agenda` con sesión JWT autenticada (sofia.ramirez@brevemente.org).
- Verifica el título clínico **"Agenda y Calendario Clínico"**.
- Verifica el **banner de Control Normativo**.
- Verifica nombres de pacientes servidos por el oráculo (`Mateo Herrera Santos`, `Emiliano Díaz Corona`) en la vista semanal, demostrando el **join SQL** `citas → pacientes`.

### TC-AG-02 — Navegación del calendario (día/semana/mes/año) y detalle de cita ✅
- Cambia a vista **Día** y verifica la tarjeta **"Bloqueada por Normativa"** (pac-001, menor sin consentimiento firmado tras V6).
- Cambia a vista **Mes** y verifica la cuadrícula mensual (cabecera de días `Lun`…`Dom`).
- Cambia a vista **Año** y verifica el resumen anual (`Año 2026`, 12 tarjetas mensuales).
- Vuelve a **Día**, abre la cita del paciente y verifica el **drawer "Detalle de Consulta"**.

### TC-AG-03 — Apertura del modal de agendar con duración, modalidad y consultorio ✅
- Abre el modal **"Agendar Sesión Clínica"** desde el botón `Agendar Cita`.
- Verifica los campos de programación: fecha (`input[type=date]`), hora (`input[type=time]`), **Duración** (30/45/60 min), **Modalidad** (Presencial/Online) y **Consultorio** (A/B).
- Cierra el modal y verifica que desaparece.

### TC-AG-04 — Regresión Visual del Calendario con Oráculo Real ✅
- Captura `agenda-calendario.png` a `fullPage`.
- Compara contra el baseline con `maxDiffPixelRatio: 0.01` (sin diferencias).

---

## 3. Monitoreo de errores de consola y red

Siguiendo el protocolo de la suite:

- **`page.on('console')`**: registra errores de tipo `error`, ignorando `favicon.ico` y los "Failed to load resource" 4xx (p. ej. 401 esperados).
- **`page.on('pageerror')`**: registra excepciones JavaScript no capturadas.
- **`page.on('response')`**: registra cualquier respuesta HTTP ≥ 500.

**Resultado**: 0 errores de consola, 0 excepciones JS y 0 respuestas 5xx durante toda la ejecución. El `afterEach` fallaría la suite ante cualquier incidencia.

---

## 4. Regresión visual

- **Baseline**: `tests/e2e/agenda.spec.ts-snapshots/agenda-calendario-chromium-win32.png` (generado en la primera pasada con `--update-snapshots`).
- **Comparación**: sin diferencias de píxeles (`maxDiffPixelRatio: 0.01`, `fullPage: true`).

---

## 5. Observaciones

- **Portado del calendario de la demo React**: `agenda.component` ahora implementa el componente tipo calendario con 4 niveles de navegación (Día, Semana, Mes, Año), controles `‹ › Hoy`, conmutador de bloqueo de festivos (dentro de la barra de navegación del calendario) y leyenda de frecuencia de sesiones.
- **Cancelación con confirmación**: el botón "Cancelar" abre un modal de confirmación ("¿Cancelar esta cita?") con checkbox de notificación por WhatsApp; el drawer muestra "Notificar cancelación por WhatsApp" en citas `cancelada`.
- **Máquina de estados**: en frontend (`puedeConfirmar`/`puedeCancelar`) y en backend (`TransicionEstadoCitaInvalidaException` → 409). Smoke test directo de API: cancelar una cita `completada` devuelve HTTP 409.
- El backend quedó **corriendo en el puerto 8080** con la migración Flyway **V6** aplicada y la corrección de **zona horaria** (las citas se devuelven en `America/Mexico_City`, p. ej. `09:00`).
- La base contiene la semilla V6 (7 citas); `pac-001` figura con consentimiento sin firmar (caso de "Bloqueada por Normativa").
- La prueba de regresión visual quedó registrada en Playwright con trazado `retain-on-failure`.
- Se eliminó el baseline obsoleto `agenda-sesiones-clinicas-chromium-win32.png` (sustituido por `agenda-calendario-chromium-win32.png`).

---

## 6. Veredicto final

✅ **APROBADO** — El módulo Agenda/Citas opera end-to-end contra el oráculo real (Angular → Spring Boot → PostgreSQL), sin errores de consola, sin respuestas 5xx y con regresión visual estable.

Adicionalmente, la máquina de estados se verificó con un smoke test directo de API: `PATCH /citas/cit-004/estado { status: 'cancelada' }` sobre una cita `completada` devuelve **HTTP 409 Conflict** (transición inválida rechazada).
