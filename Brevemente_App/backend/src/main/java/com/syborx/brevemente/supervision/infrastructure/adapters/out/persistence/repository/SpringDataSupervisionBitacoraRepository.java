package com.syborx.brevemente.supervision.infrastructure.adapters.out.persistence.repository;

import com.syborx.brevemente.supervision.infrastructure.adapters.out.persistence.entity.SupervisionBitacoraJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SpringDataSupervisionBitacoraRepository extends JpaRepository<SupervisionBitacoraJpaEntity, String> {
    List<SupervisionBitacoraJpaEntity> findByPacienteIdOrderByFechaDesc(String pacienteId);
}
