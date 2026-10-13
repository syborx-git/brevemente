package com.syborx.brevemente.leva.infrastructure.adapters.in.rest.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CorpusQueryRequest {
    @NotBlank(message = "La consulta no puede estar vacía")
    private String query;
    private String protocolFilter; // Opcional: filtrar por código ej. 'TBE-PANICO-01'
}
