package com.syborx.brevemente.expediente.application.ports.out;

import com.syborx.brevemente.expediente.domain.model.Expediente;

import java.util.Optional;

public interface ExpedienteRepositoryPort {
    Optional<Expediente> findByPacienteId(String pacienteId);

    Expediente save(Expediente expediente);
}
