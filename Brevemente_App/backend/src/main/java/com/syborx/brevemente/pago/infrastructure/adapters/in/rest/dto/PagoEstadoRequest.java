package com.syborx.brevemente.pago.infrastructure.adapters.in.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Cambio de estado de un pago")
public record PagoEstadoRequest(
        @Schema(example = "pagado") String estado
) {}
