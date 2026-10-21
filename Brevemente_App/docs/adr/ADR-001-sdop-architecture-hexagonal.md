# ADR-001: Adopción de Arquitectura Hexagonal y Metodología SDOP

- **Estado**: Aceptado
- **Fecha**: 2026-09-22
- **Autor**: Arquitecto de Software Principal / Syborx
- **Contexto**: BreveMente (Plataforma Clínica TBE)

## Contexto del Problema

El prototipo funcional navegable de BreveMente demostró la viabilidad de los flujos clínicos, la interacción con LEVA (IA estratégica) y las reglas de consentimiento informado. Sin embargo, para escalar a una solución productiva certificable en entornos sanitarios y académicos, se requiere desacoplar por completo la interfaz de usuario de las fuentes de persistencia, facilitando el desarrollo paralelo frontend/backend y la ejecución en modo demo offline.

## Decisión

Adoptar la metodología **SDOP (Spec-Driven / Software Development Operations Protocol)** y una **Arquitectura Hexagonal (Ports & Adapters)** estricta para `Brevemente_App`:

1. **Frontend en Angular**:
   - Cada módulo clínico (`pacientes`, `expediente-clinico`, `agenda`, `asistente-leva`) definirá contratos en `ports/` con clases abstractas/interfaces TypeScript.
   - Cada módulo proveerá dos adaptadores en `adapters/`:
     - `LocalStorageAdapter`: Para operación en modo demo, pruebas end-to-end con Playwright y desarrollo sin backend.
     - `HttpAdapter`: Para integración productiva contra la API REST de Spring Boot.

2. **Backend en Spring Boot (Java 21)**:
   - Persistencia controlada mediante PostgreSQL y migraciones evolutivas versionadas con Flyway (`V__*.sql`).
   - Arquitectura en capas con dominio aislado de la infraestructura de persistencia y controladores REST.

3. **Gobernanza Spec-Driven**:
   - Toda funcionalidad debe contar con su `ADR` global y `SDD` detallado antes de la codificación.
   - La paridad con la demo original de referencia (`brevemente_demo/`) se audita mediante reportes en `docs/gap-analysis/`.

## Consecuencias

### Positivas
- Desacoplamiento total del frontend respecto a la disponibilidad del backend.
- Pruebas automatizadas rápidas y reproducibles con Playwright sobre el adaptador LocalStorage.
- Facilidad para cambiar de proveedor de base de datos o API sin tocar los componentes visuales.
- Trazabilidad normativa y regulatoria para expedientes clínicos.

### Negativas / Mitigaciones
- Mayor cantidad de archivos por módulo (port, 2 adapters, componente). Mitigado con plantillas estándar y skills SDOP para el IDE.
