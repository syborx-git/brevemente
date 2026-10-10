package com.syborx.brevemente.constancia.infrastructure.adapters.in.rest;

import com.syborx.brevemente.auth.infrastructure.security.UsuarioAutenticado;
import com.syborx.brevemente.constancia.application.ports.in.ConstanciaUseCases;
import com.syborx.brevemente.constancia.infrastructure.adapters.in.rest.dto.ConstanciaFisicaCreateRequest;
import com.syborx.brevemente.constancia.infrastructure.adapters.in.rest.dto.ConstanciaFisicaResponseDTO;
import com.syborx.brevemente.constancia.infrastructure.adapters.in.rest.mapper.ConstanciaFisicaRestMapper;
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
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/constancias")
@RequiredArgsConstructor
@Tag(name = "Constancias", description = "Registro de constancias físicas emitidas (NOM-004-SSA3-2012)")
public class ConstanciaRestController {

    private final ConstanciaUseCases constanciaUseCases;
    private final ConstanciaFisicaRestMapper constanciaFisicaRestMapper;

    @GetMapping
    @PreAuthorize("hasAuthority('EXPEDIENTE_LEER')")
    @Operation(summary = "Listar constancias físicas de un paciente")
    public ResponseEntity<List<ConstanciaFisicaResponseDTO>> listar(@RequestParam String pacienteId) {
        return ResponseEntity.ok(constanciaUseCases.listarPorPaciente(pacienteId).stream()
                .map(constanciaFisicaRestMapper::toResponse).toList());
    }

    @PostMapping
    @PreAuthorize("hasAuthority('CONSTANCIAS_EMITIR')")
    @Operation(summary = "Registrar una constancia física")
    public ResponseEntity<ConstanciaFisicaResponseDTO> registrar(
            @Valid @RequestBody ConstanciaFisicaCreateRequest request,
            @AuthenticationPrincipal UsuarioAutenticado principal) {
        var constancia = constanciaFisicaRestMapper.toDomain(request);
        constancia.setRegistradoPorId(principal != null ? principal.sub() : null);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(constanciaFisicaRestMapper.toResponse(constanciaUseCases.registrar(constancia)));
    }

    @DeleteMapping("/{constanciaId}")
    @PreAuthorize("hasAuthority('CONSTANCIAS_EMITIR')")
    @Operation(summary = "Anular una constancia física")
    public ResponseEntity<Void> anular(@PathVariable String constanciaId) {
        constanciaUseCases.anular(constanciaId);
        return ResponseEntity.noContent().build();
    }
}
