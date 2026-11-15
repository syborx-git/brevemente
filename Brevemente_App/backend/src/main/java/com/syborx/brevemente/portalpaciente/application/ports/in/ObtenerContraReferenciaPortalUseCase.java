package com.syborx.brevemente.portalpaciente.application.ports.in;

import com.syborx.brevemente.portalpaciente.domain.model.ContraReferencia;

import java.util.Optional;

public interface ObtenerContraReferenciaPortalUseCase {
    Optional<ContraReferencia> obtenerContraReferencia();
}
