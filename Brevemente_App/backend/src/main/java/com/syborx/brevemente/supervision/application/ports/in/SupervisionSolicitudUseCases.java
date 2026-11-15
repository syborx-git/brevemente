package com.syborx.brevemente.supervision.application.ports.in;

import com.syborx.brevemente.supervision.domain.model.SupervisionSolicitud;

import java.util.List;

public interface SupervisionSolicitudUseCases {
    SupervisionSolicitud crear(String pacienteId, String motivo, String solicitanteId, List<String> terapeutaIds);

    List<SupervisionSolicitud> listarPorPaciente(String pacienteId, List<String> terapeutaIds, boolean esEvaluador);

    List<SupervisionSolicitud> listarPendientes(List<String> terapeutaIds, String solicitanteId, boolean esEvaluador);

    SupervisionSolicitud atender(String solicitudId, String atendidoPorId);
}
