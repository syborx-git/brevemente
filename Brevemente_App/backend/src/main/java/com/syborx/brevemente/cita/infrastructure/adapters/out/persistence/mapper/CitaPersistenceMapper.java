package com.syborx.brevemente.cita.infrastructure.adapters.out.persistence.mapper;

import com.syborx.brevemente.cita.domain.model.Cita;
import com.syborx.brevemente.cita.infrastructure.adapters.out.persistence.entity.CitaJpaEntity;
import org.springframework.stereotype.Component;

@Component
public class CitaPersistenceMapper {

    public Cita toDomain(CitaJpaEntity entity, String pacienteNombre) {
        if (entity == null) {
            return null;
        }
        return Cita.builder()
                .id(entity.getId())
                .pacienteId(entity.getPacienteId())
                .pacienteNombre(pacienteNombre)
                .terapeutaId(entity.getTerapeutaId())
                .expedienteId(entity.getExpedienteId())
                .fechaHoraInicio(entity.getFechaHoraInicio())
                .fechaHoraFin(entity.getFechaHoraFin())
                .tipoCita(entity.getTipoCita())
                .modalidad(entity.getModalidad())
                .estadoCita(entity.getEstadoCita())
                .duracionMinutos(entity.getDuracionMinutos())
                .consultorio(entity.getConsultorio())
                .paymentStatus(entity.getPaymentStatus())
                .bloqueadaPorNormativa(Boolean.TRUE.equals(entity.getBloqueadaPorNormativa()))
                .build();
    }

    public CitaJpaEntity toJpaEntity(Cita domain) {
        if (domain == null) {
            return null;
        }
        return CitaJpaEntity.builder()
                .id(domain.getId())
                .pacienteId(domain.getPacienteId())
                .terapeutaId(domain.getTerapeutaId())
                .expedienteId(domain.getExpedienteId())
                .fechaHoraInicio(domain.getFechaHoraInicio())
                .fechaHoraFin(domain.getFechaHoraFin())
                .tipoCita(domain.getTipoCita() != null ? domain.getTipoCita() : "primera")
                .modalidad(domain.getModalidad() != null ? domain.getModalidad() : "PRESENCIAL")
                .estadoCita(domain.getEstadoCita() != null ? domain.getEstadoCita() : "pendiente")
                .duracionMinutos(domain.getDuracionMinutos() != null ? domain.getDuracionMinutos() : 30)
                .paymentStatus(domain.getPaymentStatus() != null ? domain.getPaymentStatus() : "pendiente")
                .consultorio(domain.getConsultorio())
                .bloqueadaPorNormativa(domain.isBloqueadaPorNormativa())
                .build();
    }
}
