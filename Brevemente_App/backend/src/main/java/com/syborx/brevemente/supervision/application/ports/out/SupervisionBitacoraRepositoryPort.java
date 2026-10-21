package com.syborx.brevemente.supervision.application.ports.out;

import com.syborx.brevemente.supervision.domain.model.SupervisionBitacora;

import java.util.List;
import java.util.Optional;

public interface SupervisionBitacoraRepositoryPort {
    List<SupervisionBitacora> findByPacienteId(String pacienteId);

    Optional<SupervisionBitacora> findById(String id);

    SupervisionBitacora save(SupervisionBitacora bitacora);

    void deleteById(String id);
}
