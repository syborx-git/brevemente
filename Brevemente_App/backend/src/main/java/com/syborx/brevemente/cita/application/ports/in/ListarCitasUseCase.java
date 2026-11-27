package com.syborx.brevemente.cita.application.ports.in;

import com.syborx.brevemente.cita.domain.model.Cita;
import com.syborx.brevemente.cita.domain.model.CitaFiltro;

import java.util.List;

public interface ListarCitasUseCase {
    List<Cita> listar(CitaFiltro filtro);

    /** Listado global (sin alcance por terapeuta) para el módulo "Visión Global". */
    List<Cita> listarGlobales(CitaFiltro filtro);
}
