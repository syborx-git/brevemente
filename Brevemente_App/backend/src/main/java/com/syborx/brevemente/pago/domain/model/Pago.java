package com.syborx.brevemente.pago.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Pago {
    private String id;
    private String pacienteId;
    private String pacienteNombre;
    private String citaId;
    private String concepto;
    private BigDecimal monto;
    private LocalDate fecha;
    private String metodo;
    private String estado;
    private String notas;
    private String registradoPorId;
    private String registradoPorNombre;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
