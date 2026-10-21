package com.syborx.brevemente.auth.infrastructure.adapters.out.persistence.repository;

import com.syborx.brevemente.auth.infrastructure.adapters.out.persistence.entity.UsuarioJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Proyección read-only para resolver los vínculos de identidad
 * (`terapeutaIds`/`pacienteId`) desde las tablas `terapeutas`,
 * `asignaciones_terapeuta` y `pacientes`, sin acoplar el módulo `auth`
 * a las entidades JPA de otros módulos.
 */
@Repository
public interface VinculoJpaProjection extends JpaRepository<UsuarioJpaEntity, String> {

    @Query(value = """
            SELECT t.id FROM terapeutas t WHERE t.usuario_id = :usuarioId
            UNION
            SELECT a.terapeuta_id FROM asignaciones_terapeuta a WHERE a.usuario_id = :usuarioId
            """, nativeQuery = true)
    List<String> findTerapeutaIdsByUsuarioId(@Param("usuarioId") String usuarioId);

    @Query(value = "SELECT p.id FROM pacientes p WHERE p.usuario_id = :usuarioId", nativeQuery = true)
    Optional<String> findPacienteIdByUsuarioId(@Param("usuarioId") String usuarioId);
}
