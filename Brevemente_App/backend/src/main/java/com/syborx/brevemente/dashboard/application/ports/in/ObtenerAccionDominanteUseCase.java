package com.syborx.brevemente.dashboard.application.ports.in;

import com.syborx.brevemente.dashboard.domain.model.AccionDominante;
import com.syborx.brevemente.dashboard.domain.model.DashboardFiltros;

import java.util.Optional;

public interface ObtenerAccionDominanteUseCase {
    Optional<AccionDominante> obtenerAccionDominante(DashboardFiltros filtros);
}
