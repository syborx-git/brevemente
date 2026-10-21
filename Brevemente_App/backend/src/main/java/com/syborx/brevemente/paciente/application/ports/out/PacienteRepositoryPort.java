package com.syborx.brevemente.paciente.application.ports.out;

import com.syborx.brevemente.dashboard.domain.model.AlertaMayoriaEdad;
import com.syborx.brevemente.dashboard.domain.model.CasoProtocolo;
import com.syborx.brevemente.dashboard.domain.model.DistribucionFase;
import com.syborx.brevemente.paciente.domain.model.Paciente;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface PacienteRepositoryPort {
    List<Paciente> findAll();
    Optional<Paciente> findById(String id);
    Optional<Paciente> findByCurp(String curp);
    boolean existsByCurp(String curp);
    Paciente save(Paciente paciente);

    long countByStatus(String status, Collection<String> terapeutaIds, String sedeId, String protocoloId);
    long countByRiskLevelIn(Collection<String> niveles, Collection<String> terapeutaIds, String sedeId, String protocoloId);
    List<Paciente> findByRiskLevelIn(Collection<String> niveles, Collection<String> terapeutaIds, String sedeId, String protocoloId);
    List<Paciente> findByStatus(String status, Collection<String> terapeutaIds, String sedeId, String protocoloId);
    List<Paciente> findRecientes(int limit, Collection<String> terapeutaIds, String sedeId, String protocoloId);
    long countConConsentimientoPendiente(Collection<String> terapeutaIds, String sedeId, String protocoloId);
    List<Paciente> findConConsentimientoPendiente(Collection<String> terapeutaIds, String sedeId, String protocoloId);

    /**
     * Agrega pacientes por Fase TBE derivada (status + riskLevel). Devuelve solo los
     * grupos con casos; el servicio completa las 4 fases canónicas con cero.
     */
    List<DistribucionFase> agruparPorFase(Collection<String> terapeutaIds, String sedeId, String protocoloId);

    /**
     * Agrega pacientes por protocolo (JOIN a {@code protocolos}). Devuelve solo los
     * grupos con casos; el servicio completa el catálogo con cero.
     */
    List<CasoProtocolo> agruparPorProtocolo(Collection<String> terapeutaIds, String sedeId, String protocoloId);

    /**
     * Pacientes {@code REPRESENTADO_POR_EDAD} nacidos en o antes de {@code corteNacimiento}
     * (= hoy - 18 años). No filtrado por rol (paridad con la demo).
     */
    List<AlertaMayoriaEdad> findMayoriaEdad(LocalDate corteNacimiento);
}
