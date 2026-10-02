package com.syborx.brevemente.auth.application.service;

import com.syborx.brevemente.auth.application.ports.in.AutenticarUseCase;
import com.syborx.brevemente.auth.application.ports.out.AuditoriaAccesoPort;
import com.syborx.brevemente.auth.application.ports.out.AutenticacionRepositoryPort;
import com.syborx.brevemente.auth.domain.exception.CredencialesInvalidasException;
import com.syborx.brevemente.auth.domain.model.Usuario;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthApplicationService implements AutenticarUseCase {

    private final AutenticacionRepositoryPort autenticacionRepositoryPort;
    private final PasswordEncoder passwordEncoder;
    private final AuditoriaAccesoPort auditoriaAccesoPort;

    @Override
    @Transactional // escritura: login + auditoría de acceso atómicos
    public Usuario autenticar(String email, String password) {
        Usuario usuario = autenticacionRepositoryPort.findByEmail(email)
                .orElseThrow(CredencialesInvalidasException::new);
        if (!usuario.isActivo() || !passwordEncoder.matches(password, usuario.getPasswordHash())) {
            throw new CredencialesInvalidasException();
        }
        auditoriaAccesoPort.registrarLogin(usuario.getId(), usuario.getRoles());
        return usuario;
    }
}
