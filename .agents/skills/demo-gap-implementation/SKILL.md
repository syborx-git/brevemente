---
name: demo-gap-implementation
description: Ejecuta la resolución técnica de brechas SDOP implementando migraciones Flyway V__*.sql, entidades JPA, DTOs, Controllers en Spring Boot, y el [Modulo]HttpAdapter en Angular, manteniendo el HTML/SCSS 100% intacto.
---

# Skill: demo-gap-implementation (Resolución e Integración SDOP) — SyborX BreveMente

Esta Skill define el protocolo de ejecución fullstack para cerrar las brechas identificadas por `demo-gap-analysis`, conectando la demo Angular con el backend productivo de **Spring Boot 3 + PostgreSQL** bajo el estándar **SDOP (Spec-Driven / Hexagonal Architecture)**.

---

## ⚠️ REGLA DE ORO DE UI: HTML Y SCSS 100% INTACTOS

- **ESTRICTAMENTE PROHIBIDO** alterar, rediseñar o refactorizar los archivos `[modulo].component.html` y `[modulo].component.scss`.
- La estructura visual, clases CSS, identificadores y layout clínico aprobados en la demo se consideran **inmutables**.
- La integración se realiza exclusivamente en la capa de adaptadores (`adapters/`), entidades, migraciones y controladores.

---

## Flujo de Implementación en 5 Fases

```
┌───────────────────────────────────────┐
│ FASE 1: BASE DE DATOS (FLYWAY)        │
│ Crear migración V__*.sql en resources │
└──────────────────┬────────────────────┘
                   │
                   ▼
┌───────────────────────────────────────┐
│ FASE 2: BACKEND SPRING BOOT 3         │
│ @Entity, Repository, Service, DTO,    │
│ @RestController en /api/v1/[modulo]   │
└──────────────────┬────────────────────┘
                   │
                   ▼
┌───────────────────────────────────────┐
│ FASE 3: ADAPTADOR ANGULAR (HTTP)      │
│ Implementar [modulo]-http.adapter.ts  │
│ respetando ports/[modulo].repository  │
└──────────────────┬────────────────────┘
                   │
                   ▼
┌───────────────────────────────────────┐
│ FASE 4: CAMBIO DE FEATURE FLAG        │
│ Conmutar LocalStorage a HttpAdapter   │
└──────────────────┬────────────────────┘
                   │
                   ▼
┌───────────────────────────────────────┐
│ FASE 5: VALIDACIÓN E2E                │
│ Pruebas REST y auditoría Playwright   │
└───────────────────────────────────────┘
```

---

### Fase 1: Base de Datos y Migración Flyway
1. Crear el nuevo script en:
   `Brevemente_App/backend/src/main/resources/db/migration/V<version>__[descripcion_concisa].sql`
2. El script debe ser idempotente y seguro:
   - Uso de `IF NOT EXISTS` en creación de tablas e índices.
   - Definición explícita de tipos compatibles con PostgreSQL (`VARCHAR`, `TIMESTAMP WITH TIME ZONE`, `TEXT`, `BOOLEAN`, `JSONB`).
   - Claves foráneas con restricciones de integridad referencial.

---

### Fase 2: Backend Spring Boot (Arquitectura Hexagonal & OpenAPI)
1. **Núcleo de Dominio (`domain/`)**:
   - Modelos de dominio POJO puros en `domain/model/` libres de anotaciones JPA o Spring.
   - Excepciones clínicas de negocio en `domain/exception/`.
2. **Capa de Aplicación y Puertos (`application/`)**:
   - Puertos de Entrada (Casos de Uso) en `application/ports/in/` (`Crear[Modulo]UseCase`, etc.).
   - Puertos de Salida (Persistencia) en `application/ports/out/` (`[Modulo]RepositoryPort`).
   - Servicio orquestador en `application/service/` implementando los casos de uso.
3. **Adaptador de Persistencia (`infrastructure/adapters/out/persistence/`)**:
   - Entidad JPA en `entity/[Modulo]JpaEntity.java` con Jakarta Persistence.
   - `[Modulo]JpaRepository.java` extendiendo `JpaRepository`.
   - `[Modulo]PersistenceAdapter.java` implementando `[Modulo]RepositoryPort`.
   - Mapper entre entidad JPA y modelo de dominio puro.
4. **Adaptador REST y Documentación OpenAPI (`infrastructure/adapters/in/rest/`)**:
   - Controlador REST anotado con `@RestController`, `@RequestMapping("/[modulo]")` (context-path `/api/v1` en yml).
   - Documentación viva Swagger: `@Tag` a nivel de clase, `@Operation` y `@ApiResponse` por endpoint.
   - DTOs inmutables (Java Records) anotados con Bean Validation y `@Schema(description = "...", example = "...")`.
   - Mapper entre DTOs y modelo de dominio.

---

### Fase 3: Adaptador HTTP en Angular
1. Completar o actualizar el archivo en:
   `Brevemente_App/frontend/src/app/modules/[modulo]/adapters/[modulo]-http.adapter.ts`
2. **Requisitos de Implementación**:
   - Implementar estrictamente la interfaz o clase abstracta definida en `ports/[modulo].repository.ts`.
   - Inyectar `HttpClient` de `@angular/common/http`.
   - Utilizar operadores RxJS (`map`, `catchError`) si se requiere transformar el formato del backend al contrato del puerto.
   - Manejar errores de red con mensajes descriptivos.

---

### Fase 4: Conmutación de Feature Flag (Modo Producción)
1. En el componente o configuración del módulo:
   ```typescript
   // Reemplazar la inyección del adaptador LocalStorage por HttpAdapter
   providers: [
     { provide: [Modulo]Repository, useClass: [Modulo]HttpAdapter }
   ]
   ```
2. O alternativamente mediante proveedor condicional configurado con `environment.useMock`.

---

### Fase 5: Verificación y Cierre
1. Compilar el backend Spring Boot: `mvn compile` o `./mvnw test-compile`.
2. Verificar la compilación del frontend Angular: `npm run build`.
3. Validar con el servidor MCP de Playwright que las pantallas del módulo cargan datos reales sin errores en consola ni regresiones visuales en el HTML.
