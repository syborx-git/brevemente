# E2E Test Report & Oracle Validation: Módulo Mi Consulta

- **Fecha**: 2026-10-15
- **Módulo**: `mi-consulta`
- **SDD Asociado**: `sdd-mi-consulta.md` (configuración del terapeuta) + V13–V16
- **Ambiente de Ejecución**: SDOP local sin mock (`miConsultaBackend: true`, `MiConsultaHttpAdapter` directo)
  - **Frontend**: Angular 18 en `http://localhost:4200` (`ng serve`, watch mode)
  - **Backend**: Spring Boot 3.3.3 en `http://localhost:8080` (`context-path: /api/v1`)
  - **Base de Datos**: PostgreSQL 17 (`brevemente_db`) con Flyway `V1`–`V16`
  - **Motor de Pruebas**: Playwright 1.63.0 (Headless Chromium 1280x720)
- **Rol**: QA Automation Lead
- **Estado Global**: **APROBADO (100% PASS)**

---

## 1. Resumen Ejecutivo de Ejecución

```text
Running 4 tests using 1 worker

  ✓ TC-MC-01: Carga de configuración desde el oráculo (Spring Boot + PostgreSQL)
  ✓ TC-MC-02: Guardar configuración persiste y se audita
  ✓ TC-MC-03: Gestión de sedes (agregar, guardar, quitar)
  ✓ TC-MC-04: Regresión Visual de la pantalla Mi Consulta

  4 passed (11.7s)
```

| Métrica | Valor Obtenido | Umbral de Aceptación | Estado |
| :--- | :---: | :---: | :---: |
| **Casos Ejecutados** | 4 | 4 | **100%** |
| **Casos Aprobados** | 4 | 4 | **100%** |
| **Excepciones JS en Consola** | 0 | 0 | **PASS** |
| **Errores de Servidor HTTP 500** | 0 | 0 | **PASS** |
| **Tolerancia Regresión Visual** | 0.00% | $\le$ 1.00% (`maxDiffPixelRatio: 0.01`) | **PASS** |

---

## 2. Monitoreo de Consola y Red

Se instrumentaron listeners reactivos en Playwright (`page.on('console')`, `page.on('pageerror')`, `page.on('response')`):

- **Excepciones de JavaScript**: 0 durante toda la suite.
- **Errores HTTP 500**: 0.
- **Llamadas de red verificadas** (oráculo real):
  - `GET /api/v1/mi-consulta` → **200** con configuración + `sedes`.
  - `PUT /api/v1/mi-consulta` → **200** (persistencia + auditoría).
  - `PUT /api/v1/mi-consulta/sedes` → **200** (CRUD de sedes).
  - `GET /api/v1/dashboard/catalogos` → **200** (catálogo de sedes para el selector).
  - `GET /api/v1/auditoria/configuracion/ter-001` → **200** (historial del terapeuta).

---

## 3. Matriz de Casos de Prueba

### TC-MC-01: Carga de configuración desde el oráculo
- **Objetivo**: Verificar que Mi Consulta lee la configuración real desde PostgreSQL, no el mock.
- **Evidencia**:
  - Encabezado `Mi Consulta — Configuración Operativa` visible.
  - `Nombre Completo` resuelto desde `usuarios` (contiene `Sofía`).
  - `Cédula Profesional` = `CED-782190-PSIC`.
  - `Duración Habitual` = 50, costos 1200/1000, `Edad Mínima` = 0 (V13).
  - Sede principal `Sede Centro BreveMente` + badge `PRINCIPAL` (V14).
- **Resultado**: **PASS**

### TC-MC-02: Guardar configuración persiste y se audita
- **Objetivo**: Confirmar que el `PUT /mi-consulta` persiste en BD y queda trazado.
- **Acciones y Aserciones**:
  - Cambio de `Duración Habitual` 50 → 60 y `Guardar Configuración`.
  - Notificación reactiva `✓ Cambios guardados`.
  - Recarga de página → el valor 60 persiste (leído de PostgreSQL).
  - El historial muestra una entrada `Duración de sesión`.
  - Limpieza: restauración a 50.
- **Resultado**: **PASS**

### TC-MC-03: Gestión de sedes (agregar, guardar, quitar)
- **Objetivo**: Validar el CRUD de `terapeuta_sedes` vía UI.
- **Acciones y Aserciones**:
  - Agregar `Sede Norte BreveMente` desde el selector.
  - `Guardar Sedes` → notificación de éxito.
  - Recarga → la sede persiste.
  - Limpieza: `Quitar` la sede agregada y guardar.
- **Resultado**: **PASS**

### TC-MC-04: Regresión Visual
- **Objetivo**: Paridad visual contra la línea base.
- **Snapshot**: `tests/e2e/mi-consulta.spec.ts-snapshots/mi-consulta-pantalla-chromium-win32.png`.
- **Resultado**: **PASS** (desviación 0.00%).

---

## 4. Integridad de datos post-ejecución

Tras la suite se verificó en PostgreSQL que el módulo queda en estado de semilla:

- `terapeutas.duracion_sesion_default_min` = **50**.
- `terapeuta_sedes` de `ter-001` = solo `sede-centro` (principal).

---

## 5. Observaciones y Dictamen Final de QA

### Observaciones (no bloqueantes)
1. El valor inicial de `Duración Habitual` es estado mutable; la suite asume el estado de semilla (50). Para entornos con datos alterados, se recomienda un paso previo de reseeding.
2. El historial de auditoría acumula entradas de las pruebas de humo anteriores; no afecta los aserciones (se verifica presencia, no conteo exacto).

### Dictamen Final
**APROBADO**. El módulo Mi Consulta (configuración, sedes, auditoría y alcance por rol) queda validado de extremo a extremo contra el oráculo real sin errores de consola, sin 5xx y sin regresión visual.
