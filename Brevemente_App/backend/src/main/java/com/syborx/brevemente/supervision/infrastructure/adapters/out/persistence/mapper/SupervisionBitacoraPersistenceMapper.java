package com.syborx.brevemente.supervision.infrastructure.adapters.out.persistence.mapper;

import com.syborx.brevemente.supervision.domain.model.SupervisionBitacora;
import com.syborx.brevemente.supervision.infrastructure.adapters.out.persistence.entity.SupervisionBitacoraJpaEntity;
import org.springframework.stereotype.Component;

@Component
public class SupervisionBitacoraPersistenceMapper {

    public SupervisionBitacora toDomain(SupervisionBitacoraJpaEntity e, String pacienteNombre, String terapeutaNombre) {
        if (e == null) return null;
        return SupervisionBitacora.builder()
                .id(e.getId())
                .pacienteId(e.getPacienteId())
                .pacienteNombre(pacienteNombre)
                .terapeutaId(e.getTerapeutaId())
                .terapeutaNombre(terapeutaNombre)
                .fecha(e.getFecha())
                .numeroSesion(e.getNumeroSesion())
                .supervisorNombre(e.getSupervisorNombre())
                .supervisorCedula(e.getSupervisorCedula())
                .definicionProblema(e.getDefinicionProblema())
                .situacionActual(e.getSituacionActual())
                .spr(e.getSpr())
                .ts(e.getTs())
                .problemaTerapeuta(e.getProblemaTerapeuta())
                .rst(e.getRst())
                .px(e.getPx())
                .eff(e.getEff())
                .duda(e.getDuda())
                .bloqueo(e.getBloqueo())
                .observaciones(e.getObservaciones())
                .recomendaciones(e.getRecomendaciones())
                .createdAt(e.getCreatedAt())
                .build();
    }

    public SupervisionBitacoraJpaEntity toJpaEntity(SupervisionBitacora d) {
        if (d == null) return null;
        return SupervisionBitacoraJpaEntity.builder()
                .id(d.getId())
                .pacienteId(d.getPacienteId())
                .terapeutaId(d.getTerapeutaId())
                .fecha(d.getFecha())
                .numeroSesion(d.getNumeroSesion())
                .supervisorNombre(d.getSupervisorNombre())
                .supervisorCedula(d.getSupervisorCedula())
                .definicionProblema(d.getDefinicionProblema())
                .situacionActual(d.getSituacionActual())
                .spr(d.getSpr())
                .ts(d.getTs())
                .problemaTerapeuta(d.getProblemaTerapeuta())
                .rst(d.getRst())
                .px(d.getPx())
                .eff(d.getEff())
                .duda(d.getDuda())
                .bloqueo(d.getBloqueo())
                .observaciones(d.getObservaciones())
                .recomendaciones(d.getRecomendaciones())
                .build();
    }
}
