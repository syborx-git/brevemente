package com.syborx.brevemente.portalpaciente.infrastructure.adapters.in.rest.mapper;

import com.syborx.brevemente.portalpaciente.domain.model.AlertaStaff;
import com.syborx.brevemente.portalpaciente.infrastructure.adapters.in.rest.dto.AlertaStaffResponseDTO;
import org.springframework.stereotype.Component;

@Component
public class AlertaStaffRestMapper {

    public AlertaStaffResponseDTO toResponse(AlertaStaff alerta) {
        if (alerta == null) {
            return null;
        }
        return new AlertaStaffResponseDTO(
                alerta.getId(),
                alerta.getPacienteId(),
                alerta.getPacienteNombre(),
                alerta.getTipo(),
                alerta.getEstado(),
                alerta.getMensaje(),
                alerta.getCreatedAt() != null ? alerta.getCreatedAt().toString() : null,
                alerta.getResueltaPor(),
                alerta.getResueltaEn() != null ? alerta.getResueltaEn().toString() : null
        );
    }
}
