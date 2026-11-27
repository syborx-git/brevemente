package com.syborx.brevemente.plataforma.infrastructure.adapters.in.rest;

import com.syborx.brevemente.cita.application.ports.in.ListarCitasUseCase;
import com.syborx.brevemente.cita.domain.model.CitaFiltro;
import com.syborx.brevemente.cita.infrastructure.adapters.in.rest.dto.CitaResponseDTO;
import com.syborx.brevemente.cita.infrastructure.adapters.in.rest.mapper.CitaRestMapper;
import com.syborx.brevemente.paciente.application.ports.in.ListarPacientesUseCase;
import com.syborx.brevemente.paciente.infrastructure.adapters.in.rest.dto.PacienteResponseDTO;
import com.syborx.brevemente.paciente.infrastructure.adapters.in.rest.mapper.PacienteRestMapper;
import com.syborx.brevemente.plataforma.application.ports.in.PlataformaDashboardUseCase;
import com.syborx.brevemente.plataforma.infrastructure.adapters.in.rest.dto.ResumenPlataformaDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

/**
 * Módulo "Visión Global" (D-14): datos globales de la plataforma para el
 * administrador con identidad clínica vinculada, sin el alcance de terapeuta
 * de los tabs clínicos. Requiere el permiso {@code VISION_GLOBAL_LEER}.
 */
@RestController
@RequestMapping("/vision-global")
@RequiredArgsConstructor
@Tag(name = "Visión Global", description = "Vista global de pacientes, agenda y KPIs de plataforma")
@PreAuthorize("hasAuthority('VISION_GLOBAL_LEER')")
public class VisionGlobalController {

    private final PlataformaDashboardUseCase plataformaDashboardUseCase;
    private final ListarPacientesUseCase listarPacientesUseCase;
    private final ListarCitasUseCase listarCitasUseCase;
    private final PacienteRestMapper pacienteRestMapper;
    private final CitaRestMapper citaRestMapper;

    @GetMapping("/resumen")
    @Operation(summary = "Resumen global de plataforma (KPIs)")
    public ResumenPlataformaDTO resumen() {
        return plataformaDashboardUseCase.obtenerResumen();
    }

    @GetMapping("/pacientes")
    @Operation(summary = "Directorio global de pacientes (sin alcance por terapeuta)")
    public List<PacienteResponseDTO> pacientes() {
        return listarPacientesUseCase.listarGlobales().stream()
                .map(pacienteRestMapper::toResponse)
                .toList();
    }

    @GetMapping("/citas")
    @Operation(summary = "Agenda global de citas (sin alcance por terapeuta)")
    public List<CitaResponseDTO> citas(
            @RequestParam(required = false) String terapeutaId,
            @RequestParam(required = false) String consultorio,
            @RequestParam(required = false) String modalidad,
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta
    ) {
        CitaFiltro filtro = new CitaFiltro(terapeutaId, null, consultorio, modalidad, estado, desde, hasta, null);
        return listarCitasUseCase.listarGlobales(filtro).stream()
                .map(citaRestMapper::toResponse)
                .toList();
    }
}
