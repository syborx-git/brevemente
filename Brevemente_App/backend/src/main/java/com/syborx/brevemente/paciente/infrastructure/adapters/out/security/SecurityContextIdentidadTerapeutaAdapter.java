package com.syborx.brevemente.paciente.infrastructure.adapters.out.security;

import com.syborx.brevemente.auth.infrastructure.security.UsuarioAutenticado;
import com.syborx.brevemente.paciente.application.ports.out.IdentidadTerapeutaPort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Lee los claims del principal {@link UsuarioAutenticado} desde el
 * {@code SecurityContext}, sin consultar BD por request.
 */
@Component
public class SecurityContextIdentidadTerapeutaAdapter implements IdentidadTerapeutaPort {

    @Override
    public String sub() {
        UsuarioAutenticado principal = principal();
        return principal != null ? principal.sub() : null;
    }

    @Override
    public List<String> terapeutaIds() {
        UsuarioAutenticado principal = principal();
        return principal != null && principal.terapeutaIds() != null
                ? principal.terapeutaIds() : List.of();
    }

    @Override
    public boolean tieneRol(String rol) {
        String authority = "ROLE_" + (rol == null ? "" : rol.toUpperCase());
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            return false;
        }
        return auth.getAuthorities().stream()
                .anyMatch(g -> authority.equals(g.getAuthority()));
    }

    private UsuarioAutenticado principal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UsuarioAutenticado ua) {
            return ua;
        }
        return null;
    }
}
