package com.syborx.brevemente.expediente.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Sesion {
    private String id;
    private String expedienteId;
    private String pacienteId;
    private Integer numero;
    private LocalDate fecha;
    private String fase;
    private String protocolo;
    private String dxOperativo;
    private String trastorno;
    private List<String> px;
    private String f1;
    private String f2;
    private String oss;
    private String adherencia;
    private String cumplimiento;
    private String rss;
    private String eff;
    private String notas;
    private String observacionesProximaSesion;
    private String situacion;
    private String duracionAudio;
    private String status;
    private String creadoPorId;
    private VcEntry valoracionCambio;
    private VgEntry valoracionGlobal;
}
