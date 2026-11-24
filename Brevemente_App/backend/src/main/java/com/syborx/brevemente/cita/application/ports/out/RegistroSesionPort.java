package com.syborx.brevemente.cita.application.ports.out;

import com.syborx.brevemente.cita.domain.model.SesionIniciada;

import java.time.LocalDate;
import java.util.List;

/**
 * Puerto de salida para registrar una sesión clínica desde el contexto {@code cita}
 * sin acoplarse al caso de uso ni al dominio del contexto {@code expediente}.
 */
public interface RegistroSesionPort {
    SesionIniciada iniciar(String pacienteId, LocalDate fecha, String citaId,
                           String usuarioId, List<String> terapeutaIds);
}
