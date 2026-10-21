package com.syborx.brevemente.auth.infrastructure.security;

import com.syborx.brevemente.auth.domain.model.Usuario;
import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        String testSecret = "una-clave-secreta-de-prueba-muy-larga-con-al-menos-256-bits-para-hmac-sha-2026";
        jwtService = new JwtService(testSecret, 15);
    }

    @Test
    @DisplayName("Genera y valida un token JWT con roles, permisos y tokenVersion")
    void generaYValidaToken() {
        Usuario usuario = Usuario.builder()
                .id("usr-123")
                .nombre("Dra. Sofia Ramirez")
                .email("sofia@brevemente.org")
                .roles(Set.of("therapist", "supervisor"))
                .permissions(Set.of("PACIENTES_LEER", "PACIENTES_CREAR", "EXPEDIENTE_FIRMAR"))
                .tokenVersion(2)
                .activo(true)
                .build();

        String token = jwtService.generarToken(usuario);
        assertNotNull(token);

        Claims claims = jwtService.validarToken(token);
        assertEquals("usr-123", claims.getSubject());
        assertEquals(2, claims.get("tokenVersion", Integer.class));

        List<?> roles = claims.get("roles", List.class);
        assertNotNull(roles);
        assertTrue(roles.contains("therapist"));
        assertTrue(roles.contains("supervisor"));

        List<?> perms = claims.get("permissions", List.class);
        assertNotNull(perms);
        assertTrue(perms.contains("PACIENTES_LEER"));
        assertTrue(perms.contains("EXPEDIENTE_FIRMAR"));
    }
}
