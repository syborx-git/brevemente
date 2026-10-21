package com.syborx.brevemente.paciente.application.ports.in;

import com.syborx.brevemente.paciente.domain.model.Paciente;

public interface CrearPacienteUseCase {
    Paciente crear(Paciente nuevoPaciente);
}
