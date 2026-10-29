package com.syborx.brevemente.dashboard.infrastructure.adapters.in.rest;

import com.syborx.brevemente.dashboard.application.ports.in.ObtenerSedeUseCase;
import com.syborx.brevemente.dashboard.infrastructure.adapters.in.rest.dto.SedeDTO;
import com.syborx.brevemente.dashboard.infrastructure.adapters.in.rest.mapper.DashboardRestMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/sedes")
@RequiredArgsConstructor
@Tag(name = "Sedes", description = "Consulta individual de la sede del establecimiento")
public class SedeRestController {

    private final ObtenerSedeUseCase obtenerSedeUseCase;
    private final DashboardRestMapper dashboardRestMapper;

    @GetMapping("/{sedeId}")
    @PreAuthorize("hasAuthority('EXPEDIENTE_LEER')")
    @Operation(summary = "Obtener una sede por su identificador")
    public ResponseEntity<SedeDTO> obtener(@PathVariable String sedeId) {
        return obtenerSedeUseCase.obtenerSede(sedeId)
                .map(s -> ResponseEntity.ok(dashboardRestMapper.toResponse(s)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
