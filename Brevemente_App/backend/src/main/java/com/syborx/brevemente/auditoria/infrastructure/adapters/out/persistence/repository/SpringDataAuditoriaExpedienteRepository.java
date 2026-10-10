package com.syborx.brevemente.auditoria.infrastructure.adapters.out.persistence.repository;

import com.syborx.brevemente.auditoria.infrastructure.adapters.out.persistence.entity.AuditoriaExpedienteJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SpringDataAuditoriaExpedienteRepository extends JpaRepository<AuditoriaExpedienteJpaEntity, String> {
    List<AuditoriaExpedienteJpaEntity> findByPacienteIdOrderByCreatedAtDesc(String pacienteId);
}
