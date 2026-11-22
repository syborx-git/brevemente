package com.syborx.brevemente.leva.infrastructure.adapters.out.persistence.adapter;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.syborx.brevemente.leva.application.ports.out.ClinicalCaseCandidatePort;
import com.syborx.brevemente.leva.domain.model.CaseCandidate;
import com.syborx.brevemente.leva.domain.model.CaseClinicalSnapshot;
import com.syborx.brevemente.leva.domain.model.StructuredProposalData;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Lectura SQL de solo lectura sobre expedientes, sesiones y propuestas selladas.
 * Se mantiene desacoplada del módulo de expedientes (sin compartir sus entidades JPA).
 */
@Slf4j
@Component
public class ClinicalCaseCandidateJdbcAdapter implements ClinicalCaseCandidatePort {

    private final NamedParameterJdbcTemplate jdbc;
    private final ObjectMapper lenientMapper;

    public ClinicalCaseCandidateJdbcAdapter(NamedParameterJdbcTemplate jdbc, ObjectMapper objectMapper) {
        this.jdbc = jdbc;
        this.lenientMapper = objectMapper.copy().configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    }

    @Override
    public List<CaseCandidate> search(String query, String estatus, int limit) {
        StringBuilder sql = new StringBuilder("""
                SELECT e.id, e.folio, e.estatus_expediente, e.spr_inicial, e.diagnostico_operativo,
                       e.trastorno_estrategico,
                       CAST(COALESCE(e.fecha_apertura, e.fecha_inicio) AS TEXT) AS fecha,
                       (SELECT COUNT(*) FROM sesiones s WHERE s.expediente_id = e.id) AS num_sesiones,
                       (SELECT COUNT(*) FROM leva_clinical_proposals p
                         WHERE p.paciente_id = e.paciente_id AND p.human_review_status = 'APPROVED') AS aprobadas,
                       EXISTS (SELECT 1 FROM leva_case_sources cs
                                WHERE cs.expediente_id = e.id AND cs.status = 'ACTIVE') AS ya_fuente
                  FROM expedientes_clinicos e
                 WHERE 1 = 1
                """);
        MapSqlParameterSource params = new MapSqlParameterSource("limit", limit);

        if (query != null) {
            sql.append("""
                       AND (LOWER(COALESCE(e.folio, '')) LIKE :q
                         OR LOWER(COALESCE(e.diagnostico_operativo, '')) LIKE :q
                         OR LOWER(COALESCE(e.trastorno_estrategico, '')) LIKE :q
                         OR LOWER(COALESCE(e.spr_inicial, '')) LIKE :q
                         OR LOWER(COALESCE(e.dx_nosologico, '')) LIKE :q)
                    """);
            params.addValue("q", "%" + query.toLowerCase() + "%");
        }
        if (estatus != null) {
            sql.append(" AND e.estatus_expediente = :estatus\n");
            params.addValue("estatus", estatus);
        }
        sql.append(" ORDER BY COALESCE(e.fecha_apertura, e.fecha_inicio) DESC NULLS LAST, e.folio DESC LIMIT :limit");

        return jdbc.query(sql.toString(), params, (rs, i) -> CaseCandidate.builder()
                .expedienteId(rs.getString("id"))
                .folio(rs.getString("folio"))
                .estatus(rs.getString("estatus_expediente"))
                .spr(rs.getString("spr_inicial"))
                .diagnosticoOperativo(rs.getString("diagnostico_operativo"))
                .trastornoEstrategico(rs.getString("trastorno_estrategico"))
                .fechaApertura(rs.getString("fecha"))
                .numSesiones(rs.getInt("num_sesiones"))
                .propuestasAprobadas(rs.getInt("aprobadas"))
                .yaEsFuente(rs.getBoolean("ya_fuente"))
                .build());
    }

    @Override
    public Optional<CaseClinicalSnapshot> loadSnapshot(String expedienteId) {
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT e.id, e.folio, e.estatus_expediente, e.spr_inicial, e.diagnostico_operativo,
                       e.trastorno_estrategico, e.intentos_solucion, e.paciente_id,
                       p.nombre, p.apellidos, p.edad_calculada, p.persona_de_apoyo_nombre
                  FROM expedientes_clinicos e
                  JOIN pacientes p ON p.id = e.paciente_id
                 WHERE e.id = :id
                """, new MapSqlParameterSource("id", expedienteId));
        if (rows.isEmpty()) {
            return Optional.empty();
        }
        Map<String, Object> r = rows.get(0);
        String pacienteId = (String) r.get("paciente_id");

        List<String> identificadores = new ArrayList<>();
        addIfPresent(identificadores, r.get("nombre"));
        addIfPresent(identificadores, r.get("apellidos"));
        addIfPresent(identificadores, r.get("persona_de_apoyo_nombre"));

        List<String> pxTexts = jdbc.queryForList(
                "SELECT CAST(px AS TEXT) FROM sesiones WHERE expediente_id = :id ORDER BY numero",
                new MapSqlParameterSource("id", expedienteId), String.class);
        List<String> prescripciones = new ArrayList<>();
        for (String px : pxTexts) {
            prescripciones.addAll(parseStringList(px));
        }

        int numSesiones = jdbc.queryForObject("SELECT COUNT(*) FROM sesiones WHERE expediente_id = :id",
                new MapSqlParameterSource("id", expedienteId), Integer.class);

        List<String> approvedJson = jdbc.queryForList("""
                SELECT CAST(approved_data AS TEXT) FROM leva_clinical_proposals
                 WHERE paciente_id = :pid AND human_review_status = 'APPROVED' AND approved_data IS NOT NULL
                 ORDER BY created_at
                """, new MapSqlParameterSource("pid", pacienteId), String.class);
        List<StructuredProposalData> proposals = new ArrayList<>();
        for (String json : approvedJson) {
            try {
                proposals.add(lenientMapper.readValue(json, StructuredProposalData.class));
            } catch (Exception ex) {
                log.warn("[LEVA Casos] Propuesta sellada ilegible para el expediente {}: {}", expedienteId, ex.getMessage());
            }
        }

        Number edad = (Number) r.get("edad_calculada");
        return Optional.of(CaseClinicalSnapshot.builder()
                .expedienteId((String) r.get("id"))
                .folio((String) r.get("folio"))
                .estatus((String) r.get("estatus_expediente"))
                .sprInicial((String) r.get("spr_inicial"))
                .diagnosticoOperativo((String) r.get("diagnostico_operativo"))
                .trastornoEstrategico((String) r.get("trastorno_estrategico"))
                .intentosSolucion((String) r.get("intentos_solucion"))
                .edad(edad != null ? edad.intValue() : null)
                .numSesiones(numSesiones)
                .identificadores(identificadores)
                .prescripcionesSesiones(prescripciones)
                .propuestasAprobadas(proposals)
                .build());
    }

    private List<String> parseStringList(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            return lenientMapper.readValue(json, new TypeReference<List<String>>() { });
        } catch (Exception ex) {
            return List.of();
        }
    }

    private static void addIfPresent(List<String> target, Object value) {
        if (value instanceof String s && !s.isBlank()) {
            target.add(s);
        }
    }
}
