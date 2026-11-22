package com.syborx.brevemente.leva.infrastructure.adapters.out.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.List;

@Entity
@Table(name = "leva_case_sources")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClinicalCaseSourceJpaEntity {

    @Id
    @Column(name = "id", length = 36)
    private String id;

    @Column(name = "case_token", length = 30, nullable = false, unique = true)
    private String caseToken;

    @Column(name = "expediente_id", length = 36, nullable = false)
    private String expedienteId;

    @Column(name = "expediente_folio", length = 30)
    private String expedienteFolio;

    @Column(name = "status", length = 10, nullable = false)
    private String status;

    @Column(name = "spr", columnDefinition = "TEXT")
    private String spr;

    @Column(name = "diagnostico_operativo", columnDefinition = "TEXT")
    private String diagnosticoOperativo;

    @Column(name = "trastorno_estrategico", columnDefinition = "TEXT")
    private String trastornoEstrategico;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "tentativas", columnDefinition = "jsonb", nullable = false)
    private List<String> tentativas;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "prescripciones", columnDefinition = "jsonb", nullable = false)
    private List<String> prescripciones;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "reestructuraciones", columnDefinition = "jsonb", nullable = false)
    private List<String> reestructuraciones;

    @Column(name = "resultado", columnDefinition = "TEXT")
    private String resultado;

    @Column(name = "num_sesiones", nullable = false)
    private Integer numSesiones;

    @Column(name = "perfil_etario", length = 60)
    private String perfilEtario;

    @Column(name = "notas_curaduria", columnDefinition = "TEXT")
    private String notasCuraduria;

    @Column(name = "search_text", columnDefinition = "TEXT", nullable = false)
    private String searchText;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "embedding", columnDefinition = "jsonb")
    private List<Float> embedding;

    @Column(name = "approved_by", length = 255, nullable = false)
    private String approvedBy;

    @Column(name = "approved_at", nullable = false)
    private OffsetDateTime approvedAt;

    @Column(name = "revoked_by", length = 255)
    private String revokedBy;

    @Column(name = "revoked_at")
    private OffsetDateTime revokedAt;

    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
