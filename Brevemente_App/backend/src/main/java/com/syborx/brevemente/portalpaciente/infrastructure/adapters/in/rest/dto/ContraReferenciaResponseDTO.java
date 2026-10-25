package com.syborx.brevemente.portalpaciente.infrastructure.adapters.in.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Contra-referencia aprobada visible en el portal del paciente")
public record ContraReferenciaResponseDTO(
        @Schema(description = "Identificador de la contra-referencia", example = "cr-001")
        String id,

        @Schema(description = "Nombre del terapeuta de origen (deriva de)", example = "Dra. Sofía Ramírez Lozano")
        String fromTherapistName,

        @Schema(description = "Nombre del terapeuta destino (nuevo terapeuta)", example = "Dr. Alejandro Silva")
        String toTherapistName,

        @Schema(description = "Estado de la contra-referencia", example = "aprobada")
        String estado,

        @Schema(description = "Fecha de aprobación (YYYY-MM-DD)", example = "2026-10-01")
        String aprobadaEl
) {}
