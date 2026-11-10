package com.syborx.brevemente.auth.domain.model;

import java.time.Instant;

/**
 * Contraseña temporal generada por el sistema. El valor en claro se retorna
 * una sola vez en la respuesta; en BD solo se persiste su hash.
 */
public record PasswordTemporal(String valor, Instant venceEn) {
}
