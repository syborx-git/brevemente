package com.syborx.brevemente.leva.infrastructure.adapters.out.persistence.adapter;

import com.syborx.brevemente.leva.application.ports.out.LevaProposalRepositoryPort;
import com.syborx.brevemente.leva.domain.model.LevaClinicalProposal;
import com.syborx.brevemente.leva.infrastructure.adapters.out.persistence.entity.LevaProposalJpaEntity;
import com.syborx.brevemente.leva.infrastructure.adapters.out.persistence.repository.SpringDataLevaProposalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class LevaProposalPersistenceAdapter implements LevaProposalRepositoryPort {

    private final SpringDataLevaProposalRepository repository;

    @Override
    public LevaClinicalProposal save(LevaClinicalProposal domain) {
        LevaProposalJpaEntity entity = toEntity(domain);
        LevaProposalJpaEntity saved = repository.save(entity);
        return toDomain(saved);
    }

    @Override
    public Optional<LevaClinicalProposal> findById(String id) {
        return repository.findById(id).map(this::toDomain);
    }

    @Override
    public Optional<LevaClinicalProposal> findByTaskId(String taskId) {
        return repository.findByTaskId(taskId).map(this::toDomain);
    }

    @Override
    public Optional<LevaClinicalProposal> findByCitaId(String citaId) {
        return repository.findByCitaId(citaId).map(this::toDomain);
    }

    private LevaProposalJpaEntity toEntity(LevaClinicalProposal domain) {
        return LevaProposalJpaEntity.builder()
                .id(domain.getId())
                .taskId(domain.getTaskId())
                .citaId(domain.getCitaId())
                .pacienteId(domain.getPacienteId())
                .terapeutaId(domain.getTerapeutaId())
                .humanReviewStatus(domain.getHumanReviewStatus())
                .riskLevel(domain.getRiskLevel())
                .riskAlertDetails(domain.getRiskAlertDetails())
                .structuredProposal(domain.getStructuredProposal())
                .approvedData(domain.getApprovedData())
                .reviewedById(domain.getReviewedById())
                .reviewedAt(domain.getReviewedAt() != null ? domain.getReviewedAt().atOffset(ZoneOffset.UTC) : null)
                .createdAt(domain.getCreatedAt() != null ? domain.getCreatedAt().atOffset(ZoneOffset.UTC) : null)
                .updatedAt(domain.getUpdatedAt() != null ? domain.getUpdatedAt().atOffset(ZoneOffset.UTC) : null)
                .build();
    }

    private LevaClinicalProposal toDomain(LevaProposalJpaEntity entity) {
        return LevaClinicalProposal.builder()
                .id(entity.getId())
                .taskId(entity.getTaskId())
                .citaId(entity.getCitaId())
                .pacienteId(entity.getPacienteId())
                .terapeutaId(entity.getTerapeutaId())
                .humanReviewStatus(entity.getHumanReviewStatus())
                .riskLevel(entity.getRiskLevel())
                .riskAlertDetails(entity.getRiskAlertDetails())
                .structuredProposal(entity.getStructuredProposal())
                .approvedData(entity.getApprovedData())
                .reviewedById(entity.getReviewedById())
                .reviewedAt(entity.getReviewedAt() != null ? entity.getReviewedAt().toInstant() : null)
                .createdAt(entity.getCreatedAt() != null ? entity.getCreatedAt().toInstant() : null)
                .updatedAt(entity.getUpdatedAt() != null ? entity.getUpdatedAt().toInstant() : null)
                .build();
    }
}
