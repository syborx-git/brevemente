package com.syborx.brevemente.usuario.infrastructure.adapters.in.rest.dto;

import com.fasterxml.jackson.annotation.JsonValue;

/** Estado de ciclo de vida de una cuenta de la plataforma. */
public enum EstadoUsuario {
    ACTIVO("activo"),
    SUSPENDIDO("suspendido"),
    INACTIVO("inactivo");

    private final String valor;

    EstadoUsuario(String valor) {
        this.valor = valor;
    }

    @JsonValue
    public String getValor() {
        return valor;
    }

    public boolean esActivo() {
        return this == ACTIVO;
    }

    public static EstadoUsuario fromValor(String valor) {
        for (EstadoUsuario e : values()) {
            if (e.valor.equals(valor)) {
                return e;
            }
        }
        return null;
    }
}
