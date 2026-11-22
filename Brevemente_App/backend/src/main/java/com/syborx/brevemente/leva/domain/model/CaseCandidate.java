package com.syborx.brevemente.leva.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Resumen de un expediente elegible para ser promovido a caso fuente.
 * Nunca expone datos personales del paciente: solo folio y dinámica clínica.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CaseCandidate {
    private String expedienteId;
    private String folio;
    private String estatus;
    private String spr;
    private String diagnosticoOperativo;
    private String trastornoEstrategico;
    private String fechaApertura;
    private int numSesiones;
    private int propuestasAprobadas;
    private boolean yaEsFuente;
}
