package com.syborx.brevemente.expediente.infrastructure.adapters.in.rest;

import com.syborx.brevemente.expediente.application.ports.in.ActualizarExpedienteUseCase;
import com.syborx.brevemente.expediente.application.ports.in.AgregarSesionUseCase;
import com.syborx.brevemente.expediente.application.ports.in.ListarSesionesUseCase;
import com.syborx.brevemente.expediente.application.ports.in.ObtenerExpedienteUseCase;
import com.syborx.brevemente.auth.infrastructure.security.UsuarioAutenticado;
import com.syborx.brevemente.expediente.infrastructure.adapters.in.rest.dto.ExpedienteResponseDTO;
import com.syborx.brevemente.expediente.infrastructure.adapters.in.rest.dto.ExpedienteUpdateRequest;
import com.syborx.brevemente.expediente.infrastructure.adapters.in.rest.dto.SesionCreateRequest;
import com.syborx.brevemente.expediente.infrastructure.adapters.in.rest.dto.SesionResponseDTO;
import com.syborx.brevemente.expediente.infrastructure.adapters.in.rest.mapper.ExpedienteRestMapper;
import com.syborx.brevemente.expediente.infrastructure.adapters.in.rest.mapper.SesionRestMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/expedientes")
@RequiredArgsConstructor
@Tag(name = "Expedientes", description = "Expediente clínico TBE: formulación, sesiones y notas de evolución")
public class ExpedienteRestController {

    private final ObtenerExpedienteUseCase obtenerExpedienteUseCase;
    private final ActualizarExpedienteUseCase actualizarExpedienteUseCase;
    private final ListarSesionesUseCase listarSesionesUseCase;
    private final AgregarSesionUseCase agregarSesionUseCase;
    private final ExpedienteRestMapper expedienteRestMapper;
    private final SesionRestMapper sesionRestMapper;

    @GetMapping("/paciente/{pacienteId}")
    @PreAuthorize("hasAuthority('EXPEDIENTE_LEER')")
    @Operation(summary = "Consultar expediente clínico por paciente")
    public ResponseEntity<ExpedienteResponseDTO> obtener(@PathVariable String pacienteId) {
        return ResponseEntity.ok(
                expedienteRestMapper.toResponse(obtenerExpedienteUseCase.obtenerPorPaciente(pacienteId)));
    }

    @PatchMapping("/paciente/{pacienteId}")
    @PreAuthorize("hasAuthority('EXPEDIENTE_ESCRIBIR')")
    @Operation(summary = "Actualizar formulación TBE y expediente psiquiátrico")
    public ResponseEntity<ExpedienteResponseDTO> actualizar(
            @PathVariable String pacienteId,
            @Valid @RequestBody ExpedienteUpdateRequest request,
            @AuthenticationPrincipal UsuarioAutenticado principal) {
        var actualizado = actualizarExpedienteUseCase.actualizar(
                pacienteId, expedienteRestMapper.toParcial(request),
                principal != null ? principal.sub() : null);
        return ResponseEntity.ok(expedienteRestMapper.toResponse(actualizado));
    }

    @GetMapping("/paciente/{pacienteId}/sesiones")
    @PreAuthorize("hasAuthority('EXPEDIENTE_LEER')")
    @Operation(summary = "Listar sesiones del expediente de un paciente")
    public ResponseEntity<List<SesionResponseDTO>> sesiones(@PathVariable String pacienteId) {
        List<SesionResponseDTO> body = listarSesionesUseCase.listarPorPaciente(pacienteId).stream()
                .map(sesionRestMapper::toResponse)
                .toList();
        return ResponseEntity.ok(body);
    }

    @PostMapping("/paciente/{pacienteId}/sesiones")
    @PreAuthorize("hasAuthority('EXPEDIENTE_ESCRIBIR')")
    @Operation(summary = "Registrar una nueva sesión clínica TBE")
    public ResponseEntity<SesionResponseDTO> agregarSesion(
            @PathVariable String pacienteId,
            @Valid @RequestBody SesionCreateRequest request,
            @AuthenticationPrincipal UsuarioAutenticado principal) {
        var creada = agregarSesionUseCase.agregar(
                pacienteId, sesionRestMapper.toDomain(pacienteId, request),
                principal != null ? principal.sub() : null);
        return ResponseEntity.status(HttpStatus.CREATED).body(sesionRestMapper.toResponse(creada));
    }
}
