package com.syborx.brevemente.expediente.infrastructure.adapters.in.rest.mapper;

import com.syborx.brevemente.expediente.domain.model.Sesion;
import com.syborx.brevemente.expediente.infrastructure.adapters.in.rest.dto.SesionCreateRequest;
import com.syborx.brevemente.expediente.infrastructure.adapters.in.rest.dto.SesionResponseDTO;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
public class SesionRestMapper {

    public SesionResponseDTO toResponse(Sesion s) {
        if (s == null) return null;
        return new SesionResponseDTO(
                s.getId(),
                s.getPacienteId(),
                s.getNumero(),
                s.getFecha() != null ? s.getFecha().toString() : null,
                s.getFase(),
                s.getProtocolo(),
                s.getDxOperativo(),
                s.getTrastorno(),
                s.getPx() != null ? s.getPx() : List.of(),
                s.getF1(),
                s.getF2(),
                s.getOss(),
                s.getAdherencia(),
                s.getCumplimiento(),
                s.getRss(),
                s.getEff(),
                s.getNotas(),
                s.getObservacionesProximaSesion(),
                s.getSituacion(),
                s.getDuracionAudio(),
                s.getStatus(),
                s.getValoracionCambio(),
                s.getValoracionGlobal()
        );
    }

    public Sesion toDomain(String pacienteId, SesionCreateRequest r) {
        if (r == null) return null;
        return Sesion.builder()
                .pacienteId(pacienteId)
                .numero(r.number())
                .fecha(r.date() != null && !r.date().isBlank() ? LocalDate.parse(r.date()) : null)
                .fase(r.phase())
                .protocolo(r.protocol())
                .dxOperativo(r.dxOp())
                .trastorno(r.trastorno())
                .px(r.px() != null ? r.px() : List.of())
                .f1(r.f1())
                .f2(r.f2())
                .oss(r.oss())
                .adherencia(r.add())
                .cumplimiento(r.cumplimiento())
                .rss(r.rss())
                .eff(r.eff())
                .notas(r.notes())
                .observacionesProximaSesion(r.observationsNextSession())
                .situacion(r.situation())
                .duracionAudio(r.audioDuration())
                .valoracionCambio(r.valoracionCambio())
                .valoracionGlobal(r.valoracionGlobal())
                .build();
    }
}
