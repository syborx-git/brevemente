# SDD: Vista Admin Plataforma — Módulo 1 · Dashboard de Plataforma

- **Fecha**: 2026-11-05
- **Módulo**: `admin/dashboard` (Dashboard de Plataforma)
- **Rol**: `admin_platform` (rol-001)
- **Estado**: DISEÑO — listo para implementación
- **Relacionado con**: `gap-report-vista-admin-plataforma-1.md` (Fase 1), ADR-001 (hexagonal), ADR-002 (dual adapters), ADR-003 (OpenAPI)
- **Rama de trabajo**: `feature/jp-vista-admin-1`

---

## 1. Propósito

Centro de mando global para el Administrador de Plataforma: salud operativa de toda la plataforma, sin foco en un solo paciente y sin exposición de finanzas de terapeutas.

**Principios**:
- El admin ve **agregados** (conteos e indicadores), no drill-down a expedientes.
- Métricas clínicas globales reutilizan el scope GLOBAL ya resuelto por `DashboardScopeResolver`.
- Métricas administrativas (usuarios por rol, terapeutas activos, salud de módulos) son nuevas y viven en un puerto dedicado.

---

## 2. Decisiones de diseño

| # | Decisión | Detalle |
| :--- | :--- | :--- |
| D1 | Ruta | `/admin/dashboard`, bajo la rama padre `/admin` (layout propio). |
| D2 | Guard | `authGuard` + `adminPlatformGuard` en el padre `admin`. Sin permiso granular en Fase 1 (solo `admin_platform` accede). |
| D3 | Backend | `@PreAuthorize("hasAuthority('ROLE_ADMIN_PLATFORM')")` en cada endpoint. Autoridad en MAYÚSCULAS. |
| D4 | Servicio | Nuevo `PlataformaDashboardApplicationService` + `PlataformaDashboardRepositoryPort`. No sobrecargar `DashboardScopeResolver`. |
| D5 | Dual adapter | El admin va **directo a HTTP** (sin `LocalStorageAdapter`). Excepción a ADR-002 documentada en ADR-004 (ver §5). |
| D6 | Tipos | Los DTOs del módulo viven en `ports/dashboard-plataforma.repository.ts`, no en `clinical.types.ts`. |
| D7 | Zonas | 5 zonas independientes con carga/error/vacío aislados por zona. |

---

## 3. Backend (hexagonal)

### 3.1 Paquete

```
com.syborx.brevemente.plataforma/          // paquete dedicado (no mezclar con el dashboard clínico)
  domain/model/          ResumenPlataforma, KpisPlataforma, IndicadorClinico,
                         ActividadReciente, AccesoReciente, UsuarioReciente, CitaReciente,
                         AlertasSistema, SaludPlataforma, SaludModulo, FeatureFlag
  application/
    ports/in/            ObtenerResumenPlataformaUseCase, ObtenerIndicadoresClinicosUseCase,
                         ObtenerActividadRecienteUseCase, ObtenerAlertasSistemaUseCase,
                         ObtenerSaludPlataformaUseCase
    ports/out/           PlataformaDashboardRepositoryPort
    service/             PlataformaDashboardApplicationService
  infrastructure/
    adapters/in/rest/    AdminDashboardRestController, dto/, mapper/PlataformaDashboardRestMapper
    adapters/out/persistence/ PlataformaDashboardPersistenceAdapter
```

> El servicio usa **dos dependencias**:
> - `DashboardScopeResolver` → zonas clínicas globales (pacientes activos, citas hoy/mes, sesiones completadas). Para `admin_platform` devuelve `GLOBAL` (sin `terapeutaIds`).
> - `PlataformaDashboardRepositoryPort` → zonas administrativas (terapeutas activos, usuarios por rol, accesos, salud, feature flags).
> Las consultas clínicas reutilizan `PacienteRepositoryPort`/`CitaRepositoryPort`/`SesionRepositoryPort` con el alcance obtenido; no se duplican en el puerto nuevo.

### 3.2 Casos de uso (devuelven dominio, no DTO)

| Caso de uso | Entrada | Salida (dominio) |
| :--- | :--- | :--- |
| `ObtenerResumenPlataformaUseCase` | — | `ResumenPlataforma` (solo KPIs) |
| `ObtenerIndicadoresClinicosUseCase` | — | `List<IndicadorClinico>` |
| `ObtenerActividadRecienteUseCase` | `limit` (clamp 1..20) | `ActividadReciente` (accesos, usuarios, citas) |
| `ObtenerAlertasSistemaUseCase` | — | `AlertasSistema` |
| `ObtenerSaludPlataformaUseCase` | — | `SaludPlataforma` |

> Los `ports/in` devuelven modelos de dominio; `PlataformaDashboardRestMapper` los convierte a DTO en infraestructura (patrón ADR-001, igual que `DashboardRestMapper`).

### 3.3 Endpoints REST (context-path `/api/v1`) — 5 endpoints = 5 zonas

| Método | Ruta | `@PreAuthorize` | Respuesta |
| :--- | :--- | :--- | :--- |
| GET | `/admin/dashboard/resumen` | `hasAuthority('ROLE_ADMIN_PLATFORM')` | `ResumenPlataformaDTO` (solo KPIs) |
| GET | `/admin/dashboard/indicadores-clinicos` | `hasAuthority('ROLE_ADMIN_PLATFORM')` | `List<IndicadorClinicoDTO>` |
| GET | `/admin/dashboard/actividad-reciente?limit=10` | `hasAuthority('ROLE_ADMIN_PLATFORM')` | `ActividadRecienteDTO` |
| GET | `/admin/dashboard/alertas-sistema` | `hasAuthority('ROLE_ADMIN_PLATFORM')` | `AlertasSistemaDTO` |
| GET | `/admin/dashboard/salud-plataforma` | `hasAuthority('ROLE_ADMIN_PLATFORM')` | `SaludPlataformaDTO` |

### 3.4 DTOs de respuesta

```java
public record ResumenPlataformaDTO(KpisPlataformaDTO kpis) {}

public record KpisPlataformaDTO(
    int terapeutasActivos,
    int pacientesActivos,
    int citasHoy,
    int citasMes,
    int sesionesCompletadas
) {}

public record IndicadorClinicoDTO(
    String clave,        // efectividad_tbe | indice_fidelidad | tasa_desercion
    String etiqueta,
    BigDecimal valor,
    String unidad        // "%" | "x/10" | ...
) {}

public record ActividadRecienteDTO(
    List<AccesoRecienteDTO> accesos,
    List<UsuarioRecienteDTO> usuarios,
    List<CitaRecienteDTO> citas
) {}
public record AccesoRecienteDTO(String id, String usuario, LocalDateTime fecha) {}
public record UsuarioRecienteDTO(String id, String nombre, String rol, LocalDateTime creadoEn) {}
public record CitaRecienteDTO(String id, String paciente, LocalDateTime fechaHoraInicio) {}

public record AlertasSistemaDTO(
    int consentimientosPendientes,
    int riesgosAltos,
    int citasBloqueadas,
    List<AlertaSistemaDetalleDTO> detalle
) {}
public record AlertaSistemaDetalleDTO(String id, String tipo, String titulo, String severidad) {}

public record SaludPlataformaDTO(List<SaludModuloDTO> modulos, List<FeatureFlagDTO> featureFlags) {}
public record SaludModuloDTO(String nombre, String estado, int erroresRecientes) {}
public record FeatureFlagDTO(String clave, boolean activo) {}
```

### 3.5 Errores
- `401` sin autenticación, `403` sin `ROLE_ADMIN_PLATFORM` (vía `AuthenticationEntryPoint`/`AccessDeniedHandler` con `ProblemDetail`).
- `500` genérico: el handler del paquete `dashboard` NO debe exponer `ex.getMessage()` (log interno, mensaje genérico al cliente).
- Cada zona falla de forma aislada (un endpoint por zona, no un agregado único).

### 3.6 Puerto de salida

```java
public interface PlataformaDashboardRepositoryPort {
    // Administrativo
    int contarTerapeutasActivos();
    Map<String, Integer> contarUsuariosActivosPorRol();   // rolCodigo -> count

    // Actividad reciente (auditoria_accesos + usuarios + citas)
    List<AccesoReciente> findAccesosRecientes(int limit);
    List<UsuarioReciente> findUsuariosRecientes(int limit);
    List<CitaReciente> findCitasRecientes(int limit);

    // Salud de plataforma (origen: config estática / Actuator — diferido a Fase 2)
    List<SaludModulo> obtenerSaludModulos();
    List<FeatureFlag> obtenerFeatureFlagsActivos();
}
```

---

## 4. Frontend (Angular 18 standalone)

### 4.1 Rutas

```ts
// app.routes.ts — rama hermana de MainLayout
{
  path: 'admin',
  canActivate: [authGuard, adminPlatformGuard],
  loadChildren: () => import('./modules/admin/admin.routes').then(m => m.ADMIN_ROUTES)
}

// modules/admin/admin.routes.ts
export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', loadComponent: () => import('./dashboard-plataforma/dashboard-plataforma.component').then(m => m.DashboardPlataformaComponent) },
      // Módulos 2 y 3 (stubs en esta fase):
      { path: 'usuarios', loadComponent: () => import('./usuarios/usuarios.component').then(m => m.UsuariosComponent) },
      { path: 'sedes', loadComponent: () => import('./sedes/sedes.component').then(m => m.SedesComponent) }
    ]
  }
];
```

> **Landing**: `homeRedirectGuard` debe **reemplazar** el `router.navigate(['/dashboard'])` fijo de `login.component.ts` y los `redirectTo` raíz (`''` y `**`) para que `admin_platform` aterrice en `/admin/dashboard`.

### 4.2 Componentes

```
modules/admin/
├─ admin-layout/admin-layout.component.ts|html|scss   // sin sidebar/header/LEVA del terapeuta
├─ admin-layout/admin-sidebar.component.ts|html|scss  // nav: Dashboard, Usuarios*, Sedes* (*stubs Fase 2)
└─ dashboard-plataforma/
   ├─ dashboard-plataforma.component.ts|html|scss
   │    providers: [{ provide: PlataformaDashboardRepository,
   │                 useFactory: (http: HttpClient) => new DashboardPlataformaHttpAdapter(http),
   │                 deps: [HttpClient] }]             // HTTP-only, sin condicional de environment (D5)
   ├─ ports/dashboard-plataforma.repository.ts
   ├─ adapters/dashboard-plataforma-http.adapter.ts
   └─ components/
      ├─ kpi-row/                  // reutiliza kpi-card de modules/dashboard (extender con delta)
      ├─ indicadores-clinicos/     // progress-ring (efectividad/fidelidad/deserción)
      ├─ actividad-reciente/       // tabs: pacientes / citas / accesos
      ├─ alertas-sistema/          // contadores + detalle con badges de severidad
      └─ salud-plataforma/         // grid de módulos + feature flags
```

### 4.3 Zonas y UX

| Zona | Contenido | Tokens |
| :--- | :--- | :--- |
| KPIs globales | terapeutas, pacientes, citas hoy/mes, sesiones completadas | `clinical-dark` + delta % (extender `kpi-card` con `@Input() delta?`) |
| Indicadores clínicos | efectividad TBE, fidelidad, deserción | anillo `clinical-teal` / `clinical-accent` |
| Actividad reciente | feed con tabs | — |
| Alertas de sistema | consentimientos, riesgo, normativa | `clinical-risk` rojo |
| Salud de plataforma | módulos, feature flags, errores | dot de estado |

**Estados por zona**: skeleton (no spinner global), error con reintento aislado, vacío ilustrado. KPIs nunca vacíos (muestran `0`).

### 4.4 Tipos (en `ports/dashboard-plataforma.repository.ts`)

```ts
import { Observable } from 'rxjs';

export interface DashboardPlataformaKpis {
  terapeutasActivos: number;
  pacientesActivos: number;
  citasHoy: number;
  citasMes: number;
  sesionesCompletadas: number;
}
export interface DashboardPlataformaResumen { kpis: DashboardPlataformaKpis; }

export interface IndicadorClinico { clave: string; etiqueta: string; valor: number; unidad: string; }

export interface AccesoReciente { id: string; usuario: string; fecha: string; }
export interface UsuarioReciente { id: string; nombre: string; rol: string; creadoEn: string; }
export interface CitaReciente { id: string; paciente: string; fechaHoraInicio: string; }
export interface ActividadReciente { accesos: AccesoReciente[]; usuarios: UsuarioReciente[]; citas: CitaReciente[]; }

export interface AlertaSistemaDetalle { id: string; tipo: 'consentimiento'|'riesgo'|'normativa'; titulo: string; severidad: string; }
export interface AlertasSistema {
  consentimientosPendientes: number;
  riesgosAltos: number;
  citasBloqueadas: number;
  detalle: AlertaSistemaDetalle[];
}

export interface FeatureFlag { clave: string; activo: boolean; }
export interface SaludModulo { nombre: string; estado: 'ok'|'degradado'|'caido'; erroresRecientes: number; }
export interface SaludPlataforma { modulos: SaludModulo[]; featureFlags: FeatureFlag[]; }

export abstract class PlataformaDashboardRepository {
  abstract obtenerResumen(): Observable<DashboardPlataformaResumen>;
  abstract obtenerIndicadoresClinicos(): Observable<IndicadorClinico[]>;
  abstract obtenerActividadReciente(limit?: number): Observable<ActividadReciente>;
  abstract obtenerAlertasSistema(): Observable<AlertasSistema>;
  abstract obtenerSaludPlataforma(): Observable<SaludPlataforma>;
}
```

### 4.5 Guards

```ts
// core/guards/admin-platform.guard.ts — usa el CONJUNTO de roles (no activeRole) para multi-rol
export const adminPlatformGuard: CanActivateFn = () => {
  const roleService = inject(RoleStateService);
  const router = inject(Router);
  if (roleService.hasRole('admin_platform')) return true;
  return router.createUrlTree(['/dashboard']);
};

// core/guards/home-redirect.guard.ts — precedencia multi-rol
export const homeRedirectGuard: CanActivateFn = () => {
  const roleService = inject(RoleStateService);
  const router = inject(Router);
  if (roleService.hasRole('patient')) return router.createUrlTree(['/mi-historial']);
  if (roleService.hasRole('admin_platform')) return router.createUrlTree(['/admin/dashboard']);
  return router.createUrlTree(['/dashboard']);
};
```

> **Wiring**: en Angular, `redirectTo` se evalúa **antes** que los guards. Para aplicar `homeRedirectGuard` a las rutas raíz (`''` y `**`), se usa una ruta sin `redirectTo` con un componente stub vacío:
> ```ts
> { path: '', pathMatch: 'full', canActivate: [authGuard, homeRedirectGuard], component: HomeRedirectComponent }
> { path: '**', canActivate: [authGuard, homeRedirectGuard], component: HomeRedirectComponent }
> ```
> `HomeRedirectComponent` es un stub sin plantilla; el guard devuelve `createUrlTree(...)` y produce la navegación.

## 5. ADR-004 (excepción a dual adapter)

Crear `docs/adr/ADR-004-admin-http-only.md` con:

- **Decisión**: los módulos `/admin/*` usan solo `HttpAdapter`; no hay `LocalStorageAdapter` y el factory condicional de `environment` no aplica.
- **Justificación**:
  1. No existe modo demo para administración.
  2. Un `LocalStorageAdapter` enmascararía defectos de autorización (403) en E2E.
  3. Evita simular privilegios y datos falsos en una superficie privilegiada.

---

## 6. Base de datos

- **Sin tablas nuevas** para KPIs, indicadores, actividad y alertas (read-model agregado).
- **Excepción**: "salud de plataforma" NO tiene fuente en el esquema actual → se difiere a Fase 2 (config estática/Actuator) o migración futura (`modulos_plataforma`, `feature_flags`, `errores_plataforma`).
- Migración **V26** (dashboard): `idx_sesiones_status_validado ON sesiones(status) WHERE status='validado'` (KPI = "sesiones validadas"; `sesiones.status` es `borrador|validado`).
- La unicidad de CLUES es de Sedes (módulo 3), NO del dashboard.
- Reutilizados:
  - `idx_citas_fecha` (V1), `idx_citas_fecha_estado` (V9) → citas hoy/mes.
  - `idx_pacientes_status` (V3) → pacientes activos.
  - `idx_usuario_roles_rol` (V4) → usuarios por rol.
  - `auditoria_accesos` (V1) + `idx_auditoria_accion_fecha` (V5) → últimos accesos (fuente correcta, no `last_login_at`).
- Opcionales según query final: `idx_citas_created_at`, `idx_usuarios_created_at`, `idx_citas_bloqueada_normativa`, `idx_auditoria_accesos_created_at`.

---

## 7. Criterios de aceptación

1. Al iniciar sesión, `admin_platform` aterriza en `/admin/dashboard` (via `homeRedirectGuard`).
2. El shell admin NO muestra sidebar/header/LEVA del terapeuta.
3. Las 5 zonas cargan de forma independiente; el fallo de una no bloquea las demás.
4. No hay enlaces a expedientes/fichas de pacientes (solo agregados).
5. Cada endpoint responde `403` para roles distintos de `admin_platform`.
6. Los KPIs muestran `0` cuando no hay datos (nunca vacío).

---

## 8. Pruebas

- **Backend (unit)**: casos de uso con `PlataformaDashboardRepositoryPort` mockeado; `@PreAuthorize` verificado (403 para `admin_clinical`/`therapist`).
- **Frontend (component)**: render por zona, estados skeleton/error/vacío, guard de ruta.
- **E2E (Playwright)**: login `admin_platform` → landing `/admin/dashboard`; `admin_clinical` NO puede acceder a `/admin/*`.

---

## 9. Orden de implementación

1. Migración V26 (índice sesiones validado).
2. Backend: dominio + puerto + servicio + mapper + controller + DTOs.
3. Frontend: `adminPlatformGuard` + `homeRedirectGuard` (prerequisito de landing).
4. `AdminLayoutComponent` + `AdminSidebarComponent`.
5. `DashboardPlataformaComponent` + zonas.
6. Pruebas y E2E.
