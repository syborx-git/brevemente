---
name: demo-gap-analysis
description: Audita en modo STRICT READ-ONLY la demo de Angular contra el backend de Spring Boot y la base de datos PostgreSQL, mapeando Controllers, Services, JPA Entities y migraciones Flyway existentes para reutilizar y adaptar antes de proponer código nuevo.
---

# Skill: demo-gap-analysis (Auditoría de Brechas SDOP) — SyborX BreveMente

Esta Skill define el procedimiento riguroso y sistemático para auditar un módulo de la demo interactiva en Angular (`[modulo]-localstorage.adapter.ts`) contra el backend empresarial en **Spring Boot 3 + Spring Data JPA + PostgreSQL + Flyway**.

---

## ⚠️ REGLA FUNDAMENTAL: 100% STRICT READ-ONLY

- Está **ESTRICTAMENTE PROHIBIDO** crear, modificar o borrar código fuente, entidades JPA, controllers, scripts SQL o componentes durante la ejecución de esta skill.
- El agente opera en **modo de solo lectura** sobre el código fuente existente.
- El **ÚNICO artefacto de salida permitido** es la generación o actualización del informe de brechas en:
  `Brevemente_App/docs/gap-analysis/gap-report-[modulo].md` (o `/docs/gap-analysis/gap-report-[modulo].md`).

---

## Flujo de Ejecución en 4 Fases

```
┌─────────────────────────────────┐      ┌─────────────────────────────────┐
│       FASE 1: MAPEAR DEMO       │      │      FASE 2: AUDITAR BACKEND    │
│ Componentes Angular, Vistas     │ ───► │ @RestController, @Service,      │
│ y LocalStorageAdapter (Mock)    │      │ @Entity JPA, Migraciones Flyway │
└─────────────────────────────────┘      └─────────────────────────────────┘
                                                          │
                                                          ▼
┌─────────────────────────────────┐      ┌─────────────────────────────────┐
│     FASE 4: GENERAR INFORME     │      │     FASE 3: DETECTAR GAPS       │
│ Informe formal en               │ ◄─── │ Clasificar: MISSING, PARTIAL,   │
│ /docs/gap-analysis/gap-*.md     │      │ INCORRECT, DATA, CONTRACT       │
└─────────────────────────────────┘      └─────────────────────────────────┘
```

---

### Fase 1: Mapeo de la Demo Angular
1. Inspeccionar el módulo objetivo en `src/app/modules/[modulo]/`:
   - `[modulo].component.html`: Elementos visuales, bindings (`[(ngModel)]`, `*ngFor`, eventos `(click)`).
   - `ports/[modulo].repository.ts`: Interfaz y tipos de datos esperados por el frontend.
   - `adapters/[modulo]-localstorage.adapter.ts`: Datos simulados (seed data) y métodos CRUD en LocalStorage.
2. Registrar todos los campos, filtros, validaciones y reglas de negocio visibles en la UI.

---

### Fase 2: Auditoría de Spring Boot y PostgreSQL (Principio de Reutilización)
**REGLA DE ORO**: *Antes de proponer código nuevo, se debe inventariar lo existente para REUTILIZAR y ADAPTAR.*

1. **Migraciones Flyway (`db/migration/V__*.sql`)**:
   - Verificar si existen tablas para la entidad en PostgreSQL.
   - Analizar columnas, tipos de datos, constraints `NOT NULL`, llaves foráneas e índices.
2. **Entidades JPA (`@Entity`)**:
   - Inspeccionar anotaciones `@Table`, `@Column`, relaciones `@ManyToOne`, `@OneToMany`.
   - Comparar nombres de campos y tipos entre Java y TypeScript.
3. **Repositorios y Servicios (`@Repository`, `@Service`)**:
   - Identificar métodos en `JpaRepository` o queries `@Query`.
   - Verificar si la lógica de negocio ya está implementada en un `@Service`.
4. **Controladores REST (`@RestController`)**:
   - Mapear endpoints (`@GetMapping`, `@PostMapping`, etc.), DTOs de entrada y salida (`Record` o clases DTO) y códigos HTTP.

---

### Fase 3: Detección y Clasificación de Brechas (GAPs)
Clasificar cada discrepancia encontrada bajo la siguiente taxonomía:
- **[MISSING]**: El endpoint, entidad, columna de Flyway o método de repositorio no existe en absoluto.
- **[PARTIAL]**: El backend tiene el recurso pero faltan campos requeridos por la demo Angular (o viceversa).
- **[INCORRECT]**: Tipos de datos incompatibles (ej. `String` vs `LocalDate`, `Instant` vs `string ISO`).
- **[CONTRACT]**: Discrepancia entre la firma del puerto Angular (`Observable<T>`) y la respuesta del `@RestController` (`ResponseEntity<T>`).
- **[DATA]**: La semilla de Flyway no contiene los datos de prueba necesarios para satisfacer la demo.

---

### Fase 4: Estructura Obligatoria del Informe de Brechas
Generar el informe en `/docs/gap-analysis/gap-report-[modulo].md` con la siguiente estructura:

```markdown
# GAP Analysis Report: Módulo [nombre-modulo]

- **Fecha**: YYYY-MM-DD
- **Módulo**: [nombre-modulo]
- **Estado**: AUDITADO (READ-ONLY)

## 1. Inventario de Componentes Auditados
- **Frontend**: `[modulo].component.ts`, `[modulo].repository.ts`, `[modulo]-localstorage.adapter.ts`
- **Backend**: Entidades JPA, Services, Controllers y Flyway existentes.

## 2. Matriz de Reutilización de Código Existente
| Componente Backend | Estado Actual | Estrategia SDOP |
| :--- | :--- | :--- |
| `V1__init_schema.sql` | Tabla `x` existe | Reutilizar y extender mediante `V__*.sql` |
| `XController.java` | Endpoints existentes | Adaptar DTO / Agregar endpoint faltante |

## 3. Matriz de Brechas (GAPs) Identificadas
| ID | Tipo | Descripción de la Brecha | Impacto | Acción Propuesta |
| :--- | :--- | :--- | :--- | :--- |
| GAP-01 | MISSING | Falta endpoint GET /api/v1/... | Alto | Crear endpoint en Controller |
| GAP-02 | PARTIAL | Columna `y` ausente en DB | Medio | Crear migración Flyway |

## 4. Recomendaciones para demo-gap-implementation
- Plan secuencial de implementación conforme a ADR-001 y SDD del módulo.
```
