package com.syborx.brevemente.supervision.application.service;

import com.syborx.brevemente.auditoria.application.ports.out.AuditoriaExpedientePort;
import com.syborx.brevemente.supervision.application.ports.in.SupervisionBitacoraUseCases;
import com.syborx.brevemente.supervision.application.ports.out.SupervisionBitacoraRepositoryPort;
import com.syborx.brevemente.supervision.domain.exception.BitacoraNotFoundException;
import com.syborx.brevemente.supervision.domain.model.SupervisionBitacora;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service("supervisionBitacoraApplicationService")
@RequiredArgsConstructor
public class SupervisionBitacoraApplicationService implements SupervisionBitacoraUseCases {

    private final SupervisionBitacoraRepositoryPort bitacoraRepositoryPort;
    private final AuditoriaExpedientePort auditoriaExpedientePort;

    @Override
    @Transactional(readOnly = true)
    public List<SupervisionBitacora> listarPorPaciente(String pacienteId, List<String> terapeutaIds, boolean esEvaluador) {
        List<SupervisionBitacora> todas = bitacoraRepositoryPort.findByPacienteId(pacienteId);
        if (esEvaluador) return todas;
        return todas.stream()
                .filter(b -> b.getTerapeutaId() != null && terapeutaIds.contains(b.getTerapeutaId()))
                .toList();
    }

    @Override
    @Transactional
    public SupervisionBitacora registrar(SupervisionBitacora bitacora) {
        if (bitacora.getId() == null || bitacora.getId().isBlank()) {
            bitacora.setId("sup-" + UUID.randomUUID().toString().substring(0, 8));
        }
        SupervisionBitacora saved = bitacoraRepositoryPort.save(bitacora);
        auditoriaExpedientePort.registrar(
                saved.getPacienteId(), null,
                "Bitácora de supervisión",
                "Se registró bitácora de supervisión (Sesión " + saved.getNumeroSesion() + ") por " + saved.getSupervisorNombre() + ".", "sesion");
        return saved;
    }

    @Override
    @Transactional
    public void eliminar(String bitacoraId, List<String> terapeutaIds, boolean esEvaluador) {
        SupervisionBitacora bitacora = bitacoraRepositoryPort.findById(bitacoraId)
                .orElseThrow(() -> new BitacoraNotFoundException(bitacoraId));
        if (!esEvaluador && (bitacora.getTerapeutaId() == null || !terapeutaIds.contains(bitacora.getTerapeutaId()))) {
            throw new BitacoraNotFoundException(bitacoraId);
        }
        bitacoraRepositoryPort.deleteById(bitacora.getId());
        auditoriaExpedientePort.registrar(
                bitacora.getPacienteId(), null,
                "Eliminación de bitácora de supervisión",
                "Se eliminó la bitácora de supervisión (Sesión " + bitacora.getNumeroSesion() + ").", "sesion");
    }
}
