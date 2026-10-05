package com.syborx.brevemente.auth.infrastructure.security;

import com.syborx.brevemente.auth.application.ports.out.AutenticacionRepositoryPort;
import com.syborx.brevemente.auth.domain.model.EstadoSesion;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final AutenticacionRepositoryPort autenticacionRepositoryPort;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);

        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            try {
                Claims claims = jwtService.validarToken(token);
                String userId = claims.getSubject();
                Integer tokenVersion = claims.get("tokenVersion", Integer.class);

                // 1. Verificación de revocación inmediata por token_version e inactividad
                Optional<EstadoSesion> estadoOpt = autenticacionRepositoryPort.findEstadoSesion(userId);
                if (estadoOpt.isEmpty() || !estadoOpt.get().activo()) {
                    SecurityContextHolder.clearContext();
                    filterChain.doFilter(request, response);
                    return;
                }

                EstadoSesion estado = estadoOpt.get();
                int versionVigente = estado.tokenVersion();
                int versionToken = tokenVersion != null ? tokenVersion : 1;
                if (versionToken != versionVigente) {
                    // Token revocado (se cerró sesión o se invalidaron credenciales)
                    SecurityContextHolder.clearContext();
                    filterChain.doFilter(request, response);
                    return;
                }

                // 2. Mapeo de GrantedAuthorities (Roles como ROLE_<ROL> y Permisos granulares directos)
                List<SimpleGrantedAuthority> authorities = new ArrayList<>();

                List<?> rawRoles = claims.get("roles", List.class);
                if (rawRoles != null) {
                    for (Object r : rawRoles) {
                        if (r != null) {
                            authorities.add(new SimpleGrantedAuthority("ROLE_" + r.toString().toUpperCase()));
                        }
                    }
                }

                List<?> rawPermissions = claims.get("permissions", List.class);
                if (rawPermissions != null) {
                    for (Object p : rawPermissions) {
                        if (p != null) {
                            authorities.add(new SimpleGrantedAuthority(p.toString().toUpperCase()));
                        }
                    }
                }

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(userId, null, authorities);
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } catch (Exception ex) {
                // Token inválido/expirado: se deja el contexto vacío; el 401 lo emite AuthenticationEntryPoint
                SecurityContextHolder.clearContext();
            }
        }

        filterChain.doFilter(request, response);
    }
}
