package com.syborx.brevemente.pago.application.service;

import com.syborx.brevemente.auditoria.application.ports.out.AuditoriaExpedientePort;
import com.syborx.brevemente.pago.application.ports.out.PagoRepositoryPort;
import com.syborx.brevemente.pago.domain.exception.PagoInvalidoException;
import com.syborx.brevemente.pago.domain.exception.PagoNotFoundException;
import com.syborx.brevemente.pago.domain.model.Pago;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PagoApplicationServiceTest {

    @Mock
    private PagoRepositoryPort pagoRepositoryPort;

    @Mock
    private AuditoriaExpedientePort auditoriaExpedientePort;

    private PagoApplicationService pagoService;

    @BeforeEach
    void setUp() {
        pagoService = new PagoApplicationService(pagoRepositoryPort, auditoriaExpedientePort);
    }

    private Pago pagoBase() {
        return Pago.builder()
                .pacienteId("pac-001")
                .concepto("Sesión 1 · Seguimiento")
                .monto(new BigDecimal("800.00"))
                .registradoPorId("usr-001")
                .build();
    }

    @Test
    @DisplayName("Listar pagos delega en el puerto de persistencia")
    void listarPorPacienteDelega() {
        Pago pago = pagoBase();
        when(pagoRepositoryPort.findByPacienteId("pac-001")).thenReturn(List.of(pago));

        List<Pago> resultado = pagoService.listarPorPaciente("pac-001");

        assertEquals(1, resultado.size());
        assertSame(pago, resultado.get(0));
    }

    @Test
    @DisplayName("Registrar pago sin concepto lanza PagoInvalidoException")
    void registrarSinConcepto() {
        Pago pago = pagoBase();
        pago.setConcepto(null);

        assertThrows(PagoInvalidoException.class, () -> pagoService.registrar(pago));
        verifyNoInteractions(pagoRepositoryPort);
    }

    @Test
    @DisplayName("Registrar pago con monto negativo lanza PagoInvalidoException")
    void registrarMontoNegativo() {
        Pago pago = pagoBase();
        pago.setMonto(new BigDecimal("-1.00"));

        assertThrows(PagoInvalidoException.class, () -> pagoService.registrar(pago));
        verifyNoInteractions(pagoRepositoryPort);
    }

    @Test
    @DisplayName("Registrar pago asigna id y estado por defecto y audita")
    void registrarAsignaDefaultsYAudita() {
        Pago pago = pagoBase();
        when(pagoRepositoryPort.save(any(Pago.class))).thenAnswer(inv -> inv.getArgument(0));

        Pago resultado = pagoService.registrar(pago);

        assertNotNull(resultado.getId());
        assertTrue(resultado.getId().startsWith("pay-"));
        assertEquals("pendiente", resultado.getEstado());
        verify(pagoRepositoryPort).save(pago);
        verify(auditoriaExpedientePort).registrar(
                eq("pac-001"), eq("usr-001"), eq("Registro de pago"),
                contains("Sesión 1 · Seguimiento"), eq("pagos"));
    }

    @Test
    @DisplayName("Registrar pago respeta id y estado proporcionados")
    void registrarRespetaIdYEstado() {
        Pago pago = pagoBase();
        pago.setId("pay-abc123");
        pago.setEstado("pagado");
        when(pagoRepositoryPort.save(any(Pago.class))).thenAnswer(inv -> inv.getArgument(0));

        Pago resultado = pagoService.registrar(pago);

        assertEquals("pay-abc123", resultado.getId());
        assertEquals("pagado", resultado.getEstado());
    }

    @Test
    @DisplayName("Cambiar estado con valor inválido lanza PagoInvalidoException")
    void cambiarEstadoInvalido() {
        assertThrows(PagoInvalidoException.class, () -> pagoService.cambiarEstado("pay-001", "inexistente"));
        verifyNoInteractions(pagoRepositoryPort);
    }

    @Test
    @DisplayName("Cambiar estado de pago inexistente lanza PagoNotFoundException")
    void cambiarEstadoNotFound() {
        when(pagoRepositoryPort.findById("pay-001")).thenReturn(Optional.empty());

        assertThrows(PagoNotFoundException.class, () -> pagoService.cambiarEstado("pay-001", "pagado"));
    }

    @Test
    @DisplayName("Cambiar estado actualiza, persiste y audita")
    void cambiarEstadoActualizaYAudita() {
        Pago pago = pagoBase();
        pago.setId("pay-001");
        when(pagoRepositoryPort.findById("pay-001")).thenReturn(Optional.of(pago));
        when(pagoRepositoryPort.save(any(Pago.class))).thenAnswer(inv -> inv.getArgument(0));

        Pago resultado = pagoService.cambiarEstado("pay-001", "pagado");

        assertEquals("pagado", resultado.getEstado());
        verify(pagoRepositoryPort).save(pago);
        verify(auditoriaExpedientePort).registrar(
                eq("pac-001"), eq("usr-001"), eq("Cambio de estado de pago"),
                contains("ahora en estado pagado"), eq("pagos"));
    }

    @Test
    @DisplayName("Eliminar pago inexistente lanza PagoNotFoundException")
    void eliminarNotFound() {
        when(pagoRepositoryPort.findById("pay-001")).thenReturn(Optional.empty());

        assertThrows(PagoNotFoundException.class, () -> pagoService.eliminar("pay-001"));
    }

    @Test
    @DisplayName("Eliminar pago borra del repositorio y audita")
    void eliminarBorraYAudita() {
        Pago pago = pagoBase();
        pago.setId("pay-001");
        when(pagoRepositoryPort.findById("pay-001")).thenReturn(Optional.of(pago));

        pagoService.eliminar("pay-001");

        verify(pagoRepositoryPort).deleteById("pay-001");
        verify(auditoriaExpedientePort).registrar(
                eq("pac-001"), eq("usr-001"), eq("Eliminación de pago"),
                contains("eliminado"), eq("pagos"));
    }
}
