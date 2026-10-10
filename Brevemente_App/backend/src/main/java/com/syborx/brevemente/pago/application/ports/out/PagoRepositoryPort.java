package com.syborx.brevemente.pago.application.ports.out;

import com.syborx.brevemente.pago.domain.model.Pago;

import java.util.List;
import java.util.Optional;

public interface PagoRepositoryPort {
    List<Pago> findByPacienteId(String pacienteId);

    Optional<Pago> findById(String id);

    Pago save(Pago pago);

    void deleteById(String id);
}
