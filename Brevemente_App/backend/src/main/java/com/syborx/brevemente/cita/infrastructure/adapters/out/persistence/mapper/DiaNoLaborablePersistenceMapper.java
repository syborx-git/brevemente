package com.syborx.brevemente.cita.infrastructure.adapters.out.persistence.mapper;

import com.syborx.brevemente.cita.domain.model.DiaNoLaborable;
import com.syborx.brevemente.cita.infrastructure.adapters.out.persistence.entity.DiaNoLaborableJpaEntity;
import org.springframework.stereotype.Component;

@Component
public class DiaNoLaborablePersistenceMapper {

    public DiaNoLaborable toDomain(DiaNoLaborableJpaEntity entity) {
        if (entity == null) {
            return null;
        }
        return DiaNoLaborable.builder()
                .id(entity.getId())
                .fecha(entity.getFecha())
                .nombre(entity.getNombre())
                .tipo(entity.getTipo())
                .terapeutaId(entity.getTerapeutaId())
                .build();
    }

    public DiaNoLaborableJpaEntity toJpaEntity(DiaNoLaborable domain) {
        if (domain == null) {
            return null;
        }
        return DiaNoLaborableJpaEntity.builder()
                .id(domain.getId())
                .fecha(domain.getFecha())
                .nombre(domain.getNombre())
                .tipo(domain.getTipo() != null ? domain.getTipo() : "personal")
                .terapeutaId(domain.getTerapeutaId())
                .build();
    }
}
