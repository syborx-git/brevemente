package com.syborx.brevemente.leva.domain.exception;

public class UnauthorizedInternalApiKeyException extends LevaException {
    public UnauthorizedInternalApiKeyException() {
        super("Acceso denegado: Cabecera X-Internal-API-Key ausente o inválida.");
    }
}
