package com.syborx.brevemente.leva.infrastructure.adapters.in.rest.dto;

import com.syborx.brevemente.leva.domain.model.RiskAssessment;
import com.syborx.brevemente.leva.domain.model.RiskLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RiskAlertResponse {
    private String sessionId;
    private RiskLevel riskLevel;
    private boolean requiresImmediateIntervention;
    private List<String> detectedTriggers;
    private List<String> riskCategories;
    private String recommendedProtocol;
    private String escalationSummary;

    public static RiskAlertResponse fromAssessment(String sessionId, RiskAssessment assessment) {
        if (assessment == null) return null;
        return RiskAlertResponse.builder()
                .sessionId(sessionId)
                .riskLevel(assessment.getLevel())
                .requiresImmediateIntervention(assessment.isRequiresImmediateHumanIntervention())
                .detectedTriggers(assessment.getDetectedTriggers())
                .riskCategories(assessment.getRiskCategories())
                .recommendedProtocol(assessment.getRecommendedProtocol())
                .escalationSummary(assessment.getEscalationSummary())
                .build();
    }
}
