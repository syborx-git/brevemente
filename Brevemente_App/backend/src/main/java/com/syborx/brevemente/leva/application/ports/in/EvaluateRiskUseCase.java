package com.syborx.brevemente.leva.application.ports.in;

import com.syborx.brevemente.leva.domain.model.RiskAssessment;

public interface EvaluateRiskUseCase {
    RiskAssessment evaluateRiskFromText(String transcriptionText);
}
