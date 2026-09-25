package com.syborx.brevemente.paciente.infrastructure.adapters.out.persistence.repository;

import com.syborx.brevemente.paciente.infrastructure.adapters.out.persistence.entity.PacienteJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SpringDataPacienteRepository extends JpaRepository<PacienteJpaEntity, String> {
    Optional<PacienteJpaEntity> findByCurp(String curp);
    boolean existsByCurp(String curp);
}
