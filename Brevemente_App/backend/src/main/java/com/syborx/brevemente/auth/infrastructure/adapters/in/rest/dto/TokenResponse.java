package com.syborx.brevemente.auth.infrastructure.adapters.in.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Respuesta de autenticación exitosa")
public record TokenResponse(
        @Schema(description = "Token JWT (Bearer)")
        String token,

        @Schema(description = "Datos del usuario autenticado")
        UserResponseDTO user
) {}
