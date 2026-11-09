package com.syborx.brevemente.plataforma.infrastructure.adapters.in.rest.dto;

import java.math.BigDecimal;

public record DesgloseIndicadorDTO(String terapeutaId, String terapeutaNombre, BigDecimal valor, int casos) {}
