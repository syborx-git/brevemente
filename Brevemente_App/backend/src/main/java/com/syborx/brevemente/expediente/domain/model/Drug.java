package com.syborx.brevemente.expediente.domain.model;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Medicamento del esquema farmacológico (JSONB {@code esquema_farmacologico}),
 * simétrico con el tipo {@code Drug} del frontend Angular.
 */
@Schema(description = "Medicamento del esquema farmacológico del paciente")
public record Drug(
        @Schema(example = "drug-1") String id,
        @Schema(example = "Sertralina 50mg") String name,
        String doseMorning,
        String doseAfternoon,
        String doseNight,
        String eff,
        String notes
) {}
