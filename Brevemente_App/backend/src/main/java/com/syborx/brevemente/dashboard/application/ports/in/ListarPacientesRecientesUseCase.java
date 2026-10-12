package com.syborx.brevemente.dashboard.application.ports.in;

import com.syborx.brevemente.paciente.domain.model.Paciente;

import java.util.List;

public interface ListarPacientesRecientesUseCase {
    List<Paciente> listarRecientes(int limit);
}
