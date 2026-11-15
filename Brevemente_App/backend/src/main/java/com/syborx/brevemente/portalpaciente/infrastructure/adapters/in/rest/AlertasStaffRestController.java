package com.syborx.brevemente.portalpaciente.infrastructure.adapters.in.rest;

import com.syborx.brevemente.portalpaciente.application.ports.in.AlertaStaffUseCases;
import com.syborx.brevemente.portalpaciente.infrastructure.adapters.in.rest.dto.AlertaStaffResponseDTO;
import com.syborx.brevemente.portalpaciente.infrastructure.adapters.in.rest.mapper.AlertaStaffRestMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Alertas de crisis/seguridad clínica para el staff (vista "Requieren Atención
 * Urgente"). Scope Global/Scoped resuelto por rol.
 */
@RestController
@RequestMapping("/alertas")
@RequiredArgsConstructor
@Tag(name = "Alertas Staff", description = "Alertas de crisis y seguridad clínica para el equipo clínico")
public class AlertasStaffRestController {

    private final AlertaStaffUseCases alertaStaffUseCases;
    private final AlertaStaffRestMapper mapper;

    @GetMapping("/activas")
    @PreAuthorize("hasAuthority('MI_CONSULTA_LEER')")
    @Operation(summary = "Listar alertas activas (crisis/seguridad_clinica) de los pacientes del terapeuta autenticado")
    public ResponseEntity<List<AlertaStaffResponseDTO>> activas() {
        List<AlertaStaffResponseDTO> responses = alertaStaffUseCases.listarActivas().stream()
                .map(mapper::toResponse)
                .toList();
        return ResponseEntity.ok(responses);
    }

    @PatchMapping("/{id}/resolver")
    @PreAuthorize("hasAuthority('ALERTAS_GESTIONAR')")
    @Operation(summary = "Resolver una alerta de crisis del paciente")
    public ResponseEntity<AlertaStaffResponseDTO> resolver(@PathVariable String id) {
        return ResponseEntity.ok(mapper.toResponse(alertaStaffUseCases.resolver(id)));
    }
}
