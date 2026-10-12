package com.syborx.brevemente.dashboard.application.service;

import com.syborx.brevemente.cita.application.ports.out.IdentidadAutenticadaPort;
import com.syborx.brevemente.dashboard.application.ports.out.SupervisionAsignacionRepositoryPort;
import com.syborx.brevemente.dashboard.domain.model.AlcanceDashboard;
import com.syborx.brevemente.dashboard.domain.model.AlcanceDashboard.TipoAlcance;
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
class DashboardScopeResolverTest {

    @Mock
    private IdentidadAutenticadaPort identidadAutenticadaPort;

    @Mock
    private SupervisionAsignacionRepositoryPort supervisionAsignacionRepositoryPort;

    private DashboardScopeResolver resolver;

    @BeforeEach
    void setUp() {
        resolver = new DashboardScopeResolver(identidadAutenticadaPort, supervisionAsignacionRepositoryPort);
    }

    @Test
    @DisplayName("GLOBAL por admin_platform")
    void globalPorAdminPlatform() {
        lenient().when(identidadAutenticadaPort.tieneRol("admin_platform")).thenReturn(true);

        AlcanceDashboard alcance = resolver.resolver();

        assertEquals(TipoAlcance.GLOBAL, alcance.tipo());
        assertTrue(alcance.terapeutaIds().isEmpty());
        assertTrue(alcance.puedeVerAlertasClinicas());
    }

    @Test
    @DisplayName("GLOBAL por admin_clinical")
    void globalPorAdminClinical() {
        lenient().when(identidadAutenticadaPort.tieneRol("admin_clinical")).thenReturn(true);

        AlcanceDashboard alcance = resolver.resolver();

        assertEquals(TipoAlcance.GLOBAL, alcance.tipo());
        assertTrue(alcance.terapeutaIds().isEmpty());
        assertTrue(alcance.puedeVerAlertasClinicas());
    }

    @Test
    @DisplayName("SCOPED une therapist + supervisor con deduplicación")
    void scopedUnionTerapeutaSupervisorConDedup() {
        lenient().when(identidadAutenticadaPort.tieneRol("therapist")).thenReturn(true);
        lenient().when(identidadAutenticadaPort.tieneRol("supervisor")).thenReturn(true);
        when(identidadAutenticadaPort.sub()).thenReturn("usr-004");
        when(identidadAutenticadaPort.terapeutaIds()).thenReturn(List.of("ter-001", "ter-002"));
        when(supervisionAsignacionRepositoryPort.findTerapeutasSupervisados("usr-004"))
                .thenReturn(List.of("ter-002", "ter-003"));

        AlcanceDashboard alcance = resolver.resolver();

        assertEquals(TipoAlcance.SCOPED, alcance.tipo());
        assertEquals(List.of("ter-001", "ter-002", "ter-003"), alcance.terapeutaIds());
        assertTrue(alcance.puedeVerAlertasClinicas());
    }

    @Test
    @DisplayName("Asistente puro → SCOPED y sin alertas clínicas")
    void asistentePuroScopedSinAlertas() {
        lenient().when(identidadAutenticadaPort.tieneRol("assistant")).thenReturn(true);
        when(identidadAutenticadaPort.terapeutaIds()).thenReturn(List.of("ter-001"));

        AlcanceDashboard alcance = resolver.resolver();

        assertEquals(TipoAlcance.SCOPED, alcance.tipo());
        assertEquals(List.of("ter-001"), alcance.terapeutaIds());
        assertFalse(alcance.puedeVerAlertasClinicas());
    }

    @Test
    @DisplayName("Therapist + assistant → puedeVerAlertasClinicas = true")
    void therapistAssistantVeAlertas() {
        lenient().when(identidadAutenticadaPort.tieneRol("therapist")).thenReturn(true);
        lenient().when(identidadAutenticadaPort.tieneRol("assistant")).thenReturn(true);
        when(identidadAutenticadaPort.terapeutaIds()).thenReturn(List.of("ter-001"));

        AlcanceDashboard alcance = resolver.resolver();

        assertTrue(alcance.puedeVerAlertasClinicas());
        assertEquals(List.of("ter-001"), alcance.terapeutaIds());
    }

    @Test
    @DisplayName("Supervisor puro con asignaciones → SCOPED con terapeutas supervisados")
    void supervisorConAsignaciones() {
        lenient().when(identidadAutenticadaPort.tieneRol("supervisor")).thenReturn(true);
        when(identidadAutenticadaPort.sub()).thenReturn("usr-003");
        when(supervisionAsignacionRepositoryPort.findTerapeutasSupervisados("usr-003"))
                .thenReturn(List.of("ter-001", "ter-002"));

        AlcanceDashboard alcance = resolver.resolver();

        assertEquals(TipoAlcance.SCOPED, alcance.tipo());
        assertEquals(List.of("ter-001", "ter-002"), alcance.terapeutaIds());
        assertTrue(alcance.puedeVerAlertasClinicas());
    }

    @Test
    @DisplayName("Supervisor sin asignaciones → SCOPED vacío")
    void supervisorSinAsignaciones() {
        lenient().when(identidadAutenticadaPort.tieneRol("supervisor")).thenReturn(true);
        when(identidadAutenticadaPort.sub()).thenReturn("usr-003");
        when(supervisionAsignacionRepositoryPort.findTerapeutasSupervisados("usr-003"))
                .thenReturn(List.of());

        AlcanceDashboard alcance = resolver.resolver();

        assertEquals(TipoAlcance.SCOPED, alcance.tipo());
        assertTrue(alcance.terapeutaIds().isEmpty());
        assertTrue(alcance.puedeVerAlertasClinicas());
    }

    @Test
    @DisplayName("Rol desconocido → SCOPED vacío")
    void rolDesconocidoScopedVacio() {
        AlcanceDashboard alcance = resolver.resolver();

        assertEquals(TipoAlcance.SCOPED, alcance.tipo());
        assertTrue(alcance.terapeutaIds().isEmpty());
        assertFalse(alcance.puedeVerAlertasClinicas());
    }
}
