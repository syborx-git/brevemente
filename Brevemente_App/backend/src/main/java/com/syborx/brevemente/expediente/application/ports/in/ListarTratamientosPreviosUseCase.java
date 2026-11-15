package com.syborx.brevemente.expediente.application.ports.in;

import com.syborx.brevemente.expediente.domain.model.TratamientoPrevio;

import java.util.List;

public interface ListarTratamientosPreviosUseCase {
    List<TratamientoPrevio> listar(String pacienteId);
}
