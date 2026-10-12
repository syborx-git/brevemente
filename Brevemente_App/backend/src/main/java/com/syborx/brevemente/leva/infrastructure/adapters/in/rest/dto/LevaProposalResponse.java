package com.syborx.brevemente.leva.infrastructure.adapters.in.rest.dto;

import com.syborx.brevemente.leva.domain.model.HumanReviewStatus;
import com.syborx.brevemente.leva.domain.model.LevaClinicalProposal;
import com.syborx.brevemente.leva.domain.model.RiskAssessment;
import com.syborx.brevemente.leva.domain.model.RiskLevel;
import com.syborx.brevemente.leva.domain.model.StructuredProposalData;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LevaProposalResponse {
    private String proposalId;
    private String taskId;
    private String sessionId;
    private String pacienteId;
    private String terapeutaId;
    private HumanReviewStatus humanReviewStatus;
    private RiskLevel riskLevel;
    private RiskAssessment riskAlertDetails;
    private StructuredProposalData structuredProposal;
    private StructuredProposalData approvedData;
    private String reviewedById;
    private Instant reviewedAt;
    private Instant createdAt;

    public static LevaProposalResponse fromDomain(LevaClinicalProposal proposal) {
        if (proposal == null) return null;
        return LevaProposalResponse.builder()
                .proposalId(proposal.getId())
                .taskId(proposal.getTaskId())
                .sessionId(proposal.getCitaId())
                .pacienteId(proposal.getPacienteId())
                .terapeutaId(proposal.getTerapeutaId())
                .humanReviewStatus(proposal.getHumanReviewStatus())
                .riskLevel(proposal.getRiskLevel())
                .riskAlertDetails(proposal.getRiskAlertDetails())
                .structuredProposal(proposal.getStructuredProposal())
                .approvedData(proposal.getApprovedData())
                .reviewedById(proposal.getReviewedById())
                .reviewedAt(proposal.getReviewedAt())
                .createdAt(proposal.getCreatedAt())
                .build();
    }
}
