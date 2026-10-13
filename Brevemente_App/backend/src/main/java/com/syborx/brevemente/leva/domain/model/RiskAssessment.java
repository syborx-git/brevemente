package com.syborx.brevemente.leva.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RiskAssessment {
    @Builder.Default
    private RiskLevel level = RiskLevel.NONE;
    @Builder.Default
    private List<String> detectedTriggers = new ArrayList<>();
    @Builder.Default
    private List<String> riskCategories = new ArrayList<>(); // e.g. "IDEACION_SUICIDA", "AUTOLESION", "VIOLENCIA"
    private String recommendedProtocol;
    private String escalationSummary;
    private boolean requiresImmediateHumanIntervention;
}
