package com.syborx.brevemente.dashboard.application.ports.out;

import java.util.List;

/**
 * Puerto de salida que expone la relación supervisor → terapeuta (tabla
 * {@code asignaciones_supervision}, migración V10) al módulo dashboard.
 */
public interface SupervisionAsignacionRepositoryPort {

    /**
     * Devuelve los IDs de los terapeutas asignados al supervisor indicado.
     *
     * @param supervisorUsuarioId ID de usuario del supervisor (claim {@code sub}).
     * @return lista de IDs de terapeuta (vacía si no tiene asignaciones).
     */
    List<String> findTerapeutasSupervisados(String supervisorUsuarioId);
}
