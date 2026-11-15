package com.syborx.brevemente.plataforma.infrastructure.adapters.in.rest.dto;

import com.fasterxml.jackson.annotation.JsonValue;

/** Tipo de alerta administrativa/financiera. */
public enum TipoAlertaAdministrativa {
    SUSCRIPCION("suscripcion"),
    MOROSIDAD("morosidad"),
    LICENCIA("licencia"),
    CEDULA("cedula"),
    HONORARIOS("honorarios"),
    OTRO("otro");

    private final String valor;

    TipoAlertaAdministrativa(String valor) {
        this.valor = valor;
    }

    @JsonValue
    public String getValor() {
        return valor;
    }
}
