package com.syborx.brevemente.plataforma.infrastructure.adapters.in.rest.dto;

import java.math.BigDecimal;

public record IndicadorClinicoDTO(ClaveIndicadorClinico clave, String etiqueta, BigDecimal valor, String unidad) {}
