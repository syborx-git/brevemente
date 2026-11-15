package com.syborx.brevemente.paciente.infrastructure.adapters.out.persistence;

import com.syborx.brevemente.paciente.application.ports.out.IdentidadPacientePort;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class IdentidadPacientePersistenceAdapter implements IdentidadPacientePort {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public boolean existeEmail(String email) {
        if (email == null || email.isBlank()) {
            return false;
        }
        Integer n = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM usuarios WHERE LOWER(email) = LOWER(?)", Integer.class, email.trim());
        return n != null && n > 0;
    }

    @Override
    public String crearIdentidad(String email, String nombre, String apellidos) {
        String id = UUID.randomUUID().toString();
        jdbcTemplate.update("""
                INSERT INTO usuarios (id, email, password_hash, nombre, apellidos, activo, estado, token_version, created_at, updated_at)
                VALUES (?, ?, '{pendiente}', ?, ?, TRUE, 'activo', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """, id, email.trim().toLowerCase(), nombre, apellidos);
        jdbcTemplate.update("""
                INSERT INTO usuario_roles (usuario_id, rol_id)
                SELECT ?, id FROM roles WHERE codigo = 'patient'
                ON CONFLICT (usuario_id, rol_id) DO NOTHING
                """, id);
        return id;
    }
}
