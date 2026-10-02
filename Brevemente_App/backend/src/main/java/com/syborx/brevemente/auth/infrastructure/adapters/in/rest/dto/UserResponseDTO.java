package com.syborx.brevemente.auth.infrastructure.adapters.in.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

@Schema(description = "Datos del usuario autenticado")
public record UserResponseDTO(
        @Schema(description = "Identificador del usuario", example = "usr-001")
        String id,

        @Schema(description = "Nombre compuesto (nombre + apellidos)", example = "Dra. Sofía Ramírez Lozano")
        String name,

        @Schema(description = "Roles (multi-rol)", example = "[\"therapist\", \"supervisor\"]")
        List<String> roles,

        @Schema(description = "Correo institucional", example = "sofia.ramirez@brevemente.org")
        String email,

        @Schema(description = "Cédula profesional (solo therapist)", example = "CED-782190-PSIC")
        String license
) {}
