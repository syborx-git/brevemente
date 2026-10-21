package com.syborx.brevemente.supervision.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupervisionSolicitud {
    private String id;
    private String pacienteId;
    private String pacienteNombre;
    private String solicitanteId;
    private String terapeutaId;
    private String terapeutaNombre;
    private String motivo;
    private String estado;
    private OffsetDateTime createdAt;
    private String atendidoPorId;
    private OffsetDateTime atendidoAt;
}
