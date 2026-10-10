package com.syborx.brevemente.pago.infrastructure.adapters.in.rest;

import com.syborx.brevemente.auth.infrastructure.security.UsuarioAutenticado;
import com.syborx.brevemente.pago.application.ports.in.PagoUseCases;
import com.syborx.brevemente.pago.infrastructure.adapters.in.rest.dto.PagoCreateRequest;
import com.syborx.brevemente.pago.infrastructure.adapters.in.rest.dto.PagoEstadoRequest;
import com.syborx.brevemente.pago.infrastructure.adapters.in.rest.dto.PagoResponseDTO;
import com.syborx.brevemente.pago.infrastructure.adapters.in.rest.mapper.PagoRestMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
@RequestMapping("/pagos")
@RequiredArgsConstructor
@Tag(name = "Pagos", description = "Registro financiero de sesiones por paciente")
public class PagoRestController {

    private final PagoUseCases pagoUseCases;
    private final PagoRestMapper pagoRestMapper;

    @GetMapping
    @PreAuthorize("hasAuthority('PAGOS_LEER')")
    @Operation(summary = "Listar pagos de un paciente")
    public ResponseEntity<List<PagoResponseDTO>> listar(@RequestParam String pacienteId) {
        return ResponseEntity.ok(pagoUseCases.listarPorPaciente(pacienteId).stream()
                .map(pagoRestMapper::toResponse).toList());
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PAGOS_GESTIONAR')")
    @Operation(summary = "Registrar un pago")
    public ResponseEntity<PagoResponseDTO> registrar(
            @Valid @RequestBody PagoCreateRequest request,
            @AuthenticationPrincipal UsuarioAutenticado principal) {
        var pago = pagoRestMapper.toDomain(request);
        pago.setRegistradoPorId(principal != null ? principal.sub() : null);
        return ResponseEntity.status(HttpStatus.CREATED).body(pagoRestMapper.toResponse(pagoUseCases.registrar(pago)));
    }

    @PatchMapping("/{pagoId}/estado")
    @PreAuthorize("hasAuthority('PAGOS_GESTIONAR')")
    @Operation(summary = "Cambiar el estado de un pago")
    public ResponseEntity<PagoResponseDTO> cambiarEstado(
            @PathVariable String pagoId,
            @Valid @RequestBody PagoEstadoRequest request) {
        return ResponseEntity.ok(pagoRestMapper.toResponse(pagoUseCases.cambiarEstado(pagoId, request.estado())));
    }

    @DeleteMapping("/{pagoId}")
    @PreAuthorize("hasAuthority('PAGOS_GESTIONAR')")
    @Operation(summary = "Eliminar un pago")
    public ResponseEntity<Void> eliminar(@PathVariable String pagoId) {
        pagoUseCases.eliminar(pagoId);
        return ResponseEntity.noContent().build();
    }
}
