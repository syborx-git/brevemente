package com.syborx.brevemente.plataforma.infrastructure.adapters.out.persistence;

import com.syborx.brevemente.plataforma.application.ports.out.PlataformaDashboardRepositoryPort;
import com.syborx.brevemente.plataforma.infrastructure.adapters.in.rest.dto.AccesoRecienteDTO;
import com.syborx.brevemente.plataforma.infrastructure.adapters.in.rest.dto.UsuarioRecienteDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class PlataformaDashboardPersistenceAdapter implements PlataformaDashboardRepositoryPort {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public int contarTerapeutasActivos() {
        Integer n = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM terapeutas WHERE activo = TRUE", Integer.class);
        return n != null ? n : 0;
    }

    @Override
    public int contarPacientesActivos() {
        Integer n = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM pacientes WHERE status = 'activo'", Integer.class);
        return n != null ? n : 0;
    }

    @Override
    public List<AccesoRecienteDTO> findAccesosRecientes(int limit) {
        String sql = "SELECT a.id AS id, "
                + "COALESCE(u.nombre || ' ' || u.apellidos, 'Intento fallido') AS usuario, "
                + "a.created_at AS fecha "
                + "FROM auditoria_accesos a "
                + "LEFT JOIN usuarios u ON u.id = a.usuario_id "
                + "ORDER BY a.created_at DESC LIMIT ?";
        return jdbcTemplate.query(sql, (rs, i) -> new AccesoRecienteDTO(
                rs.getString("id"),
                rs.getString("usuario"),
                rs.getObject("fecha", OffsetDateTime.class).toInstant()), limit);
    }

    @Override
    public List<UsuarioRecienteDTO> findUsuariosRecientes(int limit) {
        String sql = "SELECT u.id AS id, "
                + "u.nombre || ' ' || u.apellidos AS nombre, "
                + "COALESCE((SELECT r.codigo FROM usuario_roles ur JOIN roles r ON r.id = ur.rol_id "
                + "  WHERE ur.usuario_id = u.id LIMIT 1), '') AS rol, "
                + "u.created_at AS creadoEn "
                + "FROM usuarios u "
                + "ORDER BY u.created_at DESC LIMIT ?";
        return jdbcTemplate.query(sql, (rs, i) -> new UsuarioRecienteDTO(
                rs.getString("id"),
                rs.getString("nombre"),
                rs.getString("rol"),
                rs.getObject("creadoEn", OffsetDateTime.class).toInstant()), limit);
    }
}
