package com.syborx.brevemente.auth.infrastructure.adapters.out.persistence;

import com.syborx.brevemente.auth.application.ports.out.AutenticacionRepositoryPort;
import com.syborx.brevemente.auth.application.ports.out.LicenseLookupPort;
import com.syborx.brevemente.auth.application.ports.out.VinculoIdentidadPort;
import com.syborx.brevemente.auth.domain.model.EstadoSesion;
import com.syborx.brevemente.auth.domain.model.Usuario;
import com.syborx.brevemente.auth.infrastructure.adapters.out.persistence.entity.UsuarioJpaEntity;
import com.syborx.brevemente.auth.infrastructure.adapters.out.persistence.mapper.AuthPersistenceMapper;
import com.syborx.brevemente.auth.infrastructure.adapters.out.persistence.repository.SpringDataUsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class AuthPersistenceAdapter implements AutenticacionRepositoryPort {

    private final SpringDataUsuarioRepository springDataUsuarioRepository;
    private final AuthPersistenceMapper authPersistenceMapper;
    private final LicenseLookupPort licenseLookupPort;
    private final VinculoIdentidadPort vinculoIdentidadPort;

    @Override
    public Optional<Usuario> findByEmail(String email) {
        return springDataUsuarioRepository.findByEmail(email).map(this::toDomain);
    }

    @Override
    public Optional<Usuario> findById(String usuarioId) {
        return springDataUsuarioRepository.findByIdWithPermisos(usuarioId).map(this::toDomain);
    }

    @Override
    public Optional<EstadoSesion> findEstadoSesion(String usuarioId) {
        return springDataUsuarioRepository.findEstadoSesion(usuarioId)
                .map(v -> new EstadoSesion(
                        v.getTokenVersion() != null ? v.getTokenVersion() : 1,
                        Boolean.TRUE.equals(v.getActivo()),
                        Boolean.TRUE.equals(v.getDebeCambiarPassword())));
    }

    @Override
    public void incrementarTokenVersion(String usuarioId) {
        springDataUsuarioRepository.incrementTokenVersion(usuarioId);
    }

    @Override
    public void actualizarPassword(String usuarioId, String nuevoHash) {
        springDataUsuarioRepository.actualizarPassword(usuarioId, nuevoHash);
    }

    @Override
    public void establecerPasswordTemporal(String usuarioId, String hashTemporal, Instant venceEn) {
        springDataUsuarioRepository.establecerPasswordTemporal(usuarioId, hashTemporal, venceEn.atOffset(java.time.ZoneOffset.UTC));
    }

    private Usuario toDomain(UsuarioJpaEntity entity) {
        return authPersistenceMapper.toDomain(
                entity,
                licenseLookupPort.findLicenseByUsuarioId(entity.getId()),
                vinculoIdentidadPort.findTerapeutaIdsByUsuarioId(entity.getId()),
                vinculoIdentidadPort.findPacienteIdByUsuarioId(entity.getId())
        );
    }
}
