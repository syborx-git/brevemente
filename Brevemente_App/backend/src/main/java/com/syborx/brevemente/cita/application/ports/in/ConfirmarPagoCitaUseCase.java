package com.syborx.brevemente.cita.application.ports.in;

import com.syborx.brevemente.cita.domain.model.Cita;

public interface ConfirmarPagoCitaUseCase {
    Cita confirmarPago(String citaId);
}
