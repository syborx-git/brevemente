package com.syborx.brevemente.paciente.application.ports.out;

import com.syborx.brevemente.paciente.domain.model.Paciente;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface PacienteRepositoryPort {
    List<Paciente> findAll();
    Optional<Paciente> findById(String id);
    Optional<Paciente> findByCurp(String curp);
    boolean existsByCurp(String curp);
    Paciente save(Paciente paciente);

    long countByStatus(String status, Collection<String> terapeutaIds);
    long countByRiskLevelIn(Collection<String> niveles, Collection<String> terapeutaIds);
    List<Paciente> findByRiskLevelIn(Collection<String> niveles, Collection<String> terapeutaIds);
    List<Paciente> findByStatus(String status, Collection<String> terapeutaIds);
    List<Paciente> findRecientes(int limit, Collection<String> terapeutaIds);
    long countConConsentimientoPendiente(Collection<String> terapeutaIds);
    List<Paciente> findConConsentimientoPendiente(Collection<String> terapeutaIds);
}
