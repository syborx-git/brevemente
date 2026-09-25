# E2E Test Report & Oracle Validation: Módulo Pacientes

- **Fecha**: 2026-09-24
- **Módulo**: `pacientes`
- **Ambiente de Ejecución**: Producción Local SDOP (Dual Adapter Activo)
  - **Frontend**: Angular 18 en `http://localhost:4200`
  - **Backend**: Spring Boot 3.3.3 en `http://localhost:8080` (`context-path: /api/v1`)
  - **Base de Datos**: PostgreSQL 17 (`brevemente_db`) con Flyway `V1`, `V2`, `V3`
  - **Motor de Pruebas**: Playwright 1.63.0 (Headless Chromium 1280x720)
- **Rol**: QA Automation Lead
- **Estado Global**: **APROBADO (100% PASS)**

---

## 1. Resumen Ejecutivo de Ejecución

```text
Running 5 tests using 1 worker

  ✓ 1 [chromium] › TC-PAC-01: Carga y oráculo de datos reales desde Spring Boot/PostgreSQL (2.2s)
  ✓ 2 [chromium] › TC-PAC-02: Búsqueda reactiva por Nombre y CURP (2.0s)
  ✓ 3 [chromium] › TC-PAC-03: Filtrado dinámico por Estado Clínico y Consentimiento (2.1s)
  ✓ 4 [chromium] › TC-PAC-04: Apertura y cálculo de minoría de edad en Modal de Registro (1.9s)
  ✓ 5 [chromium] › TC-PAC-05: Regresión Visual del Directorio Clínico con Oráculo Real (2.6s)

  5 passed (13.7s)
```

| Métrica | Valor Obtenido | Umbral de Aceptación | Estado |
| :--- | :---: | :---: | :---: |
| **Casos Ejecutados** | 5 | 5 | **100%** |
| **Casos Aprobados** | 5 | 5 | **100%** |
| **Errores en Consola JS** | 0 | 0 | **PASS** |
| **Errores de Servidor HTTP 500** | 0 | 0 | **PASS** |
| **Tolerancia Regresión Visual** | 0.00% | $\le$ 1.00% (`maxDiffPixelRatio: 0.01`) | **PASS** |
| **Integridad HTML / SCSS UI** | 100% intactos | 100% intactos | **PASS** |

---

## 2. Monitoreo de Consola y Red

Se implementaron listeners reactivos en Playwright (`page.on('console')`, `page.on('pageerror')`, `page.on('response')`):
- **Excepciones de JavaScript**: Ninguna excepción detectada en runtime (`[Uncaught JS Exception]: 0`).
- **Llamadas de Red**:
  - `GET /api/v1/pacientes` respondió **HTTP 200 OK** con `Content-Type: application/json`.
  - Cero respuestas HTTP 4xx o 5xx durante la suite completa.
  - El proxy de Angular redirigió de manera transparente las peticiones del puerto 4200 al backend en el puerto 8080.

---

## 3. Matriz de Casos de Prueba (Oráculo y E2E)

### TC-PAC-01: Carga y Oráculo de Datos Reales desde Spring Boot / PostgreSQL
- **Objetivo**: Verificar que los registros provienen de la base de datos real (migraciones Flyway `V1`, `V2`, `V3`) y no del almacenamiento mock local.
- **Evidencia**:
  - Encabezado `Directorio Clínico de Pacientes` renderizado correctamente en `main h1`.
  - Total de filas en tabla: 4 registros (`pac-001`, `pac-002`, `pac-003`, `pac-004`).
  - Oráculo validado:
    - **Mateo Herrera Santos**: CURP `HESM081105HDFRNT01`, Edad `17 años`, Badge `(Menor)`, Capacidad `REPRESENTADO_POR_EDAD`, Apoyo `Claudia Santos (Madre)`.
    - **Valeria Gómez Fuentes**: CURP `GOFV950412MDFRRR03`, Estado `FIRMADO_TITULAR`, Riesgo `alto`, Estado `activo`.
    - **Emiliano Díaz Corona**: CURP `DICE020719HDFLRM09`, Estado `PENDIENTE_RECONSENTIMIENTO`, Estado `pendiente`.
    - **Roberto Valdés Garza**: CURP `VARR791201HDFZZ01`, Capacidad `AUTONOMO`, Estado `completado`.
- **Resultado**: **PASS**

### TC-PAC-02: Búsqueda Reactiva por Nombre y CURP
- **Objetivo**: Validar el filtrado client-side del Smart Component sobre los datos del backend.
- **Acciones y Aserciones**:
  - Búsqueda `Mateo` $\rightarrow$ Fila visible: 1 (`Mateo Herrera Santos`).
  - Búsqueda por fragmento de CURP `VARR791201` $\rightarrow$ Fila visible: 1 (`Roberto Valdés Garza`).
  - Limpieza del campo de búsqueda $\rightarrow$ Restauración a 4 filas.
- **Resultado**: **PASS**

### TC-PAC-03: Filtrado Dinámico por Estado Clínico y Consentimiento
- **Objetivo**: Verificar que los selectores de la barra de filtros segregan adecuadamente los registros.
- **Acciones y Aserciones**:
  - Selector Estado = `completado` $\rightarrow$ Muestra únicamente a Roberto Valdés Garza.
  - Selector Estado = `pendiente` $\rightarrow$ Muestra únicamente a Emiliano Díaz Corona.
  - Selector Estado = `todos` $\rightarrow$ Restaura las 4 filas.
  - Selector Consentimiento = `REPRESENTADO_POR_EDAD` $\rightarrow$ Muestra únicamente a Mateo Herrera Santos.
- **Resultado**: **PASS**

### TC-PAC-04: Apertura y Cálculo de Minoría de Edad en Modal de Registro
- **Objetivo**: Auditar las reglas de negocio del formulario modal TBE ante pacientes menores de edad.
- **Acciones y Aserciones**:
  - Click en `+ Registrar Nuevo Paciente` $\rightarrow$ Apertura visible del modal.
  - Asignación de fecha `2012-04-10` (14 años) $\rightarrow$ Cálculo automático de edad activado.
  - Despliegue de alerta reactiva: *"Requiere designación de persona de apoyo (representación por edad)"*.
  - Sección *"Persona de Apoyo Designada (Obligatorio en menores)"* desplegada con campos para nombre y teléfono del representante.
  - Cierre mediante botón `Cancelar` $\rightarrow$ Modal destruido limpiamente.
- **Resultado**: **PASS**

### TC-PAC-05: Regresión Visual del Directorio Clínico con Oráculo Real
- **Objetivo**: Comprobar la paridad visual contra la línea base sin desviaciones estéticas.
- **Configuración**: `maxDiffPixelRatio: 0.01` (1% de tolerancia máxima por antialiasing / renderizado de fuentes).
- **Snapshot Generado**: `tests/e2e/pacientes.spec.ts-snapshots/directorio-clinico-pacientes-chromium-win32.png`.
- **Resultado**: **PASS** (Desviación pixel-a-pixel: 0.00%).

---

## 4. Auditoría de Inmutabilidad de UI (Regla de Oro SDOP)

Conforme a las directrices de gobernanza de `ADR-001` y la Skill `demo-gap-implementation`:
- `pacientes.component.html`: **0 líneas modificadas (100% INTACTO)**.
- `pacientes.component.scss`: **0 líneas modificadas (100% INTACTO)**.
- La integración completa se efectuó en el puerto secundario (`PacienteHttpAdapter`), el backend Spring Boot 3 y la base de datos PostgreSQL mediante Flyway `V3`.

---

## 5. Dictamen Final de QA

El módulo **`pacientes`** cuenta con certificación completa de paridad funcional, persistencia transaccional y fidelidad visual. Se autoriza la promoción del módulo para su integración con el siguiente flujo clínico (`expediente-clinico`).
