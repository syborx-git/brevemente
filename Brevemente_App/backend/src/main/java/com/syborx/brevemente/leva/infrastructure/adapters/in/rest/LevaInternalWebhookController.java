package com.syborx.brevemente.leva.infrastructure.adapters.in.rest;

import com.syborx.brevemente.leva.application.ports.in.ProcessTranscriptionCallbackUseCase;
import com.syborx.brevemente.leva.domain.exception.UnauthorizedInternalApiKeyException;
import com.syborx.brevemente.leva.domain.model.LevaClinicalProposal;
import com.syborx.brevemente.leva.infrastructure.adapters.in.rest.dto.LevaProposalResponse;
import com.syborx.brevemente.leva.infrastructure.adapters.in.rest.dto.TranscriptionCallbackPayload;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/internal/transcriptions")
@RequiredArgsConstructor
@Tag(name = "LEVA - Webhook Interno", description = "Receptor de resultados asíncronos desde el microservicio Python Whisper")
public class LevaInternalWebhookController {

    private final ProcessTranscriptionCallbackUseCase processCallbackUseCase;

    @Value("${app.leva.internal-api-key:dev-secret-api-key-change-in-prod}")
    private String expectedInternalApiKey;

    @PostMapping("/callback")
    @Operation(summary = "Webhook receptor de transcripción", description = "Invocado por Python transcript_engine para entregar el texto y los segmentos")
    public ResponseEntity<LevaProposalResponse> handleTranscriptionCallback(
            @RequestHeader(value = "X-Internal-API-Key", required = false) String internalApiKey,
            @RequestBody TranscriptionCallbackPayload payload
    ) {
        log.info("[LEVA Webhook] Recibida llamada de callback para tarea: {}", payload.getTaskId());

        if (internalApiKey == null || !internalApiKey.equals(expectedInternalApiKey)) {
            log.warn("[LEVA Webhook] Rechazada petición con clave interna inválida o ausente.");
            throw new UnauthorizedInternalApiKeyException();
        }

        LevaClinicalProposal proposal = processCallbackUseCase.processCallback(payload.toDomain());
        return ResponseEntity.ok(LevaProposalResponse.fromDomain(proposal));
    }
}
