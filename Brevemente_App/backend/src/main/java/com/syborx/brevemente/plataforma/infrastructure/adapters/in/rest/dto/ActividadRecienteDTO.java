package com.syborx.brevemente.plataforma.infrastructure.adapters.in.rest.dto;

import java.util.List;

public record ActividadRecienteDTO(List<AccesoRecienteDTO> accesos, List<UsuarioRecienteDTO> usuarios) {}
