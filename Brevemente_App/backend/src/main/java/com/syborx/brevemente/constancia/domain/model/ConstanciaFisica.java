package com.syborx.brevemente.constancia.domain.model;

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
public class ConstanciaFisica {
    private String id;
    private String pacienteId;
    private String pacienteNombre;
    private String folioFisico;
    private LocalDate fechaExpedicion;
    private String tipo;
    private String emisorNombre;
    private String emisorCedula;
    private String destinatario;
    private String motivo;
    private String periodoCubierto;
    private Integer numSesiones;
    private String resumenClinico;
    private String urlEscaneo;
    private String nombreArchivoEscaneo;
    private String entregadoA;
    private String estado;
    private String registradoPorId;
    private String registradoPorNombre;
    private OffsetDateTime registradoAt;
    private OffsetDateTime createdAt;
}
