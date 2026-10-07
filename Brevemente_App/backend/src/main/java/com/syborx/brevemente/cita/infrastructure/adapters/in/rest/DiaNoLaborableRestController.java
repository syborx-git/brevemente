package com.syborx.brevemente.cita.infrastructure.adapters.in.rest;

import com.syborx.brevemente.cita.application.ports.in.GestionarDiasNoLaborablesUseCase;
import com.syborx.brevemente.cita.infrastructure.adapters.in.rest.dto.DiaNoLaborableDTO;
import com.syborx.brevemente.cita.infrastructure.adapters.in.rest.mapper.DiaNoLaborableRestMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/dias-no-laborables")
@RequiredArgsConstructor
@Tag(name = "Días no laborables", description = "Festivos oficiales y días personales de la agenda")
public class DiaNoLaborableRestController {

    private final GestionarDiasNoLaborablesUseCase gestionarDiasNoLaborablesUseCase;
    private final DiaNoLaborableRestMapper diaNoLaborableRestMapper;

    @GetMapping
    @PreAuthorize("hasAuthority('AGENDA_LEER')")
    @Operation(summary = "Listar días no laborables")
    public ResponseEntity<List<DiaNoLaborableDTO>> listar() {
        List<DiaNoLaborableDTO> responses = gestionarDiasNoLaborablesUseCase.listar().stream()
                .map(diaNoLaborableRestMapper::toResponse)
                .toList();
        return ResponseEntity.ok(responses);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('AGENDA_GESTIONAR')")
    @Operation(summary = "Crear un día personal no laborable")
    public ResponseEntity<DiaNoLaborableDTO> crear(@RequestBody DiaNoLaborableDTO request) {
        DiaNoLaborableDTO response = diaNoLaborableRestMapper.toResponse(
                gestionarDiasNoLaborablesUseCase.crear(diaNoLaborableRestMapper.toDomain(request)));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('AGENDA_GESTIONAR')")
    @Operation(summary = "Eliminar un día no laborable")
    public ResponseEntity<Void> eliminar(@PathVariable String id) {
        gestionarDiasNoLaborablesUseCase.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
