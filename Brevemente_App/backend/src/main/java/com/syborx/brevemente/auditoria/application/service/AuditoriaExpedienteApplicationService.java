package com.syborx.brevemente.auditoria.application.service;

import com.syborx.brevemente.auditoria.application.ports.in.ListarAuditoriaExpedienteUseCase;
import com.syborx.brevemente.auditoria.application.ports.out.AuditoriaExpedientePort;
import com.syborx.brevemente.auditoria.domain.exception.PacienteNoEncontradoException;
import com.syborx.brevemente.auditoria.domain.model.AuditoriaExpediente;
import com.syborx.brevemente.paciente.infrastructure.adapters.out.persistence.repository.SpringDataPacienteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service("auditoriaExpedienteApplicationService")
@RequiredArgsConstructor
public class AuditoriaExpedienteApplicationService implements ListarAuditoriaExpedienteUseCase {

    private final AuditoriaExpedientePort auditoriaExpedientePort;
    private final SpringDataPacienteRepository pacienteRepository;

    @Override
    @Transactional(readOnly = true)
    public List<AuditoriaExpediente> listarPorPaciente(String pacienteId) {
        if (!pacienteRepository.existsById(pacienteId)) {
            throw new PacienteNoEncontradoException(pacienteId);
        }
        return auditoriaExpedientePort.listarPorPaciente(pacienteId);
    }
}
