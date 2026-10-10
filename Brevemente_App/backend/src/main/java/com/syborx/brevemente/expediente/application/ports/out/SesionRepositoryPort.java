package com.syborx.brevemente.expediente.application.ports.out;

import com.syborx.brevemente.expediente.domain.model.Sesion;

import java.util.List;
import java.util.Optional;

public interface SesionRepositoryPort {
    List<Sesion> findByExpedienteId(String expedienteId);
    Sesion save(Sesion sesion);
    Optional<Integer> ultimoNumero(String expedienteId);
}
