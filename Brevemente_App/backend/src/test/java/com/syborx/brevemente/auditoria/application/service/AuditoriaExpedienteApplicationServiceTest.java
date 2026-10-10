package com.syborx.brevemente.auditoria.application.service;

import com.syborx.brevemente.auditoria.application.ports.out.AuditoriaExpedientePort;
import com.syborx.brevemente.auditoria.domain.exception.PacienteNoEncontradoException;
import com.syborx.brevemente.auditoria.domain.model.AuditoriaExpediente;
import com.syborx.brevemente.paciente.infrastructure.adapters.out.persistence.repository.SpringDataPacienteRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuditoriaExpedienteApplicationServiceTest {

    @Mock
    private AuditoriaExpedientePort auditoriaExpedientePort;

    @Mock
    private SpringDataPacienteRepository pacienteRepository;

    private AuditoriaExpedienteApplicationService service;

    @BeforeEach
    void setUp() {
        service = new AuditoriaExpedienteApplicationService(auditoriaExpedientePort, pacienteRepository);
    }

    @Test
    @DisplayName("Listar auditoría de paciente existente delega en el puerto")
    void listarPorPacienteExistenteDelega() {
        AuditoriaExpediente entrada = AuditoriaExpediente.builder()
                .id("aud-001")
                .pacienteId("pac-001")
                .usuarioId("usr-001")
                .accion("Actualización de expediente")
                .categoria("expediente")
                .build();
        when(pacienteRepository.existsById("pac-001")).thenReturn(true);
        when(auditoriaExpedientePort.listarPorPaciente("pac-001")).thenReturn(List.of(entrada));

        List<AuditoriaExpediente> resultado = service.listarPorPaciente("pac-001");

        assertEquals(1, resultado.size());
        assertSame(entrada, resultado.get(0));
    }

    @Test
    @DisplayName("Listar auditoría de paciente inexistente lanza PacienteNoEncontradoException")
    void listarPorPacienteInexistente() {
        when(pacienteRepository.existsById("pac-999")).thenReturn(false);

        assertThrows(PacienteNoEncontradoException.class, () -> service.listarPorPaciente("pac-999"));
        verifyNoInteractions(auditoriaExpedientePort);
    }
}
