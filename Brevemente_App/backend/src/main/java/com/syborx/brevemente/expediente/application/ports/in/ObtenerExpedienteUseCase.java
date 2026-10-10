package com.syborx.brevemente.expediente.application.ports.in;

import com.syborx.brevemente.expediente.domain.model.Expediente;

public interface ObtenerExpedienteUseCase {
    Expediente obtenerPorPaciente(String pacienteId);
}
