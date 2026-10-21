package com.syborx.brevemente.auditoria.application.ports.out;

import com.syborx.brevemente.auditoria.domain.model.AuditoriaExpediente;

import java.util.List;

public interface AuditoriaExpedientePort {

    /**
     * Registra una traza clínica inmutable. Debe ejecutarse en transacción
     * {@code REQUIRES_NEW} para sobrevivir rollbacks del caso de uso que la origina.
     */
    void registrar(String pacienteId, String usuarioId, String accion, String detalle, String categoria);

    List<AuditoriaExpediente> listarPorPaciente(String pacienteId);
}
