package com.syborx.brevemente.dashboard.infrastructure.adapters.in.rest;

import com.syborx.brevemente.cita.infrastructure.adapters.in.rest.dto.CitaResponseDTO;
import com.syborx.brevemente.cita.infrastructure.adapters.in.rest.mapper.CitaRestMapper;
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
import com.syborx.brevemente.dashboard.application.service.DashboardScopeResolver;
import com.syborx.brevemente.dashboard.domain.model.AccionDominante;
import com.syborx.brevemente.dashboard.domain.model.AlcanceDashboard;
import com.syborx.brevemente.dashboard.domain.model.DashboardFiltros;
import com.syborx.brevemente.dashboard.infrastructure.adapters.in.rest.dto.AccionDominanteResponseDTO;
import com.syborx.brevemente.dashboard.infrastructure.adapters.in.rest.dto.AlertaDashboardResponseDTO;
import com.syborx.brevemente.dashboard.infrastructure.adapters.in.rest.dto.AlertaMayoriaEdadDTO;
import com.syborx.brevemente.dashboard.infrastructure.adapters.in.rest.dto.CasoProtocoloDTO;
import com.syborx.brevemente.dashboard.infrastructure.adapters.in.rest.dto.CatalogosDashboardDTO;
import com.syborx.brevemente.dashboard.infrastructure.adapters.in.rest.dto.DashboardStatsResponseDTO;
import com.syborx.brevemente.dashboard.infrastructure.adapters.in.rest.dto.DistribucionFaseDTO;
import com.syborx.brevemente.dashboard.infrastructure.adapters.in.rest.dto.PendientePrioritarioDTO;
import com.syborx.brevemente.dashboard.infrastructure.adapters.in.rest.dto.SerieMesDTO;
import com.syborx.brevemente.dashboard.infrastructure.adapters.in.rest.mapper.DashboardRestMapper;
import com.syborx.brevemente.paciente.infrastructure.adapters.in.rest.dto.PacienteResponseDTO;
import com.syborx.brevemente.paciente.infrastructure.adapters.in.rest.mapper.PacienteRestMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "Centro de control clínico: métricas, alertas, agenda del día y acción dominante")
public class DashboardRestController {

    private final ObtenerDashboardStatsUseCase obtenerDashboardStatsUseCase;
    private final ListarCitasHoyDashboardUseCase listarCitasHoyDashboardUseCase;
    private final ListarAlertasDashboardUseCase listarAlertasDashboardUseCase;
    private final ListarPacientesRecientesUseCase listarPacientesRecientesUseCase;
    private final ObtenerAccionDominanteUseCase obtenerAccionDominanteUseCase;
    private final ListarCitasPorMesUseCase listarCitasPorMesUseCase;
    private final ListarDistribucionFasesUseCase listarDistribucionFasesUseCase;
    private final ListarCasosPorProtocoloUseCase listarCasosPorProtocoloUseCase;
    private final ListarAlertasMayoriaEdadUseCase listarAlertasMayoriaEdadUseCase;
    private final ObtenerCatalogosDashboardUseCase obtenerCatalogosDashboardUseCase;
    private final ListarPendientesPrioritariosUseCase listarPendientesPrioritariosUseCase;
    private final DashboardRestMapper dashboardRestMapper;
    private final CitaRestMapper citaRestMapper;
    private final PacienteRestMapper pacienteRestMapper;
    private final DashboardScopeResolver dashboardScopeResolver;

    @GetMapping("/stats")
    @PreAuthorize("hasAuthority('DASHBOARD_LEER')")
    @Operation(
            summary = "Obtener métricas del centro de control",
            description = "Calcula las métricas agregadas del panel principal: pacientes activos, citas de hoy, alertas de consentimiento, alertas de riesgo y pendientes clínicos."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Métricas calculadas exitosamente",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = DashboardStatsResponseDTO.class)
                    )
            )
    })
    public ResponseEntity<DashboardStatsResponseDTO> stats(
            @Parameter(description = "Modalidad de la cita (PRESENCIAL | ONLINE)") @RequestParam(required = false) String modalidad,
            @Parameter(description = "Identificador de la sede") @RequestParam(required = false) String sedeId,
            @Parameter(description = "Periodo (reservado)") @RequestParam(required = false) String periodo,
            @Parameter(description = "Identificador del terapeuta") @RequestParam(required = false) String terapeutaId,
            @Parameter(description = "Identificador del protocolo") @RequestParam(required = false) String protocoloId
    ) {
        DashboardFiltros filtros = DashboardFiltros.of(modalidad, sedeId, periodo, terapeutaId, protocoloId);
        return ResponseEntity.ok(dashboardRestMapper.toResponse(obtenerDashboardStatsUseCase.obtenerStats(filtros)));
    }

    @GetMapping("/citas-hoy")
    @PreAuthorize("hasAuthority('DASHBOARD_LEER')")
    @Operation(
            summary = "Listar citas de hoy",
            description = "Recupera las citas del día (zona America/Mexico_City) en estado confirmada, pendiente o solicita_reagendar, ordenadas por hora ascendente."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Agenda del día recuperada exitosamente",
                    content = @Content(
                            mediaType = "application/json",
                            array = @ArraySchema(schema = @Schema(implementation = CitaResponseDTO.class))
                    )
            )
    })
    public ResponseEntity<List<CitaResponseDTO>> citasHoy(
            @Parameter(description = "Modalidad de la cita (PRESENCIAL | ONLINE)") @RequestParam(required = false) String modalidad,
            @Parameter(description = "Identificador de la sede") @RequestParam(required = false) String sedeId,
            @Parameter(description = "Periodo (reservado)") @RequestParam(required = false) String periodo,
            @Parameter(description = "Identificador del terapeuta") @RequestParam(required = false) String terapeutaId,
            @Parameter(description = "Identificador del protocolo") @RequestParam(required = false) String protocoloId
    ) {
        DashboardFiltros filtros = DashboardFiltros.of(modalidad, sedeId, periodo, terapeutaId, protocoloId);
        List<CitaResponseDTO> responses = listarCitasHoyDashboardUseCase.listarCitasHoy(filtros).stream()
                .map(citaRestMapper::toResponse)
                .toList();
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/alertas")
    @PreAuthorize("hasAuthority('DASHBOARD_LEER')")
    @Operation(
            summary = "Listar alertas del centro de control",
            description = "Agrega las alertas de las tres fuentes independientes: consentimiento pendiente, riesgo clínico medio/alto y pacientes con atención pendiente."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Alertas recuperadas exitosamente",
                    content = @Content(
                            mediaType = "application/json",
                            array = @ArraySchema(schema = @Schema(implementation = AlertaDashboardResponseDTO.class))
                    )
            )
    })
    public ResponseEntity<List<AlertaDashboardResponseDTO>> alertas(
            @Parameter(description = "Identificador de la sede") @RequestParam(required = false) String sedeId,
            @Parameter(description = "Periodo (reservado)") @RequestParam(required = false) String periodo,
            @Parameter(description = "Identificador del terapeuta") @RequestParam(required = false) String terapeutaId,
            @Parameter(description = "Identificador del protocolo") @RequestParam(required = false) String protocoloId
    ) {
        DashboardFiltros filtros = DashboardFiltros.of(null, sedeId, periodo, terapeutaId, protocoloId);
        List<AlertaDashboardResponseDTO> responses = listarAlertasDashboardUseCase.listarAlertas(filtros).stream()
                .map(dashboardRestMapper::toResponse)
                .toList();
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/pacientes-recientes")
    @PreAuthorize("hasAuthority('DASHBOARD_LEER')")
    @Operation(
            summary = "Listar pacientes recientes",
            description = "Recupera los pacientes más recientes ordenados por fecha de creación descendente."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Pacientes recientes recuperados exitosamente",
                    content = @Content(
                            mediaType = "application/json",
                            array = @ArraySchema(schema = @Schema(implementation = PacienteResponseDTO.class))
                    )
            )
    })
    public ResponseEntity<List<PacienteResponseDTO>> pacientesRecientes(
            @Parameter(description = "Número máximo de pacientes a recuperar (mínimo 1, máximo 20)", example = "5")
            @RequestParam(defaultValue = "5") int limit,
            @Parameter(description = "Identificador de la sede") @RequestParam(required = false) String sedeId,
            @Parameter(description = "Periodo (reservado)") @RequestParam(required = false) String periodo,
            @Parameter(description = "Identificador del terapeuta") @RequestParam(required = false) String terapeutaId,
            @Parameter(description = "Identificador del protocolo") @RequestParam(required = false) String protocoloId
    ) {
        AlcanceDashboard alcance = dashboardScopeResolver.resolver();
        DashboardFiltros filtros = DashboardFiltros.of(null, sedeId, periodo, terapeutaId, protocoloId);
        List<PacienteResponseDTO> responses = listarPacientesRecientesUseCase.listarRecientes(limit, filtros).stream()
                .map(p -> alcance.puedeVerAlertasClinicas()
                        ? pacienteRestMapper.toResponse(p)
                        : dashboardRestMapper.toResumenOperativo(p))
                .toList();
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/accion-dominante")
    @PreAuthorize("hasAuthority('DASHBOARD_LEER')")
    @Operation(
            summary = "Obtener la acción operativa dominante del día",
            description = "Devuelve la primera cita de hoy en estado confirmada o pendiente, ordenada por hora ascendente. Devuelve 204 si no existe."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Acción dominante encontrada",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = AccionDominanteResponseDTO.class)
                    )
            ),
            @ApiResponse(responseCode = "204", description = "No hay citas confirmadas o pendientes para hoy")
    })
    public ResponseEntity<AccionDominanteResponseDTO> accionDominante(
            @Parameter(description = "Modalidad de la cita (PRESENCIAL | ONLINE)") @RequestParam(required = false) String modalidad,
            @Parameter(description = "Identificador de la sede") @RequestParam(required = false) String sedeId,
            @Parameter(description = "Periodo (reservado)") @RequestParam(required = false) String periodo,
            @Parameter(description = "Identificador del terapeuta") @RequestParam(required = false) String terapeutaId,
            @Parameter(description = "Identificador del protocolo") @RequestParam(required = false) String protocoloId
    ) {
        DashboardFiltros filtros = DashboardFiltros.of(modalidad, sedeId, periodo, terapeutaId, protocoloId);
        Optional<AccionDominante> accion = obtenerAccionDominanteUseCase.obtenerAccionDominante(filtros);
        if (accion.isEmpty()) {
            return ResponseEntity.noContent().build();
        }
        AlcanceDashboard alcance = dashboardScopeResolver.resolver();
        AccionDominanteResponseDTO response = alcance.puedeVerAlertasClinicas()
                ? dashboardRestMapper.toResponse(accion.get())
                : dashboardRestMapper.toResponseOperativo(accion.get());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/citas-por-mes")
    @PreAuthorize("hasAuthority('DASHBOARD_LEER')")
    @Operation(
            summary = "Serie mensual de citas",
            description = "Agrupa todas las citas (sin filtrar por estado) por mes dentro del rango derivado del periodo, con scoping por rol y filtros de sede, protocolo y modalidad."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Serie mensual recuperada exitosamente",
                    content = @Content(
                            mediaType = "application/json",
                            array = @ArraySchema(schema = @Schema(implementation = SerieMesDTO.class))
                    )
            )
    })
    public ResponseEntity<List<SerieMesDTO>> citasPorMes(
            @Parameter(description = "Modalidad de la cita (PRESENCIAL | ONLINE)") @RequestParam(required = false) String modalidad,
            @Parameter(description = "Identificador de la sede") @RequestParam(required = false) String sedeId,
            @Parameter(description = "Periodo de agregación (hoy | semana | mes)") @RequestParam(required = false) String periodo,
            @Parameter(description = "Identificador del terapeuta") @RequestParam(required = false) String terapeutaId,
            @Parameter(description = "Identificador del protocolo") @RequestParam(required = false) String protocoloId
    ) {
        DashboardFiltros filtros = DashboardFiltros.of(modalidad, sedeId, periodo, terapeutaId, protocoloId);
        List<SerieMesDTO> responses = listarCitasPorMesUseCase.listarCitasPorMes(filtros).stream()
                .map(dashboardRestMapper::toResponse)
                .toList();
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/distribucion-fases")
    @PreAuthorize("hasAuthority('DASHBOARD_LEER')")
    @Operation(
            summary = "Distribución de pacientes por Fase TBE",
            description = "Deriva la fase TBE de status + riskLevel y cuenta pacientes por fase, con scoping por rol y filtros de sede y protocolo."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Distribución por fase recuperada exitosamente",
                    content = @Content(
                            mediaType = "application/json",
                            array = @ArraySchema(schema = @Schema(implementation = DistribucionFaseDTO.class))
                    )
            )
    })
    public ResponseEntity<List<DistribucionFaseDTO>> distribucionFases(
            @Parameter(description = "Identificador de la sede") @RequestParam(required = false) String sedeId,
            @Parameter(description = "Periodo (reservado)") @RequestParam(required = false) String periodo,
            @Parameter(description = "Identificador del terapeuta") @RequestParam(required = false) String terapeutaId,
            @Parameter(description = "Identificador del protocolo") @RequestParam(required = false) String protocoloId
    ) {
        DashboardFiltros filtros = DashboardFiltros.of(null, sedeId, periodo, terapeutaId, protocoloId);
        List<DistribucionFaseDTO> responses = listarDistribucionFasesUseCase.listarDistribucionFases(filtros).stream()
                .map(dashboardRestMapper::toResponse)
                .toList();
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/casos-por-protocolo")
    @PreAuthorize("hasAuthority('DASHBOARD_LEER')")
    @Operation(
            summary = "Casos activos agrupados por protocolo",
            description = "Agrupa pacientes por protocolo clínico (nombre canónico) con scoping por rol y filtros de sede y protocolo."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Casos por protocolo recuperados exitosamente",
                    content = @Content(
                            mediaType = "application/json",
                            array = @ArraySchema(schema = @Schema(implementation = CasoProtocoloDTO.class))
                    )
            )
    })
    public ResponseEntity<List<CasoProtocoloDTO>> casosPorProtocolo(
            @Parameter(description = "Identificador de la sede") @RequestParam(required = false) String sedeId,
            @Parameter(description = "Periodo (reservado)") @RequestParam(required = false) String periodo,
            @Parameter(description = "Identificador del terapeuta") @RequestParam(required = false) String terapeutaId,
            @Parameter(description = "Identificador del protocolo") @RequestParam(required = false) String protocoloId
    ) {
        DashboardFiltros filtros = DashboardFiltros.of(null, sedeId, periodo, terapeutaId, protocoloId);
        List<CasoProtocoloDTO> responses = listarCasosPorProtocoloUseCase.listarCasosPorProtocolo(filtros).stream()
                .map(dashboardRestMapper::toResponse)
                .toList();
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/alertas-mayoria-edad")
    @PreAuthorize("hasAuthority('DASHBOARD_LEER')")
    @Operation(
            summary = "Alertas de mayoría de edad cumplida",
            description = "Pacientes en estado REPRESENTADO_POR_EDAD que ya cumplieron 18 años y requieren reconsentimiento autónomo. No filtrado por rol (paridad con la demo)."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Alertas de mayoría de edad recuperadas exitosamente",
                    content = @Content(
                            mediaType = "application/json",
                            array = @ArraySchema(schema = @Schema(implementation = AlertaMayoriaEdadDTO.class))
                    )
            )
    })
    public ResponseEntity<List<AlertaMayoriaEdadDTO>> alertasMayoriaEdad() {
        List<AlertaMayoriaEdadDTO> responses = listarAlertasMayoriaEdadUseCase.listarAlertasMayoriaEdad().stream()
                .map(dashboardRestMapper::toResponse)
                .toList();
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/catalogos")
    @PreAuthorize("hasAuthority('DASHBOARD_LEER')")
    @Operation(
            summary = "Catálogos de apoyo del centro de control",
            description = "Devuelve sedes, protocolos activos, terapeutas (id + nombre de visualización) y modalidades canónicas."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Catálogos recuperados exitosamente",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = CatalogosDashboardDTO.class)
                    )
            )
    })
    public ResponseEntity<CatalogosDashboardDTO> catalogos() {
        return ResponseEntity.ok(dashboardRestMapper.toResponse(obtenerCatalogosDashboardUseCase.obtenerCatalogos()));
    }

    @GetMapping("/pendientes-prioritarios")
    @PreAuthorize("hasAuthority('DASHBOARD_LEER')")
    @Operation(
            summary = "Pacientes con admisión clínica pendiente",
            description = "Lista pacientes en estado pendiente (scoped por rol) priorizados por la hora de su próxima cita."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Pendientes prioritarios recuperados exitosamente",
                    content = @Content(
                            mediaType = "application/json",
                            array = @ArraySchema(schema = @Schema(implementation = PendientePrioritarioDTO.class))
                    )
            )
    })
    public ResponseEntity<List<PendientePrioritarioDTO>> pendientesPrioritarios(
            @Parameter(description = "Identificador de la sede") @RequestParam(required = false) String sedeId,
            @Parameter(description = "Periodo (reservado)") @RequestParam(required = false) String periodo,
            @Parameter(description = "Identificador del terapeuta") @RequestParam(required = false) String terapeutaId,
            @Parameter(description = "Identificador del protocolo") @RequestParam(required = false) String protocoloId
    ) {
        DashboardFiltros filtros = DashboardFiltros.of(null, sedeId, periodo, terapeutaId, protocoloId);
        List<PendientePrioritarioDTO> responses = listarPendientesPrioritariosUseCase
                .listarPendientesPrioritarios(filtros).stream()
                .map(dashboardRestMapper::toResponse)
                .toList();
        return ResponseEntity.ok(responses);
    }
}
