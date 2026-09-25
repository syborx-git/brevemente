package com.syborx.brevemente.paciente.domain.model;

public record RepresentanteLegal(
        String nombreCompleto,
        String parentesco,
        String telefono,
        String correo,
        Object documentoIdentificacion,
        Object documentoVinculo,
        String otroProgenitorInformado
) {}
