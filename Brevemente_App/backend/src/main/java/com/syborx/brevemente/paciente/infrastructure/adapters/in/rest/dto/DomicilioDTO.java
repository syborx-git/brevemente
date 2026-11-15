package com.syborx.brevemente.paciente.infrastructure.adapters.in.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Domicilio estructurado del paciente")
public record DomicilioDTO(
        @Schema(example = "Av. Insurgentes 123") String calleNumero,
        @Schema(example = "Roma Norte") String colonia,
        @Schema(example = "06700") String codigoPostal,
        @Schema(example = "Cuauhtémoc") String municipio,
        @Schema(example = "CDMX") String estadoDomicilio,
        String telefonoCasa,
        String telefonoCelular,
        String telefonoTrabajo
) {}
