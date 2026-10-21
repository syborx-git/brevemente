# SDD-002: Módulo de Agenda y Citas Clínicas

- **Módulo**: `agenda`
- **Versión**: 1.0.0
- **Alineación**: ADR-001, ADR-002

## 1. Propósito
Gestión de calendario de sesiones psicoterapéuticas, validación de disponibilidad y aplicación de bloqueos normativos para expedientes con consentimiento pendiente.

## 2. Contrato del Puerto (`AgendaRepository`)
- `listarCitas(terapeutaId: string, rangoFecha: RangoFecha): Observable<CitaClinica[]>`
- `programarCita(cita: NuevaCita): Observable<CitaClinica>`
- `cancelarCita(citaId: string, motivo: string): Observable<boolean>`
- `verificarBloqueoConsentimiento(pacienteId: string): Observable<boolean>`
