package com.syborx.brevemente.expediente.application.ports.in;

public interface FirmarConsentimientoUseCase {
    void firmar(String pacienteId, String usuarioId);
}
