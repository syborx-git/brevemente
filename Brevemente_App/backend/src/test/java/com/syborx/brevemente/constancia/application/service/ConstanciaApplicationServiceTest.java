package com.syborx.brevemente.constancia.application.service;

import com.syborx.brevemente.auditoria.application.ports.out.AuditoriaExpedientePort;
import com.syborx.brevemente.constancia.application.ports.out.ConstanciaRepositoryPort;
import com.syborx.brevemente.constancia.domain.exception.ConstanciaNotFoundException;
import com.syborx.brevemente.constancia.domain.model.ConstanciaFisica;
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
class ConstanciaApplicationServiceTest {

    @Mock
    private ConstanciaRepositoryPort constanciaRepositoryPort;

    @Mock
    private AuditoriaExpedientePort auditoriaExpedientePort;

    private ConstanciaApplicationService constanciaService;

    @BeforeEach
    void setUp() {
        constanciaService = new ConstanciaApplicationService(constanciaRepositoryPort, auditoriaExpedientePort);
    }

    private ConstanciaFisica constanciaBase() {
        return ConstanciaFisica.builder()
                .pacienteId("pac-001")
                .folioFisico("CONST-2026-084-FIS")
                .registradoPorId("usr-001")
                .build();
    }

    @Test
    @DisplayName("Listar constancias delega en el puerto de persistencia")
    void listarPorPacienteDelega() {
        ConstanciaFisica constancia = constanciaBase();
        when(constanciaRepositoryPort.findByPacienteId("pac-001")).thenReturn(List.of(constancia));

        List<ConstanciaFisica> resultado = constanciaService.listarPorPaciente("pac-001");

        assertEquals(1, resultado.size());
        assertSame(constancia, resultado.get(0));
    }

    @Test
    @DisplayName("Registrar constancia asigna id, estado y fecha por defecto y audita")
    void registrarAsignaDefaultsYAudita() {
        ConstanciaFisica constancia = constanciaBase();
        when(constanciaRepositoryPort.save(any(ConstanciaFisica.class))).thenAnswer(inv -> inv.getArgument(0));

        ConstanciaFisica resultado = constanciaService.registrar(constancia);

        assertNotNull(resultado.getId());
        assertTrue(resultado.getId().startsWith("con-fis-"));
        assertEquals("entregada_en_fisico", resultado.getEstado());
        assertNotNull(resultado.getRegistradoAt());
        verify(constanciaRepositoryPort).save(constancia);
        verify(auditoriaExpedientePort).registrar(
                eq("pac-001"), eq("usr-001"), eq("Registro de constancia física"),
                contains("CONST-2026-084-FIS"), eq("expediente"));
    }

    @Test
    @DisplayName("Registrar constancia respeta id y estado proporcionados")
    void registrarRespetaIdYEstado() {
        ConstanciaFisica constancia = constanciaBase();
        constancia.setId("con-fis-xyz");
        constancia.setEstado("anulada");
        when(constanciaRepositoryPort.save(any(ConstanciaFisica.class))).thenAnswer(inv -> inv.getArgument(0));

        ConstanciaFisica resultado = constanciaService.registrar(constancia);

        assertEquals("con-fis-xyz", resultado.getId());
        assertEquals("anulada", resultado.getEstado());
        assertNotNull(resultado.getRegistradoAt());
    }

    @Test
    @DisplayName("Anular constancia inexistente lanza ConstanciaNotFoundException")
    void anularNotFound() {
        when(constanciaRepositoryPort.findById("con-fis-001")).thenReturn(Optional.empty());

        assertThrows(ConstanciaNotFoundException.class, () -> constanciaService.anular("con-fis-001"));
    }

    @Test
    @DisplayName("Anular constancia marca estado anulada, persiste y audita")
    void anularMarcaAnuladaYAudita() {
        ConstanciaFisica constancia = constanciaBase();
        constancia.setId("con-fis-001");
        constancia.setEstado("entregada_en_fisico");
        when(constanciaRepositoryPort.findById("con-fis-001")).thenReturn(Optional.of(constancia));
        when(constanciaRepositoryPort.save(any(ConstanciaFisica.class))).thenAnswer(inv -> inv.getArgument(0));

        constanciaService.anular("con-fis-001");

        assertEquals("anulada", constancia.getEstado());
        verify(constanciaRepositoryPort).save(constancia);
        verify(auditoriaExpedientePort).registrar(
                eq("pac-001"), eq("usr-001"), eq("Anulación de constancia física"),
                contains("anulada"), eq("expediente"));
    }
}
