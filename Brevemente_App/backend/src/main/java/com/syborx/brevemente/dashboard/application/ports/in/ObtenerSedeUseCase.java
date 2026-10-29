package com.syborx.brevemente.dashboard.application.ports.in;

import com.syborx.brevemente.dashboard.domain.model.Sede;

import java.util.Optional;

public interface ObtenerSedeUseCase {
    Optional<Sede> obtenerSede(String sedeId);
}
