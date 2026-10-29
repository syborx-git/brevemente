package com.syborx.brevemente.paciente.infrastructure.adapters.out.persistence.repository;

import com.syborx.brevemente.paciente.infrastructure.adapters.out.persistence.entity.PacienteJpaEntity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface SpringDataPacienteRepository extends JpaRepository<PacienteJpaEntity, String> {
    Optional<PacienteJpaEntity> findByCurp(String curp);
    boolean existsByCurp(String curp);

    boolean existsByRfc(String rfc);

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

    @Query("""
            SELECT p FROM PacienteJpaEntity p
            WHERE p.estadoConsentimiento = 'REPRESENTADO_POR_EDAD'
              AND p.fechaNacimiento <= :corte
            ORDER BY p.fechaNacimiento
            """)
    List<PacienteJpaEntity> findMayoriaEdad(@Param("corte") LocalDate corte);

    @Query(value = """
            SELECT CASE
                WHEN p.status = 'pendiente' THEN 'Fase 1: Admisión/Definición'
                WHEN p.status = 'activo' AND p.risk_level IN ('medio','alto') THEN 'Fase 2: Desbloqueo'
                WHEN p.status = 'activo' AND p.risk_level = 'bajo' THEN 'Fase 3: Consolidación'
                WHEN p.status IN ('completado','archivado') THEN 'Fase 4: Cierre/Alta'
                ELSE 'Otra'
            END AS fase, COUNT(*) AS total
            FROM pacientes p
            WHERE (:sedeId IS NULL OR p.sede_id = :sedeId)
              AND (:protocoloId IS NULL OR p.protocolo_id = :protocoloId)
            GROUP BY fase
            ORDER BY fase
            """, nativeQuery = true)
    List<Object[]> agruparPorFaseGlobal(@Param("sedeId") String sedeId,
                                        @Param("protocoloId") String protocoloId);

    @Query(value = """
            SELECT CASE
                WHEN p.status = 'pendiente' THEN 'Fase 1: Admisión/Definición'
                WHEN p.status = 'activo' AND p.risk_level IN ('medio','alto') THEN 'Fase 2: Desbloqueo'
                WHEN p.status = 'activo' AND p.risk_level = 'bajo' THEN 'Fase 3: Consolidación'
                WHEN p.status IN ('completado','archivado') THEN 'Fase 4: Cierre/Alta'
                ELSE 'Otra'
            END AS fase, COUNT(*) AS total
            FROM pacientes p
            WHERE (:sedeId IS NULL OR p.sede_id = :sedeId)
              AND (:protocoloId IS NULL OR p.protocolo_id = :protocoloId)
              AND p.terapeuta_id IN (:terapeutaIds)
            GROUP BY fase
            ORDER BY fase
            """, nativeQuery = true)
    List<Object[]> agruparPorFaseScoped(@Param("sedeId") String sedeId,
                                        @Param("protocoloId") String protocoloId,
                                        @Param("terapeutaIds") Collection<String> terapeutaIds);

    @Query(value = """
            SELECT pr.nombre AS protocolo, COUNT(p.id) AS total
            FROM pacientes p
            JOIN protocolos pr ON pr.id = p.protocolo_id
            WHERE (:sedeId IS NULL OR p.sede_id = :sedeId)
              AND (:protocoloId IS NULL OR p.protocolo_id = :protocoloId)
            GROUP BY pr.nombre
            ORDER BY pr.nombre
            """, nativeQuery = true)
    List<Object[]> agruparPorProtocoloGlobal(@Param("sedeId") String sedeId,
                                             @Param("protocoloId") String protocoloId);

    @Query(value = """
            SELECT pr.nombre AS protocolo, COUNT(p.id) AS total
            FROM pacientes p
            JOIN protocolos pr ON pr.id = p.protocolo_id
            WHERE (:sedeId IS NULL OR p.sede_id = :sedeId)
              AND (:protocoloId IS NULL OR p.protocolo_id = :protocoloId)
              AND p.terapeuta_id IN (:terapeutaIds)
            GROUP BY pr.nombre
            ORDER BY pr.nombre
            """, nativeQuery = true)
    List<Object[]> agruparPorProtocoloScoped(@Param("sedeId") String sedeId,
                                             @Param("protocoloId") String protocoloId,
                                             @Param("terapeutaIds") Collection<String> terapeutaIds);
}
