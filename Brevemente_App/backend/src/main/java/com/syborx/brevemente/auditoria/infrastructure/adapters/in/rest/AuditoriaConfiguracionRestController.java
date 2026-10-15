package com.syborx.brevemente.auditoria.infrastructure.adapters.in.rest;

import com.syborx.brevemente.auditoria.application.ports.in.ListarAuditoriaConfiguracionUseCase;
import com.syborx.brevemente.auditoria.infrastructure.adapters.in.rest.dto.AuditoriaConfiguracionResponseDTO;
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
@RequestMapping("/auditoria/configuracion")
@RequiredArgsConstructor
@Tag(name = "Auditoría de Configuración", description = "Bitácora de cambios en la configuración del terapeuta")
public class AuditoriaConfiguracionRestController {

    private final ListarAuditoriaConfiguracionUseCase listarAuditoriaConfiguracionUseCase;

    @GetMapping("/{terapeutaId}")
    @PreAuthorize("hasAnyAuthority('CONFIGURACION_SISTEMA','SUPERVISION_LEER','MI_CONSULTA_LEER')")
    @Operation(summary = "Listar la bitácora de configuración de un terapeuta")
    public ResponseEntity<List<AuditoriaConfiguracionResponseDTO>> listar(@PathVariable String terapeutaId) {
        return ResponseEntity.ok(listarAuditoriaConfiguracionUseCase.listarPorTerapeuta(terapeutaId).stream()
                .map(a -> new AuditoriaConfiguracionResponseDTO(
                        a.id(),
                        a.terapeutaId(),
                        a.campo(),
                        a.valorAnterior(),
                        a.valorNuevo(),
                        a.usuarioId(),
                        a.usuarioNombre(),
                        a.createdAt()
                ))
                .toList());
    }
}
