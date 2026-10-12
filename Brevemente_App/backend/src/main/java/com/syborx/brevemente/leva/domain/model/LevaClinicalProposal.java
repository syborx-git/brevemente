package com.syborx.brevemente.leva.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LevaClinicalProposal {
    private String id;
    private String taskId;
    private String citaId;
    private String pacienteId;
    private String terapeutaId;
    @Builder.Default
    private HumanReviewStatus humanReviewStatus = HumanReviewStatus.PROPOSED;
    @Builder.Default
    private RiskLevel riskLevel = RiskLevel.NONE;
    private RiskAssessment riskAlertDetails;
    private StructuredProposalData structuredProposal;
    private StructuredProposalData approvedData;
    private String reviewedById;
    private Instant reviewedAt;
    private Instant createdAt;
    private Instant updatedAt;
}
