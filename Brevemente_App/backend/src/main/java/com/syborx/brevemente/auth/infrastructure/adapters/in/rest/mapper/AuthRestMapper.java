package com.syborx.brevemente.auth.infrastructure.adapters.in.rest.mapper;

import com.syborx.brevemente.auth.domain.model.Usuario;
import com.syborx.brevemente.auth.infrastructure.adapters.in.rest.dto.UserResponseDTO;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class AuthRestMapper {

    public UserResponseDTO toUserResponse(Usuario usuario) {
        if (usuario == null) {
            return null;
        }
        List<String> roles = usuario.getRoles() != null
                ? usuario.getRoles().stream().sorted().toList()
                : List.of();
        return new UserResponseDTO(
                usuario.getId(),
                usuario.getNombre(),
                roles,
                usuario.getEmail(),
                usuario.getLicense()
        );
    }
}
