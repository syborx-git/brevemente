package com.syborx.brevemente.auth.infrastructure.security;

import org.springframework.security.core.GrantedAuthority;

import java.security.Principal;
import java.util.Collection;
import java.util.List;

/**
 * Principal autenticado que expone los claims de identidad (`sub`, `terapeutaIds`,
 * `pacienteId`) junto con las autoridades. `getName()` devuelve el `sub` para no
 * romper `/me` ni `/logout`.
 */
public record UsuarioAutenticado(
        String sub,
        List<String> terapeutaIds,
        String pacienteId,
        Collection<GrantedAuthority> authorities
) implements Principal {

    @Override
    public String getName() {
        return sub;
    }
}
