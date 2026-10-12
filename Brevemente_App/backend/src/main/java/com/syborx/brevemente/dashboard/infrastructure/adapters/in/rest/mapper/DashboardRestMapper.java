package com.syborx.brevemente.dashboard.infrastructure.adapters.in.rest.mapper;

import com.syborx.brevemente.dashboard.domain.model.AccionDominante;
import com.syborx.brevemente.dashboard.domain.model.AlertaDashboard;
import com.syborx.brevemente.dashboard.domain.model.DashboardStats;
import com.syborx.brevemente.dashboard.infrastructure.adapters.in.rest.dto.AccionDominanteResponseDTO;
import com.syborx.brevemente.dashboard.infrastructure.adapters.in.rest.dto.AlertaDashboardResponseDTO;
import com.syborx.brevemente.dashboard.infrastructure.adapters.in.rest.dto.DashboardStatsResponseDTO;
import com.syborx.brevemente.paciente.domain.model.Paciente;
import com.syborx.brevemente.paciente.infrastructure.adapters.in.rest.dto.PacienteResponseDTO;
import com.syborx.brevemente.paciente.infrastructure.adapters.in.rest.mapper.PacienteRestMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DashboardRestMapper {

    private final PacienteRestMapper pacienteRestMapper;

    public DashboardStatsResponseDTO toResponse(DashboardStats stats) {
        if (stats == null) {
            return null;
        }
        return new DashboardStatsResponseDTO(
                stats.getPacientesActivos(),
                stats.getCitasHoyCount(),
                stats.getAlertasConsentimiento(),
                stats.getAlertasRiesgo(),
                stats.getPendientesClinicos()
        );
    }

    public AlertaDashboardResponseDTO toResponse(AlertaDashboard alerta) {
        if (alerta == null) {
            return null;
        }
        return new AlertaDashboardResponseDTO(
                alerta.getId(),
                alerta.getTipo(),
                alerta.getTitulo(),
                alerta.getDescripcion(),
                alerta.getPacienteId(),
                alerta.getPacienteNombre()
        );
    }

    public AccionDominanteResponseDTO toResponse(AccionDominante accion) {
        if (accion == null) {
            return null;
        }
        return new AccionDominanteResponseDTO(
                accion.getCitaId(),
                accion.getPacienteId(),
                accion.getPacienteNombre(),
                accion.getFecha() != null ? accion.getFecha().toString() : null,
                accion.getHora() != null ? accion.getHora().toString() : null,
                accion.getTipoCita(),
                accion.getModalidad(),
                accion.getDuracionMinutos(),
                accion.getConsultorio(),
                accion.getProtocolo(),
                accion.getIntakeListo(),
                accion.getConsentimientoFirmado(),
                accion.getGrabacionLeva()
        );
    }

    /**
     * Máscara operativa de la acción dominante para roles sin acceso clínico:
     * oculta {@code consentimientoFirmado} e {@code intakeListo}.
     */
    public AccionDominanteResponseDTO toResponseOperativo(AccionDominante accion) {
        if (accion == null) {
            return null;
        }
        return new AccionDominanteResponseDTO(
                accion.getCitaId(),
                accion.getPacienteId(),
                accion.getPacienteNombre(),
                accion.getFecha() != null ? accion.getFecha().toString() : null,
                accion.getHora() != null ? accion.getHora().toString() : null,
                accion.getTipoCita(),
                accion.getModalidad(),
                accion.getDuracionMinutos(),
                accion.getConsultorio(),
                accion.getProtocolo(),
                null,
                null,
                accion.getGrabacionLeva()
        );
    }

    /**
     * Resumen operativo del paciente para roles sin acceso clínico: mantiene el
     * tipo de respuesta estable ({@link PacienteResponseDTO}) pero anula los
     * campos clínicos (riskLevel, motif, sessionFrequency, capacidadConsentimiento
     * y consentimientoRepresentanteFirmado).
     */
    public PacienteResponseDTO toResumenOperativo(Paciente paciente) {
        PacienteResponseDTO completo = pacienteRestMapper.toResponse(paciente);
        if (completo == null) {
            return null;
        }
        return new PacienteResponseDTO(
                completo.id(),
                completo.name(),
                completo.phone(),
                completo.email(),
                completo.birthDate(),
                completo.curp(),
                completo.registrationDate(),
                completo.status(),
                null,
                completo.registryMode(),
                null,
                completo.therapistId(),
                completo.therapistName(),
                completo.fechaNacimiento(),
                completo.edadCalculada(),
                null,
                completo.quienCompletaRegistro(),
                completo.representante(),
                completo.telefonoPaciente(),
                null,
                null
        );
    }
}
