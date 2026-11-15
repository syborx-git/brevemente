package com.syborx.brevemente.plataforma.infrastructure.adapters.in.rest.dto;

import java.time.Instant;

public record AlertaAdministrativaDTO(
        String id,
        TipoAlertaAdministrativa tipo,
        String titulo,
        String descripcion,
        Severidad severidad,
        Instant fecha) {}
