package com.syborx.brevemente.expediente.application.service;

import com.syborx.brevemente.auditoria.application.ports.out.AuditoriaExpedientePort;
import com.syborx.brevemente.expediente.application.ports.out.ExpedienteRepositoryPort;
import com.syborx.brevemente.expediente.domain.exception.ExpedienteNotFoundException;
import com.syborx.brevemente.expediente.domain.model.Expediente;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExpedienteApplicationServiceTest {

    @Mock
    private ExpedienteRepositoryPort expedienteRepositoryPort;

    @Mock
    private AuditoriaExpedientePort auditoriaExpedientePort;

    private ExpedienteApplicationService service;

    @BeforeEach
    void setUp() {
        service = new ExpedienteApplicationService(expedienteRepositoryPort, auditoriaExpedientePort);
    }

    @Test
    @DisplayName("Obtener expediente inexistente lanza ExpedienteNotFoundException")
    void obtenerPorPacienteNotFound() {
        when(expedienteRepositoryPort.findByPacienteId("pac-999")).thenReturn(Optional.empty());

        assertThrows(ExpedienteNotFoundException.class, () -> service.obtenerPorPaciente("pac-999"));
    }

    @Test
    @DisplayName("Obtener expediente existente devuelve el modelo del puerto")
    void obtenerPorPacienteExistente() {
        Expediente expediente = Expediente.builder().id("exp-001").pacienteId("pac-001").build();
        when(expedienteRepositoryPort.findByPacienteId("pac-001")).thenReturn(Optional.of(expediente));

        Expediente resultado = service.obtenerPorPaciente("pac-001");

        assertSame(expediente, resultado);
    }

    @Test
    @DisplayName("Actualizar fusiona solo campos no nulos, persiste y audita")
    void actualizarFusionaYAudita() {
        Expediente actual = Expediente.builder()
                .id("exp-001")
                .pacienteId("pac-001")
                .motivoConsulta("Motivo original")
                .trastornoEstrategico("Ansiedad")
                .build();
        Expediente parcial = Expediente.builder()
                .motivoConsulta("Nuevo motivo")
                .dxNosologico("F41.0")
                .build();
        when(expedienteRepositoryPort.findByPacienteId("pac-001")).thenReturn(Optional.of(actual));
        when(expedienteRepositoryPort.save(any(Expediente.class))).thenAnswer(inv -> inv.getArgument(0));

        Expediente resultado = service.actualizar("pac-001", parcial, "usr-001");

        assertEquals("Nuevo motivo", resultado.getMotivoConsulta());
        assertEquals("F41.0", resultado.getDxNosologico());
        assertEquals("Ansiedad", resultado.getTrastornoEstrategico()); // no sobrescrito por null
        verify(expedienteRepositoryPort).save(actual);
        verify(auditoriaExpedientePort).registrar(
                eq("pac-001"), eq("usr-001"), eq("Actualización de expediente"),
                anyString(), eq("expediente"));
    }

    @Test
    @DisplayName("Actualizar no sobrescribe campos existentes cuando el parcial viene vacío")
    void actualizarNoSobrescribeConNull() {
        Expediente actual = Expediente.builder()
                .id("exp-001")
                .pacienteId("pac-001")
                .motivoConsulta("Motivo original")
                .build();
        Expediente vacio = Expediente.builder().build();
        when(expedienteRepositoryPort.findByPacienteId("pac-001")).thenReturn(Optional.of(actual));
        when(expedienteRepositoryPort.save(any(Expediente.class))).thenAnswer(inv -> inv.getArgument(0));

        Expediente resultado = service.actualizar("pac-001", vacio, "usr-001");

        assertEquals("Motivo original", resultado.getMotivoConsulta());
    }
}
