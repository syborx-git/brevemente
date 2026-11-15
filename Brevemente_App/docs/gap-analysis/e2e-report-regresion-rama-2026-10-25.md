# E2E Regression Report: Cierre de la suite completa (rama actual)

- **Fecha**: 2026-10-25
- **Rama**: `feature/jp-mi-consulta-configuracion-terapeuta-y-cambios-panel-principal`
- **Alcance**: 9 specs · **48 casos** · módulos Login, Agenda, Dashboard, Dashboard (Centro de Control), Roles, Pacientes, Portal del Paciente, Expedientes, Configuración del Terapeuta
- **Ambiente**:
  - **Frontend**: Angular 18 en `http://localhost:3000` (`ng serve`)
  - **Backend**: Spring Boot 3.3.3 en `http://localhost:8082` (instancia con la corrección aplicada)
  - **Base de Datos**: PostgreSQL 17 (`brevemente_db`) con Flyway `V1`–`V18`
  - **Motor**: Playwright 1.63.0 (Headless Chromium, 1280x720)
- **Rol**: QA Automation Lead

---

## 1. Resumen

| Momento | Resultado |
| :--- | :---: |
| Primera corrida (2026-10-25) | **33 passed / 15 failed** |
| Corrida final | **48 passed / 0 failed** (2.0 min) |

```text
48 passed (2.0m)
```

---

## 2. Clasificación de los 15 fallos y su resolución

| # | Caso | Causa | Tipo | Acción |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `TC-DASH-01` | El título cambió a *Centro de Control BreveMente*; KPI renombrado a *Alertas de Riesgo*; secciones *Agenda del día* / *Pendientes prioritarios* sustituyen a *Pacientes con Actividad Reciente* | Test desactualizado | Aserciones actualizadas |
| 2 | `TC-DASH-02` | Baseline visual | Test desactualizado | Baseline regenerado |
| 3 | `TC-DASH2-05` | Baseline visual | Test desactualizado | Baseline regenerado |
| 4 | `TC-ROLE-01` | Etiqueta *Alertas Normativas* → *Alertas de Riesgo*; banner → *Aviso Normativo TBE* | Test desactualizado | Aserciones actualizadas |
| 5 | `TC-ROLE-02` | El KPI clínico ya no expone el conteo al asistente: muestra `—` y **NO AUTORIZADO** | Cambio de diseño | Aserción actualizada al nuevo contrato |
| 6 | `TC-ROLE-03` | El dashboard ya no lista pacientes recientes; el alcance cross-terapeuta se evidencia en el filtro (solo roles superiores) | Test desactualizado | Aserción reescrita sobre el `<select>` de terapeutas |
| 7 | `TC-ROLE-04` | Baseline visual | Test desactualizado | Baseline regenerado |
| 8 | `TC-EXP-01` | `pac-001` ahora es *Mateo Herrera Santos* (menor) con otro modelo de datos | Test desactualizado | Aserciones sobre el oráculo actual |
| 9 | `TC-EXP-03` | Baseline visual | Test desactualizado | Baseline regenerado |
| 10 | `TC-EXP-14` | **HTTP 500** al registrar sesión | **Bug real (backend)** | Corregido |
| 11 | `TC-AG-04` | Baseline visual | Test desactualizado | Baseline regenerado |
| 12 | `TC-PAC-05` | Baseline visual | Test desactualizado | Baseline regenerado |
| 13 | `TC-MC-01` | `TypeError ... citaId` + configuración migrada a `/configuracion` | **Bug real (frontend)** + cambio de módulo | Corregido y test reapuntado |
| 14 | `TC-MC-02` | Ídem | Ídem | Ídem |
| 15 | `TC-MC-03` | Ídem | Ídem | Ídem |

---

## 3. Bug real #1 — `TypeError` en la acción dominante (frontend)

**Archivo**: `src/app/modules/mi-consulta/adapters/mi-consulta-http.adapter.ts`

```diff
  obtenerAccionDominante(): Observable<AccionDominante | null> {
    return this.http
-     .get<AccionDominanteWire>(`${this.baseUrl}/dashboard/accion-dominante`)
-     .pipe(map((w) => this.toAccion(w)));
+     .get<AccionDominanteWire | null>(`${this.baseUrl}/dashboard/accion-dominante`)
+     .pipe(map((w) => (w ? this.toAccion(w) : null)));
  }
```

**Síntoma**: `TypeError: Cannot read properties of null (reading 'citaId')` cuando el backend no devuelve próxima cita.

---

## 4. Bug real #2 — Auditoría con `paciente_id` nulo (backend)

**Síntoma**: `POST /api/v1/expedientes/paciente/pac-001/sesiones` → **HTTP 500**; el modal de registro no se cierra y bloquea la UI.

**Traza (PostgreSQL)**:

```text
ERROR: el valor nulo en la columna «paciente_id» de la relación «auditoria_expediente»
       viola la restricción de no nulo
Detail: La fila que falla contiene (aud-b44b2f95, null, usr-001, 'Registro de sesión TBE',
        'Se registró la Sesión 6 del expediente.', 'sesion', ...)
```

**Causa raíz**: `SesionApplicationService.agregar()` registraba la auditoría con
`saved.getPacienteId()`. El mapeo de persistencia no conserva `pacienteId` (la tabla `sesiones`
expone `expediente_id`, no `paciente_id`), por lo que el valor regresaba **null** y la traza de
auditoría violaba el `NOT NULL`.

**Corrección** — `expediente/application/service/SesionApplicationService.java`:

```diff
  Sesion saved = sesionRepositoryPort.save(sesion);
+ // El mapeo de persistencia no conserva pacienteId (la tabla expone expediente_id),
+ // por lo que se usa el parámetro de entrada para la traza de auditoría.
  auditoriaExpedientePort.registrar(
-         saved.getPacienteId(), usuarioId,
+         pacienteId, usuarioId,
          "Registro de sesión TBE",
          "Se registró la Sesión " + saved.getNumero() + " del expediente.", "sesion");
```

**Verificación**:

| Comprobación | Antes | Después |
| :--- | :---: | :---: |
| `POST /expedientes/paciente/pac-001/sesiones` | **500** | **201** |
| Sesiones persistidas | 5 | 6 (`1,2,3,4,5,6`) |
| `SesionApplicationServiceTest` (mvn) | — | **5/5 PASS** |
| `TC-EXP-14` (Playwright) | Fallido | **PASS** |

---

## 5. Baselines visuales regenerados

| Spec | Snapshot |
| :--- | :--- |
| Agenda | `agenda-calendario-chromium-win32.png` |
| Dashboard (Centro de Control) | `dashboard-principal-2-chromium-win32.png` |
| Dashboard (Panel Principal) | `dashboard-principal-chromium-win32.png` |
| Roles (estado Asistente) | `dashboard-assistant-chromium-win32.png` |
| Expedientes | `expediente-paciente-chromium-win32.png` |
| Mi Consulta | `mi-consulta-pantalla-chromium-win32.png` |
| Pacientes | `directorio-clinico-pacientes-chromium-win32.png` |

Se validó la estabilidad repitiendo la corrida **sin** `--update-snapshots` antes de declarar el cierre.

---

## 6. Hallazgo de entorno (acción requerida por el equipo)

1. **CORS**: el backend solo acepta `http://localhost:4200`, `http://localhost:3000` y
   `http://127.0.0.1:4200`. Cualquier otro puerto produce **403** en `POST /auth/login`.
2. **Servidor obsoleto en 4200**: al momento de esta auditoría, el puerto estaba ocupado por un
   proceso `node` iniciado el **2026-10-20**, sirviendo un bundle de cinco días de antigüedad.
   **Debe reiniciarse** antes de cualquier ronda de QA, o se estará midiendo código viejo.
3. **Backend en 8080**: la instancia activa no incluye la corrección del Bug #2; hay que reiniciarla
   para que `TC-EXP-14` pase en el entorno habitual.

---

## 7. Observación pendiente de decisión de negocio

`TC-ROLE-02` valida que el Asistente **no ve el conteo** de alertas clínicas (contrato actual:
`—` + `NO AUTORIZADO`). Sin embargo, el banner **Aviso Normativo TBE** sí se muestra a ese rol e
incluye nombre de paciente y situación clínica:

> *"El paciente Mateo Herrera Santos (17 años) requiere firma de la persona de apoyo para habilitar
> agenda y grabaciones LEVA."*

No se modificó el comportamiento. Queda como punto a validar con negocio: si el asistente necesita
gestionar la firma, el aviso es legítimo; si no, conviene filtrarlo por rol.

---

## 8. Conclusión

- **Suite completa en verde: 48/48** en 2.0 minutos.
- **2 defectos reales cerrados** (uno de frontend, uno de backend) con verificación de extremo a extremo.
- **13 fallos restantes** eran deuda de mantenimiento de tests (selectores obsoletos y baselines
  desactualizados), resuelta sin relajar ninguna aserción funcional.
- Recomendación: repetir la suite en el entorno estándar (`4200` + `8080`) tras reiniciar ambos
  procesos, y considerar añadir cobertura funcional de la nueva vista operativa de Mi Consulta.
