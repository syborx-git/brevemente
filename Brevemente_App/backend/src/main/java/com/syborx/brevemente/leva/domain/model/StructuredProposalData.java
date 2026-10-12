package com.syborx.brevemente.leva.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StructuredProposalData {
    private String diagnosticoOperativo;
    private String sistemaPerceptivoReactivo;
    @Builder.Default
    private List<String> tentativasSolucionRedundantes = new ArrayList<>();
    @Builder.Default
    private List<String> reestructuracionesPropuestas = new ArrayList<>();
    @Builder.Default
    private List<String> prescripcionesEstrategicas = new ArrayList<>();
    private String valoracionDelCambio;
    private String estratagemaAplicada;
    private String reaccionPaciente;
    private String notaEvolucionSoap;
    @Builder.Default
    private List<DialogueTurn> dialogue = new ArrayList<>();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DialogueTurn {
        private String speaker; // "Terapeuta" o "Paciente"
        private String text;
        private Double timestampStart;
        private Double timestampEnd;
    }
}
