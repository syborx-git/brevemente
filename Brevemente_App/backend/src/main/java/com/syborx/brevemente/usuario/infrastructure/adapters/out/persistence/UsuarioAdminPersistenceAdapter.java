package com.syborx.brevemente.usuario.infrastructure.adapters.out.persistence;

import com.syborx.brevemente.usuario.application.ports.out.UsuarioAdminRepositoryPort;
import com.syborx.brevemente.usuario.infrastructure.adapters.in.rest.dto.UsuarioAdminDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class UsuarioAdminPersistenceAdapter implements UsuarioAdminRepositoryPort {

    private final JdbcTemplate jdbcTemplate;

    private static final String SELECT_COLUMNAS = """
            SELECT u.id, u.nombre, u.apellidos, u.email, u.estado, u.last_login_at, u.created_at,
                   (SELECT string_agg(r.codigo, ',' ORDER BY r.codigo)
                      FROM usuario_roles ur JOIN roles r ON r.id = ur.rol_id
                     WHERE ur.usuario_id = u.id) AS roles,
                   (SELECT t.cedula_profesional FROM terapeutas t WHERE t.usuario_id = u.id LIMIT 1) AS cedula,
                   (SELECT t.especialidad FROM terapeutas t WHERE t.usuario_id = u.id LIMIT 1) AS especialidad,
                   (SELECT string_agg(at.terapeuta_id, ',' ORDER BY at.terapeuta_id)
                      FROM asignaciones_terapeuta at WHERE at.usuario_id = u.id) AS terapeuta_ids
            FROM usuarios u
            """;

    private static final RowMapper<UsuarioAdminDTO> MAPPER = (rs, i) -> {
        OffsetDateTime ultimo = rs.getObject("last_login_at", OffsetDateTime.class);
        OffsetDateTime creado = rs.getObject("created_at", OffsetDateTime.class);
        return new UsuarioAdminDTO(
                rs.getString("id"),
                rs.getString("nombre"),
                rs.getString("apellidos"),
                rs.getString("email"),
                split(rs.getString("roles")),
                rs.getString("estado"),
                rs.getString("cedula"),
                rs.getString("especialidad"),
                split(rs.getString("terapeuta_ids")),
                ultimo != null ? ultimo.toInstant() : null,
                creado != null ? creado.toInstant() : null);
    };

    @Override
    public List<UsuarioAdminDTO> listar(String q, String rol, String estado, int offset, int limit) {
        Where where = buildWhere(q, rol, estado);
        List<Object> params = new ArrayList<>(where.params());
        params.add(limit);
        params.add(offset);
        String sql = SELECT_COLUMNAS + " WHERE 1=1" + where.clausula()
                + " ORDER BY u.created_at DESC LIMIT ? OFFSET ?";
        return jdbcTemplate.query(sql, MAPPER, params.toArray());
    }

    @Override
    public long contar(String q, String rol, String estado) {
        Where where = buildWhere(q, rol, estado);
        String sql = "SELECT COUNT(*) FROM usuarios u WHERE 1=1" + where.clausula();
        Long n = jdbcTemplate.queryForObject(sql, Long.class, where.params().toArray());
        return n != null ? n : 0;
    }

    @Override
    public Optional<UsuarioAdminDTO> findById(String id) {
        String sql = SELECT_COLUMNAS + " WHERE u.id = ?";
        List<UsuarioAdminDTO> result = jdbcTemplate.query(sql, MAPPER, id);
        return result.stream().findFirst();
    }

    @Override
    public boolean existeEmail(String email, String excluirId) {
        if (excluirId == null) {
            Integer n = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM usuarios WHERE LOWER(email) = LOWER(?)", Integer.class, email);
            return n != null && n > 0;
        }
        Integer n = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM usuarios WHERE LOWER(email) = LOWER(?) AND id <> ?",
                Integer.class, email, excluirId);
        return n != null && n > 0;
    }

    @Override
    public boolean existeCedula(String cedula) {
        if (cedula == null || cedula.isBlank()) {
            return false;
        }
        Integer n = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM terapeutas WHERE cedula_profesional = ?", Integer.class, cedula);
        return n != null && n > 0;
    }

    @Override
    public void insertarUsuario(String id, String nombre, String apellidos, String email, String estado,
                                boolean activo, String passwordHash, List<String> roles,
                                String cedulaProfesional, String especialidad) {
        jdbcTemplate.update("""
                INSERT INTO usuarios (id, email, password_hash, nombre, apellidos, activo, estado, token_version, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """, id, email, passwordHash, nombre, apellidos, activo, estado);

        for (String rol : roles) {
            jdbcTemplate.update("""
                    INSERT INTO usuario_roles (usuario_id, rol_id)
                    SELECT ?, id FROM roles WHERE codigo = ?
                    ON CONFLICT (usuario_id, rol_id) DO NOTHING
                    """, id, rol);
        }

        if (roles.contains("therapist")) {
            jdbcTemplate.update("""
                    INSERT INTO terapeutas (id, cedula_profesional, especialidad, activo, usuario_id, created_at, updated_at)
                    VALUES (?, ?, ?, TRUE, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    """, UUID.randomUUID().toString(), cedulaProfesional,
                    especialidad != null && !especialidad.isBlank() ? especialidad : "Terapia Breve Estratégica", id);
        }
    }

    @Override
    public void actualizarUsuario(String id, String nombre, String apellidos, String email,
                                  List<String> roles, String cedulaProfesional, String especialidad) {
        jdbcTemplate.update("UPDATE usuarios SET nombre = ?, apellidos = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                nombre, apellidos, email, id);

        jdbcTemplate.update("DELETE FROM usuario_roles WHERE usuario_id = ?", id);
        for (String rol : roles) {
            jdbcTemplate.update("""
                    INSERT INTO usuario_roles (usuario_id, rol_id)
                    SELECT ?, id FROM roles WHERE codigo = ?
                    ON CONFLICT (usuario_id, rol_id) DO NOTHING
                    """, id, rol);
        }

        if (roles.contains("therapist")) {
            int updated = jdbcTemplate.update("""
                    UPDATE terapeutas SET cedula_profesional = ?, especialidad = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE usuario_id = ?
                    """, cedulaProfesional,
                    especialidad != null && !especialidad.isBlank() ? especialidad : "Terapia Breve Estratégica", id);
            if (updated == 0) {
                jdbcTemplate.update("""
                        INSERT INTO terapeutas (id, cedula_profesional, especialidad, activo, usuario_id, created_at, updated_at)
                        VALUES (?, ?, ?, TRUE, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                        """, UUID.randomUUID().toString(), cedulaProfesional,
                        especialidad != null && !especialidad.isBlank() ? especialidad : "Terapia Breve Estratégica", id);
            }
        }
    }

    @Override
    public void actualizarEstado(String id, String estado, boolean activo) {
        jdbcTemplate.update("UPDATE usuarios SET estado = ?, activo = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                estado, activo, id);
    }

    @Override
    public void sincronizarTerapeutaActivo(String usuarioId, boolean activo) {
        jdbcTemplate.update("UPDATE terapeutas SET activo = ?, updated_at = CURRENT_TIMESTAMP WHERE usuario_id = ?",
                activo, usuarioId);
    }

    @Override
    public void reemplazarAsignaciones(String usuarioId, List<String> terapeutaIds) {
        jdbcTemplate.update("DELETE FROM asignaciones_terapeuta WHERE usuario_id = ?", usuarioId);
        for (String terapeutaId : terapeutaIds) {
            jdbcTemplate.update("""
                    INSERT INTO asignaciones_terapeuta (usuario_id, terapeuta_id) VALUES (?, ?)
                    ON CONFLICT (usuario_id, terapeuta_id) DO NOTHING
                    """, usuarioId, terapeutaId);
        }
    }

    @Override
    public long contarAdminsActivos() {
        Long n = jdbcTemplate.queryForObject("""
                SELECT COUNT(*) FROM usuarios u
                WHERE u.estado = 'activo'
                  AND EXISTS (SELECT 1 FROM usuario_roles ur JOIN roles r ON r.id = ur.rol_id
                              WHERE ur.usuario_id = u.id AND r.codigo = 'admin_platform')
                """, Long.class);
        return n != null ? n : 0;
    }

    private record Where(String clausula, List<Object> params) {
    }

    private Where buildWhere(String q, String rol, String estado) {
        StringBuilder sb = new StringBuilder();
        List<Object> params = new ArrayList<>();
        if (q != null && !q.isBlank()) {
            sb.append(" AND LOWER(u.nombre || ' ' || u.apellidos || ' ' || u.email) LIKE LOWER(?)");
            params.add("%" + q.trim() + "%");
        }
        if (rol != null && !rol.isBlank() && !"todos".equals(rol)) {
            sb.append(" AND EXISTS (SELECT 1 FROM usuario_roles ur JOIN roles r ON r.id = ur.rol_id "
                    + "WHERE ur.usuario_id = u.id AND r.codigo = ?)");
            params.add(rol);
        }
        if (estado != null && !estado.isBlank() && !"todos".equals(estado)) {
            sb.append(" AND u.estado = ?");
            params.add(estado);
        }
        return new Where(sb.toString(), params);
    }

    private static List<String> split(String csv) {
        if (csv == null || csv.isBlank()) {
            return List.of();
        }
        return Arrays.stream(csv.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList();
    }
}
