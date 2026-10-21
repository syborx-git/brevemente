package com.syborx.brevemente.expediente.application.ports.in;

import com.syborx.brevemente.expediente.domain.model.Sesion;

import java.util.List;

public interface ListarSesionesUseCase {
    List<Sesion> listarPorPaciente(String pacienteId);
}
