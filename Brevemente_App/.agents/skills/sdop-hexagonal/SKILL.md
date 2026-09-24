---
name: sdop-hexagonal
description: Estándar de implementación de Arquitectura Hexagonal (Ports & Adapters) con estrategia Dual-Adapter (LocalStorage / Mock vs HTTP REST) en Angular y Spring Boot.
---

# Estándar de Arquitectura Hexagonal SDOP

Este estándar rige la separación estricta entre puertos del dominio y adaptadores de infraestructura para el frontend Angular en `Brevemente_App`.

## Estructura de Módulo Angular

Cada módulo dentro de `src/app/modules/[nombre-modulo]/` debe cumplir:

```text
[nombre-modulo]/
├── [modulo].component.html           # Vista declarativa
├── [modulo].component.scss           # Estilos clínicos encapsulados
├── [modulo].component.ts             # Controlador / Presentador
├── ports/
│   └── [modulo].repository.ts       # Interface abstracta (Port)
└── adapters/
    ├── [modulo]-localstorage.adapter.ts # Adaptador Demo / Offline / Cache
    └── [modulo]-http.adapter.ts        # Adaptador Producción (Spring Boot REST)
```

## Reglas de Inyección de Dependencias

1. Los componentes **NUNCA** inyectan directamente `HttpClient` o clases concretas de almacenamiento.
2. Inyectan el token o contrato del repositorio definido en `ports/`.
3. La selección del adaptador activo se define por configuración de entorno (`environment.useMock` o Provider Factory en Angular).

## Ejemplo de Port e Implementación

```typescript
// ports/paciente.repository.ts
import { Observable } from 'rxjs';

export interface Paciente {
  id: string;
  nombreCompleto: string;
  curp: string;
  estadoConsentimiento: string;
}

export abstract class PacienteRepository {
  abstract listar(): Observable<Paciente[]>;
  abstract buscarPorId(id: string): Observable<Paciente | null>;
  abstract guardar(paciente: Paciente): Observable<Paciente>;
}
```
