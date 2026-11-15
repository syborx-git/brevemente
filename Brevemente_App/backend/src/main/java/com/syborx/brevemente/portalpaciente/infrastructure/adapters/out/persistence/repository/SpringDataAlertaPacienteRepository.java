package com.syborx.brevemente.portalpaciente.infrastructure.adapters.out.persistence.repository;

import com.syborx.brevemente.portalpaciente.infrastructure.adapters.out.persistence.entity.AlertaPacienteJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface SpringDataAlertaPacienteRepository
        extends JpaRepository<AlertaPacienteJpaEntity, String> {

    List<AlertaPacienteJpaEntity> findByPacienteIdOrderByCreatedAtDesc(String pacienteId);

    @Query(value = """
            SELECT a.id, a.paciente_id, p.nombre, p.apellidos, a.tipo, a.estado,
                   a.mensaje, a.created_at, a.resuelta_por, a.resuelta_en
            FROM alerta_paciente a
            JOIN pacientes p ON p.id = a.paciente_id
            WHERE a.estado = 'activa' AND a.tipo IN ('crisis', 'seguridad_clinica')
            ORDER BY a.created_at DESC
            """, nativeQuery = true)
    List<Object[]> findActivasGlobal();

    @Query(value = """
            SELECT a.id, a.paciente_id, p.nombre, p.apellidos, a.tipo, a.estado,
                   a.mensaje, a.created_at, a.resuelta_por, a.resuelta_en
            FROM alerta_paciente a
            JOIN pacientes p ON p.id = a.paciente_id
            WHERE a.estado = 'activa' AND a.tipo IN ('crisis', 'seguridad_clinica')
              AND p.terapeuta_id IN :terapeutaIds
            ORDER BY a.created_at DESC
            """, nativeQuery = true)
    List<Object[]> findActivasScoped(@Param("terapeutaIds") Collection<String> terapeutaIds);

    @Query(value = """
            SELECT a.id, a.paciente_id, p.nombre, p.apellidos, a.tipo, a.estado,
                   a.mensaje, a.created_at, a.resuelta_por, a.resuelta_en
            FROM alerta_paciente a
            JOIN pacientes p ON p.id = a.paciente_id
            WHERE a.id = :id
            """, nativeQuery = true)
    List<Object[]> findStaffById(@Param("id") String id);
}
