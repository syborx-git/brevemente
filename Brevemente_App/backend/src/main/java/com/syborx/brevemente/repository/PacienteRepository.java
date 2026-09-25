package com.syborx.brevemente.repository;

import com.syborx.brevemente.domain.model.PacienteEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PacienteRepository extends JpaRepository<PacienteEntity, String> {
    Optional<PacienteEntity> findByCurp(String curp);
    boolean existsByCurp(String curp);
    List<PacienteEntity> findByStatus(String status);
}
