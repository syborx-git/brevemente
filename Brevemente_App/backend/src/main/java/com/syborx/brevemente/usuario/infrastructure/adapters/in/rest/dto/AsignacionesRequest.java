package com.syborx.brevemente.usuario.infrastructure.adapters.in.rest.dto;

import jakarta.validation.constraints.NotNull;

import java.util.List;

public record AsignacionesRequest(@NotNull List<String> terapeutaIds) {}
