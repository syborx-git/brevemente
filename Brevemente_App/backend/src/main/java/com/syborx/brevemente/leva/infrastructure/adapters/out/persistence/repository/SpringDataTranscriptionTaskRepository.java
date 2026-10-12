package com.syborx.brevemente.leva.infrastructure.adapters.out.persistence.repository;

import com.syborx.brevemente.leva.infrastructure.adapters.out.persistence.entity.TranscriptionTaskJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SpringDataTranscriptionTaskRepository extends JpaRepository<TranscriptionTaskJpaEntity, String> {
    Optional<TranscriptionTaskJpaEntity> findBySessionId(String sessionId);
}
