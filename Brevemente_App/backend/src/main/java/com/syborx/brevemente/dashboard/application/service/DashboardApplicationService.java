package com.syborx.brevemente.dashboard.application.service;

import com.syborx.brevemente.cita.application.ports.out.CitaRepositoryPort;
import com.syborx.brevemente.cita.domain.model.Cita;
import com.syborx.brevemente.expediente.application.ports.out.SesionRepositoryPort;
import com.syborx.brevemente.expediente.domain.model.Sesion;
import com.syborx.brevemente.dashboard.application.ports.in.ListarAlertasDashboardUseCase;
import com.syborx.brevemente.dashboard.application.ports.in.ListarAlertasMayoriaEdadUseCase;
import com.syborx.brevemente.dashboard.application.ports.in.ListarCasosPorProtocoloUseCase;
import com.syborx.brevemente.dashboard.application.ports.in.ListarCitasHoyDashboardUseCase;
import com.syborx.brevemente.dashboard.application.ports.in.ListarCitasPorMesUseCase;
import com.syborx.brevemente.dashboard.application.ports.in.ListarDistribucionFasesUseCase;
import com.syborx.brevemente.dashboard.application.ports.in.ListarPacientesRecientesUseCase;
import com.syborx.brevemente.dashboard.application.ports.in.ListarPendientesPrioritariosUseCase;
import com.syborx.brevemente.dashboard.application.ports.in.ObtenerAccionDominanteUseCase;
import com.syborx.brevemente.dashboard.application.ports.in.ObtenerCatalogosDashboardUseCase;
import com.syborx.brevemente.dashboard.application.ports.in.ObtenerDashboardStatsUseCase;
import com.syborx.brevemente.dashboard.application.ports.out.DashboardCatalogosRepositoryPort;
import com.syborx.brevemente.dashboard.domain.model.AccionDominante;
import com.syborx.brevemente.dashboard.domain.model.AlcanceDashboard;
import com.syborx.brevemente.dashboard.domain.model.AlertaDashboard;
import com.syborx.brevemente.dashboard.domain.model.AlertaMayoriaEdad;
import com.syborx.brevemente.dashboard.domain.model.CasoProtocolo;
import com.syborx.brevemente.dashboard.domain.model.CatalogosDashboard;
import com.syborx.brevemente.dashboard.domain.model.DashboardFiltros;
import com.syborx.brevemente.dashboard.domain.model.DashboardStats;
import com.syborx.brevemente.dashboard.domain.model.DistribucionFase;
import com.syborx.brevemente.dashboard.domain.model.PendientePrioritario;
import com.syborx.brevemente.dashboard.domain.model.Protocolo;
import com.syborx.brevemente.dashboard.domain.model.SerieMes;
import com.syborx.brevemente.paciente.application.ports.out.PacienteRepositoryPort;
import com.syborx.brevemente.paciente.domain.model.Paciente;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
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
        ObtenerAccionDominanteUseCase,
        ListarCitasPorMesUseCase,
        ListarDistribucionFasesUseCase,
        ListarCasosPorProtocoloUseCase,
        ListarAlertasMayoriaEdadUseCase,
        ObtenerCatalogosDashboardUseCase,
        ListarPendientesPrioritariosUseCase {

    private static final ZoneId ZONA = ZoneId.of("America/Mexico_City");
    private static final List<String> ESTADOS_CITAS_HOY = List.of("confirmada", "pendiente", "solicita_reagendar");
    private static final List<String> ESTADOS_ACCION_DOMINANTE = List.of("confirmada", "pendiente");
    private static final List<String> NIVELES_RIESGO = List.of("medio", "alto");

    private static final DateTimeFormatter HORA_CITA = DateTimeFormatter.ofPattern("HH:mm");
    private static final String MOTIVO_PENDIENTE_CON_CITA =
            "Debe completar historia clínica y firmar consentimiento antes de su cita a las %s.";
    private static final String MOTIVO_PENDIENTE_SIN_CITA =
            "Pendiente de historia clínica y consentimiento de audio.";

    private final PacienteRepositoryPort pacienteRepositoryPort;
    private final CitaRepositoryPort citaRepositoryPort;
    private final DashboardCatalogosRepositoryPort dashboardCatalogosRepositoryPort;
    private final DashboardScopeResolver dashboardScopeResolver;
    private final SesionRepositoryPort sesionRepositoryPort;

    @Override
    public DashboardStats obtenerStats(DashboardFiltros filtros) {
        AlcanceDashboard alcance = alcance();
        Collection<String> ids = DashboardFiltrosResolver.terapeutaIdsEfectivos(alcance, filtros);

        if (DashboardFiltrosResolver.sinResultados(alcance, ids)) {
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
                .pacientesActivos(pacienteRepositoryPort.countByStatus("activo", ids,
                        filtros.sedeId(), filtros.protocoloId()))
                .citasHoyCount(citaRepositoryPort.countByDia(hoy, ESTADOS_CITAS_HOY, ids,
                        filtros.sedeId(), filtros.protocoloId(), filtros.modalidad()))
                .alertasConsentimiento(verAlertas
                        ? pacienteRepositoryPort.countConConsentimientoPendiente(ids, filtros.sedeId(), filtros.protocoloId())
                        : 0)
                .alertasRiesgo(verAlertas
                        ? pacienteRepositoryPort.countByRiskLevelIn(NIVELES_RIESGO, ids, filtros.sedeId(), filtros.protocoloId())
                        : 0)
                .pendientesClinicos(verAlertas
                        ? pacienteRepositoryPort.countByStatus("pendiente", ids, filtros.sedeId(), filtros.protocoloId())
                        : 0)
                .build();
    }

    @Override
    public List<Cita> listarCitasHoy(DashboardFiltros filtros) {
        AlcanceDashboard alcance = alcance();
        Collection<String> ids = DashboardFiltrosResolver.terapeutaIdsEfectivos(alcance, filtros);
        if (DashboardFiltrosResolver.sinResultados(alcance, ids)) {
            return List.of();
        }
        LocalDate hoy = LocalDate.now(ZONA);
        return citaRepositoryPort.findByDia(hoy, ESTADOS_CITAS_HOY, ids,
                filtros.sedeId(), filtros.protocoloId(), filtros.modalidad());
    }

    @Override
    public List<AlertaDashboard> listarAlertas(DashboardFiltros filtros) {
        AlcanceDashboard alcance = alcance();
        if (!alcance.puedeVerAlertasClinicas()) {
            return List.of();
        }
        Collection<String> ids = DashboardFiltrosResolver.terapeutaIdsEfectivos(alcance, filtros);
        if (DashboardFiltrosResolver.sinResultados(alcance, ids)) {
            return List.of();
        }

        List<AlertaDashboard> alertas = new ArrayList<>();

        pacienteRepositoryPort.findConConsentimientoPendiente(ids, filtros.sedeId(), filtros.protocoloId()).forEach(p ->
                alertas.add(AlertaDashboard.builder()
                        .id("consentimiento-" + p.getId())
                        .tipo("CONSENTIMIENTO")
                        .titulo("Consentimiento informado pendiente")
                        .descripcion(descripcionConsentimiento(p))
                        .pacienteId(p.getId())
                        .pacienteNombre(p.getNombreCompleto())
                        .build()));

        pacienteRepositoryPort.findByRiskLevelIn(NIVELES_RIESGO, ids, filtros.sedeId(), filtros.protocoloId()).forEach(p ->
                alertas.add(AlertaDashboard.builder()
                        .id("riesgo-" + p.getId())
                        .tipo("RIESGO")
                        .titulo("Riesgo clínico " + p.getRiskLevel())
                        .descripcion("El paciente presenta un nivel de riesgo '" + p.getRiskLevel()
                                + "'. Se recomienda priorizar su atención clínica.")
                        .pacienteId(p.getId())
                        .pacienteNombre(p.getNombreCompleto())
                        .build()));

        pacienteRepositoryPort.findByStatus("pendiente", ids, filtros.sedeId(), filtros.protocoloId()).forEach(p ->
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
    public List<Paciente> listarRecientes(int limit, DashboardFiltros filtros) {
        AlcanceDashboard alcance = alcance();
        Collection<String> ids = DashboardFiltrosResolver.terapeutaIdsEfectivos(alcance, filtros);
        if (DashboardFiltrosResolver.sinResultados(alcance, ids)) {
            return List.of();
        }
        int efectivo = Math.max(1, Math.min(limit, 20));
        return pacienteRepositoryPort.findRecientes(efectivo, ids, filtros.sedeId(), filtros.protocoloId());
    }

    @Override
    public Optional<AccionDominante> obtenerAccionDominante(DashboardFiltros filtros) {
        AlcanceDashboard alcance = alcance();
        Collection<String> ids = DashboardFiltrosResolver.terapeutaIdsEfectivos(alcance, filtros);
        if (DashboardFiltrosResolver.sinResultados(alcance, ids)) {
            return Optional.empty();
        }
        LocalDate hoy = LocalDate.now(ZONA);
        return citaRepositoryPort.findProximaDeHoy(hoy, ESTADOS_ACCION_DOMINANTE, ids,
                        filtros.sedeId(), filtros.protocoloId(), filtros.modalidad())
                .map(this::toAccionDominante);
    }

    @Override
    public List<SerieMes> listarCitasPorMes(DashboardFiltros filtros) {
        AlcanceDashboard alcance = alcance();
        Collection<String> ids = DashboardFiltrosResolver.terapeutaIdsEfectivos(alcance, filtros);
        if (DashboardFiltrosResolver.sinResultados(alcance, ids)) {
            return List.of();
        }
        return citaRepositoryPort.agruparPorMes(
                ids, filtros.sedeId(), filtros.protocoloId(), filtros.modalidad(), filtros.periodo());
    }

    @Override
    public List<DistribucionFase> listarDistribucionFases(DashboardFiltros filtros) {
        AlcanceDashboard alcance = alcance();
        Collection<String> ids = DashboardFiltrosResolver.terapeutaIdsEfectivos(alcance, filtros);
        if (DashboardFiltrosResolver.sinResultados(alcance, ids)) {
            return DistribucionFase.completar(List.of());
        }
        return DistribucionFase.completar(
                pacienteRepositoryPort.agruparPorFase(ids, filtros.sedeId(), filtros.protocoloId()));
    }

    @Override
    public List<CasoProtocolo> listarCasosPorProtocolo(DashboardFiltros filtros) {
        AlcanceDashboard alcance = alcance();
        Collection<String> ids = DashboardFiltrosResolver.terapeutaIdsEfectivos(alcance, filtros);
        List<String> catalogo = obtenerCatalogos().protocolos().stream()
                .map(Protocolo::nombre)
                .toList();
        if (DashboardFiltrosResolver.sinResultados(alcance, ids)) {
            return CasoProtocolo.completar(List.of(), catalogo);
        }
        return CasoProtocolo.completar(
                pacienteRepositoryPort.agruparPorProtocolo(ids, filtros.sedeId(), filtros.protocoloId()),
                catalogo);
    }

    @Override
    public List<AlertaMayoriaEdad> listarAlertasMayoriaEdad() {
        LocalDate corte = LocalDate.now(ZONA).minusYears(18);
        return pacienteRepositoryPort.findMayoriaEdad(corte);
    }

    @Override
    public CatalogosDashboard obtenerCatalogos() {
        return dashboardCatalogosRepositoryPort.obtenerCatalogos();
    }

    @Override
    public List<PendientePrioritario> listarPendientesPrioritarios(DashboardFiltros filtros) {
        AlcanceDashboard alcance = alcance();
        Collection<String> ids = DashboardFiltrosResolver.terapeutaIdsEfectivos(alcance, filtros);
        if (DashboardFiltrosResolver.sinResultados(alcance, ids)) {
            return List.of();
        }

        List<PendientePrioritario> pendientes = new ArrayList<>();
        for (Paciente paciente : pacienteRepositoryPort.findByStatus("pendiente", ids,
                filtros.sedeId(), filtros.protocoloId())) {
            String hora = citaRepositoryPort.findProximaPorPaciente(paciente.getId())
                    .map(c -> formatearHoraCita(c.getFechaHoraInicio()))
                    .orElse(null);
            pendientes.add(new PendientePrioritario(
                    paciente.getId(),
                    paciente.getNombreCompleto(),
                    hora,
                    hora != null
                            ? MOTIVO_PENDIENTE_CON_CITA.formatted(hora)
                            : MOTIVO_PENDIENTE_SIN_CITA));
        }
        pendientes.sort(Comparator.comparing(
                PendientePrioritario::horaCita, Comparator.nullsLast(String::compareTo)));
        return pendientes;
    }

    private String formatearHoraCita(OffsetDateTime fechaHoraInicio) {
        if (fechaHoraInicio == null) {
            return null;
        }
        LocalTime hora = fechaHoraInicio.atZoneSameInstant(ZONA).toLocalTime();
        return hora.format(HORA_CITA);
    }

    private AlcanceDashboard alcance() {
        return dashboardScopeResolver.resolver();
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
                .terapeutaNombre(cita.getTerapeutaId() != null
                        ? dashboardCatalogosRepositoryPort.findTerapeutaNombre(cita.getTerapeutaId()).orElse(null)
                        : null)
                .fecha(inicioLocal != null ? inicioLocal.toLocalDate() : null)
                .hora(inicioLocal != null ? inicioLocal.toLocalTime() : null)
                .tipoCita(cita.getTipoCita())
                .modalidad(cita.getModalidad())
                .duracionMinutos(cita.getDuracionMinutos())
                .consultorio(cita.getConsultorio())
                .protocolo(paciente != null && paciente.getProtocoloId() != null
                        ? dashboardCatalogosRepositoryPort.findProtocoloNombre(paciente.getProtocoloId()).orElse(null)
                        : null)
                .intakeListo(paciente != null && !"pendiente".equalsIgnoreCase(paciente.getStatus()))
                .consentimientoFirmado(consentimientoFirmado(paciente))
                .grabacionLeva(paciente != null && "ia".equalsIgnoreCase(paciente.getRegistryMode()))
                .motivoConsulta(paciente != null ? paciente.getMotivoConsulta() : null)
                .numeroSesion(numeroSesion(cita))
                .build();
    }

    private Integer numeroSesion(Cita cita) {
        if (cita.getId() != null) {
            Optional<Sesion> vinculada = sesionRepositoryPort.findByCitaId(cita.getId());
            if (vinculada.isPresent() && vinculada.get().getNumero() != null) {
                return vinculada.get().getNumero();
            }
        }
        if (cita.getExpedienteId() == null) {
            return null;
        }
        return sesionRepositoryPort.ultimoNumero(cita.getExpedienteId())
                .map(n -> n + 1)
                .orElse(1);
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
