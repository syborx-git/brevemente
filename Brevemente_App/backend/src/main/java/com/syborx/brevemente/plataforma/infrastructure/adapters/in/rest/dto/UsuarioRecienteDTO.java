package com.syborx.brevemente.plataforma.infrastructure.adapters.in.rest.dto;

import java.time.Instant;

public record UsuarioRecienteDTO(String id, String nombre, String rol, Instant creadoEn) {}
