package com.syborx.brevemente.portalpaciente.application.ports.in;

import com.syborx.brevemente.portalpaciente.domain.model.SesionPortal;

import java.util.List;

public interface ListarSesionesPortalUseCase {
    List<SesionPortal> listarSesiones();
}
