package com.syborx.brevemente.cita.application.service;

import com.syborx.brevemente.auditoria.application.ports.out.AuditoriaExpedientePort;
import com.syborx.brevemente.cita.application.ports.out.CitaRepositoryPort;
import com.syborx.brevemente.cita.application.ports.out.DiaNoLaborablePort;
import com.syborx.brevemente.cita.application.ports.out.IdentidadAutenticadaPort;
import com.syborx.brevemente.cita.application.ports.out.PacienteConsentimientoPort;
import com.syborx.brevemente.cita.application.ports.out.PasarelaPagosPort;
import com.syborx.brevemente.cita.application.ports.out.RegistroSesionPort;
import com.syborx.brevemente.cita.application.ports.out.SupervisionScopePort;
import com.syborx.brevemente.cita.domain.exception.TransicionEstadoCitaInvalidaException;
import com.syborx.brevemente.cita.domain.model.Cita;
import com.syborx.brevemente.cita.domain.model.CitaFiltro;
import com.syborx.brevemente.paciente.application.ports.out.TerapeutaConfigRepositoryPort;
import com.syborx.brevemente.pago.application.ports.out.PagoRepositoryPort;
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
class CitaApplicationServiceTest {

    @Mock
    private CitaRepositoryPort citaRepositoryPort;

    @Mock
    private DiaNoLaborablePort diaNoLaborablePort;

    @Mock
    private PacienteConsentimientoPort pacienteConsentimientoPort;

    @Mock
    private IdentidadAutenticadaPort identidadAutenticadaPort;

    @Mock
    private SupervisionScopePort supervisionScopePort;

    @Mock
    private PasarelaPagosPort pasarelaPagosPort;

    @Mock
    private PagoRepositoryPort pagoRepositoryPort;

    @Mock
    private TerapeutaConfigRepositoryPort terapeutaConfigRepositoryPort;

    @Mock
    private AuditoriaExpedientePort auditoriaExpedientePort;

    @Mock
    private RegistroSesionPort registroSesionPort;

    private CitaApplicationService service;

    @BeforeEach
    void setUp() {
        service = new CitaApplicationService(
                citaRepositoryPort,
                diaNoLaborablePort,
                pacienteConsentimientoPort,
                identidadAutenticadaPort,
                supervisionScopePort,
                pasarelaPagosPort,
                pagoRepositoryPort,
                terapeutaConfigRepositoryPort,
                auditoriaExpedientePort,
                registroSesionPort);

        // Rol patient actuando sobre su propia cita (lenient: no todos los casos llegan a sub()).
        lenient().when(identidadAutenticadaPort.tieneRol("patient")).thenReturn(true);
        lenient().when(identidadAutenticadaPort.pacienteId()).thenReturn("pac-001");
        lenient().when(identidadAutenticadaPort.sub()).thenReturn("usr-001");
    }

    private Cita citaBase(String estadoCita, String paymentStatus) {
        return Cita.builder()
                .id("cit-1")
                .pacienteId("pac-001")
                .estadoCita(estadoCita)
                .paymentStatus(paymentStatus)
                .build();
    }

    private Pago pagoBase(String estado) {
        return Pago.builder()
                .id("pay-1")
                .pacienteId("pac-001")
                .citaId("cit-1")
                .concepto("Consulta seguimiento - cita cit-1")
                .monto(new BigDecimal("600.00"))
                .estado(estado)
                .build();
    }

    @Test
    @DisplayName("Cancelar cita pagada reembolsa el pago (soft-state) y deja paymentStatus='reembolsado'")
    void cancelarCitaPagadaReembolsa() {
        Cita cita = citaBase("confirmada", "pagada");
        Pago pago = pagoBase("pagado");

        when(citaRepositoryPort.findById("cit-1")).thenReturn(Optional.of(cita));
        when(pagoRepositoryPort.findByCitaId("cit-1")).thenReturn(Optional.of(pago));
        when(pasarelaPagosPort.reembolsar(eq("cit-1"), any(BigDecimal.class), anyString()))
                .thenReturn(new PasarelaPagosPort.ResultadoReembolso(true, "refund-abc"));
        when(citaRepositoryPort.save(cita)).thenReturn(cita);

        Cita resultado = service.actualizarEstado("cit-1", "cancelada", "CAMBIO_DE_PLANES", null);

        assertEquals("cancelada", resultado.getEstadoCita());
        assertEquals("reembolsado", resultado.getPaymentStatus());
        assertEquals("reembolsado", pago.getEstado());
        verify(pagoRepositoryPort).save(pago);
        verify(pagoRepositoryPort, never()).deleteById(anyString());
        verify(pasarelaPagosPort).reembolsar(eq("cit-1"), any(BigDecimal.class), anyString());
    }

    @Test
    @DisplayName("Cancelar cita pendiente anula el pago provisional (sin reembolso)")
    void cancelarCitaPendienteAnula() {
        Cita cita = citaBase("pendiente", "pendiente");
        Pago pago = pagoBase("pendiente");

        when(citaRepositoryPort.findById("cit-1")).thenReturn(Optional.of(cita));
        when(pagoRepositoryPort.findByCitaId("cit-1")).thenReturn(Optional.of(pago));
        when(citaRepositoryPort.save(cita)).thenReturn(cita);

        Cita resultado = service.actualizarEstado("cit-1", "cancelada", "NO_PUEDE_ASISTIR", null);

        assertEquals("cancelada", resultado.getEstadoCita());
        assertEquals("pendiente", resultado.getPaymentStatus());
        assertEquals("pendiente", pago.getEstado());
        verify(pagoRepositoryPort).deleteById("pay-1");
        verify(pagoRepositoryPort, never()).save(any());
        verify(pasarelaPagosPort, never()).reembolsar(anyString(), any(), anyString());
    }

    @Test
    @DisplayName("Cancelar cita con pago parcial marca reembolsado sin borrar (monto completo, modelo actual)")
    void cancelarCitaParcialReembolsa() {
        Cita cita = citaBase("confirmada", "pagada");
        Pago pago = pagoBase("parcial");

        when(citaRepositoryPort.findById("cit-1")).thenReturn(Optional.of(cita));
        when(pagoRepositoryPort.findByCitaId("cit-1")).thenReturn(Optional.of(pago));
        when(citaRepositoryPort.save(cita)).thenReturn(cita);

        Cita resultado = service.actualizarEstado("cit-1", "cancelada", "MOTIVO_CLINICO", null);

        assertEquals("reembolsado", resultado.getPaymentStatus());
        assertEquals("reembolsado", pago.getEstado());
        verify(pagoRepositoryPort).save(pago);
        verify(pagoRepositoryPort, never()).deleteById(anyString());
        verify(pasarelaPagosPort, never()).reembolsar(anyString(), any(), anyString());
    }

    @Test
    @DisplayName("Cancelar cita exenta no procesa ningún pago (no-op)")
    void cancelarCitaExentaNoOp() {
        Cita cita = citaBase("confirmada", "exenta");

        when(citaRepositoryPort.findById("cit-1")).thenReturn(Optional.of(cita));
        when(pagoRepositoryPort.findByCitaId("cit-1")).thenReturn(Optional.empty());
        when(citaRepositoryPort.save(cita)).thenReturn(cita);

        Cita resultado = service.actualizarEstado("cit-1", "cancelada", "CAMBIO_DE_PLANES", null);

        assertEquals("cancelada", resultado.getEstadoCita());
        assertEquals("exenta", resultado.getPaymentStatus());
        verify(pagoRepositoryPort, never()).save(any());
        verify(pagoRepositoryPort, never()).deleteById(anyString());
        verify(pasarelaPagosPort, never()).reembolsar(anyString(), any(), anyString());
    }

    @Test
    @DisplayName("Si la pasarela falla el reembolso, la cancelación aborta y el pago queda intacto")
    void cancelarAbortaSiPasarelaFalla() {
        Cita cita = citaBase("confirmada", "pagada");
        Pago pago = pagoBase("pagado");

        when(citaRepositoryPort.findById("cit-1")).thenReturn(Optional.of(cita));
        when(pagoRepositoryPort.findByCitaId("cit-1")).thenReturn(Optional.of(pago));
        when(pasarelaPagosPort.reembolsar(eq("cit-1"), any(BigDecimal.class), anyString()))
                .thenReturn(new PasarelaPagosPort.ResultadoReembolso(false, null));

        assertThrows(TransicionEstadoCitaInvalidaException.class,
                () -> service.actualizarEstado("cit-1", "cancelada", "CAMBIO_DE_PLANES", null));

        assertEquals("pagado", pago.getEstado());
        verify(pagoRepositoryPort, never()).save(any());
        verify(pagoRepositoryPort, never()).deleteById(anyString());
        verify(citaRepositoryPort, never()).save(any());
    }

    @Test
    @DisplayName("listarGlobales delega al repositorio sin aplicar alcance de terapeuta")
    void listarGlobalesSinAlcance() {
        CitaFiltro filtro = new CitaFiltro("ter-X", null, null, null, "confirmada", null, null, null);
        Cita cita = citaBase("confirmada", "pendiente");
        when(citaRepositoryPort.findAll(filtro)).thenReturn(List.of(cita));

        List<Cita> resultado = service.listarGlobales(filtro);

        assertEquals(List.of(cita), resultado);
        verify(citaRepositoryPort).findAll(filtro);
    }
}
