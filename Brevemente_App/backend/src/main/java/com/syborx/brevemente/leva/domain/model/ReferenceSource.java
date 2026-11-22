package com.syborx.brevemente.leva.domain.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Fuente de referencia clínica que respalda un pre-diagnóstico de LEVA.
 * Tipos: PROTOCOLO, GUIA, LIBRO (corpus) y CASO (caso institucional anonimizado).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class ReferenceSource {
    private String tipo;
    private String codigo;
    private String titulo;
    private String resumen;
    private String detalle;
    private String resultado;
    private String extracto;
    private Double similitud;
    private Integer numSesiones;
}
