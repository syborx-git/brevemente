# ADR-003: Adopción de Arquitectura Hexagonal y Estándar OpenAPI / Swagger en Backend Spring Boot

- **Estado**: Aceptado
- **Fecha**: 2026-09-24
- **Autor**: Lead Software Architect / Syborx
- **Alineación**: ADR-001 (Hexagonal SDOP), ADR-002 (Dual Adapters)

---

## Contexto del Problema

El backend inicial de `Brevemente_App` se estructuró con un diseño en capas tradicional (Controller $\rightarrow$ Service $\rightarrow$ Spring Data Repository $\rightarrow$ JPA Entity). Si bien este enfoque es funcional para prototipos, presenta acoplamiento directo entre las entidades de negocio clínicas y el framework de persistencia (Hibernate / JPA).

Asimismo, ante la integración de múltiples clientes (frontend Angular, futuras aplicaciones móviles, clientes de evaluación clínica e integraciones de IA con LEVA), se requiere una especificación viva, interactiva y estandarizada de la API REST mediante **OpenAPI 3 / Swagger**.

---

## Decisión

### 1. Arquitectura Hexagonal (Ports & Adapters) en Backend
Todo módulo del backend dentro de `com.syborx.brevemente.[modulo]` debe organizarse estrictamente en tres capas concéntricas con inversión de dependencias:

```
┌──────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE LAYER                      │
│  adapters.in.rest (Controller, DTOs, Swagger, RestMapper)    │
│  adapters.out.persistence (JpaAdapter, JpaEntity, JpaRepo)   │
│                                                              │
│       ┌──────────────────────────────────────────────┐       │
│       │              APPLICATION LAYER               │       │
│       │  ports.in (Casos de Uso / Driving Ports)     │       │
│       │  ports.out (Puertos de Persistencia / Driven)│       │
│       │  service (Application Services orquestadores)│       │
│       │                                              │       │
│       │       ┌──────────────────────────────┐       │       │
│       │       │         DOMAIN LAYER         │       │       │
│       │       │  model (POJOs puros de negocio)│     │       │
│       │       │  exception (Excepciones dominio)│     │      │
│       │       └──────────────────────────────┘       │       │
│       └──────────────────────────────────────────────┘       │
└──────────────────────────────────────────────────────────────┘
```

1. **Capa de Dominio (`domain`)**:
   - POJOs puros en `domain.model` sin anotaciones JPA (`@Entity`, `@Table`) ni dependencias de Spring.
   - Excepciones semánticas del negocio clínico en `domain.exception`.

2. **Capa de Aplicación (`application`)**:
   - **Puertos de Entrada (`ports.in`)**: Interfaces Java de Casos de Uso (`ListarPacientesUseCase`, `CrearPacienteUseCase`, etc.).
   - **Puertos de Salida (`ports.out`)**: Interfaces de persistencia e integraciones externas (`PacienteRepositoryPort`).
   - **Servicios de Aplicación (`service`)**: Implementan los puertos de entrada y orquestan la lógica de negocio consumiendo los puertos de salida.

3. **Capa de Infraestructura (`infrastructure`)**:
   - **Adaptador Web (`adapters.in.rest`)**: Controlador REST anotado con Spring Web y Swagger, DTOs con `@Schema` y Mapper hacia el dominio.
   - **Adaptador de Persistencia (`adapters.out.persistence`)**: Implementación del puerto de persistencia mediante Spring Data JPA (`PacientePersistenceAdapter`), mapeando entre entidades JPA y el modelo de dominio puro.

### 2. Estándar Mandatorio OpenAPI / Swagger
- Integrar la dependencia oficial de Spring Boot 3: `springdoc-openapi-starter-webmvc-ui`.
- Configurar clase global `OpenApiConfig` con metadatos clínicos de BreveMente (Título, Versión, Contacto y Seguridad).
- Documentación obligatoria en cada controlador REST:
  - `@Tag(name = "...", description = "...")` a nivel de clase.
  - `@Operation(summary = "...", description = "...")` en cada endpoint.
  - `@ApiResponse` con códigos HTTP 200, 201, 400, 404, 409 y 500 según corresponda.
  - `@Schema` en atributos clave de los DTOs de solicitud y respuesta.
- La interfaz interactiva queda disponible en: `/api/v1/swagger-ui.html` y especificación JSON en `/api/v1/v3/api-docs`.

---

## Consecuencias

### Positivas
- **Independencia Tecnológica**: El dominio clínico no depende de JPA, Hibernate ni PostgreSQL.
- **Testabilidad Aislada**: Los casos de uso y modelos de dominio se pueden probar con tests unitarios puros sin necesidad de contexto Spring ni base de datos.
- **Documentación Viva**: Todo endpoint nuevo nace autodocumentado e interactivo para el equipo frontend y testing.
- **Simetría SDOP**: Tanto frontend (Angular) como backend (Spring Boot) respetan el mismo estándar de Puertos y Adaptadores.

### Compensaciones
- Mayor número de clases por módulo (POJO de dominio + JpaEntity + DTOs + Mappers). Mitigado mediante la automatización de la Skill `demo-gap-implementation`.
