package com.syborx.brevemente.auth.infrastructure.adapters.out.persistence;

import com.syborx.brevemente.auth.application.ports.out.AutenticacionRepositoryPort;
import com.syborx.brevemente.auth.application.ports.out.LicenseLookupPort;
import com.syborx.brevemente.auth.domain.model.Usuario;
import com.syborx.brevemente.auth.infrastructure.adapters.out.persistence.mapper.AuthPersistenceMapper;
import com.syborx.brevemente.auth.infrastructure.adapters.out.persistence.repository.SpringDataUsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@RequiredArgsConstructor
public class AuthPersistenceAdapter implements AutenticacionRepositoryPort {

    private final SpringDataUsuarioRepository springDataUsuarioRepository;
    private final AuthPersistenceMapper authPersistenceMapper;
    private final LicenseLookupPort licenseLookupPort;

    @Override
    public Optional<Usuario> findByEmail(String email) {
        return springDataUsuarioRepository.findByEmail(email)
                .map(entity -> authPersistenceMapper.toDomain(
                        entity,
                        licenseLookupPort.findLicenseByUsuarioId(entity.getId())
                ));
    }
}
