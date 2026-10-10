package com.syborx.brevemente.auditoria.application.ports.in;

import com.syborx.brevemente.auditoria.domain.model.AuditoriaExpediente;

import java.util.List;

public interface ListarAuditoriaExpedienteUseCase {
    List<AuditoriaExpediente> listarPorPaciente(String pacienteId);
}
