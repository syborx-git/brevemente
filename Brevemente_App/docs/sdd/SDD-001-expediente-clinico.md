# SDD-001: Módulo de Expediente Clínico Unificado

- **Módulo**: `expediente-clinico`
- **Versión**: 1.0.0
- **Alineación**: ADR-001, ADR-002

## 1. Propósito
Centralizar la información clínica del paciente bajo el modelo de Terapia Breve Estratégica (TBE): motivo de consulta, intentos de solución previos, prescripciones estratégicas, notas de evolución y capacidad jurídica/consentimiento informado.

## 2. Contrato del Puerto (`ExpedienteRepository`)
- `obtenerPorPaciente(pacienteId: string): Observable<ExpedienteClinico>`
- `guardarNotaEvolucion(expedienteId: string, nota: NotaEvolucion): Observable<NotaEvolucion>`
- `actualizarConsentimiento(expedienteId: string, estado: EstadoConsentimiento): Observable<boolean>`

## 3. Reglas de Negocio
- Si el paciente es menor de 18 años, el expediente se clasifica en `REPRESENTADO_POR_EDAD`.
- No se permiten prescripciones ni grabaciones LEVA sin la firma del consentimiento por la `PERSONA_DE_APOYO`.
