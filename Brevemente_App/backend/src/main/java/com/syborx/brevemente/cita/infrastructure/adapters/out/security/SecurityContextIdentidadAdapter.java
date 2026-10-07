package com.syborx.brevemente.cita.infrastructure.adapters.out.security;

import com.syborx.brevemente.auth.infrastructure.security.UsuarioAutenticado;
import com.syborx.brevemente.cita.application.ports.out.IdentidadAutenticadaPort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Lee los claims `terapeutaIds`/`pacienteId` expuestos en el principal
 * `UsuarioAutenticado`, sin consultar BD por request.
 */
@Component
public class SecurityContextIdentidadAdapter implements IdentidadAutenticadaPort {

    @Override
    public List<String> terapeutaIds() {
        UsuarioAutenticado principal = principal();
        return principal != null && principal.terapeutaIds() != null
                ? principal.terapeutaIds() : List.of();
    }

    @Override
    public String pacienteId() {
        UsuarioAutenticado principal = principal();
        return principal != null ? principal.pacienteId() : null;
    }

    @Override
    public boolean esAdminPlataforma() {
        return tieneAutoridad("ROLE_ADMIN_PLATFORM");
    }

    @Override
    public boolean puedeVerAgendaCompleta() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            return false;
        }
        return auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(a -> a.equals("AGENDA_LEER")
                        || a.equals("AGENDA_GESTIONAR")
                        || a.equals("ROLE_ADMIN_PLATFORM"));
    }

    private boolean tieneAutoridad(String authority) {
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
