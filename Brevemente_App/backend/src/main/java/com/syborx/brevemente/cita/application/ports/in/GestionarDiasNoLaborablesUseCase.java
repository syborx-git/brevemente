package com.syborx.brevemente.cita.application.ports.in;

import com.syborx.brevemente.cita.domain.model.DiaNoLaborable;

import java.util.List;

public interface GestionarDiasNoLaborablesUseCase {
    List<DiaNoLaborable> listar();
    DiaNoLaborable crear(DiaNoLaborable dia);
    void eliminar(String id);
}
