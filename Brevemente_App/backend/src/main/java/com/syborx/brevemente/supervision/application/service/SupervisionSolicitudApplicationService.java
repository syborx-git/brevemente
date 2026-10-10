package com.syborx.brevemente.supervision.application.service;

import com.syborx.brevemente.auditoria.application.ports.out.AuditoriaExpedientePort;
import com.syborx.brevemente.supervision.application.ports.in.SupervisionSolicitudUseCases;
import com.syborx.brevemente.supervision.application.ports.out.SupervisionSolicitudRepositoryPort;
import com.syborx.brevemente.supervision.domain.exception.SolicitudNotFoundException;
import com.syborx.brevemente.supervision.domain.model.SupervisionSolicitud;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service("supervisionSolicitudApplicationService")
@RequiredArgsConstructor
public class SupervisionSolicitudApplicationService implements SupervisionSolicitudUseCases {

    private final SupervisionSolicitudRepositoryPort solicitudRepositoryPort;
    private final AuditoriaExpedientePort auditoriaExpedientePort;

    @Override
    @Transactional
    public SupervisionSolicitud crear(String pacienteId, String motivo, String solicitanteId, List<String> terapeutaIds) {
        SupervisionSolicitud solicitud = SupervisionSolicitud.builder()
                .id("sup-req-" + UUID.randomUUID().toString().substring(0, 8))
                .pacienteId(pacienteId)
                .solicitanteId(solicitanteId)
                .terapeutaId(terapeutaIds != null && !terapeutaIds.isEmpty() ? terapeutaIds.get(0) : null)
                .motivo(motivo)
                .estado("pendiente")
                .build();
        SupervisionSolicitud saved = solicitudRepositoryPort.save(solicitud);
        auditoriaExpedientePort.registrar(
                saved.getPacienteId(), solicitanteId,
                "Solicitud de supervisión",
                "Solicitud de supervisión clínica generada.", "sesion");
        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public List<SupervisionSolicitud> listarPorPaciente(String pacienteId, List<String> terapeutaIds, boolean esEvaluador) {
        List<SupervisionSolicitud> todas = solicitudRepositoryPort.findByPacienteId(pacienteId);
        if (esEvaluador) return todas;
        return todas.stream()
                .filter(s -> s.getTerapeutaId() != null && terapeutaIds.contains(s.getTerapeutaId()))
                .toList();
    }

    @Override
    @Transactional
    public SupervisionSolicitud atender(String solicitudId, String atendidoPorId) {
        SupervisionSolicitud solicitud = solicitudRepositoryPort.findById(solicitudId)
                .orElseThrow(() -> new SolicitudNotFoundException(solicitudId));
        solicitud.setEstado("atendida");
        solicitud.setAtendidoPorId(atendidoPorId);
        solicitud.setAtendidoAt(OffsetDateTime.now());
        SupervisionSolicitud saved = solicitudRepositoryPort.save(solicitud);
        auditoriaExpedientePort.registrar(
                saved.getPacienteId(), atendidoPorId,
                "Supervisión atendida",
                "La solicitud de supervisión fue atendida.", "sesion");
        return saved;
    }
}
