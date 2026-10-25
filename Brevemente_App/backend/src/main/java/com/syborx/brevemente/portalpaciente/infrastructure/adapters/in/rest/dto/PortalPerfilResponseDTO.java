package com.syborx.brevemente.portalpaciente.infrastructure.adapters.in.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Perfil propio del paciente para el encabezado del portal")
public record PortalPerfilResponseDTO(
        @Schema(description = "Identificador del paciente", example = "pac-001")
        String id,

        @Schema(description = "Nombre completo del paciente", example = "Mateo Herrera Santos")
        String name,

        @Schema(description = "Nombre del terapeuta asignado", example = "Dra. Sofía Ramírez Lozano")
        String therapistName,

        @Schema(description = "Motivo principal de consulta", example = "Bloqueo fóbico en situaciones de examen.")
        String motif
) {}
