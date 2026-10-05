package com.syborx.brevemente.auth.infrastructure.adapters.out.persistence.mapper;

import com.syborx.brevemente.auth.domain.model.Usuario;
import com.syborx.brevemente.auth.infrastructure.adapters.out.persistence.entity.PermisoJpaEntity;
import com.syborx.brevemente.auth.infrastructure.adapters.out.persistence.entity.RolJpaEntity;
import com.syborx.brevemente.auth.infrastructure.adapters.out.persistence.entity.UsuarioJpaEntity;
import org.springframework.stereotype.Component;

import java.util.Set;
import java.util.stream.Collectors;

@Component
public class AuthPersistenceMapper {

    public Usuario toDomain(UsuarioJpaEntity entity, String license) {
        if (entity == null) {
            return null;
        }

        Set<RolJpaEntity> rolesEntity = entity.getRoles() != null ? entity.getRoles() : Set.of();

        Set<String> roles = rolesEntity.stream()
                .map(RolJpaEntity::getCodigo)
                .collect(Collectors.toSet());

        // Permisos efectivos = unión de los permisos de todos los roles (multi-rol agregado).
        Set<String> permissions = rolesEntity.stream()
                .flatMap(r -> r.getPermisos() != null ? r.getPermisos().stream() : java.util.stream.Stream.empty())
                .map(PermisoJpaEntity::getCodigo)
                .collect(Collectors.toSet());

        String nombreCompleto = composeNombre(entity);

        return Usuario.builder()
                .id(entity.getId())
                .email(entity.getEmail())
                .passwordHash(entity.getPasswordHash())
                .nombre(nombreCompleto)
                .roles(roles)
                .permissions(permissions)
                .license(license)
                .activo(Boolean.TRUE.equals(entity.getActivo()))
                .tokenVersion(entity.getTokenVersion() != null ? entity.getTokenVersion() : 1)
                .build();
    }

    private String composeNombre(UsuarioJpaEntity entity) {
        StringBuilder sb = new StringBuilder();
        if (entity.getNombre() != null && !entity.getNombre().isBlank()) {
            sb.append(entity.getNombre().trim());
        }
        if (entity.getApellidos() != null && !entity.getApellidos().isBlank()) {
            if (sb.length() > 0) {
                sb.append(' ');
            }
            sb.append(entity.getApellidos().trim());
        }
        return sb.toString().trim();
    }
}
