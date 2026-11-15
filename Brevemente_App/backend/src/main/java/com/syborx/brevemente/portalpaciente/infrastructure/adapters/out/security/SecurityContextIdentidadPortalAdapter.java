package com.syborx.brevemente.portalpaciente.infrastructure.adapters.out.security;

import com.syborx.brevemente.auth.infrastructure.security.UsuarioAutenticado;
import com.syborx.brevemente.portalpaciente.application.ports.out.IdentidadPortalPort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Lee el claim {@code pacienteId} del principal {@link UsuarioAutenticado}
 * sin consultar BD por request.
 */
@Component
public class SecurityContextIdentidadPortalAdapter implements IdentidadPortalPort {

    @Override
    public String pacienteId() {
        UsuarioAutenticado principal = principal();
        return principal != null ? principal.pacienteId() : null;
    }

    @Override
    public boolean tieneRol(String rol) {
        String authority = "ROLE_" + (rol == null ? "" : rol.toUpperCase());
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            return false;
        }
        return auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(authority::equals);
    }

    private UsuarioAutenticado principal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UsuarioAutenticado ua) {
            return ua;
        }
        return null;
    }
}
