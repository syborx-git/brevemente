package com.syborx.brevemente.supervision.infrastructure.adapters.out.persistence.repository;

import com.syborx.brevemente.supervision.infrastructure.adapters.out.persistence.entity.SupervisionSolicitudJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SpringDataSupervisionSolicitudRepository extends JpaRepository<SupervisionSolicitudJpaEntity, String> {
    List<SupervisionSolicitudJpaEntity> findByPacienteIdOrderByCreatedAtDesc(String pacienteId);
}
