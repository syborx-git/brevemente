package com.syborx.brevemente.cita.infrastructure.adapters.in.rest.mapper;

import com.syborx.brevemente.cita.domain.model.DiaNoLaborable;
import com.syborx.brevemente.cita.infrastructure.adapters.in.rest.dto.DiaNoLaborableDTO;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class DiaNoLaborableRestMapper {

    public DiaNoLaborableDTO toResponse(DiaNoLaborable domain) {
        if (domain == null) {
            return null;
        }
        return new DiaNoLaborableDTO(
                domain.getId(),
                domain.getFecha() != null ? domain.getFecha().toString() : null,
                domain.getNombre(),
                domain.getTipo(),
                domain.getTerapeutaId()
        );
    }

    public DiaNoLaborable toDomain(DiaNoLaborableDTO dto) {
        if (dto == null) {
            return null;
        }
        return DiaNoLaborable.builder()
                .fecha(dto.fecha() != null ? LocalDate.parse(dto.fecha()) : null)
                .nombre(dto.nombre())
                .tipo(dto.tipo() != null ? dto.tipo() : "personal")
                .terapeutaId(dto.terapeutaId())
                .build();
    }
}
