package com.syborx.brevemente.dashboard.infrastructure.adapters.in.rest;

import com.syborx.brevemente.cita.infrastructure.adapters.in.rest.dto.CitaResponseDTO;
import com.syborx.brevemente.cita.infrastructure.adapters.in.rest.mapper.CitaRestMapper;
import com.syborx.brevemente.dashboard.application.ports.in.ListarAlertasDashboardUseCase;
import com.syborx.brevemente.dashboard.application.ports.in.ListarCitasHoyDashboardUseCase;
import com.syborx.brevemente.dashboard.application.ports.in.ListarPacientesRecientesUseCase;
import com.syborx.brevemente.dashboard.application.ports.in.ObtenerAccionDominanteUseCase;
import com.syborx.brevemente.dashboard.application.ports.in.ObtenerDashboardStatsUseCase;
import com.syborx.brevemente.dashboard.application.service.DashboardScopeResolver;
import com.syborx.brevemente.dashboard.domain.model.AccionDominante;
import com.syborx.brevemente.dashboard.domain.model.AlcanceDashboard;
import com.syborx.brevemente.dashboard.infrastructure.adapters.in.rest.dto.AccionDominanteResponseDTO;
import com.syborx.brevemente.dashboard.infrastructure.adapters.in.rest.dto.AlertaDashboardResponseDTO;
import com.syborx.brevemente.dashboard.infrastructure.adapters.in.rest.dto.DashboardStatsResponseDTO;
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
    public ResponseEntity<DashboardStatsResponseDTO> stats() {
        return ResponseEntity.ok(dashboardRestMapper.toResponse(obtenerDashboardStatsUseCase.obtenerStats()));
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
    public ResponseEntity<List<CitaResponseDTO>> citasHoy() {
        List<CitaResponseDTO> responses = listarCitasHoyDashboardUseCase.listarCitasHoy().stream()
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
    public ResponseEntity<List<AlertaDashboardResponseDTO>> alertas() {
        List<AlertaDashboardResponseDTO> responses = listarAlertasDashboardUseCase.listarAlertas().stream()
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
            @RequestParam(defaultValue = "5") int limit
    ) {
        AlcanceDashboard alcance = dashboardScopeResolver.resolver();
        List<PacienteResponseDTO> responses = listarPacientesRecientesUseCase.listarRecientes(limit).stream()
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
    public ResponseEntity<AccionDominanteResponseDTO> accionDominante() {
        Optional<AccionDominante> accion = obtenerAccionDominanteUseCase.obtenerAccionDominante();
        if (accion.isEmpty()) {
            return ResponseEntity.noContent().build();
        }
        AlcanceDashboard alcance = dashboardScopeResolver.resolver();
        AccionDominanteResponseDTO response = alcance.puedeVerAlertasClinicas()
                ? dashboardRestMapper.toResponse(accion.get())
                : dashboardRestMapper.toResponseOperativo(accion.get());
        return ResponseEntity.ok(response);
    }
}
