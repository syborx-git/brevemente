package com.syborx.brevemente.supervision.infrastructure.adapters.out.persistence.mapper;

import com.syborx.brevemente.supervision.domain.model.SupervisionSolicitud;
import com.syborx.brevemente.supervision.infrastructure.adapters.out.persistence.entity.SupervisionSolicitudJpaEntity;
import org.springframework.stereotype.Component;

@Component
public class SupervisionSolicitudPersistenceMapper {

    public SupervisionSolicitud toDomain(SupervisionSolicitudJpaEntity e, String pacienteNombre, String terapeutaNombre) {
        if (e == null) return null;
        return SupervisionSolicitud.builder()
                .id(e.getId())
                .pacienteId(e.getPacienteId())
                .pacienteNombre(pacienteNombre)
                .solicitanteId(e.getSolicitanteId())
                .terapeutaId(e.getTerapeutaId())
                .terapeutaNombre(terapeutaNombre)
                .motivo(e.getMotivo())
                .estado(e.getEstado())
                .createdAt(e.getCreatedAt())
                .atendidoPorId(e.getAtendidoPorId())
                .atendidoAt(e.getAtendidoAt())
                .build();
    }

    public SupervisionSolicitudJpaEntity toJpaEntity(SupervisionSolicitud d) {
        if (d == null) return null;
        return SupervisionSolicitudJpaEntity.builder()
                .id(d.getId())
                .pacienteId(d.getPacienteId())
                .solicitanteId(d.getSolicitanteId())
                .terapeutaId(d.getTerapeutaId())
                .motivo(d.getMotivo())
                .estado(d.getEstado())
                .atendidoPorId(d.getAtendidoPorId())
                .atendidoAt(d.getAtendidoAt())
                .build();
    }
}
