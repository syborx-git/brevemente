package com.syborx.brevemente.auth.domain.exception;

/**
 * Se superó el número de intentos de login fallidos permitido (anti fuerza
 * bruta). Se traduce a HTTP 429 con cabecera {@code Retry-After}.
 */
public class DemasiadosIntentosException extends RuntimeException {

    private final long retryAfterSeconds;

    public DemasiadosIntentosException(long retryAfterSeconds) {
        super("Demasiados intentos de inicio de sesión. Intenta de nuevo más tarde.");
        this.retryAfterSeconds = retryAfterSeconds;
    }

    public long getRetryAfterSeconds() {
        return retryAfterSeconds;
    }
}
