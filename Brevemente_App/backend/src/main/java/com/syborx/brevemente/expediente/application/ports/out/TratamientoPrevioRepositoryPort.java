package com.syborx.brevemente.expediente.application.ports.out;

import com.syborx.brevemente.expediente.domain.model.TratamientoPrevio;

import java.util.List;

public interface TratamientoPrevioRepositoryPort {
    List<TratamientoPrevio> findByExpedienteId(String expedienteId);

    List<TratamientoPrevio> saveAll(String expedienteId, List<TratamientoPrevio> items);

    void deleteByExpedienteId(String expedienteId);
}
