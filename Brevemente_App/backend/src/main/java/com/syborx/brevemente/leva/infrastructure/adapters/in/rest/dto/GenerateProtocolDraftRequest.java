package com.syborx.brevemente.leva.infrastructure.adapters.in.rest.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GenerateProtocolDraftRequest {

    @NotBlank(message = "El problema clínico o trastorno es obligatorio")
    private String problemaClinico;

    @NotBlank(message = "El Sistema Perceptivo-Reactivo (SPR) es obligatorio")
    private String sprTentativo;

    private List<String> tentativasSolucionObservadas;
    private String estratagemaSugerida;
    private String poblacionContexto;
    private String libroReferencia;
}
