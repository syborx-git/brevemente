package com.syborx.brevemente.dashboard.domain.model;

import lombok.Builder;
import lombok.Value;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Acción operativa dominante del día: primera cita de hoy en estado
 * confirmada o pendiente, ordenada por hora ascendente (POJO puro, sin JPA).
 */
@Value
@Builder
public class AccionDominante {
    String citaId;
    String pacienteId;
    String pacienteNombre;
    String terapeutaNombre;
    LocalDate fecha;
    LocalTime hora;
    String tipoCita;
    String modalidad;
    Integer duracionMinutos;
    String consultorio;
    String protocolo;
    Boolean intakeListo;
    Boolean consentimientoFirmado;
    Boolean grabacionLeva;
}
