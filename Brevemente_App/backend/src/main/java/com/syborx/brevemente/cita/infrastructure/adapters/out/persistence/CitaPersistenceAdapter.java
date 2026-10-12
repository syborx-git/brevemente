package com.syborx.brevemente.cita.infrastructure.adapters.out.persistence;

import com.syborx.brevemente.cita.application.ports.out.CitaRepositoryPort;
import com.syborx.brevemente.cita.domain.model.Cita;
import com.syborx.brevemente.cita.domain.model.CitaFiltro;
import com.syborx.brevemente.cita.infrastructure.adapters.out.persistence.entity.CitaJpaEntity;
import com.syborx.brevemente.cita.infrastructure.adapters.out.persistence.mapper.CitaPersistenceMapper;
import com.syborx.brevemente.cita.infrastructure.adapters.out.persistence.repository.SpringDataCitaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class CitaPersistenceAdapter implements CitaRepositoryPort {

    private final SpringDataCitaRepository springDataCitaRepository;
    private final CitaPersistenceMapper citaPersistenceMapper;

    @Override
    public List<Cita> findAll(CitaFiltro filtro) {
        String terapeutaId = filtro != null ? filtro.terapeutaId() : null;
        String pacienteId = filtro != null ? filtro.pacienteId() : null;
        String consultorio = filtro != null ? filtro.consultorio() : null;
        String modalidad = filtro != null ? filtro.modalidad() : null;
        String estado = filtro != null ? filtro.estado() : null;
        var desde = filtro != null ? filtro.desde() : null;
        var hasta = filtro != null ? filtro.hasta() : null;

        return springDataCitaRepository
                .findAllByFilters(terapeutaId, pacienteId, consultorio, modalidad, estado, desde, hasta)
                .stream()
                .map(e -> citaPersistenceMapper.toDomain(e, resolvePatientName(e)))
                .toList();
    }

    @Override
    public Optional<Cita> findById(String id) {
        return springDataCitaRepository.findById(id)
                .map(e -> citaPersistenceMapper.toDomain(e, resolvePatientName(e)));
    }

    @Override
    public Cita save(Cita cita) {
        CitaJpaEntity jpa = citaPersistenceMapper.toJpaEntity(cita);
        CitaJpaEntity saved = springDataCitaRepository.save(jpa);
        return citaPersistenceMapper.toDomain(saved, resolvePatientName(saved));
    }

    @Override
    public boolean existeSolapamiento(String terapeutaId, String pacienteId,
                                      OffsetDateTime inicio, OffsetDateTime fin, String excluirId) {
        return springDataCitaRepository.countOverlap(terapeutaId, pacienteId, inicio, fin, excluirId) > 0;
    }

    @Override
    public long countByDia(LocalDate dia, Collection<String> estados, Collection<String> terapeutaIds) {
        if (terapeutaIds != null && terapeutaIds.isEmpty()) {
            return 0;
        }
        OffsetDateTime[] rango = rangoDia(dia);
        return terapeutaIds == null
                ? springDataCitaRepository.countByFechaHoraInicioBetweenAndEstadoCitaIn(rango[0], rango[1], estados)
                : springDataCitaRepository.countByFechaHoraInicioBetweenAndEstadoCitaInAndTerapeutaIdIn(
                        rango[0], rango[1], estados, terapeutaIds);
    }

    @Override
    public List<Cita> findByDia(LocalDate dia, Collection<String> estados, Collection<String> terapeutaIds) {
        if (terapeutaIds != null && terapeutaIds.isEmpty()) {
            return List.of();
        }
        OffsetDateTime[] rango = rangoDia(dia);
        List<CitaJpaEntity> entities = terapeutaIds == null
                ? springDataCitaRepository
                        .findAllByFechaHoraInicioBetweenAndEstadoCitaInOrderByFechaHoraInicioAsc(
                                rango[0], rango[1], estados)
                : springDataCitaRepository
                        .findAllByFechaHoraInicioBetweenAndEstadoCitaInAndTerapeutaIdInOrderByFechaHoraInicioAsc(
                                rango[0], rango[1], estados, terapeutaIds);
        return entities.stream()
                .map(e -> citaPersistenceMapper.toDomain(e, resolvePatientName(e)))
                .toList();
    }

    @Override
    public Optional<Cita> findProximaDeHoy(LocalDate dia, Collection<String> estados,
                                           Collection<String> terapeutaIds) {
        if (terapeutaIds != null && terapeutaIds.isEmpty()) {
            return Optional.empty();
        }
        OffsetDateTime[] rango = rangoDia(dia);
        Optional<CitaJpaEntity> entity = terapeutaIds == null
                ? springDataCitaRepository
                        .findFirstByFechaHoraInicioBetweenAndEstadoCitaInOrderByFechaHoraInicioAsc(
                                rango[0], rango[1], estados)
                : springDataCitaRepository
                        .findFirstByFechaHoraInicioBetweenAndEstadoCitaInAndTerapeutaIdInOrderByFechaHoraInicioAsc(
                                rango[0], rango[1], estados, terapeutaIds);
        return entity.map(e -> citaPersistenceMapper.toDomain(e, resolvePatientName(e)));
    }

    private OffsetDateTime[] rangoDia(LocalDate dia) {
        ZoneId zona = ZoneId.of("America/Mexico_City");
        OffsetDateTime inicio = dia.atStartOfDay(zona).toOffsetDateTime();
        OffsetDateTime fin = dia.plusDays(1).atStartOfDay(zona).toOffsetDateTime();
        return new OffsetDateTime[]{inicio, fin};
    }

    private String resolvePatientName(CitaJpaEntity entity) {
        if (entity.getPacienteId() == null) {
            return null;
        }
        return springDataCitaRepository.findPatientName(entity.getPacienteId()).orElse(null);
    }
}
