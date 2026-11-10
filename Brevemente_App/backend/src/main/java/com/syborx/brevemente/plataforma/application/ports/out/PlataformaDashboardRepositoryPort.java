package com.syborx.brevemente.plataforma.application.ports.out;

import com.syborx.brevemente.plataforma.infrastructure.adapters.in.rest.dto.AccesoRecienteDTO;
import com.syborx.brevemente.plataforma.infrastructure.adapters.in.rest.dto.UsuarioRecienteDTO;

import java.util.List;

public interface PlataformaDashboardRepositoryPort {

    int contarTerapeutasActivos();

    int contarPacientesActivos();

    List<AccesoRecienteDTO> findAccesosRecientes(int limit);

    List<UsuarioRecienteDTO> findUsuariosRecientes(int limit);
}
