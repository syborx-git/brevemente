package com.syborx.brevemente.constancia.application.ports.out;

import com.syborx.brevemente.constancia.domain.model.ConstanciaFisica;

import java.util.List;
import java.util.Optional;

public interface ConstanciaRepositoryPort {
    List<ConstanciaFisica> findByPacienteId(String pacienteId);

    Optional<ConstanciaFisica> findById(String id);

    ConstanciaFisica save(ConstanciaFisica constancia);
}
