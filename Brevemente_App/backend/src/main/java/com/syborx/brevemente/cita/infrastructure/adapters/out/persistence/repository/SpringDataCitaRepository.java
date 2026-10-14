package com.syborx.brevemente.cita.infrastructure.adapters.out.persistence.repository;

import com.syborx.brevemente.cita.infrastructure.adapters.out.persistence.entity.CitaJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface SpringDataCitaRepository extends JpaRepository<CitaJpaEntity, String> {

    @Query(value = """
            SELECT c.id, c.paciente_id, c.terapeuta_id, c.expediente_id,
                   c.fecha_hora_inicio, c.fecha_hora_fin, c.tipo_cita, c.modalidad,
                   c.estado_cita, c.duracion_minutos, c.payment_status, c.consultorio,
                   c.bloqueada_por_normativa, c.created_at, c.updated_at
            FROM citas c
            WHERE (:terapeutaId IS NULL OR c.terapeuta_id = :terapeutaId)
              AND (:pacienteId IS NULL OR c.paciente_id = :pacienteId)
              AND (:consultorio IS NULL OR c.consultorio = :consultorio)
              AND (:modalidad IS NULL OR c.modalidad = :modalidad)
              AND (:estado IS NULL OR c.estado_cita = :estado)
              AND (:desde IS NULL OR c.fecha_hora_inicio::date >= :desde)
              AND (:hasta IS NULL OR c.fecha_hora_inicio::date <= :hasta)
            ORDER BY c.fecha_hora_inicio
            """, nativeQuery = true)
    List<CitaJpaEntity> findAllByFilters(
            @Param("terapeutaId") String terapeutaId,
            @Param("pacienteId") String pacienteId,
            @Param("consultorio") String consultorio,
            @Param("modalidad") String modalidad,
            @Param("estado") String estado,
            @Param("desde") LocalDate desde,
            @Param("hasta") LocalDate hasta
    );

    @Query(value = """
            SELECT COUNT(*) FROM citas c
            WHERE (c.terapeuta_id = :terapeutaId OR c.paciente_id = :pacienteId)
              AND c.fecha_hora_inicio < :fin
              AND c.fecha_hora_fin > :inicio
              AND (:excluirId IS NULL OR c.id <> :excluirId)
            """, nativeQuery = true)
    long countOverlap(
            @Param("terapeutaId") String terapeutaId,
            @Param("pacienteId") String pacienteId,
            @Param("inicio") OffsetDateTime inicio,
            @Param("fin") OffsetDateTime fin,
            @Param("excluirId") String excluirId
    );

    @Query(value = """
            SELECT (p.nombre || ' ' || p.apellidos)
            FROM pacientes p WHERE p.id = :pacienteId
            """, nativeQuery = true)
    Optional<String> findPatientName(@Param("pacienteId") String pacienteId);

    long countByFechaHoraInicioBetweenAndEstadoCitaIn(
            OffsetDateTime inicio, OffsetDateTime fin, Collection<String> estados);

    List<CitaJpaEntity> findAllByFechaHoraInicioBetweenAndEstadoCitaInOrderByFechaHoraInicioAsc(
            OffsetDateTime inicio, OffsetDateTime fin, Collection<String> estados);

    Optional<CitaJpaEntity> findFirstByFechaHoraInicioBetweenAndEstadoCitaInOrderByFechaHoraInicioAsc(
            OffsetDateTime inicio, OffsetDateTime fin, Collection<String> estados);

    long countByFechaHoraInicioBetweenAndEstadoCitaInAndTerapeutaIdIn(
            OffsetDateTime inicio, OffsetDateTime fin, Collection<String> estados,
            Collection<String> terapeutaIds);

    List<CitaJpaEntity> findAllByFechaHoraInicioBetweenAndEstadoCitaInAndTerapeutaIdInOrderByFechaHoraInicioAsc(
            OffsetDateTime inicio, OffsetDateTime fin, Collection<String> estados,
            Collection<String> terapeutaIds);

    Optional<CitaJpaEntity> findFirstByFechaHoraInicioBetweenAndEstadoCitaInAndTerapeutaIdInOrderByFechaHoraInicioAsc(
            OffsetDateTime inicio, OffsetDateTime fin, Collection<String> estados,
            Collection<String> terapeutaIds);

    Optional<CitaJpaEntity> findFirstByPacienteIdAndFechaHoraInicioGreaterThanEqualOrderByFechaHoraInicioAsc(
            String pacienteId, OffsetDateTime desde);

    Optional<CitaJpaEntity> findFirstByPacienteIdOrderByFechaHoraInicioAsc(String pacienteId);

    @Query(value = """
            SELECT to_char((c.fecha_hora_inicio AT TIME ZONE 'America/Mexico_City')::date, 'YYYY-MM') AS mes,
                   COUNT(*) AS total
            FROM citas c
            JOIN pacientes p ON p.id = c.paciente_id
            WHERE c.fecha_hora_inicio >= :desde
              AND c.fecha_hora_inicio < :hasta
              AND (:sedeId IS NULL OR p.sede_id = :sedeId)
              AND (:protocoloId IS NULL OR p.protocolo_id = :protocoloId)
              AND (:modalidad IS NULL OR c.modalidad = :modalidad)
            GROUP BY mes
            ORDER BY mes
            """, nativeQuery = true)
    List<Object[]> agruparPorMesGlobal(@Param("desde") OffsetDateTime desde,
                                       @Param("hasta") OffsetDateTime hasta,
                                       @Param("sedeId") String sedeId,
                                       @Param("protocoloId") String protocoloId,
                                       @Param("modalidad") String modalidad);

    @Query(value = """
            SELECT to_char((c.fecha_hora_inicio AT TIME ZONE 'America/Mexico_City')::date, 'YYYY-MM') AS mes,
                   COUNT(*) AS total
            FROM citas c
            JOIN pacientes p ON p.id = c.paciente_id
            WHERE c.fecha_hora_inicio >= :desde
              AND c.fecha_hora_inicio < :hasta
              AND (:sedeId IS NULL OR p.sede_id = :sedeId)
              AND (:protocoloId IS NULL OR p.protocolo_id = :protocoloId)
              AND (:modalidad IS NULL OR c.modalidad = :modalidad)
              AND c.terapeuta_id IN (:terapeutaIds)
            GROUP BY mes
            ORDER BY mes
            """, nativeQuery = true)
    List<Object[]> agruparPorMesScoped(@Param("desde") OffsetDateTime desde,
                                       @Param("hasta") OffsetDateTime hasta,
                                       @Param("sedeId") String sedeId,
                                       @Param("protocoloId") String protocoloId,
                                       @Param("modalidad") String modalidad,
                                       @Param("terapeutaIds") Collection<String> terapeutaIds);

    @Query(value = """
            SELECT COUNT(*) FROM citas c
            JOIN pacientes p ON p.id = c.paciente_id
            WHERE c.fecha_hora_inicio >= :inicio
              AND c.fecha_hora_inicio < :fin
              AND c.estado_cita IN :estados
              AND (:sedeId IS NULL OR p.sede_id = :sedeId)
              AND (:protocoloId IS NULL OR p.protocolo_id = :protocoloId)
              AND (:modalidad IS NULL OR c.modalidad = :modalidad)
            """, nativeQuery = true)
    long countByDiaGlobal(@Param("inicio") OffsetDateTime inicio,
                          @Param("fin") OffsetDateTime fin,
                          @Param("estados") Collection<String> estados,
                          @Param("sedeId") String sedeId,
                          @Param("protocoloId") String protocoloId,
                          @Param("modalidad") String modalidad);

    @Query(value = """
            SELECT COUNT(*) FROM citas c
            JOIN pacientes p ON p.id = c.paciente_id
            WHERE c.fecha_hora_inicio >= :inicio
              AND c.fecha_hora_inicio < :fin
              AND c.estado_cita IN :estados
              AND (:sedeId IS NULL OR p.sede_id = :sedeId)
              AND (:protocoloId IS NULL OR p.protocolo_id = :protocoloId)
              AND (:modalidad IS NULL OR c.modalidad = :modalidad)
              AND c.terapeuta_id IN :terapeutaIds
            """, nativeQuery = true)
    long countByDiaScoped(@Param("inicio") OffsetDateTime inicio,
                          @Param("fin") OffsetDateTime fin,
                          @Param("estados") Collection<String> estados,
                          @Param("sedeId") String sedeId,
                          @Param("protocoloId") String protocoloId,
                          @Param("modalidad") String modalidad,
                          @Param("terapeutaIds") Collection<String> terapeutaIds);

    @Query(value = """
            SELECT c.id, c.paciente_id, c.terapeuta_id, c.expediente_id,
                   c.fecha_hora_inicio, c.fecha_hora_fin, c.tipo_cita, c.modalidad,
                   c.estado_cita, c.duracion_minutos, c.payment_status, c.consultorio,
                   c.bloqueada_por_normativa, c.created_at, c.updated_at
            FROM citas c
            JOIN pacientes p ON p.id = c.paciente_id
            WHERE c.fecha_hora_inicio >= :inicio
              AND c.fecha_hora_inicio < :fin
              AND c.estado_cita IN :estados
              AND (:sedeId IS NULL OR p.sede_id = :sedeId)
              AND (:protocoloId IS NULL OR p.protocolo_id = :protocoloId)
              AND (:modalidad IS NULL OR c.modalidad = :modalidad)
            ORDER BY c.fecha_hora_inicio
            """, nativeQuery = true)
    List<CitaJpaEntity> findByDiaGlobal(@Param("inicio") OffsetDateTime inicio,
                                        @Param("fin") OffsetDateTime fin,
                                        @Param("estados") Collection<String> estados,
                                        @Param("sedeId") String sedeId,
                                        @Param("protocoloId") String protocoloId,
                                        @Param("modalidad") String modalidad);

    @Query(value = """
            SELECT c.id, c.paciente_id, c.terapeuta_id, c.expediente_id,
                   c.fecha_hora_inicio, c.fecha_hora_fin, c.tipo_cita, c.modalidad,
                   c.estado_cita, c.duracion_minutos, c.payment_status, c.consultorio,
                   c.bloqueada_por_normativa, c.created_at, c.updated_at
            FROM citas c
            JOIN pacientes p ON p.id = c.paciente_id
            WHERE c.fecha_hora_inicio >= :inicio
              AND c.fecha_hora_inicio < :fin
              AND c.estado_cita IN :estados
              AND (:sedeId IS NULL OR p.sede_id = :sedeId)
              AND (:protocoloId IS NULL OR p.protocolo_id = :protocoloId)
              AND (:modalidad IS NULL OR c.modalidad = :modalidad)
              AND c.terapeuta_id IN :terapeutaIds
            ORDER BY c.fecha_hora_inicio
            """, nativeQuery = true)
    List<CitaJpaEntity> findByDiaScoped(@Param("inicio") OffsetDateTime inicio,
                                        @Param("fin") OffsetDateTime fin,
                                        @Param("estados") Collection<String> estados,
                                        @Param("sedeId") String sedeId,
                                        @Param("protocoloId") String protocoloId,
                                        @Param("modalidad") String modalidad,
                                        @Param("terapeutaIds") Collection<String> terapeutaIds);

    @Query(value = """
            SELECT c.id, c.paciente_id, c.terapeuta_id, c.expediente_id,
                   c.fecha_hora_inicio, c.fecha_hora_fin, c.tipo_cita, c.modalidad,
                   c.estado_cita, c.duracion_minutos, c.payment_status, c.consultorio,
                   c.bloqueada_por_normativa, c.created_at, c.updated_at
            FROM citas c
            JOIN pacientes p ON p.id = c.paciente_id
            WHERE c.fecha_hora_inicio >= :inicio
              AND c.fecha_hora_inicio < :fin
              AND c.estado_cita IN :estados
              AND (:sedeId IS NULL OR p.sede_id = :sedeId)
              AND (:protocoloId IS NULL OR p.protocolo_id = :protocoloId)
              AND (:modalidad IS NULL OR c.modalidad = :modalidad)
            ORDER BY c.fecha_hora_inicio
            LIMIT 1
            """, nativeQuery = true)
    Optional<CitaJpaEntity> findProximaDeHoyGlobal(@Param("inicio") OffsetDateTime inicio,
                                                   @Param("fin") OffsetDateTime fin,
                                                   @Param("estados") Collection<String> estados,
                                                   @Param("sedeId") String sedeId,
                                                   @Param("protocoloId") String protocoloId,
                                                   @Param("modalidad") String modalidad);

    @Query(value = """
            SELECT c.id, c.paciente_id, c.terapeuta_id, c.expediente_id,
                   c.fecha_hora_inicio, c.fecha_hora_fin, c.tipo_cita, c.modalidad,
                   c.estado_cita, c.duracion_minutos, c.payment_status, c.consultorio,
                   c.bloqueada_por_normativa, c.created_at, c.updated_at
            FROM citas c
            JOIN pacientes p ON p.id = c.paciente_id
            WHERE c.fecha_hora_inicio >= :inicio
              AND c.fecha_hora_inicio < :fin
              AND c.estado_cita IN :estados
              AND (:sedeId IS NULL OR p.sede_id = :sedeId)
              AND (:protocoloId IS NULL OR p.protocolo_id = :protocoloId)
              AND (:modalidad IS NULL OR c.modalidad = :modalidad)
              AND c.terapeuta_id IN :terapeutaIds
            ORDER BY c.fecha_hora_inicio
            LIMIT 1
            """, nativeQuery = true)
    Optional<CitaJpaEntity> findProximaDeHoyScoped(@Param("inicio") OffsetDateTime inicio,
                                                   @Param("fin") OffsetDateTime fin,
                                                   @Param("estados") Collection<String> estados,
                                                   @Param("sedeId") String sedeId,
                                                   @Param("protocoloId") String protocoloId,
                                                   @Param("modalidad") String modalidad,
                                                   @Param("terapeutaIds") Collection<String> terapeutaIds);
}
