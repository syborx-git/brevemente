package com.syborx.brevemente.dashboard.application.ports.in;

import com.syborx.brevemente.dashboard.domain.model.DashboardFiltros;
import com.syborx.brevemente.dashboard.domain.model.DistribucionFase;

import java.util.List;

public interface ListarDistribucionFasesUseCase {
    List<DistribucionFase> listarDistribucionFases(DashboardFiltros filtros);
}
