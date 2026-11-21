package com.syborx.brevemente.expediente.infrastructure.adapters.out.persistence.repository;

import com.syborx.brevemente.expediente.infrastructure.adapters.out.persistence.entity.ExpedienteJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SpringDataExpedienteRepository extends JpaRepository<ExpedienteJpaEntity, String> {
    Optional<ExpedienteJpaEntity> findByPacienteId(String pacienteId);

    boolean existsByPacienteId(String pacienteId);

    @Query(value = "SELECT 'EXP-' || lpad(nextval('seq_expediente_folio')::text, 4, '0')", nativeQuery = true)
    String siguienteFolio();
}
