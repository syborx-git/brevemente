package com.syborx.brevemente.paciente.application.ports.out;

import com.syborx.brevemente.paciente.domain.model.Paciente;

import java.util.List;
import java.util.Optional;

public interface PacienteRepositoryPort {
    List<Paciente> findAll();
    Optional<Paciente> findById(String id);
    Optional<Paciente> findByCurp(String curp);
    boolean existsByCurp(String curp);
    Paciente save(Paciente paciente);
}
