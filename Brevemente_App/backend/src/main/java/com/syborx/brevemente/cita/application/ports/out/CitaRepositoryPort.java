package com.syborx.brevemente.cita.application.ports.out;

import com.syborx.brevemente.cita.domain.model.Cita;
import com.syborx.brevemente.cita.domain.model.CitaFiltro;
import com.syborx.brevemente.dashboard.domain.model.SerieMes;

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
    long countByDia(LocalDate dia, Collection<String> estados, Collection<String> terapeutaIds,
                    String sedeId, String protocoloId, String modalidad);
    List<Cita> findByDia(LocalDate dia, Collection<String> estados, Collection<String> terapeutaIds,
                         String sedeId, String protocoloId, String modalidad);
    Optional<Cita> findProximaDeHoy(LocalDate dia, Collection<String> estados, Collection<String> terapeutaIds,
                                    String sedeId, String protocoloId, String modalidad);

    /**
     * Serie mensual de citas (todas, sin filtrar por estado) agrupadas por mes
     * dentro del rango derivado de {@code periodo} (hoy | semana | mes).
     */
    List<SerieMes> agruparPorMes(Collection<String> terapeutaIds, String sedeId,
                                 String protocoloId, String modalidad, String periodo);

    /**
     * Próxima cita del paciente (preferentemente futura; si no hay, la más reciente).
     */
    Optional<Cita> findProximaPorPaciente(String pacienteId);
}
