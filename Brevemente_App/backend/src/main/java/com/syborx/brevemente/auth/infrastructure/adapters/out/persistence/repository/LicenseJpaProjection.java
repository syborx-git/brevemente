package com.syborx.brevemente.auth.infrastructure.adapters.out.persistence.repository;

import com.syborx.brevemente.auth.infrastructure.adapters.out.persistence.entity.UsuarioJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Proyección read-only para resolver la cédula profesional (license) desde la
 * tabla `terapeutas` por `usuario_id`, sin depender de la entidad JPA del
 * módulo `paciente` (frontera hexagonal, SDD-004 §3.8).
 */
@Repository
public interface LicenseJpaProjection extends JpaRepository<UsuarioJpaEntity, String> {

    @Query(
            value = "SELECT t.cedula_profesional FROM terapeutas t WHERE t.usuario_id = :usuarioId",
            nativeQuery = true
    )
    Optional<String> findLicenseByUsuarioId(@Param("usuarioId") String usuarioId);
}
