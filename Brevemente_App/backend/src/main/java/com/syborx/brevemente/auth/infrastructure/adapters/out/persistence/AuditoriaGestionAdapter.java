package com.syborx.brevemente.auth.infrastructure.adapters.out.persistence;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.syborx.brevemente.auth.application.ports.out.AuditoriaGestionPort;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.UUID;

/**
 * Persistencia append-only de `auditoria_gestion` vía JDBC (sin entidad JPA,
 * para manejar el campo JSONB sin mapeo extra).
 */
@Component
@RequiredArgsConstructor
public class AuditoriaGestionAdapter implements AuditoriaGestionPort {

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    @Override
    public void registrar(String actorId, String accion, String entidad, String entidadId, Map<String, Object> detalle) {
        String json = "{}";
        try {
            json = objectMapper.writeValueAsString(detalle != null ? detalle : Map.of());
        } catch (Exception ignored) {
            // detalle no serializable: se registra vacío
        }
        jdbcTemplate.update(
                "INSERT INTO auditoria_gestion (id, actor_id, accion, entidad, entidad_id, detalle, created_at) "
                        + "VALUES (?, ?, ?, ?, ?, CAST(? AS jsonb), CURRENT_TIMESTAMP)",
                UUID.randomUUID().toString(),
                actorId,
                accion,
                entidad,
                entidadId,
                json
        );
    }
}
