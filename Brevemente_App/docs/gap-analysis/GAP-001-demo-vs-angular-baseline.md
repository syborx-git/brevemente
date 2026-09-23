# GAP-001: Línea Base de Paridad Funcional Demo React vs Angular SDOP

- **Fecha**: 2026-09-22
- **Fuente de Verdad**: `brevemente_demo/` (React 18 + TailwindCSS + MockData)
- **Destino**: `Brevemente_App/` (Angular 18 + Spring Boot 3)

## Matriz de Cobertura y Paridad

| Módulo en Demo (`brevemente_demo/`) | Módulo Angular (`Brevemente_App/`) | Estado Port/Adapter | Paridad UI (Playwright) | Migración DB (Flyway) |
| :--- | :--- | :---: | :---: | :---: |
| `src/pages/Patients.tsx` | `modules/pacientes` | Implementado | Pendiente | `V1__init_schema.sql` |
| `src/pages/ClinicalRecord.tsx` | `modules/expediente-clinico` | Implementado | Pendiente | `V1__init_schema.sql` |
| `src/pages/Agenda.tsx` | `modules/agenda` | Implementado | Pendiente | `V1__init_schema.sql` |
| `src/pages/AIAssistant.tsx` | `modules/asistente-leva` | Implementado | Pendiente | `V1__init_schema.sql` |
| `src/pages/Supervision.tsx` | `modules/supervision` | Planeado | Pendiente | `V1__init_schema.sql` |
| `src/pages/SecurityAudit.tsx` | `modules/auditoria` | Planeado | Pendiente | `V1__init_schema.sql` |

## Notas de Trazabilidad
- La demo en `brevemente_demo/` permanece como referencia visual fija.
- Cada módulo en Angular implementará pruebas automatizadas Playwright conectándose al adaptador LocalStorage para validar cero regresiones visuales.
