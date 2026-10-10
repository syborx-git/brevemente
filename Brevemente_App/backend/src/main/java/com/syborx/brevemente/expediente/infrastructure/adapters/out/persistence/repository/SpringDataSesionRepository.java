package com.syborx.brevemente.expediente.infrastructure.adapters.out.persistence.repository;

import com.syborx.brevemente.expediente.infrastructure.adapters.out.persistence.entity.SesionJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SpringDataSesionRepository extends JpaRepository<SesionJpaEntity, String> {
    List<SesionJpaEntity> findByExpedienteIdOrderByNumeroAsc(String expedienteId);
    Optional<SesionJpaEntity> findTopByExpedienteIdOrderByNumeroDesc(String expedienteId);
}
