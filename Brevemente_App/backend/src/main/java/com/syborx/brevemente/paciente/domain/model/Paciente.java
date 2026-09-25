package com.syborx.brevemente.paciente.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.Period;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Paciente {
    private String id;
    private String nombre;
    private String apellidos;
    private String curp;
    private LocalDate fechaNacimiento;
    private Integer edadCalculada;
    private String telefono;
    private String email;
    private String status;
    private String riskLevel;
    private String registryMode;
    private String sessionFrequency;
    private String quienCompletaRegistro;
    private String motivoConsulta;
    private String terapeutaId;
    private String terapeutaNombre;
    private CapacidadConsentimiento capacidadConsentimiento;
    private RepresentanteLegal representante;
    private Boolean consentimientoRepresentanteFirmado;
    private LocalDate fechaRegistro;

    public String getNombreCompleto() {
        if (nombre == null) return apellidos != null ? apellidos : "";
        if (apellidos == null || apellidos.isBlank()) return nombre.trim();
        return (nombre.trim() + " " + apellidos.trim()).trim();
    }

    public boolean esMenorDeEdad() {
        if (edadCalculada != null) {
            return edadCalculada < 18;
        }
        if (fechaNacimiento != null) {
            return Period.between(fechaNacimiento, LocalDate.now()).getYears() < 18;
        }
        return false;
    }
}
