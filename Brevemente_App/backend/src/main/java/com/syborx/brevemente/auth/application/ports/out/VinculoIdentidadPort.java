package com.syborx.brevemente.auth.application.ports.out;

import java.util.List;

/**
 * Resuelve los vínculos de identidad (terapeutas/paciente) de un usuario,
 * para emitirlos como claims del JWT una sola vez en el login.
 */
public interface VinculoIdentidadPort {

    /** Ids de terapeutas sobre los que opera (terapeuta → su id; asistente → asignados). */
    List<String> findTerapeutaIdsByUsuarioId(String usuarioId);

    /** Id del paciente vinculado (solo rol patient) o {@code null}. */
    String findPacienteIdByUsuarioId(String usuarioId);
}
