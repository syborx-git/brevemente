package com.syborx.brevemente.auth.infrastructure.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.syborx.brevemente.auth.application.ports.out.AutenticacionRepositoryPort;
import com.syborx.brevemente.auth.domain.model.EstadoSesion;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;
import java.util.Set;

/**
 * Enforcement server-side de la regla "debe cambiar contraseña": si el usuario
 * autenticado tiene el flag activo, solo puede acceder a las rutas de cambio,
 * /auth/me, /auth/logout y /auth/refresh. El flag se lee desde BD (no del JWT).
 */
@Component
@RequiredArgsConstructor
public class CredencialPendienteFilter extends OncePerRequestFilter {

    private static final Set<String> RUTAS_PERMITIDAS = Set.of(
            "/auth/cambiar-password",
            "/auth/me",
            "/auth/logout",
            "/auth/refresh"
    );

    private final AutenticacionRepositoryPort autenticacionRepositoryPort;
    private final ObjectMapper objectMapper;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        if (HttpMethod.OPTIONS.matches(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            filterChain.doFilter(request, response);
            return;
        }

        String usuarioId = authentication.getName();
        Optional<EstadoSesion> estado = autenticacionRepositoryPort.findEstadoSesion(usuarioId);
        if (estado.isPresent() && estado.get().debeCambiarPassword()) {
            String path = request.getRequestURI().substring(request.getContextPath().length());
            if (!RUTAS_PERMITIDAS.contains(path)) {
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
                ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                        HttpStatus.FORBIDDEN,
                        "Debes cambiar tu contraseña antes de continuar");
                problem.setTitle("Cambio de contraseña requerido");
                problem.setProperty("code", "DEBE_CAMBIAR_PASSWORD");
                objectMapper.writeValue(response.getWriter(), problem);
                return;
            }
        }

        filterChain.doFilter(request, response);
    }
}
