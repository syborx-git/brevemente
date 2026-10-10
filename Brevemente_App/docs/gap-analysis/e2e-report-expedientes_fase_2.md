# E2E Report: Módulo Expedientes — FASE 2 (Dominios clínicos complementarios)

- **Fecha**: 2026-10-08
- **Módulo**: `expediente-clinico` (Angular) / dominios `expediente` + `pago` + `supervision` + `constancia` + `auditoria` (Spring Boot)
- **Oráculo**: Spring Boot 3.3.3 (context-path `/api/v1`, puerto 8080) + PostgreSQL 17 (`brevemente_db`, Flyway v8)
- **Frontend**: Angular 18 (dev server puerto 4200, `expedienteClinicoBackend`, `pagosBackend`, `constanciasBackend`, `auditoriaBackend`, `supervisionBackend` activos)
- **Framework**: Playwright 1.63 (chromium, 1 worker)
- **Resultado global**: ✅ **9/9 PASSED** — sin errores de consola, sin excepciones JS, sin HTTP 500

---

## 1. Configuración de la validación

| Aspecto | Valor |
| :--- | :--- |
| Spec | `frontend/tests/e2e/expediente.spec.ts` |
| Autenticación | Login real contra `/auth/login` (JWT) con `sofia.ramirez@brevemente.org` / `demo123` |
| Monitoreo de consola | `page.on('console')` → falla ante `type === 'error'` (filtrando `favicon.ico` y respuestas 4xx) |
| Excepciones JS | `page.on('pageerror')` → falla ante cualquier excepción no capturada |
| Errores de servidor | `page.on('response')` → falla ante cualquier `status >= 500` |
| Regresión visual | `toHaveScreenshot('expediente-paciente.png', { maxDiffPixelRatio: 0.01, fullPage: true })` |

> Las aserciones de monitoreo se ejecutan en el `afterEach`, por lo que **cada test falla automáticamente** si detecta un error de consola o un HTTP 500 durante su ejecución.

---

## 2. Matriz de pruebas ejecutadas

| ID | Prueba | Verificación (oráculo real) | Resultado |
| :--- | :--- | :--- | :---: |
| TC-EXP-01 | Carga y oráculo de datos reales | Banner de paciente (`GET /pacientes/{id}`) + tab "Datos de Admisión" + trastorno estratégico (`GET /expedientes/paciente/{id}`) | ✅ |
| TC-EXP-02 | Sesiones cargadas desde la BD | Sub-tab TBE → Sesiones: `Sesión #1` y prescripciones (`GET .../sesiones`) | ✅ |
| TC-EXP-03 | Regresión visual (pantalla principal) | Screenshot `expediente-paciente.png` con `maxDiffPixelRatio: 0.01` | ✅ |
| TC-EXP-04 | Expediente psiquiátrico (pac-002) | `Expediente Médico Psiquiátrico` + fármacos `Sertralina 50mg` / `Alprazolam 0.25mg` (`drugsList` de `exp-002`) | ✅ |
| TC-EXP-05 | Pagos cargados desde la BD | Resumen "Total cobrado" + registro de pago (`GET /pagos?pacienteId=pac-001`) | ✅ |
| TC-EXP-06 | Bitácoras de supervisión desde la BD | Cabecera "Bitácoras de Supervisión Clínica" + supervisor (`GET /supervision/bitacoras`) | ✅ |
| TC-EXP-07 | Constancias físicas desde la BD | Folio `CONST-2026-084-FIS` (`GET /constancias`) | ✅ |
| TC-EXP-08 | Auditoría del expediente | Cabecera "Registro Seguro de Auditoría del Expediente" (`GET .../auditoria`) | ✅ |
| TC-EXP-09 | Valoración del Cambio y Global | Tablas VC y VG derivadas de `sesiones.valoracion_cambio/global` (JSONB) | ✅ |

---

## 3. Regresión visual

- **Baseline**: `tests/e2e/expediente.spec.ts-snapshots/expediente-paciente-chromium-win32.png` (regenerado tras el port visual y la adición de las gráficas SVG VC/VG).
- **Parámetro**: `maxDiffPixelRatio: 0.01` (1%), `fullPage: true`.
- **Resultado**: sin diferencias → ✅.

---

## 4. Observaciones de calidad

1. **Cero errores de consola y cero HTTP 500** en las 9 ejecuciones (aserciones del `afterEach` en verde).
2. Los endpoints nuevos del backend fueron ejercitados indirectamente por la UI: `PATCH /expedientes/paciente/{id}` (edición DX/psiquiatría), `GET /pagos`, `GET /constancias`, `GET /supervision/bitacoras`, `GET .../auditoria`.
3. Las gráficas VC/VG se validaron por presencia de los títulos y del contenedor SVG (los datos provienen de `ses-001`/`ses-002` sembrados en V8).
4. **Fuera de esta suite (validado por smoke test REST manual)**: `POST /supervision/solicitudes`, `PATCH /pagos/{id}/estado`, `DELETE /pagos/{id}`, `DELETE /constancias/{id}` y la escritura de auditoría con `userId` (verificado `usr-001`). Estos flujos de escritura se incorporarán a la suite en una iteración posterior si se requiere cobertura E2E completa de mutaciones.

---

## 5. Conclusión

La Fase 2 del módulo Expedientes **cumple los criterios de aceptación E2E**: carga de datos reales desde el oráculo (Spring Boot + PostgreSQL), sin errores de consola ni excepciones JS, sin respuestas HTTP 500, y con regresión visual estable. La suite queda como evidencia de regresión para futuros cambios.
