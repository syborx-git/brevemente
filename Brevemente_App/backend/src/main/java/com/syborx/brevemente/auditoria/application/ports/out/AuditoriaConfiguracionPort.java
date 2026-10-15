package com.syborx.brevemente.auditoria.application.ports.out;

import com.syborx.brevemente.auditoria.domain.model.AuditoriaConfiguracion;

import java.util.List;

public interface AuditoriaConfiguracionPort {

    /**
     * Registra un cambio de configuración del terapeuta. Debe ejecutarse en
     * transacción {@code REQUIRES_NEW} para sobrevivir rollbacks del caso de uso.
     */
    void registrar(String terapeutaId, String campo, String valorAnterior, String valorNuevo, String usuarioId);

    List<AuditoriaConfiguracion> listarPorTerapeuta(String terapeutaId);
}
