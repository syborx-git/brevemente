---
name: sdop-hexagonal
description: Estándar integral de Arquitectura Hexagonal (Ports & Adapters) con estrategia Dual-Adapter en Angular 18 y Spring Boot 3 con documentación OpenAPI/Swagger.
---

# Estándar de Arquitectura Hexagonal SDOP — SyborX BreveMente

Este estándar rige la separación estricta entre puertos del dominio y adaptadores de infraestructura tanto para el frontend en Angular 18 como para el backend en Spring Boot 3 + PostgreSQL.

---

## 1. Estructura de Módulo Angular (Frontend)

Cada módulo dentro de `src/app/modules/[nombre-modulo]/` debe cumplir:

```text
[nombre-modulo]/
├── [modulo].component.html           # Vista declarativa (100% inmutable)
├── [modulo].component.scss           # Estilos clínicos encapsulados (100% inmutable)
├── [modulo].component.ts             # Controlador / Presentador
├── ports/
│   └── [modulo].repository.ts       # Interface abstracta (Port secundario)
└── adapters/
    ├── [modulo]-localstorage.adapter.ts # Adaptador Demo / Offline / Cache
    └── [modulo]-http.adapter.ts        # Adaptador Producción (Spring Boot REST)
```

### Reglas de Frontend
1. Los componentes **NUNCA** inyectan directamente `HttpClient` o clases concretas de persistencia.
2. Inyectan el token o contrato abstracto definido en `ports/`.
3. La selección del adaptador activo se define por Factory Provider mediante el Feature Flag en `environment.features.[modulo]Backend`.

---

## 2. Estructura de Módulo Spring Boot (Backend)

Cada módulo dentro de `com.syborx.brevemente.[modulo]` debe estructurarse en tres capas concéntricas:

```text
com.syborx.brevemente.[modulo]
├── domain/                               <-- NÚCLEO PURO (Zero dependencias de Spring/JPA)
│   ├── model/                            <-- POJOs de negocio clínico
│   └── exception/                        <-- Excepciones semánticas de dominio
│
├── application/                          <-- CASOS DE USO Y PUERTOS
│   ├── ports/
│   │   ├── in/                           <-- Puertos de Entrada (Driving / UseCases)
│   │   │   ├── Listar[Entidad]UseCase.java
│   │   │   ├── Obtener[Entidad]UseCase.java
│   │   │   ├── Crear[Entidad]UseCase.java
│   │   │   └── Actualizar[Entidad]UseCase.java
│   │   └── out/                          <-- Puertos de Salida (Driven / Repositorios)
│   │       └── [Entidad]RepositoryPort.java
│   └── service/                          <-- Implementación de UseCases
│       └── [Entidad]Service.java
│
└── infrastructure/                       <-- ADAPTADORES TECNOLÓGICOS
    └── adapters/
        ├── in/
        │   └── rest/                     <-- Adaptador Web / HTTP
        │       ├── [Entidad]Controller.java
        │       ├── dto/                  <-- Records Java con @Schema de Swagger
        │       │   ├── [Entidad]ResponseDTO.java
        │       │   ├── [Entidad]CreateRequest.java
        │       │   └── [Entidad]PatchRequest.java
        │       └── mapper/               <-- Mapper REST <-> Dominio
        │           └── [Entidad]RestMapper.java
        └── out/
            └── persistence/              <-- Adaptador PostgreSQL / JPA
                ├── [Entidad]PersistenceAdapter.java (Implementa RepositoryPort)
                ├── entity/               <-- Entidades JPA (@Entity, @Table)
                │   └── [Entidad]JpaEntity.java
                ├── repository/           <-- Spring Data Interfaces
                │   └── [Entidad]JpaRepository.java
                └── mapper/               <-- Mapper JPA <-> Dominio
                    └── [Entidad]PersistenceMapper.java
```

---

## 3. Estándar Mandatorio OpenAPI / Swagger

Todo módulo en Spring Boot debe implementar documentación viva con **SpringDoc OpenAPI 3**:

1. **Controlador REST**:
   - Anotado con `@Tag(name = "[Modulo]", description = "...")`.
   - Cada método `@GetMapping`, `@PostMapping`, etc., debe llevar `@Operation(summary = "...", description = "...")`.
   - Respuestas documentadas con `@ApiResponse(responseCode = "...", description = "...")`.
2. **DTOs (Records)**:
   - Atributos anotados con `@Schema(description = "...", example = "...")`.
3. **Acceso Swagger UI**:
   - URL: `/api/v1/swagger-ui.html`
   - Especificación: `/api/v1/v3/api-docs`
