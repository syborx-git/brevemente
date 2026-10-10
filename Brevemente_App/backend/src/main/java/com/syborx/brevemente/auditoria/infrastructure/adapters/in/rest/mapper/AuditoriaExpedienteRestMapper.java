package com.syborx.brevemente.auditoria.infrastructure.adapters.in.rest.mapper;

import com.syborx.brevemente.auditoria.domain.model.AuditoriaExpediente;
import com.syborx.brevemente.auditoria.infrastructure.adapters.in.rest.dto.AuditoriaExpedienteResponseDTO;
import org.springframework.stereotype.Component;

@Component
public class AuditoriaExpedienteRestMapper {

    public AuditoriaExpedienteResponseDTO toResponse(AuditoriaExpediente a) {
        if (a == null) return null;
        return new AuditoriaExpedienteResponseDTO(
                a.getId(),
                a.getCreatedAt() != null ? a.getCreatedAt().toString() : null,
                a.getUsuarioId(),
                a.getUserName(),
                a.getRole(),
                a.getAccion(),
                a.getDetalle(),
                a.getCategoria()
        );
    }
}
