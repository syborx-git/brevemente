package com.syborx.brevemente.paciente.domain.model;

import java.math.BigDecimal;

/**
 * Datos editables de la configuración del terapeuta
 * (los 5 campos configurables de `terapeutas` en V13).
 */
public record TerapeutaConfigDatos(
        String telefono,
        Integer duracionSesionDefaultMin,
        BigDecimal costoPrimeraSesion,
        BigDecimal costoSeguimiento,
        Integer edadMinimaAtencion
) {}
