# ADR-002: Estrategia de Adaptadores Duales (LocalStorage vs HTTP REST)

- **Estado**: Aceptado
- **Fecha**: 2026-09-22
- **Autor**: Arquitecto de Software Principal / Syborx

## Contexto

Para soportar dos modos de ejecución indispensables en BreveMente:
1. **Modo Demostración / Formación Clínica / Validación E2E**: Ejecución client-side pura sin dependencias de red ni base de datos activa, ideal para demos a clientes y suites de Playwright.
2. **Modo Producción Clínica**: Conectividad segura a microservicios Spring Boot con autenticación JWT, TLS y almacenamiento transaccional en PostgreSQL.

## Decisión

Implementar un proveedor condicional (Factory Provider) en Angular que inyecte la implementación adecuada según una bandera en variables de entorno o configuración de runtime (`USE_MOCK_ADAPTERS`):

```typescript
// Ejemplo de inyección condicional
export const PacienteRepositoryProvider = {
  provide: PacienteRepository,
  useFactory: (http: HttpClient) => {
    return environment.useMock
      ? new PacienteLocalStorageAdapter()
      : new PacienteHttpAdapter(http);
  },
  deps: [HttpClient]
};
```

Ambos adaptadores deben respetar de manera idéntica las interfaces declaradas en `ports/`. Los adaptadores LocalStorage inicializan su estado con los datos simulados de referencia originados en la demo.
