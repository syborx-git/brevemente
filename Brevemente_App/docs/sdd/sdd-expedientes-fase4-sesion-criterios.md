# SDD-EXP-F4: Software Design Document — Edición de Sesión y Criterios Clínicos (Kanban #102–#108)

- **Módulos**: `expediente-clinico` (frontend Angular) + `expediente` (backend Spring Boot) + BD PostgreSQL/Flyway
- **Código SDD**: `SDD-EXP-F4`
- **Versión**: 1.0.0
- **Fecha**: 2026-10-26
- **Estado**: BORRADOR — pendiente de aprobación (Gate #1)
- **Fuente de verdad**: `docs/gap-analysis/gap-report-kanban-102-108-sesion-criterios-clinicos.md` (aprobado en 3 rondas por `jarvis-backend`, `jarvis-database` y `jarvis-frontend`)
- **Predecesor**: `sdd-expedientes_fase3.md` (SDD-EXP-F3 — implementado)
- **Alineación**: ADR-001 (Hexagonal/SDOP), ADR-002 (Dual Adapters), ADR-003 (Backend hexagonal y OpenAPI)

> **Regla de Oro**: integrar vía adaptador/puerto, reutilizando/adaptando lo existente. No se escribe código fuente en esta fase; este documento es la especificación que consumirá `demo-gap-implementation`.

---

## 0. Propósito y alcance

Cerrar las 7 tareas del tablero Kanban (#102–#108), todas sobre el **Detalle de Sesión** y el **Registro de Criterios Clínicos**:

1. **#102** — Badge de fase editable en el detalle de sesión.
2. **#103** — Campo "significado" ("Miedo al conflicto") editable, junto al DX operativo (`dxOp`).
3. **#104** — Campo SPR editable sin reabrir el DX estratégico completo.
4. **#105** — Semáforo de Valoración del Cambio (selector visual de 5 estados con color y etiqueta).
5. **#106** — Menús desplegables para criterios clínicos (racionalizaciones-intelectualizaciones, comparaciones, imágenes intrusivas + "otro").
6. **#107** — Catálogo de opciones del criterio conductual (pedir suavemente / insinuar / delegar / todas / otro).
7. **#108** — Sección "Conductual" como bloque propio colapsable, en paridad con los demás criterios.

**Habilitadores transversales (GAP-K08):**
- `PATCH /expedientes/sesiones/{sesionId}` + `ActualizarSesionUseCase` + `SesionUpdateRequest` + `SesionRepositoryPort.findById`.
- Migración `V19` (columnas `significado` y `spr` en `sesiones`).

**Corrección de bugs detectados en la auditoría (alcance incluido):**
- `SesionResponseDTO.patientId` sale `null` (el mapper no resuelve `pacienteId` desde `expediente_id`).
- `creadoPorId` nunca se asigna al crear sesión → las sesiones nuevas no aparecen en `GET /sesiones/borradores`.

**Fuera del alcance**: tab `contrareferencia`, circuito de riesgo, reconsentimiento, motor de protocolos (ya excluidos en fases previas).

---

## 1. Plan de Reutilización (ADAPTAR vs CREAR)

| Componente | Estado | Estrategia |
| :--- | :--- | :--- |
| Tabla `sesiones` (V7) + columnas `fase`, `dx_operativo` | ✅ existen | **EXTENDER** con `significado`, `spr` (V19) |
| `Sesion` (dominio) / `SesionJpaEntity` / `SesionPersistenceMapper` | ✅ con `fase`/`dxOperativo` | **EXTENDER** con `significado`, `spr` |
| `SesionResponseDTO` / `SesionRestMapper` | ✅ mapean `fase`/`dxOp` | **EXTENDER** con `significado`, `spr`; corregir `patientId` |
| `SesionCreateRequest` | ✅ acepta `phase`, `dxOp`, VC/VG | **REUTILIZAR** para crear; crear `SesionUpdateRequest` para editar |
| `SesionApplicationService` (`listarPorPaciente`, `listarBorradores`, `agregar`) | ✅ implementado | **EXTENDER** con `actualizar`; corregir `creadoPorId` |
| `ExpedienteRestController` | ✅ GET/POST sesiones | **EXTENDER** con `PATCH /sesiones/{id}` |
| `VcEntry` (dominio) | ✅ escala de 7 estados documentada (texto libre) | **TIPAR** en frontend (`VcEstado`) para el semáforo |
| `risk-semaphore` / variante `semaforo` de `kpi-card` | Binario (no escala) | **NO reutilizar tal cual**; crear componente nuevo `vc-semaphore` |
| `ExpedienteRepository` (puerto) + adapters HTTP/localStorage | ✅ con `agregarSesion` | **EXTENDER** con `actualizarSesion` (+ criterios) |
| `RoleStateService` (`hasPermission`) | ✅ implementado | **REUTILIZAR** para gating de edición (`EXPEDIENTE_ESCRIBIR`) |
| Demo `ClinicalRecord.tsx` | Tabla VC de 6 dimensiones (sin categorías conductual/cognitivas) | **CREAR** la sección de Criterios Clínicos (no existe en demo) |

---

## 2. Migración Flyway `V19__sesion_edicion_criterios.sql`

```sql
-- 1. Columnas de sesión (GAP-K02 / GAP-K03)
ALTER TABLE sesiones
    ADD COLUMN IF NOT EXISTS significado TEXT,
    ADD COLUMN IF NOT EXISTS spr         TEXT;

-- 2. Integridad de número (recomendado; hoy solo se valida en app)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
                   WHERE c.conname = 'ck_sesiones_numero' AND t.relname = 'sesiones') THEN
        ALTER TABLE sesiones ADD CONSTRAINT ck_sesiones_numero CHECK (numero >= 1);
    END IF;
END $$;

-- 3. Soporte a listado de borradores (query real: status='borrador' AND creado_por_id IN (...))
CREATE INDEX IF NOT EXISTS idx_sesiones_creado_status
    ON sesiones (creado_por_id, status);

-- 4. Criterios Clínicos por sesión (GAP-K05/K06/K07) — modelo normalizado
CREATE TABLE IF NOT EXISTS sesion_criterios_clinicos (
    id         VARCHAR(36) PRIMARY KEY,
    sesion_id  VARCHAR(36) NOT NULL REFERENCES sesiones(id) ON DELETE CASCADE,
    categoria  VARCHAR(50) NOT NULL,
    valor      TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_sesion_criterios_clinicos_categoria CHECK (categoria IN
        ('conductual','racionalizaciones_intelectualizaciones',
         'comparaciones','imagenes_intrusivas','otro')),
    CONSTRAINT ux_sesion_criterio UNIQUE (sesion_id, categoria)
);
CREATE INDEX IF NOT EXISTS idx_sesion_criterios_sesion
    ON sesion_criterios_clinicos (sesion_id);

-- 5. Catálogo conductual cerrado (GAP-K06 / #107)
CREATE TABLE IF NOT EXISTS catalogo_opciones_conductuales (
    id       VARCHAR(36) PRIMARY KEY,
    codigo   VARCHAR(50) NOT NULL UNIQUE,
    etiqueta VARCHAR(100) NOT NULL,
    orden    INT NOT NULL DEFAULT 0
);
INSERT INTO catalogo_opciones_conductuales (id, codigo, etiqueta, orden) VALUES
    ('cond-001','pedir_suavemente','Pedir suavemente',1),
    ('cond-002','insinuar','Insinuar',2),
    ('cond-003','delegar','Delegar',3),
    ('cond-004','todas','Todas',4),
    ('cond-005','otro','Otro',5)
ON CONFLICT (codigo) DO NOTHING;
```

> **Regla DBA**: `significado`/`spr` usan `TEXT` por consistencia con `spr_inicial` (V7) y `supervision_bitacoras.spr` (V8). El índice de borradores es `(creado_por_id, status)` (la query real filtra por esos campos, no por `expediente_id`). La unicidad queda resuelta en `UNIQUE (sesion_id, categoria)` (un valor por categoría por sesión, coherente con §7 D4/D5). `valor` **no** lleva FK al catálogo porque es libre para `otro` y para categorías no conductuales.

---

## 3. Backend (hexagonal) — GAP-K08 + K02 + K03

### 3.1 Dominio

- `Sesion`: añadir `private String significado;` y `private String spr;`.
- (Nuevo) `CriterioClinico`: `id`, `sesionId`, `categoria`, `valor` (dominio inmutable, `record`).
- (Nuevo) `OpcionConductual`: `id`, `codigo`, `etiqueta`, `orden` (catálogo de #107).

### 3.2 Puertos

**Entrada (application/ports/in):**
- `ActualizarSesionUseCase`: `Sesion actualizar(String sesionId, Sesion datosParciales, String usuarioId)`.
- `ListarCriteriosSesionUseCase`: `List<CriterioClinico> listar(String sesionId)`.
- `GuardarCriteriosSesionUseCase`: `List<CriterioClinico> guardar(String sesionId, List<CriterioClinico> criterios, String usuarioId)`.
- `ListarOpcionesConductualesUseCase`: `List<OpcionConductual> listar()`.

**Salida (application/ports/out):**
- `SesionRepositoryPort`: añadir `Optional<Sesion> findById(String sesionId)`.
- (Nuevo) `CriterioClinicoRepositoryPort`: `findBySesionId`, `saveAll`, `deleteBySesionId`.
- (Nuevo) `OpcionConductualRepositoryPort`: `findAll`.

### 3.3 Caso de uso — `SesionApplicationService` (extender)

```java
@Override
@Transactional
public Sesion actualizar(String sesionId, Sesion datosParciales, String usuarioId) {
    Sesion target = sesionRepositoryPort.findById(sesionId)
        .orElseThrow(() -> new SesionNotFoundException(sesionId));   // 404 (nueva excepción)
    // Fusionar solo campos no nulos (semántica PATCH): fase, significado, spr, dxOperativo, status (ver §3.4 para lista cerrada)
    if (datosParciales.getStatus() != null && !List.of("borrador","validado").contains(datosParciales.getStatus())) {
        throw new SesionInvalidaException("status debe ser 'borrador' o 'validado'.");   // 400
    }
    // auditoría categoría "sesion" (mismo patrón que agregar)
    return sesionRepositoryPort.save(target);
}
```

**Notas de negocio:**
- `numero` y `expedienteId` son **inmutables** en el PATCH (no se exponen en `SesionUpdateRequest`).
- La validación de `status` se hace en app (400), no dependiendo del CHECK de BD.
- `GuardarCriteriosSesionUseCase.guardar` debe ser `@Transactional` (hace `deleteBySesionId` + `saveAll` + auditoría, atómico).
- `guardar` valida `categoria` en app contra el conjunto cerrado (→ 400); `SesionNotFoundException` (404) si la sesión no existe, igual que `actualizar`.
- Auditoría: `actualizar` y `guardar` deben resolver `pacienteId` desde `sesion.expedienteId` (la FK `auditoria_expediente.paciente_id` es `NOT NULL`).
- Registrar traza en `auditoria_expediente` (categoría `"sesion"`), igual que `agregar`.

### 3.4 REST — `ExpedienteRestController` (extender)

| Endpoint | Método | Permiso | Request | Respuesta |
| :--- | :--- | :--- | :--- | :--- |
| `/expedientes/sesiones/{sesionId}` | **PATCH** | `EXPEDIENTE_ESCRIBIR` | `SesionUpdateRequest` | **200** `SesionResponseDTO` |
| `/expedientes/sesiones/{sesionId}/criterios` | GET | `EXPEDIENTE_LEER` | — | **200** `List<CriterioClinicoResponseDTO>` |
| `/expedientes/sesiones/{sesionId}/criterios` | PUT | `EXPEDIENTE_ESCRIBIR` | `List<CriterioClinicoRequest>` | **200** `List<CriterioClinicoResponseDTO>` |
| `/expedientes/catalogos/opciones-conductuales` | GET | `EXPEDIENTE_LEER` | — | **200** `List<OpcionConductualResponseDTO>` |

> El catálogo vive **bajo `/expedientes`** (mismo controller) para evitar un nuevo controller y el solape con `/dashboard/catalogos`. Se implementa en `ExpedienteRestController` (o un sub-controlador con base `/expedientes/catalogos`).

**DTOs nuevos/actualizados:**
- `SesionUpdateRequest` (record, todos opcionales, campos editables del detalle): `phase`, `significado`, `dxOp`, `spr`, `trastorno`, `px`, `oss`, `add`, `rss`, `status`. **Excluidos explícitamente** (inmutables, derivados o solo-lectura en esta fase): `number`, `date`, `patientId`, `expedienteId`, `creadoPorId`, `citaId`, `valoracionCambio`, `valoracionGlobal`, `protocol`, `f1`, `f2`, `notes`, `situation`, `observationsNextSession`, `eff`, `cumplimiento`, `audioDuration`. Si negocio decide hacer editables los campos del detalle (`f1`…`audioDuration`), ampliar aquí **y** en `SesionParcial` (§4.1) manteniendo ambas listas idénticas.
- `SesionRestMapper.toParcial(SesionUpdateRequest)`: **nuevo** mapper PATCH (análogo a `ExpedienteRestMapper.toParcial`), que mapea solo campos presentes.
- `SesionResponseDTO`: añadir `significado`, `spr` (record posicional: revisar `SesionRestMapper.toResponse` y tests que construyan el record posicionalmente).
- `CriterioClinicoRequest` / `CriterioClinicoResponseDTO` (`categoria`, `valor`) con `@Schema`/OpenAPI (convención del proyecto).
- `OpcionConductualResponseDTO` (`codigo`, `etiqueta`, `orden`) con `@Schema`.

### 3.5 Persistencia

- `SesionJpaEntity`: añadir `@Column(name="significado", columnDefinition="TEXT")` y `@Column(name="spr", columnDefinition="TEXT")`.
- `SesionPersistenceMapper`: mapear `significado`/`spr` en ambos sentidos.
- (Nuevo) `SesionCriterioClinicoJpaEntity` + `SpringDataSesionCriterioClinicoRepository` + `SesionCriterioClinicoPersistenceAdapter`.
- (Nuevo) `CatalogoOpcionConductualJpaEntity` + `SpringDataCatalogoOpcionConductualRepository` + adaptador.
- `SpringDataSesionRepository`: `findById` ya lo hereda `JpaRepository`; confirmar y exponer en el puerto.

### 3.6 Manejo de errores y auditoría

- Nuevo `SesionNotFoundException` → **404** (registrar en `ExpedienteExceptionHandler`). Usarla también en `GET/PUT criterios` cuando la sesión no existe.
- Nuevo handler `DataIntegrityViolationException` → **409** en `ExpedienteExceptionHandler` (violación de `UNIQUE (expediente_id, numero)` o de la unicidad de criterios). **Hoy no existe** en el proyecto; hay que crearlo.
- `SesionInvalidaException` → **400** (ya registrado); usarlo para `status` inválido y `categoria` inválida (validación en app).
- Registrar auditoría categoría `"sesion"` en `actualizar` y en `guardarCriterios` (resolviendo `pacienteId`, ver §3.3).
- ⚠️ Riesgo conocido de autorización (IDOR): los endpoints solo verifican `EXPEDIENTE_*`, no que el terapeuta tenga acceso al paciente. Coherente con el estado actual (los endpoints existentes tampoco lo verifican); documentar, no resolver en esta fase.

### 3.7 Corrección de bugs detectados (obligatoria en esta fase)

1. **`patientId` null**: resolver `pacienteId` desde `expediente_id` en **`SesionPersistenceAdapter`** (una consulta a `expedientes_clinicos.paciente_id` por `expediente_id`), **no en el mapper**. En listados, resolver por expediente (una sola consulta) para evitar N+1. Objetivo: `SesionResponseDTO.patientId` no null en GET/POST/PATCH.
2. **`creadoPorId` no asignado**: `agregar` no recibe el principal (solo `usuarioId`); **cambiar el contrato** — el controller debe pasar **ambos**: `principal.terapeutaIds()` (para elegir `creadoPorId`) y `principal.sub()` (para conservar `usuarioId` en la auditoría). El servicio elige el `creadoPorId` (por defecto el primer id de `terapeutaIds`; si la lista es vacía, no asignar y documentar que la sesión no aparecerá en `/sesiones/borradores`). No usar `sub()` como `creadoPorId` (es `usuarios.id`, no `terapeutas.id`).

---

## 4. Frontend Angular

### 4.1 Puerto `ExpedienteRepository` — EXTENDER

```typescript
// Edición de sesión (GAP-K08, K01, K02, K03)
abstract actualizarSesion(sesionId: string, datos: SesionParcial): Observable<Session>;

// Criterios clínicos (GAP-K05/K06/K07)
abstract listarCriteriosSesion(sesionId: string): Observable<CriterioClinico[]>;
abstract guardarCriteriosSesion(sesionId: string, criterios: CriterioClinico[]): Observable<CriterioClinico[]>;
abstract listarOpcionesConductuales(): Observable<OpcionConductual[]>;
```

Tipos derivados (en `clinical.types.ts` o en el puerto):
```typescript
// AÑADIR primero a `Session` (clinical.types.ts):
//   spr?: string;
//   significado?: string;

type SesionParcial = Partial<Pick<Session,
  'phase' | 'dxOp' | 'spr' | 'trastorno' | 'px' | 'oss' | 'add' | 'rss'
>> & { significado?: string; status?: 'borrador' | 'validado' };

interface CriterioClinico { id?: string; categoria: CriterioCategoria; valor: string; }
type CriterioCategoria = 'conductual' | 'racionalizaciones_intelectualizaciones' | 'comparaciones' | 'imagenes_intrusivas' | 'otro';
interface OpcionConductual { codigo: string; etiqueta: string; orden: number; }
```

> `SesionParcial` es **idéntico** a `SesionUpdateRequest` (backend): los campos `f1`, `f2`, `notes`, `situation`, `observationsNextSession`, `eff`, `cumplimiento`, `audioDuration` son **solo-lectura** en esta fase (se restauran como display en §4.3, no se editan). Si negocio decide editarlos, añadirlos a **ambos** contratos a la vez.

### 4.2 Adapters

**HTTP** (`expediente-http.adapter.ts`):
- `actualizarSesion` → `PATCH ${base}/expedientes/sesiones/${sesionId}`.
- `listarCriteriosSesion` → `GET ${base}/expedientes/sesiones/${sesionId}/criterios`.
- `guardarCriteriosSesion` → `PUT ${base}/expedientes/sesiones/${sesionId}/criterios`.
- `listarOpcionesConductuales` → `GET ${base}/expedientes/catalogos/opciones-conductuales`.
- **No** tragar errores de escritura (`catchError(() => of(...))`); propagar el error al componente.

**LocalStorage** (mock):
- `actualizarSesion`: leer-modificar-escribir en el arreglo en memoria (mantener orden consistente; corregir el `unshift` actual si se toca).
- Criterios: leer/guardar en un mapa en memoria por sesión; `listarOpcionesConductuales` devuelve el catálogo de 5 opciones hardcodeado.
- (Opcional, ya documentado) corregir `actualizarExpediente` no-op.

### 4.3 Componente — Edición inline en el detalle de sesión (#102, #103, #104)

Convertir en editables inline (clic → input/select → blur/Enter → `actualizarSesion`):
- **Fase** (`s.phase`): badge → `<select>` con catálogo de fases (`Definición del problema`, `Desbloqueo`, `Consolidación`, `Cierre`) — pendiente de confirmar catálogo (§7).
- **Significado** (`s.significado`): texto libre (input).
- **DX operativo** (`s.dxOp`): input/select.
- **SPR** (`s.spr`): select con catálogo SPR (`SPR Fóbico`, `SPR Obsesivo-Compulsivo`, `SPR Paranoide`, `SPR Depresivo`, `SPR Dismórfico`, `SPR Hipocondríaco`) — pendiente de confirmar (§7).

Estado nuevo: `editingField: 'fase' | 'significado' | 'dxOp' | 'spr' | null` + `isSaving` por campo. Al confirmar, llamar `actualizarSesion` y **reasignar `selectedSession` desde la respuesta del PATCH** (no depender solo de `cargarDatos()`, que hoy NO refresca `selectedSession` cuando ya está seleccionado):
```typescript
this.expedienteRepo.actualizarSesion(id, parcial).subscribe(sesion => {
  this.selectedSession = { ...this.selectedSession, ...sesion };
  const i = this.sessions.findIndex(x => x.id === sesion.id);
  if (i >= 0) this.sessions[i] = sesion;
  this.editingField = null; this.isSaving = false;
}, err => { this.isSaving = false; /* notificar */ });
```
Gating: `roleService.hasPermission('EXPEDIENTE_ESCRIBIR')`.

**Restaurar campos del detalle perdidos vs demo** (recomendado, §6.3 del gap): renderizar `dxOp`, `trastorno`, `f1`, `f2`, `notes`, `situation`, `observationsNextSession`, `eff`, `audioDuration` antes/además de `significado`/`spr`. (Matiz: la demo renderiza `add` con la etiqueta "Cumplimiento"; el campo `cumplimiento` solo vive en el form de alta — no incluirlo como "campo perdido del detalle" salvo que negocio lo pida.)

### 4.4 Componente — Semáforo VC (#105)

Nuevo componente standalone `vc-semaphore` (template inline, como `risk-semaphore`):
```typescript
// 5 estados del semáforo (issue #105) — el tipo y el Record tienen EXACTAMENTE estas claves
export type VcEstado =
  | 'marcador_inicial_sin_mejoria' | 'mejoria_leve' | 'mejoria_significativa'
  | 'recaida' | 'nuevo_patron';

export const VC_ESCALA: Record<VcEstado, { etiqueta: string; color: string; orden: number }> = {
  marcador_inicial_sin_mejoria: { etiqueta: 'Marcador inicial / Sin mejoría', color: '#64748b', orden: 1 },
  mejoria_leve:              { etiqueta: 'Mejoría leve',              color: '#f59e0b', orden: 2 },
  mejoria_significativa:     { etiqueta: 'Mejoría significativa',     color: '#10b981', orden: 3 },
  recaida:                   { etiqueta: 'Recaída',                   color: '#ef4444', orden: 4 },
  nuevo_patron:              { etiqueta: 'Nuevo patrón',              color: '#6366f1', orden: 5 },
};

// Mapeo legado → tipado (los datos históricos usan estos strings en VcEntry)
export const VC_LEGADO: Record<string, VcEstado> = {
  'Marcador de inicio':      'marcador_inicial_sin_mejoria',
  'Sin cambios':             'marcador_inicial_sin_mejoria',
  'Mejoría leve':            'mejoria_leve',
  'Mejoría significativa':   'mejoria_significativa',
  'Recaída':                 'recaida',
  'Empeoramiento':           'recaida',
  'Nuevo patrón':            'nuevo_patron',
};
```
- Reemplazar los 6 `<select>` del modal de sesión y la tabla de texto del historial VC por el selector visual (5 estados con color + etiqueta, accesible por teclado). Usar `VC_LEGADO` como fallback para renderizar valores históricos sin que el semáforo devuelva `undefined`.
- **`vcValue()`** (`expediente-clinico.component.ts:212-218`): **decisión de diseño, no bug de port** (la demo documenta "Empeoramiento = 0, Recaída = 0"). Si se adopta el semáforo de 5 estados, actualizar `vcValue` para que `Recaída` quede por debajo de `Sin cambios` y se distinga de "sin dato" (ver D1).
- ⚠️ Colores y etiquetas exactas pendientes de confirmación (§7 D1).

### 4.5 Componente — Registro de Criterios Clínicos (#106, #107, #108)

Nueva **subtab `criterios`** en el tab TBE (ampliar `tbeSubTab` a `'dx'|'sesiones'|'vc'|'vg'|'rst'|'criterios'` y `setTbeSubTab`), con **bloques colapsables por categoría** en paridad visual:
- `Conductual` (bloque propio, #108) → menú desplegable con el catálogo de 5 opciones (#107): `Pedir suavemente`, `Insinuar`, `Delegar`, `Todas`, `Otro`.
- `Racionalizaciones-intelectualizaciones`, `Comparaciones`, `Imágenes intrusivas`, `Otro` → menús desplegables (#106).
- Guardar via `guardarCriteriosSesion(sesionId, criterios)` (PUT; reemplazo completo por categoría: un valor por categoría).
- Gating: `roleService.hasPermission('EXPEDIENTE_ESCRIBIR')` para editar; `EXPEDIENTE_LEER` para ver.
- Accesibilidad: cada bloque colapsable con `aria-expanded`/`aria-controls` (además del `role="button"`/`tabindex`).

> La demo React **no** tiene estas categorías; es una construcción **nueva**, no un port.

### 4.6 Catálogos y tipos TS

- `VcEstado` + `VC_ESCALA` + `VC_LEGADO` (§4.4) centralizados en `core/types/clinical.types.ts` o en un nuevo `core/constants/vc-escala.ts`.
- `CriterioCategoria`, `CriterioClinico`, `OpcionConductual` (§4.1).
- Añadir `spr?: string` y `significado?: string` a la interfaz `Session` (§4.1).
- Mantener la simetría con los DTOs backend.

### 4.7 UX/errores y accesibilidad

- Edición inline: `role="button"`, `tabindex="0"`, `aria-label` en los badges; `Esc` cancela y `Enter` confirma.
- Mutaciones: deshabilitar el control mientras la petición está en curso; errores con notificación (no `alert()`); manejar 409/500 de integridad.
- Lista de sesiones: añadir `role="button"`/`tabindex`/teclado al item `<div (click)>` (corrección de accesibilidad ya documentada).

---

## 5. Contratos de escritura (referencia)

| Operación | Endpoint | Permiso | Respuesta |
| :--- | :--- | :--- | :--- |
| Editar sesión | `PATCH /expedientes/sesiones/{sesionId}` | `EXPEDIENTE_ESCRIBIR` | **200** `SesionResponseDTO` |
| Listar criterios | `GET /expedientes/sesiones/{sesionId}/criterios` | `EXPEDIENTE_LEER` | **200** `CriterioClinicoResponseDTO[]` |
| Guardar criterios | `PUT /expedientes/sesiones/{sesionId}/criterios` | `EXPEDIENTE_ESCRIBIR` | **200** `CriterioClinicoResponseDTO[]` |
| Catálogo conductual | `GET /expedientes/catalogos/opciones-conductuales` | `EXPEDIENTE_LEER` | **200** `OpcionConductualResponseDTO[]` |

Cuerpos de request (campos opcionales en PATCH; solo presentes se fusionan):
```typescript
// SesionUpdateRequest
{ phase?, significado?, dxOp?, spr?, trastorno?, px?, oss?, add?, rss?, status? }
// CriterioClinicoRequest[]
[ { categoria: 'conductual', valor: 'delegar' }, ... ]
```

---

## 6. Plan de pruebas

1. **Backend (unitarias, `DashboardApplicationServiceTest` patrón)** — `SesionApplicationServiceTest`:
   - `actualizar` fusiona solo campos no nulos.
   - `actualizar` con `status` inválido → `SesionInvalidaException`.
   - `actualizar` sobre sesión inexistente → `SesionNotFoundException`.
   - `actualizar` con `status` inválido → `SesionInvalidaException`.
   - `guardarCriterios` con `categoria` inválida → `SesionInvalidaException` (400).
   - `guardarCriterios` sobre sesión inexistente → `SesionNotFoundException` (404).
   - `guardarCriterios` con duplicado (violación de unicidad) → 409.
   - `agregar` asigna `creadoPorId`; `listarPorPaciente` devuelve `patientId` no nulo.
2. **Smoke (HTTP)**:
   - `PATCH /expedientes/sesiones/{id}` con `{fase, significado, spr}` → 200 y respuesta con los campos.
   - `GET /expedientes/sesiones/{id}/criterios` → 200.
   - `PUT /expedientes/sesiones/{id}/criterios` → 200.
   - `GET /expedientes/catalogos/opciones-conductuales` → 200 con 5 opciones.
3. **E2E (Playwright)** — ampliar `tests/e2e/expediente.spec.ts`:
   - TC-K01: editar fase desde el badge → se refleja en la lista.
   - TC-K02: editar significado y dxOp en el detalle → persisten al recargar.
   - TC-K03: editar SPR sin abrir el DX completo.
   - TC-K04: capturar VC con semáforo → historial muestra color por estado.
   - TC-K05/K06/K07: sección "Conductual" colapsable con menú de 5 opciones; guardar criterios.
   - Monitoreo de consola y HTTP ≥500.
4. **Build** — `ng build` y `mvn test-compile` limpios (el puerto abstracto fuerza los métodos nuevos en ambos adapters).
5. **Flyway** — aplicar `V19` y validar con `psql` (columnas, constraints, índice, seed).

---

## 7. Decisiones de negocio pendientes (bloquean #105–#108 antes de codificar)

| # | Decisión | Propuesta por defecto |
| :--- | :--- | :--- |
| D1 | Estados exactos, colores y **mapeo legado** del semáforo VC (#105) | 5 estados (ver `VC_ESCALA` §4.4): `marcador inicial / sin mejoría` (gris), `mejoría leve` (ámbar), `mejoría significativa` (verde), `recaída` (rojo), `nuevo patrón` (índigo). Mapeo legado: `Marcador de inicio`/`Sin cambios` → marcador inicial; `Empeoramiento`/`Recaída` → recaída |
| D2 | Catálogo cerrado de fases (#102) | `Definición del problema`, `Desbloqueo`, `Consolidación`, `Cierre` |
| D3 | Catálogo cerrado de SPR (#104) | `SPR Fóbico`, `SPR Obsesivo-Compulsivo`, `SPR Paranoide`, `SPR Depresivo`, `SPR Dismórfico`, `SPR Hipocondríaco` |
| D4 | Modelo de Criterios Clínicos (#106/#108) | Tabla normalizada `sesion_criterios_clinicos` (un valor por categoría → `UNIQUE (sesion_id, categoria)`) |
| D5 | Unicidad de criterios (#106) | `UNIQUE (sesion_id, categoria)` (un valor por categoría por sesión) |
| D6 | Categorías de criterios (#106) | `conductual`, `racionalizaciones_intelectualizaciones`, `comparaciones`, `imagenes_intrusivas`, `otro` |
| D7 | Ubicación de la sección de criterios (#106/#108) | Nueva subtab `criterios` en el tab TBE (ampliar `tbeSubTab`) |
| D8 | Semántica de `spr` vs `dxOp` (#104) | `dxOp` = DX operativo actual; `spr` = sistema perceptivo-reactivo. Fijar qué diferencia a ambos para no duplicar datos (hoy `dx_operativo` se sembró con valores tipo `SPR Fóbico`) |

---

## 8. Aceptación (Gate #1)

Este SDD queda listo para `demo-gap-implementation` cuando se aprueben:
1. La migración `V19` §2 (columnas, CHECK, índice, tablas de criterios y catálogo) y las decisiones D1–D6 §7.
2. El contrato backend §3 (`PATCH /sesiones/{id}`, `ActualizarSesionUseCase`, DTOs, mapeo de `significado`/`spr`, endpoints de criterios y catálogo) + las 2 correcciones de bugs §3.7.
3. El frontend §4 (puerto/adapters, edición inline, `vc-semaphore`, sección de criterios colapsables, catálogos tipados y accesibilidad).
4. El plan de pruebas §6.

> Fuente de verdad: `docs/gap-analysis/gap-report-kanban-102-108-sesion-criterios-clinicos.md` (8 GAPs + §6 hallazgos). Auditorías: 3 rondas de `jarvis-backend`/`jarvis-database`/`jarvis-frontend` (aprobado, sin bloqueantes).
