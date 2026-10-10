package com.syborx.brevemente.constancia.application.service;

import com.syborx.brevemente.auditoria.application.ports.out.AuditoriaExpedientePort;
import com.syborx.brevemente.constancia.application.ports.in.ConstanciaUseCases;
import com.syborx.brevemente.constancia.application.ports.out.ConstanciaRepositoryPort;
import com.syborx.brevemente.constancia.domain.exception.ConstanciaNotFoundException;
import com.syborx.brevemente.constancia.domain.model.ConstanciaFisica;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service("constanciaApplicationService")
@RequiredArgsConstructor
public class ConstanciaApplicationService implements ConstanciaUseCases {

    private final ConstanciaRepositoryPort constanciaRepositoryPort;
    private final AuditoriaExpedientePort auditoriaExpedientePort;

    @Override
    @Transactional(readOnly = true)
    public List<ConstanciaFisica> listarPorPaciente(String pacienteId) {
        return constanciaRepositoryPort.findByPacienteId(pacienteId);
    }

    @Override
    @Transactional
    public ConstanciaFisica registrar(ConstanciaFisica constancia) {
        if (constancia.getId() == null || constancia.getId().isBlank()) {
            constancia.setId("con-fis-" + UUID.randomUUID().toString().substring(0, 8));
        }
        if (constancia.getEstado() == null || constancia.getEstado().isBlank()) {
            constancia.setEstado("entregada_en_fisico");
        }
        constancia.setRegistradoAt(OffsetDateTime.now());
        ConstanciaFisica saved = constanciaRepositoryPort.save(constancia);
        auditoriaExpedientePort.registrar(
                saved.getPacienteId(), saved.getRegistradoPorId(),
                "Registro de constancia física",
                "Constancia " + saved.getFolioFisico() + " emitida para el paciente.", "expediente");
        return saved;
    }

    @Override
    @Transactional
    public void anular(String constanciaId) {
        ConstanciaFisica constancia = constanciaRepositoryPort.findById(constanciaId)
                .orElseThrow(() -> new ConstanciaNotFoundException(constanciaId));
        constancia.setEstado("anulada");
        constanciaRepositoryPort.save(constancia);
        auditoriaExpedientePort.registrar(
                constancia.getPacienteId(), constancia.getRegistradoPorId(),
                "Anulación de constancia física",
                "Constancia " + constancia.getFolioFisico() + " anulada.", "expediente");
    }
}
