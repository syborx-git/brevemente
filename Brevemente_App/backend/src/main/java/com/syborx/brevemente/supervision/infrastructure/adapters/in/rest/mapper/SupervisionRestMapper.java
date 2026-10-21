package com.syborx.brevemente.supervision.infrastructure.adapters.in.rest.mapper;

import com.syborx.brevemente.supervision.domain.model.SupervisionBitacora;
import com.syborx.brevemente.supervision.domain.model.SupervisionSolicitud;
import com.syborx.brevemente.supervision.infrastructure.adapters.in.rest.dto.SupervisionLogCreateRequest;
import com.syborx.brevemente.supervision.infrastructure.adapters.in.rest.dto.SupervisionLogResponseDTO;
import com.syborx.brevemente.supervision.infrastructure.adapters.in.rest.dto.SupervisionSolicitudResponseDTO;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class SupervisionRestMapper {

    public SupervisionLogResponseDTO toResponse(SupervisionBitacora b) {
        if (b == null) return null;
        return new SupervisionLogResponseDTO(
                b.getId(),
                b.getFecha() != null ? b.getFecha().toString() : null,
                b.getSupervisorNombre(),
                b.getSupervisorCedula(),
                b.getPacienteId(),
                b.getPacienteNombre(),
                b.getTerapeutaId(),
                b.getTerapeutaNombre(),
                b.getNumeroSesion(),
                b.getDefinicionProblema(),
                b.getSituacionActual(),
                b.getSpr(),
                b.getTs(),
                b.getProblemaTerapeuta(),
                b.getRst(),
                b.getPx(),
                b.getEff(),
                b.getDuda(),
                b.getBloqueo(),
                b.getObservaciones(),
                b.getRecomendaciones()
        );
    }

    public SupervisionBitacora toDomain(SupervisionLogCreateRequest r) {
        if (r == null) return null;
        return SupervisionBitacora.builder()
                .pacienteId(r.patientId())
                .terapeutaId(r.therapistId())
                .fecha(r.date() != null && !r.date().isBlank() ? LocalDate.parse(r.date()) : null)
                .numeroSesion(r.sessionNumber())
                .supervisorNombre(r.supervisorName())
                .supervisorCedula(r.supervisorLicense())
                .definicionProblema(r.problemDefinition())
                .situacionActual(r.currentSituation())
                .spr(r.spr())
                .ts(r.ts())
                .problemaTerapeuta(r.therapistProblem())
                .rst(r.rst())
                .px(r.px())
                .eff(r.eff())
                .duda(r.doubt())
                .bloqueo(r.blocking())
                .observaciones(r.observations())
                .recomendaciones(r.recommendations())
                .build();
    }

    public SupervisionSolicitudResponseDTO toResponse(SupervisionSolicitud s) {
        if (s == null) return null;
        return new SupervisionSolicitudResponseDTO(
                s.getId(),
                s.getPacienteId(),
                s.getPacienteNombre(),
                s.getTerapeutaId(),
                s.getTerapeutaNombre(),
                s.getMotivo(),
                s.getEstado(),
                s.getCreatedAt() != null ? s.getCreatedAt().toString() : null,
                s.getAtendidoPorId(),
                s.getAtendidoAt() != null ? s.getAtendidoAt().toString() : null
        );
    }
}
