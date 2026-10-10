package com.syborx.brevemente.expediente.domain.model;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Valoración del Cambio por sesión (JSONB {@code valoracion_cambio}), simétrica
 * con el tipo {@code VcEntry} del frontend. Los criterios usan la escala literal
 * de la demo: "Marcador de inicio", "Sin cambios", "Mejoría leve",
 * "Mejoría significativa", "Nuevo patrón", "Empeoramiento", "Recaída".
 */
@Schema(description = "Valoración del Cambio (VC) registrada en una sesión")
public record VcEntry(
        Integer sessionNum,
        String percepcion,
        String pensamientos,
        String sensaciones,
        String reacciones,
        String sintomas,
        String crisis
) {}
