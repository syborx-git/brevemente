package com.syborx.brevemente.auth.infrastructure.adapters.in.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

@Schema(description = "Datos del usuario autenticado con roles y permisos efectivos")
public record UserResponseDTO(
        @Schema(description = "Identificador del usuario", example = "usr-001")
        String id,

        @Schema(description = "Nombre compuesto (nombre + apellidos)", example = "Dra. Sofía Ramírez Lozano")
        String name,

        @Schema(description = "Roles (multi-rol)", example = "[\"therapist\", \"supervisor\"]")
        List<String> roles,

        @Schema(description = "Permisos efectivos agregados de todos sus roles (PBAC)", example = "[\"PACIENTES_LEER\", \"PACIENTES_CREAR\"]")
        List<String> permissions,

        @Schema(description = "Correo institucional", example = "sofia.ramirez@brevemente.org")
        String email,

        @Schema(description = "Cédula profesional (solo therapist)", example = "CED-782190-PSIC")
        String license,

        @Schema(description = "Terapeutas sobre los que opera la agenda", example = "[\"ter-001\"]")
        List<String> terapeutaIds,

        @Schema(description = "Paciente vinculado (solo patient)", example = "pac-001")
        String pacienteId
) {}
