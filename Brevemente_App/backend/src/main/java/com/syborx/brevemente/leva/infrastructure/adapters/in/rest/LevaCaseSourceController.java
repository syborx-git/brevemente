package com.syborx.brevemente.leva.infrastructure.adapters.in.rest;

import com.syborx.brevemente.leva.application.ports.in.ManageCaseSourcesUseCase;
import com.syborx.brevemente.leva.domain.model.CaseCandidate;
import com.syborx.brevemente.leva.infrastructure.adapters.in.rest.dto.AcceptCaseSourceRequest;
import com.syborx.brevemente.leva.infrastructure.adapters.in.rest.dto.CaseSourceResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Curaduría de casos clínicos como fuente de aprendizaje de LEVA.
 * Acceso exclusivo del rol autorizado a administrar la configuración de LEVA.
 */
@Slf4j
@RestController
@RequestMapping("/leva/cases")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN_PLATFORM','ADMIN_CLINICAL')")
@Tag(name = "LEVA - Casos Fuente de Aprendizaje", description = "Selección y retiro de casos clínicos que alimentan la memoria de LEVA")
public class LevaCaseSourceController {

    private final ManageCaseSourcesUseCase manageCaseSourcesUseCase;

    @GetMapping("/candidates")
    @Operation(summary = "Buscar expedientes candidatos a fuente de aprendizaje")
    public ResponseEntity<List<CaseCandidate>> searchCandidates(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String estatus,
            @RequestParam(defaultValue = "25") int limit
    ) {
        return ResponseEntity.ok(manageCaseSourcesUseCase.searchCandidates(q, estatus, limit));
    }

    @GetMapping("/candidates/{expedienteId}/preview")
    @Operation(summary = "Previsualizar la ficha anonimizada que aprendería LEVA")
    public ResponseEntity<CaseSourceResponse> preview(@PathVariable String expedienteId) {
        return ResponseEntity.ok(CaseSourceResponse.fromDomain(manageCaseSourcesUseCase.previewDraft(expedienteId)));
    }

    @PostMapping("/sources")
    @Operation(summary = "Aceptar un expediente como caso fuente de aprendizaje")
    public ResponseEntity<CaseSourceResponse> accept(
            @Valid @RequestBody AcceptCaseSourceRequest request,
            Authentication authentication
    ) {
        String actor = authentication != null ? authentication.getName() : null;
        var saved = manageCaseSourcesUseCase.acceptCase(request.getExpedienteId(), request.getNotasCuraduria(), actor);
        return ResponseEntity.status(HttpStatus.CREATED).body(CaseSourceResponse.fromDomain(saved));
    }

    @GetMapping("/sources")
    @Operation(summary = "Listar los casos que alimentan la memoria de LEVA")
    public ResponseEntity<List<CaseSourceResponse>> list(@RequestParam(defaultValue = "false") boolean includeRevoked) {
        return ResponseEntity.ok(manageCaseSourcesUseCase.listSources(includeRevoked).stream()
                .map(CaseSourceResponse::fromDomain).toList());
    }

    @DeleteMapping("/sources/{id}")
    @Operation(summary = "Retirar un caso de la memoria de LEVA")
    public ResponseEntity<CaseSourceResponse> revoke(@PathVariable String id, Authentication authentication) {
        String actor = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(CaseSourceResponse.fromDomain(manageCaseSourcesUseCase.revokeCase(id, actor)));
    }
}
