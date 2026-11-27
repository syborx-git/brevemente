package com.syborx.brevemente.usuario.application.service;

import com.syborx.brevemente.auth.application.ports.in.GenerarPasswordTemporalUseCase;
import com.syborx.brevemente.auth.application.ports.in.RevocarSesionesUsuarioUseCase;
import com.syborx.brevemente.auth.application.ports.in.VerificarPasswordActualUseCase;
import com.syborx.brevemente.auth.application.ports.out.AuditoriaGestionPort;
import com.syborx.brevemente.usuario.application.ports.out.UsuarioAdminRepositoryPort;
import com.syborx.brevemente.usuario.domain.exception.UsuarioConflictException;
import com.syborx.brevemente.usuario.infrastructure.adapters.in.rest.dto.RegistroIdentidadTerapeutaRequest;
import com.syborx.brevemente.usuario.infrastructure.adapters.in.rest.dto.UsuarioAdminDTO;
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
class UsuarioAdminApplicationServiceTest {

    @Mock
    private UsuarioAdminRepositoryPort repositoryPort;

    @Mock
    private GenerarPasswordTemporalUseCase generarPasswordTemporalUseCase;

    @Mock
    private RevocarSesionesUsuarioUseCase revocarSesionesUsuarioUseCase;

    @Mock
    private VerificarPasswordActualUseCase verificarPasswordActualUseCase;

    @Mock
    private AuditoriaGestionPort auditoriaGestionPort;

    private UsuarioAdminApplicationService service;

    @BeforeEach
    void setUp() {
        service = new UsuarioAdminApplicationService(
                repositoryPort,
                generarPasswordTemporalUseCase,
                revocarSesionesUsuarioUseCase,
                verificarPasswordActualUseCase,
                auditoriaGestionPort);
    }

    private UsuarioAdminDTO usuario(String... roles) {
        return new UsuarioAdminDTO(
                "usr-1", "Admin", "Plataforma", "admin@brevemente.org",
                List.of(roles), "activo", null, null, List.of(), null, null);
    }

    @Test
    @DisplayName("registrarIdentidadTerapeuta crea vínculo, asigna rol therapist y revoca sesiones")
    void registrarIdentidadCreaVinculoYRol() {
        RegistroIdentidadTerapeutaRequest req =
                new RegistroIdentidadTerapeutaRequest("12345678", "Terapia Breve Estratégica", "demo123");
        UsuarioAdminDTO resultado = usuario("admin_platform", "therapist");

        when(repositoryPort.existeCedula("12345678")).thenReturn(false);
        when(repositoryPort.findById("usr-1")).thenReturn(Optional.of(resultado));

        UsuarioAdminDTO out = service.registrarIdentidadTerapeuta("usr-1", req, "usr-1");

        verify(verificarPasswordActualUseCase).verificar("usr-1", "demo123");
        verify(repositoryPort).crearVinculoTerapeuta("usr-1", "12345678", "Terapia Breve Estratégica");
        verify(repositoryPort).asignarRol("usr-1", "therapist");
        verify(revocarSesionesUsuarioUseCase).revocar(eq("usr-1"), eq("REGISTRO_TERAPEUTA"), eq("usr-1"), isNull());
        assertEquals(resultado, out);
    }

    @Test
    @DisplayName("registrarIdentidadTerapeuta rechaza cédula duplicada")
    void registrarIdentidadRechazaCedulaDuplicada() {
        RegistroIdentidadTerapeutaRequest req =
                new RegistroIdentidadTerapeutaRequest("12345678", "TBE", "demo123");

        when(repositoryPort.existeCedula("12345678")).thenReturn(true);

        assertThrows(UsuarioConflictException.class,
                () -> service.registrarIdentidadTerapeuta("usr-1", req, "usr-1"));

        verify(repositoryPort, never()).crearVinculoTerapeuta(anyString(), anyString(), anyString());
        verify(repositoryPort, never()).asignarRol(anyString(), anyString());
    }

    @Test
    @DisplayName("darBajaPerfilTerapeuta quita el rol therapist a un admin-terapeuta")
    void darBajaAdminTerapeutaQuitaRol() {
        UsuarioAdminDTO actual = usuario("admin_platform", "therapist");
        UsuarioAdminDTO despues = usuario("admin_platform");

        when(repositoryPort.findById("usr-1"))
                .thenReturn(Optional.of(actual), Optional.of(despues));

        UsuarioAdminDTO out = service.darBajaPerfilTerapeuta("usr-1", "usr-1");

        verify(repositoryPort).quitarRol("usr-1", "therapist");
        verify(repositoryPort).sincronizarTerapeutaActivo("usr-1", false);
        verify(revocarSesionesUsuarioUseCase).revocar(eq("usr-1"), eq("BAJA_TERAPEUTA"), eq("usr-1"), isNull());
        assertEquals(despues, out);
    }

    @Test
    @DisplayName("darBajaPerfilTerapeuta rechaza si therapist es el único rol")
    void darBajaTerapeutaUnicoRolRechaza() {
        when(repositoryPort.findById("usr-1")).thenReturn(Optional.of(usuario("therapist")));

        assertThrows(UsuarioConflictException.class,
                () -> service.darBajaPerfilTerapeuta("usr-1", "usr-1"));

        verify(repositoryPort, never()).quitarRol(anyString(), anyString());
    }
}
