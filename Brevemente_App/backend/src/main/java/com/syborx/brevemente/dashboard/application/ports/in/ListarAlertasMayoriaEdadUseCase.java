package com.syborx.brevemente.dashboard.application.ports.in;

import com.syborx.brevemente.dashboard.domain.model.AlertaMayoriaEdad;

import java.util.List;

public interface ListarAlertasMayoriaEdadUseCase {
    List<AlertaMayoriaEdad> listarAlertasMayoriaEdad();
}
