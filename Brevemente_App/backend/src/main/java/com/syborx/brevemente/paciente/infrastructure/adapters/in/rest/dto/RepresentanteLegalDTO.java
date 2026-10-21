package com.syborx.brevemente.paciente.infrastructure.adapters.in.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Datos de la persona de apoyo o representante legal designado (obligatorio en menores de edad)")
public record RepresentanteLegalDTO(
        @Schema(description = "Nombre completo del representante o persona de apoyo", example = "Claudia Santos (Madre)")
        String nombreCompleto,

        @Schema(description = "Parentesco o vínculo legal", example = "MADRE", allowableValues = {"MADRE", "PADRE", "TUTOR_LEGAL", "PERSONA_DE_APOYO"})
        String parentesco,

        @Schema(description = "Teléfono de contacto directo", example = "+52 55 1234 5678")
        String telefono,

        @Schema(description = "Correo electrónico del representante", example = "claudia.santos@familia.mx")
        String correo,

        @Schema(description = "Documento de identificación oficial", nullable = true)
        Object documentoIdentificacion,

        @Schema(description = "Documento acreditativo de vínculo jurídico o acta de nacimiento", nullable = true)
        Object documentoVinculo,

        @Schema(description = "Estatus de notificación al otro progenitor", example = "NO_APLICA", allowableValues = {"SI", "NO", "NO_APLICA"})
        String otroProgenitorInformado
) {}
