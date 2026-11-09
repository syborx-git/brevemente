package com.syborx.brevemente.usuario.infrastructure.adapters.in.rest.dto;

import java.time.Instant;
import java.util.List;

public record UsuarioAdminDTO(
        String id,
        String nombre,
        String apellidos,
        String email,
        List<String> roles,
        String estado,
        String cedulaProfesional,
        String especialidad,
        List<String> terapeutaIds,
        Instant ultimoAcceso,
        Instant creadoEn) {}
