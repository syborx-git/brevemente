package com.syborx.brevemente.plataforma.infrastructure.adapters.in.rest.dto;

import com.fasterxml.jackson.annotation.JsonValue;

/** Estado de un módulo de la plataforma. */
public enum EstadoModulo {
    OK("ok"),
    DEGRADADO("degradado"),
    CAIDO("caido");

    private final String valor;

    EstadoModulo(String valor) {
        this.valor = valor;
    }

    @JsonValue
    public String getValor() {
        return valor;
    }
}
