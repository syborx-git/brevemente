package com.syborx.brevemente.dashboard.application.service;

import com.syborx.brevemente.cita.application.ports.out.CitaRepositoryPort;
import com.syborx.brevemente.cita.domain.model.Cita;
import com.syborx.brevemente.dashboard.application.ports.in.ListarAlertasDashboardUseCase;
import com.syborx.brevemente.dashboard.application.ports.in.ListarCitasHoyDashboardUseCase;
import com.syborx.brevemente.dashboard.application.ports.in.ListarPacientesRecientesUseCase;
import com.syborx.brevemente.dashboard.application.ports.in.ObtenerAccionDominanteUseCase;
import com.syborx.brevemente.dashboard.application.ports.in.ObtenerDashboardStatsUseCase;
import com.syborx.brevemente.dashboard.domain.model.AccionDominante;
import com.syborx.brevemente.dashboard.domain.model.AlcanceDashboard;
import com.syborx.brevemente.dashboard.domain.model.AlcanceDashboard.TipoAlcance;
import com.syborx.brevemente.dashboard.domain.model.AlertaDashboard;
import com.syborx.brevemente.dashboard.domain.model.DashboardStats;
import com.syborx.brevemente.paciente.application.ports.out.PacienteRepositoryPort;
import com.syborx.brevemente.paciente.domain.model.Paciente;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardApplicationService implements
        ObtenerDashboardStatsUseCase,
        ListarCitasHoyDashboardUseCase,
        ListarAlertasDashboardUseCase,
        ListarPacientesRecientesUseCase,
        ObtenerAccionDominanteUseCase {

    private static final ZoneId ZONA = ZoneId.of("America/Mexico_City");
    private static final List<String> ESTADOS_CITAS_HOY = List.of("confirmada", "pendiente", "solicita_reagendar");
    private static final List<String> ESTADOS_ACCION_DOMINANTE = List.of("confirmada", "pendiente");
    private static final List<String> NIVELES_RIESGO = List.of("medio", "alto");

    private final PacienteRepositoryPort pacienteRepositoryPort;
    private final CitaRepositoryPort citaRepositoryPort;
    private final DashboardScopeResolver dashboardScopeResolver;

    @Override
    public DashboardStats obtenerStats() {
        AlcanceDashboard alcance = alcance();
        Collection<String> ids = terapeutaIds(alcance);

        if (alcance.tipo() == TipoAlcance.SCOPED && ids.isEmpty()) {
            return DashboardStats.builder()
                    .pacientesActivos(0)
                    .citasHoyCount(0)
                    .alertasConsentimiento(0)
                    .alertasRiesgo(0)
                    .pendientesClinicos(0)
                    .build();
        }

        LocalDate hoy = LocalDate.now(ZONA);
        boolean verAlertas = alcance.puedeVerAlertasClinicas();
        return DashboardStats.builder()
                .pacientesActivos(pacienteRepositoryPort.countByStatus("activo", ids))
                .citasHoyCount(citaRepositoryPort.countByDia(hoy, ESTADOS_CITAS_HOY, ids))
                .alertasConsentimiento(verAlertas ? pacienteRepositoryPort.countConConsentimientoPendiente(ids) : 0)
                .alertasRiesgo(verAlertas ? pacienteRepositoryPort.countByRiskLevelIn(NIVELES_RIESGO, ids) : 0)
                .pendientesClinicos(verAlertas ? pacienteRepositoryPort.countByStatus("pendiente", ids) : 0)
                .build();
    }

    @Override
    public List<Cita> listarCitasHoy() {
        AlcanceDashboard alcance = alcance();
        Collection<String> ids = terapeutaIds(alcance);
        if (alcance.tipo() == TipoAlcance.SCOPED && ids.isEmpty()) {
            return List.of();
        }
        LocalDate hoy = LocalDate.now(ZONA);
        return citaRepositoryPort.findByDia(hoy, ESTADOS_CITAS_HOY, ids);
    }

    @Override
    public List<AlertaDashboard> listarAlertas() {
        AlcanceDashboard alcance = alcance();
        if (!alcance.puedeVerAlertasClinicas()) {
            return List.of();
        }
        Collection<String> ids = terapeutaIds(alcance);
        if (alcance.tipo() == TipoAlcance.SCOPED && ids.isEmpty()) {
            return List.of();
        }

        List<AlertaDashboard> alertas = new ArrayList<>();

        pacienteRepositoryPort.findConConsentimientoPendiente(ids).forEach(p ->
                alertas.add(AlertaDashboard.builder()
                        .id("consentimiento-" + p.getId())
                        .tipo("CONSENTIMIENTO")
                        .titulo("Consentimiento informado pendiente")
                        .descripcion(descripcionConsentimiento(p))
                        .pacienteId(p.getId())
                        .pacienteNombre(p.getNombreCompleto())
                        .build()));

        pacienteRepositoryPort.findByRiskLevelIn(NIVELES_RIESGO, ids).forEach(p ->
                alertas.add(AlertaDashboard.builder()
                        .id("riesgo-" + p.getId())
                        .tipo("RIESGO")
                        .titulo("Riesgo clínico " + p.getRiskLevel())
                        .descripcion("El paciente presenta un nivel de riesgo '" + p.getRiskLevel()
                                + "'. Se recomienda priorizar su atención clínica.")
                        .pacienteId(p.getId())
                        .pacienteNombre(p.getNombreCompleto())
                        .build()));

        pacienteRepositoryPort.findByStatus("pendiente", ids).forEach(p ->
                alertas.add(AlertaDashboard.builder()
                        .id("clinico-" + p.getId())
                        .tipo("PENDIENTE_CLINICO")
                        .titulo("Paciente con atención pendiente")
                        .descripcion("El expediente del paciente se encuentra en estado 'pendiente'.")
                        .pacienteId(p.getId())
                        .pacienteNombre(p.getNombreCompleto())
                        .build()));

        return alertas;
    }

    @Override
    public List<Paciente> listarRecientes(int limit) {
        AlcanceDashboard alcance = alcance();
        Collection<String> ids = terapeutaIds(alcance);
        if (alcance.tipo() == TipoAlcance.SCOPED && ids.isEmpty()) {
            return List.of();
        }
        int efectivo = Math.max(1, Math.min(limit, 20));
        return pacienteRepositoryPort.findRecientes(efectivo, ids);
    }

    @Override
    public Optional<AccionDominante> obtenerAccionDominante() {
        AlcanceDashboard alcance = alcance();
        Collection<String> ids = terapeutaIds(alcance);
        if (alcance.tipo() == TipoAlcance.SCOPED && ids.isEmpty()) {
            return Optional.empty();
        }
        LocalDate hoy = LocalDate.now(ZONA);
        return citaRepositoryPort.findProximaDeHoy(hoy, ESTADOS_ACCION_DOMINANTE, ids)
                .map(this::toAccionDominante);
    }

    private AlcanceDashboard alcance() {
        return dashboardScopeResolver.resolver();
    }

    private Collection<String> terapeutaIds(AlcanceDashboard alcance) {
        return alcance.tipo() == TipoAlcance.GLOBAL ? null : alcance.terapeutaIds();
    }

    private AccionDominante toAccionDominante(Cita cita) {
        ZonedDateTime inicioLocal = cita.getFechaHoraInicio() != null
                ? cita.getFechaHoraInicio().atZoneSameInstant(ZONA)
                : null;
        Paciente paciente = cita.getPacienteId() != null
                ? pacienteRepositoryPort.findById(cita.getPacienteId()).orElse(null)
                : null;

        return AccionDominante.builder()
                .citaId(cita.getId())
                .pacienteId(cita.getPacienteId())
                .pacienteNombre(cita.getPacienteNombre() != null
                        ? cita.getPacienteNombre()
                        : (paciente != null ? paciente.getNombreCompleto() : null))
                .fecha(inicioLocal != null ? inicioLocal.toLocalDate() : null)
                .hora(inicioLocal != null ? inicioLocal.toLocalTime() : null)
                .tipoCita(cita.getTipoCita())
                .modalidad(cita.getModalidad())
                .duracionMinutos(cita.getDuracionMinutos())
                .consultorio(cita.getConsultorio())
                .protocolo(null)
                .intakeListo(false)
                .consentimientoFirmado(consentimientoFirmado(paciente))
                .grabacionLeva(false)
                .build();
    }

    private boolean consentimientoFirmado(Paciente paciente) {
        if (paciente == null) {
            return false;
        }
        String estado = paciente.getCapacidadConsentimiento() != null
                ? paciente.getCapacidadConsentimiento().estado()
                : null;
        if ("FIRMADO_TITULAR".equals(estado) || "AUTONOMO".equals(estado)) {
            return true;
        }
        if ("REPRESENTADO_POR_EDAD".equals(estado)) {
            return Boolean.TRUE.equals(paciente.getConsentimientoRepresentanteFirmado());
        }
        return false;
    }

    private String descripcionConsentimiento(Paciente paciente) {
        String estado = paciente.getCapacidadConsentimiento() != null
                ? paciente.getCapacidadConsentimiento().estado()
                : null;
        if ("REPRESENTADO_POR_EDAD".equals(estado)) {
            return "Paciente menor de edad con la firma del representante legal pendiente.";
        }
        return "El paciente tiene el consentimiento informado pendiente de firma.";
    }
}
