package com.syborx.brevemente.expediente.application.ports.in;

import com.syborx.brevemente.expediente.domain.model.TratamientoPrevio;

import java.util.List;

public interface GuardarTratamientosPreviosUseCase {
    List<TratamientoPrevio> guardar(String pacienteId, List<TratamientoPrevio> items, String usuarioId);
}
