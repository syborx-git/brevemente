# GAP Analysis Report: Módulo Pacientes

- **Fecha**: 2026-09-24
- **Módulo**: `pacientes`
- **Estado**: AUDITADO (STRICT READ-ONLY)
- **Fuentes Auditadas**:
  - **Frontend**: `Brevemente_App/frontend/src/app/modules/pacientes/` & `src/app/core/types/clinical.types.ts`
  - **Backend**: `Brevemente_App/backend/src/main/java/com/syborx/brevemente/` & `src/main/resources/db/migration/`

---

## 1. Inventario de Componentes Auditados

### 1.1 Frontend (Angular 18 — Hexagonal / SDOP)
| Componente / Archivo | Rol Arquitectónico | Estado / Observaciones |
| :--- | :--- | :--- |
| `pacientes.component.ts` | Smart Component | Controla directorio, búsqueda reactiva por nombre/CURP, filtros por estatus/consentimiento y modal de alta con cálculo automático de minoría de edad. Inyecta `PacienteRepository` mediante Factory Provider. |
| `pacientes.component.html` | Plantilla Visual (Inmutable) | Renderiza tabla clínica con badges de riesgo, estatus, capacidad jurídica y botón de navegación `/expediente/{id}`. Modal de alta con validación de apoyo para menores. |
| `pacientes.component.scss` | Estilos del Módulo | Estilos complementarios para layout clínico (100% inmutable). |
| `ports/paciente.repository.ts` | Puerto Secundario (Interface) | Define contrato: `listar()`, `buscarPorId(id)`, `crear(paciente)`, `actualizar(id, cambios)`. |
| `adapters/paciente-localstorage.adapter.ts` | Adaptador Mock (Demo / E2E) | Implementación client-side sobre `localStorage['brevemente_patients']` precargada con `mockPatients`. |
| `adapters/paciente-http.adapter.ts` | Adaptador Primario REST | Implementación basada en `HttpClient` apuntando a `/api/v1/pacientes`. |
| `core/types/clinical.types.ts` | Dominio TypeScript | Declara `Patient`, `CapacidadConsentimiento`, `RepresentanteLegal`, `QuienCompletaRegistro`. |

### 1.2 Backend (Spring Boot 3.3.3 + PostgreSQL + Flyway)
| Componente / Archivo | Rol Arquitectónico | Estado / Observaciones |
| :--- | :--- | :--- |
| `V1__init_schema.sql` | Migración Flyway Base | Define tabla `pacientes` con columnas base: `id`, `nombre`, `apellidos`, `curp`, `fecha_nacimiento`, `edad_calculada`, `telefono`, `email`, `estado_consentimiento`, `persona_de_apoyo_nombre`, `persona_de_apoyo_contacto`. |
| `V2__seed_clinical_data.sql` | Semilla Flyway de Referencia | Inserta 3 pacientes semilla (`pac-001`, `pac-002`, `pac-003`) vinculados a expedientes clínicos. |
| `BrevementeApplication.java` | Spring Boot Main Class | Clase principal ejecutable bajo el paquete `com.syborx.brevemente`. |
| `application.yml` | Configuración de Runtime | `server.servlet.context-path: /api/v1`, puerto `8080`, conexión a PostgreSQL `brevemente_db`, Flyway activo. |
| Entidades JPA (`@Entity`) | Capa de Dominio / Persistencia | **NO EXISTEN**. No hay clases JPA creadas para `Paciente`. |
| Repositorios (`@Repository`) | Acceso a Datos Spring Data | **NO EXISTEN**. No hay `PacienteRepository` JPA. |
| Servicios (`@Service`) | Capa de Negocio / Casos de Uso | **NO EXISTEN**. No hay `PacienteService`. |
| Controladores (`@RestController`) | Adaptador Web REST | **NO EXISTEN**. No hay `PacienteController` exponiendo `/pacientes`. |
| DTOs (Records Java 21) | Contratos de Transferencia | **NO EXISTEN**. No hay DTOs de entrada/salida. |

---

## 2. Matriz de Reutilización de Código Existente (Adaptar vs Crear)

Siguiendo el principio rector de SDOP (*"Reutilizar y adaptar antes de proponer código nuevo"*):

| Recurso Existente | Estado Actual | Estrategia SDOP | Detalle de Adaptación |
| :--- | :--- | :--- | :--- |
| **Tabla `pacientes`** (`V1__init_schema.sql`) | Tabla física ya creada en PostgreSQL con campos demográficos y llaves foráneas en cascada con `expedientes_clinicos` y `citas`. | **ADAPTAR / EXTENDER** | Reutilizar la tabla existente. Generar migración `V3__extend_pacientes_schema.sql` para añadir columnas faltantes requeridas por el frontend (`estatus`, `nivel_riesgo`, `modo_registro`, `motivo_consulta`, `frecuencia_sesion`, `quien_completa_registro`, `terapeuta_asignado_id`, metadatos de consentimiento/apoyo). |
| **Tabla `terapeutas`** (`V1` y `V2`) | Existen registros `ter-001` y `ter-002`. | **REUTILIZAR** | Utilizar como llave foránea para asignar el terapeuta responsable del paciente. |
| **Tabla `consentimientos_informados`** (`V1`) | Existe tabla formal de auditoría de consentimiento con hash de documento e IP. | **REUTILIZAR** | Mantener sincronizado el estado legal cuando se actualiza el consentimiento del paciente. |
| **`PacienteHttpAdapter` (Angular)** | Adaptador HTTP ya escrito en `paciente-http.adapter.ts`. | **REUTILIZAR** | El adaptador ya mapea métodos a `/api/v1/pacientes`. Únicamente requerirá ajustar operadores RxJS de transformación si la estructura del DTO Java difiere ligeramente del JSON plano de TypeScript. |
| **`PacienteRepository` (Port Angular)** | Puerto contractual `ports/paciente.repository.ts`. | **REUTILIZAR 100% INTACTO** | No requiere modificaciones, cumple el contrato de la arquitectura hexagonal. |
| **Capa Java Spring Boot** | Únicamente existe `BrevementeApplication.java`. | **CREAR** | Implementar la jerarquía completa bajo `com.syborx.brevemente`: `domain/model/PacienteEntity.java`, `repository/PacienteRepository.java`, `service/PacienteService.java`, `dto/PacienteDTOs.java` y `controller/PacienteController.java`. |

---

## 3. Matriz de Brechas (GAPs) Identificadas

| ID | Tipo | Descripción de la Brecha | Impacto | Acción Propuesta |
| :--- | :--- | :--- | :--- | :--- |
| **GAP-PAC-01** | `[MISSING]` | **Ausencia total de Controlador REST en Spring Boot**: No existe `@RestController` que exponga la ruta `/pacientes` bajo el context-path `/api/v1`. | **Crítico (Bloqueante)** | Crear `com.syborx.brevemente.controller.PacienteController` con endpoints `GET /pacientes`, `GET /pacientes/{id}`, `POST /pacientes` y `PATCH /pacientes/{id}`. |
| **GAP-PAC-02** | `[MISSING]` | **Ausencia de Entidad JPA y Repositorio**: No existe `@Entity PacienteEntity` ni `PacienteRepository extends JpaRepository`. | **Crítico (Bloqueante)** | Crear `PacienteEntity` mapeada a la tabla `pacientes` y su interfaz `PacienteRepository` con métodos de consulta por CURP y estado. |
| **GAP-PAC-03** | `[MISSING]` | **Ausencia de Capa de Servicio y DTOs**: No existe lógica de negocio para validar mayoría de edad, transición de estados de consentimiento o cálculo de riesgo. | **Alto** | Crear `PacienteService` y DTOs inmutables con Java 21 Records (`PacienteResponseDTO`, `PacienteCreateRequest`, `PacientePatchRequest`). |
| **GAP-PAC-04** | `[PARTIAL]` | **Columnas ausentes en la tabla `pacientes` de PostgreSQL**: El frontend gestiona `status` ('activo', 'completado', 'archivado', 'pendiente'), `riskLevel` ('bajo', 'medio', 'alto'), `registryMode` ('ia', 'manual'), `sessionFrequency`, `quienCompletaRegistro` y `motif`, los cuales no están en la tabla `pacientes` de `V1`. | **Alto** | Diseñar migración `V3__extend_pacientes_schema.sql` agregando `status VARCHAR(20) DEFAULT 'activo'`, `risk_level VARCHAR(10) DEFAULT 'bajo'`, `registry_mode VARCHAR(10) DEFAULT 'manual'`, `session_frequency VARCHAR(20)`, `quien_completa_registro VARCHAR(30)`, `motivo_consulta TEXT`, `terapeuta_id VARCHAR(36)`. |
| **GAP-PAC-05** | `[CONTRACT]` | **Discrepancia en Estructura de Nombre y Consentimiento**: El frontend maneja `name: string` (nombre completo único) y un objeto anidado `capacidadConsentimiento: { estado, determinadoPor, ... }` y `representante: { nombreCompleto, parentesco, ... }`. En la BD, `V1` tiene `nombre` y `apellidos` separados, y columnas planas `persona_de_apoyo_nombre`. | **Medio** | En los DTOs de Spring Boot: serializar el nombre concatenado (`nombre + ' ' + apellidos`) y mapear el bloque anidado de consentimiento/representante hacia/desde las columnas de la BD (o columnas JSONB complementarias). |
| **GAP-PAC-06** | `[DATA]` | **Inconsistencia de Datos Semilla Flyway vs Demo**: `V2__seed_clinical_data.sql` posee 3 registros con IDs `pac-001`, `pac-002`, `pac-003` que no incluyen `risk_level` ni `status`, mientras que el frontend Angular y la demo operan con `patient-1` a `patient-5`. | **Medio** | Actualizar o enriquecer los datos mediante migración Flyway complementaria para poblar los pacientes de prueba con todos los estados del filtro (`activo`, `completado`, `pendiente`, `AUTONOMO`, `REPRESENTADO_POR_EDAD`). |
| **GAP-PAC-07** | `[INCORRECT]` | **Mapeo de Tipos Temporales**: En TypeScript `fechaNacimiento` y `registrationDate` son strings formato `YYYY-MM-DD`, mientras que en BD son `DATE` y `TIMESTAMP WITH TIME ZONE`. | **Bajo** | Usar `@JsonFormat(pattern = "yyyy-MM-dd") LocalDate` en los Records Java para garantizar compatibilidad estricta sin discrepancias de zona horaria. |

---

## 4. Comparativa Detallada de Campos: Frontend vs Base de Datos

| Campo Frontend (`Patient`) | Tipo Frontend (TS) | Columna en DB (`pacientes`) | Tipo DB (PostgreSQL) | Estrategia de Resolución |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `string` | `id` | `VARCHAR(36)` | Coincidencia directa (UUID o slug). |
| `name` | `string` | `nombre` + `apellidos` | `VARCHAR(100)` c/u | Concatenar en lectura DTO; separar por espacio en escritura si se reciben juntos. |
| `phone` / `telefonoPaciente` | `string` | `telefono` | `VARCHAR(20)` | Coincidencia directa. |
| `email` | `string` | `email` | `VARCHAR(150)` | Coincidencia directa. |
| `curp` | `string` | `curp` | `VARCHAR(18)` | Coincidencia directa (clave única). |
| `birthDate` / `fechaNacimiento`| `string (YYYY-MM-DD)` | `fecha_nacimiento` | `DATE` | Mapear a `java.time.LocalDate`. |
| `edadCalculada` | `number` | `edad_calculada` | `INT` | Coincidencia directa (validado con Period en Java). |
| `status` | `'activo'\|'completado'\|...`| *(Ausente)* | *(Falta en V1)* | Agregar columna `status VARCHAR(20) DEFAULT 'activo'`. |
| `riskLevel` | `'bajo'\|'medio'\|'alto'` | *(Ausente)* | *(Falta en V1)* | Agregar columna `risk_level VARCHAR(10) DEFAULT 'bajo'`. |
| `registryMode` | `'ia'\|'manual'` | *(Ausente)* | *(Falta en V1)* | Agregar columna `registry_mode VARCHAR(10) DEFAULT 'manual'`. |
| `motif` | `string` | *(Solo en expedientes)* | *(Falta en pacientes)* | Agregar columna `motivo_consulta TEXT` en `pacientes`. |
| `therapistId` / `therapistName`| `string` | *(Solo en expedientes)* | `VARCHAR(36)` | Relación `@ManyToOne` con `TerapeutaEntity` o columna `terapeuta_id`. |
| `sessionFrequency` | `'semanal'\|'quincenal'\|...`| *(Ausente)* | *(Falta en V1)* | Agregar columna `session_frequency VARCHAR(20)`. |
| `capacidadConsentimiento.estado`| `CapacidadConsentimientoEstado`| `estado_consentimiento` | `VARCHAR(30)` | Coincidencia de valor enum ('AUTONOMO', 'REPRESENTADO_POR_EDAD', etc.). |
| `representante.nombreCompleto` | `string` | `persona_de_apoyo_nombre`| `VARCHAR(200)` | Mapear en DTO desde/hacia la columna plana. |
| `representante.telefono` | `string` | `persona_de_apoyo_contacto`| `VARCHAR(100)` | Mapear en DTO desde/hacia la columna plana. |

---

## 5. Recomendaciones para `demo-gap-implementation`

Conforme a las directrices de `ADR-001`, `ADR-002` y la Skill `demo-gap-implementation`, el cierre de estas brechas debe ejecutarse estrictamente en el siguiente orden secuencial:

### Fase 1: Base de Datos y Migración Flyway
1. Crear el script:
   `Brevemente_App/backend/src/main/resources/db/migration/V3__extend_pacientes_schema.sql`
   - Incorporar las columnas: `status`, `risk_level`, `registry_mode`, `session_frequency`, `quien_completa_registro`, `motivo_consulta`, `terapeuta_id`.
   - Añadir constraint `FOREIGN KEY (terapeuta_id) REFERENCES terapeutas(id)`.
   - Insertar o actualizar pacientes semilla con todos los campos necesarios para satisfacer los filtros de la UI de Angular.

### Fase 2: Backend Spring Boot 3 (Java 21)
1. **Entidad JPA**: Crear `com.syborx.brevemente.domain.model.PacienteEntity` respetando las anotaciones Jakarta Persistence (`@Table(name = "pacientes")`, `@Id`, `@Column`).
2. **Repositorio**: Crear `com.syborx.brevemente.repository.PacienteRepository` extendiendo `JpaRepository<PacienteEntity, String>`.
3. **DTOs Inmutables**: Crear Records en `com.syborx.brevemente.dto`:
   - `PacienteResponseDTO`: Estructura exacta esperada por el contrato `Patient` de Angular.
   - `PacienteCreateDTO`: Validación con Bean Validation (`@NotBlank`, `@Pattern(regexp = "^[A-Z]{4}...")`).
   - `PacientePatchDTO`: Soporte para actualizaciones parciales.
4. **Servicio**: Implementar `com.syborx.brevemente.service.PacienteService` con métodos `listarTodos()`, `obtenerPorId()`, `crearPaciente()` y `actualizarPaciente()`.
5. **Controlador REST**: Crear `com.syborx.brevemente.controller.PacienteController` anotado con `@RestController` y `@RequestMapping("/pacientes")` (el context-path `/api/v1` ya lo suministra `application.yml`).

### Fase 3: Adaptador Angular (Frontend)
1. **Respeto a Regla de Oro UI**: Mantener `pacientes.component.html` y `pacientes.component.scss` **100% INTACTOS**.
2. Verificar que `paciente-http.adapter.ts` reciba las respuestas esperadas.

### Fase 4: Conmutación de Feature Flag
1. En `src/environments/environment.ts`, conmutar la bandera:
   ```typescript
   features: {
     pacientesBackend: true // Activa PacienteHttpAdapter vía Factory Provider
   }
   ```

### Fase 5: Validación E2E
1. Compilar backend con Maven: `mvn clean test-compile`.
2. Compilar frontend con Angular CLI: `npm run build`.
3. Validar con Playwright que la tabla de pacientes renderiza los datos reales del backend sin errores en consola ni regresiones visuales.
