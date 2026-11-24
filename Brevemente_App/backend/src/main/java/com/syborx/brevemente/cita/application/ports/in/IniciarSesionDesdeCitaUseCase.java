package com.syborx.brevemente.cita.application.ports.in;

import com.syborx.brevemente.cita.domain.model.SesionIniciada;

public interface IniciarSesionDesdeCitaUseCase {
    SesionIniciada iniciarSesion(String citaId);
}
