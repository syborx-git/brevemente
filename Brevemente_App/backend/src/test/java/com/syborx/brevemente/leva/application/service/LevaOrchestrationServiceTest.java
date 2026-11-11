package com.syborx.brevemente.leva.application.service;

import com.syborx.brevemente.leva.application.ports.out.ClinicalCorpusRepositoryPort;
import com.syborx.brevemente.leva.application.ports.out.LevaProposalRepositoryPort;
import com.syborx.brevemente.leva.application.ports.out.LocalLlmPort;
import com.syborx.brevemente.leva.application.ports.out.TranscriptionClientPort;
import com.syborx.brevemente.leva.application.ports.out.TranscriptionTaskRepositoryPort;
import com.syborx.brevemente.leva.domain.model.ClinicalCorpusChunk;
import com.syborx.brevemente.leva.domain.model.ClinicalCorpusDocument;
import com.syborx.brevemente.leva.domain.model.HumanReviewStatus;
import com.syborx.brevemente.leva.domain.model.LevaClinicalProposal;
import com.syborx.brevemente.leva.domain.model.RawTranscriptionResult;
import com.syborx.brevemente.leva.domain.model.RiskAssessment;
import com.syborx.brevemente.leva.domain.model.RiskLevel;
import com.syborx.brevemente.leva.domain.model.StructuredProposalData;
import com.syborx.brevemente.leva.domain.model.TranscriptSegment;
import com.syborx.brevemente.leva.domain.model.TranscriptionTask;
import com.syborx.brevemente.leva.domain.model.TranscriptionTaskStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cache.CacheManager;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LevaOrchestrationServiceTest {

    @Mock
    private TranscriptionClientPort transcriptionClientPort;

    @Mock
    private LocalLlmPort localLlmPort;

    @Mock
    private TranscriptionTaskRepositoryPort taskRepositoryPort;

    @Mock
    private LevaProposalRepositoryPort proposalRepositoryPort;

    @Mock
    private ClinicalCorpusRepositoryPort corpusRepositoryPort;

    @Mock
    private CacheManager cacheManager;

    private LevaOrchestrationService service;

    @BeforeEach
    void setUp() {
        service = new LevaOrchestrationService(
                transcriptionClientPort,
                localLlmPort,
                taskRepositoryPort,
                proposalRepositoryPort,
                corpusRepositoryPort,
                cacheManager
        );
    }

    @Test
    @DisplayName("evaluateRiskFromText: detecta alerta roja ante ideación suicida")
    void evaluateRiskFromTextDetectaRiesgoCritico() {
        String texto = "Doctor, la verdad es que ya no quiero vivir, he pensado seriamente en el suicidio.";
        RiskAssessment risk = service.evaluateRiskFromText(texto);

        assertEquals(RiskLevel.CRITICAL, risk.getLevel());
        assertTrue(risk.isRequiresImmediateHumanIntervention());
        assertTrue(risk.getDetectedTriggers().contains("suicidio"));
        assertTrue(risk.getDetectedTriggers().contains("no quiero vivir"));
        assertTrue(risk.getRecommendedProtocol().contains("ALERTA ROJA CLÍNICA"));
    }

    @Test
    @DisplayName("evaluateRiskFromText: detecta riesgo medio ante quejas de agotamiento extremo")
    void evaluateRiskFromTextDetectaRiesgoMedio() {
        String texto = "Siento que ya no puedo más con esta carga diaria y este estrés en el trabajo.";
        RiskAssessment risk = service.evaluateRiskFromText(texto);

        assertEquals(RiskLevel.MEDIUM, risk.getLevel());
        assertFalse(risk.isRequiresImmediateHumanIntervention());
        assertTrue(risk.getDetectedTriggers().contains("ya no puedo más"));
    }

    @Test
    @DisplayName("evaluateRiskFromText: clasifica NONE ante sesión clínica normal")
    void evaluateRiskFromTextSinRiesgo() {
        String texto = "Buenas tardes doctor, vengo a revisar mis tareas de la semana pasada.";
        RiskAssessment risk = service.evaluateRiskFromText(texto);

        assertEquals(RiskLevel.NONE, risk.getLevel());
        assertFalse(risk.isRequiresImmediateHumanIntervention());
        assertTrue(risk.getDetectedTriggers().isEmpty());
    }

    @Test
    @DisplayName("saveDocumentWithChunks: guarda documento y persiste chunks semánticos indexados")
    void saveDocumentWithChunksPersisteAmbos() {
        ClinicalCorpusDocument doc = ClinicalCorpusDocument.builder()
                .id("doc-123")
                .title("Protocolo de Pánico")
                .protocolCode("TBE-PANICO")
                .category("PROTOCOLO_TBE")
                .content("Contenido del protocolo")
                .build();

        ClinicalCorpusChunk chunk = ClinicalCorpusChunk.builder()
                .id("chk-1")
                .title("Fragmento 1")
                .content("SPR Fóbico")
                .wordCount(50)
                .build();

        when(corpusRepositoryPort.save(any(ClinicalCorpusDocument.class))).thenReturn(doc);

        ClinicalCorpusDocument saved = service.saveDocumentWithChunks(doc, List.of(chunk));

        assertNotNull(saved);
        assertEquals("TBE-PANICO", saved.getProtocolCode());
        verify(corpusRepositoryPort, times(1)).save(doc);
        verify(corpusRepositoryPort, times(1)).saveChunks(eq("doc-123"), anyList());
    }

    @Test
    @DisplayName("getTopRelevantChunks: delega en el puerto de repositorio con límite")
    void getTopRelevantChunksDelegaEnPuerto() {
        ClinicalCorpusChunk chunk = ClinicalCorpusChunk.builder()
                .id("chk-1")
                .protocolCode("TBE-PANICO")
                .title("Ataque de Pánico")
                .content("Regla TBE")
                .build();

        when(corpusRepositoryPort.findTopRelevantChunks("crisis de panico", 3)).thenReturn(List.of(chunk));

        List<ClinicalCorpusChunk> result = service.getTopRelevantChunks("crisis de panico", 3);

        assertEquals(1, result.size());
        assertEquals("chk-1", result.get(0).getId());
        verify(corpusRepositoryPort, times(1)).findTopRelevantChunks("crisis de panico", 3);
    }

    @Test
    @DisplayName("processCallback: recupera chunks RAG e invoca LLaMA 3.1 restringido en estado PROPOSED")
    void processCallbackGeneraPropuestaConChunks() {
        String taskId = "task-001";
        TranscriptionTask task = TranscriptionTask.builder()
                .id(taskId)
                .sessionId("ses-001")
                .pacienteId("pac-001")
                .terapeutaId("ter-001")
                .status(TranscriptionTaskStatus.PROCESSING)
                .build();

        RawTranscriptionResult rawResult = RawTranscriptionResult.builder()
                .taskId(taskId)
                .status("COMPLETED")
                .fullText("Siento palpitaciones y miedo a morir en espacios cerrados.")
                .durationSeconds(120.0)
                .segments(Collections.emptyList())
                .build();

        ClinicalCorpusChunk chunk = ClinicalCorpusChunk.builder()
                .id("chk-panico")
                .protocolCode("TBE-PANICO")
                .title("Regla de Pánico")
                .content("Diario de a bordo")
                .build();

        StructuredProposalData proposalData = StructuredProposalData.builder()
                .diagnosticoOperativo("Trastorno de Pánico TBE")
                .sistemaPerceptivoReactivo("Fóbico")
                .build();

        LevaClinicalProposal savedProposal = LevaClinicalProposal.builder()
                .id("prop-001")
                .taskId(taskId)
                .citaId("ses-001")
                .humanReviewStatus(HumanReviewStatus.PROPOSED)
                .structuredProposal(proposalData)
                .build();

        when(taskRepositoryPort.findById(taskId)).thenReturn(Optional.of(task));
        when(taskRepositoryPort.save(any(TranscriptionTask.class))).thenReturn(task);
        when(corpusRepositoryPort.findTopRelevantChunks(anyString(), eq(3))).thenReturn(List.of(chunk));
        when(localLlmPort.generateStructuredProposal(anyString(), anyList(), anyList())).thenReturn(proposalData);
        when(proposalRepositoryPort.save(any(LevaClinicalProposal.class))).thenReturn(savedProposal);

        LevaClinicalProposal result = service.processCallback(rawResult);

        assertNotNull(result);
        assertEquals(HumanReviewStatus.PROPOSED, result.getHumanReviewStatus());
        verify(corpusRepositoryPort, times(1)).findTopRelevantChunks(rawResult.getFullText(), 3);
        verify(localLlmPort, times(1)).generateStructuredProposal(
                eq(rawResult.getFullText()),
                eq(rawResult.getSegments()),
                eq(List.of(chunk))
        );
        verify(proposalRepositoryPort, times(1)).save(any(LevaClinicalProposal.class));
    }

    @Test
    @DisplayName("approveProposal: sella la propuesta en estado APPROVED (Human-in-the-Loop)")
    void approveProposalSellaPropuesta() {
        String proposalId = "prop-001";
        LevaClinicalProposal existing = LevaClinicalProposal.builder()
                .id(proposalId)
                .humanReviewStatus(HumanReviewStatus.PROPOSED)
                .structuredProposal(StructuredProposalData.builder().diagnosticoOperativo("Borrador IA").build())
                .build();

        StructuredProposalData editedData = StructuredProposalData.builder()
                .diagnosticoOperativo("Diagnóstico Editado por el Médico")
                .build();

        when(proposalRepositoryPort.findById(proposalId)).thenReturn(Optional.of(existing));
        when(proposalRepositoryPort.save(any(LevaClinicalProposal.class))).thenAnswer(i -> i.getArgument(0));

        LevaClinicalProposal approved = service.approveProposal(proposalId, "ter-001", editedData);

        assertEquals(HumanReviewStatus.APPROVED, approved.getHumanReviewStatus());
        assertEquals("ter-001", approved.getReviewedById());
        assertEquals("Diagnóstico Editado por el Médico", approved.getApprovedData().getDiagnosticoOperativo());
        assertNotNull(approved.getReviewedAt());
        verify(proposalRepositoryPort, times(1)).save(existing);
    }
}
