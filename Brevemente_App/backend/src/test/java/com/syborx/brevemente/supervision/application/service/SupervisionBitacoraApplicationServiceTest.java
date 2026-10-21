package com.syborx.brevemente.supervision.application.service;

import com.syborx.brevemente.auditoria.application.ports.out.AuditoriaExpedientePort;
import com.syborx.brevemente.supervision.application.ports.out.SupervisionBitacoraRepositoryPort;
import com.syborx.brevemente.supervision.domain.exception.BitacoraNotFoundException;
import com.syborx.brevemente.supervision.domain.model.SupervisionBitacora;
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
class SupervisionBitacoraApplicationServiceTest {

    @Mock
    private SupervisionBitacoraRepositoryPort bitacoraRepositoryPort;

    @Mock
    private AuditoriaExpedientePort auditoriaExpedientePort;

    private SupervisionBitacoraApplicationService service;

    @BeforeEach
    void setUp() {
        service = new SupervisionBitacoraApplicationService(bitacoraRepositoryPort, auditoriaExpedientePort);
    }

    private SupervisionBitacora bitacora(String terapeutaId) {
        return SupervisionBitacora.builder()
                .pacienteId("pac-001")
                .terapeutaId(terapeutaId)
                .numeroSesion(1)
                .supervisorNombre("Dra. Isabel Cárdenas")
                .build();
    }

    @Test
    @DisplayName("Listar bitácoras como evaluador devuelve todas sin filtrar")
    void listarEvaluadorDevuelveTodas() {
        when(bitacoraRepositoryPort.findByPacienteId("pac-001"))
                .thenReturn(List.of(bitacora("ter-001"), bitacora("ter-002")));

        List<SupervisionBitacora> resultado =
                service.listarPorPaciente("pac-001", List.of("ter-001"), true);

        assertEquals(2, resultado.size());
    }

    @Test
    @DisplayName("Listar bitácoras como terapeuta filtra por terapeutaIds")
    void listarTerapeutaFiltraPorIds() {
        when(bitacoraRepositoryPort.findByPacienteId("pac-001"))
                .thenReturn(List.of(bitacora("ter-001"), bitacora("ter-002")));

        List<SupervisionBitacora> resultado =
                service.listarPorPaciente("pac-001", List.of("ter-001"), false);

        assertEquals(1, resultado.size());
        assertEquals("ter-001", resultado.get(0).getTerapeutaId());
    }

    @Test
    @DisplayName("Registrar bitácora asigna id por defecto y audita")
    void registrarAsignaIdYAudita() {
        SupervisionBitacora bitacora = bitacora("ter-001");
        when(bitacoraRepositoryPort.save(any(SupervisionBitacora.class))).thenAnswer(inv -> inv.getArgument(0));

        SupervisionBitacora resultado = service.registrar(bitacora);

        assertNotNull(resultado.getId());
        assertTrue(resultado.getId().startsWith("sup-"));
        verify(bitacoraRepositoryPort).save(bitacora);
        verify(auditoriaExpedientePort).registrar(
                eq("pac-001"), isNull(), eq("Bitácora de supervisión"),
                contains("Sesión 1"), eq("sesion"));
    }

    @Test
    @DisplayName("Eliminar bitácora inexistente lanza BitacoraNotFoundException")
    void eliminarNotFound() {
        when(bitacoraRepositoryPort.findById("sup-001")).thenReturn(Optional.empty());

        assertThrows(BitacoraNotFoundException.class,
                () -> service.eliminar("sup-001", List.of("ter-001"), false));
    }

    @Test
    @DisplayName("Eliminar bitácora ajena al terapeuta lanza BitacoraNotFoundException")
    void eliminarFueraDeAlcance() {
        SupervisionBitacora ajena = bitacora("ter-002");
        ajena.setId("sup-001");
        when(bitacoraRepositoryPort.findById("sup-001")).thenReturn(Optional.of(ajena));

        assertThrows(BitacoraNotFoundException.class,
                () -> service.eliminar("sup-001", List.of("ter-001"), false));
        verify(bitacoraRepositoryPort, never()).deleteById(anyString());
    }

    @Test
    @DisplayName("Eliminar bitácora propia borra del repositorio y audita")
    void eliminarPropiaBorraYAudita() {
        SupervisionBitacora propia = bitacora("ter-001");
        propia.setId("sup-001");
        when(bitacoraRepositoryPort.findById("sup-001")).thenReturn(Optional.of(propia));

        service.eliminar("sup-001", List.of("ter-001"), false);

        verify(bitacoraRepositoryPort).deleteById("sup-001");
        verify(auditoriaExpedientePort).registrar(
                eq("pac-001"), isNull(), eq("Eliminación de bitácora de supervisión"),
                contains("Sesión 1"), eq("sesion"));
    }
}
