package com.syborx.brevemente.auth.domain.model;

/**
 * Estado mínimo de la identidad necesario para validar un access token en
 * cada petición: la versión de token vigente y si la cuenta sigue activa.
 */
public record EstadoSesion(int tokenVersion, boolean activo) {
}
