package com.syborx.brevemente.plataforma.infrastructure.adapters.in.rest.dto;

import com.fasterxml.jackson.annotation.JsonValue;

/** Severidad de una alerta administrativa. */
public enum Severidad {
    ALTA("alta"),
    MEDIA("media"),
    BAJA("baja"),
    OK("ok");

    private final String valor;

    Severidad(String valor) {
        this.valor = valor;
    }

    @JsonValue
    public String getValor() {
        return valor;
    }
}
