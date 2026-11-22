package com.syborx.brevemente.leva.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * Instantánea de lectura de un expediente (uso interno, NO se persiste ni se expone).
 * Incluye los identificadores personales únicamente para poder depurarlos del texto.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CaseClinicalSnapshot {
    private String expedienteId;
    private String folio;
    private String estatus;
    private String sprInicial;
    private String diagnosticoOperativo;
    private String trastornoEstrategico;
    private String intentosSolucion;
    private Integer edad;
    private int numSesiones;
    /** Nombres, apellidos y personas de apoyo a eliminar del texto clínico. */
    @Builder.Default
    private List<String> identificadores = new ArrayList<>();
    /** Prescripciones (PX) registradas en las sesiones del expediente. */
    @Builder.Default
    private List<String> prescripcionesSesiones = new ArrayList<>();
    /** Propuestas de LEVA ya selladas por el terapeuta, de la más antigua a la más reciente. */
    @Builder.Default
    private List<StructuredProposalData> propuestasAprobadas = new ArrayList<>();
}
