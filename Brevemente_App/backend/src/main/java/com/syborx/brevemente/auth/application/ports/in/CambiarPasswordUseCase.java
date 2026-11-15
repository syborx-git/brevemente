package com.syborx.brevemente.auth.application.ports.in;

/** Cambio de contraseña (onboarding obligatorio o cambio voluntario). */
public interface CambiarPasswordUseCase {

    /**
     * Valida la contraseña actual, aplica la política a la nueva, actualiza el
     * hash, limpia el flag `debe_cambiar_password` y anula el TTL temporal.
     */
    void cambiarPassword(String usuarioId, String passwordActual, String nuevaPassword);
}
