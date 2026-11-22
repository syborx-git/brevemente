package com.syborx.brevemente.leva.application.service;

import com.syborx.brevemente.leva.application.ports.out.ClinicalCaseCandidatePort;
import com.syborx.brevemente.leva.application.ports.out.ClinicalCaseSourceRepositoryPort;
import com.syborx.brevemente.leva.application.ports.out.LocalEmbeddingPort;
import com.syborx.brevemente.leva.domain.exception.LevaException;
import com.syborx.brevemente.leva.domain.model.CaseClinicalSnapshot;
import com.syborx.brevemente.leva.domain.model.ClinicalCaseSource;
import com.syborx.brevemente.leva.domain.model.SimilarCaseMatch;
import com.syborx.brevemente.leva.domain.model.StructuredProposalData;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ClinicalCaseSourceServiceTest {

    @Mock
    private ClinicalCaseSourceRepositoryPort repository;
    @Mock
    private ClinicalCaseCandidatePort candidatePort;
    @Mock
    private LocalEmbeddingPort embeddingPort;

    private ClinicalCaseSourceService service;

    @BeforeEach
    void setUp() {
        service = new ClinicalCaseSourceService(repository, candidatePort, embeddingPort);
    }

    private CaseClinicalSnapshot snapshotHidrofobia() {
        StructuredProposalData aprobada = StructuredProposalData.builder()
                .sistemaPerceptivoReactivo("Fóbico")
                .tentativasSolucionRedundantes(List.of("Evita lavabos y regaderas", "Pide ayuda a María"))
                .prescripcionesEstrategicas(List.of("El Espejo Líquido matutino"))
                .estratagemaAplicada("El Espejo Líquido matutino")
                .valoracionDelCambio("Remisión parcial en sesión 3")
                .reaccionPaciente("Colaboró con la tarea")
                .build();
        return CaseClinicalSnapshot.builder()
                .expedienteId("exp-1")
                .folio("EXP-2026-001")
                .estatus("CERRADO")
                .sprInicial("SPR Fóbico")
                .diagnosticoOperativo("Fobia al agua de María López mantenida por evitación")
                .trastornoEstrategico("Hidrofobia")
                .intentosSolucion("Evita el agua\nLlama al 55 1234 5678 a su esposo")
                .edad(27)
                .numSesiones(4)
                .identificadores(List.of("María", "López"))
                .prescripcionesSesiones(List.of("Bitácora de la peor fantasía"))
                .propuestasAprobadas(List.of(aprobada))
                .build();
    }

    @Test
    @DisplayName("buildDraft: consolida el caso y elimina todo dato personal")
    void buildDraftAnonimizaYConsolida() {
        ClinicalCaseSource draft = service.buildDraft(snapshotHidrofobia());

        assertFalse(draft.getDiagnosticoOperativo().contains("María"));
        assertFalse(draft.getDiagnosticoOperativo().contains("López"));
        assertTrue(draft.getDiagnosticoOperativo().contains("[PACIENTE]"));
        assertTrue(draft.getTentativas().stream().noneMatch(t -> t.contains("María") || t.contains("1234")));
        assertEquals(1, draft.getPrescripciones().stream().filter(p -> p.contains("Espejo Líquido")).count(),
                "las prescripciones repetidas deben consolidarse");
        assertTrue(draft.getPerfilEtario().startsWith("Adulto joven"));
        assertEquals(4, draft.getNumSesiones());
        assertTrue(draft.getResultado().contains("Remisión parcial"));
        assertTrue(draft.getSearchText().toLowerCase().contains("hidrofobia"));
    }

    @Test
    @DisplayName("acceptCase: persiste ficha ACTIVE con token docente, firma y vector")
    void acceptCasePersisteFichaActiva() {
        when(repository.existsActiveByExpedienteId("exp-1")).thenReturn(false);
        when(candidatePort.loadSnapshot("exp-1")).thenReturn(Optional.of(snapshotHidrofobia()));
        when(repository.nextCaseToken()).thenReturn("REF-CASO-2026-001");
        when(embeddingPort.generateEmbedding(anyString())).thenReturn(List.of(0.1f, 0.2f));
        when(repository.save(any(ClinicalCaseSource.class))).thenAnswer(inv -> inv.getArgument(0));

        ClinicalCaseSource saved = service.acceptCase("exp-1", "Caso ejemplar de María López", "dir.clinica");

        ArgumentCaptor<ClinicalCaseSource> captor = ArgumentCaptor.forClass(ClinicalCaseSource.class);
        verify(repository).save(captor.capture());
        ClinicalCaseSource persisted = captor.getValue();
        assertEquals("REF-CASO-2026-001", saved.getCaseToken());
        assertTrue(persisted.isActive());
        assertEquals("dir.clinica", persisted.getApprovedBy());
        assertNotNull(persisted.getApprovedAt());
        assertEquals(List.of(0.1f, 0.2f), persisted.getEmbedding());
        assertFalse(persisted.getNotasCuraduria().contains("María"), "las notas también se depuran");
    }

    @Test
    @DisplayName("acceptCase: rechaza un expediente que ya es fuente activa")
    void acceptCaseRechazaDuplicado() {
        when(repository.existsActiveByExpedienteId("exp-1")).thenReturn(true);

        assertThrows(LevaException.class, () -> service.acceptCase("exp-1", null, "dir"));
        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("acceptCase: rechaza expedientes sin información clínica suficiente")
    void acceptCaseRechazaExpedienteVacio() {
        CaseClinicalSnapshot vacio = CaseClinicalSnapshot.builder().expedienteId("exp-2").folio("EXP-2").build();
        when(repository.existsActiveByExpedienteId("exp-2")).thenReturn(false);
        when(candidatePort.loadSnapshot("exp-2")).thenReturn(Optional.of(vacio));

        assertThrows(LevaException.class, () -> service.acceptCase("exp-2", null, "dir"));
        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("revokeCase: marca el caso como REVOKED y registra quién lo retiró")
    void revokeCaseRetiraDelAprendizaje() {
        ClinicalCaseSource active = ClinicalCaseSource.builder()
                .id("src-1").caseToken("REF-CASO-2026-001").status(ClinicalCaseSource.STATUS_ACTIVE).build();
        when(repository.findById("src-1")).thenReturn(Optional.of(active));
        when(repository.save(any(ClinicalCaseSource.class))).thenAnswer(inv -> inv.getArgument(0));

        ClinicalCaseSource revoked = service.revokeCase("src-1", "dir.clinica");

        assertEquals(ClinicalCaseSource.STATUS_REVOKED, revoked.getStatus());
        assertEquals("dir.clinica", revoked.getRevokedBy());
        assertNotNull(revoked.getRevokedAt());
    }

    @Test
    @DisplayName("findSimilar: devuelve solo casos activos afines y descarta los de otro SPR")
    void findSimilarFiltraPorAfinidadYSpr() {
        ClinicalCaseSource hidro = ClinicalCaseSource.builder()
                .id("a").caseToken("REF-CASO-2026-001").status(ClinicalCaseSource.STATUS_ACTIVE)
                .spr("SPR Fóbico")
                .searchText("Fóbico . Fobia agua evitación lavabos auxilio familiares espejo líquido")
                .build();
        ClinicalCaseSource toc = ClinicalCaseSource.builder()
                .id("b").caseToken("REF-CASO-2026-002").status(ClinicalCaseSource.STATUS_ACTIVE)
                .spr("SPR Obsesivo-Compulsivo")
                .searchText("Obsesivo compulsivo rituales lavado manos contaminación verificación")
                .build();
        when(repository.findActive()).thenReturn(List.of(toc, hidro));

        List<SimilarCaseMatch> result = service.findSimilar(
                "Tiene fobia al agua, evita lavabos y siempre pide auxilio a familiares; el espejo líquido ayudó",
                "SPR Fóbico (Miedo al agua)", 3);

        assertEquals(1, result.size());
        assertEquals("REF-CASO-2026-001", result.get(0).getSource().getCaseToken());
        assertTrue(result.get(0).getSimilarity() >= 0.5);
        verifyNoInteractions(embeddingPort);
    }

    @Test
    @DisplayName("findSimilar: sin casos activos o texto vacío devuelve lista vacía")
    void findSimilarSinCasos() {
        assertTrue(service.findSimilar("  ", null, 2).isEmpty());

        when(repository.findActive()).thenReturn(List.of());
        assertTrue(service.findSimilar("fobia al agua", null, 2).isEmpty());
    }
}
