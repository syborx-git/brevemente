package com.syborx.brevemente.plataforma.infrastructure.adapters.in.rest.dto;

import com.fasterxml.jackson.annotation.JsonValue;

/** Clave del indicador clínico global, serializada en minúsculas snake_case. */
public enum ClaveIndicadorClinico {
    EFECTIVIDAD_TBE("efectividad_tbe"),
    INDICE_FIDELIDAD("indice_fidelidad"),
    TASA_DESERCION("tasa_desercion");

    private final String valor;

    ClaveIndicadorClinico(String valor) {
        this.valor = valor;
    }

    @JsonValue
    public String getValor() {
        return valor;
    }

    public static ClaveIndicadorClinico fromValor(String valor) {
        for (ClaveIndicadorClinico c : values()) {
            if (c.valor.equals(valor)) {
                return c;
            }
        }
        return null;
    }
}
