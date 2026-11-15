package com.syborx.brevemente.usuario.infrastructure.adapters.in.rest.dto;

import java.util.List;

public record ResumenUsuariosDTO(List<UsuarioAdminDTO> items, long total, int page, int size) {}
