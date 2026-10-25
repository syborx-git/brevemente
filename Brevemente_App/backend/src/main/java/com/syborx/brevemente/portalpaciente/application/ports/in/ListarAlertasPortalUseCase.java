package com.syborx.brevemente.portalpaciente.application.ports.in;

import com.syborx.brevemente.portalpaciente.domain.model.AlertaPaciente;

import java.util.List;

public interface ListarAlertasPortalUseCase {
    List<AlertaPaciente> listarAlertas();
}
