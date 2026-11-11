package com.syborx.brevemente.leva.infrastructure.adapters.in.rest;

import com.syborx.brevemente.leva.application.ports.in.QueryClosedCorpusUseCase;
import com.syborx.brevemente.leva.application.ports.out.CorpusFileStoragePort;
import com.syborx.brevemente.leva.application.ports.out.DocumentConverterPort;
import com.syborx.brevemente.leva.domain.model.ClinicalCorpusChunk;
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

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/leva/corpus")
@RequiredArgsConstructor
@Tag(name = "LEVA - Corpus Clínico Cerrado", description = "Consultas RAG sobre manuales propietarios, 15+ protocolos TBE, DSM-5TR y CIE-11")
public class LevaCorpusController {

    private final QueryClosedCorpusUseCase queryCorpusUseCase;
    private final DocumentConverterPort documentConverterPort;
    private final CorpusFileStoragePort fileStoragePort;

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

    @PostMapping(value = "/documents/preview-convert", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Previsualizar conversión a Markdown (PyMuPDF4LLM)", description = "Convierte deterministamente un PDF/Word a Markdown con tablas para revisión humana previa")
    public ResponseEntity<DocumentConverterPort.DocumentConversionResult> previewConvert(
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file
    ) {
        log.info("[LEVA Corpus API] Previsualizando documento: {}", file.getOriginalFilename());
        try {
            fileStoragePort.storeOriginalFile("PREVIEW", file);
        } catch (Exception e) {
            log.warn("[LEVA Corpus API] No se pudo archivar temporalmente en disco: {}", e.getMessage());
        }
        DocumentConverterPort.DocumentConversionResult result = documentConverterPort.convertToMarkdown(file);
        return ResponseEntity.ok(result);
    }

    public record PublishDocumentRequest(
            @jakarta.validation.constraints.NotBlank(message = "El título es obligatorio") String title,
            @jakarta.validation.constraints.NotBlank(message = "El código de protocolo es obligatorio") String protocolCode,
            @jakarta.validation.constraints.NotBlank(message = "La categoría es obligatoria") String category,
            @jakarta.validation.constraints.NotBlank(message = "El contenido Markdown es obligatorio") String markdownContent,
            String sourceReference,
            List<DocumentConverterPort.DocumentChunkDto> chunks
    ) {}

    @PostMapping(value = "/documents/publish", consumes = org.springframework.http.MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Aprobar y publicar protocolo en base de conocimiento", description = "El terapeuta aprueba el Markdown final revisado y lo publica en el corpus cerrado")
    public ResponseEntity<ClinicalCorpusDocument> publishDocument(@jakarta.validation.Valid @RequestBody PublishDocumentRequest request) {
        log.info("[LEVA Corpus API] Publicando protocolo '{}' ({})", request.title(), request.protocolCode());

        ClinicalCorpusDocument doc = ClinicalCorpusDocument.builder()
                .id(java.util.UUID.randomUUID().toString())
                .title(request.title())
                .protocolCode(request.protocolCode().trim().toUpperCase())
                .category(request.category())
                .content(request.markdownContent())
                .sourceReference(request.sourceReference() != null ? request.sourceReference() : "Manual Clínico TBE")
                .createdAt(java.time.Instant.now())
                .build();

        List<ClinicalCorpusChunk> chunks = buildChunksFromMarkdownOrDtos(
                doc.getProtocolCode(),
                request.markdownContent(),
                request.chunks()
        );

        ClinicalCorpusDocument saved = queryCorpusUseCase.saveDocumentWithChunks(doc, chunks);
        queryCorpusUseCase.evictCorpusCache();

        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED).body(saved);
    }

    @PostMapping(value = "/documents/upload", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Ingestar y educar a LEVA con documentos PDF/DOCX/TXT", description = "Extrae el texto del documento e indexa el protocolo en el corpus clínico cerrado")
    public ResponseEntity<ClinicalCorpusDocument> uploadDocument(
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            @RequestParam("title") String title,
            @RequestParam("protocolCode") String protocolCode,
            @RequestParam("category") String category,
            @RequestParam(value = "sourceReference", required = false) String sourceReference
    ) {
        log.info("[LEVA Corpus API] Ingestando archivo '{}' para protocolo '{}'", file.getOriginalFilename(), protocolCode);

        String storedPath = null;
        try {
            storedPath = fileStoragePort.storeOriginalFile(protocolCode, file);
        } catch (Exception e) {
            log.warn("[LEVA Corpus API] Error guardando archivo pesado en disco: {}", e.getMessage());
        }

        DocumentConverterPort.DocumentConversionResult conv = documentConverterPort.convertToMarkdown(file);
        String textContent = conv != null && conv.markdown() != null ? conv.markdown() : ("Contenido de " + file.getOriginalFilename());

        ClinicalCorpusDocument doc = ClinicalCorpusDocument.builder()
                .id(java.util.UUID.randomUUID().toString())
                .title(title)
                .protocolCode(protocolCode.trim().toUpperCase())
                .category(category)
                .content(textContent)
                .sourceReference(sourceReference != null ? sourceReference : (storedPath != null ? storedPath : file.getOriginalFilename()))
                .createdAt(java.time.Instant.now())
                .build();

        List<ClinicalCorpusChunk> chunks = buildChunksFromMarkdownOrDtos(
                doc.getProtocolCode(),
                textContent,
                conv != null ? conv.chunks() : null
        );

        ClinicalCorpusDocument saved = queryCorpusUseCase.saveDocumentWithChunks(doc, chunks);
        queryCorpusUseCase.evictCorpusCache();

        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED).body(saved);
    }

    private List<ClinicalCorpusChunk> buildChunksFromMarkdownOrDtos(
            String protocolCode,
            String markdown,
            List<DocumentConverterPort.DocumentChunkDto> chunkDtos
    ) {
        List<ClinicalCorpusChunk> result = new ArrayList<>();
        if (chunkDtos != null && !chunkDtos.isEmpty()) {
            for (DocumentConverterPort.DocumentChunkDto dto : chunkDtos) {
                result.add(ClinicalCorpusChunk.builder()
                        .id(UUID.randomUUID().toString())
                        .protocolCode(protocolCode)
                        .chunkIndex(dto.chunkIndex())
                        .title(dto.title())
                        .content(dto.content())
                        .wordCount(dto.wordCount())
                        .createdAt(Instant.now())
                        .build());
            }
            return result;
        }

        if (markdown == null || markdown.isBlank()) {
            return result;
        }

        String[] paragraphs = markdown.split("\n\n+");
        StringBuilder currentChunk = new StringBuilder();
        int currentWords = 0;
        int chunkIdx = 0;

        for (String para : paragraphs) {
            String trimmed = para.trim();
            if (trimmed.isEmpty()) continue;
            int wordsInPara = trimmed.split("\\s+").length;

            if (currentWords > 0 && (currentWords + wordsInPara > 500)) {
                result.add(ClinicalCorpusChunk.builder()
                        .id(UUID.randomUUID().toString())
                        .protocolCode(protocolCode)
                        .chunkIndex(chunkIdx++)
                        .title("Fragmento " + chunkIdx)
                        .content(currentChunk.toString().trim())
                        .wordCount(currentWords)
                        .createdAt(Instant.now())
                        .build());
                currentChunk = new StringBuilder();
                currentWords = 0;
            }

            if (currentChunk.length() > 0) currentChunk.append("\n\n");
            currentChunk.append(trimmed);
            currentWords += wordsInPara;
        }

        if (currentWords > 0) {
            result.add(ClinicalCorpusChunk.builder()
                    .id(UUID.randomUUID().toString())
                    .protocolCode(protocolCode)
                    .chunkIndex(chunkIdx++)
                    .title("Fragmento " + chunkIdx)
                    .content(currentChunk.toString().trim())
                    .wordCount(currentWords)
                    .createdAt(Instant.now())
                    .build());
        }

        return result;
    }
}
