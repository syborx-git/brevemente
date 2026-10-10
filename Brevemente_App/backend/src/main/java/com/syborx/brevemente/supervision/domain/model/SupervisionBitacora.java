package com.syborx.brevemente.supervision.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupervisionBitacora {
    private String id;
    private String pacienteId;
    private String pacienteNombre;
    private String terapeutaId;
    private String terapeutaNombre;
    private LocalDate fecha;
    private Integer numeroSesion;
    private String supervisorNombre;
    private String supervisorCedula;
    private String definicionProblema;
    private String situacionActual;
    private String spr;
    private String ts;
    private String problemaTerapeuta;
    private String rst;
    private String px;
    private String eff;
    private String duda;
    private String bloqueo;
    private String observaciones;
    private String recomendaciones;
    private OffsetDateTime createdAt;
}
