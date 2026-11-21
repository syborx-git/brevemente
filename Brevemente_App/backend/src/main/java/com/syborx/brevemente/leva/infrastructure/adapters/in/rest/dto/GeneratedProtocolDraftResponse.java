package com.syborx.brevemente.leva.infrastructure.adapters.in.rest.dto;

import com.syborx.brevemente.leva.application.ports.out.DocumentConverterPort.DocumentChunkDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GeneratedProtocolDraftResponse {
    private String title;
    private String protocolCode;
    private String category;
    private String sourceReference;
    private String objetivo;
    private String sistemaPerceptivoReactivo;
    private List<String> tentativasSolucion;
    private String puntoClave;
    private List<String> prescripcionesEstrategicas;
    private String reestructuracionArezzo;
    private String markdownContent;
    private List<DocumentChunkDto> chunks;
}
