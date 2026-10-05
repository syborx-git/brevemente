package com.syborx.brevemente.auth.application.service;

import com.syborx.brevemente.auth.application.ports.in.AutenticarUseCase;
import com.syborx.brevemente.auth.application.ports.out.AuditoriaAccesoPort;
import com.syborx.brevemente.auth.application.ports.out.AutenticacionRepositoryPort;
import com.syborx.brevemente.auth.application.ports.out.LoginAttemptPort;
import com.syborx.brevemente.auth.domain.exception.CredencialesInvalidasException;
import com.syborx.brevemente.auth.domain.model.Usuario;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
public class AuthApplicationService implements AutenticarUseCase {

    private final AutenticacionRepositoryPort autenticacionRepositoryPort;
    private final PasswordEncoder passwordEncoder;
    private final AuditoriaAccesoPort auditoriaAccesoPort;
    private final LoginAttemptPort loginAttemptPort;

    /**
     * Hash señuelo: cuando el correo no existe se ejecuta igualmente un BCrypt
     * para que el tiempo de respuesta no revele qué cuentas existen.
     */
    private final String dummyHash;

    public AuthApplicationService(
            AutenticacionRepositoryPort autenticacionRepositoryPort,
            PasswordEncoder passwordEncoder,
            AuditoriaAccesoPort auditoriaAccesoPort,
            LoginAttemptPort loginAttemptPort
    ) {
        this.autenticacionRepositoryPort = autenticacionRepositoryPort;
        this.passwordEncoder = passwordEncoder;
        this.auditoriaAccesoPort = auditoriaAccesoPort;
        this.loginAttemptPort = loginAttemptPort;
        this.dummyHash = passwordEncoder.encode(UUID.randomUUID().toString());
    }

    @Override
    @Transactional // escritura: login + auditoría de acceso atómicos
    public Usuario autenticar(String email, String password, String ip) {
        String emailNormalizado = email == null ? "" : email.trim().toLowerCase();

        // 1. Anti fuerza bruta: se evalúa ANTES de comprobar la contraseña.
        loginAttemptPort.verificarPermitido(emailNormalizado, ip);

        Optional<Usuario> encontrado = autenticacionRepositoryPort.findByEmail(emailNormalizado);
        String hash = encontrado.map(Usuario::getPasswordHash).orElse(dummyHash);
        boolean passwordOk = passwordEncoder.matches(password, hash);

        if (encontrado.isEmpty() || !passwordOk || !encontrado.get().isActivo()) {
            String motivo = encontrado.isEmpty() ? "USUARIO_INEXISTENTE"
                    : !passwordOk ? "PASSWORD_INCORRECTO"
                    : "USUARIO_INACTIVO";
            loginAttemptPort.registrarFallo(emailNormalizado, ip);
            auditoriaAccesoPort.registrarIntentoFallido(
                    encontrado.map(Usuario::getId).orElse(null), emailNormalizado, ip, motivo);
            // Mensaje genérico: no se revela el motivo al cliente.
            throw new CredencialesInvalidasException();
        }

        Usuario usuario = encontrado.get();
        loginAttemptPort.registrarExito(emailNormalizado);
        auditoriaAccesoPort.registrarLogin(usuario.getId(), usuario.getRoles(), ip);
        return usuario;
    }
}
