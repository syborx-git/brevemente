package com.syborx.brevemente.portalpaciente.infrastructure.adapters.in.rest;

import com.syborx.brevemente.cita.infrastructure.adapters.in.rest.dto.CitaResponseDTO;
import com.syborx.brevemente.cita.infrastructure.adapters.in.rest.mapper.CitaRestMapper;
import com.syborx.brevemente.portalpaciente.application.ports.in.EscalarCrisisUseCase;
import com.syborx.brevemente.portalpaciente.application.ports.in.ListarAlertasPortalUseCase;
import com.syborx.brevemente.portalpaciente.application.ports.in.ListarCitasPortalUseCase;
import com.syborx.brevemente.portalpaciente.application.ports.in.ListarSesionesPortalUseCase;
import com.syborx.brevemente.portalpaciente.application.ports.in.ObtenerContraReferenciaPortalUseCase;
import com.syborx.brevemente.portalpaciente.application.ports.in.ObtenerPerfilPortalUseCase;
import com.syborx.brevemente.portalpaciente.domain.model.ContraReferencia;
import com.syborx.brevemente.portalpaciente.infrastructure.adapters.in.rest.dto.AlertaPacienteResponseDTO;
import com.syborx.brevemente.portalpaciente.infrastructure.adapters.in.rest.dto.ContraReferenciaResponseDTO;
import com.syborx.brevemente.portalpaciente.infrastructure.adapters.in.rest.dto.EscalarCrisisRequest;
import com.syborx.brevemente.portalpaciente.infrastructure.adapters.in.rest.dto.PortalPerfilResponseDTO;
import com.syborx.brevemente.portalpaciente.infrastructure.adapters.in.rest.dto.SesionPortalResponseDTO;
import com.syborx.brevemente.portalpaciente.infrastructure.adapters.in.rest.mapper.PortalPacienteRestMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/portal-paciente")
@RequiredArgsConstructor
@Tag(name = "Portal Paciente", description = "Portal de consulta del paciente autenticado")
public class PacientePortalRestController {

    private final ObtenerPerfilPortalUseCase obtenerPerfilPortalUseCase;
    private final ListarCitasPortalUseCase listarCitasPortalUseCase;
    private final ListarSesionesPortalUseCase listarSesionesPortalUseCase;
    private final EscalarCrisisUseCase escalarCrisisUseCase;
    private final ListarAlertasPortalUseCase listarAlertasPortalUseCase;
    private final ObtenerContraReferenciaPortalUseCase obtenerContraReferenciaPortalUseCase;
    private final PortalPacienteRestMapper portalMapper;
    private final CitaRestMapper citaRestMapper;

    @GetMapping("/perfil")
    @PreAuthorize("hasAuthority('MIS_CITAS_LEER')")
    @Operation(summary = "Obtener el perfil propio del paciente (encabezado del portal)")
    public ResponseEntity<PortalPerfilResponseDTO> perfil() {
        return ResponseEntity.ok(portalMapper.toPerfilResponse(obtenerPerfilPortalUseCase.obtenerPerfil()));
    }

    @GetMapping("/citas")
    @PreAuthorize("hasAuthority('MIS_CITAS_LEER')")
    @Operation(summary = "Listar las citas propias del paciente autenticado")
    public ResponseEntity<List<CitaResponseDTO>> citas() {
        List<CitaResponseDTO> responses = listarCitasPortalUseCase.listarCitas().stream()
                .map(citaRestMapper::toResponse)
                .toList();
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/sesiones")
    @PreAuthorize("hasAuthority('MIS_SESIONES_LEER')")
    @Operation(summary = "Listar las sesiones con prescripciones propias del paciente")
    public ResponseEntity<List<SesionPortalResponseDTO>> sesiones() {
        List<SesionPortalResponseDTO> responses = listarSesionesPortalUseCase.listarSesiones().stream()
                .map(portalMapper::toSesionResponse)
                .toList();
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/alertas")
    @PreAuthorize("hasAuthority('MIS_CITAS_LEER')")
    @Operation(summary = "Listar las alertas dirigidas al paciente (activas y resueltas)")
    public ResponseEntity<List<AlertaPacienteResponseDTO>> alertas() {
        List<AlertaPacienteResponseDTO> responses = listarAlertasPortalUseCase.listarAlertas().stream()
                .map(portalMapper::toAlertaResponse)
                .toList();
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/contra-referencia")
    @PreAuthorize("hasAuthority('MIS_CITAS_LEER')")
    @Operation(summary = "Obtener la contra-referencia aprobada más reciente del paciente")
    public ResponseEntity<ContraReferenciaResponseDTO> contraReferencia() {
        Optional<ContraReferencia> contraReferencia =
                obtenerContraReferenciaPortalUseCase.obtenerContraReferencia();
        return contraReferencia
                .map(cr -> ResponseEntity.ok(portalMapper.toContraReferenciaResponse(cr)))
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PostMapping("/crisis")
    @PreAuthorize("hasAuthority('MIS_CITAS_LEER')")
    @Operation(summary = "Escalar una crisis del paciente y notificar al equipo clínico")
    public ResponseEntity<AlertaPacienteResponseDTO> escalarCrisis(
            @Valid @RequestBody EscalarCrisisRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(portalMapper.toAlertaResponse(escalarCrisisUseCase.escalar(request.mensaje())));
    }
}
