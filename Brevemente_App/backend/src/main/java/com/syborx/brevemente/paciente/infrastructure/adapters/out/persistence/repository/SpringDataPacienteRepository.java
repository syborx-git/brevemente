package com.syborx.brevemente.paciente.infrastructure.adapters.out.persistence.repository;

import com.syborx.brevemente.paciente.infrastructure.adapters.out.persistence.entity.PacienteJpaEntity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface SpringDataPacienteRepository extends JpaRepository<PacienteJpaEntity, String> {
    Optional<PacienteJpaEntity> findByCurp(String curp);
    boolean existsByCurp(String curp);

    long countByStatus(String status);

    long countByRiskLevelIn(Collection<String> niveles);

    List<PacienteJpaEntity> findByRiskLevelIn(Collection<String> niveles);

    List<PacienteJpaEntity> findByStatus(String status);

    List<PacienteJpaEntity> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @Query("""
            SELECT p FROM PacienteJpaEntity p
            WHERE p.estadoConsentimiento = 'PENDIENTE_FIRMA'
               OR (p.estadoConsentimiento = 'REPRESENTADO_POR_EDAD'
                   AND p.consentimientoRepresentanteFirmado = false)
            """)
    List<PacienteJpaEntity> findConConsentimientoPendiente();

    @Query("""
            SELECT COUNT(p) FROM PacienteJpaEntity p
            WHERE p.estadoConsentimiento = 'PENDIENTE_FIRMA'
               OR (p.estadoConsentimiento = 'REPRESENTADO_POR_EDAD'
                   AND p.consentimientoRepresentanteFirmado = false)
            """)
    long countConConsentimientoPendiente();

    @Query("""
            SELECT COUNT(p) FROM PacienteJpaEntity p
            WHERE p.status = :status AND p.terapeuta.id IN :terapeutaIds
            """)
    long countByStatusAndTerapeutaIds(@Param("status") String status,
                                      @Param("terapeutaIds") Collection<String> terapeutaIds);

    @Query("""
            SELECT COUNT(p) FROM PacienteJpaEntity p
            WHERE p.riskLevel IN :niveles AND p.terapeuta.id IN :terapeutaIds
            """)
    long countByRiskLevelInAndTerapeutaIds(@Param("niveles") Collection<String> niveles,
                                           @Param("terapeutaIds") Collection<String> terapeutaIds);

    @Query("""
            SELECT p FROM PacienteJpaEntity p
            WHERE p.riskLevel IN :niveles AND p.terapeuta.id IN :terapeutaIds
            """)
    List<PacienteJpaEntity> findByRiskLevelInAndTerapeutaIds(
            @Param("niveles") Collection<String> niveles,
            @Param("terapeutaIds") Collection<String> terapeutaIds);

    @Query("""
            SELECT p FROM PacienteJpaEntity p
            WHERE p.status = :status AND p.terapeuta.id IN :terapeutaIds
            """)
    List<PacienteJpaEntity> findByStatusAndTerapeutaIds(@Param("status") String status,
                                                        @Param("terapeutaIds") Collection<String> terapeutaIds);

    @Query("""
            SELECT p FROM PacienteJpaEntity p
            WHERE p.terapeuta.id IN :terapeutaIds
            ORDER BY p.createdAt DESC
            """)
    List<PacienteJpaEntity> findRecientesByTerapeutaIds(@Param("terapeutaIds") Collection<String> terapeutaIds,
                                                        Pageable pageable);

    @Query("""
            SELECT p FROM PacienteJpaEntity p
            WHERE (p.estadoConsentimiento = 'PENDIENTE_FIRMA'
               OR (p.estadoConsentimiento = 'REPRESENTADO_POR_EDAD'
                   AND p.consentimientoRepresentanteFirmado = false))
              AND p.terapeuta.id IN :terapeutaIds
            """)
    List<PacienteJpaEntity> findConConsentimientoPendienteByTerapeutaIds(
            @Param("terapeutaIds") Collection<String> terapeutaIds);

    @Query("""
            SELECT COUNT(p) FROM PacienteJpaEntity p
            WHERE (p.estadoConsentimiento = 'PENDIENTE_FIRMA'
               OR (p.estadoConsentimiento = 'REPRESENTADO_POR_EDAD'
                   AND p.consentimientoRepresentanteFirmado = false))
              AND p.terapeuta.id IN :terapeutaIds
            """)
    long countConConsentimientoPendienteByTerapeutaIds(
            @Param("terapeutaIds") Collection<String> terapeutaIds);
}
