package com.syborx.brevemente.leva.infrastructure.adapters.out.persistence.repository;

import com.syborx.brevemente.leva.infrastructure.adapters.out.persistence.entity.LevaProposalJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SpringDataLevaProposalRepository extends JpaRepository<LevaProposalJpaEntity, String> {
    Optional<LevaProposalJpaEntity> findByTaskId(String taskId);
    Optional<LevaProposalJpaEntity> findByCitaId(String citaId);
}
