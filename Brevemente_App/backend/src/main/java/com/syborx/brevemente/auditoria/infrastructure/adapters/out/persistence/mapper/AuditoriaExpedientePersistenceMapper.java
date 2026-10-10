package com.syborx.brevemente.auditoria.infrastructure.adapters.out.persistence.mapper;

import com.syborx.brevemente.auditoria.domain.model.AuditoriaExpediente;
import com.syborx.brevemente.auditoria.infrastructure.adapters.out.persistence.entity.AuditoriaExpedienteJpaEntity;
import org.springframework.stereotype.Component;

@Component
public class AuditoriaExpedientePersistenceMapper {

    public AuditoriaExpediente toDomain(AuditoriaExpedienteJpaEntity e, String userName, String role) {
        if (e == null) return null;
        return AuditoriaExpediente.builder()
                .id(e.getId())
                .pacienteId(e.getPacienteId())
                .usuarioId(e.getUsuarioId())
                .userName(userName)
                .role(role)
                .accion(e.getAccion())
                .detalle(e.getDetalle())
                .categoria(e.getCategoria())
                .createdAt(e.getCreatedAt())
                .build();
    }

    public AuditoriaExpedienteJpaEntity toJpaEntity(AuditoriaExpediente d) {
        if (d == null) return null;
        return AuditoriaExpedienteJpaEntity.builder()
                .id(d.getId())
                .pacienteId(d.getPacienteId())
                .usuarioId(d.getUsuarioId())
                .accion(d.getAccion())
                .detalle(d.getDetalle())
                .categoria(d.getCategoria())
                .build();
    }
}
