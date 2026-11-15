package com.syborx.brevemente.dashboard.infrastructure.adapters.in.rest.mapper;

import com.syborx.brevemente.dashboard.domain.model.AccionDominante;
import com.syborx.brevemente.dashboard.domain.model.AlertaDashboard;
import com.syborx.brevemente.dashboard.domain.model.AlertaMayoriaEdad;
import com.syborx.brevemente.dashboard.domain.model.CasoProtocolo;
import com.syborx.brevemente.dashboard.domain.model.CatalogosDashboard;
import com.syborx.brevemente.dashboard.domain.model.DashboardStats;
import com.syborx.brevemente.dashboard.domain.model.DistribucionFase;
import com.syborx.brevemente.dashboard.domain.model.PendientePrioritario;
import com.syborx.brevemente.dashboard.domain.model.SerieMes;
import com.syborx.brevemente.dashboard.infrastructure.adapters.in.rest.dto.AccionDominanteResponseDTO;
import com.syborx.brevemente.dashboard.infrastructure.adapters.in.rest.dto.AlertaDashboardResponseDTO;
import com.syborx.brevemente.dashboard.infrastructure.adapters.in.rest.dto.AlertaMayoriaEdadDTO;
import com.syborx.brevemente.dashboard.infrastructure.adapters.in.rest.dto.CasoProtocoloDTO;
import com.syborx.brevemente.dashboard.infrastructure.adapters.in.rest.dto.CatalogosDashboardDTO;
import com.syborx.brevemente.dashboard.infrastructure.adapters.in.rest.dto.DashboardStatsResponseDTO;
import com.syborx.brevemente.dashboard.infrastructure.adapters.in.rest.dto.DistribucionFaseDTO;
import com.syborx.brevemente.dashboard.infrastructure.adapters.in.rest.dto.PendientePrioritarioDTO;
import com.syborx.brevemente.dashboard.infrastructure.adapters.in.rest.dto.ProtocoloDTO;
import com.syborx.brevemente.dashboard.infrastructure.adapters.in.rest.dto.SedeDTO;
import com.syborx.brevemente.dashboard.infrastructure.adapters.in.rest.dto.SerieMesDTO;
import com.syborx.brevemente.dashboard.infrastructure.adapters.in.rest.dto.TerapeutaDTO;
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
                stats.getPendientesClinicos(),
                stats.getCapacidadPct(),
                stats.getConfirmadasHoy()
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
                accion.getTerapeutaNombre(),
                accion.getFecha() != null ? accion.getFecha().toString() : null,
                accion.getHora() != null ? accion.getHora().toString() : null,
                accion.getTipoCita(),
                accion.getModalidad(),
                accion.getDuracionMinutos(),
                accion.getConsultorio(),
                accion.getProtocolo(),
                accion.getIntakeListo(),
                accion.getConsentimientoFirmado(),
                accion.getGrabacionLeva(),
                accion.getMotivoConsulta(),
                accion.getNumeroSesion()
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
                accion.getTerapeutaNombre(),
                accion.getFecha() != null ? accion.getFecha().toString() : null,
                accion.getHora() != null ? accion.getHora().toString() : null,
                accion.getTipoCita(),
                accion.getModalidad(),
                accion.getDuracionMinutos(),
                accion.getConsultorio(),
                accion.getProtocolo(),
                null,
                null,
                accion.getGrabacionLeva(),
                accion.getMotivoConsulta(),
                accion.getNumeroSesion()
        );
    }

    public SerieMesDTO toResponse(SerieMes serie) {
        if (serie == null) {
            return null;
        }
        return new SerieMesDTO(serie.month(), serie.citas());
    }

    public DistribucionFaseDTO toResponse(DistribucionFase fase) {
        if (fase == null) {
            return null;
        }
        return new DistribucionFaseDTO(fase.fase(), fase.valor());
    }

    public CasoProtocoloDTO toResponse(CasoProtocolo caso) {
        if (caso == null) {
            return null;
        }
        return new CasoProtocoloDTO(caso.protocolo(), caso.casos());
    }

    public AlertaMayoriaEdadDTO toResponse(AlertaMayoriaEdad alerta) {
        if (alerta == null) {
            return null;
        }
        return new AlertaMayoriaEdadDTO(
                alerta.pacienteId(),
                alerta.nombre(),
                alerta.fechaNacimiento(),
                alerta.representante()
        );
    }

    public PendientePrioritarioDTO toResponse(PendientePrioritario pendiente) {
        if (pendiente == null) {
            return null;
        }
        return new PendientePrioritarioDTO(
                pendiente.pacienteId(),
                pendiente.nombre(),
                pendiente.horaCita(),
                pendiente.motivo()
        );
    }

    public CatalogosDashboardDTO toResponse(CatalogosDashboard catalogos) {
        if (catalogos == null) {
            return null;
        }
        return new CatalogosDashboardDTO(
                catalogos.sedes() != null
                        ? catalogos.sedes().stream().map(this::toResponse).toList()
                        : java.util.List.of(),
                catalogos.protocolos() != null
                        ? catalogos.protocolos().stream().map(this::toResponse).toList()
                        : java.util.List.of(),
                catalogos.terapeutas() != null
                        ? catalogos.terapeutas().stream().map(this::toResponse).toList()
                        : java.util.List.of(),
                catalogos.modalidades()
        );
    }

    public SedeDTO toResponse(com.syborx.brevemente.dashboard.domain.model.Sede sede) {
        return sede == null ? null : new SedeDTO(sede.id(), sede.nombre(), sede.clues(), sede.licenciaSanitaria(), sede.tipoEstablecimiento());
    }

    private ProtocoloDTO toResponse(com.syborx.brevemente.dashboard.domain.model.Protocolo protocolo) {
        return protocolo == null ? null : new ProtocoloDTO(protocolo.id(), protocolo.nombre());
    }

    private TerapeutaDTO toResponse(com.syborx.brevemente.dashboard.domain.model.Terapeuta terapeuta) {
        return terapeuta == null ? null : new TerapeutaDTO(terapeuta.id(), terapeuta.nombre());
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
                null,
                completo.rfc(),
                completo.sexo(),
                completo.lugarNacimiento(),
                completo.estadoCivil(),
                completo.escolaridad(),
                completo.ocupacion(),
                completo.religion(),
                completo.domicilio(),
                completo.contactoEmergencia(),
                completo.sedeId()
        );
    }
}
