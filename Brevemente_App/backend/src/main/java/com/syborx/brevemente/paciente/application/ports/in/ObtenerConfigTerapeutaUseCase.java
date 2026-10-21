package com.syborx.brevemente.paciente.application.ports.in;

import com.syborx.brevemente.paciente.domain.model.TerapeutaConfig;

public interface ObtenerConfigTerapeutaUseCase {

    /**
     * Obtiene la configuración del terapeuta resolviendo la identidad
     * a partir del usuario autenticado (propio o supervisado).
     *
     * @param terapeutaIdExplicito terapeuta solicitado explícitamente (admin/supervisor).
     */
    TerapeutaConfig obtenerConfig(String terapeutaIdExplicito);
}
