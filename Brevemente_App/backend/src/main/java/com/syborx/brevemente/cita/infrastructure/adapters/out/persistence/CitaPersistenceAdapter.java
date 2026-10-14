package com.syborx.brevemente.cita.infrastructure.adapters.out.persistence;

import com.syborx.brevemente.cita.application.ports.out.CitaRepositoryPort;
import com.syborx.brevemente.cita.domain.model.Cita;
import com.syborx.brevemente.cita.domain.model.CitaFiltro;
import com.syborx.brevemente.cita.infrastructure.adapters.out.persistence.entity.CitaJpaEntity;
import com.syborx.brevemente.cita.infrastructure.adapters.out.persistence.mapper.CitaPersistenceMapper;
import com.syborx.brevemente.cita.infrastructure.adapters.out.persistence.repository.SpringDataCitaRepository;
import com.syborx.brevemente.dashboard.domain.model.SerieMes;
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

    private static final ZoneId ZONA = ZoneId.of("America/Mexico_City");

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
    public long countByDia(LocalDate dia, Collection<String> estados, Collection<String> terapeutaIds,
                           String sedeId, String protocoloId, String modalidad) {
        if (terapeutaIds != null && terapeutaIds.isEmpty()) {
            return 0;
        }
        OffsetDateTime[] rango = rangoDia(dia);
        return terapeutaIds == null
                ? springDataCitaRepository.countByDiaGlobal(rango[0], rango[1], estados, sedeId, protocoloId, modalidad)
                : springDataCitaRepository.countByDiaScoped(rango[0], rango[1], estados, sedeId, protocoloId, modalidad, terapeutaIds);
    }

    @Override
    public List<Cita> findByDia(LocalDate dia, Collection<String> estados, Collection<String> terapeutaIds,
                                String sedeId, String protocoloId, String modalidad) {
        if (terapeutaIds != null && terapeutaIds.isEmpty()) {
            return List.of();
        }
        OffsetDateTime[] rango = rangoDia(dia);
        List<CitaJpaEntity> entities = terapeutaIds == null
                ? springDataCitaRepository.findByDiaGlobal(rango[0], rango[1], estados, sedeId, protocoloId, modalidad)
                : springDataCitaRepository.findByDiaScoped(rango[0], rango[1], estados, sedeId, protocoloId, modalidad, terapeutaIds);
        return entities.stream()
                .map(e -> citaPersistenceMapper.toDomain(e, resolvePatientName(e)))
                .toList();
    }

    @Override
    public Optional<Cita> findProximaDeHoy(LocalDate dia, Collection<String> estados,
                                           Collection<String> terapeutaIds,
                                           String sedeId, String protocoloId, String modalidad) {
        if (terapeutaIds != null && terapeutaIds.isEmpty()) {
            return Optional.empty();
        }
        OffsetDateTime[] rango = rangoDia(dia);
        Optional<CitaJpaEntity> entity = terapeutaIds == null
                ? springDataCitaRepository.findProximaDeHoyGlobal(rango[0], rango[1], estados, sedeId, protocoloId, modalidad)
                : springDataCitaRepository.findProximaDeHoyScoped(rango[0], rango[1], estados, sedeId, protocoloId, modalidad, terapeutaIds);
        return entity.map(e -> citaPersistenceMapper.toDomain(e, resolvePatientName(e)));
    }

    @Override
    public List<SerieMes> agruparPorMes(Collection<String> terapeutaIds, String sedeId,
                                        String protocoloId, String modalidad, String periodo) {
        if (terapeutaIds != null && terapeutaIds.isEmpty()) {
            return List.of();
        }
        OffsetDateTime[] rango = rangoPeriodo(periodo);
        List<Object[]> filas = terapeutaIds == null
                ? springDataCitaRepository.agruparPorMesGlobal(rango[0], rango[1], sedeId, protocoloId, modalidad)
                : springDataCitaRepository.agruparPorMesScoped(rango[0], rango[1], sedeId, protocoloId, modalidad, terapeutaIds);
        return filas.stream()
                .map(f -> new SerieMes(SerieMes.monthLabel((String) f[0]), ((Number) f[1]).longValue()))
                .toList();
    }

    @Override
    public Optional<Cita> findProximaPorPaciente(String pacienteId) {
        if (pacienteId == null || pacienteId.isBlank()) {
            return Optional.empty();
        }
        OffsetDateTime ahora = OffsetDateTime.now(ZONA);
        return springDataCitaRepository
                .findFirstByPacienteIdAndFechaHoraInicioGreaterThanEqualOrderByFechaHoraInicioAsc(pacienteId, ahora)
                .or(() -> springDataCitaRepository.findFirstByPacienteIdOrderByFechaHoraInicioAsc(pacienteId))
                .map(e -> citaPersistenceMapper.toDomain(e, resolvePatientName(e)));
    }

    /**
     * Rango de fechas según {@code periodo}: {@code hoy} = día actual; {@code semana} =
     * últimos 7 días; {@code mes} (default) = ventana de 3 meses (actual + 2 previos).
     */
    private OffsetDateTime[] rangoPeriodo(String periodo) {
        OffsetDateTime hoy = LocalDate.now(ZONA).atStartOfDay(ZONA).toOffsetDateTime();
        if ("hoy".equalsIgnoreCase(periodo)) {
            return new OffsetDateTime[]{hoy, hoy.plusDays(1)};
        }
        if ("semana".equalsIgnoreCase(periodo)) {
            return new OffsetDateTime[]{hoy.minusDays(6), hoy.plusDays(1)};
        }
        OffsetDateTime inicio = hoy.withDayOfMonth(1).minusMonths(2);
        OffsetDateTime fin = hoy.withDayOfMonth(1).plusMonths(1);
        return new OffsetDateTime[]{inicio, fin};
    }

    private OffsetDateTime[] rangoDia(LocalDate dia) {
        OffsetDateTime inicio = dia.atStartOfDay(ZONA).toOffsetDateTime();
        OffsetDateTime fin = dia.plusDays(1).atStartOfDay(ZONA).toOffsetDateTime();
        return new OffsetDateTime[]{inicio, fin};
    }

    private String resolvePatientName(CitaJpaEntity entity) {
        if (entity.getPacienteId() == null) {
            return null;
        }
        return springDataCitaRepository.findPatientName(entity.getPacienteId()).orElse(null);
    }
}
