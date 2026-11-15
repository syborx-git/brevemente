package com.syborx.brevemente.expediente.application.ports.out;

import java.util.List;

/**
 * Verifica que el usuario autenticado pueda acceder al expediente de un
 * paciente (anti-IDOR): admin → global; terapeuta/asistente → pacientes de sus
 * vínculos; supervisor → pacientes de sus supervisados.
 */
public interface PacienteAccesoPort {

    boolean puedeAcceder(String pacienteId, String usuarioSub, List<String> terapeutaIds, boolean esAdmin);
}
