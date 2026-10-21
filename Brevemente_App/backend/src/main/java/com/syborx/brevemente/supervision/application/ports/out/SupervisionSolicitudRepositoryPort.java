package com.syborx.brevemente.supervision.application.ports.out;

import com.syborx.brevemente.supervision.domain.model.SupervisionSolicitud;

import java.util.List;
import java.util.Optional;

public interface SupervisionSolicitudRepositoryPort {
    List<SupervisionSolicitud> findByPacienteId(String pacienteId);

    Optional<SupervisionSolicitud> findById(String id);

    SupervisionSolicitud save(SupervisionSolicitud solicitud);
}
