package com.syborx.brevemente.dashboard.application.ports.in;

import com.syborx.brevemente.cita.domain.model.Cita;

import java.util.List;

public interface ListarCitasHoyDashboardUseCase {
    List<Cita> listarCitasHoy();
}
