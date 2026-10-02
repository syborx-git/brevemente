package com.syborx.brevemente.paciente.infrastructure.adapters.out.persistence.repository;

import com.syborx.brevemente.paciente.infrastructure.adapters.out.persistence.entity.TerapeutaJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SpringDataTerapeutaRepository extends JpaRepository<TerapeutaJpaEntity, String> {

    /**
     * Resuelve el nombre de visualización del terapeuta desde `usuarios`
     * (tras V4, `nombre`/`apellidos` viven en `usuarios`, no en `terapeutas`).
     */
    @Query(
            value = "SELECT (u.nombre || ' ' || u.apellidos) FROM terapeutas t "
                    + "JOIN usuarios u ON u.id = t.usuario_id WHERE t.id = :terapeutaId",
            nativeQuery = true
    )
    Optional<String> findTherapistDisplayName(@Param("terapeutaId") String terapeutaId);
}
