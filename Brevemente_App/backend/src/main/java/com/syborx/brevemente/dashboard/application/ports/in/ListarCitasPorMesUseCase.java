package com.syborx.brevemente.dashboard.application.ports.in;

import com.syborx.brevemente.dashboard.domain.model.DashboardFiltros;
import com.syborx.brevemente.dashboard.domain.model.SerieMes;

import java.util.List;

public interface ListarCitasPorMesUseCase {
    List<SerieMes> listarCitasPorMes(DashboardFiltros filtros);
}
