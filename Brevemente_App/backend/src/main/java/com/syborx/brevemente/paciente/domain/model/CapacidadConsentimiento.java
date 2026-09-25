package com.syborx.brevemente.paciente.domain.model;

import java.time.LocalDate;

public record CapacidadConsentimiento(
        String estado,
        String determinadoPor,
        LocalDate fechaDeterminacion,
        LocalDate fechaRevision,
        String motivo
) {}
