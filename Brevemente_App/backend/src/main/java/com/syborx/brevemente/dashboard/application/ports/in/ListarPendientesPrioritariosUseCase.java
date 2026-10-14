package com.syborx.brevemente.dashboard.application.ports.in;

import com.syborx.brevemente.dashboard.domain.model.DashboardFiltros;
import com.syborx.brevemente.dashboard.domain.model.PendientePrioritario;

import java.util.List;

public interface ListarPendientesPrioritariosUseCase {
    List<PendientePrioritario> listarPendientesPrioritarios(DashboardFiltros filtros);
}
