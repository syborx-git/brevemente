package com.syborx.brevemente.usuario.infrastructure.adapters.in.rest.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record EditarUsuarioRequest(
        @NotBlank String nombre,
        @NotBlank String apellidos,
        @NotBlank @Email String email,
        @NotEmpty List<String> roles,
        String cedulaProfesional,
        String especialidad,
        @NotBlank String passwordConfirmacion) {}
