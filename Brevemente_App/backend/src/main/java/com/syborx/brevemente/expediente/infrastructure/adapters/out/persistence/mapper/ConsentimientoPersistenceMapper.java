package com.syborx.brevemente.expediente.infrastructure.adapters.out.persistence.mapper;

import com.syborx.brevemente.expediente.domain.model.Consentimiento;
import com.syborx.brevemente.expediente.infrastructure.adapters.out.persistence.entity.ConsentimientoJpaEntity;
import org.springframework.stereotype.Component;

@Component
public class ConsentimientoPersistenceMapper {

    public Consentimiento toDomain(ConsentimientoJpaEntity e) {
        if (e == null) return null;
        return Consentimiento.builder()
                .id(e.getId())
                .pacienteId(e.getPacienteId())
                .tipoConsentimiento(e.getTipoConsentimiento())
                .firmadoPor(e.getFirmadoPor())
                .calidadFirmante(e.getCalidadFirmante())
                .fechaFirma(e.getFechaFirma())
                .documentoHash(e.getDocumentoHash())
                .revocado(e.getRevocado())
                .build();
    }

    public ConsentimientoJpaEntity toJpaEntity(Consentimiento d) {
        if (d == null) return null;
        return ConsentimientoJpaEntity.builder()
                .id(d.getId())
                .pacienteId(d.getPacienteId())
                .tipoConsentimiento(d.getTipoConsentimiento())
                .firmadoPor(d.getFirmadoPor())
                .calidadFirmante(d.getCalidadFirmante())
                .fechaFirma(d.getFechaFirma())
                .documentoHash(d.getDocumentoHash())
                .revocado(d.getRevocado())
                .build();
    }
}
