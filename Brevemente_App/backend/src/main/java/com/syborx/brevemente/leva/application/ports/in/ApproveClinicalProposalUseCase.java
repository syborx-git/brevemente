package com.syborx.brevemente.leva.application.ports.in;

import com.syborx.brevemente.leva.domain.model.LevaClinicalProposal;
import com.syborx.brevemente.leva.domain.model.StructuredProposalData;

public interface ApproveClinicalProposalUseCase {
    LevaClinicalProposal approveProposal(String proposalId, String reviewedById, StructuredProposalData approvedData);
}
