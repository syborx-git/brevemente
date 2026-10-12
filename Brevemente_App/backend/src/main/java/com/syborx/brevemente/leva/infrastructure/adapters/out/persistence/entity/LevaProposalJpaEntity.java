package com.syborx.brevemente.leva.infrastructure.adapters.out.persistence.entity;

import com.syborx.brevemente.leva.domain.model.HumanReviewStatus;
import com.syborx.brevemente.leva.domain.model.RiskAssessment;
import com.syborx.brevemente.leva.domain.model.RiskLevel;
import com.syborx.brevemente.leva.domain.model.StructuredProposalData;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;

@Entity
@Table(name = "leva_clinical_proposals")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LevaProposalJpaEntity {

    @Id
    @Column(name = "id", length = 36)
    private String id;

    @Column(name = "task_id", length = 36, nullable = false)
    private String taskId;

    @Column(name = "cita_id", length = 36)
    private String citaId;

    @Column(name = "paciente_id", length = 36)
    private String pacienteId;

    @Column(name = "terapeuta_id", length = 36)
    private String terapeutaId;

    @Enumerated(EnumType.STRING)
    @Column(name = "human_review_status", length = 30, nullable = false)
    private HumanReviewStatus humanReviewStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "risk_level", length = 20, nullable = false)
    private RiskLevel riskLevel;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "risk_alert_details", columnDefinition = "jsonb")
    private RiskAssessment riskAlertDetails;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "structured_proposal", columnDefinition = "jsonb", nullable = false)
    private StructuredProposalData structuredProposal;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "approved_data", columnDefinition = "jsonb")
    private StructuredProposalData approvedData;

    @Column(name = "reviewed_by_id", length = 36)
    private String reviewedById;

    @Column(name = "reviewed_at")
    private OffsetDateTime reviewedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
