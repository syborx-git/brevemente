package com.syborx.brevemente.constancia.infrastructure.adapters.in.rest.mapper;

import com.syborx.brevemente.constancia.domain.model.ConstanciaFisica;
import com.syborx.brevemente.constancia.infrastructure.adapters.in.rest.dto.ConstanciaFisicaCreateRequest;
import com.syborx.brevemente.constancia.infrastructure.adapters.in.rest.dto.ConstanciaFisicaResponseDTO;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class ConstanciaFisicaRestMapper {

    public ConstanciaFisicaResponseDTO toResponse(ConstanciaFisica c) {
        if (c == null) return null;
        return new ConstanciaFisicaResponseDTO(
                c.getId(),
                c.getPacienteId(),
                c.getPacienteNombre(),
                c.getFolioFisico(),
                c.getFechaExpedicion() != null ? c.getFechaExpedicion().toString() : null,
                c.getTipo(),
                c.getEmisorNombre(),
                c.getEmisorCedula(),
                c.getDestinatario(),
                c.getMotivo(),
                c.getPeriodoCubierto(),
                c.getNumSesiones(),
                c.getResumenClinico(),
                c.getUrlEscaneo(),
                c.getNombreArchivoEscaneo(),
                c.getEntregadoA(),
                c.getEstado(),
                c.getRegistradoPorNombre(),
                c.getRegistradoAt() != null ? c.getRegistradoAt().toString() : null
        );
    }

    public ConstanciaFisica toDomain(ConstanciaFisicaCreateRequest r) {
        if (r == null) return null;
        return ConstanciaFisica.builder()
                .pacienteId(r.patientId())
                .folioFisico(r.physicalFolio())
                .fechaExpedicion(r.issueDate() != null && !r.issueDate().isBlank() ? LocalDate.parse(r.issueDate()) : null)
                .tipo(r.type())
                .emisorNombre(r.issuerName())
                .emisorCedula(r.issuerLicense())
                .destinatario(r.recipient())
                .motivo(r.purpose())
                .periodoCubierto(r.periodCovered())
                .numSesiones(r.sessionsCount())
                .resumenClinico(r.clinicalSummary())
                .urlEscaneo(r.digitalScanUrl())
                .nombreArchivoEscaneo(r.scanFileName())
                .entregadoA(r.deliveredTo())
                .build();
    }
}
