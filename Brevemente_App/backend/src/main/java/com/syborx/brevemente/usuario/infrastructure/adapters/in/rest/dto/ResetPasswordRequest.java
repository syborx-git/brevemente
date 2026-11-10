package com.syborx.brevemente.usuario.infrastructure.adapters.in.rest.dto;

import jakarta.validation.constraints.NotBlank;

public record ResetPasswordRequest(@NotBlank String passwordConfirmacion) {}
