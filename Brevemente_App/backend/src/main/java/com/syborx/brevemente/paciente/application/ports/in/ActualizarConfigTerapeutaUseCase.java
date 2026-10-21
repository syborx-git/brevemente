package com.syborx.brevemente.paciente.application.ports.in;

import com.syborx.brevemente.paciente.domain.model.TerapeutaConfig;
import com.syborx.brevemente.paciente.domain.model.TerapeutaConfigDatos;

public interface ActualizarConfigTerapeutaUseCase {

    /**
     * Actualiza la configuración del terapeuta. Solo el propio terapeuta
     * (o un administrador) puede editar.
     */
    TerapeutaConfig actualizarConfig(String terapeutaIdExplicito, TerapeutaConfigDatos datos);
}
