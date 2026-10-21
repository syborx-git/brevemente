package com.syborx.brevemente.auditoria.infrastructure.adapters.in.rest;

import com.syborx.brevemente.auditoria.application.ports.in.ListarAuditoriaExpedienteUseCase;
import com.syborx.brevemente.auditoria.infrastructure.adapters.in.rest.dto.AuditoriaExpedienteResponseDTO;
import com.syborx.brevemente.auditoria.infrastructure.adapters.in.rest.mapper.AuditoriaExpedienteRestMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/expedientes")
@RequiredArgsConstructor
@Tag(name = "Auditoría del Expediente", description = "Bitácora clínica inmutable por paciente")
public class AuditoriaExpedienteRestController {

    private final ListarAuditoriaExpedienteUseCase listarAuditoriaExpedienteUseCase;
    private final AuditoriaExpedienteRestMapper auditoriaExpedienteRestMapper;

    @GetMapping("/paciente/{pacienteId}/auditoria")
    @PreAuthorize("hasAuthority('EXPEDIENTE_LEER')")
    @Operation(summary = "Listar la bitácora de auditoría clínica de un paciente")
    public ResponseEntity<List<AuditoriaExpedienteResponseDTO>> listar(@PathVariable String pacienteId) {
        return ResponseEntity.ok(listarAuditoriaExpedienteUseCase.listarPorPaciente(pacienteId).stream()
                .map(auditoriaExpedienteRestMapper::toResponse).toList());
    }
}
