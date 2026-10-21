package com.syborx.brevemente.dashboard.domain.model;

import lombok.Builder;
import lombok.Value;

/**
 * Alerta operativa del centro de control (POJO puro, sin JPA).
 * Tres fuentes independientes: CONSENTIMIENTO, RIESGO y PENDIENTE_CLINICO.
 */
@Value
@Builder
public class AlertaDashboard {
    String id;
    String tipo;
    String titulo;
    String descripcion;
    String pacienteId;
    String pacienteNombre;
}
