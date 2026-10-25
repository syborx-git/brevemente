# E2E Test Report & Oracle Validation (Parte 2): Mi Consulta y Configuración del Terapeuta

> **Nota de continuidad.** Este documento **no reemplaza** a `e2e-report-mi-consulta.md` (2026-10-15),
> que se conserva como evidencia histórica de la primera implementación. Aquí se documenta la
> **revalidación tras el rediseño del módulo** y la migración de la configuración del terapeuta.

- **Fecha**: 2026-10-25
- **Módulos**: `mi-consulta` (vista operativa) y `configuracion` (datos del terapeuta, honorarios, sedes)
- **SDD Asociado**: `sdd-dashboard-mi-consulta.md` + migraciones `V13`–`V16` (configuración y sedes)
- **Spec**: `tests/e2e/mi-consulta.spec.ts`
- **Ambiente de Ejecución**: SDOP local contra oráculo real (sin mock)
  - **Frontend**: Angular 18 en `http://localhost:3000` (`ng serve`)
  - **Backend**: Spring Boot 3.3.3 en `http://localhost:8080` (`context-path: /api/v1`)
  - **Base de Datos**: PostgreSQL 17 (`brevemente_db`) con Flyway `V1`–`V18`
  - **Motor de Pruebas**: Playwright 1.63.0 (Headless Chromium 1280x720)
- **Rol**: QA Automation Lead
- **Estado Global**: **APROBADO (100% PASS)** — 4/4

---

## 1. Motivo de la revalidación

La suite anterior quedó **en rojo (4/4)** por dos causas distintas que aquí se separan:

| Causa | Naturaleza | Impacto |
| :--- | :--- | :--- |
| **Rediseño de Mi Consulta**: el componente pasó a *template* inline con la vista operativa (próxima sesión, agenda del día, alertas, borradores de LEVA) y se eliminaron `mi-consulta.component.html` y `.scss` | Cambio funcional planificado | Los casos TC-MC-01..03 apuntaban a un formulario que **ya no existe en esa ruta** |
| **Defecto de aplicación**: `TypeError: Cannot read properties of null (reading 'citaId')` en la carga de la acción dominante | **Bug real** | Rompía la pantalla cuando el backend no devuelve próxima cita |

---

## 2. Hallazgo funcional: la configuración migró de módulo

La configuración del terapeuta (perfil profesional, honorarios, edad mínima y sedes) **sigue existiendo**,
pero ahora vive en `/configuracion`:

| Elemento | Antes | Ahora |
| :--- | :--- | :--- |
| Ruta | `/mi-consulta` | **`/configuracion`** |
| Componente | `mi-consulta.component.html` (eliminado) | `configuracion.component.html` |
| Endpoint de lectura | `GET /api/v1/mi-consulta` | `GET /api/v1/mi-consulta` (**sin cambio**) |
| Endpoint de guardado | `PUT /api/v1/mi-consulta` | `PUT /api/v1/mi-consulta` (**sin cambio**) |
| Endpoint de sedes | `PUT /api/v1/mi-consulta/sedes` | `PUT /api/v1/mi-consulta/sedes` (**sin cambio**) |
| Auditoría | `GET /api/v1/auditoria/configuracion/{id}` | **sin cambio** |

**Consecuencia para los tests:** el oráculo y todos los selectores siguen siendo válidos
(`Nombre Completo`, `Cédula Profesional`, `Duración Habitual (Minutos)`, `Costo Primera Sesión ($ MXN)`,
`Edad Mínima de Atención (Años)`, `Agregar sede`, `Guardar Sedes`, `Guardar Configuración`).
Bastó con **reapuntar la ruta**; no fue necesario reescribir la matriz de aserciones.

---

## 3. Defecto corregido: `TypeError` en la acción dominante

### 3.1 Síntoma

Consola del navegador, en las 4 ejecuciones previas del módulo:

```text
[Console Error] ERROR TypeError: Cannot read properties of null (reading 'citaId')
```

El `afterEach` de la suite fallaba antes de llegar a la aserción funcional, enmascarando el resto.

### 3.2 Causa raíz

`src/app/modules/mi-consulta/adapters/mi-consulta-http.adapter.ts`

```ts
obtenerAccionDominante(): Observable<AccionDominante | null> {
  return this.http
    .get<AccionDominanteWire>(`${this.baseUrl}/dashboard/accion-dominante`)
    .pipe(map((w) => this.toAccion(w)));   // ← w puede ser null
}

private toAccion(w: AccionDominanteWire): AccionDominante {
  return { citaId: w.citaId, ... };        // ← 💥 si w === null
}
```

La firma declaraba `| null` pero el `map` no lo protegía.

### 3.3 Corrección aplicada

```diff
  obtenerAccionDominante(): Observable<AccionDominante | null> {
    return this.http
-     .get<AccionDominanteWire>(`${this.baseUrl}/dashboard/accion-dominante`)
-     .pipe(map((w) => this.toAccion(w)));
+     .get<AccionDominanteWire | null>(`${this.baseUrl}/dashboard/accion-dominante`)
+     .pipe(map((w) => (w ? this.toAccion(w) : null)));
  }
```

El consumidor ya estaba preparado (`accion = signal<AccionDominante | null>(null)` y plantilla con `accion()?.`),
por lo que la guarda en el adaptador es suficiente.

### 3.4 Verificación

| Comprobación | Antes | Después |
| :--- | :---: | :---: |
| Ocurrencias de `TypeError ... citaId` | 4/4 casos | **0** |
| `npm run build` (producción) | EXIT=0 | **EXIT=0** |

---

## 4. Resumen Ejecutivo de Ejecución

```text
Running 4 tests using 1 worker

  ✓  1 [chromium] › TC-MC-01: Carga de configuración desde el oráculo (Spring Boot + PostgreSQL) (2.5s)
  ✓  2 [chromium] › TC-MC-02: Guardar configuración persiste y se audita (3.4s)
  ✓  3 [chromium] › TC-MC-03: Gestión de sedes (agregar, guardar, quitar) (3.3s)
  ✓  4 [chromium] › TC-MC-04: Regresión Visual de la pantalla Mi Consulta (2.8s)

  4 passed (12.9s)
```

| Métrica | Valor Obtenido | Umbral de Aceptación | Estado |
| :--- | :---: | :---: | :---: |
| **Casos Ejecutados** | 4 | 4 | **100%** |
| **Casos Aprobados** | 4 | 4 | **100%** |
| **Errores en Consola JS** | 0 | 0 | **PASS** |
| **Excepciones No Capturadas** | 0 | 0 | **PASS** |
| **Errores de Servidor HTTP 5xx** | 0 | 0 | **PASS** |
| **Tolerancia Regresión Visual** | 0.00% | $\le$ 1.00% (`maxDiffPixelRatio: 0.01`) | **PASS** |

La corrida se repitió **dos veces**: una regenerando el baseline (`--update-snapshots`) y otra
sin actualizarlo, para confirmar que la comparación visual es estable y no un falso verde.

---

## 5. Matriz de Casos de Prueba

### TC-MC-01: Carga de configuración desde el oráculo

- **Ruta**: `/configuracion` *(reapuntada)*
- **Objetivo**: Verificar que la configuración proviene de PostgreSQL y no del almacenamiento local.
- **Evidencia verificada**:
  - Encabezado `Configuración` visible.
  - `Nombre Completo` contiene `Sofía` (tabla `usuarios`).
  - `Cédula Profesional` = `CED-782190-PSIC`.
  - `Duración Habitual (Minutos)` = `50`; `Costo Primera Sesión` = `1200`; `Costo Seguimiento` = `1000` (V13).
  - `Edad Mínima de Atención (Años)` = `0` (V13).
  - Sede `Sede Centro BreveMente` con distintivo `PRINCIPAL` (V14).
- **Resultado**: **PASS**

### TC-MC-02: Guardar configuración persiste y se audita

- **Ruta**: `/configuracion` *(reapuntada)*
- **Evidencia verificada**:
  - `Duración Habitual` 50 → 60 y `Guardar Configuración`.
  - Notificación `✓ Cambios guardados`.
  - Tras recargar, el valor es `60` (persistencia real en PostgreSQL).
  - Historial de cambios muestra `Duración de sesión` con el par anterior → nuevo.
  - Limpieza: restaura `50` y guarda.
- **Resultado**: **PASS**

### TC-MC-03: Gestión de sedes

- **Ruta**: `/configuracion` *(reapuntada)*
- **Evidencia verificada**:
  - Selección de sede `sede-norte` en `Agregar sede` → `Agregar` → aparece `Sede Norte BreveMente`.
  - `Guardar Sedes` → `✓ Cambios guardados`.
  - Tras recargar, la sede persiste (endpoint `PUT /mi-consulta/sedes`).
  - Limpieza: `Quitar` y `Guardar Sedes`.
- **Resultado**: **PASS**

### TC-MC-04: Regresión Visual de Mi Consulta

- **Ruta**: `/mi-consulta` (vista operativa nueva)
- **Evidencia verificada**:
  - Encabezado `Mi Consulta — {terapeuta}` visible.
  - Comparación contra baseline `mi-consulta-pantalla-chromium-win32.png`.
- **Baseline**: **regenerado** en esta fecha porque la pantalla fue rediseñada por completo.
- **Resultado**: **PASS**

---

## 6. Cambios en la suite

| Archivo | Cambio |
| :--- | :--- |
| `tests/e2e/mi-consulta.spec.ts` | `describe` renombrado a *Configuración del Terapeuta (ex Mi Consulta)*; rutas de TC-MC-01..03 a `/configuracion`; aserción de encabezado a `/Configuraci/` |
| `tests/e2e/mi-consulta.spec.ts-snapshots/mi-consulta-pantalla-chromium-win32.png` | Baseline regenerado |
| `src/app/modules/mi-consulta/adapters/mi-consulta-http.adapter.ts` | Guarda `null` en `obtenerAccionDominante()` |

---

## 7. Hallazgo de entorno (aplicable a toda la suite)

1. **Orígenes permitidos por CORS**: solo `http://localhost:4200`, `http://localhost:3000` y
   `http://127.0.0.1:4200` (`WebCorsConfig.java`, `SecurityConfig.java`). Servir la aplicación en
   cualquier otro puerto produce **403** en `POST /api/v1/auth/login` y el login nunca redirige.
2. **Servidor obsoleto detectado**: el puerto `4200` estaba ocupado por un proceso `node` iniciado el
   **2026-10-20 15:53**, sirviendo un bundle de cinco días de antigüedad. Toda validación contra ese
   puerto mide código viejo; se recomienda reiniciarlo antes de cada ronda de QA.

Por ambos motivos esta revalidación se ejecutó en el puerto **3000** con un `ng serve` fresco.

---

## 8. Conclusión

- El módulo queda **funcionalmente verde**: configuración, persistencia, auditoría de cambios, gestión
  de sedes y regresión visual.
- El **defecto del `citaId` está cerrado** y verificado en consola.
- La deuda que queda es de **cobertura**, no de defecto: la nueva vista operativa de Mi Consulta
  (próxima sesión, agenda del día, alertas, borradores de LEVA) solo está cubierta por regresión visual.
  Se recomienda añadir casos funcionales para: cambio de estado de sesión, resolución de alerta y
  listado de borradores de LEVA.

### Comandos de reproducción

```powershell
# Terminal 1 — Backend
cd Brevemente_App/backend
mvn spring-boot:run

# Terminal 2 — Frontend (4200 o 3000: únicos orígenes permitidos por CORS)
cd Brevemente_App/frontend
npm start -- --port 3000

# Terminal 3 — Tests
cd Brevemente_App/frontend
$env:E2E_BASE_URL="http://localhost:3000"
npx playwright test mi-consulta --reporter=list
```
