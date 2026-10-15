package com.syborx.brevemente.paciente.application.ports.out;

import java.util.List;

/**
 * Puerto de salida que expone la relación supervisor → terapeuta
 * (tabla {@code asignaciones_supervision}, migración V10) al módulo paciente.
 */
public interface SupervisionScopePort {

    /**
     * Devuelve los IDs de los terapeutas supervisados por el usuario indicado.
     *
     * @param supervisorUsuarioId ID de usuario del supervisor (claim {@code sub}).
     */
    List<String> terapeutasSupervisados(String supervisorUsuarioId);
}
