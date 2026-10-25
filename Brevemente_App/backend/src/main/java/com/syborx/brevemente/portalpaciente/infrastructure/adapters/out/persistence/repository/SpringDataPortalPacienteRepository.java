package com.syborx.brevemente.portalpaciente.infrastructure.adapters.out.persistence.repository;

import com.syborx.brevemente.portalpaciente.infrastructure.adapters.out.persistence.entity.ContraReferenciaJpaEntity;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.util.List;

/**
 * Queries nativas de lectura del portal (perfil propio y prescripciones por cita),
 * que no requieren entidad JPA dedicada. Extiende {@link Repository} (marcador base)
 * para que Spring Data JPA implemente los métodos anotados con {@code @Query}.
 */
@org.springframework.stereotype.Repository
public interface SpringDataPortalPacienteRepository extends Repository<ContraReferenciaJpaEntity, String> {

    @Query(value = """
            SELECT p.id,
                   (p.nombre || ' ' || p.apellidos),
                   COALESCE((u.nombre || ' ' || u.apellidos), ''),
                   COALESCE(p.motivo_consulta, '')
            FROM pacientes p
            LEFT JOIN terapeutas t ON t.id = p.terapeuta_id
            LEFT JOIN usuarios u ON u.id = t.usuario_id
            WHERE p.id = :pacienteId
            """, nativeQuery = true)
    List<Object[]> findPerfil(@Param("pacienteId") String pacienteId);

    @Query(value = """
            SELECT s.id, s.cita_id, s.numero,
                   to_char(s.fecha, 'YYYY-MM-DD'),
                   COALESCE(s.px::text, '[]'),
                   COALESCE(s.notas, '')
            FROM sesiones s
            WHERE s.cita_id IN (SELECT c.id FROM citas c WHERE c.paciente_id = :pacienteId)
              AND s.status = 'validado'
            ORDER BY s.numero
            """, nativeQuery = true)
    List<Object[]> findSesionesPorPaciente(@Param("pacienteId") String pacienteId);

    @Query(value = """
            SELECT cr.id, cr.paciente_id, cr.terapeuta_origen_id, cr.terapeuta_destino_id,
                   cr.motivo, cr.resumen, cr.estado, cr.created_at, cr.resolved_at,
                   (uo.nombre || ' ' || uo.apellidos) AS terapeuta_origen_nombre,
                   (ud.nombre || ' ' || ud.apellidos) AS terapeuta_destino_nombre
            FROM contra_referencias cr
            JOIN terapeutas tro ON tro.id = cr.terapeuta_origen_id
            JOIN terapeutas trd ON trd.id = cr.terapeuta_destino_id
            JOIN usuarios uo ON uo.id = tro.usuario_id
            JOIN usuarios ud ON ud.id = trd.usuario_id
            WHERE cr.paciente_id = :pacienteId
              AND cr.estado = 'aprobada'
            ORDER BY COALESCE(cr.resolved_at, cr.created_at) DESC
            LIMIT 1
            """, nativeQuery = true)
    List<Object[]> findContraReferenciaAprobada(@Param("pacienteId") String pacienteId);
}
