# Walkthrough - Implementación Frontend Angular SDOP para BreveMente

Se ha completado la construcción y estructuración del frontend enterprise en **Angular 18** dentro de `/frontend/` (enlace simbólico a `Brevemente_App/frontend/`), tomando como referencia visual y operativa la demo en `brevemente_demo/` bajo la metodología **SDOP (Spec-Driven / Software Development Operations Protocol)** de Syborx.

---

## 1. Arquitectura Hexagonal y Estructura por Módulo

Cada módulo de negocio implementa estrictamente la regla de **separación quíntuple de archivos**, garantizando desacoplamiento total entre la vista, el caso de uso y la infraestructura:

```text
src/app/modules/[modulo]/
├── [modulo].component.html                   <-- Marcado HTML limpio sin lógica JS pesada
├── [modulo].component.scss                   <-- Estilos SCSS aislados respetando diseño de la demo
├── [modulo].component.ts                     <-- Componente Angular (consume ÚNICAMENTE [Modulo]Repository)
├── ports/
│   └── [modulo].repository.ts                <-- Interfaz TypeScript con contratos CRUD y de negocio
└── adapters/
    ├── [modulo]-localstorage.adapter.ts      <-- Persistencia mock en LocalStorage (Modo Demo)
    └── [modulo]-http.adapter.ts              <-- Cliente HTTP REST para Spring Boot (Modo Backend)
```

### Inyección de Dependencias por Feature Flags
Cada módulo cuenta con un `InjectionToken` y un `provider factory` que conmuta dinámicamente la implementación en tiempo de compilación/ejecución según `environment.features.[modulo]Backend`:

```typescript
export const PACIENTE_REPOSITORY_TOKEN = new InjectionToken<PacienteRepository>('PacienteRepository');

export const PacienteRepositoryProvider: Provider = {
  provide: PACIENTE_REPOSITORY_TOKEN,
  useFactory: (http: HttpClient) => {
    return environment.features.pacientesBackend
      ? new PacienteHttpAdapter(http)
      : new PacienteLocalStorageAdapter();
  },
  deps: [HttpClient]
};
```

---

## 2. Módulos Implementados

| Módulo | Ruta | Puerto / Contrato | Adaptador LocalStorage | Funcionalidad Clave |
|---|---|---|---|---|
| **Dashboard** | `/dashboard` | `DashboardRepository` | `DashboardLocalStorageAdapter` | KPIs de pacientes activos, citas del día, banner de alertas normativas y actividad reciente. |
| **Pacientes** | `/pacientes` | `PacienteRepository` | `PacienteLocalStorageAdapter` | Listado, búsqueda interactiva en tiempo real, filtros de estado, modal de nuevo paciente con detección de menores `<18` años. |
| **Expediente Clínico** | `/expediente/:id` | `ExpedienteRepository` | `ExpedienteLocalStorageAdapter` | Formulación TBE (diagnóstico operativo, SPR, tentativas de solución), historial de notas, simulador de audio/dictado y representación legal. |
| **Agenda** | `/agenda` | `AgendaRepository` | `AgendaLocalStorageAdapter` | Calendario de slots semanales, confirmación/cancelación de citas y bloqueo normativo de consentimiento. |
| **Asistente LEVA** | `/asistente-leva` | `AsistenteLevaRepository` | `AsistenteLevaLocalStorageAdapter` | Prompts clínicos de estratagemas TBE, chat en vivo y asistente cognitivo terapéutico. |
| **Supervisión** | `/supervision` | `SupervisionRepository` | `SupervisionLocalStorageAdapter` | Registro de horas acreditadas, estatus de casos supervisados y métricas. |
| **Mi Consulta** | `/mi-consulta` | `MiConsultaRepository` | `MiConsultaLocalStorageAdapter` | Tarifas de primera sesión / seguimiento, perfil profesional y cédula profesional. |

### Shell Global y Componentes Transversales:
- `SidebarComponent`: Navegación persistente con indicador activo y conteo de pacientes.
- `HeaderComponent`: Búsqueda global, selector reactivo de roles clínicos (`Terapeuta`, `Supervisor`, `Admin Clínico`, `Asistente`) y botón de apertura rápida de LEVA.
- `LevaDrawerComponent` & `LevaButtonComponent`: Drawer flotante interactivo de LEVA accesible desde cualquier pantalla.
- `RiskAlertBannerComponent`: Notificaciones normativas urgentes (vencimiento de consentimientos o alertas clínicas).

---

## 3. Verificación de Compilación y Calidad

- **Build de Producción**:
  ```bash
  npm run build
  # Application bundle generation complete. [6.202 seconds]
  # 0 Errores de compilación TypeScript/SCSS
  ```
- **Diseño Visual**:
  - Tokens de Tailwind idénticos a la demo (`clinical.dark`, `clinical.navy`, `clinical.teal`, `clinical.cyan`, `clinical.coral`).
  - Iconografía SVG nativa de `lucide-angular`.
  - Animaciones de apertura de drawer y transiciones de tabs en Expediente.

---

## 4. Evidencias de Validación Visual e Interactiva

La aplicación fue desplegada en `http://localhost:4200` y validada de forma autónoma con el subagente de navegador:

### Dashboard Principal (`/dashboard`)
Redirección inmediata de la raíz `/` a `/dashboard`, carga de tarjetas de métricas clínicas y citas del día:
![Dashboard de BreveMente](file:///C:/Users/kike2/.gemini/antigravity-ide/brain/fd6b0b45-da23-4d06-8a6f-7f03f9012e19/dashboard_page_1790141384969.png)

### Asistente Clínico LEVA (Drawer Flotante)
Activación interactiva del botón flotante inferior derecho, desplegando el drawer con sugerencias de estratagemas TBE:
![Drawer Asistente LEVA](file:///C:/Users/kike2/.gemini/antigravity-ide/brain/fd6b0b45-da23-4d06-8a6f-7f03f9012e19/leva_drawer_open_1790142063988.png)

### Video de Sesión Completa de Verificación en Navegador
Las acciones del subagente recorriendo todas las rutas (`/dashboard`, `/pacientes`, `/expediente/patient-1`, `/agenda`, `/asistente-leva`, `/supervision`, `/mi-consulta`) quedaron registradas en el artefacto WebP:
![Verificación Completa](file:///C:/Users/kike2/.gemini/antigravity-ide/brain/fd6b0b45-da23-4d06-8a6f-7f03f9012e19/verify_brevemente_frontend_1790141266662.webp)

---

## 5. Instrucciones para Ejecución Local

Para levantar el frontend de Angular en modo desarrollo:

```bash
cd Brevemente_App/frontend
npm start
# o alternativamente:
npx -y serve -s dist/brevemente-frontend/browser -l 4200
```

Abrir [http://localhost:4200](http://localhost:4200) en el navegador. La aplicación cargará automáticamente los datos de prueba en `LocalStorage` y operará con 100% de interactividad offline.
