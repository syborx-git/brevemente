package com.syborx.brevemente.pago.application.service;

import com.syborx.brevemente.auditoria.application.ports.out.AuditoriaExpedientePort;
import com.syborx.brevemente.pago.application.ports.in.PagoUseCases;
import com.syborx.brevemente.pago.application.ports.out.PagoRepositoryPort;
import com.syborx.brevemente.pago.domain.exception.PagoInvalidoException;
import com.syborx.brevemente.pago.domain.exception.PagoNotFoundException;
import com.syborx.brevemente.pago.domain.model.Pago;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service("pagoApplicationService")
@RequiredArgsConstructor
public class PagoApplicationService implements PagoUseCases {

    private static final Set<String> ESTADOS = Set.of("pagado", "pendiente", "parcial", "reembolsado");

    private final PagoRepositoryPort pagoRepositoryPort;
    private final AuditoriaExpedientePort auditoriaExpedientePort;

    @Override
    @Transactional(readOnly = true)
    public List<Pago> listarPorPaciente(String pacienteId) {
        return pagoRepositoryPort.findByPacienteId(pacienteId);
    }

    @Override
    @Transactional
    public Pago registrar(Pago pago) {
        if (pago.getConcepto() == null || pago.getConcepto().isBlank()) {
            throw new PagoInvalidoException("El concepto del pago es obligatorio.");
        }
        if (pago.getMonto() == null || pago.getMonto().signum() < 0) {
            throw new PagoInvalidoException("El monto debe ser mayor o igual a 0.");
        }
        if (pago.getId() == null || pago.getId().isBlank()) {
            pago.setId("pay-" + UUID.randomUUID().toString().substring(0, 8));
        }
        if (pago.getEstado() == null || pago.getEstado().isBlank()) {
            pago.setEstado("pendiente");
        }
        Pago saved = pagoRepositoryPort.save(pago);
        auditoriaExpedientePort.registrar(
                saved.getPacienteId(), saved.getRegistradoPorId(),
                "Registro de pago",
                "Pago \"" + saved.getConcepto() + "\" por $" + saved.getMonto() + " MXN (" + saved.getEstado() + ").", "pagos");
        return saved;
    }

    @Override
    @Transactional
    public Pago cambiarEstado(String pagoId, String estado) {
        if (estado == null || !ESTADOS.contains(estado)) {
            throw new PagoInvalidoException("Estado de pago inválido: " + estado);
        }
        Pago pago = pagoRepositoryPort.findById(pagoId)
                .orElseThrow(() -> new PagoNotFoundException(pagoId));
        pago.setEstado(estado);
        Pago saved = pagoRepositoryPort.save(pago);
        auditoriaExpedientePort.registrar(
                saved.getPacienteId(), saved.getRegistradoPorId(),
                "Cambio de estado de pago",
                "Pago \"" + saved.getConcepto() + "\" ahora en estado " + saved.getEstado() + ".", "pagos");
        return saved;
    }

    @Override
    @Transactional
    public void eliminar(String pagoId) {
        Pago pago = pagoRepositoryPort.findById(pagoId)
                .orElseThrow(() -> new PagoNotFoundException(pagoId));
        pagoRepositoryPort.deleteById(pago.getId());
        auditoriaExpedientePort.registrar(
                pago.getPacienteId(), pago.getRegistradoPorId(),
                "Eliminación de pago",
                "Pago \"" + pago.getConcepto() + "\" eliminado.", "pagos");
    }
}
