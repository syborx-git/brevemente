package com.syborx.brevemente.dashboard.application.ports.in;

import com.syborx.brevemente.dashboard.domain.model.CasoProtocolo;
import com.syborx.brevemente.dashboard.domain.model.DashboardFiltros;

import java.util.List;

public interface ListarCasosPorProtocoloUseCase {
    List<CasoProtocolo> listarCasosPorProtocolo(DashboardFiltros filtros);
}
