package com.syborx.brevemente.leva.infrastructure.adapters.in.rest;

import com.syborx.brevemente.leva.application.ports.in.QueryClosedCorpusUseCase;
import com.syborx.brevemente.leva.domain.model.ClinicalCorpusDocument;
import com.syborx.brevemente.leva.domain.model.ClosedCorpusQueryResult;
import com.syborx.brevemente.leva.infrastructure.adapters.in.rest.dto.CorpusQueryRequest;
import com.syborx.brevemente.leva.infrastructure.adapters.in.rest.dto.CorpusQueryResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/leva/corpus")
@RequiredArgsConstructor
@Tag(name = "LEVA - Corpus Clínico Cerrado", description = "Consultas RAG sobre manuales propietarios, 15+ protocolos TBE, DSM-5TR y CIE-11")
public class LevaCorpusController {

    private final QueryClosedCorpusUseCase queryCorpusUseCase;

    @PostMapping("/query")
    @Operation(summary = "Consultar el corpus clínico cerrado", description = "Responde dudas clínicas asistiendo al médico o alumno basándose exclusivamente en el corpus propietario")
    public ResponseEntity<CorpusQueryResponse> queryCorpus(@Valid @RequestBody CorpusQueryRequest request) {
        log.info("[LEVA Corpus API] Consulta recibida: '{}'", request.getQuery());
        ClosedCorpusQueryResult result = queryCorpusUseCase.queryCorpus(request.getQuery(), request.getProtocolFilter());
        return ResponseEntity.ok(CorpusQueryResponse.fromDomain(result));
    }

    @GetMapping(value = "/query/stream", produces = org.springframework.http.MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(
            summary = "Consultar el corpus clínico vía streaming SSE (Fase 4)",
            description = "Emite la respuesta token a token en tiempo real mediante Server-Sent Events (SSE) para el frontend de Angular, reduciendo la latencia percibida a menos de 1 segundo."
    )
    public org.springframework.web.servlet.mvc.method.annotation.SseEmitter streamQueryCorpus(
            @RequestParam @jakarta.validation.constraints.NotBlank String query,
            @RequestParam(required = false) String protocolFilter
    ) {
        log.info("[LEVA Corpus API] Streaming SSE recibido para: '{}' (Filtro: {})", query, protocolFilter);
        return queryCorpusUseCase.streamQueryCorpus(query, protocolFilter);
    }


    @GetMapping("/protocols")
    @Operation(summary = "Listar protocolos disponibles en el corpus", description = "Lista todos los protocolos TBE y guías cargadas en el corpus cerrado de LEVA")
    public ResponseEntity<List<ClinicalCorpusDocument>> listProtocols() {
        List<ClinicalCorpusDocument> protocols = queryCorpusUseCase.listAvailableProtocols();
        return ResponseEntity.ok(protocols);
    }

    @PostMapping("/cache/evict")
    @Operation(summary = "Limpiar caché en memoria del corpus", description = "Invalida la memoria caché de consultas RAG y protocolos para forzar nueva inferencia en Ollama")
    public ResponseEntity<Void> evictCache() {
        log.info("[LEVA Corpus API] Solicitud de invalidación de caché recibida.");
        queryCorpusUseCase.evictCorpusCache();
        return ResponseEntity.noContent().build();
    }
}
