package com.syborx.brevemente.portalpaciente.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

/**
 * Alerta dirigida al paciente (crisis escalada, seguridad clínica, crisis atendida).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlertaPaciente {

    private String id;
    private String pacienteId;
    private String tipo;           // crisis | seguridad_clinica | crisis_atendida
    private String mensaje;
    private String estado;         // activa | resuelta
    private String resueltaPor;
    private OffsetDateTime resueltaEn;
    private OffsetDateTime createdAt;
}
