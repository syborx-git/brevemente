package com.syborx.brevemente.pago.infrastructure.adapters.in.rest.mapper;

import com.syborx.brevemente.pago.domain.model.Pago;
import com.syborx.brevemente.pago.infrastructure.adapters.in.rest.dto.PagoCreateRequest;
import com.syborx.brevemente.pago.infrastructure.adapters.in.rest.dto.PagoResponseDTO;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class PagoRestMapper {

    public PagoResponseDTO toResponse(Pago p) {
        if (p == null) return null;
        return new PagoResponseDTO(
                p.getId(),
                p.getPacienteId(),
                p.getPacienteNombre(),
                p.getCitaId(),
                p.getConcepto(),
                p.getMonto(),
                p.getFecha() != null ? p.getFecha().toString() : null,
                p.getMetodo(),
                p.getEstado(),
                p.getNotas(),
                p.getRegistradoPorNombre(),
                p.getCreatedAt() != null ? p.getCreatedAt().toString() : null
        );
    }

    public Pago toDomain(PagoCreateRequest r) {
        if (r == null) return null;
        return Pago.builder()
                .pacienteId(r.patientId())
                .citaId(r.appointmentId())
                .concepto(r.concept())
                .monto(r.amount())
                .fecha(r.date() != null && !r.date().isBlank() ? LocalDate.parse(r.date()) : null)
                .metodo(r.method())
                .estado(r.status())
                .notas(r.notes())
                .build();
    }
}
