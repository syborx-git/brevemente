package com.syborx.brevemente.leva.application.ports.in;

import com.syborx.brevemente.leva.domain.model.LevaClinicalProposal;

public interface GetLevaProposalUseCase {
    LevaClinicalProposal getProposalBySessionId(String sessionId);
    LevaClinicalProposal getProposalByTaskId(String taskId);
}
