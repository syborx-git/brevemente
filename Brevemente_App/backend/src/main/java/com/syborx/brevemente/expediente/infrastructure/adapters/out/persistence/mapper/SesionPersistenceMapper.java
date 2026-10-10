package com.syborx.brevemente.expediente.infrastructure.adapters.out.persistence.mapper;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.syborx.brevemente.expediente.domain.model.Sesion;
import com.syborx.brevemente.expediente.domain.model.VcEntry;
import com.syborx.brevemente.expediente.domain.model.VgEntry;
import com.syborx.brevemente.expediente.infrastructure.adapters.out.persistence.entity.SesionJpaEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class SesionPersistenceMapper {

    private final ObjectMapper objectMapper;

    public Sesion toDomain(SesionJpaEntity e) {
        if (e == null) return null;
        return Sesion.builder()
                .id(e.getId())
                .expedienteId(e.getExpedienteId())
                .numero(e.getNumero())
                .fecha(e.getFecha())
                .fase(e.getFase())
                .protocolo(e.getProtocolo())
                .dxOperativo(e.getDxOperativo())
                .trastorno(e.getTrastorno())
                .px(e.getPx() != null ? e.getPx() : List.of())
                .f1(e.getF1())
                .f2(e.getF2())
                .oss(e.getOss())
                .adherencia(e.getAdherencia())
                .cumplimiento(e.getCumplimiento())
                .rss(e.getRss())
                .eff(e.getEff())
                .notas(e.getNotas())
                .observacionesProximaSesion(e.getObservacionesProximaSesion())
                .situacion(e.getSituacion())
                .duracionAudio(e.getDuracionAudio())
                .status(e.getStatus())
                .creadoPorId(e.getCreadoPorId())
                .valoracionCambio(mapToVc(e.getValoracionCambio()))
                .valoracionGlobal(mapToVg(e.getValoracionGlobal()))
                .build();
    }

    public SesionJpaEntity toJpaEntity(Sesion d) {
        if (d == null) return null;
        return SesionJpaEntity.builder()
                .id(d.getId())
                .expedienteId(d.getExpedienteId())
                .numero(d.getNumero())
                .fecha(d.getFecha())
                .fase(d.getFase())
                .protocolo(d.getProtocolo())
                .dxOperativo(d.getDxOperativo())
                .trastorno(d.getTrastorno())
                .px(d.getPx() != null ? d.getPx() : List.of())
                .f1(d.getF1())
                .f2(d.getF2())
                .oss(d.getOss())
                .adherencia(d.getAdherencia())
                .cumplimiento(d.getCumplimiento())
                .rss(d.getRss())
                .eff(d.getEff())
                .notas(d.getNotas())
                .observacionesProximaSesion(d.getObservacionesProximaSesion())
                .situacion(d.getSituacion())
                .duracionAudio(d.getDuracionAudio())
                .status(d.getStatus())
                .creadoPorId(d.getCreadoPorId())
                .valoracionCambio(vcToMap(d.getValoracionCambio()))
                .valoracionGlobal(vgToMap(d.getValoracionGlobal()))
                .build();
    }

    private VcEntry mapToVc(Map<String, Object> json) {
        if (json == null || json.isEmpty()) return null;
        return objectMapper.convertValue(json, VcEntry.class);
    }

    private VgEntry mapToVg(Map<String, Object> json) {
        if (json == null || json.isEmpty()) return null;
        return objectMapper.convertValue(json, VgEntry.class);
    }

    private Map<String, Object> vcToMap(VcEntry vc) {
        if (vc == null) return null;
        return objectMapper.convertValue(vc, Map.class);
    }

    private Map<String, Object> vgToMap(VgEntry vg) {
        if (vg == null) return null;
        return objectMapper.convertValue(vg, Map.class);
    }
}
