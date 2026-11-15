package com.syborx.brevemente.portalpaciente.application.ports.in;

import com.syborx.brevemente.cita.domain.model.Cita;

import java.util.List;

public interface ListarCitasPortalUseCase {
    List<Cita> listarCitas();
}
