package com.syborx.brevemente.paciente.infrastructure.adapters.in.rest;

import com.syborx.brevemente.paciente.application.ports.in.ActualizarPacienteUseCase;
import com.syborx.brevemente.paciente.application.ports.in.CrearPacienteUseCase;
import com.syborx.brevemente.paciente.application.ports.in.GenerarPasswordTemporalPacienteUseCase;
import com.syborx.brevemente.paciente.application.ports.in.ListarPacientesUseCase;
import com.syborx.brevemente.paciente.application.ports.in.ObtenerPacienteUseCase;
import com.syborx.brevemente.auth.domain.model.PasswordTemporal;
import com.syborx.brevemente.paciente.domain.model.Paciente;
import com.syborx.brevemente.paciente.domain.model.PacienteCreado;
import com.syborx.brevemente.paciente.infrastructure.adapters.in.rest.dto.PacienteCreateRequest;
import com.syborx.brevemente.paciente.infrastructure.adapters.in.rest.dto.PacienteCreadoDTO;
import com.syborx.brevemente.paciente.infrastructure.adapters.in.rest.dto.PacientePatchRequest;
import com.syborx.brevemente.paciente.infrastructure.adapters.in.rest.dto.PacienteResponseDTO;
import com.syborx.brevemente.paciente.infrastructure.adapters.in.rest.dto.PasswordTemporalPacienteResponse;
import com.syborx.brevemente.paciente.infrastructure.adapters.in.rest.mapper.PacienteRestMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/pacientes")
@RequiredArgsConstructor
@Tag(name = "Pacientes", description = "Operaciones clínicas y normativas para la gestión de expedientes y directorio de pacientes TBE")
public class PacienteRestController {

    private final ListarPacientesUseCase listarPacientesUseCase;
    private final ObtenerPacienteUseCase obtenerPacienteUseCase;
    private final CrearPacienteUseCase crearPacienteUseCase;
    private final ActualizarPacienteUseCase actualizarPacienteUseCase;
    private final GenerarPasswordTemporalPacienteUseCase generarPasswordTemporalPacienteUseCase;
    private final PacienteRestMapper pacienteRestMapper;

    @GetMapping
    @PreAuthorize("hasAuthority('PACIENTES_LEER')")
    @Operation(
            summary = "Listar directorio clínico de pacientes",
            description = "Recupera la totalidad de los pacientes registrados en la plataforma con sus determinaciones de consentimiento, estatus y nivel de riesgo."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Directorio clínico recuperado exitosamente",
                    content = @Content(
                            mediaType = "application/json",
                            array = @ArraySchema(schema = @Schema(implementation = PacienteResponseDTO.class))
                    )
            )
    })
    public ResponseEntity<List<PacienteResponseDTO>> listar() {
        List<PacienteResponseDTO> responses = listarPacientesUseCase.listarTodos().stream()
                .map(pacienteRestMapper::toResponse)
                .toList();
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PACIENTES_LEER')")
    @Operation(
            summary = "Consultar expediente de paciente por ID",
            description = "Obtiene los detalles demográficos, representación legal y estado clínico del paciente especificado."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Paciente encontrado",
                    content = @Content(schema = @Schema(implementation = PacienteResponseDTO.class))
            ),
            @ApiResponse(responseCode = "404", description = "Paciente no encontrado")
    })
    public ResponseEntity<PacienteResponseDTO> buscarPorId(
            @Parameter(description = "Identificador único del paciente (UUID o slug)", example = "pac-001")
            @PathVariable String id
    ) {
        Paciente domain = obtenerPacienteUseCase.obtenerPorId(id);
        return ResponseEntity.ok(pacienteRestMapper.toResponse(domain));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PACIENTES_CREAR')")
    @Operation(
            summary = "Registrar nuevo paciente",
            description = "Da de alta a un paciente en el sistema calculando automáticamente su mayoría o minoría de edad y aplicando las reglas de consentimiento informado TBE."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "201",
                    description = "Paciente creado exitosamente",
                    content = @Content(schema = @Schema(implementation = PacienteResponseDTO.class))
            ),
            @ApiResponse(responseCode = "400", description = "Datos de entrada inválidos o faltantes"),
            @ApiResponse(responseCode = "409", description = "Conflicto por CURP duplicado")
    })
    public ResponseEntity<PacienteCreadoDTO> crear(
            @Valid @RequestBody PacienteCreateRequest request
    ) {
        Paciente nuevo = pacienteRestMapper.toDomain(request);
        PacienteCreado creado = crearPacienteUseCase.crear(nuevo);
        return ResponseEntity.status(HttpStatus.CREATED).body(new PacienteCreadoDTO(
                pacienteRestMapper.toResponse(creado.paciente()), creado.passwordTemporal()));
    }

    @PostMapping("/{id}/password-temporal")
    @PreAuthorize("hasAuthority('PACIENTES_EDITAR')")
    @Operation(
            summary = "Generar/restablecer contraseña temporal de acceso del paciente",
            description = "Genera una contraseña temporal para el portal del paciente. Si el paciente aún no tiene identidad de acceso, la crea (rol patient)."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Contraseña temporal generada"),
            @ApiResponse(responseCode = "404", description = "Paciente no encontrado o fuera de alcance"),
            @ApiResponse(responseCode = "409", description = "El paciente no tiene correo registrado o ya está en uso")
    })
    public ResponseEntity<PasswordTemporalPacienteResponse> generarPasswordTemporal(
            @Parameter(description = "Identificador del paciente", example = "pac-001")
            @PathVariable String id) {
        PasswordTemporal temporal = generarPasswordTemporalPacienteUseCase.generarPasswordTemporal(id);
        return ResponseEntity.ok(new PasswordTemporalPacienteResponse(temporal.valor()));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAuthority('PACIENTES_EDITAR')")
    @Operation(
            summary = "Actualizar atributos clínicos del paciente",
            description = "Permite la actualización parcial de información clínica, estado del tratamiento, reconsentimiento o datos de contacto."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Paciente actualizado correctamente",
                    content = @Content(schema = @Schema(implementation = PacienteResponseDTO.class))
            ),
            @ApiResponse(responseCode = "404", description = "Paciente no encontrado")
    })
    public ResponseEntity<PacienteResponseDTO> actualizar(
            @Parameter(description = "Identificador único del paciente", example = "pac-001")
            @PathVariable String id,
            @RequestBody PacientePatchRequest cambios
    ) {
        Paciente patchDomain = pacienteRestMapper.toDomain(cambios);
        Paciente actualizado = actualizarPacienteUseCase.actualizar(id, patchDomain);
        return ResponseEntity.ok(pacienteRestMapper.toResponse(actualizado));
    }
}
