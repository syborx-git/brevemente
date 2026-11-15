package com.syborx.brevemente.paciente.application.ports.in;

import com.syborx.brevemente.paciente.domain.model.Paciente;
import com.syborx.brevemente.paciente.domain.model.PacienteCreado;

public interface CrearPacienteUseCase {
    PacienteCreado crear(Paciente nuevoPaciente);
}
