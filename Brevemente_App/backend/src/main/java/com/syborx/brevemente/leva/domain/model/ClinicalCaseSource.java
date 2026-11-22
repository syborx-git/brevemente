package com.syborx.brevemente.leva.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Ficha anonimizada de un caso clínico promovido por el rol autorizado
 * como fuente de aprendizaje de LEVA. No contiene datos personales.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClinicalCaseSource {
    public static final String STATUS_ACTIVE = "ACTIVE";
    public static final String STATUS_REVOKED = "REVOKED";

    private String id;
    private String caseToken;
    private String expedienteId;
    private String expedienteFolio;
    private String status;
    private String spr;
    private String diagnosticoOperativo;
    private String trastornoEstrategico;
    @Builder.Default
    private List<String> tentativas = new ArrayList<>();
    @Builder.Default
    private List<String> prescripciones = new ArrayList<>();
    @Builder.Default
    private List<String> reestructuraciones = new ArrayList<>();
    private String resultado;
    private Integer numSesiones;
    private String perfilEtario;
    private String notasCuraduria;
    private String searchText;
    private List<Float> embedding;
    private String approvedBy;
    private Instant approvedAt;
    private String revokedBy;
    private Instant revokedAt;
    private Instant createdAt;

    public boolean isActive() {
        return STATUS_ACTIVE.equals(status);
    }
}
