# SDD: Portal del Paciente / Dashboard-Pacientes (`/mi-historial`)

- **Fecha**: 2026-10-20
- **Autor**: Lead Architect
- **Estado**: DISEÑO (no implementado — no editar código fuente)
- **Referencias**:
  - GAP: `docs/gap-analysis/gap-report-dashboard-pacientes.md` (validado por 3 agentes, 7 rondas)
  - Demo de paridad: `brevemente_demo/src/pages/PatientDashboard.tsx` (portal `/mi-historial`)
  - `docs/adr/ADR-001-sdop-architecture-hexagonal.md`, `ADR-002-dual-adapters-strategy.md`, `ADR-003-backend-hexagonal-architecture-and-openapi.md`
- **Premisa**: el dashboard de paciente de Angular debe ser **prácticamente idéntico** al portal `/mi-historial` de la demo React. Las mejoras opcionales (a11y, responsive, estados de carga) se aplican sin romper la fidelidad.

---

## 1. Plan de Reutilización (Entidades JPA y DTOs a extender)

### 1.1 Reutilizar SIN cambios
| Recurso | Ruta | Uso |
| :--- | :--- | :--- |
| `PacienteJpaEntity` | `paciente/.../out/persistence/entity/` | Fuente de nombre, `motivo_consulta`, `terapeuta_id`, `estado_consentimiento`. |
| `CitaJpaEntity` + `SpringDataCitaRepository` | `cita/.../out/persistence/` | Fuente del historial de citas del patient. |
| `CitaApplicationService.listar(CitaFiltro)` | `cita/application/service/` | **Ya aplica scope por rol**: si `!puedeVerAgendaCompleta()` fuerza `pacienteId` del claim. No requiere cambios. |
| `IdentidadAutenticadaPort` (patrón) | `cita/application/ports/out/` | Resolver `pacienteId`/`terapeutaIds` desde `UsuarioAutenticado`. |
| `UsuarioAutenticado` | `auth/infrastructure/security/` | Claims `sub`, `terapeutaIds`, `pacienteId`, `authorities`. |
| `SesionJpaEntity` | `expediente/.../out/persistence/` | Prescripciones por sesión (`px` JSONB, `notas`). |
| `MIS_CITAS_LEER` (`perm-017`) | migraciones V6 | Permiso ya asignado a `rol-006`; **no crear permiso de portal nuevo**. |
| `PacienteRestController` (GET/POST/PATCH) | `paciente/.../in/rest/` | No se expone al patient (`PACIENTES_LEER` no lo tiene). Se reutiliza solo internamente. |

### 1.2 Extender (ADAPTAR)
| Recurso | Cambio | Motivo (GAP) |
| :--- | :--- | :--- |
| `Cita` (modelo de dominio) | Añadir campos `terapeutaNombre` y `motivo` (denormalizados). | GAP-DP-02. |
| `CitaPersistenceAdapter` | Resolver nombre/motivo vía query separado e inyectarlos en el dominio (patrón actual `resolvePatientName`). | Idem. |
| `CitaPersistenceMapper` | Volcar los 2 campos al modelo de dominio. | Idem. |
| `CitaRestMapper` | Mapear los 2 campos al DTO. | Idem. |
| `CitaResponseDTO` | Añadir `terapeutaNombre` (String) y `motivo` (String) denormalizados. | GAP-DP-02: el encabezado del portal necesita nombre de terapeuta y motivo; hoy `CitaResponseDTO` solo trae `terapeutaId`. |
| `PacienteResponseDTO` | Añadir **booleano derivado** `pendienteReconsentimiento` (no columna nueva). | GAP-DP-14. |
| `PacienteRestMapper` | Calcular `pendienteReconsentimiento = "PENDIENTE_RECONSENTIMIENTO".equals(capacidadConsentimiento.estado())`. | GAP-DP-14. |
| `CapacidadConsentimientoDTO` | **Reconciliar `allowableValues`** con el vocabulario persistido (`PENDIENTE_FIRMA`, `FIRMADO_TITULAR`, `PENDIENTE_RECONSENTIMIENTO`, `AUTONOMO`, `REPRESENTADO_POR_EDAD`). | GAP-DP-14: hoy diverge del DTO. Hacerlo en la **misma fase** que el CHECK de V17 para que OpenAPI no documente un subconjunto. |
| `SesionJpaEntity` | Añadir `citaId` (nullable) para ligar prescripción↔cita. | GAP-DP-07. |

### 1.3 Crear (nuevo)
| Recurso | Tipo | Motivo (GAP) |
| :--- | :--- | :--- |
| `ContraReferenciaJpaEntity` | Entidad JPA | GAP-DP-05/12: no existe tabla. |
| `AlertaPacienteJpaEntity` | Entidad JPA | GAP-DP-03/05: crisis escalada + avisos de seguridad/crisis atendida. |
| `PortalPerfilResponseDTO` | DTO | GAP-DP-02: encabezado del portal. |
| `AlertaPacienteResponseDTO`, `ContraReferenciaResponseDTO` | DTOs | GAP-DP-05. |
| `SesionPortalResponseDTO` | DTO | GAP-DP-07: prescripciones expandidas por cita. |

> **Decisión de vocabulario de pago (GAP-DP-11)**: para el portal, la fuente canónica es `citas.payment_status` (`pagada/pendiente/exenta`, ya expuesto en `CitaResponseDTO.paymentStatus`). El módulo `pago` (V8) es el ledger contable; el mapeo `exenta ↔ {pagado,parcial,reembolsado}` se resuelve en la capa de mapper del directorio (fase posterior), **no** en el portal.

---

## 2. Migración Flyway (inmutable, consecutivo correcto)

- **Última aplicada**: `V16__revoke_mi_consulta_editar_supervisor.sql`.
- **Nueva**: `V17__introduce_portal_paciente.sql` (inmutable, idempotente, patrón `IF NOT EXISTS` + `ON CONFLICT DO NOTHING` de V5/V6/V8/V13).

```sql
-- =============================================================================
-- Migración V17: Portal del Paciente (/mi-historial) — SDD dashboard-pacientes
-- Sucede a V1..V16. Idempotente. Sin alterar el vocabulario de citas existente.
-- =============================================================================

-- 1. CHECK canónico de estado_consentimiento (GAP-DP-14) ----------------------
-- Vocabulario unificado: valores persistidos (V1/V2/V3) + valores documentados
-- en CapacidadConsentimientoDTO. Se amplía el CHECK, NO se reescriben datos.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
                   WHERE c.conname = 'ck_pacientes_estado_consentimiento' AND t.relname = 'pacientes') THEN
        ALTER TABLE pacientes ADD CONSTRAINT ck_pacientes_estado_consentimiento
            CHECK (estado_consentimiento IN (
                'PENDIENTE_FIRMA','REPRESENTADO_POR_EDAD','FIRMADO_TITULAR',
                'PENDIENTE_RECONSENTIMIENTO','AUTONOMO',
                'REPRESENTADO_POR_CONDICION','PENDIENTE_DETERMINACION'
            ));
    END IF;
END $$;

-- 2. Ligar sesiones (prescripciones) ↔ citas (GAP-DP-07) -----------------------
ALTER TABLE sesiones ADD COLUMN IF NOT EXISTS cita_id VARCHAR(36);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
                   WHERE c.conname = 'fk_sesiones_cita' AND t.relname = 'sesiones') THEN
        ALTER TABLE sesiones
            ADD CONSTRAINT fk_sesiones_cita
            FOREIGN KEY (cita_id) REFERENCES citas(id) ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_sesiones_cita ON sesiones (cita_id);

-- 3. Tabla contra_referencias (GAP-DP-05/12) -----------------------------------
CREATE TABLE IF NOT EXISTS contra_referencias (
    id                   VARCHAR(36) PRIMARY KEY,
    paciente_id          VARCHAR(36) NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    terapeuta_origen_id  VARCHAR(36) NOT NULL REFERENCES terapeutas(id),
    terapeuta_destino_id VARCHAR(36) NOT NULL REFERENCES terapeutas(id),
    motivo               TEXT,
    resumen              TEXT,
    estado               VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    created_at           TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at          TIMESTAMP WITH TIME ZONE,
    CONSTRAINT ck_contra_referencias_estado
        CHECK (estado IN ('pendiente','aprobada','rechazada')),
    CONSTRAINT ck_contra_referencias_terapeutas
        CHECK (terapeuta_origen_id <> terapeuta_destino_id)
);

CREATE INDEX IF NOT EXISTS idx_contra_referencias_paciente ON contra_referencias (paciente_id);
CREATE INDEX IF NOT EXISTS idx_contra_referencias_estado   ON contra_referencias (estado);
CREATE INDEX IF NOT EXISTS idx_contra_referencias_origen   ON contra_referencias (terapeuta_origen_id);
CREATE INDEX IF NOT EXISTS idx_contra_referencias_destino  ON contra_referencias (terapeuta_destino_id);

-- 4. Tabla alerta_paciente (GAP-DP-03/05) --------------------------------------
CREATE TABLE IF NOT EXISTS alerta_paciente (
    id            VARCHAR(36) PRIMARY KEY,
    paciente_id   VARCHAR(36) NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    tipo          VARCHAR(30) NOT NULL,
    mensaje       TEXT NOT NULL,
    estado        VARCHAR(20) NOT NULL DEFAULT 'activa',
    resuelta_por  VARCHAR(200),
    resuelta_en   TIMESTAMP WITH TIME ZONE,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_alerta_paciente_tipo
        CHECK (tipo IN ('crisis','seguridad_clinica','crisis_atendida')),
    CONSTRAINT ck_alerta_paciente_estado
        CHECK (estado IN ('activa','resuelta'))
);

CREATE INDEX IF NOT EXISTS idx_alerta_paciente_paciente ON alerta_paciente (paciente_id);
CREATE INDEX IF NOT EXISTS idx_alerta_paciente_estado   ON alerta_paciente (estado);

-- 5. Permiso MIS_SESIONES_LEER (GAP-DP-07) -------------------------------------
-- Siguiente consecutivo libre: perm-024. Catálogo completo:
--   perm-017 MIS_CITAS_LEER, perm-018 AGENDA_LEER (V6);
--   perm-019 PAGOS_LEER, perm-020 PAGOS_GESTIONAR, perm-021 CONSTANCIAS_EMITIR,
--   perm-022 SUPERVISION_REGISTRAR (V8); perm-023 MI_CONSULTA_EDITAR (V13).
INSERT INTO permisos (id, codigo, modulo, descripcion) VALUES
    ('perm-024','MIS_SESIONES_LEER','EXPEDIENTE','Consultar las prescripciones de las sesiones propias del paciente autenticado')
ON CONFLICT (codigo) DO NOTHING;

-- patient (rol-006): lee sus prescripciones por sesión
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT 'rol-006', id FROM permisos WHERE codigo = 'MIS_SESIONES_LEER'
ON CONFLICT (rol_id, permiso_id) DO NOTHING;

-- 6. Seed determinista para E2E (opcional, evita dependencias de UI) -----------
INSERT INTO alerta_paciente (id, paciente_id, tipo, mensaje, estado, created_at) VALUES
    ('alerta-pac-001','pac-001','seguridad_clinica',
     'Tu equipo clínico fue notificado de una situación que requiere atención.',
     'activa','2026-10-19T10:00:00-06:00')
ON CONFLICT (id) DO NOTHING;
```

> **Reglas de inmutabilidad**: una vez aplicada en un entorno, V17 **no se modifica**. Cualquier cambio posterior va en `V18__*`. Los `ON CONFLICT` y `IF NOT EXISTS` garantizan idempotencia ante re-ejecución.

---

## 3. Spring Boot (Controllers REST, DTOs, Mappers, Services)

### 3.1 Estructura hexagonal del módulo `portalpaciente`
```
com.syborx.brevemente.portalpaciente
├── domain
│   ├── model          PortalPerfil, AlertaPaciente, ContraReferencia, SesionPortal
│   └── exception      PacienteSinVinculoException, AlertaPortalNotFoundException
├── application
│   ├── ports/in       ObtenerPerfilPortalUseCase, ListarCitasPortalUseCase,
│   │                  ListarSesionesPortalUseCase, EscalarCrisisUseCase,
│   │                  ListarAlertasPortalUseCase, ObtenerContraReferenciaPortalUseCase
│   ├── ports/out      PortalPacienteRepositoryPort, IdentidadPortalPort
│   └── service        PacientePortalApplicationService
└── infrastructure
    ├── adapters/in/rest          PacientePortalRestController, dto/, mapper/
    └── adapters/out/persistence  ContraReferenciaJpaEntity, AlertaPacienteJpaEntity,
                                  SpringDataContraReferenciaRepository,
                                  SpringDataAlertaPacienteRepository,
                                  PacientePortalPersistenceAdapter
```

### 3.2 Endpoints (`@RequestMapping("/portal-paciente")`)
Todos patient-scoped. **Anti-IDOR**: el `pacienteId` se resuelve SIEMPRE desde `UsuarioAutenticado.pacienteId`; si el rol es `patient` y `pacienteId` es `null` → **403** (`PacienteSinVinculoException`).

| Método | Ruta | Permiso | Descripción (GAP) |
| :--- | :--- | :--- | :--- |
| GET | `/portal-paciente/perfil` | `MIS_CITAS_LEER` | Encabezado: `{id, name, therapistName, motif}` (GAP-DP-02). |
| GET | `/portal-paciente/citas` | `MIS_CITAS_LEER` | Alias de `GET /citas`; el portal añade guarda de `pacienteId` no-nulo (el `listar()` actual no lanza 403 si es `null`). (GAP-DP-06) |
| GET | `/portal-paciente/sesiones` | `MIS_SESIONES_LEER` | Prescripciones por sesión (`px`, `notas`) ligadas por `cita_id`. (GAP-DP-07) |
| GET | `/portal-paciente/alertas` | `MIS_CITAS_LEER` | Activas + última resuelta `crisis_atendida`. (GAP-DP-05) |
| GET | `/portal-paciente/contra-referencia` | `MIS_CITAS_LEER` | Contra-referencia `aprobada` más reciente. (GAP-DP-05) |
| POST | `/portal-paciente/crisis` | `MIS_CITAS_LEER` | Escala crisis: crea `alerta_paciente(tipo='crisis')`. (GAP-DP-03) |

Ejemplo de controller (patrón de `CitaRestController`):
```java
@RestController
@RequestMapping("/portal-paciente")
@RequiredArgsConstructor
@Tag(name = "Portal Paciente", description = "Portal de consulta del paciente autenticado")
public class PacientePortalRestController {

    private final ObtenerPerfilPortalUseCase obtenerPerfilPortalUseCase;
    private final ListarCitasPortalUseCase listarCitasPortalUseCase;
    private final ListarSesionesPortalUseCase listarSesionesPortalUseCase;
    private final EscalarCrisisUseCase escalarCrisisUseCase;
    private final ListarAlertasPortalUseCase listarAlertasPortalUseCase;
    private final ObtenerContraReferenciaPortalUseCase obtenerContraReferenciaPortalUseCase;
    private final PortalPacienteRestMapper mapper;

    @GetMapping("/perfil")
    @PreAuthorize("hasAuthority('MIS_CITAS_LEER')")
    public ResponseEntity<PortalPerfilResponseDTO> perfil() {
        return ResponseEntity.ok(mapper.toPerfilResponse(obtenerPerfilPortalUseCase.obtenerPerfil()));
    }

    @PostMapping("/crisis")
    @PreAuthorize("hasAuthority('MIS_CITAS_LEER')")
    public ResponseEntity<AlertaPacienteResponseDTO> escalarCrisis(@Valid @RequestBody EscalarCrisisRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(mapper.toAlertaResponse(escalarCrisisUseCase.escalar(request.mensaje())));
    }
    // ... resto de endpoints con el mismo patrón (sin @AuthenticationPrincipal: identidad vía puerto)
}
```

### 3.3 DTOs (records + `@Schema`)
- `PortalPerfilResponseDTO(String id, String name, String therapistName, String motif)`
- `AlertaPacienteResponseDTO(String id, String tipo, String mensaje, String estado, String resueltaPor, String resueltaEn, String createdAt)`
- `ContraReferenciaResponseDTO(String id, String toTherapistName, String fromTherapistName, String estado, String aprobadaEl)`
- `SesionPortalResponseDTO(String citaId, String numero, List<String> px, String notas)`
- `EscalarCrisisRequest(String mensaje)` (validado, `@NotBlank`)

### 3.4 Services (scope-aware)
`PacientePortalApplicationService` implementa los 6 use cases. Invariantes:
1. `resolverPacienteId()`: si `identidadPortalPort.pacienteId()` es `null` y el usuario es `patient` → lanza `PacienteSinVinculoException` (403 vía handler).
2. `listarCitasPortal()` delega en `ListarCitasUseCase.listar()` (ya scopea por claim), **pero añade su propia guarda**: si el rol es `patient` y `pacienteId` es `null` → `PacienteSinVinculoException` (403). `listar()` por sí solo no cubre el caso null.
3. `escalar(mensaje)` crea `AlertaPaciente(tipo='crisis', estado='activa', pacienteId=claim)`.
4. `obtenerPerfil()` compone `pacientes.nombre + apellidos`, `terapeutas.nombre + apellidos`, `pacientes.motivo_consulta` por `pacienteId`.

### 3.5 Manejo de excepciones
Crear `PortalPacienteExceptionHandler` (`@RestControllerAdvice`) **en el módulo `portalpaciente`**, con handler 403 para `PacienteSinVinculoException` (mismo patrón que `PacienteExceptionHandler` usa para `TerapeutaAccesoDenegadoException`). Cada módulo mantiene su propio advice; no inyectar excepciones del portal en el advice del módulo `paciente`.

---

## 4. Angular: Estructura de la clase `LoginHttpAdapter`

### 4.1 Clase actual (referencia de patrón hexagonal)
`Brevemente_App/frontend/src/app/modules/login/adapters/login-http.adapter.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class LoginHttpAdapter implements LoginRepository {
  private readonly baseUrl = `${environment.apiBaseUrl}/auth`;
  private readonly sessionKey = 'brevemente_session';

  constructor(private readonly http: HttpClient) {}

  autenticar(credentials: LoginCredentials): Observable<AuthSession | null> {
    return this.http
      .post<TokenResponseBackend>(`${this.baseUrl}/login`, credentials, { withCredentials: true })
      .pipe(
        map((res) => this.persistSession(res)),
        catchError((err) => (err?.status === 401 ? of(null) : throwError(() => err)))
      );
  }

  refrescarSesion(): Observable<AuthSession | null> { /* POST /refresh + persistSession */ }
  cerrarSesion(): Observable<void> { /* limpia localStorage + POST /logout */ }

  private persistSession(res: TokenResponseBackend): AuthSession {
    // construye User { id, name, roles: validRoles(...), permissions: validPermissions(...),
    //                  email, license, terapeutaIds, pacienteId }
    // guarda en localStorage 'brevemente_session'
  }
  private validRoles(roles: string[] | undefined): Role[] { /* filtra contra VALID_ROLES */ }
  private validPermissions(permissions: string[] | undefined): Permission[] {
    // filtra contra VALID_PERMISSIONS (PBAC)
  }
}
```

### 4.2 Contrato `TokenResponseBackend`
```typescript
interface TokenResponseBackend {
  token: string;
  user: {
    id: string; name: string; roles: string[]; permissions?: string[];
    email: string; license: string | null;
    terapeutaIds?: string[]; pacienteId?: string | null;
  };
}
```

### 4.3 Cambios requeridos para el portal (NO en código fuente aún)
1. **`VALID_PERMISSIONS`** (en `login-http.adapter.ts`): añadir `'MIS_SESIONES_LEER'` (hoy ya contiene `MIS_CITAS_LEER`). Sin esto, el permiso se filtra silenciosamente en el login y nunca llega a `RoleStateService`.
2. **`clinical.types.ts`**: añadir `'MIS_SESIONES_LEER'` a la unión `Permission` (hoy `MIS_CITAS_LEER` ya está).
3. **`environment.ts`**: añadir flag `pacientePortalBackend: false` dentro de `features` (patrón de `miConsultaBackend`).

### 4.4 Nuevo adaptador del portal (espejo del patrón de login)
```
modules/patient-portal/
├── ports/patient-portal.repository.ts      (interface PatientPortalRepository)
└── adapters/
    ├── patient-portal-http.adapter.ts      (impl HttpClient, flag pacientePortalBackend)
    └── patient-portal-localstorage.adapter.ts (impl mock/demo, flag false)
```
`PatientPortalHttpAdapter implements PatientPortalRepository` con `@Injectable({providedIn:'root'})`, `baseUrl = ${environment.apiBaseUrl}/portal-paciente`, métodos `obtenerPerfil()`, `listarCitas()`, `listarSesiones()`, `escalarCrisis(mensaje)`, `listarAlertas()`, `obtenerContraReferencia()`, mapeando wire-types → domain (`toDomain`), con `catchError` que no enmascara errores.

**Cableado por feature flag** (patrón de `pacientes.component.ts` / `mi-consulta.component.ts`): en `providers` del componente `patient-portal` se selecciona el adaptador con `useFactory` según `environment.features.pacientePortalBackend`:
```typescript
providers: [
  {
    provide: PatientPortalRepository,
    useFactory: () => environment.features.pacientePortalBackend
      ? new PatientPortalHttpAdapter(inject(HttpClient))
      : new PatientPortalLocalStorageAdapter()
  }
]
```

### 4.5 Routing y shell (resumen de la Fase 1 del GAP)
- `app.routes.ts`: ruta `mi-historial` con `canActivate` de permiso `MIS_CITAS_LEER`; `permission.guard.ts`: fallback `patient → /mi-historial`.
- Blindar por rol el resto de rutas hijas staff.
- Role-gatear `MainLayout` + `Header`: ocultar al `patient` el sidebar, risk-banner, leva-button, leva-drawer, el atajo "LEVA IA" y el badge "Dato Clínico Sensible. Acceso Auditado TBE." del header.
- **Mecanismo**: `MainLayoutComponent` hoy **no inyecta** `RoleStateService`; inyectarlo y gatear con `@if (!roleService.hasRole('patient'))` en `main-layout.component.html` (y análogo en `HeaderComponent`).

### 4.6 Requisitos de UI del portal (fidelidad + a11y, exigidos por GAP Fase 3)
- **Estados de carga/error**: skeleton en "Próximas Citas"/"Historial" y mensaje de error con reintento.
- **Empty-states**: empty-state solo en "Historial" ("Aun no hay citas en el historial"); "Próximas Citas" se **oculta** si no hay citas.
- **Señales + control flow**: usar `signal()`/`computed()` y `@if`/`@for` (no `*ngIf`/`*ngFor`).
- **A11y**: `aria-expanded` + `role="button"` en las filas expandibles de prescripciones; `aria-live="polite"` en los banners de crisis/contra-referencia; focus-ring visible en el botón de crisis; contraste AA en los badges de estado/pago.
- **Localización**: `DatePipe` con locale `es-MX` (o `Intl.DateTimeFormat`) para fechas; corregir tildes de la demo ("Primera sesión", "Sesión de cierre").
- **Responsive**: apilado de la fila de cita en móvil (`sm:` breakpoints) y `ContactModal` accesible en pantallas pequeñas.

---

## 5. Secuencia de implementación recomendada (sin ejecutar aún)
1. **Fase 1 (frontend)**: routing + guard + role-gating del shell.
2. **Fase 2 (BD)**: `V17__introduce_portal_paciente.sql`.
3. **Fase 3 (backend)**: módulo `portalpaciente` completo.
4. **Fase 4 (frontend)**: `patient-portal` (puerto + adaptadores + componente espejo de `PatientDashboard.tsx`).
5. **Fase 5 (E2E)**: Playwright `dashboard-pacientes.spec.ts`.
