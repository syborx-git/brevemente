package com.syborx.brevemente.paciente.application.ports.in;

import com.syborx.brevemente.paciente.domain.model.Paciente;
import java.util.List;

public interface ListarPacientesUseCase {
    List<Paciente> listarTodos();
}
