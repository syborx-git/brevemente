package com.syborx.brevemente.auth.application.service;

import com.syborx.brevemente.auth.application.ports.in.CambiarPasswordUseCase;
import com.syborx.brevemente.auth.application.ports.in.GenerarPasswordTemporalUseCase;
import com.syborx.brevemente.auth.application.ports.in.RevocarSesionesUsuarioUseCase;
import com.syborx.brevemente.auth.application.ports.in.VerificarPasswordActualUseCase;
import com.syborx.brevemente.auth.application.ports.out.AuditoriaGestionPort;
import com.syborx.brevemente.auth.application.ports.out.AutenticacionRepositoryPort;
import com.syborx.brevemente.auth.application.ports.out.LoginAttemptPort;
import com.syborx.brevemente.auth.application.ports.out.RefreshTokenRepositoryPort;
import com.syborx.brevemente.auth.domain.exception.PasswordActualIncorrectaException;
import com.syborx.brevemente.auth.domain.exception.PasswordInvalidaException;
import com.syborx.brevemente.auth.domain.exception.SesionInvalidaException;
import com.syborx.brevemente.auth.domain.model.PasswordPolicy;
import com.syborx.brevemente.auth.domain.model.PasswordTemporal;
import com.syborx.brevemente.auth.domain.model.Usuario;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;

/**
 * Mecanismo único de credenciales (ADR-005): contraseña temporal + flag de
 * cambio obligatorio + reautenticación. Vive en el contexto `auth`.
 */
@Service
public class CredencialApplicationService implements
        CambiarPasswordUseCase,
        GenerarPasswordTemporalUseCase,
        RevocarSesionesUsuarioUseCase,
        VerificarPasswordActualUseCase {

    private static final int LONGITUD_TEMPORAL = 12;
    private static final String CHARS_TEMPORAL = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

    private final AutenticacionRepositoryPort autenticacionRepositoryPort;
    private final RefreshTokenRepositoryPort refreshTokenRepositoryPort;
    private final PasswordEncoder passwordEncoder;
    private final AuditoriaGestionPort auditoriaGestionPort;
    private final LoginAttemptPort loginAttemptPort;
    private final SecureRandom secureRandom = new SecureRandom();
    private final Duration ttlTemporal;

    public CredencialApplicationService(
            AutenticacionRepositoryPort autenticacionRepositoryPort,
            RefreshTokenRepositoryPort refreshTokenRepositoryPort,
            PasswordEncoder passwordEncoder,
            AuditoriaGestionPort auditoriaGestionPort,
            LoginAttemptPort loginAttemptPort,
            @Value("${app.security.password-temporal-ttl-hours:168}") long ttlHoras
    ) {
        this.autenticacionRepositoryPort = autenticacionRepositoryPort;
        this.refreshTokenRepositoryPort = refreshTokenRepositoryPort;
        this.passwordEncoder = passwordEncoder;
        this.auditoriaGestionPort = auditoriaGestionPort;
        this.loginAttemptPort = loginAttemptPort;
        this.ttlTemporal = Duration.ofHours(ttlHoras);
    }

    @Override
    @Transactional
    public void cambiarPassword(String usuarioId, String passwordActual, String nuevaPassword) {
        Usuario usuario = autenticacionRepositoryPort.findById(usuarioId)
                .orElseThrow(SesionInvalidaException::new);

        if (passwordActual == null || !passwordEncoder.matches(passwordActual, usuario.getPasswordHash())) {
            throw new PasswordActualIncorrectaException();
        }
        PasswordPolicy.validar(nuevaPassword);
        if (passwordEncoder.matches(nuevaPassword, usuario.getPasswordHash())) {
            throw new PasswordInvalidaException("La nueva contraseña no puede ser igual a la actual");
        }

        autenticacionRepositoryPort.actualizarPassword(usuarioId, passwordEncoder.encode(nuevaPassword));
        auditoriaGestionPort.registrar(usuarioId, "CAMBIO_PASSWORD", "USUARIO", usuarioId, Map.of());
    }

    @Override
    @Transactional
    public PasswordTemporal generarPasswordTemporal(String usuarioId, String actorId, String motivo) {
        String valor = generarValorTemporal();
        String hash = passwordEncoder.encode(valor);
        Instant venceEn = Instant.now().plus(ttlTemporal);

        autenticacionRepositoryPort.establecerPasswordTemporal(usuarioId, hash, venceEn);

        boolean reset = "RESET".equalsIgnoreCase(motivo);
        if (reset) {
            revocar(usuarioId, motivo, actorId, null);
        }
        String accion = reset ? "RESET_PASSWORD"
                : "ALTA_PACIENTE".equalsIgnoreCase(motivo) ? "ALTA_PACIENTE"
                : "ALTA_USUARIO";
        auditoriaGestionPort.registrar(actorId, accion,
                "USUARIO", usuarioId, Map.of("motivo", motivo == null ? "" : motivo));

        return new PasswordTemporal(valor, venceEn);
    }

    @Override
    @Transactional
    public void revocar(String usuarioId, String motivo, String actorId, String ip) {
        Instant ahora = Instant.now();
        refreshTokenRepositoryPort.revocarTodosDeUsuario(usuarioId, ahora);
        autenticacionRepositoryPort.incrementarTokenVersion(usuarioId);
        auditoriaGestionPort.registrar(actorId, "REVOCACION_ADMIN", "USUARIO", usuarioId,
                Map.of("motivo", motivo == null ? "" : motivo));
    }

    @Override
    @Transactional(readOnly = true)
    public void verificar(String usuarioId, String password) {
        Usuario usuario = autenticacionRepositoryPort.findById(usuarioId)
                .orElseThrow(SesionInvalidaException::new);

        loginAttemptPort.verificarPermitido(usuario.getEmail(), "stepup");
        if (password == null || !passwordEncoder.matches(password, usuario.getPasswordHash())) {
            loginAttemptPort.registrarFallo(usuario.getEmail(), "stepup");
            throw new PasswordActualIncorrectaException();
        }
        loginAttemptPort.registrarExito(usuario.getEmail());
    }

    private String generarValorTemporal() {
        StringBuilder sb = new StringBuilder(LONGITUD_TEMPORAL);
        for (int i = 0; i < LONGITUD_TEMPORAL; i++) {
            sb.append(CHARS_TEMPORAL.charAt(secureRandom.nextInt(CHARS_TEMPORAL.length())));
        }
        return sb.toString();
    }
}
