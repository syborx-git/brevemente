package com.syborx.brevemente.expediente.application.ports.in;

import com.syborx.brevemente.expediente.domain.model.Sesion;

public interface ActualizarSesionUseCase {
    Sesion actualizar(String sesionId, Sesion datosParciales, String usuarioId);
}
