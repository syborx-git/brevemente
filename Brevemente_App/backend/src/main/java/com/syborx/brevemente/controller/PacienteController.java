package com.syborx.brevemente.controller;

import com.syborx.brevemente.dto.PacienteCreateRequest;
import com.syborx.brevemente.dto.PacientePatchRequest;
import com.syborx.brevemente.dto.PacienteResponseDTO;
import com.syborx.brevemente.service.PacienteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/pacientes")
@RequiredArgsConstructor
public class PacienteController {

    private final PacienteService pacienteService;

    @GetMapping
    public ResponseEntity<List<PacienteResponseDTO>> listar() {
        return ResponseEntity.ok(pacienteService.listarTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PacienteResponseDTO> buscarPorId(@PathVariable String id) {
        return ResponseEntity.ok(pacienteService.obtenerPorId(id));
    }

    @PostMapping
    public ResponseEntity<PacienteResponseDTO> crear(@Valid @RequestBody PacienteCreateRequest request) {
        PacienteResponseDTO creado = pacienteService.crearPaciente(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<PacienteResponseDTO> actualizar(
            @PathVariable String id,
            @RequestBody PacientePatchRequest cambios
    ) {
        return ResponseEntity.ok(pacienteService.actualizarPaciente(id, cambios));
    }
}
