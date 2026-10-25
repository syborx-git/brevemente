package com.syborx.brevemente.portalpaciente.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

/**
 * Contra-referencia de un paciente entre terapeutas (push visible en el portal).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContraReferencia {

    private String id;
    private String pacienteId;
    private String terapeutaOrigenId;
    private String terapeutaDestinoId;
    private String motivo;
    private String resumen;
    private String estado;         // pendiente | aprobada | rechazada
    private OffsetDateTime createdAt;
    private OffsetDateTime resolvedAt;

    // Denormalizados para la respuesta del portal.
    private String fromTherapistName;
    private String toTherapistName;
}
