package com.syborx.brevemente.portalpaciente.infrastructure.adapters.out.persistence.repository;

import com.syborx.brevemente.portalpaciente.infrastructure.adapters.out.persistence.entity.ContraReferenciaJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SpringDataContraReferenciaRepository
        extends JpaRepository<ContraReferenciaJpaEntity, String> {

    Optional<ContraReferenciaJpaEntity>
    findFirstByPacienteIdAndEstadoOrderByResolvedAtDescCreatedAtDesc(
            String pacienteId, String estado);
}
