package com.syborx.brevemente.auth.infrastructure.adapters.in.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Cambio de contraseña (onboarding obligatorio o cambio voluntario)")
public record CambiarPasswordRequest(
        @NotBlank
        @Schema(description = "Contraseña actual (o temporal)", example = "demo123")
        String passwordActual,

        @NotBlank
        @Schema(description = "Nueva contraseña (cumple la política)", example = "NuevaClave123")
        String nuevaPassword
) {}
