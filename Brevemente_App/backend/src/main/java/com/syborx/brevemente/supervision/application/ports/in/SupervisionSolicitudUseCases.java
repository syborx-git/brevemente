package com.syborx.brevemente.supervision.application.ports.in;

import com.syborx.brevemente.supervision.domain.model.SupervisionSolicitud;

import java.util.List;

public interface SupervisionSolicitudUseCases {
    SupervisionSolicitud crear(String pacienteId, String motivo, String solicitanteId, List<String> terapeutaIds);

    List<SupervisionSolicitud> listarPorPaciente(String pacienteId, List<String> terapeutaIds, boolean esEvaluador);

    SupervisionSolicitud atender(String solicitudId, String atendidoPorId);
}
