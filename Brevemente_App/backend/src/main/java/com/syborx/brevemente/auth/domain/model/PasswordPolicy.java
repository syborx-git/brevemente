package com.syborx.brevemente.auth.domain.model;

import com.syborx.brevemente.auth.domain.exception.PasswordInvalidaException;

/**
 * Política de contraseñas única, compartida por el onboarding (cambio de
 * contraseña) y la generación de temporales.
 */
public final class PasswordPolicy {

    public static final int MIN_LONGITUD = 8;

    private PasswordPolicy() {
    }

    public static void validar(String password) {
        if (password == null || password.length() < MIN_LONGITUD) {
            throw new PasswordInvalidaException(
                    "La contraseña debe tener al menos " + MIN_LONGITUD + " caracteres");
        }
    }
}
