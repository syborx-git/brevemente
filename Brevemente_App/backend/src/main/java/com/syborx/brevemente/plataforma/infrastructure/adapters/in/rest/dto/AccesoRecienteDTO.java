package com.syborx.brevemente.plataforma.infrastructure.adapters.in.rest.dto;

import java.time.Instant;

public record AccesoRecienteDTO(String id, String usuario, Instant fecha) {}
