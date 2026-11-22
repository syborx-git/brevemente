package com.syborx.brevemente.leva.infrastructure.adapters.in.rest.dto;

import com.syborx.brevemente.leva.domain.model.ClinicalCaseSource;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

/** Vista de un caso fuente para el rol autorizado (sin vector ni texto de búsqueda interno). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CaseSourceResponse {
    private String id;
    private String caseToken;
    private String expedienteId;
    private String expedienteFolio;
    private String status;
    private String spr;
    private String diagnosticoOperativo;
    private String trastornoEstrategico;
    private List<String> tentativas;
    private List<String> prescripciones;
    private List<String> reestructuraciones;
    private String resultado;
    private Integer numSesiones;
    private String perfilEtario;
    private String notasCuraduria;
    private String approvedBy;
    private Instant approvedAt;
    private String revokedBy;
    private Instant revokedAt;

    public static CaseSourceResponse fromDomain(ClinicalCaseSource s) {
        return CaseSourceResponse.builder()
                .id(s.getId())
                .caseToken(s.getCaseToken())
                .expedienteId(s.getExpedienteId())
                .expedienteFolio(s.getExpedienteFolio())
                .status(s.getStatus())
                .spr(s.getSpr())
                .diagnosticoOperativo(s.getDiagnosticoOperativo())
                .trastornoEstrategico(s.getTrastornoEstrategico())
                .tentativas(s.getTentativas())
                .prescripciones(s.getPrescripciones())
                .reestructuraciones(s.getReestructuraciones())
                .resultado(s.getResultado())
                .numSesiones(s.getNumSesiones())
                .perfilEtario(s.getPerfilEtario())
                .notasCuraduria(s.getNotasCuraduria())
                .approvedBy(s.getApprovedBy())
                .approvedAt(s.getApprovedAt())
                .revokedBy(s.getRevokedBy())
                .revokedAt(s.getRevokedAt())
                .build();
    }
}
