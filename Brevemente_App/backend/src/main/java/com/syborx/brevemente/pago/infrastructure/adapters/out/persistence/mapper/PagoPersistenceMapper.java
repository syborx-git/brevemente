package com.syborx.brevemente.pago.infrastructure.adapters.out.persistence.mapper;

import com.syborx.brevemente.pago.domain.model.Pago;
import com.syborx.brevemente.pago.infrastructure.adapters.out.persistence.entity.PagoJpaEntity;
import org.springframework.stereotype.Component;

@Component
public class PagoPersistenceMapper {

    public Pago toDomain(PagoJpaEntity e, String pacienteNombre, String registradoPorNombre) {
        if (e == null) return null;
        return Pago.builder()
                .id(e.getId())
                .pacienteId(e.getPacienteId())
                .pacienteNombre(pacienteNombre)
                .citaId(e.getCitaId())
                .concepto(e.getConcepto())
                .monto(e.getMonto())
                .fecha(e.getFecha())
                .metodo(e.getMetodo())
                .estado(e.getEstado())
                .notas(e.getNotas())
                .registradoPorId(e.getRegistradoPorId())
                .registradoPorNombre(registradoPorNombre)
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt())
                .build();
    }

    public PagoJpaEntity toJpaEntity(Pago d) {
        if (d == null) return null;
        return PagoJpaEntity.builder()
                .id(d.getId())
                .pacienteId(d.getPacienteId())
                .citaId(d.getCitaId())
                .concepto(d.getConcepto())
                .monto(d.getMonto())
                .fecha(d.getFecha())
                .metodo(d.getMetodo())
                .estado(d.getEstado())
                .notas(d.getNotas())
                .registradoPorId(d.getRegistradoPorId())
                .build();
    }
}
