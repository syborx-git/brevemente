package com.syborx.brevemente.auth.application.ports.out;

import com.syborx.brevemente.auth.domain.exception.DemasiadosIntentosException;

/**
 * Control de intentos de login (anti fuerza bruta) por cuenta y por IP.
 */
public interface LoginAttemptPort {

    /** @throws DemasiadosIntentosException si la cuenta o la IP están bloqueadas */
    void verificarPermitido(String email, String ip);

    void registrarFallo(String email, String ip);

    /** Un login correcto reinicia el contador de la cuenta. */
    void registrarExito(String email);
}
