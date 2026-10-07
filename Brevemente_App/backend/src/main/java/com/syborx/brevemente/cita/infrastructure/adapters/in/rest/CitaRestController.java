package com.syborx.brevemente.cita.infrastructure.adapters.in.rest;

import com.syborx.brevemente.cita.application.ports.in.ActualizarEstadoCitaUseCase;
import com.syborx.brevemente.cita.application.ports.in.AgendarCitaUseCase;
import com.syborx.brevemente.cita.application.ports.in.ListarCitasUseCase;
import com.syborx.brevemente.cita.application.ports.in.ReprogramarCitaUseCase;
import com.syborx.brevemente.cita.domain.model.CitaFiltro;
import com.syborx.brevemente.cita.infrastructure.adapters.in.rest.dto.CitaCreateRequest;
import com.syborx.brevemente.cita.infrastructure.adapters.in.rest.dto.CitaEstadoRequest;
import com.syborx.brevemente.cita.infrastructure.adapters.in.rest.dto.CitaReprogramarRequest;
import com.syborx.brevemente.cita.infrastructure.adapters.in.rest.dto.CitaResponseDTO;
import com.syborx.brevemente.cita.infrastructure.adapters.in.rest.mapper.CitaRestMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/citas")
@RequiredArgsConstructor
@Tag(name = "Citas", description = "Gestión de la agenda de citas clínicas")
public class CitaRestController {

    private final ListarCitasUseCase listarCitasUseCase;
    private final AgendarCitaUseCase agendarCitaUseCase;
    private final ActualizarEstadoCitaUseCase actualizarEstadoCitaUseCase;
    private final ReprogramarCitaUseCase reprogramarCitaUseCase;
    private final CitaRestMapper citaRestMapper;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('AGENDA_LEER','AGENDA_GESTIONAR','MIS_CITAS_LEER')")
    @Operation(summary = "Listar citas de la agenda")
    public ResponseEntity<List<CitaResponseDTO>> listar(
            @RequestParam(required = false) String terapeutaId,
            @RequestParam(required = false) String consultorio,
            @RequestParam(required = false) String modalidad,
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta
    ) {
        CitaFiltro filtro = new CitaFiltro(terapeutaId, null, consultorio, modalidad, estado, desde, hasta);
        List<CitaResponseDTO> responses = listarCitasUseCase.listar(filtro).stream()
                .map(citaRestMapper::toResponse)
                .toList();
        return ResponseEntity.ok(responses);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('AGENDA_GESTIONAR')")
    @Operation(summary = "Agendar una cita")
    public ResponseEntity<CitaResponseDTO> agendar(@Valid @RequestBody CitaCreateRequest request) {
        CitaResponseDTO response = citaRestMapper.toResponse(
                agendarCitaUseCase.agendar(citaRestMapper.toDomain(request)));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PatchMapping("/{id}/estado")
    @PreAuthorize("hasAuthority('AGENDA_GESTIONAR')")
    @Operation(summary = "Cambiar el estado de una cita")
    public ResponseEntity<CitaResponseDTO> actualizarEstado(
            @PathVariable String id, @Valid @RequestBody CitaEstadoRequest request) {
        CitaResponseDTO response = citaRestMapper.toResponse(
                actualizarEstadoCitaUseCase.actualizarEstado(id, request.status()));
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAuthority('AGENDA_GESTIONAR')")
    @Operation(summary = "Reprogramar una cita")
    public ResponseEntity<CitaResponseDTO> reprogramar(
            @PathVariable String id, @RequestBody CitaReprogramarRequest request) {
        CitaResponseDTO response = citaRestMapper.toResponse(
                reprogramarCitaUseCase.reprogramar(id, citaRestMapper.toReprogramacion(request)));
        return ResponseEntity.ok(response);
    }
}
