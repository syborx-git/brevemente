package com.syborx.brevemente.paciente.infrastructure.adapters.in.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.util.List;

@Schema(description = "Configuración del terapeuta (identidad, perfil y parámetros de consulta)")
public record TerapeutaConfigResponseDTO(
        @Schema(description = "Identificador del terapeuta", example = "ter-001")
        String id,

        @Schema(description = "Nombre completo de visualización")
        String nombre,

        @Schema(description = "Correo electrónico")
        String email,

        @Schema(description = "Cédula profesional")
        String cedulaProfesional,

        @Schema(description = "Especialidad")
        String especialidad,

        @Schema(description = "Teléfono de consulta")
        String telefono,

        @Schema(description = "Duración por defecto de la sesión (minutos)", example = "50")
        Integer duracionSesionDefaultMin,

        @Schema(description = "Costo de la primera sesión (MXN)", example = "1200.00")
        BigDecimal costoPrimeraSesion,

        @Schema(description = "Costo de la sesión de seguimiento (MXN)", example = "1000.00")
        BigDecimal costoSeguimiento,

        @Schema(description = "Edad mínima de atención (0 = sin límite)", example = "0")
        Integer edadMinimaAtencion,

        @Schema(description = "Sedes de atención del terapeuta")
        List<TerapeutaSedeDTO> sedes
) {}
