package com.syborx.brevemente.expediente.application.ports.in;

import com.syborx.brevemente.expediente.domain.model.Sesion;

import java.util.List;

public interface AgregarSesionUseCase {
    Sesion agregar(String pacienteId, Sesion sesion, String usuarioId, List<String> terapeutaIds);
}
