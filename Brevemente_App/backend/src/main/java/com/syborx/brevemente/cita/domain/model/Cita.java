package com.syborx.brevemente.cita.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

/**
 * Modelo de dominio puro para una cita clínica (sin anotaciones JPA/Spring).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Cita {

    private String id;
    private String pacienteId;
    private String pacienteNombre;     // denormalizado para la respuesta
    private String terapeutaId;
    private String expedienteId;
    private OffsetDateTime fechaHoraInicio;
    private OffsetDateTime fechaHoraFin;
    private String tipoCita;           // primera | seguimiento | cierre
    private String modalidad;          // PRESENCIAL | ONLINE
    private String estadoCita;         // 7 estados del contrato
    private Integer duracionMinutos;   // 30 | 45 | 60
    private String consultorio;        // A | B | null (null si ONLINE)
    private String paymentStatus;      // pagada | pendiente | exenta
    private boolean bloqueadaPorNormativa;
}
