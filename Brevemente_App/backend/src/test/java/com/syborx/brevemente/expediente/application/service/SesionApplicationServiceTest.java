package com.syborx.brevemente.expediente.application.service;

import com.syborx.brevemente.auditoria.application.ports.out.AuditoriaExpedientePort;
import com.syborx.brevemente.expediente.application.ports.out.ExpedienteRepositoryPort;
import com.syborx.brevemente.expediente.application.ports.out.SesionRepositoryPort;
import com.syborx.brevemente.expediente.domain.exception.ExpedienteNotFoundException;
import com.syborx.brevemente.expediente.domain.exception.SesionInvalidaException;
import com.syborx.brevemente.expediente.domain.model.Expediente;
import com.syborx.brevemente.expediente.domain.model.Sesion;
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
class SesionApplicationServiceTest {

    @Mock
    private AuditoriaExpedientePort auditoriaExpedientePort;

    @Mock
    private ExpedienteRepositoryPort expedienteRepositoryPort;

    @Mock
    private SesionRepositoryPort sesionRepositoryPort;

    private SesionApplicationService service;

    @BeforeEach
    void setUp() {
        service = new SesionApplicationService(auditoriaExpedientePort, expedienteRepositoryPort, sesionRepositoryPort);
    }

    private Expediente expediente() {
        return Expediente.builder().id("exp-001").pacienteId("pac-001").build();
    }

    @Test
    @DisplayName("Agregar sesión con número explícito persiste y registra auditoría")
    void agregarConNumeroExplicitoGuardaYAudita() {
        Sesion sesion = Sesion.builder().numero(3).px(List.of("Tarea de prueba")).status("validado").build();
        when(expedienteRepositoryPort.findByPacienteId("pac-001")).thenReturn(Optional.of(expediente()));
        when(sesionRepositoryPort.save(any(Sesion.class))).thenAnswer(inv -> inv.getArgument(0));

        Sesion resultado = service.agregar("pac-001", sesion, "usr-001");

        assertEquals(3, resultado.getNumero());
        assertEquals("pac-001", resultado.getPacienteId());
        assertEquals("exp-001", resultado.getExpedienteId());
        verify(sesionRepositoryPort).save(sesion);
        verify(auditoriaExpedientePort).registrar(
                eq("pac-001"), eq("usr-001"), eq("Registro de sesión TBE"),
                contains("Sesión 3"), eq("sesion"));
    }

    @Test
    @DisplayName("Agregar sesión sin número auto-incrementa a partir del último")
    void agregarSinNumeroAutoIncrementa() {
        Sesion sesion = Sesion.builder().build();
        when(expedienteRepositoryPort.findByPacienteId("pac-001")).thenReturn(Optional.of(expediente()));
        when(sesionRepositoryPort.ultimoNumero("exp-001")).thenReturn(Optional.of(5));
        when(sesionRepositoryPort.save(any(Sesion.class))).thenAnswer(inv -> inv.getArgument(0));

        Sesion resultado = service.agregar("pac-001", sesion, "usr-001");

        assertEquals(6, resultado.getNumero());
        verify(auditoriaExpedientePort).registrar(
                eq("pac-001"), eq("usr-001"), eq("Registro de sesión TBE"),
                contains("Sesión 6"), eq("sesion"));
    }

    @Test
    @DisplayName("Agregar sesión con número inválido lanza SesionInvalidaException")
    void agregarNumeroInvalido() {
        Sesion sesion = Sesion.builder().numero(0).build();
        when(expedienteRepositoryPort.findByPacienteId("pac-001")).thenReturn(Optional.of(expediente()));

        assertThrows(SesionInvalidaException.class, () -> service.agregar("pac-001", sesion, "usr-001"));
        verify(sesionRepositoryPort, never()).save(any());
        verifyNoInteractions(auditoriaExpedientePort);
    }

    @Test
    @DisplayName("Agregar sesión de paciente sin expediente lanza ExpedienteNotFoundException")
    void agregarExpedienteInexistente() {
        when(expedienteRepositoryPort.findByPacienteId("pac-999")).thenReturn(Optional.empty());

        assertThrows(ExpedienteNotFoundException.class,
                () -> service.agregar("pac-999", Sesion.builder().build(), "usr-001"));
        verifyNoInteractions(sesionRepositoryPort);
        verifyNoInteractions(auditoriaExpedientePort);
    }

    @Test
    @DisplayName("Listar sesiones delega en el puerto de persistencia")
    void listarPorPacienteDelega() {
        Sesion sesion = Sesion.builder().id("ses-001").numero(1).build();
        when(expedienteRepositoryPort.findByPacienteId("pac-001")).thenReturn(Optional.of(expediente()));
        when(sesionRepositoryPort.findByExpedienteId("exp-001")).thenReturn(List.of(sesion));

        List<Sesion> resultado = service.listarPorPaciente("pac-001");

        assertEquals(1, resultado.size());
        assertSame(sesion, resultado.get(0));
    }
}
