package com.syborx.brevemente.usuario.infrastructure.adapters.in.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Registro de la identidad clínica del administrador como terapeuta tratante")
public record RegistroIdentidadTerapeutaRequest(
        @NotBlank(message = "La cédula profesional es obligatoria")
        @Schema(description = "Cédula profesional", example = "CED-123456-PSIC")
        String cedulaProfesional,

        @Schema(description = "Especialidad", example = "Terapia Breve Estratégica")
        String especialidad,

        @NotBlank(message = "La contraseña es obligatoria para confirmar")
        @Schema(description = "Contraseña actual de confirmación")
        String passwordConfirmacion
) {}
