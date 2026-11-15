package com.syborx.brevemente.portalpaciente.infrastructure.adapters.in.rest.mapper;

import com.syborx.brevemente.portalpaciente.domain.model.AlertaPaciente;
import com.syborx.brevemente.portalpaciente.domain.model.ContraReferencia;
import com.syborx.brevemente.portalpaciente.domain.model.PortalPerfil;
import com.syborx.brevemente.portalpaciente.domain.model.SesionPortal;
import com.syborx.brevemente.portalpaciente.infrastructure.adapters.in.rest.dto.AlertaPacienteResponseDTO;
import com.syborx.brevemente.portalpaciente.infrastructure.adapters.in.rest.dto.ContraReferenciaResponseDTO;
import com.syborx.brevemente.portalpaciente.infrastructure.adapters.in.rest.dto.PortalPerfilResponseDTO;
import com.syborx.brevemente.portalpaciente.infrastructure.adapters.in.rest.dto.SesionPortalResponseDTO;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;

@Component
public class PortalPacienteRestMapper {

    public PortalPerfilResponseDTO toPerfilResponse(PortalPerfil domain) {
        if (domain == null) return null;
        return new PortalPerfilResponseDTO(
                domain.id(), domain.name(), domain.therapistName(), domain.motif());
    }

    public AlertaPacienteResponseDTO toAlertaResponse(AlertaPaciente domain) {
        if (domain == null) return null;
        return new AlertaPacienteResponseDTO(
                domain.getId(),
                domain.getTipo(),
                domain.getMensaje(),
                domain.getEstado(),
                domain.getResueltaPor(),
                iso(domain.getResueltaEn()),
                iso(domain.getCreatedAt()));
    }

    public ContraReferenciaResponseDTO toContraReferenciaResponse(ContraReferencia domain) {
        if (domain == null) return null;
        return new ContraReferenciaResponseDTO(
                domain.getId(),
                domain.getFromTherapistName(),
                domain.getToTherapistName(),
                domain.getEstado(),
                fecha(domain.getResolvedAt() != null ? domain.getResolvedAt() : domain.getCreatedAt()));
    }

    public SesionPortalResponseDTO toSesionResponse(SesionPortal domain) {
        if (domain == null) return null;
        return new SesionPortalResponseDTO(
                domain.id(),
                domain.citaId(),
                domain.numero(),
                domain.fecha(),
                domain.px(),
                domain.notas());
    }

    private String iso(OffsetDateTime dt) {
        return dt != null ? dt.toString() : null;
    }

    private String fecha(OffsetDateTime dt) {
        return dt != null ? dt.toLocalDate().toString() : null;
    }
}
