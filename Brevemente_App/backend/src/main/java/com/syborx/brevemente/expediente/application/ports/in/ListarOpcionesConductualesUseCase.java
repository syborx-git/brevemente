package com.syborx.brevemente.expediente.application.ports.in;

import com.syborx.brevemente.expediente.domain.model.OpcionConductual;

import java.util.List;

public interface ListarOpcionesConductualesUseCase {
    List<OpcionConductual> listar();
}
