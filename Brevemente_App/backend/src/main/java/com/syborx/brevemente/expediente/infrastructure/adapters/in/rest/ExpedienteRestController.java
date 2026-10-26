package com.syborx.brevemente.expediente.infrastructure.adapters.in.rest;

import com.syborx.brevemente.expediente.application.ports.in.ActualizarExpedienteUseCase;
import com.syborx.brevemente.expediente.application.ports.in.ActualizarSesionUseCase;
import com.syborx.brevemente.expediente.application.ports.in.AgregarSesionUseCase;
import com.syborx.brevemente.expediente.application.ports.in.GuardarCriteriosSesionUseCase;
import com.syborx.brevemente.expediente.application.ports.in.ListarCriteriosSesionUseCase;
import com.syborx.brevemente.expediente.application.ports.in.ListarOpcionesConductualesUseCase;
import com.syborx.brevemente.expediente.application.ports.in.ListarSesionesUseCase;
import com.syborx.brevemente.expediente.application.ports.in.ObtenerExpedienteUseCase;
import com.syborx.brevemente.auth.infrastructure.security.UsuarioAutenticado;
import com.syborx.brevemente.expediente.domain.model.CriterioClinico;
import com.syborx.brevemente.expediente.infrastructure.adapters.in.rest.dto.CriterioClinicoRequest;
import com.syborx.brevemente.expediente.infrastructure.adapters.in.rest.dto.CriterioClinicoResponseDTO;
import com.syborx.brevemente.expediente.infrastructure.adapters.in.rest.dto.ExpedienteResponseDTO;
import com.syborx.brevemente.expediente.infrastructure.adapters.in.rest.dto.ExpedienteUpdateRequest;
import com.syborx.brevemente.expediente.infrastructure.adapters.in.rest.dto.OpcionConductualResponseDTO;
import com.syborx.brevemente.expediente.infrastructure.adapters.in.rest.dto.SesionCreateRequest;
import com.syborx.brevemente.expediente.infrastructure.adapters.in.rest.dto.SesionResponseDTO;
import com.syborx.brevemente.expediente.infrastructure.adapters.in.rest.dto.SesionUpdateRequest;
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
import org.springframework.web.bind.annotation.PutMapping;
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
    private final ActualizarSesionUseCase actualizarSesionUseCase;
    private final ListarCriteriosSesionUseCase listarCriteriosSesionUseCase;
    private final GuardarCriteriosSesionUseCase guardarCriteriosSesionUseCase;
    private final ListarOpcionesConductualesUseCase listarOpcionesConductualesUseCase;
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

    @GetMapping("/sesiones/borradores")
    @PreAuthorize("hasAuthority('EXPEDIENTE_LEER')")
    @Operation(summary = "Listar borradores de sesión del terapeuta autenticado")
    public ResponseEntity<List<SesionResponseDTO>> borradores(
            @AuthenticationPrincipal UsuarioAutenticado principal) {
        List<String> terapeutaIds = principal != null ? principal.terapeutaIds() : List.of();
        return ResponseEntity.ok(listarSesionesUseCase.listarBorradores(terapeutaIds).stream()
                .map(sesionRestMapper::toResponse)
                .toList());
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
                principal != null ? principal.sub() : null,
                principal != null ? principal.terapeutaIds() : List.of());
        return ResponseEntity.status(HttpStatus.CREATED).body(sesionRestMapper.toResponse(creada));
    }

    @PatchMapping("/sesiones/{sesionId}")
    @PreAuthorize("hasAuthority('EXPEDIENTE_ESCRIBIR')")
    @Operation(summary = "Editar una sesión clínica TBE (PATCH parcial)")
    public ResponseEntity<SesionResponseDTO> actualizarSesion(
            @PathVariable String sesionId,
            @Valid @RequestBody SesionUpdateRequest request,
            @AuthenticationPrincipal UsuarioAutenticado principal) {
        var actualizada = actualizarSesionUseCase.actualizar(
                sesionId, sesionRestMapper.toParcial(request),
                principal != null ? principal.sub() : null);
        return ResponseEntity.ok(sesionRestMapper.toResponse(actualizada));
    }

    @GetMapping("/sesiones/{sesionId}/criterios")
    @PreAuthorize("hasAuthority('EXPEDIENTE_LEER')")
    @Operation(summary = "Listar criterios clínicos de una sesión")
    public ResponseEntity<List<CriterioClinicoResponseDTO>> criterios(@PathVariable String sesionId) {
        List<CriterioClinicoResponseDTO> body = listarCriteriosSesionUseCase.listar(sesionId).stream()
                .map(c -> new CriterioClinicoResponseDTO(c.id(), c.categoria(), c.valor()))
                .toList();
        return ResponseEntity.ok(body);
    }

    @PutMapping("/sesiones/{sesionId}/criterios")
    @PreAuthorize("hasAuthority('EXPEDIENTE_ESCRIBIR')")
    @Operation(summary = "Reemplazar los criterios clínicos de una sesión")
    public ResponseEntity<List<CriterioClinicoResponseDTO>> guardarCriterios(
            @PathVariable String sesionId,
            @Valid @RequestBody List<CriterioClinicoRequest> request,
            @AuthenticationPrincipal UsuarioAutenticado principal) {
        List<CriterioClinico> dominios = request == null ? List.of() : request.stream()
                .map(r -> new CriterioClinico(null, null, r.categoria(), r.valor()))
                .toList();
        List<CriterioClinicoResponseDTO> body = guardarCriteriosSesionUseCase
                .guardar(sesionId, dominios, principal != null ? principal.sub() : null).stream()
                .map(c -> new CriterioClinicoResponseDTO(c.id(), c.categoria(), c.valor()))
                .toList();
        return ResponseEntity.ok(body);
    }

    @GetMapping("/catalogos/opciones-conductuales")
    @PreAuthorize("hasAuthority('EXPEDIENTE_LEER')")
    @Operation(summary = "Catálogo de opciones del criterio conductual (#107)")
    public ResponseEntity<List<OpcionConductualResponseDTO>> opcionesConductuales() {
        List<OpcionConductualResponseDTO> body = listarOpcionesConductualesUseCase.listar().stream()
                .map(o -> new OpcionConductualResponseDTO(o.codigo(), o.etiqueta(), o.orden()))
                .toList();
        return ResponseEntity.ok(body);
    }
}
