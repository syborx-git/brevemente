package com.syborx.brevemente.portalpaciente.application.ports.in;

import com.syborx.brevemente.portalpaciente.domain.model.AlertaPaciente;

public interface EscalarCrisisUseCase {
    AlertaPaciente escalar(String mensaje);
}
