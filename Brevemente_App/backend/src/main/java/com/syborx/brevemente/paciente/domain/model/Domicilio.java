package com.syborx.brevemente.paciente.domain.model;

/**
 * Domicilio estructurado del paciente (Datos Generales, GAP-HC-07).
 */
public record Domicilio(
        String calleNumero,
        String colonia,
        String codigoPostal,
        String municipio,
        String estadoDomicilio,
        String telefonoCasa,
        String telefonoCelular,
        String telefonoTrabajo
) {}
