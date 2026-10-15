package com.syborx.brevemente.paciente.infrastructure.adapters.in.rest;

import com.syborx.brevemente.paciente.application.ports.in.ActualizarConfigTerapeutaUseCase;
import com.syborx.brevemente.paciente.application.ports.in.ActualizarSedesTerapeutaUseCase;
import com.syborx.brevemente.paciente.application.ports.in.ObtenerConfigTerapeutaUseCase;
import com.syborx.brevemente.paciente.infrastructure.adapters.in.rest.dto.TerapeutaConfigRequestDTO;
import com.syborx.brevemente.paciente.infrastructure.adapters.in.rest.dto.TerapeutaConfigResponseDTO;
import com.syborx.brevemente.paciente.infrastructure.adapters.in.rest.dto.TerapeutaSedeDTO;
import com.syborx.brevemente.paciente.infrastructure.adapters.in.rest.dto.TerapeutaSedeRequestDTO;
import com.syborx.brevemente.paciente.infrastructure.adapters.in.rest.mapper.TerapeutaConfigRestMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/mi-consulta")
@RequiredArgsConstructor
@Tag(name = "Mi Consulta", description = "Configuración del terapeuta")
public class MiConsultaRestController {

    private final ObtenerConfigTerapeutaUseCase obtenerConfigUseCase;
    private final ActualizarConfigTerapeutaUseCase actualizarConfigUseCase;
    private final ActualizarSedesTerapeutaUseCase actualizarSedesUseCase;
    private final TerapeutaConfigRestMapper mapper;

    @GetMapping
    @PreAuthorize("hasAuthority('MI_CONSULTA_LEER')")
    @Operation(summary = "Obtener la configuración del terapeuta")
    public ResponseEntity<TerapeutaConfigResponseDTO> obtenerConfig(
            @RequestParam(required = false) String terapeutaId) {
        return ResponseEntity.ok(mapper.toResponse(obtenerConfigUseCase.obtenerConfig(terapeutaId)));
    }

    @PutMapping
    @PreAuthorize("hasAuthority('MI_CONSULTA_EDITAR')")
    @Operation(summary = "Actualizar la configuración del terapeuta")
    public ResponseEntity<TerapeutaConfigResponseDTO> actualizarConfig(
            @RequestParam(required = false) String terapeutaId,
            @Valid @RequestBody TerapeutaConfigRequestDTO request) {
        return ResponseEntity.ok(mapper.toResponse(
                actualizarConfigUseCase.actualizarConfig(terapeutaId, mapper.toDatos(request))));
    }

    @PutMapping("/sedes")
    @PreAuthorize("hasAuthority('MI_CONSULTA_EDITAR')")
    @Operation(summary = "Reemplazar las sedes de atención del terapeuta")
    public ResponseEntity<List<TerapeutaSedeDTO>> actualizarSedes(
            @RequestParam(required = false) String terapeutaId,
            @RequestBody List<TerapeutaSedeRequestDTO> request) {
        return ResponseEntity.ok(mapper.toSedesResponse(
                actualizarSedesUseCase.actualizarSedes(terapeutaId, mapper.toSedesDatos(request))));
    }
}
