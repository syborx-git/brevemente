package com.syborx.brevemente.dashboard.application.service;

import com.syborx.brevemente.cita.application.ports.out.CitaRepositoryPort;
import com.syborx.brevemente.cita.domain.model.Cita;
import com.syborx.brevemente.dashboard.domain.model.AccionDominante;
import com.syborx.brevemente.dashboard.domain.model.AlcanceDashboard;
import com.syborx.brevemente.dashboard.domain.model.AlcanceDashboard.TipoAlcance;
import com.syborx.brevemente.dashboard.domain.model.DashboardStats;
import com.syborx.brevemente.paciente.application.ports.out.PacienteRepositoryPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DashboardApplicationServiceTest {

    @Mock
    private PacienteRepositoryPort pacienteRepositoryPort;

    @Mock
    private CitaRepositoryPort citaRepositoryPort;

    @Mock
    private DashboardScopeResolver dashboardScopeResolver;

    private DashboardApplicationService service;

    @BeforeEach
    void setUp() {
        service = new DashboardApplicationService(pacienteRepositoryPort, citaRepositoryPort, dashboardScopeResolver);
    }

    @Test
    @DisplayName("obtenerStats scoped filtra por terapeutaIds y calcula alertas")
    void statsScoped() {
        AlcanceDashboard alcance = new AlcanceDashboard(TipoAlcance.SCOPED, List.of("ter-001", "ter-002"), true);
        when(dashboardScopeResolver.resolver()).thenReturn(alcance);
        when(pacienteRepositoryPort.countByStatus("activo", alcance.terapeutaIds())).thenReturn(5L);
        when(citaRepositoryPort.countByDia(any(), any(), eq(alcance.terapeutaIds()))).thenReturn(3L);
        when(pacienteRepositoryPort.countConConsentimientoPendiente(alcance.terapeutaIds())).thenReturn(2L);
        when(pacienteRepositoryPort.countByRiskLevelIn(any(), eq(alcance.terapeutaIds()))).thenReturn(4L);
        when(pacienteRepositoryPort.countByStatus("pendiente", alcance.terapeutaIds())).thenReturn(1L);

        DashboardStats stats = service.obtenerStats();

        assertEquals(5L, stats.getPacientesActivos());
        assertEquals(3L, stats.getCitasHoyCount());
        assertEquals(2L, stats.getAlertasConsentimiento());
        assertEquals(4L, stats.getAlertasRiesgo());
        assertEquals(1L, stats.getPendientesClinicos());
    }

    @Test
    @DisplayName("obtenerStats scoped sin terapeutas devuelve ceros sin consultar repositorios")
    void statsScopedVacio() {
        AlcanceDashboard alcance = new AlcanceDashboard(TipoAlcance.SCOPED, List.of(), true);
        when(dashboardScopeResolver.resolver()).thenReturn(alcance);

        DashboardStats stats = service.obtenerStats();

        assertEquals(0L, stats.getPacientesActivos());
        assertEquals(0L, stats.getCitasHoyCount());
        assertEquals(0L, stats.getAlertasConsentimiento());
        assertEquals(0L, stats.getAlertasRiesgo());
        assertEquals(0L, stats.getPendientesClinicos());
        verifyNoInteractions(pacienteRepositoryPort);
        verifyNoInteractions(citaRepositoryPort);
    }

    @Test
    @DisplayName("listarAlertas para asistente devuelve vacío sin consultar repositorios")
    void alertasVaciasAsistente() {
        AlcanceDashboard alcance = new AlcanceDashboard(TipoAlcance.SCOPED, List.of("ter-001"), false);
        when(dashboardScopeResolver.resolver()).thenReturn(alcance);

        assertTrue(service.listarAlertas().isEmpty());
        verifyNoInteractions(pacienteRepositoryPort);
        verifyNoInteractions(citaRepositoryPort);
    }

    @Test
    @DisplayName("listarCitasHoy scoped filtra por terapeutaIds")
    void citasHoyScoped() {
        AlcanceDashboard alcance = new AlcanceDashboard(TipoAlcance.SCOPED, List.of("ter-001"), true);
        when(dashboardScopeResolver.resolver()).thenReturn(alcance);
        Cita cita = Cita.builder().id("cit-001").terapeutaId("ter-001").build();
        when(citaRepositoryPort.findByDia(any(), any(), eq(alcance.terapeutaIds())))
                .thenReturn(List.of(cita));

        List<Cita> resultado = service.listarCitasHoy();

        assertEquals(1, resultado.size());
        assertEquals("cit-001", resultado.get(0).getId());
    }

    @Test
    @DisplayName("obtenerAccionDominante scoped usa findProximaDeHoy filtrado")
    void accionDominanteScoped() {
        AlcanceDashboard alcance = new AlcanceDashboard(TipoAlcance.SCOPED, List.of("ter-001"), true);
        when(dashboardScopeResolver.resolver()).thenReturn(alcance);
        Cita cita = Cita.builder()
                .id("cit-002")
                .pacienteId("pac-001")
                .terapeutaId("ter-001")
                .fechaHoraInicio(OffsetDateTime.parse("2026-10-12T10:00:00-06:00"))
                .tipoCita("primera")
                .modalidad("PRESENCIAL")
                .duracionMinutos(30)
                .build();
        when(citaRepositoryPort.findProximaDeHoy(any(), any(), eq(alcance.terapeutaIds())))
                .thenReturn(Optional.of(cita));

        Optional<AccionDominante> resultado = service.obtenerAccionDominante();

        assertTrue(resultado.isPresent());
        assertEquals("cit-002", resultado.get().getCitaId());
    }
}
