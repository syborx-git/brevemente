package com.syborx.brevemente.paciente.application.ports.in;

import com.syborx.brevemente.paciente.domain.model.Paciente;

public interface ObtenerPacienteUseCase {
    Paciente obtenerPorId(String id);
}
