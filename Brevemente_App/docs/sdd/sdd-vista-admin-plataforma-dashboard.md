# SDD: Vista Admin Plataforma — Módulo 1 · Dashboard de Plataforma

- **Fecha**: 2026-11-05
- **Módulo**: `admin/dashboard` (Dashboard de Plataforma)
- **Rol**: `admin_platform` (rol-001)
- **Estado**: DISEÑO — listo para implementación
- **Relacionado con**: `gap-report-vista-admin-plataforma-1.md` (Fase 1), ADR-001 (hexagonal), ADR-002 (dual adapters), ADR-003 (OpenAPI)
- **Rama de trabajo**: `feature/jp-vista-admin-1`

---

## 1. Propósito

Centro de mando global para el Administrador de Plataforma (dueño de la plataforma): monitorea a los terapeutas que contratan el servicio, sin operar pacientes ni citas.

**Principios**:
- El admin ve **información de la plataforma y de sus terapeutas**, no detalles de pacientes ni citas.
- KPIs mínimos: **terapeutas activos** y **pacientes activos**.
- Indicadores clínicos globales con **desglose por terapeuta** bajo demanda (modal).
- Alertas de tipo **administrativo/financiero** (mock en Fase 1; las reales llegan con la pasarela de pagos).
- La salud de plataforma queda como **zona mock en Fase 1** (datos reales con config/Actuator en Fase 2).

---

## 2. Decisiones de diseño

| # | Decisión | Detalle |
| :--- | :--- | :--- |
| D1 | Ruta | `/admin/dashboard`, bajo la rama padre `/admin` (layout propio). |
| D2 | Guard | `authGuard` + `adminPlatformGuard` en el padre `admin` (solo `admin_platform` accede). |
| D3 | Backend | Permiso granular nuevo `ADMIN_DASHBOARD_LEER` (perm-026, V26) en cada endpoint: `@PreAuthorize("hasAuthority('ADMIN_DASHBOARD_LEER')")`. Autoridad en MAYÚSCULAS. |
| D4 | Servicio | Nuevo `PlataformaDashboardApplicationService` + `PlataformaDashboardRepositoryPort`. No sobrecargar `DashboardScopeResolver`. |
| D5 | Dual adapter | El admin va **directo a HTTP** (sin `LocalStorageAdapter`). Excepción a ADR-002 documentada en ADR-004 (ver §5). |
| D6 | Tipos | Los DTOs del módulo viven en `ports/dashboard-plataforma.repository.ts`, no en `clinical.types.ts`. |
| D7 | Zonas | 5 zonas independientes con carga/error/vacío aislados por zona. |
| D8 | KPIs | Solo 2: `terapeutasActivos` y `pacientesActivos`. Sin citas ni sesiones. |
| D9 | Indicadores | Globales, con **desglose por terapeuta** en modal al hacer clic. |
| D10 | Alertas | Solo **administrativas/financieras** (mock en Fase 1; reales con la pasarela de pagos). En el mock: 2 alertas — `suscripción vencida` (rojo, severidad `alta`) y `pago recibido` (verde, severidad `ok`). |
| D11 | KPI terapeutas | La tarjeta **Terapeutas activos** es clicable: abre un modal con el listado de terapeutas del sistema (nombre, especialidad, estado). |

---

## 3. Backend (hexagonal)

### 3.1 Paquete

```
com.syborx.brevemente.plataforma/          // paquete dedicado (no mezclar con el dashboard clínico)
  domain/model/          ResumenPlataforma, KpisPlataforma, IndicadorClinico, DesgloseIndicador,
                         ActividadReciente, AccesoReciente, UsuarioReciente,
                         AlertasAdministrativas, SaludPlataforma, SaludModulo, FeatureFlag
  application/
    ports/in/            ObtenerResumenPlataformaUseCase, ObtenerIndicadoresClinicosUseCase,
                         ObtenerDesgloseIndicadorUseCase, ObtenerActividadRecienteUseCase,
                         ObtenerAlertasAdministrativasUseCase, ObtenerSaludPlataformaUseCase
    ports/out/           PlataformaDashboardRepositoryPort
    service/             PlataformaDashboardApplicationService
  infrastructure/
    adapters/in/rest/    AdminDashboardRestController, dto/, mapper/PlataformaDashboardRestMapper
    adapters/out/persistence/ PlataformaDashboardPersistenceAdapter
```

> Nota:
> - `pacientesActivos` reutiliza `PacienteRepositoryPort` con `COUNT` global (colección vacía = sin filtro por terapeuta); no hace falta `DashboardScopeResolver` porque todos los endpoints son de `admin_platform`.
> - Los indicadores (efectividad, fidelidad, deserción) y su desglose son **mock en Fase 1** (no hay columnas numéricas en BD); se harán reales en fase futura con normalización de datos.
> - Las alertas administrativas son **mock** en Fase 1; se harán reales con la pasarela de pagos.

### 3.2 Casos de uso (devuelven dominio, no DTO)

| Caso de uso | Entrada | Salida (dominio) |
| :--- | :--- | :--- |
| `ObtenerResumenPlataformaUseCase` | — | `ResumenPlataforma` (2 KPIs) |
| `ObtenerIndicadoresClinicosUseCase` | — | `List<IndicadorClinico>` (global) |
| `ObtenerDesgloseIndicadorUseCase` | `clave` | `List<DesgloseIndicador>` (por terapeuta) |
| `ObtenerActividadRecienteUseCase` | `limit` (clamp 1..20) | `ActividadReciente` (accesos, usuarios) |
| `ObtenerAlertasAdministrativasUseCase` | — | `AlertasAdministrativas` |
| `ObtenerSaludPlataformaUseCase` | — | `SaludPlataforma` |

> Los `ports/in` devuelven modelos de dominio; `PlataformaDashboardRestMapper` los convierte a DTO en infraestructura (patrón ADR-001, igual que `DashboardRestMapper`).

### 3.3 Endpoints REST (context-path `/api/v1`) — 6 endpoints, 5 zonas

| Método | Ruta | `@PreAuthorize` | Respuesta |
| :--- | :--- | :--- | :--- |
| GET | `/admin/dashboard/resumen` | `hasAuthority('ADMIN_DASHBOARD_LEER')` | `ResumenPlataformaDTO` (2 KPIs) |
| GET | `/admin/dashboard/indicadores-clinicos` | `hasAuthority('ADMIN_DASHBOARD_LEER')` | `List<IndicadorClinicoDTO>` |
| GET | `/admin/dashboard/indicadores-clinicos/{clave}/desglose` | `hasAuthority('ADMIN_DASHBOARD_LEER')` | `List<DesgloseIndicadorDTO>` |
| GET | `/admin/dashboard/actividad-reciente?limit=10` | `hasAuthority('ADMIN_DASHBOARD_LEER')` | `ActividadRecienteDTO` (accesos + usuarios) |
| GET | `/admin/dashboard/alertas-administrativas` | `hasAuthority('ADMIN_DASHBOARD_LEER')` | `AlertasAdministrativasDTO` |
| GET | `/admin/dashboard/salud-plataforma` | `hasAuthority('ADMIN_DASHBOARD_LEER')` | `SaludPlataformaDTO` |

> El desglose (`{clave}/desglose`) es un sub-recurso de la zona "Indicadores clínicos"; por eso son 6 endpoints y 5 zonas.
> `clave` se valida contra el enum `ClaveIndicadorClinico` en su forma serializada minúscula (valor inválido → `400`).

### 3.4 DTOs de respuesta

```java
// Serialización: @JsonValue en minúsculas snake_case para alinear con el frontend.
public enum ClaveIndicadorClinico { EFECTIVIDAD_TBE("efectividad_tbe"), INDICE_FIDELIDAD("indice_fidelidad"), TASA_DESERCION("tasa_desercion") }
public enum EstadoModulo { OK("ok"), DEGRADADO("degradado"), CAIDO("caido") }
public enum TipoAlertaAdministrativa { SUSCRIPCION("suscripcion"), MOROSIDAD("morosidad"), LICENCIA("licencia"), CEDULA("cedula"), HONORARIOS("honorarios"), OTRO("otro") }
public enum Severidad { ALTA("alta"), MEDIA("media"), BAJA("baja"), OK("ok") }

public record ResumenPlataformaDTO(KpisPlataformaDTO kpis) {}

public record KpisPlataformaDTO(
    int terapeutasActivos,
    int pacientesActivos
) {}

public record IndicadorClinicoDTO(
    ClaveIndicadorClinico clave,
    String etiqueta,
    BigDecimal valor,
    String unidad        // "%" | "x/10" | ...
) {}

public record DesgloseIndicadorDTO(
    String terapeutaId,
    String terapeutaNombre,
    BigDecimal valor,
    int casos
) {}

public record ActividadRecienteDTO(
    List<AccesoRecienteDTO> accesos,
    List<UsuarioRecienteDTO> usuarios
) {}
public record AccesoRecienteDTO(String id, String usuario, LocalDateTime fecha) {}       // ISO-8601
public record UsuarioRecienteDTO(String id, String nombre, String rol, LocalDateTime creadoEn) {}  // ISO-8601

public record AlertasAdministrativasDTO(List<AlertaAdministrativaDTO> alertas) {}
public record AlertaAdministrativaDTO(
    String id,
    TipoAlertaAdministrativa tipo,
    String titulo,
    String descripcion,
    Severidad severidad,
    LocalDateTime fecha     // ISO-8601
) {}

public record SaludPlataformaDTO(List<SaludModuloDTO> modulos, List<FeatureFlagDTO> featureFlags) {}
public record SaludModuloDTO(String nombre, EstadoModulo estado, int erroresRecientes) {}
public record FeatureFlagDTO(String clave, boolean activo) {}
```

> Fechas serializadas en **ISO-8601** (`yyyy-MM-dd'T'HH:mm:ss`); el formateo relativo ("hace 2 días") es decisión de UI.

### 3.5 Errores
- `401` sin autenticación, `403` sin `ADMIN_DASHBOARD_LEER` (vía `AuthenticationEntryPoint`/`AccessDeniedHandler` con `ProblemDetail`).
- `500` genérico: el handler del paquete `dashboard` NO debe exponer `ex.getMessage()` (log interno, mensaje genérico al cliente).
- Cada zona falla de forma aislada (un endpoint por zona, no un agregado único).

### 3.6 Puerto de salida

```java
public interface PlataformaDashboardRepositoryPort {
    // KPIs
    int contarTerapeutasActivos();
    int contarPacientesActivos();

    // Indicadores (MOCK en Fase 1: globales + desglose por terapeuta)
    List<IndicadorClinico> obtenerIndicadoresClinicos();
    List<DesgloseIndicador> obtenerDesgloseIndicador(ClaveIndicadorClinico clave);

    // Actividad reciente (auditoria_accesos + usuarios)
    List<AccesoReciente> findAccesosRecientes(int limit);
    List<UsuarioReciente> findUsuariosRecientes(int limit);

    // Alertas administrativas (MOCK en Fase 1)
    List<AlertaAdministrativa> obtenerAlertasAdministrativas();

    // Salud de plataforma (MOCK estático en Fase 1; real con config/Actuator en Fase 2)
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

> **Landing**: `login.component.ts` ya navega a `/`, y las rutas raíz (`''` y `**`) usan `homeRedirectGuard`, por lo que `admin_platform` aterriza en `/admin/dashboard` sin cambios adicionales.

### 4.2 Componentes

```
core/layout/admin-layout/
├─ admin-layout.component.ts|html|scss              // sin sidebar/header/LEVA del terapeuta
└─ admin-sidebar.component.ts|html|scss             // nav: Dashboard, Usuarios*, Sedes*

modules/admin/
├─ usuarios/          // stub Fase 2
├─ sedes/             // stub Fase 2
└─ dashboard-plataforma/
   ├─ dashboard-plataforma.component.ts|html|scss
   │    providers: [{ provide: PlataformaDashboardRepository,
   │                 useFactory: (http: HttpClient) => new DashboardPlataformaHttpAdapter(http),
   │                 deps: [HttpClient] }]             // HTTP-only, sin condicional de environment (D5)
   ├─ ports/dashboard-plataforma.repository.ts
   ├─ adapters/dashboard-plataforma-http.adapter.ts
   └─ components/
      ├─ kpi-row/                  // 2 tarjetas; "Terapeutas activos" clickeable → terapeutas-modal
      ├─ indicadores-clinicos/     // tarjetas clickeables → modal desglose
      ├─ desglose-indicador-modal/ // modal desglose por terapeuta
      ├─ terapeutas-modal/         // modal listado de terapeutas (nombre, especialidad, estado)
      ├─ actividad-reciente/       // accesos + usuarios nuevos
      ├─ alertas-administrativas/  // mock: suscripción vencida (rojo) + pago recibido (verde)
      └─ salud-plataforma/         // grid de módulos + feature flags
```

> **Fase 1 (mock actual)**: la implementación vigente es un **único componente monolítico** (`DashboardPlataformaComponent`) con datos inline y campos simples (sin `signal()`), sin `ports/adapters` ni `providers`. La descomposición en los 8 subcomponentes de arriba, la capa `ports/adapters` con `PlataformaDashboardRepository`/`DashboardPlataformaHttpAdapter` y el estado reactivo con `signal()` se realizan en la **fase de conexión con backend** (SDD §9, pasos 2–3). En Fase 1 los dos modales viven dentro del componente y no hay skeleton/error por zona (datos estáticos).

### 4.3 Zonas y UX

| Zona | Contenido | Tokens |
| :--- | :--- | :--- |
| KPIs globales | terapeutas activos (clickeable → modal listado), pacientes activos | `clinical-dark` |
| Indicadores clínicos | efectividad TBE, fidelidad, deserción (clickeables → modal desglose) | anillo `clinical-teal` / `clinical-accent` |
| Actividad reciente | accesos + usuarios nuevos | — |
| Alertas administrativas | suscripción vencida (rojo) + pago recibido (verde) (mock) | `clinical-risk` / verde |
| Salud de plataforma | módulos, feature flags | dot de estado |

**Estados por zona**: skeleton (no spinner global), error con reintento aislado, vacío ilustrado. KPIs nunca vacíos (muestran `0`).

### 4.4 Tipos (en `ports/dashboard-plataforma.repository.ts`)

```ts
import { Observable } from 'rxjs';

export interface DashboardPlataformaKpis {
  terapeutasActivos: number;
  pacientesActivos: number;
}
export interface DashboardPlataformaResumen { kpis: DashboardPlataformaKpis; }

// Tipo local del MOCK (Fase 1): la tarjeta KPI renderiza etiqueta/valor/pie directamente.
export interface KpiPlataforma {
  clave: 'terapeutas_activos' | 'pacientes_activos';
  etiqueta: string;
  valor: string;
  pie: string;
}

export type IndicadorClave = 'efectividad_tbe' | 'indice_fidelidad' | 'tasa_desercion';
export interface IndicadorClinico { clave: IndicadorClave; etiqueta: string; valor: number; unidad: string; }
export interface DesgloseIndicador { terapeutaId: string; terapeutaNombre: string; valor: number; casos: number; }

// Forma del MOCK (Fase 1). Fase 2 reintroduce id / rol / creadoEn al conectar el backend (§3.4).
export interface AccesoReciente { usuario: string; fecha: string; }
export interface UsuarioReciente { nombre: string; detalle: string; fecha: string; }
export interface ActividadReciente { accesos: AccesoReciente[]; usuarios: UsuarioReciente[]; }

export interface AlertaAdministrativa {
  id: string;
  tipo: 'suscripcion'|'otro';  // Fase 2: enum completo (morosidad|licencia|cedula|honorarios|otro)
  titulo: string;
  descripcion: string;
  severidad: 'alta'|'media'|'baja'|'ok';
  fecha: string;   // ISO-8601
}
export interface AlertasAdministrativas { alertas: AlertaAdministrativa[]; }

export interface Terapeuta {
  id: string;
  nombre: string;
  especialidad: string;
  estado: 'activo'|'inactivo';
}

export interface FeatureFlag { clave: string; activo: boolean; }
export interface SaludModulo { nombre: string; estado: 'ok'|'degradado'|'caido'; }  // Fase 2 añade erroresRecientes
export interface SaludPlataforma { modulos: SaludModulo[]; featureFlags: FeatureFlag[]; }

export abstract class PlataformaDashboardRepository {
  abstract obtenerResumen(): Observable<DashboardPlataformaResumen>;
  abstract obtenerIndicadoresClinicos(): Observable<IndicadorClinico[]>;
  abstract obtenerDesgloseIndicador(clave: IndicadorClave): Observable<DesgloseIndicador[]>;
  abstract obtenerActividadReciente(limit?: number): Observable<ActividadReciente>;
  abstract obtenerAlertasAdministrativas(): Observable<AlertasAdministrativas>;
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
>
> La precedencia `patient` → `admin_platform` en `homeRedirectGuard` es intencional (un usuario multi-rol con `patient` va a su portal).

### 4.6 Modal de desglose por terapeuta

- **Dueño del estado**: `DashboardPlataformaComponent` mantiene `indicadorSeleccionado: IndicadorClinico | null = null` (campo simple en Fase 1; migra a `signal()` al conectar backend).
- **Flujo**: `indicadores-clinicos` emite `(seleccionado)` al padre → el padre abre `desglose-indicador-modal` con `clave` + `etiqueta` y pide el desglose (mock en Fase 1).
- **Estados**: skeleton → error (reintento) → vacío ("sin desglose") → lista ordenada por `valor` desc con `terapeutaNombre`, `valor`, `casos`.
- **A11y**: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, cierre con ESC y retorno de foco al disparador (implementados). Focus trap: pendiente (backlog).

### 4.7 Modal listado de terapeutas

- **Disparador**: la tarjeta KPI **Terapeutas activos** (kpi-row) es clicable.
- **Dueño del estado**: `DashboardPlataformaComponent` mantiene `terapeutasAbierto = false` (campo simple en Fase 1; migra a `signal()` al conectar backend).
- **Contenido**: tabla con `nombre`, `especialidad` y `estado` (`activo`/`inactivo`) de los terapeutas registrados; contador total en el encabezado.
- **Datos**: mock en Fase 1 (12 terapeutas); en backend se expondrá vía el listado de terapeutas del módulo Usuarios.
- **A11y**: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, cierre con ESC/clic en fondo y retorno de foco al KPI (implementados). Focus trap: pendiente (backlog).

## 5. ADR-004 (excepción a dual adapter)

Crear `docs/adr/ADR-004-admin-http-only.md` con:

- **Decisión**: los módulos `/admin/*` usan solo `HttpAdapter`; no hay `LocalStorageAdapter` y el factory condicional de `environment` no aplica.
- **Justificación**:
  1. No existe modo demo para administración.
  2. Un `LocalStorageAdapter` enmascararía defectos de autorización (403) en E2E.
  3. Evita simular privilegios y datos falsos en una superficie privilegiada.

---

## 6. Base de datos

- **Migración V26** (única del dashboard): crea el permiso `ADMIN_DASHBOARD_LEER` (perm-026) y lo otorga a `rol-001`, y añade los índices de actividad:
  ```sql
  CREATE INDEX IF NOT EXISTS idx_auditoria_created_at ON auditoria_accesos (created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_usuarios_created_at    ON usuarios (created_at DESC);
  ```
- KPIs: `terapeutas.activo` (V1) y `pacientes.status='activo'` (V3, con `idx_pacientes_status`) → tablas existentes.
- **Indicadores y desglose: MOCK en Fase 1.** No hay columnas numéricas (`sesiones.eff`/`adherencia` son TEXT); se normalizarán en fase futura. Para el desglose, `casos` se contará por `expedientes_clinicos.terapeuta_asignado_id` (columna en V1; índice `idx_expedientes_terapeuta` en V7) y `terapeutaNombre` proviene de `terapeutas.nombre/apellidos` (V1); el JOIN a `usuarios` (V4) es opcional.
- Actividad: `auditoria_accesos` (V1) + `idx_auditoria_created_at` (V26) y `usuarios` + `idx_usuarios_created_at` (V26). `auditoria_accesos.usuario_id` es NULLABLE → `LEFT JOIN` con fallback ("Intento fallido").
- **Alertas administrativas y salud de plataforma**: MOCK estático en Fase 1 (sin fuente de datos). Reales con pasarela de pagos / config-Actuator en fase futura.

---

## 7. Criterios de aceptación

1. Al iniciar sesión, `admin_platform` aterriza en `/admin/dashboard` (via `homeRedirectGuard`).
2. El shell admin NO muestra sidebar/header/LEVA del terapeuta.
3. Las 5 zonas cargan de forma independiente; el fallo de una no bloquea las demás.
4. Solo 2 KPIs (terapeutas activos, pacientes activos); no se muestran citas ni sesiones.
5. La actividad reciente muestra accesos y usuarios nuevos, sin citas.
6. Las alertas son administrativas/financieras (mock): suscripción vencida (rojo) y pago recibido (verde); sin alertas clínicas de pacientes/citas.
7. Al hacer clic en un indicador clínico se abre el modal de desglose por terapeuta.
8. Cada endpoint responde `403` sin el permiso `ADMIN_DASHBOARD_LEER`.
9. Los KPIs muestran `0` cuando no hay datos (nunca vacío).
10. Al hacer clic en el KPI "Terapeutas activos" se abre el modal con el listado de terapeutas (nombre, especialidad, estado).

---

## 8. Pruebas

- **Backend (unit)**: casos de uso con `PlataformaDashboardRepositoryPort` mockeado; `@PreAuthorize` verificado (403 para `admin_clinical`/`therapist`).
- **Frontend (component)**: render por zona, estados skeleton/error/vacío, guard de ruta.
- **E2E (Playwright)**: login `admin_platform` → landing `/admin/dashboard`; `admin_clinical` NO puede acceder a `/admin/*`.

---

## 9. Orden de implementación

1. Frontend: reemplazar el mock viejo por el nuevo alcance (2 KPIs, indicadores con modal desglose mock, actividad sin citas, alertas administrativas mock, salud mock).
2. Backend: migración V26 (`ADMIN_DASHBOARD_LEER` + índices de actividad).
3. Backend: dominio + puerto + servicio + mapper + controller + DTOs.
4. Pruebas y E2E.

---

## 10. Registro de cambios

- **2026-11-05** — SDD inicial (auditado ×4): alcance Fase 1 con 2 KPIs, indicadores + modal desglose, actividad sin citas, alertas administrativas mock, salud mock, permiso `ADMIN_DASHBOARD_LEER` (V26).
- **2026-11-06** — Refinamiento del mock frontend (implementado):
  - Alertas administrativas reducidas a **2**: `suscripción vencida` (severidad `alta`, rojo) y `pago recibido` (severidad `ok`, verde).
  - KPI **Terapeutas activos** clickeable → **modal con listado de terapeutas** (nombre, especialidad, estado).
  - Estado final de enums: `TipoAlertaAdministrativa` incluye `SUSCRIPCION`; `Severidad` incluye `OK`.
  - A11y de modales: cierre con ESC y retorno de foco al disparador implementados (focus trap en backlog).
  - SDD alineado al mock Fase 1 (monolítico, campos simples, tipos locales); la descomposición en subcomponentes y `signal()` queda para la fase backend.
