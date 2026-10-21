package com.syborx.brevemente.supervision.infrastructure.adapters.in.rest;

import com.syborx.brevemente.auth.infrastructure.security.UsuarioAutenticado;
import com.syborx.brevemente.supervision.application.ports.in.SupervisionBitacoraUseCases;
import com.syborx.brevemente.supervision.application.ports.in.SupervisionSolicitudUseCases;
import com.syborx.brevemente.supervision.infrastructure.adapters.in.rest.dto.SupervisionLogCreateRequest;
import com.syborx.brevemente.supervision.infrastructure.adapters.in.rest.dto.SupervisionLogResponseDTO;
import com.syborx.brevemente.supervision.infrastructure.adapters.in.rest.dto.SupervisionSolicitudCreateRequest;
import com.syborx.brevemente.supervision.infrastructure.adapters.in.rest.dto.SupervisionSolicitudResponseDTO;
import com.syborx.brevemente.supervision.infrastructure.adapters.in.rest.mapper.SupervisionRestMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/supervision")
@RequiredArgsConstructor
@Tag(name = "Supervisión", description = "Bitácoras y solicitudes de supervisión clínica")
public class SupervisionRestController {

    private final SupervisionBitacoraUseCases bitacoraUseCases;
    private final SupervisionSolicitudUseCases solicitudUseCases;
    private final SupervisionRestMapper supervisionRestMapper;

    @GetMapping("/bitacoras")
    @PreAuthorize("hasAuthority('SUPERVISION_LEER')")
    @Operation(summary = "Listar bitácoras de supervisión de un paciente")
    public ResponseEntity<List<SupervisionLogResponseDTO>> listarBitacoras(
            @RequestParam String pacienteId, @AuthenticationPrincipal UsuarioAutenticado principal) {
        List<String> terapeutaIds = principal != null ? principal.terapeutaIds() : List.of();
        boolean esEvaluador = esEvaluador(principal);
        return ResponseEntity.ok(bitacoraUseCases.listarPorPaciente(pacienteId, terapeutaIds, esEvaluador).stream()
                .map(supervisionRestMapper::toResponse).toList());
    }

    @PostMapping("/bitacoras")
    @PreAuthorize("hasAnyAuthority('SUPERVISION_EVALUAR','SUPERVISION_REGISTRAR')")
    @Operation(summary = "Registrar una bitácora de supervisión")
    public ResponseEntity<SupervisionLogResponseDTO> registrarBitacora(
            @Valid @RequestBody SupervisionLogCreateRequest request) {
        var creada = bitacoraUseCases.registrar(supervisionRestMapper.toDomain(request));
        return ResponseEntity.status(HttpStatus.CREATED).body(supervisionRestMapper.toResponse(creada));
    }

    @DeleteMapping("/bitacoras/{bitacoraId}")
    @PreAuthorize("hasAnyAuthority('SUPERVISION_EVALUAR','SUPERVISION_REGISTRAR')")
    @Operation(summary = "Eliminar una bitácora de supervisión")
    public ResponseEntity<Void> eliminarBitacora(
            @PathVariable String bitacoraId, @AuthenticationPrincipal UsuarioAutenticado principal) {
        List<String> terapeutaIds = principal != null ? principal.terapeutaIds() : List.of();
        bitacoraUseCases.eliminar(bitacoraId, terapeutaIds, esEvaluador(principal));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/solicitudes")
    @PreAuthorize("hasAuthority('SUPERVISION_LEER')")
    @Operation(summary = "Listar solicitudes de supervisión de un paciente")
    public ResponseEntity<List<SupervisionSolicitudResponseDTO>> listarSolicitudes(
            @RequestParam String pacienteId, @AuthenticationPrincipal UsuarioAutenticado principal) {
        List<String> terapeutaIds = principal != null ? principal.terapeutaIds() : List.of();
        return ResponseEntity.ok(solicitudUseCases.listarPorPaciente(pacienteId, terapeutaIds, esEvaluador(principal)).stream()
                .map(supervisionRestMapper::toResponse).toList());
    }

    @PostMapping("/solicitudes")
    @PreAuthorize("hasAuthority('EXPEDIENTE_ESCRIBIR')")
    @Operation(summary = "Crear una solicitud de supervisión")
    public ResponseEntity<SupervisionSolicitudResponseDTO> crearSolicitud(
            @Valid @RequestBody SupervisionSolicitudCreateRequest request,
            @AuthenticationPrincipal UsuarioAutenticado principal) {
        var creada = solicitudUseCases.crear(
                request.pacienteId(), request.reason(),
                principal != null ? principal.sub() : null,
                principal != null ? principal.terapeutaIds() : List.of());
        return ResponseEntity.status(HttpStatus.CREATED).body(supervisionRestMapper.toResponse(creada));
    }

    @PatchMapping("/solicitudes/{solicitudId}/atender")
    @PreAuthorize("hasAuthority('SUPERVISION_EVALUAR')")
    @Operation(summary = "Atender una solicitud de supervisión")
    public ResponseEntity<SupervisionSolicitudResponseDTO> atenderSolicitud(
            @PathVariable String solicitudId, @AuthenticationPrincipal UsuarioAutenticado principal) {
        var atendida = solicitudUseCases.atender(solicitudId, principal != null ? principal.sub() : null);
        return ResponseEntity.ok(supervisionRestMapper.toResponse(atendida));
    }

    private boolean esEvaluador(UsuarioAutenticado principal) {
        if (principal == null || principal.authorities() == null) return false;
        return principal.authorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(a -> a.equals("SUPERVISION_EVALUAR")
                        || a.equals("ROLE_ADMIN_PLATFORM")
                        || a.equals("ROLE_ADMIN_CLINICAL"));
    }
}
