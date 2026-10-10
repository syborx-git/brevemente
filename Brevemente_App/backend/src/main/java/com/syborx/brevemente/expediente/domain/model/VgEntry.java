package com.syborx.brevemente.expediente.domain.model;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Valoración Global por sesión (JSONB {@code valoracion_global}), simétrica con
 * el tipo {@code VgEntry} del frontend. Señala las esferas trabajadas (YO/DEMÁS/MUNDO).
 */
@Schema(description = "Valoración Global (VG) registrada en una sesión")
public record VgEntry(
        Integer sessionNum,
        Boolean yo,
        Boolean demas,
        Boolean mundo
) {}
