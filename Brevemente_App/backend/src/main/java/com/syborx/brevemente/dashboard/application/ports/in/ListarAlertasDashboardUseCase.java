package com.syborx.brevemente.dashboard.application.ports.in;

import com.syborx.brevemente.dashboard.domain.model.AlertaDashboard;
import com.syborx.brevemente.dashboard.domain.model.DashboardFiltros;

import java.util.List;

public interface ListarAlertasDashboardUseCase {
    List<AlertaDashboard> listarAlertas(DashboardFiltros filtros);
}
