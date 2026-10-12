package com.syborx.brevemente.cita.application.ports.out;

import com.syborx.brevemente.cita.domain.model.Cita;
import com.syborx.brevemente.cita.domain.model.CitaFiltro;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface CitaRepositoryPort {
    List<Cita> findAll(CitaFiltro filtro);
    Optional<Cita> findById(String id);
    Cita save(Cita cita);
    boolean existeSolapamiento(String terapeutaId, String pacienteId,
                               OffsetDateTime inicio, OffsetDateTime fin, String excluirId);
    long countByDia(LocalDate dia, Collection<String> estados, Collection<String> terapeutaIds);
    List<Cita> findByDia(LocalDate dia, Collection<String> estados, Collection<String> terapeutaIds);
    Optional<Cita> findProximaDeHoy(LocalDate dia, Collection<String> estados, Collection<String> terapeutaIds);
}
