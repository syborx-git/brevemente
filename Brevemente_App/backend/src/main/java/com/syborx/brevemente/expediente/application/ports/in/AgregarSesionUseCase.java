package com.syborx.brevemente.expediente.application.ports.in;

import com.syborx.brevemente.expediente.domain.model.Sesion;

public interface AgregarSesionUseCase {
    Sesion agregar(String pacienteId, Sesion sesion, String usuarioId);
}
