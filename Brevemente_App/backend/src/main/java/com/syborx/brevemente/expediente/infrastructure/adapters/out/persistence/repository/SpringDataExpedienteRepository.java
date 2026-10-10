package com.syborx.brevemente.expediente.infrastructure.adapters.out.persistence.repository;

import com.syborx.brevemente.expediente.infrastructure.adapters.out.persistence.entity.ExpedienteJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SpringDataExpedienteRepository extends JpaRepository<ExpedienteJpaEntity, String> {
    Optional<ExpedienteJpaEntity> findByPacienteId(String pacienteId);
}
