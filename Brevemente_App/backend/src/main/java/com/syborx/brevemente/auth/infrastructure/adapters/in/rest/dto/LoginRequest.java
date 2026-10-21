package com.syborx.brevemente.auth.infrastructure.adapters.in.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Credenciales de acceso al sistema")
public record LoginRequest(
        @NotBlank(message = "El correo es obligatorio")
        @Email(message = "El correo no tiene un formato válido")
        @Schema(description = "Correo institucional", example = "sofia.ramirez@brevemente.org")
        String email,

        @NotBlank(message = "La contraseña es obligatoria")
        @Schema(description = "Contraseña", example = "demo123")
        String password
) {}
