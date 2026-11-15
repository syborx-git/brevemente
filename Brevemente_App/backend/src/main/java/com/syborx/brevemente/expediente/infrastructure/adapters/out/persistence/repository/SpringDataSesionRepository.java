package com.syborx.brevemente.expediente.infrastructure.adapters.out.persistence.repository;

import com.syborx.brevemente.expediente.infrastructure.adapters.out.persistence.entity.SesionJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface SpringDataSesionRepository extends JpaRepository<SesionJpaEntity, String> {
    List<SesionJpaEntity> findByExpedienteIdOrderByNumeroAsc(String expedienteId);
    Optional<SesionJpaEntity> findTopByExpedienteIdOrderByNumeroDesc(String expedienteId);
    Optional<SesionJpaEntity> findByCitaId(String citaId);

    @Query(value = """
            SELECT * FROM sesiones s
            WHERE s.status = 'borrador' AND s.creado_por_id IN :terapeutaIds
            ORDER BY s.fecha DESC, s.numero DESC
            """, nativeQuery = true)
    List<SesionJpaEntity> findBorradoresPorTerapeuta(@Param("terapeutaIds") Collection<String> terapeutaIds);
}
