package com.syborx.brevemente.supervision.application.service;

import com.syborx.brevemente.auditoria.application.ports.out.AuditoriaExpedientePort;
import com.syborx.brevemente.supervision.application.ports.out.SupervisionSolicitudRepositoryPort;
import com.syborx.brevemente.supervision.domain.exception.SolicitudNotFoundException;
import com.syborx.brevemente.supervision.domain.model.SupervisionSolicitud;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SupervisionSolicitudApplicationServiceTest {

    @Mock
    private SupervisionSolicitudRepositoryPort solicitudRepositoryPort;

    @Mock
    private AuditoriaExpedientePort auditoriaExpedientePort;

    private SupervisionSolicitudApplicationService service;

    @BeforeEach
    void setUp() {
        service = new SupervisionSolicitudApplicationService(solicitudRepositoryPort, auditoriaExpedientePort);
    }

    private SupervisionSolicitud solicitud(String terapeutaId) {
        return SupervisionSolicitud.builder()
                .pacienteId("pac-001")
                .terapeutaId(terapeutaId)
                .motivo("Revisar caso")
                .estado("pendiente")
                .build();
    }

    @Test
    @DisplayName("Crear solicitud genera id, estado pendiente y audita")
    void crearGeneraPendienteYAudita() {
        when(solicitudRepositoryPort.save(any(SupervisionSolicitud.class))).thenAnswer(inv -> inv.getArgument(0));

        SupervisionSolicitud resultado = service.crear("pac-001", "Revisar caso", "ter-001", List.of("ter-001"));

        assertNotNull(resultado.getId());
        assertTrue(resultado.getId().startsWith("sup-req-"));
        assertEquals("pendiente", resultado.getEstado());
        assertEquals("ter-001", resultado.getTerapeutaId());
        assertEquals("ter-001", resultado.getSolicitanteId());
        verify(solicitudRepositoryPort).save(resultado);
        verify(auditoriaExpedientePort).registrar(
                eq("pac-001"), eq("ter-001"), eq("Solicitud de supervisión"),
                anyString(), eq("sesion"));
    }

    @Test
    @DisplayName("Crear solicitud sin terapeutas asociados deja terapeutaId nulo")
    void crearSinTerapeutaDejaTerapeutaNulo() {
        when(solicitudRepositoryPort.save(any(SupervisionSolicitud.class))).thenAnswer(inv -> inv.getArgument(0));

        SupervisionSolicitud resultado = service.crear("pac-001", "Revisar caso", "ter-001", List.of());

        assertNull(resultado.getTerapeutaId());
    }

    @Test
    @DisplayName("Listar solicitudes como evaluador devuelve todas sin filtrar")
    void listarEvaluadorDevuelveTodas() {
        when(solicitudRepositoryPort.findByPacienteId("pac-001"))
                .thenReturn(List.of(solicitud("ter-001"), solicitud("ter-002")));

        List<SupervisionSolicitud> resultado =
                service.listarPorPaciente("pac-001", List.of("ter-001"), true);

        assertEquals(2, resultado.size());
    }

    @Test
    @DisplayName("Listar solicitudes como terapeuta filtra por terapeutaIds")
    void listarTerapeutaFiltraPorIds() {
        when(solicitudRepositoryPort.findByPacienteId("pac-001"))
                .thenReturn(List.of(solicitud("ter-001"), solicitud("ter-002")));

        List<SupervisionSolicitud> resultado =
                service.listarPorPaciente("pac-001", List.of("ter-001"), false);

        assertEquals(1, resultado.size());
        assertEquals("ter-001", resultado.get(0).getTerapeutaId());
    }

    @Test
    @DisplayName("Atender solicitud inexistente lanza SolicitudNotFoundException")
    void atenderNotFound() {
        when(solicitudRepositoryPort.findById("sup-req-001")).thenReturn(Optional.empty());

        assertThrows(SolicitudNotFoundException.class,
                () -> service.atender("sup-req-001", "ter-002"));
    }

    @Test
    @DisplayName("Atender solicitud marca atendida, registra responsable y audita")
    void atenderMarcaAtendidaYAudita() {
        SupervisionSolicitud solicitud = solicitud("ter-001");
        solicitud.setId("sup-req-001");
        when(solicitudRepositoryPort.findById("sup-req-001")).thenReturn(Optional.of(solicitud));
        when(solicitudRepositoryPort.save(any(SupervisionSolicitud.class))).thenAnswer(inv -> inv.getArgument(0));

        SupervisionSolicitud resultado = service.atender("sup-req-001", "ter-002");

        assertEquals("atendida", resultado.getEstado());
        assertEquals("ter-002", resultado.getAtendidoPorId());
        assertNotNull(resultado.getAtendidoAt());
        verify(solicitudRepositoryPort).save(solicitud);
        verify(auditoriaExpedientePort).registrar(
                eq("pac-001"), eq("ter-002"), eq("Supervisión atendida"),
                anyString(), eq("sesion"));
    }
}
