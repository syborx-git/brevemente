package com.syborx.brevemente.auth.application.service;

import com.syborx.brevemente.auth.application.ports.in.GestionarSesionUseCase;
import com.syborx.brevemente.auth.application.ports.out.AuditoriaAccesoPort;
import com.syborx.brevemente.auth.application.ports.out.AutenticacionRepositoryPort;
import com.syborx.brevemente.auth.application.ports.out.RefreshTokenRepositoryPort;
import com.syborx.brevemente.auth.domain.exception.SesionInvalidaException;
import com.syborx.brevemente.auth.domain.model.RefreshToken;
import com.syborx.brevemente.auth.domain.model.Usuario;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;

@Service
public class SesionApplicationService implements GestionarSesionUseCase {

    /**
     * Ventana de tolerancia para rotaciones concurrentes legítimas (dos pestañas
     * renovando a la vez). Dentro de ella un token recién rotado se rechaza sin
     * tratarlo como robo.
     */
    private static final Duration GRACIA_ROTACION = Duration.ofSeconds(20);

    private final RefreshTokenRepositoryPort refreshTokenRepositoryPort;
    private final AutenticacionRepositoryPort autenticacionRepositoryPort;
    private final AuditoriaAccesoPort auditoriaAccesoPort;
    private final Duration refreshTtl;
    private final SecureRandom secureRandom = new SecureRandom();

    public SesionApplicationService(
            RefreshTokenRepositoryPort refreshTokenRepositoryPort,
            AutenticacionRepositoryPort autenticacionRepositoryPort,
            AuditoriaAccesoPort auditoriaAccesoPort,
            @Value("${app.jwt.refresh-expiration-days:7}") long refreshExpirationDays
    ) {
        this.refreshTokenRepositoryPort = refreshTokenRepositoryPort;
        this.autenticacionRepositoryPort = autenticacionRepositoryPort;
        this.auditoriaAccesoPort = auditoriaAccesoPort;
        this.refreshTtl = Duration.ofDays(refreshExpirationDays);
    }

    @Override
    @Transactional
    public String emitirRefreshToken(String usuarioId, String ip) {
        return crearYGuardar(usuarioId, ip).raw();
    }

    @Override
    // Las revocaciones por reutilización deben persistir aunque se lance la excepción.
    @Transactional(noRollbackFor = SesionInvalidaException.class)
    public SesionRenovada renovar(String refreshToken, String ip) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new SesionInvalidaException();
        }
        Instant ahora = Instant.now();
        RefreshToken actual = refreshTokenRepositoryPort.findByHash(sha256(refreshToken))
                .orElseThrow(SesionInvalidaException::new);

        if (actual.revocado()) {
            boolean rotacionReciente = actual.replacedBy() != null
                    && actual.revokedAt().plus(GRACIA_ROTACION).isAfter(ahora);
            if (!rotacionReciente) {
                // Reutilización de un token ya rotado/revocado => posible robo.
                refreshTokenRepositoryPort.revocarTodosDeUsuario(actual.usuarioId(), ahora);
                autenticacionRepositoryPort.incrementarTokenVersion(actual.usuarioId());
                auditoriaAccesoPort.registrarEvento(actual.usuarioId(), "REFRESH_REUSE_DETECTED", ip,
                        "Se revocaron todas las sesiones del usuario");
            }
            throw new SesionInvalidaException();
        }
        if (actual.expirado(ahora)) {
            throw new SesionInvalidaException();
        }

        Usuario usuario = autenticacionRepositoryPort.findById(actual.usuarioId())
                .filter(Usuario::isActivo)
                .orElse(null);
        if (usuario == null) {
            refreshTokenRepositoryPort.revocarTodosDeUsuario(actual.usuarioId(), ahora);
            throw new SesionInvalidaException();
        }

        TokenEmitido nuevo = crearYGuardar(usuario.getId(), ip);
        refreshTokenRepositoryPort.revocar(actual.id(), nuevo.id(), ahora);
        return new SesionRenovada(usuario, nuevo.raw());
    }

    @Override
    @Transactional
    public void cerrarSesion(String refreshToken, String usuarioIdAutenticado, String ip) {
        String usuarioId = usuarioIdAutenticado;
        if (refreshToken != null && !refreshToken.isBlank()) {
            Optional<RefreshToken> token = refreshTokenRepositoryPort.findByHash(sha256(refreshToken));
            if (usuarioId == null && token.isPresent()) {
                usuarioId = token.get().usuarioId();
            }
        }
        if (usuarioId == null) {
            return; // nada que revocar: logout idempotente
        }
        Instant ahora = Instant.now();
        refreshTokenRepositoryPort.revocarTodosDeUsuario(usuarioId, ahora);
        autenticacionRepositoryPort.incrementarTokenVersion(usuarioId);
        auditoriaAccesoPort.registrarEvento(usuarioId, "LOGOUT", ip, "Sesión cerrada y tokens revocados");
    }

    @Override
    @Transactional(readOnly = true)
    public Usuario obtenerUsuario(String usuarioId) {
        return autenticacionRepositoryPort.findById(usuarioId)
                .filter(Usuario::isActivo)
                .orElseThrow(SesionInvalidaException::new);
    }

    // -------------------------------------------------------------------------

    private record TokenEmitido(String id, String raw) {
    }

    private TokenEmitido crearYGuardar(String usuarioId, String ip) {
        byte[] bytes = new byte[32]; // 256 bits de entropía
        secureRandom.nextBytes(bytes);
        String raw = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        String id = UUID.randomUUID().toString();
        refreshTokenRepositoryPort.guardar(new RefreshToken(
                id, usuarioId, sha256(raw), Instant.now().plus(refreshTtl), null, null), ip);
        return new TokenEmitido(id, raw);
    }

    private static String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 no disponible", e);
        }
    }
}
