package com.syborx.brevemente.leva.infrastructure.adapters.in.rest;

import com.syborx.brevemente.leva.application.ports.in.*;
import com.syborx.brevemente.leva.domain.model.LevaClinicalProposal;
import com.syborx.brevemente.leva.domain.model.TranscriptionTask;
import com.syborx.brevemente.leva.infrastructure.adapters.in.rest.dto.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@RestController
@RequestMapping("/leva/sessions")
@RequiredArgsConstructor
@Tag(name = "LEVA - Copiloto Clínico", description = "Endpoints de autollenado de expedientes, Human-in-the-Loop y alertas de riesgo")
public class LevaSessionController {

    private final StartTranscriptionUseCase startTranscriptionUseCase;
    private final GetLevaProposalUseCase getProposalUseCase;
    private final ApproveClinicalProposalUseCase approveProposalUseCase;

    @PostMapping(value = "/{sessionId}/transcribe", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Iniciar transcripción y análisis LEVA", description = "Sube el audio de la sesión y encola el análisis clínico asíncrono")
    public ResponseEntity<TranscriptionTask> startSessionTranscription(
            @PathVariable String sessionId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "language", defaultValue = "es") String language
    ) {
        log.info("[LEVA API] Solicitud de transcripción para sesión: {}", sessionId);
        TranscriptionTask task = startTranscriptionUseCase.startSessionTranscription(sessionId, file, language);
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(task);
    }

    @GetMapping("/{sessionId}/proposal")
    @Operation(summary = "Obtener propuesta clínica LEVA", description = "Obtiene los campos sugeridos por LEVA para el autollenado del expediente")
    public ResponseEntity<LevaProposalResponse> getProposal(@PathVariable String sessionId) {
        LevaClinicalProposal proposal = getProposalUseCase.getProposalBySessionId(sessionId);
        return ResponseEntity.ok(LevaProposalResponse.fromDomain(proposal));
    }

    @PostMapping("/{sessionId}/approve")
    @Operation(summary = "Human-in-the-loop: Aprobar y sellar expediente", description = "El terapeuta revisa, edita y sella oficialmente la propuesta de LEVA")
    public ResponseEntity<LevaProposalResponse> approveProposal(
            @PathVariable String sessionId,
            @Valid @RequestBody ApproveProposalRequest request
    ) {
        LevaClinicalProposal current = getProposalUseCase.getProposalBySessionId(sessionId);
        LevaClinicalProposal approved = approveProposalUseCase.approveProposal(
                current.getId(),
                request.getReviewedById(),
                request.getApprovedData()
        );
        return ResponseEntity.ok(LevaProposalResponse.fromDomain(approved));
    }

    @GetMapping("/{sessionId}/risk-status")
    @Operation(summary = "Consultar alertas de riesgo clínico", description = "Retorna el nivel de riesgo detectado (suicidio, autolesión, violencia) y el protocolo de derivación")
    public ResponseEntity<RiskAlertResponse> getRiskStatus(@PathVariable String sessionId) {
        LevaClinicalProposal proposal = getProposalUseCase.getProposalBySessionId(sessionId);
        return ResponseEntity.ok(RiskAlertResponse.fromAssessment(sessionId, proposal.getRiskAlertDetails()));
    }
}
