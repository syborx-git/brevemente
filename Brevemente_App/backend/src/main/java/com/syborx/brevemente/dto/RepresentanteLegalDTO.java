package com.syborx.brevemente.dto;

public record RepresentanteLegalDTO(
    String nombreCompleto,
    String parentesco,
    String telefono,
    String correo,
    Object documentoIdentificacion,
    Object documentoVinculo,
    String otroProgenitorInformado
) {}
