package com.syborx.brevemente.auth.application.service;

import com.syborx.brevemente.auth.application.ports.out.AuditoriaAccesoPort;
import com.syborx.brevemente.auth.application.ports.out.AutenticacionRepositoryPort;
import com.syborx.brevemente.auth.application.ports.out.RefreshTokenRepositoryPort;
import com.syborx.brevemente.auth.domain.exception.SesionInvalidaException;
import com.syborx.brevemente.auth.domain.model.RefreshToken;
import com.syborx.brevemente.auth.domain.model.Usuario;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SesionApplicationServiceTest {

    @Mock
    private RefreshTokenRepositoryPort refreshTokenRepositoryPort;

    @Mock
    private AutenticacionRepositoryPort autenticacionRepositoryPort;

    @Mock
    private AuditoriaAccesoPort auditoriaAccesoPort;

    private SesionApplicationService sesionService;

    @BeforeEach
    void setUp() {
        sesionService = new SesionApplicationService(
                refreshTokenRepositoryPort,
                autenticacionRepositoryPort,
                auditoriaAccesoPort,
                7
        );
    }

    @Test
    @DisplayName("Emitir refresh token persiste el hash y devuelve el token en claro")
    void emitirRefreshToken() {
        String tokenClaro = sesionService.emitirRefreshToken("usr-001", "127.0.0.1");
        assertNotNull(tokenClaro);
        assertFalse(tokenClaro.isBlank());
        verify(refreshTokenRepositoryPort).guardar(any(RefreshToken.class), eq("127.0.0.1"));
    }

    @Test
    @DisplayName("Cerrar sesión revoca todos los refresh tokens e incrementa token_version")
    void cerrarSesionRevoca() {
        sesionService.cerrarSesion(null, "usr-001", "127.0.0.1");

        verify(refreshTokenRepositoryPort).revocarTodosDeUsuario(eq("usr-001"), any(Instant.class));
        verify(autenticacionRepositoryPort).incrementarTokenVersion("usr-001");
        verify(auditoriaAccesoPort).registrarEvento(eq("usr-001"), eq("LOGOUT"), eq("127.0.0.1"), anyString());
    }

    @Test
    @DisplayName("Renovación de token ya revocado detecta robo y revoca todas las sesiones")
    void renovacionTokenRevocadoDetectaRobo() {
        RefreshToken tokenRevocado = new RefreshToken(
                "tok-001",
                "usr-001",
                "some-hash",
                Instant.now().plus(7, ChronoUnit.DAYS),
                Instant.now().minus(1, ChronoUnit.HOURS), // revocado hace 1 hora (fuera de gracia)
                "tok-002"
        );

        when(refreshTokenRepositoryPort.findByHash(anyString())).thenReturn(Optional.of(tokenRevocado));

        assertThrows(SesionInvalidaException.class, () -> sesionService.renovar("token-antiguo", "10.0.0.1"));

        // Se deben revocar todas las sesiones del usuario e incrementar tokenVersion
        verify(refreshTokenRepositoryPort).revocarTodosDeUsuario(eq("usr-001"), any(Instant.class));
        verify(autenticacionRepositoryPort).incrementarTokenVersion("usr-001");
        verify(auditoriaAccesoPort).registrarEvento(eq("usr-001"), eq("REFRESH_REUSE_DETECTED"), eq("10.0.0.1"), anyString());
    }
}
