package com.syborx.brevemente.portalpaciente.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

/**
 * Alerta de crisis/seguridad clínica vista desde el staff (incluye el nombre
 * del paciente, resuelto mediante JOIN con {@code pacientes}).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlertaStaff {

    private String id;
    private String pacienteId;
    private String pacienteNombre;
    private String tipo;           // crisis | seguridad_clinica | crisis_atendida
    private String estado;         // activa | resuelta
    private String mensaje;
    private String resueltaPor;
    private OffsetDateTime resueltaEn;
    private OffsetDateTime createdAt;
}
