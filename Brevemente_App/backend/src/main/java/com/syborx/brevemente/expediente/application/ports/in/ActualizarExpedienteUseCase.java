package com.syborx.brevemente.expediente.application.ports.in;

import com.syborx.brevemente.expediente.domain.model.Expediente;

public interface ActualizarExpedienteUseCase {

    /**
     * Fusiona los campos editables (DX + psiquiatría) del parcial sobre el expediente
     * existente y lo persiste, devolviendo el expediente enriquecido (joins).
     */
    Expediente actualizar(String pacienteId, Expediente datosParciales, String usuarioId);
}
