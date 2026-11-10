package com.syborx.brevemente.auth.application.ports.in;

/**
 * Verifica la contraseña actual del actor (step-up / reautenticación) antes de
 * cambios de privilegio. Consumido por el Módulo 2 (D12).
 */
public interface VerificarPasswordActualUseCase {

    /** @throws com.syborx.brevemente.auth.domain.exception.PasswordActualIncorrectaException si no coincide */
    void verificar(String usuarioId, String password);
}
