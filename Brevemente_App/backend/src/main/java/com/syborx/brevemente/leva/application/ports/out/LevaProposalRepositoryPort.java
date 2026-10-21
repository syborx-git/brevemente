package com.syborx.brevemente.leva.application.ports.out;

import com.syborx.brevemente.leva.domain.model.LevaClinicalProposal;

import java.util.Optional;

public interface LevaProposalRepositoryPort {
    LevaClinicalProposal save(LevaClinicalProposal proposal);
    Optional<LevaClinicalProposal> findById(String id);
    Optional<LevaClinicalProposal> findByTaskId(String taskId);
    Optional<LevaClinicalProposal> findByCitaId(String citaId);
}
