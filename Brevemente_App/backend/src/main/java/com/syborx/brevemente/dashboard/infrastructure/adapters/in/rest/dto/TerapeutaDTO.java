package com.syborx.brevemente.dashboard.infrastructure.adapters.in.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Entrada del listado de terapeutas")
public record TerapeutaDTO(
        @Schema(description = "Identificador del terapeuta", example = "ter-001")
        String id,

        @Schema(description = "Nombre de visualización del terapeuta", example = "Dra. Sofía Ramírez Lozano")
        String nombre
) {}
