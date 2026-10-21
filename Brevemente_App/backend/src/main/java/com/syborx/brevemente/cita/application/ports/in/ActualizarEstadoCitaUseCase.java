package com.syborx.brevemente.cita.application.ports.in;

import com.syborx.brevemente.cita.domain.model.Cita;

public interface ActualizarEstadoCitaUseCase {
    Cita actualizarEstado(String id, String estado);
}
