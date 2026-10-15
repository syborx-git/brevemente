package com.syborx.brevemente.paciente.infrastructure.adapters.in.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

@Schema(description = "Datos editables de la configuración del terapeuta")
public record TerapeutaConfigRequestDTO(
        @Schema(description = "Teléfono de consulta", example = "5551234567")
        String telefono,

        @NotNull
        @Min(15)
        @Max(240)
        @Schema(description = "Duración por defecto de la sesión (minutos)", example = "50")
        Integer duracionSesionDefaultMin,

        @NotNull
        @DecimalMin(value = "0.00", message = "El costo de la primera sesión no puede ser negativo")
        @Schema(description = "Costo de la primera sesión (MXN)", example = "1200.00")
        BigDecimal costoPrimeraSesion,

        @NotNull
        @DecimalMin(value = "0.00", message = "El costo de seguimiento no puede ser negativo")
        @Schema(description = "Costo de la sesión de seguimiento (MXN)", example = "1000.00")
        BigDecimal costoSeguimiento,

        @NotNull
        @Min(0)
        @Max(120)
        @Schema(description = "Edad mínima de atención (0 = sin límite)", example = "0")
        Integer edadMinimaAtencion
) {}
